import { toast } from "../shared/ui.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  limit,
  orderBy,
  startAfter,
  getCountFromServer,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import { getDeviceId } from "../shared/attempts.js";
import { findLeetCodeTest, startLeetCodeTest, submitLeetCodeAnswer, finishLeetCodeTest } from "../leet_test_integration.js";

const firebaseConfig = {
  apiKey: "AIzaSyBTXNdFPIkgRAMSN8FYvSgaiyQ0ylz-6Ko",
  authDomain: "coding-quiz-contest-platform.firebaseapp.com",
  projectId: "coding-quiz-contest-platform",
  storageBucket: "coding-quiz-contest-platform.firebasestorage.app",
  messagingSenderId: "823102752389",
  appId: "1:823102752389:web:4e3db47f8b6234ae1c8bec",
  measurementId: "G-3YHZX8QDB9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const SERIES_META = {
  super2500: {
    title: "Super 2500 Pro Plus",
    sub: "GATE Test Series 2026 - CS & IT"
  },
  leetcode: {
    title: "LeetCode Concept Packs",
    sub: "Objective MCQs • tags + difficulty packs"
  },
  foundations: {
    title: "Code Foundations",
    sub: "Daily drills • DSA + C/CPP essentials"
  },
  sprint: {
    title: "Logic & Speed Sprint",
    sub: "Timed aptitude sprints • accuracy boosters"
  },
  mockleague: {
    title: "Full Mock League",
    sub: "Full-length mocks • analytics • rank trends"
  },
  devclub: {
    title: "Developers Club",
    sub: "Community practice • contests • leaderboards"
  }
};

async function loadLeetProblemPage(startAfterId) {
  const colRef = collection(db, SUPER4000_CARDS_COL);
  const q = startAfterId
    ? query(colRef, orderBy("__name__"), startAfter(String(startAfterId)), limit(LEET_PROBLEM_PAGE_SIZE))
    : query(colRef, orderBy("__name__"), limit(LEET_PROBLEM_PAGE_SIZE));

  const snap = await getDocs(q);
  const out = [];
  snap.forEach((d) => out.push({ id: d.id, ...d.data() }));
  const lastId = snap.docs.length ? snap.docs[snap.docs.length - 1].id : "";
  return { items: out, lastId, hasMore: snap.size === LEET_PROBLEM_PAGE_SIZE };
}

async function loadAllLeetProblems() {
  const colRef = collection(db, SUPER4000_CARDS_COL);
  const q = query(colRef, orderBy("__name__"));
  const snap = await getDocs(q);
  const out = [];
  snap.forEach((d) => out.push({ id: d.id, ...d.data() }));
  return out;
}

function toProblemCard(p) {
  // Cards are stored in Firestore collection super_4000_leet_problems
  // Prefer the stored doc shape; fall back to constructing from minimal fields.
  if (p && typeof p === "object" && p.firebaseQuery && p.title) {
    return {
      ...p,
      id: String(p.id || p._id || p.docId || ""),
      firebaseTestId: String(p.firebaseTestId || p.id || "")
    };
  }

  const slug = String(p.problemSlug || p.slug || p.id || "");
  const title = String(p.problemTitle || p.title || slug || "LeetCode Problem");
  const q = 10;
  return {
    id: String(p.id || `leetcode-problem-${slug}`),
    category: "Per Problem",
    title: `${title} • Test`,
    questions: q,
    marks: q * 2,
    mins: 20,
    attempts: 0,
    cp: 20,
    tier: "pro",
    syllabus: false,
    recommended: false,
    resumable: false,
    poolCount: 10,
    firebaseQuery: { problemSlug: slug, limit: 10 }
  };
}

function applyProblemSearchFilter() {
  const el = document.getElementById("tsdProblemSearch");
  const elDiff = document.getElementById("tsdProblemDifficulty");
  const elComp = document.getElementById("tsdProblemCompany");
  const elTopic = document.getElementById("tsdProblemTopic");
  const term = String(el?.value || "").trim().toLowerCase();
  const diff = String(elDiff?.value || "").trim().toLowerCase();
  const comp = String(elComp?.value || "").trim().toLowerCase();
  const topic = String(elTopic?.value || "").trim().toLowerCase();
  const meta = document.getElementById("tsdProblemMeta");

  const base = LEET_PROBLEM_PAGE_ITEMS;
  base.forEach((x) => {
    const title = String(x.problemTitle || x.title || "").toLowerCase();
    const slug = String(x.problemSlug || x.slug || x.id || "").toLowerCase();
    const cardDiff = String(x.difficulty || "").toLowerCase();
    const companies = Array.isArray(x.companies) ? x.companies.map(String).map(s => s.toLowerCase()) : [];
    const topics = Array.isArray(x.topics) ? x.topics.map(String).map(s => s.toLowerCase()) : [];

    const matchesText = !term || title.includes(term) || slug.includes(term);
    const matchesDiff = !diff || cardDiff === diff;
    const matchesComp = !comp || companies.includes(comp);
    const matchesTopic = !topic || topics.includes(topic);
    x.__hidden = !(matchesText && matchesDiff && matchesComp && matchesTopic);
  });

  const visibleCount = base.filter((x) => !x.__hidden).length;
  if (meta) {
    meta.textContent = `Showing ${visibleCount}/${base.length} cards on this page • Page size ${LEET_PROBLEM_PAGE_SIZE}`;
  }

  // Keep UI responsive: apply filter + re-render immediately.
  renderCards();
}

function debounce(fn, waitMs) {
  let t = null;
  return (...args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), waitMs);
  };
}

function rebuildLeetProblemFilterOptions() {
  const series = qs("series") || "super2500";
  if (String(series) !== "leetcode" || activeSubTab !== "problem") return;

  const elDiff = document.getElementById("tsdProblemDifficulty");
  const elComp = document.getElementById("tsdProblemCompany");
  const elTopic = document.getElementById("tsdProblemTopic");
  if (!elDiff || !elComp || !elTopic) return;

  const items = LEET_PROBLEM_PAGE_ITEMS.map((x) => x?.__card || x).filter(Boolean);
  const companies = new Set();
  const topics = new Set();
  const diffs = new Set();
  for (const it of items) {
    const d = String(it.difficulty || "").trim().toLowerCase();
    if (d) diffs.add(d);
    if (Array.isArray(it.companies)) it.companies.forEach((c) => companies.add(String(c).trim().toLowerCase()));
    if (Array.isArray(it.topics)) it.topics.forEach((t) => topics.add(String(t).trim().toLowerCase()));
  }

  function resetSelectOptions(sel, keepValue, options) {
    const current = keepValue ? String(sel.value || "") : "";
    const first = sel.querySelector('option[value=""]');
    sel.innerHTML = "";
    if (first) sel.appendChild(first);
    for (const opt of options) {
      const o = document.createElement("option");
      o.value = opt;
      o.textContent = String(opt)
        .split("-")
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
        .join(" ");
      sel.appendChild(o);
    }
    if (keepValue && current && [...sel.options].some((o) => o.value === current)) sel.value = current;
  }

  // Difficulty should always be easy/medium/hard, but use what's present.
  resetSelectOptions(elDiff, true, [...diffs].sort());
  resetSelectOptions(elComp, true, [...companies].filter(Boolean).sort());
  resetSelectOptions(elTopic, true, [...topics].filter(Boolean).sort());
}

