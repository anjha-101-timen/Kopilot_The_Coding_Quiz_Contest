import { setPillStatus, toast, shimmerList, clampText } from "../shared/ui.js";
import { loadNotifications, loadNotifReadState, markNotifReadLocal, markAllReadLocal } from "../shared/inbox.js";

const el = (id) => document.getElementById(id);

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
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}

function renderRow(n, readMap) {
  const id = String(n.id || "");
  const read = !!readMap[id];
  const title = esc(n.title || "Update");
  const text = esc(clampText(n.body || n.text || "", 180));
  const date = fmtDate(n.createdMs);
  const tag = esc(n.tag || n.kind || "General");

  return `
    <article class="nItem" data-id="${esc(id)}">
      <div class="nDot ${read ? "read" : ""}" aria-hidden="true"></div>
      <div class="nBody">
        <div class="row" style="justify-content:space-between; gap:10px">
          <div class="nTitle">${title}</div>
          <div class="small">${esc(date)}</div>
        </div>
        <div class="nMeta">
          <span class="kbd">${tag}</span>
          ${n.examId ? `<span class="kbd">Exam</span>` : ""}
        </div>
        <div class="nText">${text || "—"}</div>
        <div class="nActions">
          ${n.link ? `<a class="btn smallBtn primary" href="${esc(n.link)}" target="_blank" rel="noopener">Open</a>` : ""}
          <button class="btn smallBtn ${read ? "ghost" : "primary"}" data-action="read">${read ? "Read" : "Mark Read"}</button>
        </div>
      </div>
    </article>
  `;
}

async function load() {
  const list = el("list");
  shimmerList(list, 6);

  const examId = String(el("examId").value || "").trim();
  const rows = await loadNotifications({ examId });

  if (!rows.length) {
    el("empty").style.display = "block";
    list.innerHTML = "";
    return;
  }

  el("empty").style.display = "none";

  const readMap = loadNotifReadState();
  list.innerHTML = rows.map((n) => renderRow(n, readMap)).join("");

  list.querySelectorAll("[data-action=read]").forEach((b) => {
    b.addEventListener("click", () => {
      const card = b.closest("[data-id]");
      const id = card?.getAttribute("data-id");
      if (!id) return;
      markNotifReadLocal(id);
      load().catch(() => {});
    });
  });

  el("btnMarkAll").onclick = () => {
    markAllReadLocal(rows.map((x) => String(x.id || "")).filter(Boolean));
    toast("Marked all as read.", "success");
    load().catch(() => {});
  };
}

async function init() {
  try {
    setPillStatus("Connected", true);
    el("btnRefresh").addEventListener("click", () => load().catch(() => {}));
    el("btnApply").addEventListener("click", () => load().catch(() => {}));
    await load();
  } catch {
    setPillStatus("Offline", false);
    toast("Cannot load notifications.", "error", 3200);
  }
}

init();
