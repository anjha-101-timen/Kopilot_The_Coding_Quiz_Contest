import { setPillStatus, toast, shimmerList, clampText } from "../shared/ui.js";
import { loadMyBookmarks, toggleBookmark } from "../shared/bookmarks.js";
import { db, api, COL } from "../shared/firebase.js";

const el = (id) => document.getElementById(id);

function esc(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function hydrateTargets(rows) {
  const exams = new Map();
  const questions = new Map();

  const examIds = Array.from(new Set(rows.filter((r) => r.kind === "exam").map((r) => String(r.targetId || "")).filter(Boolean)));
  const questionIds = Array.from(new Set(rows.filter((r) => r.kind === "question").map((r) => String(r.targetId || "")).filter(Boolean)));

  for (const id of examIds.slice(0, 60)) {
    try {
      const snap = await api.getDoc(api.doc(db, COL.EXAMS, id));
      if (snap.exists()) exams.set(id, { id, ...snap.data() });
    } catch {}
  }

  for (const id of questionIds.slice(0, 80)) {
    try {
      const snap = await api.getDoc(api.doc(db, COL.QUESTIONS, id));
      if (snap.exists()) questions.set(id, { id, ...snap.data() });
    } catch {}
  }

  return { exams, questions };
}

function renderCard(bm, ctx) {
  const kind = String(bm.kind || "");
  const targetId = String(bm.targetId || "");

  if (kind === "exam") {
    const ex = ctx.exams.get(targetId);
    const title = esc(ex?.title || bm?.extra?.title || "Exam");
    const code = esc(ex?.examCode || bm?.extra?.examCode || "—");
    const subject = esc(ex?.subject || bm?.extra?.subject || "—");
    const topic = esc(clampText(ex?.topic || bm?.extra?.topic || "", 70));

    return `
      <article class="bmCard">
        <div class="bmTop">
          <div>
            <div class="bmTitle">${title}</div>
            <div class="bmMeta">
              <span class="bmKind">Exam</span>
              <span class="small">Code: <span class="mono">${code}</span></span>
              <span class="small">${subject} • ${topic || "—"}</span>
            </div>
          </div>
        </div>
        <div class="bmActions">
          <a class="btn smallBtn primary" href="${readHref(`?exam=${encodeURIComponent(targetId)}`)}">Open</a>
          <a class="btn smallBtn" href="${playHref(`?exam=${encodeURIComponent(targetId)}`)}">Start</a>
          <button class="btn smallBtn danger" data-unbm="${esc(bm.id)}" data-kind="exam" data-target="${esc(targetId)}">Remove</button>
        </div>
      </article>
    `;
  }

  if (kind === "question") {
    const q = ctx.questions.get(targetId);
    const title = esc(q?.title || bm?.extra?.title || "Question");
    const prompt = esc(clampText(q?.prompt || bm?.extra?.prompt || "", 120));
    const examId = String(q?.examId || bm?.extra?.examId || "");

    return `
      <article class="bmCard">
        <div class="bmTop">
          <div>
            <div class="bmTitle">${title}</div>
            <div class="bmMeta">
              <span class="bmKind">Question</span>
              <span class="small" style="margin-top:8px">${prompt || "—"}</span>
            </div>
          </div>
        </div>
        <div class="bmActions">
          ${examId ? `<a class="btn smallBtn primary" href="${readHref(`?exam=${encodeURIComponent(examId)}&focus=${encodeURIComponent(targetId)}`)}">Open in Exam</a>` : ""}
          <button class="btn smallBtn danger" data-unbm="${esc(bm.id)}" data-kind="question" data-target="${esc(targetId)}">Remove</button>
        </div>
      </article>
    `;
  }

  return "";
}

async function load() {
  const grid = el("grid");
  shimmerList(grid, 6);

  const rows = await loadMyBookmarks();
  if (!rows.length) {
    el("empty").style.display = "block";
    grid.innerHTML = "";
    return;
  }

  el("empty").style.display = "none";
  const ctx = await hydrateTargets(rows);
  grid.innerHTML = rows.map((r) => renderCard(r, ctx)).join("");

  grid.querySelectorAll("[data-unbm]").forEach((b) => {
    b.addEventListener("click", async () => {
      const kind = b.getAttribute("data-kind");
      const targetId = b.getAttribute("data-target");
      await toggleBookmark(kind, targetId);
      toast("Removed bookmark.", "success");
      load().catch(() => {});
    });
  });
}

async function init() {
  try {
    setPillStatus("Connected", true);
    el("btnRefresh").addEventListener("click", () => load().catch(() => {}));
    await load();
  } catch {
    setPillStatus("Offline", false);
    toast("Cannot load bookmarks.", "error", 3200);
  }
}

init();
