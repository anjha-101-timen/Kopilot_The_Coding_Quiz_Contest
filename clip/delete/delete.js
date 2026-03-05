import { db, api, COL } from "../shared/firebase.js";
import { setPillStatus, toast } from "../shared/ui.js";
import { typeBadge, difficultyBadge, renderQuestionCard } from "../shared/questions.js";
import { renderExamCard } from "../shared/exams.js";

const el = (id) => document.getElementById(id);

const state = {
  id: "",
  loaded: null,
  exams: [],
  activeExam: null,
  questions: [],
  busy: false
};

function parseIdFromUrl() {
  const url = new URL(window.location.href);
  return url.searchParams.get("id") || "";
}

function parseExamFromUrl() {
  const url = new URL(window.location.href);
  return url.searchParams.get("exam") || "";
}

function setPreviewVisible(on) {
  el("preview").style.display = on ? "block" : "none";
}

function renderPreview(q) {
  el("preview").innerHTML = `
    <div class="previewCard">
      <div class="row" style="justify-content:space-between; gap:10px">
        <div class="prevTitle">${escapeHtml(q.title || "Untitled")}</div>
        <span class="kbd">${typeBadge(q.type)}</span>
      </div>
      <div class="prevPrompt">${escapeHtml(q.prompt || "")}</div>
      <div class="prevMeta">
        <span class="kbd">${difficultyBadge(q.difficulty)}</span>
        <span class="kbd">${Number(q.timeLimitSec || 45)}s</span>
        <span class="kbd">${escapeHtml(state.id)}</span>
      </div>
    </div>
  `;
}

async function loadDoc() {
  const id = String(el("docId")?.value || "").trim();
  await loadQuestionById(id);
}

async function loadQuestionById(id) {
  if (state.busy) return;
  state.busy = true;

  try {
    setPillStatus("Connected", true);

    if (!id) {
      toast("Pick a question to delete.", "error");
      return;
    }

    const ref = api.doc(db, COL.QUESTIONS, id);
    const snap = await api.getDoc(ref);

    if (!snap.exists()) {
      toast("Not found.", "error", 3200);
      state.id = "";
      state.loaded = null;
      setPreviewVisible(false);
      return;
    }

    state.id = id;
    state.loaded = { id, ...snap.data() };
    renderPreview(state.loaded);
    setPreviewVisible(true);
    toast("Selected.", "success");

    const examId = state.loaded.examId;
    if (examId && (!state.activeExam || state.activeExam.id !== examId)) {
      const found = state.exams.find((x) => x.id === examId);
      if (found) await openExam(found);
      else await openExamById(examId);
    }
  } catch (e) {
    setPillStatus("Offline", false);
    toast("Failed to load. Check Firestore rules.", "error", 3200);
  } finally {
    state.busy = false;
  }
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
  el("btnOpenRead").href = `/read/read.html?exam=${encodeURIComponent(exam.id)}`;
}

function renderQuestionList() {
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
        <div class="small" style="margin-top:8px">Frame questions in Create, then come back to delete.</div>
        <div class="row" style="margin-top:12px">
          <a class="btn primary" href="/create/create.html">Create</a>
        </div>
      </div>
    `;
    return;
  }

  grid.innerHTML = state.questions
    .map((q) => {
      const card = renderQuestionCard(q, "readonly");
      return card.replace(
        'data-action="play">Play</button>',
        'data-action="pick">Select</button><button class="btn smallBtn danger" data-action="delete">Delete</button>'
      );
    })
    .join("");

  grid.querySelectorAll("[data-action=pick]").forEach((b) => {
    b.addEventListener("click", () => {
      const card = b.closest("[data-id]");
      const id = card?.getAttribute("data-id");
      if (!id) return;
      const q = state.questions.find((x) => x.id === id);
      if (!q) return;
      state.id = id;
      state.loaded = q;
      renderPreview(q);
      setPreviewVisible(true);
      toast("Selected.");
    });
  });
  grid.querySelectorAll("[data-action=delete]").forEach((b) => {
    b.addEventListener("click", () => {
      const card = b.closest("[data-id]");
      const id = card?.getAttribute("data-id");
      if (!id) return;
      const q = state.questions.find((x) => x.id === id);
      if (!q) return;
      state.id = id;
      state.loaded = q;
      renderPreview(q);
      setPreviewVisible(true);
      openConfirm();
    });
  });
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
          <a class="btn primary" href="/create/create.html">Create Exam</a>
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

async function openExamById(id) {
  const ref = api.doc(db, COL.EXAMS, id);
  const snap = await api.getDoc(ref);
  if (!snap.exists()) return;
  await openExam({ id, ...snap.data() });
}

async function openExam(exam) {
  state.activeExam = exam;
  setExamHeader(exam);
  setPreviewVisible(false);

  const qRef = api.collection(db, COL.QUESTIONS);
  const q1 = api.query(qRef, api.where("examId", "==", exam.id));
  const snap = await api.getDocs(q1);
  const xs = [];
  snap.forEach((d) => {
    xs.push({ id: d.id, ...d.data() });
  });
  state.questions = xs;
  renderQuestionList();

  const url = new URL(window.location.href);
  url.searchParams.set("exam", exam.id);
  window.history.replaceState({}, "", url);
}

function openConfirm() {
  const back = el("confirmBackdrop");
  el("confirmInput").value = "";
  back.classList.add("open");
  back.setAttribute("aria-hidden", "false");
  setTimeout(() => el("confirmInput").focus(), 0);
}

function closeConfirm() {
  const back = el("confirmBackdrop");
  back.classList.remove("open");
  back.setAttribute("aria-hidden", "true");
}

async function doDelete() {
  if (state.busy) return;
  const txt = String(el("confirmInput").value || "").trim();
  if (txt !== "DELETE") {
    toast("Type DELETE to confirm.", "error");
    return;
  }

  state.busy = true;
  try {
    const ref = api.doc(db, COL.QUESTIONS, state.id);
    await api.deleteDoc(ref);
    toast("Deleted.", "success");
    closeConfirm();
    setPreviewVisible(false);
    state.id = "";
    state.loaded = null;

    if (state.activeExam) {
      await openExam(state.activeExam);
    }
  } catch (e) {
    toast("Delete failed. Check rules.", "error", 3200);
  } finally {
    state.busy = false;
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

async function pasteFromClipboard() {
  try {
    const t = await navigator.clipboard.readText();
    if (t) {
      el("docId").value = t.trim();
      toast("Pasted.");
    }
  } catch {}
}

function onEsc(e) {
  if (e.key === "Escape") closeConfirm();
}

function init() {
  setPillStatus("Connected", true);

  document.getElementById("btnRefresh")?.addEventListener("click", () => loadExams());

  el("btnCancel").addEventListener("click", closeConfirm);
  el("btnConfirm").addEventListener("click", doDelete);
  el("confirmBackdrop").addEventListener("click", (e) => {
    if (e.target === el("confirmBackdrop")) closeConfirm();
  });
  window.addEventListener("keydown", onEsc);


  loadExams().then(async () => {
    const examFromUrl = parseExamFromUrl();
    if (examFromUrl) {
      const found = state.exams.find((x) => x.id === examFromUrl);
      if (found) await openExam(found);
      else await openExamById(examFromUrl);
    }

    const idFromUrl = parseIdFromUrl();
    if (idFromUrl) {
      await loadQuestionById(idFromUrl);
    }
  });
}

init();
