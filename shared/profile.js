import { db, api, COL } from "./firebase.js";
import { getDeviceId, loadProfileLocal, saveProfileLocal, syncProfile } from "./attempts.js";

export function profileDisplayName(p) {
  const n = String(p?.displayName || "").trim();
  if (n) return n;
  const id = String(p?.deviceId || "");
  return id ? `Coder ${id.slice(0, 6)}` : "Coder";
}

export function profileInitials(p) {
  const n = profileDisplayName(p);
  const parts = n.split(/\s+/).filter(Boolean);
  const a = (parts[0] || "C").slice(0, 1);
  const b = (parts[1] || "").slice(0, 1);
  return (a + b).toUpperCase();
}

export function sanitizeProfileEdits(edits) {
  const displayName = String(edits?.displayName || "").trim().slice(0, 40);
  const bio = String(edits?.bio || "").trim().slice(0, 160);
  return { displayName, bio };
}

export async function loadMyProfile() {
  const deviceId = getDeviceId();
  const local = loadProfileLocal(deviceId);
  syncProfile(deviceId).catch(() => {});
  return local;
}

export async function saveMyProfileEdits(edits) {
  const deviceId = getDeviceId();
  const safe = sanitizeProfileEdits(edits);

  const local = loadProfileLocal(deviceId);
  const next = { ...local, ...safe, profileUpdatedMs: Date.now() };
  saveProfileLocal(deviceId, next);

  try {
    const ref = api.doc(db, COL.PROFILES, String(deviceId));
    await api.setDoc(
      ref,
      {
        deviceId: String(deviceId),
        displayName: safe.displayName,
        bio: safe.bio,
        profileUpdatedMs: Number(next.profileUpdatedMs || 0),
        updatedAt: api.serverTimestamp()
      },
      { merge: true }
    );
  } catch {
    // ignore
  }

  syncProfile(deviceId).catch(() => {});
  return next;
}