async function ensureLeetProblemPage() {
  const series = qs("series") || "super2500";
  if (String(series) !== "leetcode" || activeSubTab !== "problem") return;

  const bar = document.getElementById("tsdProblemBar");
  if (bar) bar.style.display = "block";

  const search = document.getElementById("tsdProblemSearch");
  const diff = document.getElementById("tsdProblemDifficulty");
  const comp = document.getElementById("tsdProblemCompany");
  const topic = document.getElementById("tsdProblemTopic");
  const debounced = debounce(applyProblemSearchFilter, 120);
  if (search) search.addEventListener("input", debounced);
  if (diff) diff.addEventListener("change", applyProblemSearchFilter);
  if (comp) comp.addEventListener("change", applyProblemSearchFilter);
  if (topic) topic.addEventListener("change", applyProblemSearchFilter);

  const prevBtn = document.getElementById("tsdProblemPrev");
  const nextBtn = document.getElementById("tsdProblemNext");

  async function loadAndShow(startAfterId) {
    toast("Loading problems…");
    const items = startAfterId === undefined ? await loadAllLeetProblems() : (await loadLeetProblemPage(startAfterId)).items;
    LEET_PROBLEM_PAGE_HAS_MORE = Boolean(startAfterId !== undefined && items.length === LEET_PROBLEM_PAGE_SIZE);
    const processedItems = items.map((p) => {
      const card = toProblemCard(p);
      // ensure stable fields for search
      const problemTitle = String(p.problemTitle || card.problemTitle || card.title || "");
      const problemSlug = String(p.problemSlug || card.problemSlug || "");
      return { ...p, problemTitle, problemSlug, __card: { ...card, problemTitle, problemSlug }, __hidden: false };
    });
    if (startAfterId === undefined) {
      LEET_PROBLEM_PAGE_ITEMS = processedItems;
    } else {
      LEET_PROBLEM_PAGE_ITEMS = processedItems;
    }
    LEET_PROBLEM_PAGE_START_AFTER = String(startAfterId || "");
    rebuildLeetProblemFilterOptions();
    applyProblemSearchFilter();

    const meta = document.getElementById("tsdProblemMeta");
    if (meta) {
      if (startAfterId === undefined) {
        meta.textContent = `All • Loaded ${items.length} problems`;
      } else {
        const pageNo = LEET_PROBLEM_PAGE_STACK.length + 1;
        const from = items.length ? String(items[0].id || "") : "";
        const to = items.length ? String(items[items.length - 1].id || "") : "";
        meta.textContent = `Page ${pageNo} • Loaded ${items.length} • Range ${from}${to ? " → " + to : ""}`;
      }
    }

    if (prevBtn) prevBtn.disabled = LEET_PROBLEM_PAGE_STACK.length === 0;
    if (nextBtn) nextBtn.disabled = !LEET_PROBLEM_PAGE_HAS_MORE;
    renderCards();
  }

  if (prevBtn) {
    prevBtn.onclick = async () => {
      if (LEET_PROBLEM_PAGE_STACK.length === 0) return;
      const prevStartAfter = LEET_PROBLEM_PAGE_STACK.pop();
      await loadAndShow(prevStartAfter);
    };
  }

  if (nextBtn) {
    nextBtn.onclick = async () => {
      if (!LEET_PROBLEM_PAGE_HAS_MORE) return;
      const last = LEET_PROBLEM_PAGE_ITEMS.length
        ? String(LEET_PROBLEM_PAGE_ITEMS[LEET_PROBLEM_PAGE_ITEMS.length - 1].id || "")
        : "";
      if (!last) return;
      LEET_PROBLEM_PAGE_STACK.push(String(LEET_PROBLEM_PAGE_START_AFTER || ""));
      await loadAndShow(last);
    };
  }

  // initial load
  if (!LEET_PROBLEM_PAGE_ITEMS.length) {
    await loadAndShow(LEET_PROBLEM_PAGE_START_AFTER);
  } else {
    rebuildLeetProblemFilterOptions();
    applyProblemSearchFilter();
    if (prevBtn) prevBtn.disabled = LEET_PROBLEM_PAGE_STACK.length === 0;
    if (nextBtn) nextBtn.disabled = !LEET_PROBLEM_PAGE_HAS_MORE;
    renderCards();
  }
}

function chunkCardFromCount(topic, difficulty, count, chunkIndex, chunkSize) {
  const pool = Math.max(0, Number.isFinite(count) ? count : 0);
  const q = Math.min(Math.max(5, chunkSize), 30);
  const marks = q * 2;
  const mins = Math.max(15, Math.round(q * 2));
  const tier = difficulty === "medium" || difficulty === "hard" ? "pro" : "free";

  const startNo = chunkIndex * chunkSize + 1;
  const endNo = Math.min(pool, (chunkIndex + 1) * chunkSize);
  const startAfterId = chunkIndex === 0 ? "" : `${topic}-${difficulty}-${pad3(chunkIndex * chunkSize)}`;

  return {
    id: `${makeCardId(topic, difficulty)}-chunk-${chunkIndex + 1}`,
    category: "Topic-wise",
    title: `${topicLabel(topic)} • ${String(difficulty || "easy").toUpperCase()} • Test ${chunkIndex + 1}`,
    questions: q,
    marks,
    mins,
    attempts: 0,
    cp: Math.round(q * 1.5),
    tier,
    syllabus: true,
    recommended: true,
    resumable: false,
    poolCount: pool,
    chunk: { index: chunkIndex, size: chunkSize, startNo, endNo, startAfterId },
    firebaseQuery: { topic: String(topic), difficulty: String(difficulty), startAfterId, limit: q }
  };
}

let LOAD_ERROR = "";

let SUPER2500_TEST_CARDS = [];
let SUPER2500_TOTAL_BANK_COUNT = 0;

let LEETCODE_TEST_CARDS = [];
let LEETCODE_TOTAL_BANK_COUNT = 0;
let BOOKMARKED_TESTS = []; // Will be loaded from Firebase

const SUPER4000_BANK_COL = "super_4000_pro_plus";
const SUPER4000_CARDS_COL = "super_4000_leet_problems";

const SUPER2500_CHUNK_SIZE = 25;

const LEETCODE_PACK_SIZE = 25;
const LEETCODE_DIFFICULTIES = ["easy", "medium", "hard"];
const LEETCODE_TOPICS = [
  "general",
  "array",
  "string",
  "hash-table",
  "two-pointers",
  "sliding-window",
  "stack",
  "queue",
  "heap",
  "binary-search",
  "sorting",
  "greedy",
  "dynamic-programming",
  "tree",
  "graph",
  "bit-manipulation",
  "math",
  "recursion",
  "backtracking",
  "trie"
];

const LEETCODE_TOPIC_LABELS = {
  general: "General",
  array: "Arrays",
  string: "Strings",
  "hash-table": "Hash Table",
  "two-pointers": "Two Pointers",
  "sliding-window": "Sliding Window",
  stack: "Stack",
  queue: "Queue",
  heap: "Heap / Priority Queue",
  "binary-search": "Binary Search",
  sorting: "Sorting",
  greedy: "Greedy",
  "dynamic-programming": "Dynamic Programming",
  tree: "Trees",
  graph: "Graphs",
  "bit-manipulation": "Bit Manipulation",
  math: "Math",
  recursion: "Recursion",
  backtracking: "Backtracking",
  trie: "Trie"
};

function leetTopicLabel(topic) {
  const key = String(topic || "").trim();
  return LEETCODE_TOPIC_LABELS[key] || key || "Topic";
}

const SUPER2500_TOPIC_LABELS = {
  arrays: "Arrays",
  strings: "Strings",
  "linked-lists": "Linked Lists",
  linkedlist: "Linked List",
  stacks: "Stacks",
  queues: "Queues",
  trees: "Trees",
  graphs: "Graphs",
  hashing: "Hashing",
  sorting: "Sorting",
  searching: "Searching",
  "dynamic-programming": "Dynamic Programming",
  dynamic_programming: "Dynamic Programming",
  "dynamic-programming": "Dynamic Programming",
  greedy: "Greedy",
  recursion: "Recursion",
  bit_manipulation: "Bit Manipulation",
  "bit-manipulation": "Bit Manipulation",
  mathematics: "Mathematics",
  maths: "Maths",
  math: "Math",
  "segment-tree": "Segment Tree",
  "binary-indexed-tree": "Binary Indexed Tree",
  trie: "Trie",
  design: "Design",
  backtracking: "Backtracking",
  strings_algorithms: "String Algorithms"
};

const SUPER2500_TOPICS = [
  "arrays",
  "strings",
  "linked-lists",
  "trees",
  "graphs",
  "dynamic-programming",
  "greedy",
  "backtracking",
  "sorting",
  "searching",
  "mathematics",
  "bit-manipulation",
  "stack",
  "queue",
  "hashing",
  "recursion",
  "design",
  "trie",
  "segment-tree",
  "binary-indexed-tree"
];

const SUPER2500_DIFFICULTIES = ["easy", "medium", "hard"];

function topicLabel(topic) {
  const key = String(topic || "").trim();
  return SUPER2500_TOPIC_LABELS[key] || key || "Topic";
}

function makeCardId(topic, difficulty) {
  return `super2500-${String(topic || "all")}-${String(difficulty || "any")}`.replaceAll(" ", "-");
}

function pad3(n) {
  return String(n).padStart(3, "0");
}

function cardFromCount(topic, difficulty, count) {
  const q = Math.min(Math.max(5, Number.isFinite(count) ? count : 10), 30);
  const marks = q * 2;
  const mins = Math.max(15, Math.round(q * 2));
  const tier = difficulty === "medium" || difficulty === "hard" ? "pro" : "free";
  return {
    id: makeCardId(topic, difficulty),
    category: "Topic-wise",
    title: `${topicLabel(topic)} • ${String(difficulty || "easy").toUpperCase()} Set` ,
    questions: q,
    marks,
    mins,
    attempts: 0,
    cp: Math.round(q * 1.5),
    tier,
    syllabus: true,
    recommended: true,
    resumable: false,
    poolCount: Number.isFinite(count) ? count : 0,
    firebaseQuery: { topic: String(topic), difficulty: String(difficulty) }
  };
}

function mixedCardFromCount(difficulty, count) {
  const q = Math.min(Math.max(10, Number.isFinite(count) ? Math.min(count, 25) : 15), 30);
  const marks = q * 2;
  const mins = Math.max(20, Math.round(q * 2));
  const tier = difficulty === "medium" || difficulty === "hard" ? "pro" : "free";
  return {
    id: makeCardId(`mixed-${difficulty}`, difficulty),
    category: "Mixed",
    title: `Mixed • ${String(difficulty || "easy").toUpperCase()} Pool`,
    questions: q,
    marks,
    mins,
    attempts: 0,
    cp: Math.round(q * 1.5),
    tier,
    syllabus: true,
    recommended: true,
    resumable: false,
    poolCount: Number.isFinite(count) ? count : 0,
    firebaseQuery: { difficulty: String(difficulty) }
  };
}

