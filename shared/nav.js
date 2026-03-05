import { getTheme, applyTheme } from "./theme.js";
import { getDeviceId, loadProfileLocal } from "./attempts.js";
import { applyTranslations } from "./i18n.js";
import { LANG_GROUPS } from "./langs.js";

function pathEndsWith(p) {
  const x = String(window.location.pathname || "").toLowerCase();
  return x.endsWith(p.toLowerCase());
}

function el(tag, cls) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  return n;
}

function iconText(name) {
  if (name === "leaderboard") return "🏆";
  if (name === "testseries") return "🧪";
  if (name === "branches") return "🧭";
  if (name === "contests") return "🏁";
  if (name === "languages") return "🌐";
  if (name === "settings") return "⚙";
  if (name === "about") return "ⓘ";
  if (name === "contact") return "✉";
  if (name === "refer") return "🎁";
  if (name === "bookmarks") return "★";
  if (name === "notifications") return "🔔";
  if (name === "announcements") return "📣";
  return "•";
}

function getAppBaseUrl() {
  // nav.js is loaded from ".../shared/nav.js".
  // "../" reliably points to the app root (".../") for http(s) hosting, subfolder hosting,
  // and file:// usage.
  try {
    return new URL("../", import.meta.url);
  } catch {
    try {
      return new URL(window.location.href);
    } catch {
      return null;
    }
  }
}

function resolveInternalHref(href) {
  const h = String(href || "");
  if (!h) return h;

  // Keep true external URLs untouched.
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(h)) return h;
  if (h.startsWith("#")) return h;

  const base = getAppBaseUrl();
  if (!base) return h;

  // Treat "/x" as "x" under app base (instead of server/filesystem root).
  if (h.startsWith("/")) {
    return new URL(h.slice(1), base).href;
  }
  return new URL(h, base).href;
}

