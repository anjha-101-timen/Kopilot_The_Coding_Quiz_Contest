const KEY = "cqcp_theme_v2";

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    const d = raw ? JSON.parse(raw) : null;
    if (!d || typeof d !== "object") return { mode: "dark", accent: "violet", preset: "neon" };
    return {
      mode: d.mode === "light" ? "light" : "dark",
      accent: String(d.accent || "violet"),
      preset: String(d.preset || "neon")
    };
  } catch {
    return { mode: "dark", accent: "violet", preset: "neon" };
  }
}

function write(next) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function applyTheme({ mode, accent, preset }) {
  const m = mode === "light" ? "light" : "dark";
  const a = String(accent || "violet");
  const p = String(preset || "neon");
  document.documentElement.setAttribute("data-mode", m);
  document.documentElement.setAttribute("data-accent", a);
  document.documentElement.setAttribute("data-theme", p);
  const next = { mode: m, accent: a, preset: p };
  write(next);
  window.dispatchEvent(new CustomEvent("cqcp:theme", { detail: next }));
}

export function getTheme() {
  return read();
}

applyTheme(read());
