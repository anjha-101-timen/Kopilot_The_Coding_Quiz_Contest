import { db, api, COL } from "../shared/firebase.js";
import { setPillStatus, toast } from "../shared/ui.js";
import { renderPlayer } from "../shared/questions.js";
import { getDeviceId, attemptDocId, nextAttemptNo as nextAttemptNoShared, enqueueAttemptAndSync } from "../shared/attempts.js";

const el = (id) => document.getElementById(id);

const state = {
  examId: "",
  exam: null,
  questions: [],
  idx: 0,
  // per-question timing
  activeStartMs: 0,
  timerTick: null,
  // session persistence
  sessionSaveTick: null,
  lastSavedMs: 0,
  lastLoadedMs: 0,
  // responses + flags
  visited: new Set(),
  review: new Set(),
  // qid -> response payload
  responses: new Map(),
  // qid -> timeSpentMs (accumulated)
  timeSpent: new Map()
};

function sessionDocId(examId, deviceId) {
  return `${String(deviceId)}__${String(examId)}`;
}

function sessionCacheKey(examId, deviceId) {
  return `cqcp_session_${String(examId || "")}__${String(deviceId || "")}`;
}

function serializeMap(m) {
  const out = {};
  for (const [k, v] of m.entries()) out[String(k)] = v;
  return out;
}

function serializeNumMap(m) {
  const out = {};
  for (const [k, v] of m.entries()) out[String(k)] = Number(v || 0);
  return out;
}

function loadSessionLocal(examId, deviceId) {
  try {
    const raw = localStorage.getItem(sessionCacheKey(examId, deviceId));
    const s = raw ? JSON.parse(raw) : null;
    if (!s || typeof s !== "object") return null;
    return s;
  } catch {
    return null;
  }
}

function saveSessionLocal(examId, deviceId, doc) {
  try {
    localStorage.setItem(sessionCacheKey(examId, deviceId), JSON.stringify(doc || null));
  } catch {
    // ignore
  }
}

