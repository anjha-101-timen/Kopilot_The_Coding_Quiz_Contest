import { db, api, COL } from "../shared/firebase.js";
import { setPillStatus, toast, uid, qsa } from "../shared/ui.js";
import { QUESTION_TYPES, DIFFICULTIES, emptyQuestion, normalizeTags, toDocModel, validateQuestion } from "../shared/questions.js";
import {
  emptyExam,
  toExamDocModel,
  validateExam,
  renderExamCard,
  EXAM_DIFFICULTIES,
  ACADEMIC_LEVELS,
  SEMESTERS,
  SECTION_ALPHA,
  SECTION_NUMERIC
} from "../shared/exams.js";

const el = (id) => document.getElementById(id);

const state = {
  id: "",
  loaded: null,
  model: emptyQuestion("scq"),
  exams: [],
  activeExam: null,
  questions: [],
  busy: false
};

function bindSelectOptions(selectEl, items) {
  selectEl.innerHTML = items.map((x) => `<option value="${x.value}">${x.label}</option>`).join("");
}

function parseIdFromUrl() {
  const url = new URL(window.location.href);
  return url.searchParams.get("id") || "";
}

function parseExamFromUrl() {
  const url = new URL(window.location.href);
  return url.searchParams.get("exam") || "";
}

function setExamHeader(exam) {
  const head = document.getElementById("examHead");
  if (!head) return;
  if (!exam) {
    head.style.display = "none";
    return;
  }
  head.style.display = "block";
  el("examTitle").textContent = exam.title || "Exam";
  const meta = [
    exam.examCode ? `Code: ${exam.examCode}` : "",
    exam.subject ? `Subject: ${exam.subject}` : "",
    exam.topic ? `Topic: ${exam.topic}` : ""
  ].filter(Boolean);
  el("examMeta").textContent = meta.join(" • ");
  el("btnOpenRead").href = new URL(`../read/read.html?exam=${encodeURIComponent(exam.id)}`, import.meta.url).href;
}

function renderQuestionPicker() {
  const grid = document.getElementById("qGrid");
  if (!grid) return;

  if (!state.activeExam) {
    grid.innerHTML = "";
    return;
  }

  if (!state.questions.length) {
    grid.innerHTML = `
      <div class="panel cardlike" style="grid-column: 1 / -1">
        <div style="font-weight:700; letter-spacing:-.02em">No questions in this exam</div>
        <div class="small" style="margin-top:8px">Go to Create and publish questions under this exam.</div>
        <div class="row" style="margin-top:12px">
          <a class="btn primary" href="${new URL("../create/create.html", import.meta.url).href}">Create</a>
        </div>
      </div>
    `;
    return;
  }

  grid.innerHTML = state.questions.map((q) => renderQuestionCard(q, "readonly")).join("");
  grid.querySelectorAll("[data-action=play]").forEach((b) => {
    b.textContent = "Edit";
    b.classList.add("primary");
    b.addEventListener("click", () => {
      const card = b.closest("[data-id]");
      const id = card?.getAttribute("data-id");
      if (!id) return;
      loadDocById(id);
    });
  });
}

function setEditorVisible(on) {
  el("editor").style.display = on ? "block" : "none";
}

function fillBaseFields(m) {
  el("title").value = m.title || "";
  el("prompt").value = m.prompt || "";
  el("type").value = m.type || "scq";
  el("difficulty").value = m.difficulty || "easy";
  el("timeLimitSec").value = m.timeLimitSec || 45;
  el("tags").value = Array.isArray(m.tags) ? m.tags.join(", ") : "";
  el("explanation").value = m.explanation || "";
}

function readBaseFields() {
  state.model.title = el("title").value;
  state.model.prompt = el("prompt").value;
  state.model.type = el("type").value;
  state.model.difficulty = el("difficulty").value;
  state.model.timeLimitSec = el("timeLimitSec").value;
  state.model.tags = normalizeTags(el("tags").value);
  state.model.explanation = el("explanation").value;
}