async function countQuestionsFor(topic, difficulty) {
  const colRef = collection(db, "super_2500_pro_plus");
  const clauses = [];
  if (topic) clauses.push(where("topic", "==", String(topic)));
  if (difficulty) clauses.push(where("difficulty", "==", String(difficulty)));
  const q = query(colRef, ...clauses);
  const agg = await getCountFromServer(q);
  return Number(agg.data().count || 0);
}

async function countAllSuper2500() {
  const colRef = collection(db, "super_2500_pro_plus");
  const q = query(colRef);
  const agg = await getCountFromServer(q);
  return Number(agg.data().count || 0);
}

async function countAllLeetCodeMcqs() {
  const colRef = collection(db, SUPER4000_BANK_COL);
  const q = query(colRef, where("kind", "==", "mcq"));
  const agg = await getCountFromServer(q);
  return Number(agg.data().count || 0);
}

async function countLeetCodeMcqsFor(topic, difficulty) {
  const colRef = collection(db, SUPER4000_BANK_COL);
  const clauses = [];
  clauses.push(where("kind", "==", "mcq"));
  if (topic) clauses.push(where("topic", "==", String(topic)));
  if (difficulty) clauses.push(where("difficulty", "==", String(difficulty)));
  const q = query(colRef, ...clauses);
  const agg = await getCountFromServer(q);
  return Number(agg.data().count || 0);
}

function setSuper2500HeaderCount() {
  const sub = document.getElementById("seriesSub");
  if (!sub) return;
  const baseSeries = qs("series") || "super2500";
  const base = SERIES_META[baseSeries]?.sub || "Test Series";
  if (SUPER2500_TOTAL_BANK_COUNT > 0 && baseSeries === "super2500") {
    sub.textContent = `${base} • ${SUPER2500_TOTAL_BANK_COUNT} questions in bank`;
  } else {
    sub.textContent = base;
  }
}

function setLeetCodeHeaderCount() {
  const sub = document.getElementById("seriesSub");
  if (!sub) return;
  const baseSeries = qs("series") || "super2500";
  const base = SERIES_META[baseSeries]?.sub || "Test Series";
  if (LEETCODE_TOTAL_BANK_COUNT > 0 && baseSeries === "leetcode") {
    sub.textContent = `${base} • ${LEETCODE_TOTAL_BANK_COUNT} MCQs in bank`;
  } else {
    sub.textContent = base;
  }
}

function leetPackCard(topic, difficulty, poolCount) {
  const q = LEETCODE_PACK_SIZE;
  const marks = q * 2;
  const mins = Math.max(15, Math.round(q * 2));
  const tier = difficulty === "medium" || difficulty === "hard" ? "pro" : "free";
  return {
    id: `leetcode-${String(topic || "all")}-${String(difficulty || "any")}`.replaceAll(" ", "-"),
    category: "Topic-wise",
    title: `${leetTopicLabel(topic)} • ${String(difficulty || "easy").toUpperCase()} Pack`,
    questions: q,
    marks,
    mins,
    attempts: 0,
    cp: Math.round(q * 1.5),
    tier,
    syllabus: true,
    recommended: true,
    resumable: false,
    poolCount: Math.max(0, Number(poolCount || 0)),
    firebaseQuery: { topic: String(topic), difficulty: String(difficulty), limit: q }
  };
}

// Generate LeetCode test cards from the problem list
function generateLeetCodeTestCards() {
  const cards = [];
  
  // Read the first few problems to create test cards
  const problemNames = [
    "Valid Subarrays With Exactly One Peak",
    "Reverse K Subarrays", 
    "Minimum Cost to Equalize Arrays Using Swaps",
    "First Unique Even Element",
    "Maximum Requests Without Violating the Limit",
    "Maximum Points Activated with One Addition",
    "Count Commas in Range II",
    "Minimum Capacity Box",
    "Count Commas in Range",
    "Sum of GCD of Formed Pairs",
    "Unique Email Groups",
    "Find the Smallest Balanced Index",
    "Sum of K-Digit Numbers in a Range",
    "Smallest Pair With Different Frequencies",
    "Longest Arithmetic Sequence After Changing At Most One Element",
    "Trim Trailing Vowels",
    "Delayed Count of Equal Elements",
    "Find Users with Persistent Behavior Patterns",
    "Check Digitorial Permutation",
    "Find the Score Difference in a Game"
  ];
  
  const categories = ["Arrays", "Strings", "Dynamic Programming", "Graph", "Tree", "Greedy", "Math", "Two Pointers"];
  const difficulties = ["Easy", "Medium", "Hard"];
  const tiers = ["Free", "Plus", "Pro"];
  
  problemNames.forEach((name, index) => {
    const difficulty = difficulties[index % difficulties.length];
    const tier = tiers[index % tiers.length];
    const category = categories[index % categories.length];
    
    cards.push({
      id: `leet-problem-${index + 1}`,
      firebaseTestId: `leet-problem-${index + 1}`,
      title: name,
      subtitle: `${category} • ${difficulty}`,
      category: category,
      difficulty: difficulty.toLowerCase(),
      tier: tier.toLowerCase(),
      description: `Master ${name} with comprehensive objective questions covering algorithms, data structures, and problem-solving techniques.`,
      duration: difficulty === "Easy" ? 15 : difficulty === "Medium" ? 25 : 45,
      questions: 25,
      tags: [category.toLowerCase(), difficulty.toLowerCase(), "algorithm", "problem-solving"],
      isLeetCode: true,
      problemName: name,
      hasTest: true
    });
  });
  
  return cards;
}

function seedFallbackLeetCodeCards() {
  // Generate test cards from LeetCode problems
  LEETCODE_TEST_CARDS = generateLeetCodeTestCards();
  
  // Add a demo card at the beginning
  LEETCODE_TEST_CARDS.unshift({
    id: "leetcode-demo",
    category: "Demo",
    title: "Demo Pack : LeetCode Warmup",
    questions: 10,
    marks: 20,
    mins: 15,
    attempts: 0,
    cp: 15,
    tier: "free",
    syllabus: true,
    recommended: true,
    resumable: false,
    poolCount: 0,
    firebaseQuery: { difficulty: "easy", limit: 10 },
    isDemo: true,
    hasTest: true
  });
  
  console.log(`Generated ${LEETCODE_TEST_CARDS.length} LeetCode test cards`);
}

async function loadLeetCodeCardsFromBank() {
  const cards = [];

  // Load uploaded test cards from Firebase
  try {
    const colRef = collection(db, SUPER4000_CARDS_COL);
    const snap = await getDocs(query(colRef, orderBy("__name__"), limit(100)));
    
    snap.forEach((doc) => {
      const data = doc.data();
      cards.push({
        id: data.id || doc.id,
        category: data.difficulty || "LeetCode",
        title: data.title || "LeetCode Test",
        questions: data.questions || 25,
        marks: data.marks || 50,
        mins: data.mins || 50,
        attempts: data.attempts || 0,
        cp: data.mins || 50,
        tier: data.tier || "free",
        syllabus: true,
        recommended: data.problemIndex === 1,
        resumable: !!data.startedOn,
        poolCount: data.poolCount || data.questions,
        firebaseQuery: data.firebaseQuery || { problemSlug: data.problemSlug, limit: data.questions },
        // Include demo-specific fields
        isDemo: data.isDemo || false,
        demoQuestions: data.demoQuestions || null,
        theme: data.theme || null,
        problemTitle: data.problemTitle,
        problemSlug: data.problemSlug,
        problemIndex: data.problemIndex,
        companies: data.companies || [],
        topics: data.topics || [],
        startedOn: data.startedOn,
        completedOn: data.completedOn
      });
    });
    
    console.log(`Loaded ${cards.length} test cards from Firebase`);
  } catch (error) {
    console.error("Error loading test cards from Firebase:", error);
    // Fallback to demo card if Firebase fails
    cards.push({
      id: "leetcode-demo",
      category: "Demo",
      title: "Demo Pack : LeetCode Warmup",
      questions: 10,
      marks: 20,
      mins: 15,
      attempts: 0,
      cp: 15,
      tier: "free",
      syllabus: true,
      recommended: true,
      resumable: false,
      poolCount: 0,
      firebaseQuery: { difficulty: "easy", limit: 10 }
    });
  }

  for (const d of LEETCODE_DIFFICULTIES) {
    for (const topic of LEETCODE_TOPICS) {
      const cnt = await countLeetCodeMcqsFor(topic, d);
      if (cnt > 0) cards.push(leetPackCard(topic, d, cnt));
    }
  }

  LEETCODE_TEST_CARDS = cards;
}

