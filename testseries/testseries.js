import { toast } from "../shared/ui.js";
import { db, api } from "../shared/firebase.js";

const TESTS = [
  {
    id: "arrays-fundamentals",
    category: "Topic-wise",
    title: "Arrays Fundamentals Test",
    desc: "Master array operations, patterns, and algorithms with comprehensive questions.",
    questions: 15,
    marks: 30,
    mins: 30,
    attempts: 0,
    cp: 25,
    tier: "free",
    syllabus: true,
    firebaseTestId: "arrays-fundamentals"
  },
  {
    id: "strings-manipulation",
    category: "Topic-wise",
    title: "String Manipulation Test",
    desc: "Test your knowledge of string operations, pattern matching, and algorithms.",
    questions: 15,
    marks: 30,
    mins: 30,
    attempts: 0,
    cp: 25,
    tier: "free",
    syllabus: true,
    firebaseTestId: "strings-manipulation"
  },
  {
    id: "dsa-comprehensive",
    category: "Subject-wise",
    title: "DSA Comprehensive Test",
    desc: "Complete DSA assessment covering all major data structures and algorithms.",
    questions: 25,
    marks: 50,
    mins: 45,
    attempts: 0,
    cp: 45,
    tier: "pro",
    syllabus: true,
    firebaseTestId: "dsa-comprehensive"
  },
  {
    id: "dynamic-programming",
    category: "Topic-wise",
    title: "Dynamic Programming Test",
    desc: "Challenge your DP skills with classic problems and optimizations.",
    questions: 20,
    marks: 40,
    mins: 40,
    attempts: 0,
    cp: 35,
    tier: "pro",
    syllabus: true,
    firebaseTestId: "dynamic-programming"
  },
  {
    id: "graph-algorithms",
    category: "Subject-wise",
    title: "Graph Algorithms Test",
    desc: "Test graph traversal, shortest paths, and advanced algorithms.",
    questions: 20,
    marks: 40,
    mins: 40,
    attempts: 0,
    cp: 35,
    tier: "pro",
    syllabus: true,
    firebaseTestId: "graph-algorithms"
  },
  {
    id: "demo-discrete-maths",
    category: "Demo",
    title: "Demo Test : Discrete Maths",
    desc: "A quick onboarding test to understand the UI and scoring.",
    questions: 10,
    marks: 20,
    mins: 15,
    attempts: 2,
    cp: 15,
    tier: "demo",
    syllabus: true,
    startedOn: "04 Apr 2025 at 10:00 PM",
    firebaseTestId: "demo-discrete-maths"
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
    syllabus: true,
    startedOn: "04 Apr 2025 at 10:00 PM"
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
    syllabus: true,
    startedOn: "04 Apr 2025 at 10:00 PM"
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

    const badge = el("span", `tsLiteBadge ${testTagClass(t.tier)}`);
    badge.textContent = t.tier === "pro" ? "Pro" : t.tier === "demo" ? "Free" : "Free";

    const row = el("div", "tsLiteRow");
    const main = el("div", "tsLiteMain");
    const side = el("div", "tsLiteSide");

    const name = el("h3", "tsTestName");
    name.textContent = t.title;

    const stats = el("div", "tsLiteStats");
    stats.innerHTML = `
      <span class="tsLiteStat">${t.questions} Questions</span>
      <span class="tsLiteSep">|</span>
      <span class="tsLiteStat">${t.marks} Marks</span>
      <span class="tsLiteSep">|</span>
      <span class="tsLiteStat">${t.mins} Mins</span>
      <span class="tsLiteSep">|</span>
      <span class="tsLiteStat">Attempts: ${t.attempts}</span>
      <span class="tsLiteSep">|</span>
      <span class="tsLiteStat">Earn upto ${t.cp} CP</span>
    `;

    const started = el("div", "tsLiteStarted");
    if (t.startedOn) {
      started.textContent = `Started on ${t.startedOn}`;
    } else {
      started.textContent = "";
      started.style.display = "none";
    }

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

    main.appendChild(badge);
    main.appendChild(name);
    main.appendChild(stats);
    main.appendChild(started);
    main.appendChild(syllabusBtn);

    const actionBtn = el("button", "tsLiteAction");
    actionBtn.type = "button";
    actionBtn.dataset.action = "start";
    actionBtn.dataset.testId = t.id;
    actionBtn.textContent = t.attempts > 0 ? "Reattempt" : "Start";
    if (t.attempts > 0) actionBtn.classList.add("reattempt");

    side.appendChild(actionBtn);
    row.appendChild(main);
    row.appendChild(side);
    card.appendChild(row);

    grid.appendChild(card);
  }
}

