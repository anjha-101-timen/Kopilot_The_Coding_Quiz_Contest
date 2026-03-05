import { setPillStatus, toast } from "../shared/ui.js";
import { getDeviceId, loadProfileLocal, syncProfile } from "../shared/attempts.js";

const el = (id) => document.getElementById(id);

function getReferralLink(deviceId) {
  const base = window.location.origin;
  return `${base}/?ref=${encodeURIComponent(deviceId)}`;
}

async function copyReferralLink() {
  const deviceId = getDeviceId();
  const link = getReferralLink(deviceId);
  try {
    await navigator.clipboard.writeText(link);
    toast("Referral link copied!", "success", 2000);
  } catch {
    toast("Failed to copy link.", "error", 2000);
  }
}

async function shareReferralLink() {
  const deviceId = getDeviceId();
  const link = getReferralLink(deviceId);
  const title = "Join Coding Quiz Contest";
  const text = "Practice coding quizzes, earn CP, and compete with friends!";
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url: link });
    } catch {
      // ignore
    }
  } else {
    await copyReferralLink();
  }
}

function renderStats(profile) {
  const referrals = Number(profile.referralCount || 0);
  const cpEarned = Number(profile.referralCpEarned || 0);
  const pending = Number(profile.referralPending || 0);
  el("statReferrals").textContent = referrals;
  el("statCpEarned").textContent = cpEarned;
  el("statPending").textContent = pending;
}

async function init() {
  setPillStatus("Connected", true);
  const deviceId = getDeviceId();
  const profile = loadProfileLocal(deviceId);
  renderStats(profile);

  // Sync profile in background (best effort)
  syncProfile(deviceId)
    .then((p) => renderStats(p))
    .catch(() => {});

  el("btnCopy")?.addEventListener("click", copyReferralLink);
  el("btnShare")?.addEventListener("click", shareReferralLink);
}

init();
