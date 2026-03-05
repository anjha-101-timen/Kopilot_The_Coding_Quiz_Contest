import { db, api, COL } from "../shared/firebase.js";
import { setPillStatus, toast, shimmerList } from "../shared/ui.js";
import { QUESTION_TYPES, DIFFICULTIES, renderQuestionCard, renderPlayer, checkAnswer, revealSolution } from "../shared/questions.js";
import { renderExamCard } from "../shared/exams.js";
import { isBookmarkedLocal, toggleBookmark } from "../shared/bookmarks.js";

const el = (id) => document.getElementById(id);

const state = {
  exams: [],
  activeExam: null,
  all: [],
  view: [],
  current: null
};

function setStarButton(btn, on) {
  if (!btn) return;
  btn.textContent = on ? "★" : "☆";
  btn.setAttribute("aria-pressed", on ? "true" : "false");
  btn.style.color = on ? "rgba(245,158,11,.95)" : "rgba(248,250,252,.9)";
}

function bindBookmarkButtons(root) {
  if (!root) return;
  root.querySelectorAll("button[data-action=bookmark]").forEach((btn) => {
    const kind = btn.getAttribute("data-kind") || "";
    const targetId = btn.getAttribute("data-target-id") || "";
    setStarButton(btn, isBookmarkedLocal(kind, targetId));

    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      try {
        const extra = {};
        if (kind === "exam") {
          const ex = state.exams.find((x) => String(x.id) === String(targetId));
          if (ex) {
            extra.title = ex.title || "";
            extra.examCode = ex.examCode || "";
            extra.subject = ex.subject || "";
            extra.topic = ex.topic || "";
          }
        }
        if (kind === "question") {
          const q = state.view.find((x) => String(x.id) === String(targetId)) || state.all.find((x) => String(x.id) === String(targetId));
          if (q) {
            extra.title = q.title || "";
            extra.prompt = q.prompt || "";
            extra.examId = q.examId || "";
          }
        }

        const res = await toggleBookmark(kind, targetId, extra);
        setStarButton(btn, !!res.bookmarked);
        toast(res.bookmarked ? "Bookmarked." : "Removed bookmark.", "success");
      } catch {
        toast("Bookmark failed.", "error", 2400);
      }
    });
  });
}

function bindSelectOptions(selectEl, items, withAll = false, allLabel = "All") {
  const allOpt = withAll ? [{ value: "", label: allLabel }] : [];
  selectEl.innerHTML = [...allOpt, ...items].map((x) => `<option value="${x.value}">${x.label}</option>`).join("");
}

function parseQuery() {
  const url = new URL(window.location.href);
  return {
    exam: url.searchParams.get("exam") || "",
    focus: url.searchParams.get("focus") || "",
    q: url.searchParams.get("q") || ""
  };
}

function setExamHeader(exam) {
  const head = el("examHead");
  const filters = el("filtersPanel");
  if (!exam) {
    head.style.display = "none";
    filters.style.display = "none";
    return;
  }

  head.style.display = "block";
  filters.style.display = "block";

  el("examTitle").textContent = exam.title || "Exam";
  const meta = [
    exam.examCode ? `Code: ${exam.examCode}` : "",
    exam.subject ? `Subject: ${exam.subject}` : "",
    exam.topic ? `Topic: ${exam.topic}` : "",
    typeof exam.totalQuestions !== "undefined" ? `Total: ${exam.totalQuestions}` : ""
  ].filter(Boolean);
  el("examMeta").textContent = meta.join(" • ");

  const btnManage = el("btnManage");
  btnManage.href = `/update/update.html?exam=${encodeURIComponent(exam.id)}`;

  const btnResults = el("btnResults");
  if (btnResults) btnResults.href = `/results/results.html?exam=${encodeURIComponent(exam.id)}`;

  const btnStart = el("btnStart");
  if (btnStart) btnStart.href = `/play/play.html?exam=${encodeURIComponent(exam.id)}`;
}

function applyFilters() {
  const q = String(el("search").value || "").trim().toLowerCase();
  const t = el("type").value;
  const d = el("difficulty").value;
  const sort = el("sort").value;

  let xs = state.all.slice();

  if (q) {
    xs = xs.filter((x) => String(x.title || "").toLowerCase().includes(q) || String(x.prompt || "").toLowerCase().includes(q));
  }
  if (t) xs = xs.filter((x) => x.type === t);
  if (d) xs = xs.filter((x) => String(x.difficulty || "").toLowerCase() === d);

  if (sort === "new") xs.sort((a, b) => (b._createdMs || 0) - (a._createdMs || 0));
  if (sort === "old") xs.sort((a, b) => (a._createdMs || 0) - (b._createdMs || 0));
  if (sort === "title") xs.sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));

  state.view = xs;
  renderGrid();
}