function renderTypeFields() {
  const host = el("typeFields");
  const t = el("type").value;

  if (t === "mcq" || t === "scq") {
    host.innerHTML = `
      <div class="typeGrid">
        <div class="field span2">
          <div class="label">Options</div>
          <div class="mini">Choose one correct option.</div>
          <div class="optionList" id="optList"></div>
          <div class="row" style="margin-top:10px">
            <button class="btn" id="btnAddOpt">Add option</button>
            <button class="btn ghost" id="btnTrimOpt">Trim empty</button>
          </div>
        </div>
        <div class="field">
          <div class="label">Correct Option</div>
          <select class="select" id="correctIndex"></select>
        </div>
      </div>
    `;

    renderOptions();
    renderCorrectIndex();

    el("btnAddOpt").addEventListener("click", () => {
      state.model.options.push("");
      renderOptions();
      renderCorrectIndex();
    });

    el("btnTrimOpt").addEventListener("click", () => {
      state.model.options = state.model.options.map((x) => String(x || "")).filter((x) => x.trim().length > 0);
      if (state.model.options.length < 2) state.model.options = ["", "", "", ""];
      renderOptions();
      renderCorrectIndex();
    });

    el("correctIndex").addEventListener("change", (e) => {
      state.model.correctIndex = Number(e.target.value);
    });

    return;
  }

  if (t === "nat") {
    host.innerHTML = `
      <div class="typeGrid">
        <div class="field">
          <div class="label">Correct Numerical Answer</div>
          <input class="input" id="correctNumber" inputmode="decimal" placeholder="e.g., 42 or 3.14" />
          <div class="mini">Numerical Answer Type (no options). Decimals allowed.</div>
        </div>
        <div class="field">
          <div class="label">Tolerance (±)</div>
          <input class="input" id="tolerance" inputmode="decimal" placeholder="0" />
          <div class="mini">Accept answers within ± tolerance. Keep 0 for exact match.</div>
        </div>
      </div>
    `;

    el("correctNumber").value = String(state.model.correctNumber ?? "");
    el("tolerance").value = String(state.model.tolerance ?? "0");
    el("correctNumber").addEventListener("input", (e) => (state.model.correctNumber = e.target.value));
    el("tolerance").addEventListener("input", (e) => (state.model.tolerance = e.target.value));
    return;
  }

  if (t === "msq") {
    host.innerHTML = `
      <div class="typeGrid">
        <div class="field span2">
          <div class="label">Options</div>
          <div class="mini">Select one or more correct options.</div>
          <div class="optionList" id="optList"></div>
          <div class="row" style="margin-top:10px">
            <button class="btn" id="btnAddOpt">Add option</button>
            <button class="btn ghost" id="btnTrimOpt">Trim empty</button>
          </div>
        </div>
        <div class="field span2">
          <div class="label">Correct Options</div>
          <div class="picker" id="correctPicker"></div>
        </div>
      </div>
    `;

    renderOptions();
    renderCorrectPicker();

    el("btnAddOpt").addEventListener("click", () => {
      state.model.options.push("");
      renderOptions();
      renderCorrectPicker();
    });

    el("btnTrimOpt").addEventListener("click", () => {
      state.model.options = state.model.options.map((x) => String(x || "")).filter((x) => x.trim().length > 0);
      if (state.model.options.length < 2) state.model.options = ["", "", "", ""];
      state.model.correctIndices = (state.model.correctIndices || []).filter((i) => i < state.model.options.length);
      renderOptions();
      renderCorrectPicker();
    });

    return;
  }

  if (t === "tf") {
    host.innerHTML = `
      <div class="typeGrid">
        <div class="field">
          <div class="label">Correct Answer</div>
          <select class="select" id="correctBool">
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        </div>
      </div>
    `;

    el("correctBool").value = state.model.correctBool ? "true" : "false";
    el("correctBool").addEventListener("change", (e) => {
      state.model.correctBool = e.target.value === "true";
    });

    return;
  }

  if (t === "fib") {
    host.innerHTML = `
      <div class="typeGrid">
        <div class="field span2">
          <div class="label">Correct Answer</div>
          <input class="input" id="correctText" />
        </div>
        <div class="field span2">
          <div class="label">Accepted Answers (comma separated)</div>
          <input class="input" id="acceptedAnswers" />
          <div class="mini">Include variations / synonyms.</div>
        </div>
      </div>
    `;

    el("correctText").value = state.model.correctText || "";
    el("acceptedAnswers").value = Array.isArray(state.model.acceptedAnswers) ? state.model.acceptedAnswers.join(", ") : (state.model.acceptedAnswers || "");

    el("correctText").addEventListener("input", (e) => (state.model.correctText = e.target.value));
    el("acceptedAnswers").addEventListener("input", (e) => (state.model.acceptedAnswers = e.target.value));

    return;
  }

  if (t === "one") {
    host.innerHTML = `
      <div class="typeGrid">
        <div class="field span2">
          <div class="label">Correct One-Word Answer</div>
          <input class="input" id="correctText" placeholder="e.g., const" />
          <div class="mini">The participant should enter exactly one word.</div>
        </div>
        <div class="field span2">
          <div class="label">Accepted Answers (comma separated)</div>
          <input class="input" id="acceptedAnswers" placeholder="e.g., const, CONST" />
          <div class="mini">Include variations / synonyms.</div>
        </div>
      </div>
    `;

    el("correctText").value = state.model.correctText || "";
    el("acceptedAnswers").value = Array.isArray(state.model.acceptedAnswers) ? state.model.acceptedAnswers.join(", ") : (state.model.acceptedAnswers || "");
    el("correctText").addEventListener("input", (e) => (state.model.correctText = e.target.value));
    el("acceptedAnswers").addEventListener("input", (e) => (state.model.acceptedAnswers = e.target.value));
    return;
  }

  if (t === "ar") {
    host.innerHTML = `
      <div class="typeGrid">
        <div class="field span2">
          <div class="label">Assertion</div>
          <textarea class="textarea" id="assertion" placeholder="Write the assertion statement…"></textarea>
        </div>
        <div class="field span2">
          <div class="label">Reason</div>
          <textarea class="textarea" id="reason" placeholder="Write the reason statement…"></textarea>
        </div>
        <div class="field span2">
          <div class="label">Correct Option</div>
          <select class="select" id="correctIndex">
            <option value="0">Both true, and Reason explains Assertion</option>
            <option value="1">Both true, but Reason does NOT explain Assertion</option>
            <option value="2">Assertion true, Reason false</option>
            <option value="3">Assertion false, Reason true</option>
          </select>
        </div>
      </div>
    `;

    el("assertion").value = state.model.assertion || "";
    el("reason").value = state.model.reason || "";
    el("correctIndex").value = String(Number(state.model.correctIndex || 0));
    el("assertion").addEventListener("input", (e) => (state.model.assertion = e.target.value));
    el("reason").addEventListener("input", (e) => (state.model.reason = e.target.value));
    el("correctIndex").addEventListener("change", (e) => (state.model.correctIndex = Number(e.target.value)));
    return;
  }

  if (t === "match") {
    host.innerHTML = `
      <div class="typeGrid">
        <div class="field span2">
          <div class="label">Left Items (one per line)</div>
          <textarea class="textarea" id="matchLeft" placeholder="A\nB\nC"></textarea>
          <div class="mini">Minimum 2 items.</div>
        </div>
        <div class="field span2">
          <div class="label">Right Items (one per line)</div>
          <textarea class="textarea" id="matchRight" placeholder="1\n2\n3"></textarea>
          <div class="mini">Minimum 2 items.</div>
        </div>
        <div class="field span2">
          <div class="label">Pairs (Left → Right)</div>
          <div id="pairHost" style="display:grid; gap:10px"></div>
          <div class="mini">For each Left item, choose the matching Right item.</div>
        </div>
      </div>
    `;

    el("matchLeft").value = Array.isArray(state.model.matchLeft) ? state.model.matchLeft.join("\n") : "";
    el("matchRight").value = Array.isArray(state.model.matchRight) ? state.model.matchRight.join("\n") : "";

    const reRenderPairs = () => {
      const left = String(el("matchLeft").value || "")
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean);
      const right = String(el("matchRight").value || "")
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean);

      state.model.matchLeft = left;
      state.model.matchRight = right;

      const pairs = Array.isArray(state.model.matchPairs) ? state.model.matchPairs.slice() : [];
      while (pairs.length < left.length) pairs.push(0);
      state.model.matchPairs = pairs.slice(0, left.length);

      const host2 = document.getElementById("pairHost");
      if (!host2) return;
      if (left.length < 2 || right.length < 2) {
        host2.innerHTML = `<div class="small">Add at least 2 items on both sides to configure pairs.</div>`;
        return;
      }

      host2.innerHTML = left
        .map((l, i) => {
          const opts = right.map((r, j) => `<option value="${j}">${escapeHtml(r)}</option>`).join("");
          return `
            <div class="optRow" style="align-items:center">
              <div style="flex:1">${escapeHtml(l)}</div>
              <select class="select" data-pair="${i}" style="width:min(320px, 46%)">
                ${opts}
              </select>
            </div>
          `;
        })
        .join("");

      qsa(host2, "select[data-pair]").forEach((s) => {
        const i = Number(s.getAttribute("data-pair"));
        s.value = String(Math.min(right.length - 1, Math.max(0, Number(state.model.matchPairs?.[i] ?? 0))));
        s.addEventListener("change", (e) => {
          const idx = Number(e.target.getAttribute("data-pair"));
          const v = Number(e.target.value);
          const ps = Array.isArray(state.model.matchPairs) ? state.model.matchPairs.slice() : [];
          ps[idx] = v;
          state.model.matchPairs = ps;
        });
      });
    };

    el("matchLeft").addEventListener("input", reRenderPairs);
    el("matchRight").addEventListener("input", reRenderPairs);
    reRenderPairs();
    return;
  }
}

