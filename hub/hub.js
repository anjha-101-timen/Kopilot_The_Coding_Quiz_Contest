import { db, api, COL } from "../shared/firebase.js";
import { setPillStatus, toast, shimmerList, clampText } from "../shared/ui.js";
import { renderExamCard } from "../shared/exams.js";
import { isBookmarkedLocal, toggleBookmark } from "../shared/bookmarks.js";
import { loadAnnouncements } from "../shared/inbox.js";
import { getDeviceId, loadProfileLocal, syncProfile } from "../shared/attempts.js";

const el = (id) => document.getElementById(id);

const state = {
  exams: [],
  view: [],
  mode: "recommended",
  filters: { search: "", difficulty: "", subject: "" }
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
        const ex = state.exams.find((x) => String(x.id) === String(targetId));
        const extra = ex
          ? { title: ex.title || "", examCode: ex.examCode || "", subject: ex.subject || "", topic: ex.topic || "" }
          : {};
        const res = await toggleBookmark(kind, targetId, extra);
        setStarButton(btn, !!res.bookmarked);
        toast(res.bookmarked ? "Bookmarked." : "Removed bookmark.", "success");
      } catch {
        toast("Bookmark failed.", "error", 2400);
      }
    });
  });
}

function showTab(which) {
  const isDesc = which === "desc";
  const isTests = which === "tests";
  const isAnn = which === "ann";

  el("tabDesc").classList.toggle("on", isDesc);
  el("tabTests").classList.toggle("on", isTests);
  el("tabAnn").classList.toggle("on", isAnn);

  el("viewDesc").style.display = isDesc ? "block" : "none";
  el("viewTests").style.display = isTests ? "block" : "none";
  el("viewAnn").style.display = isAnn ? "block" : "none";

  el("tabDesc").setAttribute("aria-selected", isDesc ? "true" : "false");
  el("tabTests").setAttribute("aria-selected", isTests ? "true" : "false");
  el("tabAnn").setAttribute("aria-selected", isAnn ? "true" : "false");
}

function isRecommended(ex) {
  const d = String(ex?.difficulty || "").toLowerCase();
  const ms = Number(ex?._createdMs || 0);
  const fresh = ms ? Date.now() - ms < 1000 * 60 * 60 * 24 * 21 : false;
  return (d === "easy" || d === "medium") && (fresh || Number(ex?.totalQuestions || 0) <= 60);
}

