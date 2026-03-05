import { toast } from "/shared/ui.js";

const TESTS = [
  {
    id: "demo-01",
    category: "Demo",
    title: "Demo Test • Warm-up",
    desc: "A quick onboarding test to understand the UI and scoring.",
    questions: 10,
    marks: 20,
    mins: 15,
    attempts: 0,
    cp: 15,
    tier: "demo",
    syllabus: true
  },
  {
    id: "tw-arrays-01",
    category: "Topic-wise",
    title: "Arrays • Patterns & Two Pointers",
    desc: "Core array patterns: two pointers, sliding window, prefix sums.",
    questions: 25,
    marks: 50,
    mins: 45,
    attempts: 1,
    cp: 60,
    tier: "pro",
    syllabus: true
  },
  {
    id: "tw-binary-01",
    category: "Topic-wise",
    title: "Binary Search • Classic Templates",
    desc: "Standard templates + tricky boundaries and monotonic predicates.",
    questions: 20,
    marks: 40,
    mins: 35,
    attempts: 0,
    cp: 55,
    tier: "pro",
    syllabus: true
  },
  {
    id: "sw-dsa-01",
    category: "Subject-wise",
    title: "DSA • Core Concepts",
    desc: "Stacks, queues, linked list, trees, graphs, and complexity basics.",
    questions: 30,
    marks: 60,
    mins: 60,
    attempts: 2,
    cp: 80,
    tier: "pro",
    syllabus: true
  },
  {
    id: "sw-cpp-01",
    category: "Subject-wise",
    title: "C/C++ • Interview Essentials",
    desc: "Pointers, memory, STL usage patterns, edge cases, and speed.",
    questions: 24,
    marks: 48,
    mins: 45,
    attempts: 0,
    cp: 70,
    tier: "pro",
    syllabus: true
  },
  {
    id: "mt-01",
    category: "Mixed Topic",
    title: "Mixed Topic Mock • Sprint 01",
    desc: "A balanced mix across arrays, strings, hashing, recursion, and DP.",
    questions: 35,
    marks: 70,
    mins: 70,
    attempts: 1,
    cp: 95,
    tier: "pro",
    syllabus: false
  },
  {
    id: "ms-01",
    category: "Mixed Subject",
    title: "Mixed Subject Mock • Pro Set 01",
    desc: "DSA + OOP + DBMS + OS + CN in one interview-style set.",
    questions: 50,
    marks: 100,
    mins: 90,
    attempts: 0,
    cp: 130,
    tier: "pro",
    syllabus: false
  },
  {
    id: "rev-01",
    category: "Revision",
    title: "Revision Booster • Mistakes Only",
    desc: "High-frequency traps and common mistakes across topics.",
    questions: 18,
    marks: 36,
    mins: 30,
    attempts: 0,
    cp: 40,
    tier: "free",
    syllabus: true
  }
];

const CATEGORIES = ["All", "Demo", "Topic-wise", "Subject-wise", "Mixed Topic", "Mixed Subject", "Revision"];
let activeCategory = "All";

function el(tag, cls) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  return n;
}

function renderCategoryPills() {
  const host = document.getElementById("tsCategoryPills");
  if (!host) return;
  host.innerHTML = "";
  for (const c of CATEGORIES) {
    const b = el("button", `tsPill${c === activeCategory ? " on" : ""}`);
    b.type = "button";
    b.textContent = c;
    b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", c === activeCategory ? "true" : "false");
    b.dataset.category = c;
    host.appendChild(b);
  }
}

function testTagClass(t) {
  if (t === "pro") return "pro";
  if (t === "demo") return "demo";
  return "free";
}