function renderOptions() {
  const list = document.getElementById("optList");
  if (!list) return;

  const opts = Array.isArray(state.model.options) ? state.model.options : [];
  list.innerHTML = opts
    .map(
      (v, i) => `
      <div class="optRow">
        <input class="input" data-opt="${i}" placeholder="Option ${i + 1}" value="${escapeHtmlAttr(v)}" />
        <button class="btn ghost" type="button" data-del="${i}">Remove</button>
      </div>
    `
    )
    .join("");

  qsa(list, "input[data-opt]").forEach((inp) => {
    inp.addEventListener("input", (e) => {
      const idx = Number(e.target.getAttribute("data-opt"));
      state.model.options[idx] = e.target.value;
      renderCorrectIndex();
      renderCorrectPicker();
    });
  });

  qsa(list, "button[data-del]").forEach((b) => {
    b.addEventListener("click", () => {
      const idx = Number(b.getAttribute("data-del"));
      state.model.options.splice(idx, 1);
      if (state.model.options.length < 2) state.model.options.push("");
      state.model.correctIndices = (state.model.correctIndices || []).filter((x) => x !== idx).map((x) => (x > idx ? x - 1 : x));
      if (state.model.correctIndex >= state.model.options.length) state.model.correctIndex = 0;
      renderOptions();
      renderCorrectIndex();
      renderCorrectPicker();
    });
  });
}