async function loadSuper2500CardsFromBank() {
  const cards = [];
  // Always include a demo-style card that pulls easy questions (no topic filter)
  cards.push({
    id: "super2500-demo",
    category: "Demo",
    title: "Demo Test : Quick Warmup",
    questions: 10,
    marks: 20,
    mins: 15,
    attempts: 0,
    cp: 15,
    tier: "free",
    syllabus: true,
    recommended: true,
    resumable: false,
    firebaseQuery: { difficulty: "easy" }
  });

  // Mixed pools per difficulty
  for (const d of SUPER2500_DIFFICULTIES) {
    const cnt = await countQuestionsFor(null, d);
    if (cnt > 0) cards.push(mixedCardFromCount(d, cnt));
  }

  // Topic-wise pools across all topics + difficulties
  for (const topic of SUPER2500_TOPICS) {
    for (const d of SUPER2500_DIFFICULTIES) {
      const cnt = await countQuestionsFor(topic, d);
      if (cnt <= 0) continue;
      const chunkCount = Math.max(1, Math.ceil(cnt / SUPER2500_CHUNK_SIZE));
      for (let i = 0; i < chunkCount; i++) {
        cards.push(chunkCardFromCount(topic, d, cnt, i, SUPER2500_CHUNK_SIZE));
      }
    }
  }

  SUPER2500_TEST_CARDS = cards;
}

function seedFallbackSuper2500Cards() {
  // Always show something immediately so Explore doesn't look empty.
  SUPER2500_TEST_CARDS = [
    {
      id: "super2500-demo",
      category: "Demo",
      title: "Demo Test : Quick Warmup",
      questions: 10,
      marks: 20,
      mins: 15,
      attempts: 0,
      cp: 15,
      tier: "free",
      syllabus: true,
      recommended: true,
      resumable: false,
      poolCount: 0,
      firebaseQuery: { difficulty: "easy" }
    },
    {
      id: "super2500-arrays-easy",
      category: "Topic-wise",
      title: "Arrays • EASY Set",
      questions: 15,
      marks: 30,
      mins: 30,
      attempts: 0,
      cp: 25,
      tier: "free",
      syllabus: true,
      recommended: true,
      resumable: false,
      poolCount: 0,
      firebaseQuery: { topic: "arrays", difficulty: "easy" }
    },
    {
      id: "super2500-strings-easy",
      category: "Topic-wise",
      title: "Strings • EASY Set",
      questions: 15,
      marks: 30,
      mins: 30,
      attempts: 0,
      cp: 25,
      tier: "free",
      syllabus: true,
      recommended: true,
      resumable: false,
      poolCount: 0,
      firebaseQuery: { topic: "strings", difficulty: "easy" }
    },
    {
      id: "super2500-graphs-medium",
      category: "Topic-wise",
      title: "Graphs • MEDIUM Set",
      questions: 20,
      marks: 40,
      mins: 40,
      attempts: 0,
      cp: 35,
      tier: "pro",
      syllabus: true,
      recommended: true,
      resumable: false,
      poolCount: 0,
      firebaseQuery: { topic: "graphs", difficulty: "medium" }
    }
  ];
}

let activeTab = "test"; // test | study | ann
let activeSubTab = "recommended"; // recommended | all
let activeFilter = "all"; // all | attempted | non | resume

const LEET_TEST_PAGE_SIZE = 40;
let LEET_TEST_PAGE_INDEX = 0;

const LEET_PROBLEM_PAGE_SIZE = 40;
let LEET_PROBLEM_PAGE_START_AFTER = "";
let LEET_PROBLEM_PAGE_STACK = [];
let LEET_PROBLEM_PAGE_HAS_MORE = false;
let LEET_PROBLEM_PAGE_ITEMS = [];

function el(tag, cls) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  return n;
}

function qs(name) {
  return new URLSearchParams(location.search).get(name) || "";
}

function setHeaderFromQuery() {
  const series = qs("series") || "super2500";
  const title = document.getElementById("seriesTitle");
  const sub = document.getElementById("seriesSub");
  if (!title || !sub) return;

  const meta = SERIES_META[series];
  title.textContent = meta?.title || "Test Series";
  sub.textContent = meta?.sub || "Test Series";
}

function hydrateInitialTab() {
  const qTab = (qs("tab") || "").toLowerCase();
  if (qTab === "study") activeTab = "study";
  else if (qTab === "ann" || qTab === "announcements") activeTab = "ann";
  else activeTab = "test";

  const qSub = (qs("subtab") || "").toLowerCase();
  if (qSub === "recommended" || qSub === "all" || qSub === "problem") {
    activeSubTab = qSub;
  }

  // For super2500, default to showing ALL tests so nothing feels missing.
  const series = qs("series") || "super2500";
  if (series === "super2500") activeSubTab = "all";

  // For leetcode, default to Per Problem so users see the full 3874-card list.
  if (series === "leetcode" && !qSub) activeSubTab = "problem";
}

function applyTabs() {
  for (const b of document.querySelectorAll(".tsdTab")) {
    const on = b.dataset.tab === activeTab;
    b.classList.toggle("on", on);
    b.setAttribute("aria-selected", on ? "true" : "false");
  }

  document.getElementById("panel-test")?.classList.toggle("isHidden", activeTab !== "test");
  document.getElementById("panel-study")?.classList.toggle("isHidden", activeTab !== "study");
  document.getElementById("panel-ann")?.classList.toggle("isHidden", activeTab !== "ann");
}

function applySubTabs() {
  for (const b of document.querySelectorAll(".tsdSubTab")) {
    const on = b.dataset.subtab === activeSubTab;
    b.classList.toggle("on", on);
    b.setAttribute("aria-selected", on ? "true" : "false");
  }

  const series = qs("series") || "super2500";
  const isLeet = String(series) === "leetcode";
  const bar = document.getElementById("tsdProblemBar");
  if (bar) bar.style.display = isLeet && activeSubTab === "problem" ? "block" : "none";

  const pager = document.getElementById("tsdPagerBar");
  if (pager) pager.style.display = isLeet && activeSubTab !== "problem" ? "block" : "none";
}

function setFilterUi() {
  const label = document.getElementById("tsdFilterLabel");
  if (label) {
    label.textContent =
      activeFilter === "attempted"
        ? "Attempted"
        : activeFilter === "non"
          ? "Non-Attempted"
          : activeFilter === "resume"
            ? "Resume"
            : "All (Default)";
  }

  for (const item of document.querySelectorAll(".tsdFilterItem")) {
    const on = item.dataset.filter === activeFilter;
    item.classList.toggle("on", on);
    item.setAttribute("aria-selected", on ? "true" : "false");
  }
}

function filterList(list) {
  let out = list;

  if (activeSubTab === "recommended") out = out.filter((t) => t.recommended);

  if (activeFilter === "attempted") out = out.filter((t) => t.attempts > 0);
  if (activeFilter === "non") out = out.filter((t) => t.attempts === 0);
  if (activeFilter === "resume") out = out.filter((t) => t.resumable);

  return out;
}

function clearLoadError() {
  LOAD_ERROR = "";
}

function seriesAllowsTests(seriesId) {
  // For now: only Super 2500 Pro Plus uses the Firebase-backed test cards.
  // Others can be mapped later.
  const s = String(seriesId || "");
  return s === "super2500" || s === "leetcode";
}

// LeetCode Test Integration Functions
async function startLeetCodeTestSession(problemName, testId) {
  try {
    console.log(`Starting LeetCode test session for: ${problemName}`);
    
    // Find test by problem name in Firebase
    const test = await findTestByProblemName(problemName);
    if (!test) {
      toast(`Test not found: ${problemName}`, "error", 3000);
      return;
    }
    
    // Create session
    const sessionId = await createLeetCodeTestSession(test.id, test.problem_name);
    if (!sessionId) {
      toast("Failed to create test session", "error", 3000);
      return;
    }
    
    // Store session ID
    sessionStorage.setItem(`leet_session_${test.id}`, sessionId);
    
    // Navigate to GATE-style test format
    window.location.href = new URL(`../leet-test/gate-test-format.html?test=${encodeURIComponent(test.id)}&session=${encodeURIComponent(sessionId)}`, import.meta.url).href;
    
  } catch (error) {
    console.error('Error starting LeetCode test session:', error);
    toast("Failed to start test session", "error", 3000);
  }
}

async function handleLeetCodeTest(testName, testId) {
  try {
    // Add null check for testName
    if (!testName) {
      console.warn('handleLeetCodeTest called with null testName');
      toast("Test name not found", "error", 3000);
      return;
    }
    
    toast("Searching for LeetCode test...", "info", 2000);
    
    // Find matching LeetCode test
    const leetTest = await findLeetCodeTest(testName);
    
    if (!leetTest) {
      toast("No matching LeetCode test found", "error", 3000);
      return;
    }
    
    // Check if test is locked
    const credentials = await getTestLockCredentials(testId);
    if (credentials && credentials.isLocked) {
      showAdminModal(testId, async (success) => {
        if (success) {
          await startLeetCodeTestSession(leetTest.problem_name, testId);
        }
      }, false); // unlock action
    } else {
      await startLeetCodeTestSession(leetTest.problem_name, testId);
    }
    
  } catch (error) {
    console.error('Error handling LeetCode test:', error);
    toast("Failed to load LeetCode test", "error", 3000);
  }
}