async function loadSessionFirestore(examId, deviceId) {
  const ref = api.doc(db, COL.SESSIONS, sessionDocId(examId, deviceId));
  const snap = await api.getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

async function saveSessionFirestore(examId, deviceId, doc) {
  const ref = api.doc(db, COL.SESSIONS, sessionDocId(examId, deviceId));
  await api.setDoc(ref, doc, { merge: true });
}

function buildSessionDoc() {
  const deviceId = getDeviceId();
  return {
    examId: state.examId,
    deviceId,
    updatedMs: Date.now(),
    updatedAt: api.serverTimestamp(),
    idx: Number(state.idx || 0),
    visited: Array.from(state.visited),
    review: Array.from(state.review),
    responses: serializeMap(state.responses),
    timeSpent: serializeNumMap(state.timeSpent)
  };
}

function hydrateFromSessionDoc(doc) {
  if (!doc || typeof doc !== "object") return;

  state.idx = Math.max(0, Math.min(state.questions.length - 1, Number(doc.idx || 0)));

  state.visited = new Set(Array.isArray(doc.visited) ? doc.visited.map(String) : []);
  state.review = new Set(Array.isArray(doc.review) ? doc.review.map(String) : []);

  state.responses = new Map();
  if (doc.responses && typeof doc.responses === "object") {
    for (const [qid, r] of Object.entries(doc.responses)) {
      if (!r || typeof r !== "object") continue;
      state.responses.set(String(qid), { kind: String(r.kind || ""), value: r.value });
    }
  }

  state.timeSpent = new Map();
  if (doc.timeSpent && typeof doc.timeSpent === "object") {
    for (const [qid, ms] of Object.entries(doc.timeSpent)) {
      state.timeSpent.set(String(qid), Math.max(0, Number(ms || 0)));
    }
  }

  state.lastLoadedMs = Math.max(state.lastLoadedMs, Number(doc.updatedMs || 0));
}

function scheduleSessionSave(reason = "") {
  if (state.sessionSaveTick) clearTimeout(state.sessionSaveTick);
  state.sessionSaveTick = setTimeout(async () => {
    try {
      const deviceId = getDeviceId();
      const doc = buildSessionDoc();

      state.lastSavedMs = Math.max(state.lastSavedMs, Number(doc.updatedMs || 0));
      saveSessionLocal(state.examId, deviceId, doc);

      await saveSessionFirestore(state.examId, deviceId, doc);
      setPillStatus("Synced", true);
    } catch {
      setPillStatus("Offline", false);
    }
  }, 850);
}

function qLimitMs(q) {
  return Math.max(10, Math.min(600, Number(q?.timeLimitSec || 45))) * 1000;
}

function timeRemainingMs(qid) {
  const q = state.questions.find((x) => String(x.id) === String(qid)) || null;
  if (!q) return 0;
  const spent = getTimeSpent(q.id);
  return Math.max(0, qLimitMs(q) - spent);
}

function setQuestionLocked(root, locked) {
  if (!root) return;
  const nodes = Array.from(root.querySelectorAll("input, textarea, select, button"));
  for (const n of nodes) n.disabled = !!locked;
}

function onTimedOut() {
  const q = currentQ();
  if (!q) return;

  // Prevent repeated firing when remaining time is already 0.
  if (timeRemainingMs(q.id) > 0) return;

  setTimerRunning(false);

  if (state.timerTick) {
    clearInterval(state.timerTick);
    state.timerTick = null;
  }

  saveResponse();
  scheduleSessionSave("timeout");

  const root = el("qHost");
  setQuestionLocked(root, true);

  toast("Time up for this question.", "warn", 1600);

  if (state.idx < state.questions.length - 1) {
    setTimeout(() => next(), 350);
  }
}

function normalizeCorrectIndices(v) {
  return (Array.isArray(v) ? v : []).map((x) => Number(x)).filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
}

function normalizePickedArray(v) {
  return (Array.isArray(v) ? v : []).map((x) => Number(x)).filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
}

function gradeQuestion(q, r) {
  if (!r) return { status: "skipped", isCorrect: false };

  if (q.type === "mcq" || q.type === "scq" || q.type === "ar") {
    const ok = Number(r.value) === Number(q.correctIndex);
    return { status: ok ? "correct" : "incorrect", isCorrect: ok };
  }

  if (q.type === "msq") {
    const picked = normalizePickedArray(r.value);
    const correct = normalizeCorrectIndices(q.correctIndices);
    const ok = picked.length === correct.length && picked.every((x, i) => x === correct[i]);
    return { status: ok ? "correct" : "incorrect", isCorrect: ok };
  }

  if (q.type === "tf") {
    const ok = !!r.value === !!q.correctBool;
    return { status: ok ? "correct" : "incorrect", isCorrect: ok };
  }

  if (q.type === "fib" || q.type === "one") {
    const v = String(r.value || "").trim().toLowerCase();
    if (!v) return { status: "skipped", isCorrect: false };
    const accepted = new Set((Array.isArray(q.acceptedAnswers) ? q.acceptedAnswers : []).map((x) => String(x).trim().toLowerCase()));
    accepted.add(String(q.correctText || "").trim().toLowerCase());
    const ok = accepted.has(v);
    return { status: ok ? "correct" : "incorrect", isCorrect: ok };
  }

  if (q.type === "nat") {
    const raw = String(r.value || "").trim();
    if (!raw) return { status: "skipped", isCorrect: false };
    const v = Number(raw);
    if (!Number.isFinite(v)) return { status: "incorrect", isCorrect: false };
    const target = Number(q.correctNumber);
    const tol = Math.max(0, Number(q.tolerance || 0));
    const ok = Math.abs(v - target) <= tol;
    return { status: ok ? "correct" : "incorrect", isCorrect: ok };
  }

  if (q.type === "match") {
    const picked = normalizePickedArray(r.value);
    const pairs = normalizeCorrectIndices(q.matchPairs);
    const ok = picked.length === pairs.length && picked.every((x, i) => x === pairs[i]);
    return { status: ok ? "correct" : "incorrect", isCorrect: ok };
  }

  return { status: "skipped", isCorrect: false };
}

function computeAttempt() {
  const positive = Number(state.exam?.positiveMarks ?? 2);
  const negative = Number(state.exam?.negativeMarks ?? 0);

  let correct = 0;
  let incorrect = 0;
  let skipped = 0;
  let timeTakenMs = 0;

  const items = state.questions.map((q, i) => {
    const r = state.responses.get(q.id) || null;
    const t = Number(state.timeSpent.get(q.id) || 0);
    timeTakenMs += t;
    const g = gradeQuestion(q, r);
    if (g.status === "correct") correct++;
    else if (g.status === "incorrect") incorrect++;
    else skipped++;

    return {
      i,
      qid: q.id,
      type: q.type || "",
      status: g.status,
      review: state.review.has(q.id),
      visited: state.visited.has(q.id),
      timeMs: t,
      response: r
        ? {
            kind: String(r.kind || ""),
            value: r.value
          }
        : null
    };
  });

  const total = state.questions.length;
  const score = correct * positive - incorrect * negative;
  const maxScore = total * positive;
  const accuracy = correct + incorrect > 0 ? (correct / (correct + incorrect)) * 100 : 0;
  const completedPct = total > 0 ? ((correct + incorrect) / total) * 100 : 0;

  return {
    deviceId: getDeviceId(),
    examId: state.examId,
    examCode: String(state.exam?.examCode || ""),
    createdMs: Date.now(),
    attemptNo: 0,
    cpEarned: computeCpEarned({
      summary: {
        correct,
        total,
        completedPct,
        accuracy
      }
    }),
    summary: {
      score: Number(score.toFixed(2)),
      maxScore: Number(maxScore.toFixed(2)),
      total,
      correct,
      incorrect,
      skipped,
      positive,
      negative,
      accuracy: Number(accuracy.toFixed(1)),
      completedPct: Number(completedPct.toFixed(1)),
      timeTakenMs: Number(timeTakenMs || 0)
    },
    items
  };
}

function computeCpEarned(attempt) {
  const s = attempt?.summary || {};
  const correct = Number(s.correct || 0);
  const total = Math.max(1, Number(s.total || 0));
  const completedPct = Number(s.completedPct || 0);
  const accuracy = Number(s.accuracy || 0);

  // CP philosophy:
  // - Every attempt gives baseline CP (to reward consistency)
  // - Better performance gives extra CP
  // - Reattempt bonus encourages repeated practice
  const base = 10;
  const perf = Math.round((correct / total) * 20) + Math.round(completedPct / 10);
  const accBonus = accuracy >= 90 ? 10 : accuracy >= 75 ? 6 : accuracy >= 50 ? 3 : 0;
  const reattemptBonus = Number(attempt?.attemptNo || 0) > 1 ? 5 : 0;
  return Math.max(0, base + perf + accBonus + reattemptBonus);
}

function computeAttemptAnswerAnalytics(attempt, questions, exam) {
  const qMap = new Map();
  for (const q of Array.isArray(questions) ? questions : []) qMap.set(String(q.id), q);

  const items = Array.isArray(attempt?.items) ? attempt.items : [];
  const base = { count: 0, correct: 0, incorrect: 0, skipped: 0, timeMs: 0 };

  const byType = new Map();
  const byDifficulty = new Map();

  const addTo = (map, key, st, timeMs) => {
    const k = String(key || "unknown");
    if (!map.has(k)) map.set(k, { ...base });
    const agg = map.get(k);
    agg.count++;
    if (st === "correct") agg.correct++;
    else if (st === "incorrect") agg.incorrect++;
    else agg.skipped++;
    agg.timeMs += Number(timeMs || 0);
  };

  for (const it of items) {
    const q = qMap.get(String(it.qid || "")) || null;
    const st = String(it.status || "skipped");
    addTo(byType, it.type || q?.type || "unknown", st, it.timeMs);
    addTo(byDifficulty, q?.difficulty || "unknown", st, it.timeMs);
  }

  const positive = Number(exam?.positiveMarks ?? attempt?.summary?.positive ?? 2);
  const negative = Number(exam?.negativeMarks ?? attempt?.summary?.negative ?? 0);

  return {
    version: 1,
    positive,
    negative,
    byType: Object.fromEntries(byType.entries()),
    byDifficulty: Object.fromEntries(byDifficulty.entries())
  };
}

async function saveAttempt(attempt) {
  const ref = api.collection(db, COL.ATTEMPTS);
  const doc = {
    examId: attempt.examId,
    deviceId: attempt.deviceId,
    examCode: String(attempt.examCode || ""),
    createdAt: api.serverTimestamp(),
    createdMs: attempt.createdMs,
    examCode: attempt.examCode,
    attemptNo: Number(attempt.attemptNo || 0),
    summary: attempt.summary,
    items: attempt.items
  };
  const res = await api.addDoc(ref, doc);
  return res.id;
}

function attemptsCacheKey(examId, deviceId) {
  return `cqcp_attempts_${String(examId || "")}__${String(deviceId || "")}`;
}

function loadAttemptsLocal(examId, deviceId) {
  try {
    const raw = localStorage.getItem(attemptsCacheKey(examId, deviceId));
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveAttemptsLocal(examId, deviceId, attempts) {
  try {
    localStorage.setItem(attemptsCacheKey(examId, deviceId), JSON.stringify(attempts || []));
  } catch {
    // ignore
  }
}

function upsertAttemptLocal(examId, deviceId, attemptDoc) {
  const xs = loadAttemptsLocal(examId, deviceId);
  const next = [attemptDoc, ...xs.filter((x) => x.id !== attemptDoc.id)].slice(0, 25);
  saveAttemptsLocal(examId, deviceId, next);
  return next;
}

function sortAttemptsDesc(xs) {
  return (xs || []).slice().sort((a, b) => (Number(b.createdMs || 0) - Number(a.createdMs || 0)));
}

async function loadAttempts(examId, deviceId, max = 12) {
  const ref = api.collection(db, COL.ATTEMPTS);
  const q = api.query(ref, api.where("examId", "==", examId), api.where("deviceId", "==", deviceId), api.orderBy("attemptNo", "asc"));
  const snap = await api.getDocs(q);
  const xs = [];
  snap.forEach((d) => xs.push({ id: d.id, ...d.data() }));
  return xs.slice(-max);
}

function esc(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fmtPct(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "0%";
  return `${n.toFixed(1)}%`;
}

function fmtSec(ms) {
  const s = Math.max(0, Math.floor(Number(ms || 0) / 1000));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function renderAttemptChart(attempts) {
  const xs = (attempts || []).slice().reverse();
  if (xs.length < 2) return "";
  const scores = xs.map((a) => Number(a.summary?.score || 0));
  const max = Math.max(...scores, 1);
  const w = 420;
  const h = 140;
  const pad = 14;
  const step = (w - pad * 2) / (xs.length - 1);
  const pts = scores
    .map((s, i) => {
      const x = pad + i * step;
      const y = pad + (h - pad * 2) * (1 - s / max);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return `
    <div class="chartWrap">
      <div class="chartTitle">Attempt Wise Comparison</div>
      <svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Attempt wise score comparison">
        <polyline points="${pts}" fill="none" stroke="rgba(245,158,11,.85)" stroke-width="3" />
        ${scores
          .map((s, i) => {
            const x = pad + i * step;
            const y = pad + (h - pad * 2) * (1 - s / max);
            return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="rgba(245,158,11,.95)" />`;
          })
          .join("")}
      </svg>
    </div>
  `;
}

function renderSubmitErrorBox(err) {
  if (!err) return "";
  const code = esc(err?.code || "");
  const msg = esc(err?.message || String(err || ""));
  return `
    <div class="result" style="margin-top:0; border-style:solid; border-color: rgba(239,68,68,.45); background: linear-gradient(135deg, rgba(239,68,68,.12), rgba(239,68,68,.06));">
      <div style="font-weight:750; letter-spacing:-.02em">Could not save to Firestore</div>
      <div class="small" style="margin-top:6px">Your result is shown below and saved locally on this device.</div>
      <div class="small" style="margin-top:8px"><span class="kbd">${code || "firestore"}</span> <span class="mono">${msg}</span></div>
    </div>
  `;
}

function bindAttemptSelect(history) {
  const sel = document.getElementById("attemptSelect");
  if (!sel) return;
  sel.addEventListener("change", () => {
    try {
      const id = String(sel.value || "");
      const chosen = history.find((x) => x.id === id);
      if (!chosen) return;
      el("submitBody").innerHTML = renderResultSummary(chosen, history);
      bindAttemptSelect(history);
    } catch {
      // ignore
    }
  });
}

function renderResultSummary(attempt, attempts) {
  const s = attempt.summary;
  return `
    <div class="resultHead">
      <div>
        <div class="small">Result Summary</div>
        <div class="scoreBox">
          <div class="scoreLabel">SCORE</div>
          <div class="scoreValue">${Number(s.score).toFixed(2)}<span class="scoreMax">/${Number(s.maxScore).toFixed(0)}</span></div>
        </div>
      </div>
      <div class="attemptPick">
        <div class="small">Attempts</div>
        <select class="select" id="attemptSelect">
          ${(attempts || [])
            .map((a, i) => {
              const label = `Attempt ${Number(a.attemptNo || i + 1)}`;
              return `<option value="${esc(a.id)}" ${a.id === attempt.id ? "selected" : ""}>${esc(label)}</option>`;
            })
            .join("")}
        </select>
      </div>
    </div>

    <div class="progressGrid">
      <div class="progCard ok">
        <div class="progTop"><div>Correct</div><div class="kbd">${s.correct}/${s.total}</div></div>
        <div class="bar"><span style="width:${(s.correct / Math.max(1, s.total)) * 100}%"></span></div>
        <div class="small">Marks Obtained <span class="mono">+${(s.correct * s.positive).toFixed(2)}</span></div>
      </div>
      <div class="progCard bad">
        <div class="progTop"><div>Incorrect</div><div class="kbd">${s.incorrect}/${s.total}</div></div>
        <div class="bar"><span style="width:${(s.incorrect / Math.max(1, s.total)) * 100}%"></span></div>
        <div class="small">Marks Lost <span class="mono">-${(s.incorrect * s.negative).toFixed(2)}</span></div>
      </div>
      <div class="progCard warn">
        <div class="progTop"><div>Skipped</div><div class="kbd">${s.skipped}/${s.total}</div></div>
        <div class="bar"><span style="width:${(s.skipped / Math.max(1, s.total)) * 100}%"></span></div>
        <div class="small">Time Taken <span class="mono">${fmtSec(s.timeTakenMs)}</span></div>
      </div>
      <div class="progCard neutral">
        <div class="progTop"><div>Accuracy</div><div class="kbd">${fmtPct(s.accuracy)}</div></div>
        <div class="bar"><span style="width:${s.accuracy}%"></span></div>
        <div class="small">Completed <span class="mono">${fmtPct(s.completedPct)}</span></div>
      </div>
    </div>

    ${renderAttemptChart(attempts)}

    <div class="detailGrid">
      <div class="small" style="margin-top:2px">Attempt Details</div>
      <div class="statusGrid">
        ${attempt.items
          .map((it) => {
            const cls = it.status === "correct" ? "sOk" : it.status === "incorrect" ? "sBad" : "sSkip";
            const label = it.status === "skipped" ? "Skipped" : it.status === "correct" ? "Correct" : "Incorrect";
            return `
              <div class="statusItem ${cls}" title="Q${it.i + 1} • ${label} • ${fmtSec(it.timeMs)}">
                <div class="statusNum">${it.i + 1}</div>
              </div>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

function parseQuery() {
  const url = new URL(window.location.href);
  return {
    exam: url.searchParams.get("exam") || ""
  };
}

function fmt(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function updateTimeUi(qid) {
  const q = state.questions.find((x) => String(x.id) === String(qid)) || null;
  if (!q) {
    console.warn("[updateTimeUi] No question for qid", qid);
    return;
  }

  const spent = getTimeSpent(q.id);
  const limit = qLimitMs(q);
  const rem = Math.max(0, limit - spent);

  const timer = el("timer");
  if (timer) {
    timer.textContent = fmt(rem);
    console.log("[updateTimeUi] Updated timer to", fmt(rem), "(rem", rem, "ms)");
  } else {
    console.warn("[updateTimeUi] timer not found");
  }
}

function currentQ() {
  return state.questions[state.idx] || null;
}

function setTimerRunning(on) {
  console.log("[setTimerRunning]", on, "activeStartMs", state.activeStartMs, "timerTick", !!state.timerTick);
  if (on) {
    if (state.activeStartMs) {
      console.warn("[setTimerRunning] Already running");
      return;
    }
    state.activeStartMs = Date.now();
    if (!state.timerTick) {
      state.timerTick = setInterval(() => {
        const q = currentQ();
        if (!q) {
          console.warn("[setTimerRunning interval] No current question");
          return;
        }
        const rem = timeRemainingMs(q.id);
        console.log("[setTimerRunning tick] Q", q.id, "remaining", rem);
        updateTimeUi(q.id);
        if (rem <= 0) onTimedOut();
      }, 250);
      console.log("[setTimerRunning] Started interval");
    }
    return;
  }

  if (!state.activeStartMs) {
    console.warn("[setTimerRunning] Already stopped");
    return;
  }
  const q = currentQ();
  const delta = Date.now() - state.activeStartMs;
  state.activeStartMs = 0;
  if (q) {
    const prev = getTimeSpent(q.id);
    state.timeSpent.set(q.id, prev + delta);
    console.log("[setTimerRunning] Stopped; added", delta, "ms to q", q.id);
  }
}

function getTimeSpent(qid) {
  const base = Number(state.timeSpent.get(qid) || 0);
  if (!state.activeStartMs) return base;
  const q = currentQ();
  if (!q || q.id !== qid) return base;
  return base + (Date.now() - state.activeStartMs);
}

function stopAllTimers() {
  setTimerRunning(false);
  if (state.timerTick) {
    clearInterval(state.timerTick);
    state.timerTick = null;
  }
}

function mountQuestion() {
  const q = currentQ();
  if (!q) {
    console.warn("[mountQuestion] No current question");
    return;
  }

  console.log("[mountQuestion] Mounting Q", state.idx + 1, q.id);

  state.visited.add(q.id);
  renderPalette();

  // reset per-question running timer
  setTimerRunning(false);

  // Show premium loading animation while rendering
  el("qHost").innerHTML = `
    <div class="premiumLoader" aria-live="polite" aria-busy="true">
      <span class="codeIcon">&lt;/&gt;</span>
      <span class="loaderText">Loading question…</span>
    </div>
  `;
  el("qMeta").textContent = `Q${state.idx + 1} • ${q.type?.toUpperCase?.() || ""} • ${q.difficulty || ""}`;

  // Defer render to allow loader to show
  setTimeout(() => {
    el("qHost").innerHTML = renderPlayer(q);
    // hide modal controls from renderPlayer
    const body = el("qHost");
    body.querySelector("[data-action=close]")?.remove?.();

    // restore response
    restoreResponse(q, body);

    // lock if already timed out
    const rem = timeRemainingMs(q.id);
    setQuestionLocked(body, rem <= 0);

    // sync timer + timebar immediately (before ticking)
    updateTimeUi(q.id);

    // start timer only after render (if not timed out)
    if (rem > 0) setTimerRunning(true);
    else updateTimeUi(q.id);

    // Force an immediate timer update to show initial value
    setTimeout(() => updateTimeUi(q.id), 10);

    // button states
    el("btnMark").classList.toggle("primary", state.review.has(q.id));
    el("btnMark").textContent = state.review.has(q.id) ? "Unmark Review" : "Mark for Review";

    el("btnPrev").disabled = state.idx <= 0;
    el("btnNext").disabled = state.idx >= state.questions.length - 1;
  }, 100);

  // Fallback: ensure timer starts even if something delayed
  setTimeout(() => {
    const q2 = currentQ();
    if (q2 && q2.id === q.id && timeRemainingMs(q2.id) > 0 && !state.activeStartMs) {
      console.log("[mountQuestion] Fallback timer start");
      setTimerRunning(true);
      // Force an immediate UI update
      updateTimeUi(q2.id);
    }
  }, 300);
}

function readResponse(q, root) {
  if (q.type === "mcq" || q.type === "scq") {
    const sel = root.querySelector("input[name=mcq]:checked");
    return sel ? { kind: "mcq", value: Number(sel.value) } : null;
  }
  if (q.type === "msq") {
    const els = Array.from(root.querySelectorAll("input[name=msq]:checked"));
    if (!els.length) return null;
    return { kind: "msq", value: els.map((e) => Number(e.value)).sort((a, b) => a - b) };
  }
  if (q.type === "tf") {
    const sel = root.querySelector("input[name=tf]:checked");
    return sel ? { kind: "tf", value: sel.value === "true" } : null;
  }
  if (q.type === "fib") {
    const v = String(root.querySelector("#fibAnswer")?.value || "").trim();
    return v ? { kind: "fib", value: v } : null;
  }
  if (q.type === "one") {
    const v = String(root.querySelector("#oneAnswer")?.value || "").trim();
    return v ? { kind: "one", value: v } : null;
  }
  if (q.type === "nat") {
    const v = String(root.querySelector("#natAnswer")?.value || "").trim();
    return v ? { kind: "nat", value: v } : null;
  }
  if (q.type === "ar") {
    const sel = root.querySelector("input[name=ar]:checked");
    return sel ? { kind: "ar", value: Number(sel.value) } : null;
  }
  if (q.type === "match") {
    const left = Array.isArray(q.matchLeft) ? q.matchLeft : [];
    const picked = [];
    for (let i = 0; i < left.length; i++) {
      const sel = root.querySelector(`[data-match="${i}"]`);
      picked.push(Number(sel?.value || 0));
    }
    return { kind: "match", value: picked };
  }
  return null;
}

function restoreResponse(q, root) {
  const r = state.responses.get(q.id);
  if (!r) return;

  if ((q.type === "mcq" || q.type === "scq") && r.kind === "mcq") {
    root.querySelector(`input[name=mcq][value="${r.value}"]`)?.click?.();
  }
  if (q.type === "msq" && r.kind === "msq") {
    for (const v of r.value || []) {
      root.querySelector(`input[name=msq][value="${v}"]`)?.click?.();
    }
  }
  if (q.type === "tf" && r.kind === "tf") {
    root.querySelector(`input[name=tf][value="${r.value ? "true" : "false"}"]`)?.click?.();
  }
  if (q.type === "fib" && r.kind === "fib") {
    const a = root.querySelector("#fibAnswer");
    if (a) a.value = String(r.value || "");
  }
  if (q.type === "one" && r.kind === "one") {
    const a = root.querySelector("#oneAnswer");
    if (a) a.value = String(r.value || "");
  }
  if (q.type === "nat" && r.kind === "nat") {
    const a = root.querySelector("#natAnswer");
    if (a) a.value = String(r.value || "");
  }
  if (q.type === "ar" && r.kind === "ar") {
    root.querySelector(`input[name=ar][value="${r.value}"]`)?.click?.();
  }
  if (q.type === "match" && r.kind === "match") {
    const xs = Array.isArray(r.value) ? r.value : [];
    xs.forEach((v, i) => {
      const s = root.querySelector(`[data-match="${i}"]`);
      if (s) s.value = String(v);
    });
  }
}

function setAnsweredFlag(qid) {
  const r = state.responses.get(qid);
  const btn = document.querySelector(`[data-pal="${CSS.escape(qid)}"]`);
  if (!btn) return;
  btn.classList.toggle("ans", !!r);
}

function renderPalette() {
  const host = el("palette");
  host.innerHTML = state.questions
    .map((q, i) => {
      const isOn = i === state.idx;
      const isVis = state.visited.has(q.id);
      const isRev = state.review.has(q.id);
      const isAns = state.responses.has(q.id);
      return `<button class="pBtn ${isOn ? "on" : ""} ${isVis ? "vis" : ""} ${isRev ? "rev" : ""} ${isAns ? "ans" : ""}" data-pal="${q.id}" data-i="${i}">${i + 1}</button>`;
    })
    .join("");

  host.querySelectorAll("[data-i]").forEach((b) => {
    b.addEventListener("click", () => {
      const i = Number(b.getAttribute("data-i"));
      goto(i);
    });
  });
}

function saveResponse() {
  const q = currentQ();
  if (!q) return;
  const root = el("qHost");
  const r = readResponse(q, root);
  if (r) state.responses.set(q.id, r);
  else state.responses.delete(q.id);
  setAnsweredFlag(q.id);
}

function clearResponse() {
  const q = currentQ();
  if (!q) return;
  state.responses.delete(q.id);
  scheduleSessionSave("clear");
  mountQuestion();
}

function toggleReview() {
  const q = currentQ();
  if (!q) return;
  if (state.review.has(q.id)) state.review.delete(q.id);
  else state.review.add(q.id);
  scheduleSessionSave("review");
  mountQuestion();
}

function goto(i) {
  if (i < 0 || i >= state.questions.length) return;
  // pause timer for outgoing question
  setTimerRunning(false);
  saveResponse();
  state.idx = i;
  scheduleSessionSave("goto");
  mountQuestion();
}

function next() {
  goto(Math.min(state.questions.length - 1, state.idx + 1));
}
function prev() {
  goto(Math.max(0, state.idx - 1));
}

function openSubmit() {
  setTimerRunning(false);
  const back = el("submitBackdrop");
  const total = state.questions.length;
  const ans = state.responses.size;
  const rev = state.review.size;
  const vis = state.visited.size;
  el("submitBody").innerHTML = `
    <div class="small">Round summary</div>
    <div class="panel" style="margin-top:10px; border:1px solid rgba(255,255,255,.10); background: rgba(0,0,0,.16); border-radius: 18px; padding: 12px">
      <div class="row" style="justify-content:space-between">
        <div>Total Questions</div><div class="kbd">${total}</div>
      </div>
      <div class="row" style="justify-content:space-between; margin-top:10px">
        <div>Visited</div><div class="kbd">${vis}</div>
      </div>
      <div class="row" style="justify-content:space-between; margin-top:10px">
        <div>Answered</div><div class="kbd">${ans}</div>
      </div>
      <div class="row" style="justify-content:space-between; margin-top:10px">
        <div>Marked for Review</div><div class="kbd">${rev}</div>
      </div>
    </div>
    <div class="small" style="margin-top:10px">Submitting will store this round in Firestore for later analysis.</div>
  `;
  back.classList.add("open");
  back.setAttribute("aria-hidden", "false");
}

function closeSubmit() {
  const back = el("submitBackdrop");
  back.classList.remove("open");
  back.setAttribute("aria-hidden", "true");
  // resume timer when back to question
  setTimerRunning(true);
}

async function confirmSubmit() {
  try {
    setTimerRunning(false);
    saveResponse();
    stopAllTimers();

    el("btnConfirmSubmit").disabled = true;
    el("btnConfirmSubmit").textContent = "Submitting…";

    const attempt = computeAttempt();
    const deviceId = attempt.deviceId;
    attempt.attemptNo = await nextAttemptNoShared(state.examId, deviceId);
    attempt.cpEarned = computeCpEarned(attempt);
    const id = attemptDocId(state.examId, deviceId, attempt.attemptNo);
    const attemptDoc = { id, ...attempt };

    const attemptAnalyticsDoc = {
      id: `ans__${id}`,
      kind: "attempt_answer",
      examId: state.examId,
      deviceId,
      attemptId: id,
      attemptNo: Number(attempt.attemptNo || 0),
      createdMs: Number(attempt.createdMs || Date.now()),
      summary: attempt.summary,
      analytics: computeAttemptAnswerAnalytics(attempt, state.questions, state.exam)
    };

    // Queue locally and start background sync. Never block the user on Firestore.
    enqueueAttemptAndSync(state.examId, deviceId, attemptDoc, attemptAnalyticsDoc).catch(() => {});

    toast(`Round submitted. +${Number(attempt.cpEarned || 0)} CP`, "success", 2200);
    setTimeout(() => {
      window.location.href = `/results/results.html?exam=${encodeURIComponent(state.examId)}`;
    }, 500);
  } catch (e) {
    toast("Failed to submit round.", "error", 3200);
  } finally {
    el("btnConfirmSubmit").disabled = false;
    el("btnConfirmSubmit").textContent = "Submit";
  }
}

function onEsc(e) {
  if (e.key !== "Escape") return;
  const back = el("submitBackdrop");
  if (back.classList.contains("open")) closeSubmit();
}

async function loadExamAndQuestions(examId) {
  const exRef = api.doc(db, COL.EXAMS, examId);
  const exSnap = await api.getDoc(exRef);
  if (!exSnap.exists()) throw new Error("Exam not found");
  state.exam = { id: examId, ...exSnap.data() };

  el("examTitle").textContent = state.exam.title || "Exam";
  const meta = [
    state.exam.examCode ? `Code: ${state.exam.examCode}` : "",
    state.exam.subject ? `Subject: ${state.exam.subject}` : "",
    state.exam.topic ? `Topic: ${state.exam.topic}` : "",
    `Questions: ${state.exam.totalQuestions || "—"}`
  ].filter(Boolean);
  el("examMeta").textContent = meta.join(" • ");

  const qRef = api.collection(db, COL.QUESTIONS);
  const q1 = api.query(qRef, api.where("examId", "==", examId));
  const snap = await api.getDocs(q1);

  const xs = [];
  snap.forEach((d) => xs.push({ id: d.id, ...d.data() }));
  xs.sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));
  state.questions = xs;

  if (!xs.length) throw new Error("No questions");
}

function wire() {
  el("btnPrev").addEventListener("click", prev);
  el("btnNext").addEventListener("click", next);
  el("btnSavePrev").addEventListener("click", () => {
    saveResponse();
    scheduleSessionSave("save_prev");
    prev();
  });
  el("btnSaveNext").addEventListener("click", () => {
    saveResponse();
    scheduleSessionSave("save_next");
    next();
  });
  el("btnClearResp").addEventListener("click", clearResponse);
  el("btnMark").addEventListener("click", toggleReview);

  el("btnSubmit").addEventListener("click", openSubmit);
  el("btnCancelSubmit").addEventListener("click", closeSubmit);
  el("btnConfirmSubmit").addEventListener("click", confirmSubmit);
  el("submitBackdrop").addEventListener("click", (e) => {
    if (e.target === el("submitBackdrop")) closeSubmit();
  });
  window.addEventListener("keydown", onEsc);

  window.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      setTimerRunning(false);
      saveResponse();
      scheduleSessionSave("hidden");
    } else {
      setTimerRunning(true);
    }
  });

  window.addEventListener("beforeunload", () => {
    try {
      setTimerRunning(false);
      saveResponse();
      const deviceId = getDeviceId();
      const doc = buildSessionDoc();
      saveSessionLocal(state.examId, deviceId, doc);
    } catch {
      // ignore
    }
  });
}

async function init() {
  try {
    setPillStatus("Connected", true);

    const { exam } = parseQuery();
    if (!exam) {
      toast("Missing exam id.", "error", 3200);
      return;
    }
    state.examId = exam;

    wire();

    await loadExamAndQuestions(exam);

    const deviceId = getDeviceId();
    const local = loadSessionLocal(state.examId, deviceId);
    let remote = null;
    try {
      remote = await loadSessionFirestore(state.examId, deviceId);
    } catch {
      remote = null;
    }
    const localMs = Number(local?.updatedMs || 0);
    const remoteMs = Number(remote?.updatedMs || 0);
    const chosen = remoteMs > localMs ? remote : local;
    if (chosen) hydrateFromSessionDoc(chosen);

    renderPalette();
    mountQuestion();
    scheduleSessionSave("init");
  } catch (e) {
    toast("Cannot start attempt. Add questions to the exam.", "error", 3200);
  }
}

init();