function renderCorrectIndex() {
  const sel = document.getElementById("correctIndex");
  if (!sel) return;
  const opts = (Array.isArray(state.model.options) ? state.model.options : []).map((x) => String(x || "").trim()).filter(Boolean);
  sel.innerHTML =
    opts.map((o, i) => `<option value="${i}">${String.fromCharCode(65 + i)} • ${escapeHtml(o)}</option>`).join("") ||
    `<option value="0">A</option>`;

  sel.value = String(Math.min(Number(state.model.correctIndex || 0), Math.max(0, opts.length - 1)));
}

function renderCorrectPicker() {
  const host = document.getElementById("correctPicker");
  if (!host) return;

  const opts = (Array.isArray(state.model.options) ? state.model.options : []).map((x) => String(x || "").trim()).filter(Boolean);
  const set = new Set(Array.isArray(state.model.correctIndices) ? state.model.correctIndices : []);

  host.innerHTML = opts
    .map((o, i) => `<button class="btn ${set.has(i) ? "primary" : "ghost"}" type="button" data-pick="${i}">${String.fromCharCode(65 + i)}</button>`)
    .join("");

  qsa(host, "button[data-pick]").forEach((b) => {
    b.addEventListener("click", () => {
      const i = Number(b.getAttribute("data-pick"));
      const s = new Set(Array.isArray(state.model.correctIndices) ? state.model.correctIndices : []);
      if (s.has(i)) s.delete(i);
      else s.add(i);
      state.model.correctIndices = Array.from(s).sort((a, b) => a - b);
      renderCorrectPicker();
    });
  });
}

