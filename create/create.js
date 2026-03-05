import { db, api, COL } from "../shared/firebase.js";
import { setPillStatus, toast, uid, qsa } from "../shared/ui.js";
import { QUESTION_TYPES, DIFFICULTIES, emptyQuestion, normalizeTags, toDocModel, validateQuestion } from "../shared/questions.js";
import {
  emptyExam,
  toExamDocModel,
  validateExam,
  EXAM_DIFFICULTIES,
  ACADEMIC_LEVELS,
  SEMESTERS,
  SECTION_ALPHA,
  SECTION_NUMERIC
} from "../shared/exams.js";

const el = (id) => document.getElementById(id);

const state = {
  model: emptyQuestion("scq"),
  exam: emptyExam(),
  activeExamId: "",
  busy: false
};

const LS_ACTIVE_EXAM = "cqc_active_exam_id";

function bindSelectOptions(selectEl, items) {
  selectEl.innerHTML = items.map((x) => `<option value="${x.value}">${x.label}</option>`).join("");
}

function bindSelectOptionsWithPlaceholder(selectEl, placeholder) {
  selectEl.innerHTML = `<option value="">${placeholder}</option>`;
}

function setQuestionGate(on) {
  const locked = el("qLocked");
  const form = el("qForm");
  locked.style.display = on ? "none" : "block";
  form.classList.toggle("qDisabled", !on);
  el("btnSave").disabled = !on;
  el("btnSave2").disabled = !on;
}