function onAction(action, title) {
  if (typeof toast === "function") {
    const label =
      action === "buy"
        ? "Buy Now"
        : action === "join"
          ? "Join"
          : action === "start"
            ? "Start"
            : action === "syllabus"
              ? "View Syllabus"
              : action === "details"
                ? "Details"
                : "Explore";
    toast(`${title} • ${label}`);
    return;
  }
  alert(`${title} • ${action}`);
}

async function startTest(testId) {
  const test = TESTS.find(t => t.id === testId);
  if (!test) {
    toast("Test not found");
    return;
  }

  try {
    toast("Loading test questions...");
    
    // Fetch test series from Firebase
    const testDoc = await api.getDoc(api.doc(db, "testseries", test.firebaseTestId));
    if (!testDoc.exists()) {
      toast("Test not available");
      return;
    }

    const testData = testDoc.data();
    const questions = testData.questions || [];

    if (questions.length === 0) {
      toast("No questions available for this test");
      return;
    }

    // Create test session
    const sessionId = `session_${Date.now()}_${testId}`;
    const sessionData = {
      id: sessionId,
      testId: testId,
      testTitle: test.title,
      questions: questions,
      startTime: api.serverTimestamp(),
      duration: test.mins,
      totalMarks: test.marks,
      status: "active",
      currentQuestionIndex: 0,
      answers: {},
      createdAt: api.serverTimestamp()
    };

    // Save session to Firebase
    await api.setDoc(api.doc(db, "test_sessions", sessionId), sessionData);

    // Redirect to test runner
    const testRunnerUrl = new URL(`../play/play.html?session=${encodeURIComponent(sessionId)}&test=${encodeURIComponent(testId)}`, import.meta.url).href;
    window.location.href = testRunnerUrl;

  } catch (error) {
    console.error("Error starting test:", error);
    toast("Failed to start test. Please try again.");
  }
}

async function loadQuestionsFromFirebase(topic, difficulty, limit = 10) {
  try {
    const q = api.query(
      api.collection(db, "super_2500_pro_plus"),
      api.where("topic", "==", topic),
      api.where("difficulty", "==", difficulty),
      api.where("series", "==", "super_2500_pro_plus"),
      api.limit(limit)
    );
    
    const snapshot = await api.getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).slice(0, limit);
  } catch (error) {
    console.error("Error loading questions:", error);
    return [];
  }
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

    if (action === "start") {
      startTest(id);
      return;
    }

    onAction(action, title);
    return;
  }

  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const card = btn.closest(".tsCard");
  const title = card?.querySelector(".tsCardTitle")?.textContent?.trim() || "Test Series";
  const action = btn.getAttribute("data-action") || "details";
  const seriesId = card?.getAttribute("data-series") || "";

  if (action === "details" && card && seriesId) {
    const subtab = card?.getAttribute("data-subtab") || "";
    const base = new URL(`./series.html?series=${encodeURIComponent(seriesId)}&tab=test`, import.meta.url).href;
    window.location.href = subtab ? `${base}&subtab=${encodeURIComponent(subtab)}` : base;
    return;
  }
  
  onAction(action, title);
});

renderCategoryPills();
renderTests();