async function loadDocById(id) {
  if (state.busy) return;
  state.busy = true;

  try {
    setPillStatus("Connected", true);

    if (!id) {
      toast("Paste a document id.", "error");
      return;
    }

    const ref = api.doc(db, COL.QUESTIONS, id);
    const snap = await api.getDoc(ref);

    if (!snap.exists()) {
      toast("Not found.", "error", 3200);
      setEditorVisible(false);
      return;
    }

    const data = snap.data();
    state.id = id;
    state.loaded = { id, ...data };
    state.model = { ...emptyQuestion(data.type || "scq"), ...data };

    fillBaseFields(state.model);
    renderTypeFields();
    setEditorVisible(true);

    toast("Loaded.", "success");
  } catch (e) {
    setPillStatus("Offline", false);
    toast("Failed to load. Check Firestore rules.", "error", 3200);
  } finally {
    state.busy = false;
  }
}

async function loadDoc() {
  const id = String(el("docId").value || "").trim();
  await loadDocById(id);
}

async function loadExams() {
  const grid = document.getElementById("examGrid");
  if (!grid) return;

  grid.innerHTML = `
    <div class="shimmerCard" aria-hidden="true">
      <div class="skLine w75"></div>
      <div class="skLine w55"></div>
      <div class="skLine w60"></div>
      <div class="skLine w40"></div>
    </div>
  `;

  const ref = api.collection(db, COL.EXAMS);
  const snap = await api.getDocs(ref);
  const xs = [];
  snap.forEach((d) => {
    const data = d.data();
    const createdAt = data?.createdAt;
    const ms = createdAt?.toMillis ? createdAt.toMillis() : 0;
    xs.push({ id: d.id, ...data, _createdMs: ms });
  });
  xs.sort((a, b) => (b._createdMs || 0) - (a._createdMs || 0));
  state.exams = xs;

  if (!xs.length) {
    grid.innerHTML = `
      <div class="panel cardlike" style="grid-column: 1 / -1">
        <div style="font-weight:700; letter-spacing:-.02em">No exams yet</div>
        <div class="small" style="margin-top:8px">Create an exam first, then frame questions under it.</div>
        <div class="row" style="margin-top:12px">
          <a class="btn primary" href="${new URL("../create/create.html", import.meta.url).href}">Create Exam</a>
        </div>
      </div>
    `;
    return;
  }

  grid.innerHTML = xs.map(renderExamCard).join("");
  grid.querySelectorAll("[data-action=open]").forEach((b) => {
    b.textContent = "Open";
    b.addEventListener("click", async () => {
      const card = b.closest("[data-exam-id]");
      const id = card?.getAttribute("data-exam-id");
      const exam = state.exams.find((x) => x.id === id);
      if (!exam) return;
      await openExam(exam);
    });
  });
}