async function resumeLeetCodeTest(testId) {
  try {
    const sessionId = getStoredSessionId(testId);
    if (!sessionId) {
      toast("No active session found", "error", 3000);
      return;
    }
    
    // Navigate to GATE-style test format with resume flag
    window.location.href = new URL(`../leet-test/gate-test-format.html?test=${encodeURIComponent(testId)}&session=${encodeURIComponent(sessionId)}&resume=true`, import.meta.url).href;
    
  } catch (error) {
    console.error('Error resuming LeetCode test:', error);
    toast("Failed to resume test", "error", 3000);
  }
}

async function stopLeetCodeTest(testId) {
  try {
    const sessionId = getStoredSessionId(testId);
    if (!sessionId) {
      toast("No active session found", "error", 3000);
      return;
    }
    
    // Complete the test session
    await finishLeetCodeTest(sessionId);
    
    // Clear stored session
    clearStoredSessionId(testId);
    
    toast("Test stopped and saved", "success", 3000);
    
  } catch (error) {
    console.error('Error stopping LeetCode test:', error);
    toast("Failed to stop test", "error", 3000);
  }
}

async function analyzeLeetCodeTest(testId) {
  try {
    const sessionId = getStoredSessionId(testId);
    if (!sessionId) {
      toast("No completed test found for analysis", "error", 3000);
      return;
    }
    
    // Navigate to GATE-style results page
    window.location.href = new URL(`../leet-test/gate-results.html?session=${encodeURIComponent(sessionId)}`, import.meta.url).href;
    
  } catch (error) {
    console.error('Error analyzing LeetCode test:', error);
    toast("Failed to analyze test", "error", 3000);
  }
}

async function getTestLockCredentials(testId) {
  try {
    const lockDoc = await getDoc(doc(db, "test_locks", testId));
    if (lockDoc.exists()) {
      return lockDoc.data();
    }
    // Return default credentials if none exist
    return {
      username: "anjha",
      password: "320",
      code: "Kopilot_230",
      isLocked: false,
      createdAt: serverTimestamp()
    };
  } catch (error) {
    console.error('Error getting test lock credentials:', error);
    return null;
  }
}

async function updateTestLockState(testId, isLocked, credentials = null) {
  try {
    const lockData = {
      isLocked: isLocked,
      updatedAt: serverTimestamp()
    };
    
    if (credentials) {
      lockData.username = credentials.username;
      lockData.password = credentials.password;
      lockData.code = credentials.code;
    }
    
    await setDoc(doc(db, "test_locks", testId), lockData, { merge: true });
    console.log(`Test ${testId} lock state updated:`, isLocked);
    return true;
  } catch (error) {
    console.error('Error updating test lock state:', error);
    return false;
  }
}

async function verifyTestCredentials(testId, username, password, code) {
  try {
    const credentials = await getTestLockCredentials(testId);
    if (!credentials) return false;
    
    return credentials.username === username && 
           credentials.password === password && 
           credentials.code === code;
  } catch (error) {
    console.error('Error verifying test credentials:', error);
    return false;
  }
}

// Enhanced Admin Modal with credential management
function showAdminModal(testId, callback, isLockAction = true) {
  // Create modal overlay
  const modalOverlay = el("div", "tsdAdminModal");
  modalOverlay.style.display = "flex";
  
  // Create modal content
  const modalContent = el("div", "tsdAdminModalContent");
  
  const title = el("h3");
  title.textContent = isLockAction ? "Lock Test - Set Credentials" : "Unlock Test - Enter Credentials";
  
  const usernameInput = el("input");
  usernameInput.type = "text";
  usernameInput.placeholder = "Username";
  usernameInput.autocomplete = "off";
  
  const passwordInput = el("input");
  passwordInput.type = "password";
  passwordInput.placeholder = "Password";
  passwordInput.autocomplete = "off";
  
  const codeInput = el("input");
  codeInput.type = "text";
  codeInput.placeholder = "Access Code";
  codeInput.autocomplete = "off";
  
  // For unlock action, load existing credentials to show hints
  if (!isLockAction) {
    getTestLockCredentials(testId).then(credentials => {
      if (credentials) {
        usernameInput.placeholder = `Username (${credentials.username?.charAt(0)}****)`;
        passwordInput.placeholder = "Password";
        codeInput.placeholder = `Access Code (${credentials.code?.charAt(0)}****)`;
      }
    });
  }
  
  const buttonsContainer = el("div", "tsdAdminModalButtons");
  
  const submitButton = el("button", "tsdAdminModalSubmit");
  submitButton.textContent = isLockAction ? "Lock Test" : "Unlock Test";
  submitButton.type = "button";
  
  const cancelButton = el("button", "tsdAdminModalCancel");
  cancelButton.textContent = "Cancel";
  cancelButton.type = "button";
  
  buttonsContainer.appendChild(submitButton);
  buttonsContainer.appendChild(cancelButton);
  
  modalContent.appendChild(title);
  modalContent.appendChild(usernameInput);
  modalContent.appendChild(passwordInput);
  modalContent.appendChild(codeInput);
  modalContent.appendChild(buttonsContainer);
  
  modalOverlay.appendChild(modalContent);
  
  // Add to DOM
  document.body.appendChild(modalOverlay);
  
  // Focus on username input
  setTimeout(() => usernameInput.focus(), 100);
  
  // Handle submit
  submitButton.addEventListener("click", async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const code = codeInput.value.trim();
    
    if (!username || !password || !code) {
      toast("Please fill in all fields", "error", 2000);
      return;
    }
    
    if (isLockAction) {
      // Lock action - save new credentials and lock state
      const success = await updateTestLockState(testId, true, { username, password, code });
      if (success) {
        toast("Test locked successfully!", "success", 2000);
        callback(true);
        document.body.removeChild(modalOverlay);
        renderCards(); // Refresh to show updated lock state
      } else {
        toast("Failed to lock test", "error", 2000);
      }
    } else {
      // Unlock action - verify credentials
      const isValid = await verifyTestCredentials(testId, username, password, code);
      if (isValid) {
        const success = await updateTestLockState(testId, false);
        if (success) {
          toast("Test unlocked successfully!", "success", 2000);
          callback(true);
          document.body.removeChild(modalOverlay);
          renderCards(); // Refresh to show updated lock state
        }
      } else {
        toast("Invalid credentials!", "error", 2000);
        // Clear inputs on error
        passwordInput.value = "";
        codeInput.value = "";
        passwordInput.focus();
      }
    }
  });
  
  // Handle cancel
  cancelButton.addEventListener("click", () => {
    callback(false);
    document.body.removeChild(modalOverlay);
  });
  
  // Handle escape key
  const handleEscape = (e) => {
    if (e.key === "Escape") {
      callback(false);
      document.body.removeChild(modalOverlay);
      document.removeEventListener("keydown", handleEscape);
    }
  };
  document.addEventListener("keydown", handleEscape);
  
  // Handle overlay click
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
      callback(false);
      document.body.removeChild(modalOverlay);
      document.removeEventListener("keydown", handleEscape);
    }
  });
}

// Firebase Bookmark functionality
async function loadBookmarksFromFirebase() {
  try {
    const deviceId = getDeviceId();
    const bookmarkDoc = await getDoc(doc(db, "user_bookmarks", deviceId));
    if (bookmarkDoc.exists()) {
      BOOKMARKED_TESTS = bookmarkDoc.data().bookmarkedTests || [];
      console.log('Loaded bookmarks from Firebase:', BOOKMARKED_TESTS);
    } else {
      BOOKMARKED_TESTS = [];
      console.log('No bookmarks found in Firebase, starting with empty array');
    }
  } catch (error) {
    console.error('Error loading bookmarks from Firebase:', error);
    BOOKMARKED_TESTS = [];
  }
}

async function saveBookmarksToFirebase() {
  try {
    const deviceId = getDeviceId();
    await setDoc(doc(db, "user_bookmarks", deviceId), {
      bookmarkedTests: BOOKMARKED_TESTS,
      updatedAt: serverTimestamp(),
      deviceId: deviceId
    }, { merge: true });
    console.log('Saved bookmarks to Firebase:', BOOKMARKED_TESTS);
  } catch (error) {
    console.error('Error saving bookmarks to Firebase:', error);
    toast("Failed to save bookmarks", "error", 3000);
  }
}

async function toggleBookmark(testId) {
  console.log('Toggle bookmark called with testId:', testId);
  console.log('Current bookmarks:', BOOKMARKED_TESTS);
  
  const index = BOOKMARKED_TESTS.indexOf(testId);
  if (index > -1) {
    // Remove bookmark
    BOOKMARKED_TESTS.splice(index, 1);
    toast("Bookmark removed", "success", 2000);
  } else {
    // Add bookmark
    BOOKMARKED_TESTS.push(testId);
    toast("Test bookmarked", "success", 2000);
  }
  
  // Save to Firebase
  await saveBookmarksToFirebase();
  
  // Re-render cards to update bookmark button state
  renderCards();
}

function isBookmarked(testId) {
  const result = BOOKMARKED_TESTS.includes(testId);
  console.log('Is bookmarked check for', testId, ':', result);
  return result;
}

function getStoredSessionId(testId) {
  try {
    return sessionStorage.getItem("test-" + String(testId) + "-session") || "";
  } catch {
    return "";
  }
}

