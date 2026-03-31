import { db, api, COL } from "./firebase.js";
import { setPillStatus, toast } from "./ui.js";

const previewEl = document.getElementById("preview");
const statCountEl = document.getElementById("statCount");

function renderMiniPreview(q) {
  if (!previewEl) return;
  if (!q) {
    previewEl.innerHTML = `
      <div class="shimmerCard" aria-hidden="true">
        <div class="skLine w80"></div>
        <div class="skLine w55"></div>
        <div class="skLine w65"></div>
        <div class="skLine w45"></div>
      </div>
    `;
    return;
  }

  const typeLabel = {
    scq: "Single Choice",
    msq: "Multiple Select",
    tf: "True / False",
    fib: "Fill in the Blank"
  }[q.type] || q.type;

  const options = Array.isArray(q.options) ? q.options.slice(0, 4) : [];
  previewEl.innerHTML = `
    <div class="shimmerCard" style="background: rgba(255,255,255,.05)">
      <div class="row" style="justify-content:space-between; gap:10px">
        <div style="font-weight:650; letter-spacing:-.01em">${escapeHtml(q.title || "Untitled")}</div>
        <span class="kbd">${typeLabel}</span>
      </div>
      <div class="small" style="margin-top:10px">${escapeHtml(q.prompt || "")}</div>
      <div style="display:grid; gap:8px; margin-top:12px">
        ${options
          .map((o, i) => `<div style="padding:10px 12px;border-radius:16px;border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.18)">${String.fromCharCode(65 + i)}. ${escapeHtml(o)}</div>`)
          .join("")}
      </div>
    </div>
  `;
}

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function init() {
  try {
    setPillStatus("Connected", true);

    const qRef = api.collection(db, COL.QUESTIONS);
    const q1 = api.query(qRef, api.orderBy("createdAt", "desc"), api.limit(1));
    const snap = await api.getDocs(q1);

    let latest = null;
    snap.forEach((d) => (latest = { id: d.id, ...d.data() }));
    renderMiniPreview(latest);

    const all = await api.getDocs(qRef);
    if (statCountEl) statCountEl.textContent = String(all.size);
  } catch (e) {
    renderMiniPreview(null);
    setPillStatus("Offline", false);
    toast("Firebase connection failed. Check Firestore rules + hosting.", "error", 3200);
  }
}

init();
