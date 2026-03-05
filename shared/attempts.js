import { db, api, COL } from "./firebase.js";

export function getDeviceId() {
  const k = "cqcp_device_id";
  let id = localStorage.getItem(k);
  if (id) return id;
  id = `dev_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
  localStorage.setItem(k, id);
  return id;
}

function profileKey(deviceId) {
  return `cqcp_profile__${String(deviceId || "")}`;
}

export function loadProfileLocal(deviceId) {
  try {
    const raw = localStorage.getItem(profileKey(deviceId));
    const p = raw ? JSON.parse(raw) : null;
    if (!p || typeof p !== "object") return { deviceId, cpTotal: 0, cpRank: 0, level: 1, progressUpdatedMs: 0, countedAttemptIds: [] };
    return {
      deviceId,
      cpTotal: Number(p.cpTotal || 0),
      cpRank: Number(p.cpRank || 0),
      level: Math.max(1, Number(p.level || 1)),
      progressUpdatedMs: Number(p.progressUpdatedMs || 0),
      countedAttemptIds: Array.isArray(p.countedAttemptIds) ? p.countedAttemptIds : []
    };
  } catch {
    return { deviceId, cpTotal: 0, cpRank: 0, level: 1, progressUpdatedMs: 0, countedAttemptIds: [] };
  }
}

export function saveProfileLocal(deviceId, profile) {
  try {
    localStorage.setItem(
      profileKey(deviceId),
      JSON.stringify(profile || { deviceId, cpTotal: 0, cpRank: 0, level: 1, progressUpdatedMs: 0, countedAttemptIds: [] })
    );
  } catch {
    // ignore
  }

  try {
    window.dispatchEvent(new CustomEvent("cqcp:profile", { detail: profile }));
  } catch {
    // ignore
  }
}

export function levelFromCpRank(cpRank) {
  const rank = Math.max(0, Number(cpRank || 0));
  return Math.max(1, Math.floor(rank / 100) + 1);
}

export function cpRankProgress(cpRank) {
  const rank = Math.max(0, Number(cpRank || 0));
  const level = levelFromCpRank(rank);
  const base = (level - 1) * 100;
  const inLevel = rank - base;
  return { level, inLevel: Math.max(0, Math.min(100, inLevel)), toNext: Math.max(0, 100 - inLevel) };
}

export function awardCpLocal(deviceId, attemptId, cpEarned) {
  const p = loadProfileLocal(deviceId);
  const id = String(attemptId || "");
  if (!id) return p;
  if (p.countedAttemptIds.includes(id)) return p;

  const deltaRank = Math.round(Number(cpEarned || 0) - 25);
  const nextRank = Math.max(0, Number(p.cpRank || 0) + deltaRank);
  const nextLevel = levelFromCpRank(nextRank);
  const progressUpdatedMs = Date.now();

  const next = {
    deviceId,
    cpTotal: Number(p.cpTotal || 0) + Math.max(0, Number(cpEarned || 0)),
    cpRank: nextRank,
    level: nextLevel,
    progressUpdatedMs,
    countedAttemptIds: [id, ...p.countedAttemptIds].slice(0, 250)
  };
  saveProfileLocal(deviceId, next);
  return next;
}

export async function loadProfileFirestore(deviceId) {
  const ref = api.doc(db, COL.PROFILES, String(deviceId));
  const snap = await api.getDoc(ref);
  if (!snap.exists()) return { deviceId, cpTotal: 0, cpRank: 0, level: 1, progressUpdatedMs: 0 };
  const d = snap.data() || {};
  return {
    deviceId,
    cpTotal: Number(d.cpTotal || 0),
    cpRank: Number(d.cpRank || 0),
    level: Math.max(1, Number(d.level || 1)),
    progressUpdatedMs: Number(d.progressUpdatedMs || 0)
  };
}

export async function syncProfile(deviceId) {
  const local = loadProfileLocal(deviceId);
  let remote = null;
  try {
    remote = await loadProfileFirestore(deviceId);
  } catch {
    remote = null;
  }

  const remoteTotal = Number(remote?.cpTotal || 0);

  const cpTotal = Math.max(Number(local.cpTotal || 0), remoteTotal);
  if (cpTotal !== Number(local.cpTotal || 0)) {
    local.cpTotal = cpTotal;
  }

  const remoteProgressMs = Number(remote?.progressUpdatedMs || 0);
  const localProgressMs = Number(local.progressUpdatedMs || 0);
  if (remoteProgressMs > localProgressMs) {
    local.cpRank = Number(remote?.cpRank || 0);
    local.level = Math.max(1, Number(remote?.level || 1));
    local.progressUpdatedMs = remoteProgressMs;
  }

  saveProfileLocal(deviceId, local);

  try {
    const ref = api.doc(db, COL.PROFILES, String(deviceId));
    await api.setDoc(
      ref,
      {
        deviceId: String(deviceId),
        cpTotal,
        cpRank: Number(local.cpRank || 0),
        level: Math.max(1, Number(local.level || 1)),
        progressUpdatedMs: Number(local.progressUpdatedMs || 0),
        updatedAt: api.serverTimestamp()
      },
      { merge: true }
    );
  } catch {
    // ignore
  }

  return {
    deviceId,
    cpTotal,
    cpRank: Number(local.cpRank || 0),
    level: Math.max(1, Number(local.level || 1)),
    progressUpdatedMs: Number(local.progressUpdatedMs || 0)
  };
}

function cacheKey(examId, deviceId) {
  return `cqcp_attempts_${String(examId || "")}__${String(deviceId || "")}`;
}

function queueKey(deviceId) {
  return `cqcp_attempt_queue__${String(deviceId || "")}`;
}

function analyticsQueueKey(deviceId) {
  return `cqcp_analytics_queue__${String(deviceId || "")}`;
}

export function attemptDocId(examId, deviceId, attemptNo) {
  return `${String(deviceId)}__${String(examId)}__${String(attemptNo)}`;
}

export function loadAttemptsLocal(examId, deviceId) {
  try {
    const raw = localStorage.getItem(cacheKey(examId, deviceId));
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function saveAttemptsLocal(examId, deviceId, attempts) {
  try {
    localStorage.setItem(cacheKey(examId, deviceId), JSON.stringify(attempts || []));
  } catch {
    // ignore
  }
}

export function upsertAttemptLocal(examId, deviceId, attemptDoc, max = 50) {
  const xs = loadAttemptsLocal(examId, deviceId);
  const next = [attemptDoc, ...xs.filter((x) => x.id !== attemptDoc.id)].slice(0, max);
  saveAttemptsLocal(examId, deviceId, next);
  return next;
}

export function loadQueueLocal(deviceId) {
  try {
    const raw = localStorage.getItem(queueKey(deviceId));
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function saveQueueLocal(deviceId, items) {
  try {
    localStorage.setItem(queueKey(deviceId), JSON.stringify(items || []));
  } catch {
    // ignore
  }
}

export function loadAnalyticsQueueLocal(deviceId) {
  try {
    const raw = localStorage.getItem(analyticsQueueKey(deviceId));
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function saveAnalyticsQueueLocal(deviceId, items) {
  try {
    localStorage.setItem(analyticsQueueKey(deviceId), JSON.stringify(items || []));
  } catch {
    // ignore
  }
}

export async function nextAttemptNo(examId, deviceId) {
  const local = loadAttemptsLocal(examId, deviceId);
  let last = 0;
  for (const a of local) last = Math.max(last, Number(a.attemptNo || 0));

  try {
    const ref = api.collection(db, COL.ATTEMPTS);
    const q = api.query(ref, api.where("examId", "==", examId), api.where("deviceId", "==", deviceId), api.orderBy("attemptNo", "desc"), api.limit(1));
    const snap = await api.getDocs(q);
    snap.forEach((d) => {
      last = Math.max(last, Number(d.data()?.attemptNo || 0));
    });
  } catch {
    // ignore
  }

  return last + 1;
}

export async function enqueueAttemptAndSync(examId, deviceId, attemptDoc, attemptAnalyticsDoc = null) {
  const queued = loadQueueLocal(deviceId);
  const nextQueue = [attemptDoc, ...queued.filter((x) => x.id !== attemptDoc.id)].slice(0, 50);
  saveQueueLocal(deviceId, nextQueue);
  upsertAttemptLocal(examId, deviceId, attemptDoc, 50);

  if (attemptAnalyticsDoc && typeof attemptAnalyticsDoc === "object") {
    const aq = loadAnalyticsQueueLocal(deviceId);
    const id = String(attemptAnalyticsDoc.id || "");
    if (id) {
      const nextAq = [attemptAnalyticsDoc, ...aq.filter((x) => String(x.id) !== id)].slice(0, 200);
      saveAnalyticsQueueLocal(deviceId, nextAq);
    }
  }

  // Award CP locally immediately (never blocks UI). Dedup by attempt id.
  try {
    awardCpLocal(deviceId, attemptDoc.id, Number(attemptDoc.cpEarned || 0));
  } catch {
    // ignore
  }
  syncProfile(deviceId).catch(() => {});

  await syncQueuedAttempts(deviceId);
  await syncQueuedAnalytics(deviceId);
}

export async function syncQueuedAnalytics(deviceId) {
  const queued = loadAnalyticsQueueLocal(deviceId);
  if (!queued.length) return { synced: 0, remaining: 0 };

  let synced = 0;
  const keep = [];

  for (const item of queued) {
    try {
      const id = String(item.id || "");
      if (!id) continue;
      const ref = api.doc(db, COL.ANALYTICS, id);
      const doc = {
        ...item,
        updatedAt: api.serverTimestamp()
      };
      await api.setDoc(ref, doc, { merge: true });
      synced++;
    } catch {
      keep.push(item);
    }
  }

  saveAnalyticsQueueLocal(deviceId, keep);
  return { synced, remaining: keep.length };
}

export async function syncQueuedAttempts(deviceId) {
  const queued = loadQueueLocal(deviceId);
  if (!queued.length) return { synced: 0, remaining: 0 };

  let synced = 0;
  const keep = [];

  for (const item of queued) {
    try {
      const id = String(item.id || "");
      if (!id) continue;
      const ref = api.doc(db, COL.ATTEMPTS, id);
      const doc = {
        examId: item.examId,
        deviceId: item.deviceId,
        createdAt: api.serverTimestamp(),
        createdMs: item.createdMs,
        examCode: item.examCode || "",
        attemptNo: Number(item.attemptNo || 0),
        cpEarned: Number(item.cpEarned || 0),
        summary: item.summary,
        items: item.items
      };
      await api.setDoc(ref, doc);
      synced++;
    } catch {
      keep.push(item);
    }
  }

  saveQueueLocal(deviceId, keep);
  syncProfile(deviceId).catch(() => {});
  return { synced, remaining: keep.length };
}

export async function loadAttemptsFirestore(examId, deviceId) {
  const ref = api.collection(db, COL.ATTEMPTS);
  const q = api.query(ref, api.where("examId", "==", examId), api.where("deviceId", "==", deviceId), api.orderBy("attemptNo", "asc"));
  const snap = await api.getDocs(q);
  const xs = [];
  snap.forEach((d) => xs.push({ id: d.id, ...d.data() }));
  return xs;
}

export function mergeAttempts(local, remote) {
  const map = new Map();
  for (const a of Array.isArray(remote) ? remote : []) map.set(String(a.id), a);
  for (const a of Array.isArray(local) ? local : []) {
    const id = String(a.id);
    if (!map.has(id)) map.set(id, a);
  }
  return Array.from(map.values()).sort((a, b) => Number(a.attemptNo || 0) - Number(b.attemptNo || 0));
}
