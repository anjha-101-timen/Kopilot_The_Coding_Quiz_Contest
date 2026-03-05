const toastHost = () => document.getElementById("toastHost");

export function toast(message, variant = "default", timeoutMs = 2400) {
  const host = toastHost();
  if (!host) return;

  const el = document.createElement("div");
  el.className = `toast ${variant}`;
  el.innerHTML = `
    <div class="toastDot"></div>
    <div class="toastMsg"></div>
    <button class="toastX" aria-label="Dismiss">✕</button>
  `;
  el.querySelector(".toastMsg").textContent = message;

  const kill = () => {
    el.classList.add("out");
    setTimeout(() => el.remove(), 220);
  };

  el.querySelector(".toastX").addEventListener("click", kill);
  host.appendChild(el);

  setTimeout(() => el.classList.add("in"), 0);
  setTimeout(kill, timeoutMs);
}

export function setPillStatus(text, ok = false) {
  const pill = document.getElementById("statusPill");
  if (!pill) return;
  pill.classList.toggle("ok", ok);
  const t = pill.querySelector(".pillText");
  if (t) t.textContent = text;
}

export function shimmerList(container, items = 6) {
  if (!container) return;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < items; i++) {
    const sk = document.createElement("div");
    sk.className = "shimmerCard";
    sk.setAttribute("aria-hidden", "true");
    sk.innerHTML = `
      <div class="skLine w75"></div>
      <div class="skLine w55"></div>
      <div class="skLine w60"></div>
      <div class="skLine w40"></div>
    `;
    frag.appendChild(sk);
  }
  container.innerHTML = "";
  container.appendChild(frag);
}

export function qsa(root, sel) {
  return Array.from((root || document).querySelectorAll(sel));
}

export function clampText(s, n = 160) {
  if (!s) return "";
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

export function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}