function wireNavAnchor(a, href) {
  const resolved = resolveInternalHref(href);
  a.href = resolved;
  a.addEventListener("click", (e) => {
    // Fallback navigation path to guarantee redirect even in file:// mode.
    // (Allows middle click / cmd-click to keep default behavior.)
    if (e.defaultPrevented) return;
    if (e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    window.location.href = resolved;
  });
}

function mount() {
  if (document.getElementById("cqcpNavMounted")) return;

  const ZOOM_KEY = "siteZoom";
  const root = document.documentElement;
  const STEP = 0.08;
  const MIN = 0.6;
  const MAX = 1.6;
  function getZoom() {
    try {
      return parseFloat(localStorage.getItem(ZOOM_KEY)) || 1;
    } catch {
      return 1;
    }
  }
  function setZoom(v) {
    const next = Math.min(MAX, Math.max(MIN, v));
    try {
      localStorage.setItem(ZOOM_KEY, String(next));
    } catch {}
    root.style.setProperty("--zoom", String(next));
  }
  setZoom(getZoom());

  const FONT_KEY = "cqcpFont";
  const LANG_KEY = "cqcpLang";
  function getFont() {
    try {
      return localStorage.getItem(FONT_KEY) || "Ubuntu";
    } catch {
      return "Ubuntu";
    }
  }
  function setFont(name) {
    const n = String(name || "Ubuntu").trim() || "Ubuntu";
    try {
      localStorage.setItem(FONT_KEY, n);
    } catch {}

    // Use the chosen font first; fall back to the large sans stack defined in CSS.
    root.style.setProperty("--font-ui", `"${n}", var(--sansStack)`);
    root.setAttribute("data-font", n);
  }
  function getLang() {
    try {
      return localStorage.getItem(LANG_KEY) || "en";
    } catch {
      return "en";
    }
  }
  function setLang(code) {
    const c = String(code || "en").trim() || "en";
    try {
      localStorage.setItem(LANG_KEY, c);
    } catch {}
    document.documentElement.setAttribute("lang", c);
    root.setAttribute("data-lang", c);
    try {
      applyTranslations(c);
    } catch {
      // ignore
    }
  }
  setFont(getFont());
  setLang(getLang());

  const mark = el("div");
  mark.id = "cqcpNavMounted";
  mark.style.display = "none";
  document.body.appendChild(mark);

  const SIDE_KEY = "cqcpSideCollapsed";
  function isCollapsed() {
    try {
      return localStorage.getItem(SIDE_KEY) === "1";
    } catch {
      return false;
    }
  }
  function setCollapsed(v) {
    document.body.classList.add("cqcpHasSide");
    document.body.classList.toggle("cqcpSideCollapsed", !!v);
    try {
      localStorage.setItem(SIDE_KEY, v ? "1" : "0");
    } catch {}
  }

  const toggle = el("button", "cqcpSideToggle");
  toggle.type = "button";
  toggle.title = "Toggle menu";
  toggle.setAttribute("aria-label", "Toggle menu");
  toggle.textContent = "☰";
  toggle.addEventListener("click", () => setCollapsed(!document.body.classList.contains("cqcpSideCollapsed")));
  document.body.appendChild(toggle);

  const RIGHT_KEY = "cqcpRightCollapsed";
  function isRightCollapsed() {
    try {
      return localStorage.getItem(RIGHT_KEY) === "1";
    } catch {
      return true; // default collapsed
    }
  }
  function setRightCollapsed(v) {
    document.body.classList.add("cqcpHasRight");
    document.body.classList.toggle("cqcpRightCollapsed", !!v);
    try {
      localStorage.setItem(RIGHT_KEY, v ? "1" : "0");
    } catch {}
  }

  // CP chip removed from topbar

  const side = el("aside", "cqcpSide");
  document.body.classList.add("cqcpHasSide");

  const sideTop = el("div", "cqcpSideTop");
  const sideBrand = el("div", "cqcpSideBrand");
  sideBrand.innerHTML = `<div class="cqcpSideTitle"><span class="word-coding">Coding</span> <span class="word-quiz">Quiz</span> <span class="word-contest">Contest</span></div>`;
  sideTop.appendChild(sideBrand);

  const primary = el("nav", "cqcpSidePrimary");
  const crud = [
    { label: "C", href: "/create/create.html", on: pathEndsWith("/create/create.html"), color: "create", titleKey: "crud.create" },
    { label: "R", href: "/read/read.html", on: pathEndsWith("/read/read.html"), color: "read", titleKey: "crud.read" },
    { label: "U", href: "/update/update.html", on: pathEndsWith("/update/update.html"), color: "update", titleKey: "crud.update" },
    { label: "D", href: "/delete/delete.html", on: pathEndsWith("/delete/delete.html"), color: "delete", titleKey: "crud.delete" }
  ];
  for (const c of crud) {
    const a = el("a", `cqcpSideLink cqcpSideLinkCRUD cqcpSideLink--${c.color}${c.on ? " on" : ""}`);
    wireNavAnchor(a, c.href);
    a.textContent = c.label;
    a.setAttribute("data-i18n-title", c.titleKey);
    a.title = c.label === "C" ? "Create" : c.label === "R" ? "Read" : c.label === "U" ? "Update" : "Delete";
    primary.appendChild(a);
  }
  sideTop.appendChild(primary);

  // Right panel toggle
  const rightToggle = el("button", "cqcpRightToggle");
  rightToggle.type = "button";
  rightToggle.title = "Preferences";
  rightToggle.setAttribute("aria-label", "Preferences");
  rightToggle.textContent = "⫶";
  rightToggle.addEventListener("click", () => setRightCollapsed(!document.body.classList.contains("cqcpRightCollapsed")));
  document.body.appendChild(rightToggle);

  const right = el("aside", "cqcpRight");
  document.body.classList.add("cqcpHasRight");
  const rightInner = el("div", "cqcpRightInner");

  const prefTitle = el("div", "cqcpRightTitle");
  prefTitle.setAttribute("data-i18n", "pref.title");
  prefTitle.textContent = "Preferences";
  rightInner.appendChild(prefTitle);

  const zoomCard = el("div", "cqcpRightCard");
  zoomCard.innerHTML = `
    <div class="cqcpRightCardTitle" data-i18n="pref.zoom">Zoom</div>
    <div class="cqcpRightRow">
      <button class="cqcpRightBtn" type="button" id="cqcpZoomOut" aria-label="Zoom out">−</button>
      <div class="cqcpRightValue" id="cqcpZoomVal"></div>
      <button class="cqcpRightBtn" type="button" id="cqcpZoomIn" aria-label="Zoom in">+</button>
    </div>
  `;
  rightInner.appendChild(zoomCard);

  const fontCard = el("div", "cqcpRightCard");
  fontCard.innerHTML = `
    <div class="cqcpRightCardTitle" data-i18n="pref.font">Font</div>
    <select class="cqcpRightSelect" id="cqcpFontSelect" aria-label="Font"></select>
    <div class="cqcpRightHint" data-i18n="pref.appliesSiteWide">Applies site-wide</div>
  `;
  rightInner.appendChild(fontCard);

  const langCard = el("div", "cqcpRightCard");
  langCard.innerHTML = `
    <div class="cqcpRightCardTitle" data-i18n="pref.lang">Language</div>
    <select class="cqcpRightSelect" id="cqcpLangSelect" aria-label="Language"></select>
    <div class="cqcpRightHint" data-i18n="pref.langHint">UI preference (content translation depends on page)</div>
  `;
  rightInner.appendChild(langCard);

  right.appendChild(rightInner);
  document.body.appendChild(right);

  const zoomVal = right.querySelector("#cqcpZoomVal");
  const setZoomLabel = () => {
    if (!zoomVal) return;
    zoomVal.textContent = `${Math.round(getZoom() * 100)}%`;
  };
  setZoomLabel();
  right.querySelector("#cqcpZoomOut")?.addEventListener("click", () => {
    setZoom(getZoom() - STEP);
    setZoomLabel();
  });
  right.querySelector("#cqcpZoomIn")?.addEventListener("click", () => {
    setZoom(getZoom() + STEP);
    setZoomLabel();
  });

  const fontSel = right.querySelector("#cqcpFontSelect");
  const langSel = right.querySelector("#cqcpLangSelect");

  const fontCatalog = [
    // Default / system-friendly
    "Ubuntu","Inter","Roboto","Open Sans","Noto Sans","Lato","Poppins","Montserrat","Nunito","Raleway",
    "Source Sans 3","Work Sans","Rubik","Quicksand","Fira Sans","IBM Plex Sans","PT Sans","Karla","Mulish","Manrope",
    "Cabin","Barlow","Barlow Condensed","Barlow Semi Condensed","Titillium Web","Hind","Hind Madurai","Assistant","M PLUS 1p","M PLUS Rounded 1c",
    "DM Sans","Urbanist","Jost","Sora","Space Grotesk","Plus Jakarta Sans","Archivo","Overpass","Varela Round","Lexend",
    "Oxygen","Dosis","Exo 2","Tajawal","Public Sans","Encode Sans","Prompt","Heebo","Arimo","Figtree",
    // More popular display/UI options (still readable)
    "Segoe UI","Helvetica Neue","Avenir","Avenir Next","SF Pro Display","SF Pro Text","Arial","Verdana","Tahoma","Trebuchet MS",
    // Keep extending: large list (request: up to 250)
    "Alegreya Sans","Merriweather Sans","Crimson Pro","Libre Franklin","Libre Baskerville","Source Serif 4","Playfair Display","Merriweather","Lora","EB Garamond",
    "Bitter","Roboto Slab","Arvo","Vollkorn","PT Serif","Cormorant Garamond","Spectral","Zilla Slab","Gentium Book Plus","Domine",
    "JetBrains Mono","Fira Code","Source Code Pro","IBM Plex Mono","Roboto Mono","Space Mono","Inconsolata","Cascadia Code","Hack","Ubuntu Mono",
    // Long tail (common Google Fonts, readable)
    "Alegreya","Alegreya SC","Alegreya Sans SC","Amiko","Anaheim","Andika","Asap","Asap Condensed","Atkinson Hyperlegible","Baloo 2",
    "Be Vietnam Pro","Belleza","BenchNine","BioRhyme","Biryani","Bree Serif","Cairo","Cambay","Catamaran","Chivo",
    "Commissioner","Cousine","Crete Round","Didact Gothic","Domine","Economica","Eczar","El Messiri","Encode Sans Condensed","Epilogue",
    "Faustina","Fjord One","Francois One","Glegoo","Gudea","Hammersmith One","Harmattan","Inria Sans","Istok Web","Josefin Sans",
    "Kanit","Khand","Kite One","Kreon","Laila","Ledger","Lilita One","Livvic","Mada","Martel",
    "Martel Sans","Maven Pro","Merienda","Metrophobic","Monda","Mukta","Mukta Mahee","News Cycle","Nobile","Padauk",
    "Pathway Gothic One","Petit Formal Script","Play","Questrial","Rambla","Rasa","Readex Pro","Sanchez","Sarabun","Signika",
    "Signika Negative","Sintony","Spectral SC","Sriracha","Syne","Teko","Tenor Sans","Text Me One","Ubuntu Condensed","Yantramanav",
    "Zen Kaku Gothic New","Zen Maru Gothic","ZCOOL XiaoWei","ZCOOL QingKe HuangYou","Zeyada",
    // Fillers to approach requested breadth (browser will fallback if missing)
    "Proxima Nova","Sofia Pro","Circular Std","Gilroy","Product Sans","Google Sans","San Francisco","Myriad Pro","Frutiger","DIN",
    "DIN Next","Helvetica","Neue Haas Grotesk","GT Walsheim","Graphik","TT Commons","Basis Grotesque","Maison Neue","Apercu","Brown",
    "Calibre","National","Brandon Grotesque","Whitney","Gotham","Euclid Circular A","Canela","Tiempos Text","Sailec","Atlas Grotesk",
    "FF DIN","Akzidenz-Grotesk","Univers","Optima","Palatino","Bookman","Candara","Corbel","Century Gothic","Franklin Gothic"
  ];
  const seen = new Set();
  const fontsUnique = fontCatalog.filter((f) => {
    const k = String(f).toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  if (fontSel) {
    for (const f of fontsUnique) {
      const o = document.createElement("option");
      o.value = f;
      o.textContent = f;
      fontSel.appendChild(o);
    }
    fontSel.value = getFont();
    fontSel.addEventListener("change", () => setFont(fontSel.value));
  }

  if (langSel) {
    langSel.innerHTML = "";
    for (const g of LANG_GROUPS) {
      const og = document.createElement("optgroup");
      og.label = g.group;
      for (const l of g.langs) {
        const o = document.createElement("option");
        o.value = l.code;
        o.textContent = l.label;
        og.appendChild(o);
      }
      langSel.appendChild(og);
    }
    langSel.value = getLang();
    langSel.addEventListener("change", () => setLang(langSel.value));
  }

  const sideBottom = el("div", "cqcpSideBottom");
  const topOpts = [
    { key: "nav.codersTester", label: "Coders Tester", href: "/testseries/testseries.html", icon: "testseries" },
    { key: "nav.branches", label: "Branches", href: "/branches/branches.html", icon: "branches" },
    { key: "nav.contests", label: "Contests", href: "/contests/contests.html", icon: "contests" },
    { key: "nav.languages", label: "Languages", href: "/languages/languages.html", icon: "languages" },
    { key: "nav.leaderboard", label: "Leaderboard", href: "/leaderboard/leaderboard.html", icon: "leaderboard" },
    { key: "nav.notifications", label: "Notifications", href: "/notifications/notifications.html", icon: "notifications" },
    { key: "nav.bookmarks", label: "Bookmarks", href: "/bookmarks/bookmarks.html", icon: "bookmarks" },
    { key: "nav.announcements", label: "Announcements", href: "/hub/hub.html#ann", icon: "announcements" }
  ];
  for (const o of topOpts) {
    const a = el("a", "cqcpSideOption");
    wireNavAnchor(a, o.href);
    a.innerHTML = `<span class="cqcpSideOptionIcon">${iconText(o.icon)}</span><span class="cqcpSideOptionText" data-i18n="${o.key}">${o.label}</span>`;
    sideBottom.appendChild(a);
  }

  const setBtn = el("button", "cqcpSideOption cqcpSideOptionBtn");
  setBtn.type = "button";
  setBtn.innerHTML = `<span class="cqcpSideOptionIcon">${iconText("settings")}</span><span class="cqcpSideOptionText" data-i18n="nav.settings">Settings</span>`;
  sideBottom.appendChild(setBtn);

  const bottomOpts = [
    { key: "nav.refer", label: "Refer & Earn", href: "/refer/refer.html", icon: "refer" },
    { key: "nav.about", label: "About", href: "/about/about.html", icon: "about" },
    { key: "nav.contact", label: "Contact", href: "/contact/contact.html", icon: "contact" }
  ];
  for (const o of bottomOpts) {
    const a = el("a", "cqcpSideOption");
    wireNavAnchor(a, o.href);
    a.innerHTML = `<span class="cqcpSideOptionIcon">${iconText(o.icon)}</span><span class="cqcpSideOptionText" data-i18n="${o.key}">${o.label}</span>`;
    sideBottom.appendChild(a);
  }

  side.appendChild(sideTop);
  side.appendChild(sideBottom);
  document.body.appendChild(side);

  setCollapsed(isCollapsed());
  setRightCollapsed(isRightCollapsed());

  // Apply translations to the newly created sidebar/prefs panel immediately.
  try {
    applyTranslations(getLang());
  } catch {
    // ignore
  }

  function updateCpPanel(profile) {
    const p = profile && typeof profile === "object" ? profile : { cpTotal: 0, cpRank: 0, level: 1 };
    const cpTotal = Math.max(0, Number(p.cpTotal || 0));
    const cpRank = Math.max(0, Number(p.cpRank || 0));
    const level = Math.max(1, Number(p.level || 1));

    const cp = document.getElementById("cpPanelCpTotal");
    const lvl = document.getElementById("cpPanelLevel");
    const rank = document.getElementById("cpPanelRank");
    if (cp) cp.textContent = String(cpTotal);
    if (lvl) lvl.textContent = `Level ${level}`;
    if (rank) rank.textContent = `CP Rank ${cpRank}`;
  }

  // Restore the original CP widget drawer markup (from screenshots)
  const cpBackdrop = el("div", "cpWidgetBackdrop");
  const cpDrawer = el("div", "cpWidgetDrawer");
  cpDrawer.innerHTML = `
    <div class="cpWidgetHead">
      <div class="cpWidgetTitleRow">
        <div class="cpWidgetTitle">Code Points</div>
      </div>
      <button class="cpWidgetIconBtn" aria-label="Close" onclick="this.closest('.cpWidgetBackdrop').classList.remove('show'); this.closest('.cpWidgetDrawer').classList.remove('show')">✕</button>
    </div>
    <div class="cpWidgetSegs">
      <div class="cpWidgetSeg"><span style="width: 65%"></span></div>
      <div class="cpWidgetSeg"><span style="width: 40%"></span></div>
      <div class="cpWidgetSeg"><span style="width: 85%"></span></div>
    </div>
    <div class="cpWidgetBody">
      <div class="cpWidgetSlide show">
        <div class="cpWidgetHero">
          <div class="cpWidgetCenter">
            <div class="cpWidgetBig" id="cpPanelCpTotal">0</div>
            <div class="cpWidgetSub">Current CP</div>
            <div class="cpWidgetKpis">
              <div class="cpWidgetKpi"><div class="cpWidgetKpiVal" id="cpPanelLevel">Level 1</div><div class="cpWidgetKpiLab">Current Level</div></div>
              <div class="cpWidgetKpi"><div class="cpWidgetKpiVal" id="cpPanelRank">CP Rank 0</div><div class="cpWidgetKpiLab">Current Rank</div></div>
            </div>
            <div class="cpWidgetProgress">
              <div>Progress to Level 2</div>
              <div class="cpWidgetBar"><span style="width: 65%"></span></div>
            </div>
            <div class="cpWidgetNote">Complete more quizzes and contests to earn CP and level up!</div>
          </div>
        </div>
        <div class="cpWidgetLevelStrip">
          <div class="cpWidgetLevelBadge"><div class="cpWidgetLevelNum">1</div><div class="cpWidgetLevelLab">Beginner</div></div>
          <div class="cpWidgetLevelBadge"><div class="cpWidgetLevelNum">2</div><div class="cpWidgetLevelLab">Rising</div></div>
          <div class="cpWidgetLevelBadge"><div class="cpWidgetLevelNum">3</div><div class="cpWidgetLevelLab">Skilled</div></div>
          <div class="cpWidgetLevelBadge"><div class="cpWidgetLevelNum">4</div><div class="cpWidgetLevelLab">Expert</div></div>
          <div class="cpWidgetLevelBadge"><div class="cpWidgetLevelNum">5</div><div class="cpWidgetLevelLab">Master</div></div>
        </div>
        <div class="cpWidgetZones">
          <div class="cpWidgetZoneCard prom">
            <div class="cpWidgetZoneIcon">🏆</div>
            <div>
              <div class="cpWidgetZoneTitle">Premium Zone</div>
              <div class="cpWidgetZoneDesc">Exclusive contests and rewards for top performers.</div>
            </div>
          </div>
          <div class="cpWidgetZoneCard safe">
            <div class="cpWidgetZoneIcon">🛡️</div>
            <div>
              <div class="cpWidgetZoneTitle">Safe Zone</div>
              <div class="cpWidgetZoneDesc">Practice and improve without risks.</div>
            </div>
          </div>
          <div class="cpWidgetZoneCard demo">
            <div class="cpWidgetZoneIcon">🎯</div>
            <div>
              <div class="cpWidgetZoneTitle">Demo Zone</div>
              <div class="cpWidgetZoneDesc">Try new features and provide feedback.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="cpWidgetFooter">
      <button class="cpWidgetNavBtn">History</button>
      <button class="cpWidgetNavBtn primary">Rewards</button>
    </div>
  `;
  cpBackdrop.appendChild(cpDrawer);
  document.body.appendChild(cpBackdrop);

  try {
    const deviceId = getDeviceId();
    updateCpPanel(loadProfileLocal(deviceId));
  } catch {
    updateCpPanel(null);
  }

  window.addEventListener("cqcp:profile", (e) => {
    try {
      if (e?.detail) updateCpPanel(e.detail);
    } catch {
      // ignore
    }
  });

  const back = el("div", "cqcpSettingsBack");
  const modal = el("div", "cqcpSettingsModal");
  const head = el("div", "cqcpSettingsHead");
  const title = el("div");
  title.style.fontWeight = "850";
  title.style.letterSpacing = "-.02em";
  title.textContent = "Settings";
  head.appendChild(title);

  const close = el("button", "iconBtn");
  close.type = "button";
  close.textContent = "✕";
  head.appendChild(close);

  const body = el("div", "cqcpSettingsBody");
  const grid = el("div", "cqcpSettingsGrid");

  const presetCard = el("div", "panel cardlike");
  presetCard.style.margin = "0";
  presetCard.innerHTML = `
    <div style="font-weight:800; letter-spacing:-.02em">Theme Presets</div>
    <div class="small" style="margin-top:8px">Neon, Game, Corporate, and Exam looks — instantly applied site-wide.</div>
    <div class="row" style="margin-top:12px; flex-wrap:wrap">
      <button class="btn" id="cqcpPresetNeon" type="button">Neon</button>
      <button class="btn" id="cqcpPresetGame" type="button">Game</button>
      <button class="btn" id="cqcpPresetCorporate" type="button">Corporate</button>
      <button class="btn" id="cqcpPresetExam" type="button">Exam</button>
      <button class="btn" id="cqcpPresetLeetCode" type="button">LeetCode</button>
    </div>
  `;

  const modeCard = el("div", "panel cardlike");
  modeCard.style.margin = "0";
  modeCard.innerHTML = `
    <div style="font-weight:800; letter-spacing:-.02em">Appearance</div>
    <div class="small" style="margin-top:8px">Switch between Dark and Light mode.</div>
    <div class="row" style="margin-top:12px; flex-wrap:wrap">
      <button class="btn" id="cqcpModeDark" type="button">Dark</button>
      <button class="btn" id="cqcpModeLight" type="button">Light</button>
    </div>
  `;

  const accentCard = el("div", "panel cardlike");
  accentCard.style.margin = "0";
  accentCard.innerHTML = `
    <div style="font-weight:800; letter-spacing:-.02em">Theme Accent</div>
    <div class="small" style="margin-top:8px">Pick an accent that matches your vibe.</div>
    <div class="cqcpSwatchRow" id="cqcpSwatches"></div>
  `;

  grid.appendChild(presetCard);
  grid.appendChild(modeCard);
  grid.appendChild(accentCard);
  body.appendChild(grid);

  modal.appendChild(head);
  modal.appendChild(body);
  back.appendChild(modal);
  document.body.appendChild(back);

  const accents = [
    { key: "violet", bg: "linear-gradient(135deg,#8B5CF6,#22D3EE,#EC4899)" },
    { key: "emerald", bg: "linear-gradient(135deg,#10B981,#22D3EE,#8B5CF6)" },
    { key: "amber", bg: "linear-gradient(135deg,#F59E0B,#EC4899,#8B5CF6)" },
    { key: "blue", bg: "linear-gradient(135deg,#3B82F6,#22D3EE,#10B981)" },
    { key: "leetcode", bg: "linear-gradient(135deg,#FFA116,#FFD28A,#22C55E)" }
  ];

  const sw = modal.querySelector("#cqcpSwatches");
  for (const a of accents) {
    const s = el("button", "cqcpSwatch");
    s.type = "button";
    s.title = a.key;
    s.style.background = a.bg;
    s.addEventListener("click", () => {
      const cur = getTheme();
      applyTheme({ ...cur, accent: a.key });
    });
    sw.appendChild(s);
  }

  modal.querySelector("#cqcpPresetNeon").addEventListener("click", () => {
    const cur = getTheme();
    applyTheme({ ...cur, preset: "neon" });
  });
  modal.querySelector("#cqcpPresetGame").addEventListener("click", () => {
    const cur = getTheme();
    applyTheme({ ...cur, preset: "game" });
  });
  modal.querySelector("#cqcpPresetCorporate").addEventListener("click", () => {
    const cur = getTheme();
    applyTheme({ ...cur, preset: "corporate" });
  });
  modal.querySelector("#cqcpPresetExam").addEventListener("click", () => {
    const cur = getTheme();
    applyTheme({ ...cur, preset: "exam" });
  });

  modal.querySelector("#cqcpPresetLeetCode").addEventListener("click", () => {
    const cur = getTheme();
    applyTheme({ ...cur, preset: "leetcode", accent: cur.accent === "violet" ? "leetcode" : cur.accent });
  });

  function openSettings() {
    back.classList.add("open");
  }
  function closeSettings() {
    back.classList.remove("open");
  }

  setBtn.addEventListener("click", openSettings);
  close.addEventListener("click", closeSettings);
  back.addEventListener("click", (e) => {
    if (e.target === back) closeSettings();
  });

  modal.querySelector("#cqcpModeDark").addEventListener("click", () => {
    const cur = getTheme();
    applyTheme({ ...cur, mode: "dark" });
  });
  modal.querySelector("#cqcpModeLight").addEventListener("click", () => {
    const cur = getTheme();
    applyTheme({ ...cur, mode: "light" });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}