function applyFilters() {
  const q = String(state.filters.search || "").trim().toLowerCase();
  const d = String(state.filters.difficulty || "").toLowerCase();
  const s = String(state.filters.subject || "").trim().toLowerCase();

  let xs = state.exams.slice();
  if (state.mode === "recommended") xs = xs.filter(isRecommended);

  if (q) {
    xs = xs.filter((x) => {
      const hay = `${x.title || ""} ${x.subject || ""} ${x.topic || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }
  if (d) xs = xs.filter((x) => String(x.difficulty || "").toLowerCase() === d);
  if (s) xs = xs.filter((x) => String(x.subject || "").toLowerCase().includes(s));

  xs.sort((a, b) => Number(b._createdMs || 0) - Number(a._createdMs || 0));
  state.view = xs;
  renderExams();
}

function renderExams() {
  const grid = el("examGrid");
  if (!state.view.length) {
    grid.innerHTML = `
      <div class="panel cardlike" style="grid-column: 1 / -1">
        <div style="font-weight:750; letter-spacing:-.02em">No tests found</div>
        <div class="small" style="margin-top:8px">Try switching to All Tests or clear filters.</div>
      </div>
    `;
    return;
  }

  grid.innerHTML = state.view.map(renderExamCard).join("");
  bindBookmarkButtons(grid);

  grid.querySelectorAll("[data-action=open]").forEach((b) => {
    b.addEventListener("click", () => {
      const card = b.closest("[data-exam-id]");
      const id = card?.getAttribute("data-exam-id");
      if (!id) return;
      window.location.href = new URL(`../read/read.html?exam=${encodeURIComponent(id)}`, import.meta.url).href;
    });
  });
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

  state.exams = xs;
  applyFilters();

  el("statExams").textContent = String(xs.length);
  el("statQuestions").textContent = String(xs.reduce((a, x) => a + Number(x.totalQuestions || 0), 0));
}

function esc(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fmtDate(ms) {
  const d = new Date(Number(ms || 0));
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleString();
}

async function loadAnn() {
  const host = el("annList");
  shimmerList(host, 4);

  const rows = await loadAnnouncements();
  if (!rows.length) {
    host.innerHTML = `<div class="panel cardlike"><div style="font-weight:750; letter-spacing:-.02em">No announcements</div><div class="small" style="margin-top:8px">Publish announcements into Firestore to show them here.</div></div>`;
    return;
  }

  host.innerHTML = rows
    .map((a) => {
      const title = esc(a.title || a.heading || "Announcement");
      const body = esc(clampText(a.body || a.text || "", 240));
      const date = fmtDate(a.createdMs);
      const link = String(a.link || "");
      return `
        <article class="annCard">
          <div class="row" style="justify-content:space-between; gap:10px">
            <div class="annTitle">${title}</div>
            <div class="small">${esc(date)}</div>
          </div>
          <div class="annBody">${body || "—"}</div>
          ${link ? `<div class="row" style="margin-top:12px"><a class="btn smallBtn primary" href="${esc(link)}" target="_blank" rel="noopener">Open</a></div>` : ""}
        </article>
      `;
    })
    .join("");
}

function openRefine() {
  el("refineBack").classList.add("open");
  el("refineBack").setAttribute("aria-hidden", "false");
}

function closeRefine() {
  el("refineBack").classList.remove("open");
  el("refineBack").setAttribute("aria-hidden", "true");
}

function wire() {
  el("tabDesc").addEventListener("click", () => showTab("desc"));
  el("tabTests").addEventListener("click", () => showTab("tests"));
  el("tabAnn").addEventListener("click", () => {
    showTab("ann");
    loadAnn().catch(() => {});
  });

  window.addEventListener("hashchange", () => {
    if (String(window.location.hash || "") === "#ann") {
      showTab("ann");
      loadAnn().catch(() => {});
    }
  });

  el("btnRec").addEventListener("click", () => {
    state.mode = "recommended";
    el("btnRec").classList.add("on");
    el("btnAll").classList.remove("on");
    applyFilters();
  });
  el("btnAll").addEventListener("click", () => {
    state.mode = "all";
    el("btnAll").classList.add("on");
    el("btnRec").classList.remove("on");
    applyFilters();
  });

  el("btnReload").addEventListener("click", () => loadExams().catch(() => {}));

  el("btnRefine").addEventListener("click", openRefine);
  el("btnCloseRefine").addEventListener("click", closeRefine);
  el("refineBack").addEventListener("click", (e) => {
    if (e.target === el("refineBack")) closeRefine();
  });

  el("btnReset").addEventListener("click", () => {
    el("fSearch").value = "";
    el("fDifficulty").value = "";
    el("fSubject").value = "";
    state.filters = { search: "", difficulty: "", subject: "" };
    applyFilters();
  });

  el("btnApply").addEventListener("click", () => {
    state.filters.search = String(el("fSearch").value || "");
    state.filters.difficulty = String(el("fDifficulty").value || "");
    state.filters.subject = String(el("fSubject").value || "");
    applyFilters();
    closeRefine();
  });

  el("btnInfo").addEventListener("click", () => {
    if (typeof window.cqcpOpenInfoDrawer === "function") window.cqcpOpenInfoDrawer(4);
  });
}

async function init() {
  try {
    setPillStatus("Connected", true);

    const deviceId = getDeviceId();
    const lp = loadProfileLocal(deviceId);
    el("statCp").textContent = String(Math.max(0, Number(lp.cpTotal || 0)));
    syncProfile(deviceId)
      .then((p) => {
        el("statCp").textContent = String(Math.max(0, Number(p.cpTotal || 0)));
      })
      .catch(() => {});

    window.addEventListener("cqcp:profile", (e) => {
      const p = e?.detail || null;
      if (!p) return;
      el("statCp").textContent = String(Math.max(0, Number(p.cpTotal || 0)));
    });

    wire();
    await loadExams();

    if (String(window.location.hash || "") === "#ann") {
      showTab("ann");
      loadAnn().catch(() => {});
    }
  } catch {
    setPillStatus("Offline", false);
    toast("Cannot load Contest Hub.", "error", 3200);
  }
}

init();
