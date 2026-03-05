import { clampText } from "./ui.js";

export const QUESTION_TYPES = [
  { value: "mcq", label: "MCQ (Multiple Choice)" },
  { value: "msq", label: "MSQ (Multiple Select)" },
  { value: "nat", label: "NAT (Numerical Answer Type)" },
  { value: "fib", label: "Fill in the Blanks" },
  { value: "tf", label: "True / False" },
  { value: "ar", label: "Assertion – Reason" },
  { value: "match", label: "Matching Type" },
  { value: "one", label: "One Word Answer" },
  { value: "scq", label: "Single Choice (Legacy)" }
];

export const DIFFICULTIES = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" }
];

export function emptyQuestion(type = "scq") {
  return {
    title: "",
    prompt: "",
    type,
    difficulty: "easy",
    tags: [],
    timeLimitSec: 45,

    // shared
    explanation: "",

    // mcq/scq/msq
    options: ["", "", "", ""],
    correctIndex: 0,
    correctIndices: [0],

    // tf
    correctBool: true,

    // fib
    correctText: "",
    acceptedAnswers: [],

    // nat
    correctNumber: 0,
    tolerance: 0,

    // assertion–reason
    assertion: "",
    reason: "",

    // matching
    matchLeft: ["", ""],
    matchRight: ["", ""],
    matchPairs: [0, 1]
  };
}