function renderTests() {
  const grid = document.getElementById("tsSeriesGrid");
  if (!grid) return;
  const list = activeCategory === "All" ? TESTS : TESTS.filter((t) => t.category === activeCategory);
  grid.innerHTML = "";

  for (const t of list) {
    const card = el("article", "tsTestCard");
    card.dataset.testId = t.id;
    card.dataset.category = t.category;

    const top = el("div", "tsTestTop");
    const left = el("div");
    const name = el("h3", "tsTestName");
    name.textContent = t.title;
    left.appendChild(name);

    const tagRow = el("div", "tsTestTagRow");
    const tagA = el("span", `tsTag ${testTagClass(t.tier)}`);
    tagA.textContent = t.tier === "pro" ? "PRO+" : t.tier.toUpperCase();
    const tagB = el("span", "tsTag");
    tagB.textContent = t.category;
    tagRow.appendChild(tagA);
    tagRow.appendChild(tagB);
    left.appendChild(tagRow);
    top.appendChild(left);

    const right = el("div");
    if (t.attempts > 0) {
      const done = el("span", "tsTag free");
      done.textContent = "Attempted";
      right.appendChild(done);
    }
    top.appendChild(right);

    const desc = el("div", "tsTestDesc");
    desc.textContent = t.desc;

    const stats = el("div", "tsTestStats");
    stats.innerHTML = `
      <div class="tsStat"><b>${t.questions}</b> Qs</div>
      <div class="tsStat"><b>${t.marks}</b> Marks</div>
      <div class="tsStat"><b>${t.mins}</b> Min</div>
      <div class="tsStat"><b>${t.attempts}</b> Attempts</div>
      <div class="tsStat"><b>${t.cp}</b> CP</div>
    `;

    const foot = el("div", "tsTestFoot");
    const syllabusBtn = el("button", "tsMiniLink");
    syllabusBtn.type = "button";
    syllabusBtn.textContent = "View Syllabus";
    syllabusBtn.dataset.action = "syllabus";
    syllabusBtn.dataset.testId = t.id;
    syllabusBtn.disabled = !t.syllabus;
    if (!t.syllabus) {
      syllabusBtn.style.opacity = "0.55";
      syllabusBtn.style.cursor = "not-allowed";
      syllabusBtn.style.textDecoration = "none";
    }

    const ctas = el("div", "tsCtas");
    const a1 = el("button", "btn ghost");
    a1.type = "button";
    a1.textContent = "Details";
    a1.dataset.action = "details";
    a1.dataset.testId = t.id;
    const a2 = el("button", "btn primary");
    a2.type = "button";
    a2.textContent = t.attempts > 0 ? "Resume" : "Start";
    a2.dataset.action = "start";
    a2.dataset.testId = t.id;
    ctas.appendChild(a1);
    ctas.appendChild(a2);

    foot.appendChild(syllabusBtn);
    foot.appendChild(ctas);

    card.appendChild(top);
    card.appendChild(desc);
    card.appendChild(stats);
    card.appendChild(foot);

    grid.appendChild(card);
  }
}

function onAction(action, title) {
  if (typeof toast === "function") {
    toast(`${title} • ${action === "buy" ? "Buy Now" : action === "join" ? "Join" : "Explore"}`);
    return;
  }
  alert(`${title} • ${action}`);
}

document.addEventListener("click", (e) => {
  const pill = e.target.closest("button.tsPill");
  if (pill) {
    activeCategory = pill.dataset.category || "All";
    renderCategoryPills();
    renderTests();
    return;
  }

  const testBtn = e.target.closest("button[data-test-id][data-action]");
  if (testBtn) {
    const id = testBtn.getAttribute("data-test-id") || "";
    const action = testBtn.getAttribute("data-action") || "details";
    const title = TESTS.find((t) => t.id === id)?.title || "Test";
    onAction(action, title);
    return;
  }

  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const card = btn.closest(".tsCard");
  const title = card?.querySelector(".tsCardTitle")?.textContent?.trim() || "Test Series";
  const action = btn.getAttribute("data-action") || "details";
  onAction(action, title);
});

renderCategoryPills();
renderTests();