async function startFirebaseTest(testCardId) {
  try {
    const series = qs("series") || "super2500";
    const pool = String(series) === "leetcode" ? LEETCODE_TEST_CARDS : SUPER2500_TEST_CARDS;
    const card = pool.find((c) => c.id === String(testCardId));
    if (!card) {
      toast("Test not found", "error", 2600);
      return;
    }

    toast("Fetching questions…");
    clearLoadError();

    // Fetch questions for this specific test pack
    const isLeet = String(series) === "leetcode";
    const colRef = isLeet ? collection(db, SUPER4000_BANK_COL) : collection(db, "super_2500_pro_plus");
    const baseClauses = [];
    if (isLeet) baseClauses.push(where("kind", "==", "mcq"));
    if (card.firebaseQuery?.problemSlug) baseClauses.push(where("problemSlug", "==", String(card.firebaseQuery.problemSlug)));
    if (card.firebaseQuery?.topic) baseClauses.push(where("topic", "==", String(card.firebaseQuery.topic)));
    if (card.firebaseQuery?.difficulty) baseClauses.push(where("difficulty", "==", String(card.firebaseQuery.difficulty)));

    const take = Math.max(1, Number(card.firebaseQuery?.limit || card.questions || 10));
    const startAfterId = !isLeet ? String(card.firebaseQuery?.startAfterId || "") : "";
    const q = startAfterId
      ? query(colRef, ...baseClauses, orderBy("__name__"), startAfter(startAfterId), limit(take))
      : query(colRef, ...baseClauses, orderBy("__name__"), limit(take));

    const snap = await getDocs(q);
    let questions = [];
    
    // If this is a demo test, use the embedded demo questions
    if (card.isDemo && card.demoQuestions) {
      questions = card.demoQuestions;
      toast("🎯 Loading Demo Test with custom questions...", "success", 2000);
    } else {
      snap.forEach((d) => questions.push({ id: d.id, ...d.data() }));
    }

    if (!questions.length) {
      toast("No questions matched for this test", "error", 2800);
      return;
    }

    const sessionId = `session_${Date.now()}_${String(card.id)}`;
    const sessionData = {
      id: sessionId,
      testId: String(card.id),
      testTitle: String(card.title || "Test"),
      questions,
      startTime: serverTimestamp(),
      duration: Number(card.mins || 0),
      totalMarks: Number(card.marks || 0),
      status: "active",
      currentQuestionIndex: 0,
      answers: {},
      createdAt: serverTimestamp()
    };

    await setDoc(doc(db, "test_sessions", sessionId), sessionData);
    try {
      sessionStorage.setItem("test-" + String(card.id) + "-session", String(sessionId));
    } catch {
      // ignore
    }
    window.location.href = new URL(`../play/play.html?session=${encodeURIComponent(sessionId)}&test=${encodeURIComponent(String(card.id))}`, import.meta.url).href;
  } catch (e) {
    LOAD_ERROR = String(e?.message || e || "Failed to start test");
    console.error("[series] startFirebaseTest failed", e);
    toast("Failed to start test", "error", 2600);
  }
}