function renderGrid() {
  const grid = el("grid");
  if (!grid) return;

  if (!state.view.length) {
    grid.innerHTML = `
      <div class="panel cardlike" style="grid-column: 1 / -1">
        <div style="font-weight:700; letter-spacing:-.02em">No questions found</div>
        <div class="small" style="margin-top:8px">Create a question or clear filters.</div>
        <div class="row" style="margin-top:12px">
          <a class="btn primary" href="/create/create.html">Create</a>
          <button class="btn ghost" id="btnClearInline">Clear filters</button>
        </div>
      </div>
    `;
    document.getElementById("btnClearInline")?.addEventListener("click", clearFilters);
    return;
  }

  grid.innerHTML = state.view.map((q) => renderQuestionCard(q, "readonly")).join("");
  bindBookmarkButtons(grid);

  grid.querySelectorAll("[data-action=play]").forEach((b) => {
    b.addEventListener("click", () => {
      const card = b.closest("[data-id]");
      const id = card?.getAttribute("data-id");
      if (!id) return;
      const q = state.view.find((x) => x.id === id);
      if (!q) return;
      openPlayer(q);
    });
  });
}

function openPlayer(q) {
  state.current = q;
  const back = el("playerBackdrop");
  const body = el("playerBody");
  body.innerHTML = renderPlayer(q);

  body.querySelector("[data-action=close]")?.addEventListener("click", closePlayer);
  body.querySelector("[data-action=check]")?.addEventListener("click", () => checkAnswer(q, body));
  body.querySelector("[data-action=reveal]")?.addEventListener("click", () => revealSolution(q, body));

  back.classList.add("open");
  back.setAttribute("aria-hidden", "false");

  const firstInput = body.querySelector("input, button");
  firstInput?.focus?.();
}

function closePlayer() {
  const back = el("playerBackdrop");
  back.classList.remove("open");
  back.setAttribute("aria-hidden", "true");
}

function onEsc(e) {
  if (e.key === "Escape") closePlayer();
}

function clearFilters() {
  el("search").value = "";
  el("type").value = "";
  el("difficulty").value = "";
  el("sort").value = "new";
  applyFilters();
}

async function load() {
  try {
    setPillStatus("Connected", true);

    await loadExams();

    const { exam } = parseQuery();
    if (exam) {
      const chosen = state.exams.find((x) => x.id === exam);
      if (chosen) await openExam(chosen);
    }
  } catch (e) {
    setPillStatus("Offline", false);
    toast("Failed to load from Firestore. Check rules.", "error", 3200);
    el("examGrid").innerHTML = `
      <div class="panel cardlike" style="grid-column: 1 / -1">
        <div style="font-weight:700; letter-spacing:-.02em">Cannot load exams</div>
        <div class="small" style="margin-top:8px">Make sure Firestore is enabled and rules allow reads.</div>
        <div class="row" style="margin-top:12px">
          <button class="btn primary" id="btnRetry">Retry</button>
        </div>
      </div>
    `;
    document.getElementById("btnRetry")?.addEventListener("click", load);
  }
}

async function loadExams() {
  const grid = el("examGrid");
  shimmerList(grid, 6);

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
  bindBookmarkButtons(grid);
  grid.querySelectorAll("[data-action=open]").forEach((b) => {
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

  const grid = el("grid");
  shimmerList(grid, 9);

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
  state.all = xs;

  const { focus, q } = parseQuery();
  if (q) el("search").value = q;
  else el("search").value = "";
  el("sort").value = "new";
  el("type").value = "";
  el("difficulty").value = "";
  applyFilters();

  const url = new URL(window.location.href);
  url.searchParams.set("exam", exam.id);
  window.history.replaceState({}, "", url);

  if (focus) {
    const found = state.all.find((x) => x.id === focus);
    if (found) {
      setTimeout(() => {
        document.querySelector(`[data-id="${CSS.escape(focus)}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    }
  }
}

function init() {
  bindSelectOptions(el("type"), QUESTION_TYPES, true, "All types");
  bindSelectOptions(el("difficulty"), DIFFICULTIES, true, "All difficulties");

  el("btnRefresh").addEventListener("click", load);
  el("btnClear").addEventListener("click", clearFilters);

  el("search").addEventListener("input", () => applyFilters());
  el("type").addEventListener("change", () => applyFilters());
  el("difficulty").addEventListener("change", () => applyFilters());
  el("sort").addEventListener("change", () => applyFilters());

  el("playerBackdrop").addEventListener("click", (e) => {
    if (e.target === el("playerBackdrop")) closePlayer();
  });
  window.addEventListener("keydown", onEsc);

  load();
}

init();