export function normalizeTags(s) {
  return String(s || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export function toDocModel(formModel) {
  const m = structuredClone(formModel);
  m.tags = Array.isArray(m.tags) ? m.tags : normalizeTags(m.tags);

  if (m.type === "mcq" || m.type === "scq") {
    m.options = normalizeOptions(m.options);
    m.correctIndex = clampIndex(m.correctIndex, m.options.length);
    delete m.correctIndices;
    delete m.correctBool;
    delete m.correctText;
    delete m.acceptedAnswers;
    delete m.correctNumber;
    delete m.tolerance;
    delete m.assertion;
    delete m.reason;
    delete m.matchLeft;
    delete m.matchRight;
    delete m.matchPairs;
  } else if (m.type === "msq") {
    m.options = normalizeOptions(m.options);
    m.correctIndices = normalizeIndices(m.correctIndices, m.options.length);
    delete m.correctIndex;
    delete m.correctBool;
    delete m.correctText;
    delete m.acceptedAnswers;
    delete m.correctNumber;
    delete m.tolerance;
    delete m.assertion;
    delete m.reason;
    delete m.matchLeft;
    delete m.matchRight;
    delete m.matchPairs;
  } else if (m.type === "nat") {
    m.correctNumber = safeNumber(m.correctNumber, 0);
    m.tolerance = Math.max(0, safeNumber(m.tolerance, 0));
    delete m.options;
    delete m.correctIndex;
    delete m.correctIndices;
    delete m.correctBool;
    delete m.correctText;
    delete m.acceptedAnswers;
    delete m.assertion;
    delete m.reason;
    delete m.matchLeft;
    delete m.matchRight;
    delete m.matchPairs;
  } else if (m.type === "tf") {
    m.correctBool = !!m.correctBool;
    delete m.options;
    delete m.correctIndex;
    delete m.correctIndices;
    delete m.correctText;
    delete m.acceptedAnswers;
    delete m.correctNumber;
    delete m.tolerance;
    delete m.assertion;
    delete m.reason;
    delete m.matchLeft;
    delete m.matchRight;
    delete m.matchPairs;
  } else if (m.type === "fib") {
    m.correctText = String(m.correctText || "").trim();
    m.acceptedAnswers = normalizeAcceptedAnswers(m.acceptedAnswers, m.correctText);
    delete m.options;
    delete m.correctIndex;
    delete m.correctIndices;
    delete m.correctBool;
    delete m.correctNumber;
    delete m.tolerance;
    delete m.assertion;
    delete m.reason;
    delete m.matchLeft;
    delete m.matchRight;
    delete m.matchPairs;
  } else if (m.type === "one") {
    m.correctText = String(m.correctText || "").trim();
    m.acceptedAnswers = normalizeAcceptedAnswers(m.acceptedAnswers, m.correctText);
    delete m.options;
    delete m.correctIndex;
    delete m.correctIndices;
    delete m.correctBool;
    delete m.correctNumber;
    delete m.tolerance;
    delete m.assertion;
    delete m.reason;
    delete m.matchLeft;
    delete m.matchRight;
    delete m.matchPairs;
  } else if (m.type === "ar") {
    m.assertion = String(m.assertion || "").trim();
    m.reason = String(m.reason || "").trim();
    m.correctIndex = clampIndex(m.correctIndex, 4);
    delete m.options;
    delete m.correctIndices;
    delete m.correctBool;
    delete m.correctText;
    delete m.acceptedAnswers;
    delete m.correctNumber;
    delete m.tolerance;
    delete m.matchLeft;
    delete m.matchRight;
    delete m.matchPairs;
  } else if (m.type === "match") {
    m.matchLeft = normalizeTextList(m.matchLeft, 2, 12);
    m.matchRight = normalizeTextList(m.matchRight, 2, 12);
    m.matchPairs = normalizeMatchPairs(m.matchPairs, m.matchLeft.length, m.matchRight.length);
    delete m.options;
    delete m.correctIndex;
    delete m.correctIndices;
    delete m.correctBool;
    delete m.correctText;
    delete m.acceptedAnswers;
    delete m.correctNumber;
    delete m.tolerance;
    delete m.assertion;
    delete m.reason;
  }

  m.title = String(m.title || "").trim();
  m.prompt = String(m.prompt || "").trim();
  m.explanation = String(m.explanation || "").trim();
  m.difficulty = (m.difficulty || "easy").toLowerCase();
  m.timeLimitSec = Math.max(10, Math.min(600, Number(m.timeLimitSec || 45)));

  return m;
}

export function validateQuestion(m) {
  const errors = [];
  if (!String(m.title || "").trim()) errors.push("Title is required.");
  if (!String(m.prompt || "").trim()) errors.push("Prompt is required.");

  if (m.type === "mcq" || m.type === "scq") {
    const opts = normalizeOptions(m.options);
    if (opts.length < 2) errors.push("SCQ needs at least 2 options.");
    if (m.correctIndex < 0 || m.correctIndex >= opts.length) errors.push("SCQ correct option is invalid.");
  }

  if (m.type === "msq") {
    const opts = normalizeOptions(m.options);
    if (opts.length < 2) errors.push("MSQ needs at least 2 options.");
    const inds = normalizeIndices(m.correctIndices, opts.length);
    if (inds.length < 1) errors.push("MSQ needs at least 1 correct option.");
  }

  if (m.type === "fib") {
    const ct = String(m.correctText || "").trim();
    if (!ct) errors.push("Fill-in-the-blank needs a correct answer.");
  }

  if (m.type === "one") {
    const ct = String(m.correctText || "").trim();
    if (!ct) errors.push("One-word answer needs a correct answer.");
  }

  if (m.type === "nat") {
    const n = Number(m.correctNumber);
    if (!Number.isFinite(n)) errors.push("NAT needs a numeric correct answer.");
    const t = Number(m.tolerance || 0);
    if (!Number.isFinite(t) || t < 0) errors.push("NAT tolerance must be a non-negative number.");
  }

  if (m.type === "ar") {
    if (!String(m.assertion || "").trim()) errors.push("Assertion is required.");
    if (!String(m.reason || "").trim()) errors.push("Reason is required.");
    const i = Number(m.correctIndex);
    if (!Number.isFinite(i) || i < 0 || i > 3) errors.push("Assertion–Reason correct option is invalid.");
  }

  if (m.type === "match") {
    const left = normalizeTextList(m.matchLeft, 2, 12);
    const right = normalizeTextList(m.matchRight, 2, 12);
    if (left.length < 2) errors.push("Matching needs at least 2 left items.");
    if (right.length < 2) errors.push("Matching needs at least 2 right items.");
    const pairs = normalizeMatchPairs(m.matchPairs, left.length, right.length);
    if (pairs.length !== left.length) errors.push("Matching needs a pair for every left item.");
  }

  return errors;
}

function safeNumber(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeTextList(v, min, max) {
  const xs = Array.isArray(v) ? v : String(v || "").split("\n");
  const out = xs
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .slice(0, max);
  while (out.length < min) out.push("");
  return out;
}

function normalizeMatchPairs(v, leftLen, rightLen) {
  const xs = Array.isArray(v) ? v : [];
  const out = [];
  for (let i = 0; i < leftLen; i++) {
    const n = Number(xs[i]);
    if (Number.isFinite(n) && n >= 0 && n < rightLen) out.push(Math.floor(n));
    else out.push(0);
  }
  return out;
}

function normalizeOptions(options) {
  return (Array.isArray(options) ? options : [])
    .map((o) => String(o || "").trim())
    .filter(Boolean)
    .slice(0, 8);
}

function clampIndex(i, len) {
  const n = Number(i);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(len - 1, Math.floor(n)));
}

function normalizeIndices(arr, len) {
  const xs = Array.isArray(arr) ? arr : [];
  const set = new Set();
  for (const x of xs) {
    const n = Number(x);
    if (Number.isFinite(n) && n >= 0 && n < len) set.add(Math.floor(n));
  }
  return Array.from(set).sort((a, b) => a - b);
}

function normalizeAcceptedAnswers(v, correctText) {
  let xs = [];
  if (Array.isArray(v)) xs = v;
  else xs = String(v || "").split(",");

  const set = new Set(
    xs
      .map((x) => String(x || "").trim())
      .filter(Boolean)
      .slice(0, 12)
  );
  if (correctText) set.add(String(correctText).trim());
  return Array.from(set);
}

export function typeBadge(type) {
  const map = {
    mcq: "MCQ",
    scq: "SCQ",
    msq: "MSQ",
    nat: "NAT",
    tf: "T/F",
    fib: "FIB",
    ar: "A/R",
    match: "MATCH",
    one: "ONE"
  };
  return map[type] || String(type || "?").toUpperCase();
}

export function difficultyBadge(d) {
  const map = { easy: "Easy", medium: "Medium", hard: "Hard" };
  return map[(d || "").toLowerCase()] || "—";
}

export function renderQuestionCard(q, mode = "default") {
  const title = escapeHtml(q.title || "Untitled");
  const prompt = escapeHtml(clampText(q.prompt || "", 120));
  const tags = Array.isArray(q.tags) ? q.tags.slice(0, 3) : [];

  const actions =
    mode === "readonly"
      ? `
        <div class="qActions">
          <button class="btn smallBtn" data-action="play">Play</button>
        </div>
      `
      : `
        <div class="qActions">
          <button class="btn smallBtn" data-action="play">Play</button>
          <a class="btn smallBtn ghost" href="/update/update.html?id=${encodeURIComponent(q.id)}">Edit</a>
          <a class="btn smallBtn danger" href="/delete/delete.html?id=${encodeURIComponent(q.id)}">Delete</a>
        </div>
      `;

  return `
    <article class="qCard" data-id="${escapeHtml(q.id)}">
      <div class="qTop">
        <div class="qBadges">
          <span class="qPill">${typeBadge(q.type)}</span>
          <span class="qPill dim">${difficultyBadge(q.difficulty)}</span>
        </div>
        <div class="row" style="gap:10px; align-items:center">
          <button class="iconBtn" type="button" data-action="bookmark" data-kind="question" data-target-id="${escapeHtml(q.id)}" aria-label="Bookmark">☆</button>
          <div class="qId mono">${escapeHtml(q.id)}</div>
        </div>
      </div>
      <div class="qTitle">${title}</div>
      <div class="qPrompt">${prompt}</div>
      <div class="qTags">
        ${tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}
      </div>
      ${actions}
    </article>
  `;
}

export function renderPlayer(q) {
  const title = escapeHtml(q.title || "Untitled");
  const prompt = escapeHtml(q.prompt || "");

  const header = `
    <div class="playerHead">
      <div>
        <div class="playerTitle">${title}</div>
        <div class="playerMeta">
          <span class="kbd">${typeBadge(q.type)}</span>
          <span class="kbd">${difficultyBadge(q.difficulty)}</span>
          <span class="kbd">${Number(q.timeLimitSec || 45)}s</span>
        </div>
      </div>
    </div>
    <div class="playerPrompt">${prompt}</div>
  `;

  const body = renderPlayerBody(q);
  const footer = `
    <div class="playerFooter">
      <button class="btn ghost" data-action="close">Close</button>
      <div class="spacer"></div>
      <button class="btn" data-action="reveal">Reveal Solution</button>
      <button class="btn primary" data-action="check">Check</button>
    </div>
  `;

  return header + body + footer;
}

function renderPlayerBody(q) {
  if (q.type === "mcq" || q.type === "scq") {
    const opts = Array.isArray(q.options) ? q.options : [];
    return `
      <div class="playerBody" data-type="mcq">
        <div class="optGrid">
          ${opts
            .map(
              (o, i) => `
            <label class="opt">
              <input type="radio" name="mcq" value="${i}">
              <span class="optBox"></span>
              <span class="optText">${escapeHtml(o)}</span>
            </label>
          `
            )
            .join("")}
        </div>
        <div class="result" aria-live="polite"></div>
      </div>
    `;
  }

  if (q.type === "msq") {
    const opts = Array.isArray(q.options) ? q.options : [];
    return `
      <div class="playerBody" data-type="msq">
        <div class="optGrid">
          ${opts
            .map(
              (o, i) => `
            <label class="opt">
              <input type="checkbox" name="msq" value="${i}">
              <span class="optBox"></span>
              <span class="optText">${escapeHtml(o)}</span>
            </label>
          `
            )
            .join("")}
        </div>
        <div class="result" aria-live="polite"></div>
      </div>
    `;
  }

  if (q.type === "tf") {
    return `
      <div class="playerBody" data-type="tf">
        <div class="optGrid two">
          <label class="opt">
            <input type="radio" name="tf" value="true">
            <span class="optBox"></span>
            <span class="optText">True</span>
          </label>
          <label class="opt">
            <input type="radio" name="tf" value="false">
            <span class="optBox"></span>
            <span class="optText">False</span>
          </label>
        </div>
        <div class="result" aria-live="polite"></div>
      </div>
    `;
  }

  if (q.type === "fib") {
    return `
      <div class="playerBody" data-type="fib">
        <div class="fibWrap">
          <div class="small">Fill the blank (type your answer)</div>
          <input class="input" id="fibAnswer" placeholder="Your answer…" autocomplete="off" />
          <div class="small">Accepted answers can include synonyms / variations.</div>
        </div>
        <div class="result" aria-live="polite"></div>
      </div>
    `;
  }

  if (q.type === "one") {
    return `
      <div class="playerBody" data-type="one">
        <div class="fibWrap">
          <div class="small">Type a single word answer</div>
          <input class="input" id="oneAnswer" placeholder="Your answer…" autocomplete="off" />
          <div class="small">Accepted answers can include variations (case, synonyms).</div>
        </div>
        <div class="result" aria-live="polite"></div>
      </div>
    `;
  }

  if (q.type === "nat") {
    return `
      <div class="playerBody" data-type="nat">
        <div class="fibWrap">
          <div class="small">Enter your numerical answer</div>
          <input class="input" id="natAnswer" inputmode="decimal" placeholder="e.g., 3.14" autocomplete="off" />
          <div class="small">Decimals are allowed.</div>
        </div>
        <div class="result" aria-live="polite"></div>
      </div>
    `;
  }

  if (q.type === "ar") {
    const assertion = escapeHtml(q.assertion || "");
    const reason = escapeHtml(q.reason || "");
    const opts = [
      "Both Assertion and Reason are true, and Reason is the correct explanation of Assertion.",
      "Both Assertion and Reason are true, but Reason is NOT the correct explanation of Assertion.",
      "Assertion is true, but Reason is false.",
      "Assertion is false, but Reason is true."
    ];
    return `
      <div class="playerBody" data-type="ar">
        <div class="panel" style="border:1px solid rgba(255,255,255,.10); background: rgba(0,0,0,.16); border-radius: 18px; padding: 12px">
          <div class="small" style="margin-bottom:6px">Assertion</div>
          <div style="color: rgba(234,240,255,.88)">${assertion}</div>
          <div class="small" style="margin:12px 0 6px">Reason</div>
          <div style="color: rgba(234,240,255,.88)">${reason}</div>
        </div>
        <div class="optGrid" style="margin-top:12px">
          ${opts
            .map(
              (o, i) => `
            <label class="opt">
              <input type="radio" name="ar" value="${i}">
              <span class="optBox"></span>
              <span class="optText">${escapeHtml(o)}</span>
            </label>
          `
            )
            .join("")}
        </div>
        <div class="result" aria-live="polite"></div>
      </div>
    `;
  }

  if (q.type === "match") {
    const left = Array.isArray(q.matchLeft) ? q.matchLeft : [];
    const right = Array.isArray(q.matchRight) ? q.matchRight : [];
    const options = right.map((x, i) => `<option value="${i}">${escapeHtml(x)}</option>`).join("");
    return `
      <div class="playerBody" data-type="match">
        <div class="small">Match each item on the left with the correct item on the right.</div>
        <div style="display:grid; gap:10px; margin-top:12px">
          ${left
            .map(
              (l, i) => `
            <div class="opt" style="cursor:default">
              <div style="flex:1">
                <div class="small">Left ${i + 1}</div>
                <div style="margin-top:6px">${escapeHtml(l)}</div>
              </div>
              <div style="width:min(260px, 44%)">
                <div class="small">Right</div>
                <select class="select" data-match="${i}" style="margin-top:6px; width:100%">
                  ${options}
                </select>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
        <div class="result" aria-live="polite"></div>
      </div>
    `;
  }

  return `<div class="playerBody"><div class="result">Unsupported type.</div></div>`;
}

export function checkAnswer(q, root) {
  const resultEl = root.querySelector(".result");
  const setResult = (ok, text) => {
    resultEl.className = `result ${ok ? "ok" : "bad"}`;
    resultEl.textContent = text;
  };

  if (q.type === "mcq" || q.type === "scq") {
    const sel = root.querySelector("input[name=mcq]:checked");
    if (!sel) return setResult(false, "Pick one option.");
    const v = Number(sel.value);
    const ok = v === Number(q.correctIndex);
    return setResult(ok, ok ? "Correct." : "Incorrect.");
  }

  if (q.type === "msq") {
    const els = Array.from(root.querySelectorAll("input[name=msq]:checked"));
    if (els.length === 0) return setResult(false, "Select one or more options.");
    const picked = els.map((e) => Number(e.value)).sort((a, b) => a - b);
    const correct = (Array.isArray(q.correctIndices) ? q.correctIndices : []).slice().sort((a, b) => a - b);
    const ok = picked.length === correct.length && picked.every((x, i) => x === correct[i]);
    return setResult(ok, ok ? "Perfect selection." : "Not quite. Try again.");
  }

  if (q.type === "tf") {
    const sel = root.querySelector("input[name=tf]:checked");
    if (!sel) return setResult(false, "Choose True or False.");
    const v = sel.value === "true";
    const ok = v === !!q.correctBool;
    return setResult(ok, ok ? "Correct." : "Incorrect.");
  }

  if (q.type === "fib") {
    const ans = root.querySelector("#fibAnswer");
    const v = String(ans?.value || "").trim();
    if (!v) return setResult(false, "Type an answer.");
    const accepted = new Set((Array.isArray(q.acceptedAnswers) ? q.acceptedAnswers : []).map((x) => String(x).trim().toLowerCase()));
    accepted.add(String(q.correctText || "").trim().toLowerCase());
    const ok = accepted.has(v.toLowerCase());
    return setResult(ok, ok ? "Correct." : "Incorrect.");
  }

  if (q.type === "one") {
    const ans = root.querySelector("#oneAnswer");
    const v = String(ans?.value || "").trim();
    if (!v) return setResult(false, "Type an answer.");
    if (v.split(/\s+/).length !== 1) return setResult(false, "Enter one word only.");
    const accepted = new Set((Array.isArray(q.acceptedAnswers) ? q.acceptedAnswers : []).map((x) => String(x).trim().toLowerCase()));
    accepted.add(String(q.correctText || "").trim().toLowerCase());
    const ok = accepted.has(v.toLowerCase());
    return setResult(ok, ok ? "Correct." : "Incorrect.");
  }

  if (q.type === "nat") {
    const ans = root.querySelector("#natAnswer");
    const raw = String(ans?.value || "").trim();
    if (!raw) return setResult(false, "Enter a number.");
    const v = Number(raw);
    if (!Number.isFinite(v)) return setResult(false, "Invalid number.");
    const target = Number(q.correctNumber);
    const tol = Math.max(0, Number(q.tolerance || 0));
    const ok = Math.abs(v - target) <= tol;
    return setResult(ok, ok ? "Correct." : "Incorrect.");
  }

  if (q.type === "ar") {
    const sel = root.querySelector("input[name=ar]:checked");
    if (!sel) return setResult(false, "Pick one option.");
    const v = Number(sel.value);
    const ok = v === Number(q.correctIndex);
    return setResult(ok, ok ? "Correct." : "Incorrect.");
  }

  if (q.type === "match") {
    const left = Array.isArray(q.matchLeft) ? q.matchLeft : [];
    const right = Array.isArray(q.matchRight) ? q.matchRight : [];
    const pairs = Array.isArray(q.matchPairs) ? q.matchPairs : [];
    if (left.length < 2 || right.length < 2) return setResult(false, "Invalid matching question.");
    const picked = [];
    for (let i = 0; i < left.length; i++) {
      const sel = root.querySelector(`[data-match="${i}"]`);
      picked.push(Number(sel?.value || 0));
    }
    const ok = picked.length === pairs.length && picked.every((x, i) => x === Number(pairs[i]));
    return setResult(ok, ok ? "All matches correct." : "Some matches are incorrect.");
  }

  return setResult(false, "Unsupported type.");
}

export function revealSolution(q, root) {
  const resultEl = root.querySelector(".result");
  if (!resultEl) return;

  const exp = String(q.explanation || "").trim();
  const expBlock = exp ? `\nExplanation: ${exp}` : "";

  if (q.type === "mcq" || q.type === "scq") {
    const idx = Number(q.correctIndex);
    const opt = (Array.isArray(q.options) ? q.options : [])[idx];
    resultEl.className = "result";
    resultEl.textContent = `Solution: ${String(opt || "(missing option)")}${expBlock}`;
    return;
  }

  if (q.type === "msq") {
    const opts = Array.isArray(q.options) ? q.options : [];
    const inds = Array.isArray(q.correctIndices) ? q.correctIndices : [];
    const xs = inds.map((i) => opts[i]).filter(Boolean);
    resultEl.className = "result";
    resultEl.textContent = `Solution: ${xs.join(", ") || "(missing options)"}${expBlock}`;
    return;
  }

  if (q.type === "tf") {
    resultEl.className = "result";
    resultEl.textContent = `Solution: ${q.correctBool ? "True" : "False"}${expBlock}`;
    return;
  }

  if (q.type === "fib") {
    resultEl.className = "result";
    resultEl.textContent = `Solution: ${String(q.correctText || "").trim() || "(missing)"}${expBlock}`;
    return;
  }

  if (q.type === "one") {
    resultEl.className = "result";
    resultEl.textContent = `Solution: ${String(q.correctText || "").trim() || "(missing)"}${expBlock}`;
    return;
  }

  if (q.type === "nat") {
    const t = Number(q.tolerance || 0);
    const tolTxt = t > 0 ? ` (±${t})` : "";
    resultEl.className = "result";
    resultEl.textContent = `Solution: ${String(q.correctNumber)}${tolTxt}${expBlock}`;
    return;
  }

  if (q.type === "ar") {
    const opts = [
      "Both Assertion and Reason are true, and Reason is the correct explanation of Assertion.",
      "Both Assertion and Reason are true, but Reason is NOT the correct explanation of Assertion.",
      "Assertion is true, but Reason is false.",
      "Assertion is false, but Reason is true."
    ];
    const idx = Number(q.correctIndex);
    resultEl.className = "result";
    resultEl.textContent = `Solution: ${opts[idx] || "(missing)"}${expBlock}`;
    return;
  }

  if (q.type === "match") {
    const left = Array.isArray(q.matchLeft) ? q.matchLeft : [];
    const right = Array.isArray(q.matchRight) ? q.matchRight : [];
    const pairs = Array.isArray(q.matchPairs) ? q.matchPairs : [];
    const lines = left.map((l, i) => `${l} -> ${right[pairs[i]] || "?"}`);
    resultEl.className = "result";
    resultEl.textContent = `Solution:\n${lines.join("\n")}${expBlock}`;
    return;
  }
}

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