function renderCards() {
  const host = document.getElementById("tsdCards");
  if (!host) {
    console.error('tsdCards host element not found');
    return;
  }

  const series = qs("series") || "super2500";
  const isLeet = String(series) === "leetcode";
  console.log('Rendering cards for series:', series, 'isLeet:', isLeet, 'activeSubTab:', activeSubTab);
  
  const base =
    String(series) === "leetcode"
      ? activeSubTab === "problem"
        ? LEET_PROBLEM_PAGE_ITEMS.filter((p) => !p.__hidden).map((p) => p.__card)
        : LEETCODE_TEST_CARDS
      : seriesAllowsTests(series)
        ? SUPER2500_TEST_CARDS
        : [];
  
  // Debug logging
  console.log('Base cards source:', String(series) === "leetcode" ? 
    (activeSubTab === "problem" ? "LEET_PROBLEM_PAGE_ITEMS" : "LEETCODE_TEST_CARDS") :
    seriesAllowsTests(series) ? "SUPER2500_TEST_CARDS" : "[]");
  console.log('Base cards count:', base.length);
  
  const list = filterList(base);
  console.log('Filtered cards count:', list.length);

  // paginate LeetCode test packs (Recommended/All)
  let listView = list;
  if (isLeet && activeSubTab !== "problem" && activeSubTab !== "bookmarks") {
    const totalPages = Math.max(1, Math.ceil(list.length / LEET_TEST_PAGE_SIZE));
    if (LEET_TEST_PAGE_INDEX >= totalPages) LEET_TEST_PAGE_INDEX = Math.max(0, totalPages - 1);
    const start = LEET_TEST_PAGE_INDEX * LEET_TEST_PAGE_SIZE;
    const end = start + LEET_TEST_PAGE_SIZE;
    listView = list.slice(start, end);
    if (prevBtn) prevBtn.disabled = LEET_TEST_PAGE_INDEX <= 0;
    if (nextBtn) nextBtn.disabled = LEET_TEST_PAGE_INDEX >= totalPages - 1;
  }
  
  // Filter for bookmarks tab
  if (activeSubTab === "bookmarks") {
    console.log('Filtering for bookmarks. Current bookmarks:', BOOKMARKED_TESTS);
    console.log('Available cards:', list.map(card => ({ id: card.id, firebaseTestId: card.firebaseTestId, title: card.title })));
    listView = list.filter(card => {
      const cardId = card.id || card.firebaseTestId;
      const isBookmarked = BOOKMARKED_TESTS.includes(cardId);
      console.log(`Card ${card.title} (${cardId}) is bookmarked:`, isBookmarked);
      return isBookmarked;
    });
    console.log('Filtered bookmarked cards:', listView.length);
  }
  
  // Limit to first 20 cards for all views
  listView = listView.slice(0, 20);

  host.innerHTML = "";
  if (!listView.length) {
    const empty = el("div", "tsdEmpty");
    const msg = LOAD_ERROR
      ? `Unable to load tests. ${escapeHtml(LOAD_ERROR)}`
      : seriesAllowsTests(series)
        ? String(series) === "leetcode"
          ? `No test cards configured for this series (questions are fetched from Firebase: ${SUPER4000_BANK_COL})`
          : "No test cards configured for this series (questions are fetched from Firebase: super_2500_pro_plus)"
        : "Explore will show attemptable tests here once they are mapped to this series.";
    empty.innerHTML = `
      <h2 class="tsdEmptyTitle">No tests available</h2>
      <div class="tsdEmptySub">${msg}</div>
    `;
    host.appendChild(empty);
    return;
  }
  for (const t of listView) {
    const cardIndex = listView.indexOf(t) + 1;
    const card = el("article", "tsdCard");
    
    // Apply difficulty-based color scheme
    const difficulty = String(t.difficulty || "").toLowerCase();
    if (difficulty === "easy" || difficulty === "free") {
      card.classList.add("difficulty-easy");
    } else if (difficulty === "medium" || difficulty === "plus") {
      card.classList.add("difficulty-medium");
    } else if (difficulty === "hard" || difficulty === "pro") {
      card.classList.add("difficulty-hard");
    }
    
    // Add number label and analyze button container
    const topRightContainer = el("div", "tsdTopRightContainer");
    
    // Add question number label
    const numberLabel = el("div", "tsdNumberLabel");
    numberLabel.textContent = `#${cardIndex}`;
    
    // Add demo indicator for first test
    if (t.isDemo) {
      numberLabel.textContent += " Demo";
      numberLabel.title = "Demo Test with Custom Questions";
    }
    
    // Add analyze button with tier-based text
    const analyzeButton = el("button", "tsdAnalyzeButton");
    analyzeButton.type = "button";
    analyzeButton.dataset.action = "analyze";
    analyzeButton.dataset.testId = t.firebaseTestId || t.id;
    
    // Set analyze button text and tier-based colors
    analyzeButton.innerHTML = "Analyze";
    
    // Apply tier-based colors
    const buttonTier = String(t.tier || "free").toLowerCase();
    if (buttonTier === "pro") {
      analyzeButton.style.cssText = "background: linear-gradient(135deg, rgba(236,72,153,.2), rgba(236,72,153,.1)); border: 1px solid rgba(236,72,153,.3); color: rgba(251,207,232,.95);";
    } else if (buttonTier === "plus") {
      analyzeButton.style.cssText = "background: linear-gradient(135deg, rgba(59,130,246,.2), rgba(59,130,246,.1)); border: 1px solid rgba(59,130,246,.3); color: rgba(147,197,253,.95);";
    } else {
      analyzeButton.style.cssText = "background: linear-gradient(135deg, rgba(34,197,94,.2), rgba(34,197,94,.1)); border: 1px solid rgba(34,197,94,.3); color: rgba(134,239,172,.95);";
    }
    
    analyzeButton.title = "Analyze test performance";
    
    topRightContainer.appendChild(numberLabel);
    topRightContainer.appendChild(analyzeButton);
    card.appendChild(topRightContainer);

    const row = el("div", "tsdRow");
    const main = el("div", "tsdMain");
    const side = el("div", "tsdSide");

    const tier = String(t.tier || "free").toLowerCase();
    const badgeClass = tier === "pro" ? "pro" : tier === "plus" ? "plus" : "free";
    const badgeLabel = tier === "pro" ? "Pro" : tier === "plus" ? "Plus" : "Free";
    const badge = el("span", `tsdBadge ${badgeClass}`);
    badge.textContent = badgeLabel;

    const name = el("h3", "tsdName");
    name.textContent = t.title;

    // Enhanced stats with metrics
    const stats = el("div", "tsdStats");
    const maxScore = t.maxScore || t.marks || 0;
    const minScore = t.minScore || 0;
    const maxTime = t.maxTime || t.mins || 0;
    const minTime = t.minTime || 0;
    const attempts = t.attempts || 0;
    
    stats.innerHTML = `
      <span class="tsdStatItem"><i class="tsdIcon">Questions</i> ${t.questions} Questions</span>
      <span class="tsdSep">|</span>
      <span class="tsdStatItem"><i class="tsdIcon">Score</i> ${t.marks} Marks</span>
      <span class="tsdSep">|</span>
      <span class="tsdStatItem"><i class="tsdIcon">Time</i> ${t.mins} Mins</span>
      <span class="tsdSep">|</span>
      <span class="tsdStatItem"><i class="tsdIcon">Attempts</i> ${attempts} Attempts</span>
    `;

    // Enhanced metrics section - single line analytics without boxes
    const metrics = el("div", "tsdMetrics tsdMetricsLine");
    metrics.innerHTML = `
      <div class="analytics-single-line">
        <span class="analytics-metric">Max Score: <strong>${t.maxScored || 0}</strong></span>
        <span class="analytics-separator">|</span>
        <span class="analytics-metric">Min Score: <strong>${t.minScored || 0}</strong></span>
        <span class="analytics-separator">|</span>
        <span class="analytics-metric">Max Time: <strong>${formatTime(t.maxTime || 0)}</strong></span>
        <span class="analytics-separator">|</span>
        <span class="analytics-metric">Min Time: <strong>${formatTime(t.minTime || 0)}</strong></span>
        <span class="analytics-separator">|</span>
        <span class="analytics-metric">Max Question: <strong>${t.maxQuestionAttempt || 0}</strong></span>
        <span class="analytics-separator">|</span>
        <span class="analytics-metric">Min Question: <strong>${t.minQuestionAttempt || 0}</strong></span>
      </div>
    `;
    
    // Helper function to format time
    function formatTime(seconds) {
      if (!seconds) return '0s';
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      if (mins > 0) {
        return `${mins}m ${secs}s`;
      }
      return `${secs}s`;
    }

    // Add bookmark button near tier badge
    const bookmarkContainer = el("div", "tsdBookmarkContainer");
    
    const bookmarkButton = el("button", "tsdBookmarkButton");
    bookmarkButton.type = "button";
    bookmarkButton.dataset.action = "bookmark";
    const testIdForBookmark = t.firebaseTestId || t.id;
    bookmarkButton.dataset.testId = testIdForBookmark;
    
    console.log(`Creating bookmark button for test: ${t.title}, ID: ${testIdForBookmark}`);
    
    const isBookmarkedTest = isBookmarked(testIdForBookmark);
    if (isBookmarkedTest) {
      bookmarkButton.innerHTML = "⭐";
      bookmarkButton.title = "Remove bookmark";
      bookmarkButton.style.cssText = "background: linear-gradient(135deg, rgba(251,191,36,.4), rgba(251,191,36,.2)); color: rgba(252,211,77,1); border: 1px solid rgba(251,191,36,.5); padding: 8px 12px; border-radius: 12px; cursor: pointer; font-size: 16px; box-shadow: 0 4px 12px rgba(251,191,36,.3); margin-left: 8px;";
    } else {
      bookmarkButton.innerHTML = "⭐";
      bookmarkButton.title = "Bookmark this test";
      bookmarkButton.style.cssText = "background: linear-gradient(135deg, rgba(251,191,36,.2), rgba(251,191,36,.1)); color: rgba(252,211,77,.95); border: 1px solid rgba(251,191,36,.3); padding: 8px 12px; border-radius: 12px; cursor: pointer; font-size: 16px; margin-left: 8px;";
    }

    bookmarkContainer.appendChild(badge);
    bookmarkContainer.appendChild(bookmarkButton);
    main.appendChild(bookmarkContainer);
    main.appendChild(name);
    main.appendChild(stats);
    main.appendChild(metrics);

    const started = el("div", "tsdStarted");
    if (t.startedOn) {
      started.textContent = `Started on ${t.startedOn}`;
    } else {
      started.style.display = "none";
    }

    const isLeet = String(series) === "leetcode";
    const hasMeta = Boolean(t && (t.difficulty || (Array.isArray(t.companies) && t.companies.length) || (Array.isArray(t.topics) && t.topics.length)));
    const meta = el("div", "tsdMeta");
    if (isLeet && hasMeta) {
      const d = String(t.difficulty || "").toLowerCase();
      const comps = Array.isArray(t.companies) ? t.companies.join(", ") : "";
      const tops = Array.isArray(t.topics) ? t.topics.join(", ") : "";
      meta.textContent = `${d ? "Difficulty: " + d : ""}${d && comps ? " • " : ""}${comps ? "Companies: " + comps : ""}${(d || comps) && tops ? " • " : ""}${tops ? "Topics: " + tops : ""}`;
    } else {
      meta.style.display = "none";
    }

    main.appendChild(started);
    main.appendChild(meta);

    row.appendChild(main);
    card.appendChild(row);

    // Add action buttons at the bottom
    const bottomActionContainer = el("div", "tsdBottomActionContainer");
    
    const action = el("button", "tsdAction");
    action.type = "button";
    action.dataset.action = "start";
    const actionTestId = t.firebaseTestId || t.id;
    action.dataset.testId = actionTestId;
    // Add problem name for LeetCode tests
    if (t.problemName) {
      action.dataset.testName = t.problemName;
    } else if (t.title) {
      action.dataset.testName = t.title;
    } else {
      console.warn('No problem name or title found for test card:', t);
    }
    action.textContent = t.attempts > 0 ? "Reattempt" : "Start";

    const resumeButton = el("button", "tsdAction");
    resumeButton.type = "button";
    resumeButton.dataset.action = "resume";
    resumeButton.dataset.testId = actionTestId;
    resumeButton.textContent = "Resume";

    // Add stop button for active tests
    const stopButton = el("button", "tsdStopButton");
    stopButton.type = "button";
    stopButton.dataset.action = "stop";
    stopButton.dataset.testId = actionTestId;
    stopButton.textContent = "Stop";
    stopButton.title = "Stop current test session";
    
    // Enable Resume/Stop only when a session exists; otherwise keep visible but muted
    const storedSessionId = getStoredSessionId(actionTestId);
    if (storedSessionId) {
      resumeButton.disabled = false;
      stopButton.disabled = false;
      resumeButton.classList.remove("tsdActionMuted");
      stopButton.classList.remove("tsdActionMuted");
    } else {
      resumeButton.disabled = true;
      stopButton.disabled = true;
      resumeButton.classList.add("tsdActionMuted");
      stopButton.classList.add("tsdActionMuted");
    }

    // Add lock/unlock buttons below start button
    const lockContainer = el("div", "tsdLockContainer");
    
    const lockButton = el("button", "tsdLockButton");
    lockButton.type = "button";
    lockButton.dataset.action = "lock";
    lockButton.dataset.testId = actionTestId;
    lockButton.innerHTML = "🔒 Lock";
    lockButton.title = "Lock test - requires admin code to start";
    
    const unlockButton = el("button", "tsdUnlockButton");
    unlockButton.type = "button";
    unlockButton.dataset.action = "unlock";
    unlockButton.dataset.testId = actionTestId;
    unlockButton.innerHTML = "🔓 Unlock";
    unlockButton.title = "Unlock test - allows starting without admin code";
    
    // Check current lock state from Firebase and highlight appropriate button
    getTestLockCredentials(actionTestId).then(credentials => {
      if (credentials && credentials.isLocked) {
        lockButton.classList.add("inactive");
        unlockButton.classList.add("active");
        lockButton.style.opacity = "0.5";
        unlockButton.style.opacity = "1";
      } else {
        lockButton.classList.add("active");
        unlockButton.classList.add("inactive");
        lockButton.style.opacity = "1";
        unlockButton.style.opacity = "0.5";
      }
    }).catch(error => {
      console.error('Error checking lock state:', error);
      // Default to unlocked state
      lockButton.classList.add("active");
      unlockButton.classList.add("inactive");
      lockButton.style.opacity = "1";
      unlockButton.style.opacity = "0.5";
    });
    
    lockContainer.appendChild(lockButton);
    lockContainer.appendChild(unlockButton);
    
    const actionLeft = el("div", "tsdActionLeft");
    const actionRight = el("div", "tsdActionRight");

    actionLeft.appendChild(action);
    actionRight.appendChild(resumeButton);
    actionRight.appendChild(stopButton);

    bottomActionContainer.appendChild(actionLeft);
    bottomActionContainer.appendChild(actionRight);
    card.appendChild(bottomActionContainer);
    card.appendChild(lockContainer);
    host.appendChild(card);
  }
}

