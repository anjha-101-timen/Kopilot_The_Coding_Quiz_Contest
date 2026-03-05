import { toast } from "/shared/ui.js";
import { applyTranslations } from "/shared/i18n.js";
import { LANG_GROUPS, findLangLabel, flattenLangs } from "/shared/langs.js";

const KEY = "cqcpLang";
const GROUP_KEY = "cqcpLangGroups";

function getLang(){
  try {
    return localStorage.getItem(KEY) || "en";
  } catch {
    return "en";
  }
}

function readGroupState(){
  try {
    const raw = localStorage.getItem(GROUP_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

function writeGroupState(next){
  try {
    localStorage.setItem(GROUP_KEY, JSON.stringify(next || {}));
  } catch {}
}

function setLang(code){
  const c = String(code || "en").trim() || "en";
  try {
    localStorage.setItem(KEY, c);
  } catch {}
  document.documentElement.setAttribute("lang", c);
  document.documentElement.setAttribute("data-lang", c);
  try {
    applyTranslations(c);
  } catch {
    // ignore
  }
  const active = document.getElementById("activeLang");
  if (active) active.textContent = findLangLabel(c);

  document.querySelectorAll(".langChip").forEach((b)=>{
    b.classList.toggle("on", b.getAttribute("data-code") === c);
  });
  document.querySelectorAll(".langCard").forEach((card)=>{
    card.classList.toggle("on", card.getAttribute("data-code") === c);
  });
}

function buildGroups(filterText){
  const root = document.getElementById("langSections");
  if (!root) return;

  const q = String(filterText || "").trim().toLowerCase();
  const groupState = readGroupState();

  root.innerHTML = "";
  const frag = document.createDocumentFragment();

  const flat = flattenLangs();

  for (const g of LANG_GROUPS){
    const langs = g.langs.filter((l)=>{
      if (!q) return true;
      const t = `${l.label} ${l.code} ${g.group}`.toLowerCase();
      return t.includes(q);
    });
    if (!langs.length) continue;

    const wrap = document.createElement("section");
    wrap.className = "langGroup";
    const isCollapsed = !q && groupState[g.group] === 0;
    if (isCollapsed) wrap.classList.add("is-collapsed");

    const head = document.createElement("div");
    head.className = "langGroupHead";
    head.setAttribute("role", "button");
    head.setAttribute("tabindex", "0");

    const title = document.createElement("div");
    title.className = "langGroupTitle";
    title.textContent = g.group;

    const meta = document.createElement("div");
    meta.className = "langGroupMeta";
    meta.textContent = `${langs.length} / ${g.langs.length}`;

    head.appendChild(title);
    head.appendChild(meta);

    const toggle = ()=>{
      if (q) return;
      wrap.classList.toggle("is-collapsed");
      const nowCollapsed = wrap.classList.contains("is-collapsed");
      const next = readGroupState();
      next[g.group] = nowCollapsed ? 0 : 1;
      writeGroupState(next);
    };
    head.addEventListener("click", toggle);
    head.addEventListener("keydown", (e)=>{
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    });

    const grid = document.createElement("div");
    grid.className = "langGrid";

    langs.forEach((l, idx)=>{
      const card = document.createElement("button");
      card.type = "button";
      card.className = "langCard";
      card.style.animationDelay = `${Math.min(240, idx * 12)}ms`;
      card.setAttribute("data-code", l.code);
      card.innerHTML = `
        <div class="langName">${l.label}</div>
        <div class="langCode">${l.code}</div>
      `;
      card.addEventListener("click", ()=>{
        setLang(l.code);
        toast(`Language set: ${l.label}`);
      });
      grid.appendChild(card);
    });

    wrap.appendChild(head);
    wrap.appendChild(grid);

    frag.appendChild(wrap);
  }

  root.appendChild(frag);

  const cur = getLang();
  document.querySelectorAll(".langCard").forEach((card)=>{
    card.classList.toggle("on", card.getAttribute("data-code") === cur);
  });
}

function mount(){
  setLang(getLang());

  const s = document.getElementById("langSearch");
  if (s) {
    s.addEventListener("input", ()=> buildGroups(s.value));
  }

  document.querySelectorAll(".langChip").forEach((b)=>{
    b.addEventListener("click", ()=>{
      const code = b.getAttribute("data-code");
      setLang(code);
      toast(`Language set: ${findLangLabel(code)}`);
    });
  });

  buildGroups("");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}
