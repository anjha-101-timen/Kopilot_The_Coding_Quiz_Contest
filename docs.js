const MODULES = [
  {
    id: "about",
    icon: "ℹ",
    title: "about/",
    desc: "Story, mission, and credibility — the ‘why’ behind the platform.",
    pages: ["about/about.html"],
    css: ["about/about.css"],
    js: ["about/about.js"],
    highlights: [
      "Hero banner + feature grid",
      "Motivation-first messaging",
      "Consistent shared layout",
    ],
    cta: { label: "Open About", href: "./about/about.html" },
    tags: ["Page", "Brand"],
  },
  {
    id: "bookmarks",
    icon: "🔖",
    title: "bookmarks/",
    desc: "Save exams and questions — revisit important content instantly.",
    pages: ["bookmarks/bookmarks.html"],
    css: ["bookmarks/bookmarks.css"],
    js: ["bookmarks/bookmarks.js", "shared/bookmarks.js"],
    highlights: ["Empty state", "Refresh", "Fast revisit workflow"],
    cta: { label: "Open Bookmarks", href: "./bookmarks/bookmarks.html" },
    tags: ["User", "Productivity"],
  },
  {
    id: "branches",
    icon: "🧭",
    title: "branches/",
    desc: "Explore curated computer science fields — pick a path and start learning.",
    pages: ["branches/branches.html"],
    css: ["branches/branches.css"],
    js: ["branches/branches.js"],
    highlights: ["Card-based explorer", "Explore/Start actions", "Curated fields"],
    cta: { label: "Open Branches", href: "./branches/branches.html" },
    tags: ["Explore", "Roadmap"],
  },
  {
    id: "contact",
    icon: "✉",
    title: "contact/",
    desc: "Feedback and collaboration — contact info + clean UX.",
    pages: ["contact/contact.html"],
    css: ["contact/contact.css"],
    js: ["contact/contact.js"],
    highlights: ["Hero banner", "Info blocks", "Form-like layout"],
    cta: { label: "Open Contact", href: "./contact/contact.html" },
    tags: ["Page", "Support"],
  },
  {
    id: "create",
    icon: "➕",
    title: "create/",
    desc: "Create exams and frame questions — then publish to Firestore.",
    pages: ["create/create.html"],
    css: ["create/create.css"],
    js: ["create/create.js"],
    highlights: ["Exam configuration", "Question framing", "Publish workflow"],
    cta: { label: "Open Create", href: "./create/create.html" },
    tags: ["CRUD", "Admin"],
  },
  {
    id: "read",
    icon: "📚",
    title: "read/",
    desc: "Browse exams, open question banks, start contests, view results.",
    pages: ["read/read.html"],
    css: ["read/read.css"],
    js: ["read/read.js", "shared/exams.js", "shared/questions.js"],
    highlights: ["Exam grid", "Question list", "Start/Results/Manage"],
    cta: { label: "Open Read", href: "./read/read.html" },
    tags: ["CRUD", "User"],
  },
  {
    id: "update",
    icon: "✏",
    title: "update/",
    desc: "Edit questions safely — manage exams and save changes.",
    pages: ["update/update.html"],
    css: ["update/update.css"],
    js: ["update/update.js"],
    highlights: ["Exam selection", "Question editor", "Save changes"],
    cta: { label: "Open Update", href: "./update/update.html" },
    tags: ["CRUD", "Admin"],
  },
  {
    id: "delete",
    icon: "🗑",
    title: "delete/",
    desc: "Permanent deletion with guardrails — keep your bank clean.",
    pages: ["delete/delete.html"],
    css: ["delete/delete.css"],
    js: ["delete/delete.js"],
    highlights: ["Exam selection", "Delete actions", "Preview"],
    cta: { label: "Open Delete", href: "./delete/delete.html" },
    tags: ["CRUD", "Admin"],
  },
  {
    id: "play",
    icon: "⏱",
    title: "play/",
    desc: "Contest runner — question timer, palette, and attempt flow.",
    pages: ["play/play.html"],
    css: ["play/play.css"],
    js: ["play/play.js", "shared/attempts.js"],
    highlights: ["Per-question timer", "Palette", "Mark for review"],
    cta: { label: "Open Play", href: "./play/play.html" },
    tags: ["Gameplay"],
  },
  {
    id: "results",
    icon: "📊",
    title: "results/",
    desc: "Score breakdown and attempt history — learn from every round.",
    pages: ["results/results.html"],
    css: ["results/results.css"],
    js: ["results/results.js"],
    highlights: ["Type analysis", "Attempt history", "CP chips"],
    cta: { label: "Open Results", href: "./results/results.html" },
    tags: ["Analytics"],
  },
  {
    id: "leaderboard",
    icon: "🏆",
    title: "leaderboard/",
    desc: "CP ranking — competitive layer for motivation.",
    pages: ["leaderboard/leaderboard.html"],
    css: ["leaderboard/leaderboard.css"],
    js: ["leaderboard/leaderboard.js"],
    highlights: ["Rank list", "Hero", "Info panel"],
    cta: { label: "Open Leaderboard", href: "./leaderboard/leaderboard.html" },
    tags: ["Competition"],
  },
  {
    id: "profile",
    icon: "👤",
    title: "profile/",
    desc: "Identity + stats — display name, bio, CP, rank, device.",
    pages: ["profile/profile.html"],
    css: ["profile/profile.css"],
    js: ["profile/profile.js", "shared/profile.js"],
    highlights: ["Editable profile", "Local-first stats", "Save"],
    cta: { label: "Open Profile", href: "./profile/profile.html" },
    tags: ["User"],
  },
  {
    id: "hub",
    icon: "🧩",
    title: "hub/",
    desc: "Contest hub — tabs, stats, announcements, and quick navigation.",
    pages: ["hub/hub.html"],
    css: ["hub/hub.css"],
    js: ["hub/hub.js"],
    highlights: ["Tabs", "Contest stats", "Jump actions"],
    cta: { label: "Open Hub", href: "./hub/hub.html" },
    tags: ["Contest"],
  },
  {
    id: "contest",
    icon: "🗓",
    title: "contest/",
    desc: "Admin-style contest management — filters + create contest.",
    pages: ["contest/contest.html"],
    css: ["contest/contest.css"],
    js: ["contest/contest.js"],
    highlights: ["Status filter", "Date range", "Create contest"],
    cta: { label: "Open Contest Hub", href: "./contest/contest.html" },
    tags: ["Admin"],
  },
  {
    id: "contests",
    icon: "🧾",
    title: "contests/",
    desc: "Contest listings — powerful filters and table layout.",
    pages: ["contests/contests.html"],
    css: ["contests/contests.css"],
    js: ["contests/contests.js"],
    highlights: ["Live/Upcoming/Past tabs", "Filter grid", "Table view"],
    cta: { label: "Open Contests", href: "./contests/contests.html" },
    tags: ["Contest"],
  },
  {
    id: "notifications",
    icon: "🔔",
    title: "notifications/",
    desc: "Updates and alerts — filter by examId, mark read.",
    pages: ["notifications/notifications.html"],
    css: ["notifications/notifications.css"],
    js: ["notifications/notifications.js"],
    highlights: ["Filters", "Mark all read", "Empty state"],
    cta: { label: "Open Notifications", href: "./notifications/notifications.html" },
    tags: ["Productivity"],
  },
  {
    id: "languages",
    icon: "🌐",
    title: "languages/",
    desc: "Language selection — instant apply across the site.",
    pages: ["languages/languages.html"],
    css: ["languages/languages.css"],
    js: ["languages/languages.js", "shared/i18n.js", "shared/langs.js"],
    highlights: ["Search languages", "Quick chips", "Instant apply"],
    cta: { label: "Open Languages", href: "./languages/languages.html" },
    tags: ["i18n"],
  },
  {
    id: "refer",
    icon: "🤝",
    title: "refer/",
    desc: "Refer & Earn — share link, track stats, read FAQs.",
    pages: ["refer/refer.html"],
    css: ["refer/refer.css"],
    js: ["refer/refer.js"],
    highlights: ["Copy/share", "Referral stats", "FAQ"],
    cta: { label: "Open Refer", href: "./refer/refer.html" },
    tags: ["Growth"],
  },
  {
    id: "testseries",
    icon: "🧪",
    title: "testseries/",
    desc: "Coders Tester — series catalogue and detail view with tabs and filters.",
    pages: ["testseries/testseries.html", "testseries/series.html"],
    css: ["testseries/testseries.css", "testseries/series.css"],
    js: ["testseries/testseries.js", "testseries/series.js"],
    highlights: ["Series cards", "Subtabs", "Per-problem mode"],
    cta: { label: "Open Testseries", href: "./testseries/testseries.html" },
    tags: ["Series"],
  },
  {
    id: "leet-test",
    icon: "🧠",
    title: "leet-test/",
    desc: "LeetCode-style objective tests + analysis + GATE format runner.",
    pages: [
      "leet-test/leet-test.html",
      "leet-test/analyze.html",
      "leet-test/gate-test-format.html",
      "leet-test/gate-results.html",
    ],
    css: [],
    js: ["leet-test/test-integration-helper.js"],
    highlights: ["Leet-style flow", "Analysis page", "GATE format"],
    cta: { label: "Open Leet Test", href: "./leet-test/leet-test.html" },
    tags: ["Integration"],
  },
];