async function openExam(exam) {
  state.activeExam = exam;
  setExamHeader(exam);

  const qRef = api.collection(db, COL.QUESTIONS);
  const q1 = api.query(qRef, api.where("examId", "==", exam.id));
  const snap = await api.getDocs(q1);

  const xs = [];
  snap.forEach((d) => {
    const data = d.data();
    const createdAt = data?.createdAt;
    const ms = createdAt?.toMillis ? createdAt.toMillis() : 0;
    xs.push({ id: d.id, ...data, _createdMs: ms });
  });
  xs.sort((a, b) => (b._createdMs || 0) - (a._createdMs || 0));
  state.questions = xs;
  renderQuestionPicker();

  const url = new URL(window.location.href);
  url.searchParams.set("exam", exam.id);
  window.history.replaceState({}, "", url);
}

async function save() {
  if (state.busy) return;
  state.busy = true;

  try {
    if (!state.id) {
      toast("Load a document first.", "error");
      return;
    }

    readBaseFields();
    const docModel = toDocModel(state.model);
    const errs = validateQuestion(docModel);
    if (errs.length) {
      toast(errs[0], "error", 3200);
      return;
    }

    const ref = api.doc(db, COL.QUESTIONS, state.id);
    await api.updateDoc(ref, {
      ...docModel,
      updatedAt: api.serverTimestamp(),
      version: Number(state.loaded?.version || 1) + 1
    });

    toast("Saved.", "success");
    setTimeout(() => {
      window.location.href = new URL(`../read/read.html?focus=${encodeURIComponent(state.id)}`, import.meta.url).href;
    }, 550);
  } catch (e) {
    toast("Save failed. Check rules.", "error", 3200);
  } finally {
    state.busy = false;
  }
}

function resetToLoaded() {
  if (!state.loaded) return;
  state.model = { ...emptyQuestion(state.loaded.type || "scq"), ...state.loaded };
  fillBaseFields(state.model);
  renderTypeFields();
  toast("Reset to loaded.");
}

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function escapeHtmlAttr(s) {
  return escapeHtml(s);
}

async function pasteFromClipboard() {
  try {
    const t = await navigator.clipboard.readText();
    if (t) {
      el("docId").value = t.trim();
      toast("Pasted.");
    }
  } catch {}
}

function init() {
  bindSelectOptions(el("type"), QUESTION_TYPES);
  bindSelectOptions(el("difficulty"), DIFFICULTIES);

  document.getElementById("btnRefresh")?.addEventListener("click", () => loadExams());

  el("btnLoad").addEventListener("click", loadDoc);
  el("btnPaste").addEventListener("click", pasteFromClipboard);

  el("type").addEventListener("change", () => {
    const t = el("type").value;
    const prev = state.model;
    state.model = { ...emptyQuestion(t), title: prev.title, prompt: prev.prompt, difficulty: prev.difficulty, tags: prev.tags, timeLimitSec: prev.timeLimitSec, explanation: prev.explanation };
    renderTypeFields();
  });

  el("btnSave").addEventListener("click", save);
  el("btnSave2").addEventListener("click", save);
  el("btnReset").addEventListener("click", resetToLoaded);

  const idFromUrl = parseIdFromUrl();
  if (idFromUrl) {
    el("docId").value = idFromUrl;
    loadDoc();
  }

  loadExams().then(async () => {
    const examFromUrl = parseExamFromUrl();
    if (examFromUrl) {
      const found = state.exams.find((x) => x.id === examFromUrl);
      if (found) await openExam(found);
    }
  });

  setPillStatus("Connected", true);
}

init();