function closeFilterMenu() {
  const menu = document.getElementById("tsdFilterMenu");
  const btn = document.getElementById("tsdFilterBtn");
  if (!menu || !btn) return;
  menu.classList.remove("open");
  btn.setAttribute("aria-expanded", "false");
}

function toggleFilterMenu() {
  const menu = document.getElementById("tsdFilterMenu");
  const btn = document.getElementById("tsdFilterBtn");
  if (!menu || !btn) return;

  const open = !menu.classList.contains("open");
  menu.classList.toggle("open", open);
  btn.setAttribute("aria-expanded", open ? "true" : "false");
}

document.addEventListener("click", async (e) => {
  const tab = e.target.closest("button.tsdTab");
  if (tab) {
    activeTab = tab.dataset.tab || "test";
    applyTabs();
    closeFilterMenu();
    return;
  }

  const sub = e.target.closest("button.tsdSubTab");
  if (sub) {
    activeSubTab = sub.dataset.subtab || "recommended";
    LEET_TEST_PAGE_INDEX = 0;
    applySubTabs();
    ensureLeetProblemPage();
    renderCards();
    closeFilterMenu();
    return;
  }

  const pagerPrev = e.target.closest("#tsdPagerPrev");
  if (pagerPrev) {
    if (LEET_TEST_PAGE_INDEX > 0) LEET_TEST_PAGE_INDEX--;
    renderCards();
    return;
  }

  const pagerNext = e.target.closest("#tsdPagerNext");
  if (pagerNext) {
    LEET_TEST_PAGE_INDEX++;
    renderCards();
    return;
  }

  const filterBtn = e.target.closest("#tsdFilterBtn");
  if (filterBtn) {
    toggleFilterMenu();
    return;
  }

  const filterItem = e.target.closest("button.tsdFilterItem");
  if (filterItem) {
    activeFilter = filterItem.dataset.filter || "all";
    setFilterUi();
    renderCards();
    closeFilterMenu();
    return;
  }

  const menu = document.getElementById("tsdFilterMenu");
  if (menu && menu.classList.contains("open") && !e.target.closest(".tsdFilterWrap")) {
    closeFilterMenu();
  }

  const testBtn = e.target.closest("button[data-test-id][data-action]");
  if (testBtn) {
    const id = testBtn.getAttribute("data-test-id") || "";
    const action = testBtn.getAttribute("data-action") || "details";
    
    if (action === "lock") {
      // Lock the test - set credentials and lock state
      showAdminModal(id, (success) => {
        // Lock state is updated in Firebase via the modal
      }, true); // isLockAction = true
      return;
    }
    
    if (action === "unlock") {
      // Unlock the test - verify credentials and unlock
      showAdminModal(id, (success) => {
        // Unlock state is updated in Firebase via the modal
      }, false); // isLockAction = false
      return;
    }

    if (action === "start") {
      // Get current series
      const series = qs("series") || "super2500";
      
      // Check if this is a LeetCode test
      if (series === "leetcode") {
        await handleLeetCodeTest(testBtn.getAttribute("data-test-name"), id);
        return;
      }
      
      // Check if test is locked from Firebase
      getTestLockCredentials(String(id)).then(credentials => {
        if (credentials && credentials.isLocked) {
          showAdminModal(String(id), (success) => {
            if (success) {
              // Test unlocked, proceed with starting test
              try {
                sessionStorage.removeItem("test-" + String(id) + "-session");
              } catch {
                // ignore
              }
              startFirebaseTest(String(id));
            }
          }, false); // isLockAction = false (unlock)
        } else {
          // Test not locked, proceed normally
          try {
            sessionStorage.removeItem("test-" + String(id) + "-session");
          } catch {
            // ignore
          }
          startFirebaseTest(id);
        }
      }).catch(error => {
        console.error('Error checking lock state:', error);
        // Default to allowing start if error occurs
        try {
          sessionStorage.removeItem("test-" + String(id) + "-session");
        } catch {
          // ignore
        }
        startFirebaseTest(id);
      });
      return;
    }

    if (action === "resume") {
      // Get current series
      const series = qs("series") || "super2500";
      
      // Check if this is a LeetCode test
      if (series === "leetcode") {
        await resumeLeetCodeTest(id);
        return;
      }
      
      const sid = getStoredSessionId(id);
      if (!sid) {
        startFirebaseTest(id);
        return;
      }
      window.location.href = new URL(`../play/play.html?session=${encodeURIComponent(String(sid))}&test=${encodeURIComponent(String(id))}`, import.meta.url).href;
      return;
    }
    
    if (action === "stop") {
      // Get current series
      const series = qs("series") || "super2500";
      
      // Check if this is a LeetCode test
      if (series === "leetcode") {
        await stopLeetCodeTest(id);
        return;
      }
      
      const sid = getStoredSessionId(id);
      if (!sid) {
        toast("No active session found", "error", 2000);
        return;
      }
      stopFirebaseTest(String(id), sid);
      return;
    }

    if (action === "analyze") {
      // Get current series
      const series = qs("series") || "super2500";
      
      // Check if this is a LeetCode test
      if (series === "leetcode") {
        await analyzeLeetCodeTest(id);
        return;
      }
      
      const sid = getStoredSessionId(id);
      if (!sid) {
        toast("No completed test found for analysis", "error", 2000);
        return;
      }
      window.location.href = new URL(`../analysis/analysis.html?session=${encodeURIComponent(String(sid))}&test=${encodeURIComponent(String(id))}`, import.meta.url).href;
      return;
    }

    if (action === "bookmark") {
      toggleBookmark(id);
      return;
    }

    if (typeof toast === "function") toast(`Test • ${action === "syllabus" ? "View Syllabus" : action}`);

    return;
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeFilterMenu();
});

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Step through test functionality
function stepThroughTest(testId) {
  if (typeof toast === "function") toast("Step mode activated - Navigate questions one by one");
  
  // Store step mode in sessionStorage
  sessionStorage.setItem("test-" + testId + "-step-mode", "true");
  
  // Navigate to test with step mode enabled
  const url = new URL(`../play/play.html?testId=${encodeURIComponent(testId)}&stepMode=true`, import.meta.url).href;
  window.open(url, '_blank');
}

// Stop test functionality
function stopTest(testId) {
  if (typeof toast === "function") toast("Stopping test session...");
  
  // Clear test session data
  sessionStorage.removeItem("test-" + testId + "-session");
  sessionStorage.removeItem("test-" + testId + "-step-mode");
  sessionStorage.removeItem("test-" + testId + "-current-question");
  
  // Update UI to reflect stopped state
  setTimeout(() => {
    renderCards(); // Refresh cards to update button states
    if (typeof toast === "function") toast("Test session stopped");
  }, 500);
  
  // Optional: Send stop event to analytics or backend
  if (typeof gtag === "function") {
    gtag('event', 'test_stopped', {
      'test_id': testId,
      'timestamp': new Date().toISOString()
    });
  }
}

async function boot() {
  try {
    // Load bookmarks from Firebase first (with error handling)
    try {
      await loadBookmarksFromFirebase();
    } catch (bookmarkError) {
      console.error('Failed to load bookmarks from Firebase:', bookmarkError);
      BOOKMARKED_TESTS = []; // Fallback to empty array
    }
    
    setHeaderFromQuery();
    hydrateInitialTab();
    applyTabs();
    applySubTabs();
    setFilterUi();

    const series = qs("series") || "super2500";
    if (String(series) === "super2500") {
      // Render immediately with fallback cards, then hydrate from Firebase.
      seedFallbackSuper2500Cards();
      renderCards();

      // Update header with total count (best-effort)
      try {
        SUPER2500_TOTAL_BANK_COUNT = await countAllSuper2500();
      } catch (e) {
        SUPER2500_TOTAL_BANK_COUNT = 0;
      }
      setSuper2500HeaderCount();

      try {
        await loadSuper2500CardsFromBank();
        renderCards();
      } catch (e) {
        LOAD_ERROR = String(e?.message || e || "Cannot prepare test cards");
        console.error("[series] loadSuper2500CardsFromBank failed", e);
        // Keep fallback cards visible.
      }
      return;
    }

    if (String(series) === "leetcode") {
      seedFallbackLeetCodeCards();
      renderCards();

      if (activeSubTab === "problem") {
        try {
          await ensureLeetProblemPage();
        } catch (e) {
          LOAD_ERROR = String(e?.message || e || "Cannot load problem cards");
          console.error("[series] ensureLeetProblemPage failed", e);
        }
      }

      try {
        LEETCODE_TOTAL_BANK_COUNT = await countAllLeetCodeMcqs();
      } catch (e) {
        LEETCODE_TOTAL_BANK_COUNT = 0;
      }
      setLeetCodeHeaderCount();

      try {
        await loadLeetCodeCardsFromBank();
        renderCards();
      } catch (e) {
        LOAD_ERROR = String(e?.message || e || "Cannot prepare test cards");
        console.error("[series] loadLeetCodeCardsFromBank failed", e);
      }
      return;
    }

    renderCards();
  } catch (e) {
    LOAD_ERROR = String(e?.message || e || "Series page failed to load");
    console.error("[series] boot failed", e);
    renderCards();
  }
}

boot();