const SHARED = [
  { key: "firebase.js", role: "Firebase init (Firestore connection)", file: "shared/firebase.js" },
  { key: "base.css", role: "Global design system", file: "shared/base.css" },
  { key: "page.css", role: "Shared page scaffolding", file: "shared/page.css" },
  { key: "nav.js/nav.css", role: "Navigation + settings (themes, fonts, accents, language, zoom)", file: "shared/nav.js" },
  { key: "ui.js", role: "Toasts + UI helpers", file: "shared/ui.js" },
  { key: "level.js/level.css", role: "CP + level logic", file: "shared/level.js" },
  { key: "attempts.js", role: "Attempt storage/tracking", file: "shared/attempts.js" },
  { key: "exams.js", role: "Exam card render helpers", file: "shared/exams.js" },
  { key: "questions.js", role: "Question rendering + actions", file: "shared/questions.js" },
  { key: "i18n.js/langs.js", role: "Language packs + utilities", file: "shared/i18n.js" },
  { key: "landing.js/landing.css", role: "Landing visuals + live stats", file: "shared/landing.js" },
  { key: "zoom-widget.html", role: "Zoom widget template", file: "shared/zoom-widget.html" },
];

const $ = (id) => document.getElementById(id);

function esc(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function cardTemplate(m) {
  const links = [
    m.cta?.href ? `<a class="linkBtn" href="${esc(m.cta.href)}">${esc(m.cta.label || "Open")}</a>` : "",
    m.pages?.[0] ? `<a class="linkBtn" href="./${esc(m.pages[0])}">Open Page</a>` : "",
  ].filter(Boolean).join("");

  const tags = (m.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join("");
  const files = [
    ...(m.pages || []).map(p => `<div><b>HTML</b>: <span class="mono">${esc(p)}</span></div>`),
    ...(m.css || []).map(c => `<div><b>CSS</b>: <span class="mono">${esc(c)}</span></div>`),
    ...(m.js || []).map(j => `<div><b>JS</b>: <span class="mono">${esc(j)}</span></div>`),
  ].join("");

  const highlights = (m.highlights || []).map(h => `<li>${esc(h)}</li>`).join("");

  return `
    <article class="card reveal" data-module="${esc(m.id)}" data-open="false">
      <div class="cardTopRow">
        <div>
          <div class="mono">${esc(m.title)}</div>
          <h3 class="cardTitle">${esc(m.desc)}</h3>
        </div>
        <div class="cardIcon" aria-hidden="true">${esc(m.icon || "⚙")}</div>
      </div>

      <p class="cardDesc">${esc(eyeCatch(m.title))}</p>

      <div class="cardMeta">${tags}</div>

      <div class="links">${links}</div>

      <div class="acc">
        <button class="accBtn" type="button" data-action="toggle">
          <span>Show details</span>
          <span class="chev" aria-hidden="true">⏷</span>
        </button>
        <div class="accBody">
          <div class="kv">
            ${files}
          </div>
          <div style="margin-top:10px">
            <div class="mini">Highlights</div>
            <ul class="bullets">${highlights}</ul>
          </div>
        </div>
      </div>
    </article>
  `;
}

function sharedTemplate(s) {
  return `
    <article class="card reveal" data-open="false">
      <div class="cardTopRow">
        <div>
          <div class="mono">${esc(s.file)}</div>
          <h3 class="cardTitle">${esc(s.key)}</h3>
        </div>
        <div class="cardIcon" aria-hidden="true">⚙</div>
      </div>
      <p class="cardDesc">${esc(s.role)}</p>
      <div class="links">
        <a class="linkBtn" href="./${esc(s.file)}">Open file</a>
      </div>
    </article>
  `;
}

function eyeCatch(folderTitle) {
  const t = (folderTitle || "").toLowerCase();
  if (t.includes("create")) return "Create like a builder — publish question banks that train winners.";
  if (t.includes("read")) return "Choose an exam, open the arena, and start the grind.";
  if (t.includes("update")) return "Refine the questions — evolve the contest engine.";
  if (t.includes("delete")) return "Cut the noise — keep only the best questions.";
  if (t.includes("play")) return "Timer on. Focus locked. Score loading.";
  if (t.includes("results")) return "Every attempt becomes insight. Every insight becomes rank.";
  if (t.includes("leaderboard")) return "Your CP is your proof — climb.";
  if (t.includes("profile")) return "Build your identity. Track your progress.";
  if (t.includes("testseries")) return "Practice like a finals match — repeat until you dominate.";
  if (t.includes("leet")) return "Concepts → confidence → CP.";
  if (t.includes("refer")) return "Turn friends into code warriors.";
  if (t.includes("notifications")) return "Never miss an update. Never miss a contest.";
  if (t.includes("languages")) return "Your language. Your comfort. Your speed.";
  if (t.includes("branches")) return "Pick a path — master a field.";
  if (t.includes("about")) return "The mission behind the platform — why it exists.";
  if (t.includes("contact")) return "Feedback that ships improvements.";
  if (t.includes("bookmarks")) return "Save today, win tomorrow.";
  return "A focused module in the platform — designed for speed and clarity.";
}

function initCards() {
  const modulesGrid = $("modulesGrid");
  const sharedGrid = $("sharedGrid");

  modulesGrid.innerHTML = MODULES.map(cardTemplate).join("");
  sharedGrid.innerHTML = SHARED.map(sharedTemplate).join("");

  // toggles
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action=toggle]");
    if (!btn) return;
    const card = btn.closest(".card");
    if (!card) return;
    const open = card.getAttribute("data-open") === "true";
    card.setAttribute("data-open", open ? "false" : "true");
    const label = btn.querySelector("span");
    if (label) label.textContent = open ? "Show details" : "Hide details";
  });

  $("btnExpand")?.addEventListener("click", () => {
    document.querySelectorAll(".card[data-module]").forEach((c) => c.setAttribute("data-open", "true"));
    document.querySelectorAll(".card[data-module] .accBtn span:first-child").forEach((s) => (s.textContent = "Hide details"));
  });

  $("btnCollapse")?.addEventListener("click", () => {
    document.querySelectorAll(".card[data-module]").forEach((c) => c.setAttribute("data-open", "false"));
    document.querySelectorAll(".card[data-module] .accBtn span:first-child").forEach((s) => (s.textContent = "Show details"));
  });

  const search = $("search");
  search?.addEventListener("input", () => {
    const q = (search.value || "").trim().toLowerCase();
    const cards = Array.from(document.querySelectorAll(".card[data-module]"));
    for (const card of cards) {
      const id = (card.getAttribute("data-module") || "").toLowerCase();
      const text = card.textContent.toLowerCase();
      const hit = !q || id.includes(q) || text.includes(q);
      card.style.display = hit ? "" : "none";
    }
  });
}

