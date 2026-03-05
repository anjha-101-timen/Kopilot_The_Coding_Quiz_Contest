import { setPillStatus, toast } from "../shared/ui.js";
import { getDeviceId, syncProfile, loadProfileLocal } from "../shared/attempts.js";
import { loadMyProfile, saveMyProfileEdits, profileInitials } from "../shared/profile.js";

const el = (id) => document.getElementById(id);

function setAvatar(p) {
  el("avatar").textContent = profileInitials(p);
}

function setStats(p) {
  el("statLevel").textContent = String(Math.max(1, Number(p?.level || 1)));
  el("statCp").textContent = String(Math.max(0, Number(p?.cpTotal || 0)));
  el("statRank").textContent = String(Math.max(0, Number(p?.cpRank || 0)));
  el("statDevice").textContent = String(p?.deviceId || "—");
}

async function init() {
  try {
    setPillStatus("Connected", true);

    const deviceId = getDeviceId();
    const local = loadProfileLocal(deviceId);
    setAvatar(local);
    setStats(local);

    const p = await loadMyProfile();
    el("displayName").value = String(p?.displayName || "");
    el("bio").value = String(p?.bio || "");
    setAvatar(p);
    setStats(p);

    syncProfile(deviceId)
      .then((sp) => {
        setAvatar(sp);
        setStats(sp);
      })
      .catch(() => {});

    window.addEventListener("cqcp:profile", (e) => {
      const np = e?.detail || null;
      if (!np) return;
      setAvatar(np);
      setStats(np);
    });

    el("btnSave").addEventListener("click", async () => {
      const displayName = String(el("displayName").value || "");
      const bio = String(el("bio").value || "");
      await saveMyProfileEdits({ displayName, bio });
      toast("Profile saved.", "success");
    });

    el("btnOpenInfo").addEventListener("click", () => {
      if (typeof window.cqcpOpenInfoDrawer === "function") window.cqcpOpenInfoDrawer(0);
    });
  } catch {
    setPillStatus("Offline", false);
    toast("Cannot load profile.", "error", 3200);
  }
}

init();
