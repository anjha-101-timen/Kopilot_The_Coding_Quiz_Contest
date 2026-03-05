import { db, api, COL } from "./firebase.js";
import { getDeviceId } from "./attempts.js";

function notifReadKey(deviceId) {
  return `cqcp_notif_read__${String(deviceId || "")}`;
}

export function loadNotifReadState() {
  const deviceId = getDeviceId();
  try {
    const raw = localStorage.getItem(notifReadKey(deviceId));
    const data = raw ? JSON.parse(raw) : {};
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

export function markNotifReadLocal(notificationId) {
  const deviceId = getDeviceId();
  const s = loadNotifReadState();
  s[String(notificationId)] = Date.now();
  try {
    localStorage.setItem(notifReadKey(deviceId), JSON.stringify(s));
  } catch {
    // ignore
  }
}

export function markAllReadLocal(ids) {
  const deviceId = getDeviceId();
  const s = loadNotifReadState();
  const now = Date.now();
  for (const id of ids || []) s[String(id)] = now;
  try {
    localStorage.setItem(notifReadKey(deviceId), JSON.stringify(s));
  } catch {
    // ignore
  }
}

export async function loadNotifications({ examId = "" } = {}) {
  const deviceId = getDeviceId();
  const ref = api.collection(db, COL.NOTIFICATIONS);

  const q = api.query(ref, api.where("audience", "in", ["all", String(deviceId)]));
  const snap = await api.getDocs(q);
  const xs = [];
  snap.forEach((d) => xs.push({ id: d.id, ...d.data() }));
  const filtered = examId ? xs.filter((x) => String(x.examId || "") === String(examId)) : xs;
  filtered.sort((a, b) => Number(b.createdMs || 0) - Number(a.createdMs || 0));
  return filtered;
}

export async function loadAnnouncements({ examId = "" } = {}) {
  const ref = api.collection(db, COL.ANNOUNCEMENTS);

  const clauses = [];
  if (examId) clauses.push(api.where("examId", "==", String(examId)));

  const q = api.query(ref, ...clauses);
  const snap = await api.getDocs(q);
  const xs = [];
  snap.forEach((d) => xs.push({ id: d.id, ...d.data() }));
  xs.sort((a, b) => Number(b.createdMs || 0) - Number(a.createdMs || 0));
  return xs;
}