function initStats() {
  const folderCount = MODULES.length;
  const pageCount = MODULES.reduce((acc, m) => acc + (m.pages?.length || 0), 0);
  const sharedCount = SHARED.length;

  $("statFolders").textContent = String(folderCount);
  $("statPages").textContent = String(pageCount);
  $("statShared").textContent = String(sharedCount);
}

function initReveal() {
  const els = Array.from(document.querySelectorAll(".reveal"));
  if (els.length === 0) return;

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.16 }
  );

  for (const el of els) io.observe(el);
}

function initTheme() {
  const key = "docsTheme";
  const root = document.documentElement;
  const btn = $("btnTheme");

  function apply(mode) {
    if (mode === "light") root.setAttribute("data-theme", "light");
    else root.removeAttribute("data-theme");
    btn?.setAttribute("aria-pressed", mode === "light" ? "true" : "false");
  }

  const saved = localStorage.getItem(key) || "dark";
  apply(saved);

  btn?.addEventListener("click", () => {
    const cur = localStorage.getItem(key) || "dark";
    const next = cur === "light" ? "dark" : "light";
    localStorage.setItem(key, next);
    apply(next);
  });
}

function initMotion() {
  const key = "docsMotion";
  const root = document.documentElement;
  const btn = $("btnMotion");

  function apply(on) {
    root.style.setProperty("--motion", on ? "1" : "0");
    btn?.setAttribute("aria-pressed", on ? "false" : "true");
  }

  const saved = localStorage.getItem(key);
  const on = saved === null ? true : saved === "on";
  apply(on);

  btn?.addEventListener("click", () => {
    const cur = localStorage.getItem(key);
    const now = cur === null ? true : cur === "on";
    const next = !now;
    localStorage.setItem(key, next ? "on" : "off");
    apply(next);
  });
}

function init() {
  initCards();
  initStats();
  initTheme();
  initMotion();
  initReveal();
}

init();
