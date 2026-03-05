import { db, api, COL } from "../shared/firebase.js";
import { setPillStatus, toast } from "../shared/ui.js";
import { getDeviceId, loadProfileLocal, syncProfile } from "../shared/attempts.js";

const el = (id) => document.getElementById(id);

function esc(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const UNLOCK_CP = 10;

function renderLocked(cpTotal) {
  const need = Math.max(0, UNLOCK_CP - Math.max(0, Number(cpTotal || 0)));
  return `
    <div class="lbHeroTitle">Leaderboard Locked</div>
    <div class="lbHeroSub">You need <b>${need}</b> CP more to unlock the leaderboard.</div>
    <div class="lbLocked">
      <div class="lbLockBadge">🔒</div>
      <div>
        <div style="font-weight:850">Earn CP, climb zones, and get promoted!</div>
        <div class="lbHeroSub" style="margin-top:6px">Still confused? Click the <b>i</b> button for the CP/Leaderboard guide.</div>
      </div>
    </div>
    <div class="lbCardRow">
      <a class="btn primary" href="/read/read.html">Earn CP Now</a>
    </div>
  `;
}

function renderUnlocked(profile) {
  const cpTotal = Math.max(0, Number(profile?.cpTotal || 0));
  const level = Math.max(1, Number(profile?.level || 1));
  const cpRank = Math.max(0, Number(profile?.cpRank || 0));

  return `
    <div class="lbHeroTitle">Leaderboard</div>
    <div class="lbHeroSub">Compete using <b>CP Rank</b>. Your CP Rank decides promotion/safety/demotion zones per cycle.</div>
    <div class="lbCardRow">
      <div class="lbKbd">CP ${cpTotal}</div>
      <div class="lbKbd">CP Rank ${cpRank}</div>
      <div class="lbKbd">Level ${level}</div>
    </div>
  `;
}

function renderList(rows, deviceId) {
  if (!rows.length) return "<div class=\"small\" style=\"margin-top:12px\">No leaderboard data yet.</div>";

  return rows
    .map((p, i) => {
      const rank = i + 1;
      const isYou = String(p.deviceId || "") === String(deviceId || "");
      const name = isYou ? "You" : `Coder ${String(p.deviceId || "").slice(0, 6)}`;
      const cpRank = Math.max(0, Number(p.cpRank || 0));
      const level = Math.max(1, Number(p.level || 1));
      const cpTotal = Math.max(0, Number(p.cpTotal || 0));

      return `
        <div class="lbRow" style="${isYou ? "border-color: rgba(34,211,238,.28); background: rgba(34,211,238,.06)" : ""}">
          <div class="lbLeft">
            <div class="lbRank">${rank}</div>
            <div style="min-width:0">
              <div class="lbName">${esc(name)}</div>
              <div class="lbMeta">Level ${level} • CP Rank ${cpRank}</div>
            </div>
          </div>
          <div class="lbRight">
            <div class="lbKbd">CP ${cpTotal}</div>
          </div>
        </div>
      `;
    })
    .join("");
}

async function loadTopProfiles(limitN = 25) {
  const ref = api.collection(db, COL.PROFILES);
  const q = api.query(ref, api.orderBy("cpRank", "desc"), api.limit(limitN));
  const snap = await api.getDocs(q);
  const xs = [];
  snap.forEach((d) => xs.push({ id: d.id, ...d.data() }));
  return xs;
}

async function init() {
  try {
    setPillStatus("Connected", true);

    const deviceId = getDeviceId();
    let profile = loadProfileLocal(deviceId);

    // Sync (best effort)
    syncProfile(deviceId)
      .then((p) => {
        profile = p;
        const cpTotal = Math.max(0, Number(profile?.cpTotal || 0));
        el("lbHero").innerHTML = cpTotal >= UNLOCK_CP ? renderUnlocked(profile) : renderLocked(cpTotal);
      })
      .catch(() => {});

    const cpTotal = Math.max(0, Number(profile?.cpTotal || 0));
    el("lbHero").innerHTML = cpTotal >= UNLOCK_CP ? renderUnlocked(profile) : renderLocked(cpTotal);

    el("lbInfo")?.addEventListener("click", () => {
      if (typeof window.cqcpOpenInfoDrawer === "function") window.cqcpOpenInfoDrawer(5);
    });

    if (cpTotal < UNLOCK_CP) {
      el("lbList").innerHTML = "";
      return;
    }

    const top = await loadTopProfiles(25);
    el("lbList").innerHTML = renderList(top, deviceId);
  } catch {
    setPillStatus("Offline", false);
    toast("Cannot load leaderboard. Check Firestore rules/indexes.", "error", 3200);
  }
}

init();