function setActiveExam(id, label) {
  state.activeExamId = id;
  if (id) localStorage.setItem(LS_ACTIVE_EXAM, id);
  else localStorage.removeItem(LS_ACTIVE_EXAM);

  const pill = el("activeExam");
  const txt = el("activeExamText");
  if (!id) {
    pill.style.display = "none";
    setQuestionGate(false);
    return;
  }
  pill.style.display = "flex";
  txt.textContent = `Active exam: ${label || id}`;
  setQuestionGate(true);
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
          <div class="mini">Provide 2 to 8 options. Choose exactly one correct option.</div>
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
          <div class="mini">Provide 2 to 8 options. Select one or more correct options.</div>
          <div class="optionList" id="optList"></div>
          <div class="row" style="margin-top:10px">
            <button class="btn" id="btnAddOpt">Add option</button>
            <button class="btn ghost" id="btnTrimOpt">Trim empty</button>
          </div>
        </div>
        <div class="field span2">
          <div class="label">Correct Options</div>
          <div class="picker" id="correctPicker"></div>
          <div class="mini">Click pills to toggle correct answers.</div>
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
        <div class="field">
          <div class="label">Format</div>
          <div class="mini">User selects either True or False in the quiz player.</div>
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
          <input class="input" id="correctText" placeholder="e.g., const" />
          <div class="mini">The quiz player will show an input box for the user to fill the blank.</div>
        </div>
        <div class="field span2">
          <div class="label">Accepted Answers (optional, comma separated)</div>
          <input class="input" id="acceptedAnswers" placeholder="e.g., const, CONST" />
          <div class="mini">Useful for allowing case variations or synonyms.</div>
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
          <div class="label">Accepted Answers (optional, comma separated)</div>
          <input class="input" id="acceptedAnswers" placeholder="e.g., const, CONST" />
          <div class="mini">Useful for allowing case variations.</div>
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
          const opts = right
            .map((r, j) => `<option value="${j}">${escapeHtml(r)}</option>`)
            .join("");
          return `
            <div class="opt" style="cursor:default">
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
  const items = opts.map((o, i) => `<option value="${i}">${String.fromCharCode(65 + i)} • ${escapeHtml(o)}</option>`);
  sel.innerHTML = items.join("") || `<option value="0">A</option>`;
  sel.value = String(Math.min(Number(state.model.correctIndex || 0), Math.max(0, opts.length - 1)));
}

function renderCorrectPicker() {
  const host = document.getElementById("correctPicker");
  if (!host) return;
  const opts = (Array.isArray(state.model.options) ? state.model.options : []).map((x) => String(x || "").trim()).filter(Boolean);
  const set = new Set(Array.isArray(state.model.correctIndices) ? state.model.correctIndices : []);
  host.innerHTML = opts
    .map(
      (o, i) => `
      <button class="btn ${set.has(i) ? "primary" : "ghost"}" type="button" data-pick="${i}">
        ${String.fromCharCode(65 + i)}
      </button>
    `
    )
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

function resetForm() {
  state.model = emptyQuestion(el("type")?.value || "scq");
  el("title").value = "";
  el("prompt").value = "";
  el("tags").value = "";
  el("timeLimitSec").value = 45;
  el("difficulty").value = "easy";
  el("explanation").value = "";
  renderTypeFields();
}

async function save() {
  if (state.busy) return;
  state.busy = true;

  try {
    readBaseFields();
    const docModel = toDocModel(state.model);
    const errs = validateQuestion(docModel);
    if (errs.length) {
      toast(errs[0], "error", 3200);
      return;
    }

    const payload = {
      ...docModel,
      examId: state.activeExamId,
      createdAt: api.serverTimestamp(),
      updatedAt: api.serverTimestamp(),
      version: 1,
      clientId: uid()
    };

    const ref = await api.addDoc(api.collection(db, COL.QUESTIONS), payload);
    toast("Published to Firestore.", "success");
    setTimeout(() => {
      window.location.href = `/read/read.html?exam=${encodeURIComponent(state.activeExamId)}&focus=${encodeURIComponent(ref.id)}`;
    }, 550);
  } catch (e) {
    toast("Failed to publish. Check Firestore rules.", "error", 3200);
  } finally {
    state.busy = false;
  }
}

function readExamFields() {
  state.exam.title = el("examTitle").value;
  state.exam.academicBranch = el("academicBranch").value;
  state.exam.examCode = el("examCode").value;
  state.exam.subject = el("subject").value;
  state.exam.topic = el("topic").value;
  state.exam.description = el("examDescription").value;

  state.exam.difficulty = el("examDifficulty").value;
  state.exam.positiveMarks = el("positiveMarks").value;
  state.exam.negativeMarks = el("negativeMarks").value;
  state.exam.scheduledDate = el("scheduledDate").value;
  state.exam.scheduledTime = el("scheduledTime").value;
}

function renderSeg(host, values, current, onPick) {
  host.innerHTML = values
    .map((v) => `<div class="s ${String(v) === String(current) ? "on" : ""}" data-v="${v}">${v}${typeof v === "number" && values.length <= 6 ? "h" : ""}</div>`)
    .join("");
  qsa(host, "[data-v]").forEach((n) => {
    n.addEventListener("click", () => onPick(n.getAttribute("data-v")));
  });
}

function renderPickGrid(host, values, current, onPick, format) {
  host.innerHTML = values
    .map((v) => {
      const isOn = String(v) === String(current);
      const label = format ? format(v) : String(v);
      return `<div class="p ${isOn ? "on" : ""}" data-v="${v}">${label}</div>`;
    })
    .join("");
  qsa(host, "[data-v]").forEach((n) => {
    n.addEventListener("click", () => onPick(n.getAttribute("data-v")));
  });
}

function toggleInList(list, value) {
  const s = new Set(Array.isArray(list) ? list : []);
  if (s.has(value)) s.delete(value);
  else s.add(value);
  return Array.from(s);
}

function renderChipGrid(host, values, selected, onToggle) {
  const set = new Set(Array.isArray(selected) ? selected : []);
  host.innerHTML = values
    .map((v) => `<div class="chip ${set.has(v) ? "on" : ""}" data-v="${escapeHtmlAttr(v)}">${escapeHtml(v)}</div>`)
    .join("");
  qsa(host, "[data-v]").forEach((n) => {
    n.addEventListener("click", () => onToggle(n.getAttribute("data-v")));
  });
}

function renderSections() {
  const values = state.exam.sectionMode === "numeric" ? SECTION_NUMERIC : SECTION_ALPHA;
  renderChipGrid(el("sections"), values, state.exam.assignedSections, (v) => {
    state.exam.assignedSections = toggleInList(state.exam.assignedSections, v);
    renderSections();
  });
}

function renderExamControls() {
  bindSelectOptions(el("examDifficulty"), EXAM_DIFFICULTIES);

  el("examDifficulty").value = state.exam.difficulty;
  el("positiveMarks").value = state.exam.positiveMarks;
  el("negativeMarks").value = state.exam.negativeMarks;
  el("scheduledDate").value = state.exam.scheduledDate;
  el("scheduledTime").value = state.exam.scheduledTime;

  const totalVals = Array.from({ length: 250 }, (_, i) => i + 1);
  renderPickGrid(el("totalQuestionsGrid"), totalVals, state.exam.totalQuestions, (v) => {
    state.exam.totalQuestions = Number(v);
    renderExamControls();
  });

  renderSeg(el("durationHours"), [1, 2, 3, 4, 5], state.exam.durationHours, (v) => {
    state.exam.durationHours = Number(v);
    renderExamControls();
  });

  const minuteVals = Array.from({ length: 60 }, (_, i) => i);
  renderPickGrid(el("durationMinutesGrid"), minuteVals, state.exam.durationMinutes, (v) => {
    state.exam.durationMinutes = Number(v);
    renderExamControls();
  });

  renderChipGrid(el("academicLevels"), ACADEMIC_LEVELS, state.exam.academicLevels, (v) => {
    state.exam.academicLevels = toggleInList(state.exam.academicLevels, v);
    renderExamControls();
  });

  renderChipGrid(el("semesters"), SEMESTERS, state.exam.semesters, (v) => {
    state.exam.semesters = toggleInList(state.exam.semesters, v);
    renderExamControls();
  });

  el("secModeAlpha").classList.toggle("primary", state.exam.sectionMode === "alpha");
  el("secModeAlpha").classList.toggle("ghost", state.exam.sectionMode !== "alpha");
  el("secModeNumeric").classList.toggle("primary", state.exam.sectionMode === "numeric");
  el("secModeNumeric").classList.toggle("ghost", state.exam.sectionMode !== "numeric");
  renderSections();

  renderSeg(el("tpqMinutes"), Array.from({ length: 11 }, (_, i) => `${i}m`), `${state.exam.timePerQuestionMinutes}m`, (v) => {
    state.exam.timePerQuestionMinutes = Number(String(v).replace("m", ""));
    renderExamControls();
  });

  renderPickGrid(el("tpqSecondsGrid"), minuteVals, state.exam.timePerQuestionSeconds, (v) => {
    state.exam.timePerQuestionSeconds = Number(v);
    renderExamControls();
  });
}

async function saveExam() {
  if (state.busy) return;
  state.busy = true;

  try {
    readExamFields();
    const docModel = toExamDocModel(state.exam);
    const errs = validateExam(docModel);
    if (errs.length) {
      toast(errs[0], "error", 3200);
      return;
    }

    const payload = {
      ...docModel,
      createdAt: api.serverTimestamp(),
      updatedAt: api.serverTimestamp(),
      version: 1,
      clientId: uid()
    };

    const ref = await api.addDoc(api.collection(db, COL.EXAMS), payload);
    toast("Examination configuration saved.", "success");
    await loadExams(ref.id);
  } catch (e) {
    toast("Failed to save exam. Check Firestore rules.", "error", 3200);
  } finally {
    state.busy = false;
  }
}

async function loadExams(selectId = "") {
  try {
    const exRef = api.collection(db, COL.EXAMS);
    const snap = await api.getDocs(exRef);

    const xs = [];
    snap.forEach((d) => {
      const data = d.data();
      const createdAt = data?.createdAt;
      const ms = createdAt?.toMillis ? createdAt.toMillis() : 0;
      xs.push({ id: d.id, ...data, _createdMs: ms });
    });

    xs.sort((a, b) => (b._createdMs || 0) - (a._createdMs || 0));

    const sel = el("examSelect");
    if (!xs.length) {
      bindSelectOptionsWithPlaceholder(sel, "No exams yet — create one below");
      sel.disabled = true;
      setActiveExam("", "");
      return;
    }
    sel.disabled = false;
    sel.innerHTML = xs
      .map((x) => `<option value="${x.id}">${escapeHtml(x.title || "Untitled")} • ${escapeHtml(x.examCode || x.id)}</option>`)
      .join("");

    const remembered = localStorage.getItem(LS_ACTIVE_EXAM) || "";
    const pick = selectId || (xs.some((x) => x.id === remembered) ? remembered : xs[0].id);
    sel.value = pick;

    const chosen = xs.find((x) => x.id === pick);
    if (chosen) setActiveExam(chosen.id, `${chosen.title} (${chosen.examCode || chosen.id})`);
  } catch (e) {
    toast("Failed to load exams.", "error", 3200);
  }
}

function escapeHtmlAttr(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function init() {
  setPillStatus("Connected", true);

  bindSelectOptions(el("type"), QUESTION_TYPES);
  bindSelectOptions(el("difficulty"), DIFFICULTIES);

  el("type").addEventListener("change", () => {
    const t = el("type").value;
    const prev = state.model;
    state.model = { ...emptyQuestion(t), title: prev.title, prompt: prev.prompt, difficulty: prev.difficulty, tags: prev.tags, timeLimitSec: prev.timeLimitSec, explanation: prev.explanation };
    renderTypeFields();
  });

  renderTypeFields();

  renderExamControls();
  loadExams();
  setQuestionGate(false);

  el("btnSaveExam").addEventListener("click", saveExam);
  el("btnUseExam").addEventListener("click", () => {
    const id = String(el("examSelect").value || "");
    if (!id) return;
    const label = el("examSelect").selectedOptions?.[0]?.textContent || id;
    setActiveExam(id, label);
    toast("Exam selected.");
  });
  el("btnNewExam").addEventListener("click", () => {
    state.exam = emptyExam();
    el("examTitle").value = "";
    el("academicBranch").value = "";
    el("examCode").value = "";
    el("subject").value = "";
    el("topic").value = "";
    el("examDescription").value = "";
    renderExamControls();
    toast("New exam form ready.");
  });
  el("secModeAlpha").addEventListener("click", () => {
    state.exam.sectionMode = "alpha";
    renderExamControls();
  });
  el("secModeNumeric").addEventListener("click", () => {
    state.exam.sectionMode = "numeric";
    renderExamControls();
  });

  el("btnSave").addEventListener("click", save);
  el("btnSave2").addEventListener("click", save);
  el("btnReset").addEventListener("click", () => {
    resetForm();
    toast("Reset complete.");
  });
}

init();
