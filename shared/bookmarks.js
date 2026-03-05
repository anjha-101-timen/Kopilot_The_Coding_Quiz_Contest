import { db, api, COL } from "./firebase.js";
import { getDeviceId } from "./attempts.js";

function bookmarkId(deviceId, kind, targetId) {
  return `${String(deviceId)}__${String(kind)}__${String(targetId)}`;
}

function cacheKey(deviceId) {
  return `cqcp_bookmarks__${String(deviceId || "")}`;
}

function loadCache(deviceId) {
  try {
    const raw = localStorage.getItem(cacheKey(deviceId));
    const xs = raw ? JSON.parse(raw) : [];
    return Array.isArray(xs) ? xs : [];
  } catch {
    return [];
  }
}

function saveCache(deviceId, xs) {
  try {
    localStorage.setItem(cacheKey(deviceId), JSON.stringify(xs || []));
  } catch {
    // ignore
  }
}

export function isBookmarkedLocal(kind, targetId) {
  const deviceId = getDeviceId();
  const id = bookmarkId(deviceId, kind, targetId);
  return loadCache(deviceId).some((x) => String(x?.id || "") === id);
}

export async function loadMyBookmarks() {
  const deviceId = getDeviceId();
  const ref = api.collection(db, COL.BOOKMARKS);
  const q = api.query(ref, api.where("deviceId", "==", String(deviceId)));
  const snap = await api.getDocs(q);
  const xs = [];
  snap.forEach((d) => xs.push({ id: d.id, ...d.data() }));
  xs.sort((a, b) => Number(b.createdMs || 0) - Number(a.createdMs || 0));
  saveCache(deviceId, xs);
  return xs;
}

export async function toggleBookmark(kind, targetId, extra = {}) {
  const deviceId = getDeviceId();
  const id = bookmarkId(deviceId, kind, targetId);

  const cached = loadCache(deviceId);
  const exists = cached.some((x) => String(x?.id || "") === id);

  if (exists) {
    try {
      await api.deleteDoc(api.doc(db, COL.BOOKMARKS, id));
    } catch {
      // ignore
    }
    const next = cached.filter((x) => String(x?.id || "") !== id);
    saveCache(deviceId, next);
    return { bookmarked: false, id };
  }

  const now = Date.now();
  const payload = {
    deviceId: String(deviceId),
    kind: String(kind),
    targetId: String(targetId),
    createdMs: now,
    createdAt: api.serverTimestamp(),
    extra: extra && typeof extra === "object" ? extra : {}
  };

  try {
    await api.setDoc(api.doc(db, COL.BOOKMARKS, id), payload);
  } catch {
    // ignore
  }

  const next = [{ id, ...payload }, ...cached].slice(0, 200);
  saveCache(deviceId, next);
  return { bookmarked: true, id };
}
