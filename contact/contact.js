import { setPillStatus, toast } from "../shared/ui.js";
import { db, api } from "../shared/firebase.js";

const el = (id) => document.getElementById(id);

const FAQ_TOP_100 = [
  {
    q: "How do I start a test?",
    a: "Go to Test Series → pick a test → press Start. If Start is disabled, check lock status or login/session requirements (if enabled)."
  },
  {
    q: "Why is the Start button not working?",
    a: "Usually it’s due to an active lock, missing session, or Firestore permission/rules. Try refreshing the page and ensure Firestore is reachable."
  },
  {
    q: "How is my score calculated?",
    a: "By default, correct answers add marks and wrong MCQs may apply negative marking (depends on the test settings). Your results page shows a breakdown."
  },
  {
    q: "What question types are supported?",
    a: "MCQ, MSQ, NAT, True/False, Fill in the Blank, One-word, Assertion-Reason, and Matching (based on how the test was created)."
  },
  {
    q: "Can I resume a test later?",
    a: "If the test session is saved, you can use Resume from the test card. If the session expires, you may need to restart."
  },
  {
    q: "Do I get negative marking?",
    a: "Some tests apply negative marking (commonly MCQ only). The exact marking scheme should be shown on the test page/instructions."
  },
  {
    q: "How do I mark a question for review?",
    a: "Use the “Mark for Review” button on the test screen. The question palette color changes to help you revisit it."
  },
  {
    q: "How do I see my answers after submission?",
    a: "Open the results/analysis view after submitting. It shows your answer, correct answer, and explanations (if provided)."
  },
  {
    q: "Why is my rank/CP not updating?",
    a: "Rank/CP depends on session sync. Refresh the leaderboard and verify your profile/session is loaded. If it persists, share a screenshot and your username/email."
  },
  {
    q: "Can I request a new topic or company tag?",
    a: "Yes. Send a Feature Request with the topic/company name and the types of questions you want."
  },
  {
    q: "How do I report a wrong answer/explanation?",
    a: "Send the test name, question number, your expected answer, and why. If possible, attach a screenshot."
  },
  {
    q: "Is there a timer for tests?",
    a: "Yes for timed tests. The timer is shown in the header. Some tests may allow practice mode without strict timing (if enabled)."
  },
  {
    q: "What happens when time runs out?",
    a: "The test is auto-submitted (or moved to submission state) depending on the test format."
  },
  {
    q: "Can I change an answer before submitting?",
    a: "Yes. You can update your selection any time before submission."
  },
  {
    q: "Do you store my email/message?",
    a: "Yes. The contact form stores your email + message in Firestore so it can be tracked and responded to."
  },
  {
    q: "Will my email be public?",
    a: "The platform can display recent emails on the contact page if enabled. If you want to hide it, ask to disable public listing."
  },
  {
    q: "Can I delete my contact message?",
    a: "If you want a message removed, send the same email and mention the timestamp/subject; it can be deleted manually."
  },
  {
    q: "Do I need to login to attempt tests?",
    a: "Some features can work without login, but saving attempts/results typically needs an identity/session."
  },
  {
    q: "How do locks work?",
    a: "Locked tests require an unlock credential (admin-set). Unlocking allows you to start/resume."
  },
  {
    q: "Why does a test show ‘No matching test found’?",
    a: "It can happen if the test card name doesn’t match the Firestore `problem_name` exactly, or Firestore cannot be reached."
  },
  {
    q: "How can I search for a specific problem/test?",
    a: "Use the search input on the Test Series page. Searching supports partial matches and filters." 
  },
  {
    q: "Can I bookmark tests or questions?",
    a: "If bookmarks are enabled, use the bookmark icon on a card/question. Bookmarks appear in the Bookmarks tab." 
  },
  {
    q: "What is MSQ and how is it evaluated?",
    a: "MSQ allows multiple correct choices. You must select the exact set of correct options (no extra/missing) to be marked correct." 
  },
  {
    q: "What is NAT and how do I enter answers?",
    a: "NAT is Numerical Answer Type. Enter a number (integer/decimal) as required. Avoid extra spaces." 
  },
  {
    q: "What is Assertion-Reason format?",
    a: "You choose among standard combinations (Both True, Assertion only, Reason only, Both False) based on the given statements." 
  },
  {
    q: "How do Matching questions work?",
    a: "Match items from Column A to Column B. Follow the specified input format (example: A-1,B-2,C-3)." 
  },
  {
    q: "Can I retake a test?",
    a: "Yes. Use Reattempt/Start again from the test card. Some analytics may treat it as a new attempt." 
  },
  {
    q: "Why do I see fewer tests than expected?",
    a: "Filters, pagination, or sub-tabs may hide tests. Reset filters and switch to All Tests." 
  },
  {
    q: "How do I reset filters?",
    a: "Use the reset/clear option near the filters (difficulty/company/topic) or refresh the page." 
  },
  {
    q: "Can I practice by topic or company?",
    a: "Yes—use the filters and tags to focus on a company or topic set." 
  },
  {
    q: "Do tests include explanations?",
    a: "Many questions include explanations. If missing, request it in a message and it can be added in future updates." 
  },
  {
    q: "Why is my attempt not saved?",
    a: "Attempt saving depends on Firestore access and session state. If offline mode triggers, the app may not sync." 
  },
  {
    q: "What should I include in a bug report?",
    a: "Page link, steps to reproduce, expected vs actual behavior, console error (if any), and a screenshot." 
  },
  {
    q: "What is the best way to request a feature?",
    a: "Describe the feature, where it should appear, example UI/flow, and why it helps practice or analysis." 
  },
  {
    q: "How can I improve my score quickly?",
    a: "Attempt topic-wise tests, review incorrect questions, and reattempt after 24–48 hours to reinforce memory." 
  },
  {
    q: "Do you have a GATE-style mode?",
    a: "Yes. Some tests run in a GATE-like format with timer, palette, review marking, and multiple question types." 
  },
  {
    q: "Is there a results analytics page?",
    a: "Yes. Results show correct/wrong/not attempted counts and per-question review (if enabled)." 
  },
  {
    q: "Can I share my score?",
    a: "You can take a screenshot or share the results page link if it’s public. A share button can be added on request." 
  },
  {
    q: "Do you support dark mode?",
    a: "Yes. Theme toggles may be available depending on your settings." 
  },
  {
    q: "Does the site work on mobile?",
    a: "Yes. The UI is responsive, but for long tests desktop is recommended." 
  },
  {
    q: "Why does Firestore show permission-denied?",
    a: "Either Firestore API is disabled for the project, rules deny access, or the user isn’t authorized. Enable API + adjust rules." 
  },
  {
    q: "How do I enable Firestore API?",
    a: "Enable Cloud Firestore API in Google Cloud Console for the Firebase project, then wait a few minutes and retry." 
  },
  {
    q: "Can I export questions or attempts?",
    a: "Not by default. Export can be added (CSV/PDF) if requested." 
  },
  {
    q: "Are there daily challenges?",
    a: "If enabled, daily challenge tests appear in Recommended. If not visible, it may be disabled for the current series." 
  },
  {
    q: "How do announcements work?",
    a: "Announcements are pushed via Firestore and displayed in the Announcements tab/page." 
  },
  {
    q: "How do I contact the developer?",
    a: "Use the form on this page or reach out via GitHub." 
  },
  {
    q: "What’s the difference between Recommended and All Tests?",
    a: "Recommended highlights curated tests; All Tests shows the full list." 
  },
  {
    q: "Why does a test show locked?",
    a: "Some tests require unlock credentials set by admin. Use Unlock if you have credentials." 
  },
  {
    q: "Do I lose my progress if I refresh?",
    a: "If session saving is enabled, you can resume. Otherwise, progress may be lost." 
  },
  {
    q: "How do I review only wrong questions?",
    a: "Open results and filter by Wrong/Incorrect (if available). Review mode can be added if missing." 
  },
  {
    q: "Can I create my own quizzes?",
    a: "Yes. Use Create to add questions/tests. Make sure types and answers are correctly set." 
  },
  {
    q: "How do I ensure my created test is visible?",
    a: "Confirm it’s saved in Firestore under the correct collection and the UI series filters include it." 
  },
  {
    q: "What should a good explanation include?",
    a: "Why the correct option is right, why others are wrong, and a quick concept summary." 
  },
  {
    q: "Can you add more question types?",
    a: "Yes. Share the type format (fields required) and a sample question—support can be implemented." 
  },
  {
    q: "How do I suggest improvements to UI/UX?",
    a: "Send a screenshot and describe what feels slow/confusing. UI polish feedback is highly valuable." 
  },
  {
    q: "Can I request company-wise packs (Google/Amazon/etc.)?",
    a: "Yes. Mention the company and desired difficulty split (easy/medium/hard)." 
  },
  {
    q: "Why do some tests have fewer questions?",
    a: "Question count can vary by test. Standard packs use 25, but some may be custom." 
  },
  {
    q: "What browsers are supported?",
    a: "Latest Chrome/Edge/Firefox are recommended. Safari works for most features but may differ on some animations." 
  },
  {
    q: "Is my data secure?",
    a: "Data is stored in Firestore with access controlled by rules. Avoid sharing passwords/secret info in messages." 
  },
  {
    q: "Do you store passwords?",
    a: "No. Do not submit passwords or secrets via the contact form." 
  },
  {
    q: "Why do I see 'offline mode' in console?",
    a: "Firestore switches to offline mode when it can’t reach the backend. Check connectivity and API/rules." 
  },
  {
    q: "How can I verify Firestore is reachable?",
    a: "Try opening the contact page and pressing Refresh on the emails list. If it fails, Firestore isn’t reachable." 
  },
  {
    q: "Can I use this platform for interview prep?",
    a: "Yes—use company/topic filters, track mistakes, and reattempt. It’s ideal for quick objective revision." 
  },
  {
    q: "Do you have a roadmap?",
    a: "Roadmap items are tracked on GitHub issues/notes. You can request it in a message." 
  },
  {
    q: "How do I contribute?",
    a: "Share improvements, report bugs, or contribute via GitHub if the repo is open for contributions." 
  },
  {
    q: "What are common reasons for wrong answers in MSQ?",
    a: "Selecting extra options or missing one correct option. MSQ requires an exact match of the set." 
  },
  {
    q: "NAT answers: should I round off?",
    a: "Enter the exact value expected. If rounding is allowed, it should be specified in the question." 
  },
  {
    q: "Can I clear my attempt history?",
    a: "If enabled, there can be a reset option. Otherwise, request deletion through support with your email." 
  },
  {
    q: "Why are some question texts repetitive?",
    a: "If questions were batch-generated, duplicates can occur. Report the test name and question IDs to fix." 
  },
  {
    q: "How do I handle network interruptions during a test?",
    a: "Keep the page open; Firestore may sync later. If resume is supported, use it after reconnecting." 
  },
  {
    q: "Can I attempt tests without internet?",
    a: "Some pages can cache, but reliable offline mode requires a dedicated offline runner. Request it if needed." 
  },
  {
    q: "Why does the question palette color differ?",
    a: "Colors indicate status: current, answered, review, not attempted. This helps quick navigation." 
  },
  {
    q: "How do I use the leaderboard effectively?",
    a: "Focus on consistency—attempt daily/weekly tests, analyze mistakes, and reattempt weak topics." 
  },
  {
    q: "Can I hide my profile from leaderboard?",
    a: "Privacy toggle can be added. For now, request removal with your profile identifier." 
  },
  {
    q: "Is there a way to track topic-wise accuracy?",
    a: "If topic tags exist, analytics can compute per-topic accuracy. Request enhancement if not visible." 
  },
  {
    q: "How can I suggest question improvements?",
    a: "Send the question ID and improved wording/options. It helps reduce ambiguity." 
  },
  {
    q: "Do you support multi-language questions?",
    a: "Not currently by default. Multi-language support can be added if required." 
  },
  {
    q: "How do you prevent cheating in contests?",
    a: "Locks, timed sessions, randomized ordering, and analytics can help. Strong proctoring requires server-side enforcement." 
  },
  {
    q: "Can I create private tests?",
    a: "Private tests can be implemented using locks or user-scoped access rules." 
  },
  {
    q: "What should I do if I see a blank page?",
    a: "Open devtools console, check for errors (permissions/import), hard refresh, and retry." 
  },
  {
    q: "Why do imports fail with 'export' or 'module' errors?",
    a: "Firebase v9+ requires ES module scripts (`type=module`). Ensure scripts and imports match the modular SDK." 
  },
  {
    q: "Can I request a top-100 list for a topic?",
    a: "Yes—share the topic and target difficulty; a curated pack can be created." 
  },
  {
    q: "How do I prepare for GATE using this platform?",
    a: "Use timed tests, practice MSQ/NAT, analyze mistakes, and reattempt weak sections weekly." 
  },
  {
    q: "How do I prepare for coding interviews using this platform?",
    a: "Mix concept tests with per-problem packs, review explanations, and target your weak DS/Algo topics." 
  },
  {
    q: "Can I request explanation upgrades for an entire pack?",
    a: "Yes. Mention the pack/test name and what kind of explanations you want (step-by-step, edge cases, etc.)." 
  },
  {
    q: "What if my email is entered wrong?",
    a: "Send a new message with the correct email and mention the previous incorrect one." 
  },
  {
    q: "Why is the email list showing duplicates?",
    a: "The UI deduplicates recent emails; duplicates can appear if emails vary by casing/spaces. It’s normalized to lowercase." 
  },
  {
    q: "Can I disable showing the email list publicly?",
    a: "Yes. It can be removed or restricted via Firestore rules/admin-only reads." 
  },
  {
    q: "Do you have notifications for new tests?",
    a: "Announcements/notifications can be enabled. Check the Announcements tab." 
  },
  {
    q: "How do I use Refer & Earn?",
    a: "Open Refer & Earn page, copy your referral code/link, and share it. Rewards depend on platform configuration." 
  },
  {
    q: "Can I use the platform on slow internet?",
    a: "Yes, but first load may be slower. Once cached, navigation is smoother. Avoid multiple tabs during tests." 
  },
  {
    q: "Is there a way to suggest new UI themes?",
    a: "Yes—share examples/colors. Theme presets can be added." 
  },
  {
    q: "How do I verify a test is correctly stored in Firestore?",
    a: "Check the collection/document, ensure fields like `problem_name`, `questions`, and `type` exist, and confirm rules allow reading." 
  },
  {
    q: "Can I request a 'Review mistakes' mode?",
    a: "Yes. This mode can automatically jump through wrong questions only." 
  },
  {
    q: "Do you support per-question time tracking?",
    a: "It can be recorded by saving timestamps/time spent per question in the session document." 
  },
  {
    q: "What’s the best strategy for MSQ?",
    a: "Eliminate obviously wrong options first, then validate remaining choices with concept checks." 
  },
  {
    q: "What’s the best strategy for NAT?",
    a: "Write the formula/logic, test with a small sample, then compute carefully to avoid arithmetic mistakes." 
  },
  {
    q: "How do I report performance issues/lag?",
    a: "Share device/browser, page, and approximate number of tests loaded. Screenshots + console logs help." 
  },
  {
    q: "Can I ask for a personal study plan?",
    a: "Yes—send your target exam/interview and timeframe; a plan can be suggested." 
  },
  {
    q: "Do you have top interview questions?",
    a: "Yes—company/topic filters can approximate interview-style packs. Curated lists can be added." 
  },
  {
    q: "How do I check if a question was updated?",
    a: "If versioning is enabled, updates appear in change logs. Otherwise, request version stamps." 
  },
  {
    q: "Can I request 100 FAQs on this page?",
    a: "Yes—this section is curated and can be updated. If something is missing, send a request." 
  }
];

function renderFaqAccordion() {
  const host = el("faqList");
  if (!host) return;

  const hooks = [
    "Quick fix",
    "Pro tip",
    "Heads-up",
    "Fast answer",
    "Most asked",
    "Do this"
  ];

  const tags = [
    "Tests",
    "Scoring",
    "Account",
    "Data",
    "UI",
    "Troubleshoot",
    "Creation",
    "Leaderboard"
  ];

  const pickTag = (qText, idx) => {
    const t = String(qText || "").toLowerCase();
    if (t.includes("score") || t.includes("negative")) return "Scoring";
    if (t.includes("rank") || t.includes("leader")) return "Leaderboard";
    if (t.includes("lock") || t.includes("unlock")) return "Tests";
    if (t.includes("firestore") || t.includes("permission") || t.includes("api")) return "Troubleshoot";
    if (t.includes("create") || t.includes("explanation") || t.includes("question type")) return "Creation";
    if (t.includes("email") || t.includes("message") || t.includes("contact")) return "Account";
    return tags[idx % tags.length];
  };

  const qOpeners = [
    "Stuck? ",
    "Wondering: ",
    "Quick question: ",
    "Need clarity? ",
    "Confused about this? ",
    "Let’s fix this: "
  ];

  const aOpenersByTag = {
    Tests: "Here’s the fastest way to get moving:",
    Scoring: "Here’s how your marks behave:",
    Account: "Here’s the safe & simple answer:",
    Data: "Here’s what’s happening under the hood:",
    UI: "Here’s what to click / where to look:",
    Troubleshoot: "Fix checklist (in order):",
    Creation: "Creator shortcut:",
    Leaderboard: "Rank/CP clarity:" 
  };

  const punchQuestion = (qText, idx) => {
    const q = String(qText || "").trim();
    if (!q) return q;
    const startsLikeQuestion = /^(how|why|what|can|do|is|are|will|where|when)\b/i.test(q);
    const opener = qOpeners[idx % qOpeners.length];
    return startsLikeQuestion ? `${opener}${q}` : q;
  };

  const punchAnswer = (aText, tag) => {
    const a = String(aText || "").trim();
    if (!a) return a;
    const opener = aOpenersByTag[tag] || "Quick answer:";
    if (/^(here|go|use|yes|no|usually|by default|open|try)\b/i.test(a)) {
      return `${opener} ${a}`;
    }
    return `${opener} ${a}`;
  };

  host.innerHTML = FAQ_TOP_100.map((item, idx) => {
    const rawQ = String(item.q || "");
    const rawA = String(item.a || "");
    const hook = hooks[idx % hooks.length];
    const tag = pickTag(rawQ, idx);
    const safeQ = punchQuestion(rawQ, idx);
    const safeA = punchAnswer(rawA, tag);
    return `
      <div class="faqAcc" data-idx="${idx}">
        <button class="faqBtn" type="button" aria-expanded="false">
          <div class="q">${idx + 1}. ${safeQ}</div>
          <div class="chev" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </button>
        <div class="faqPanel">
          <div class="faqPanelInner">
            <div class="faqMeta">
              <span class="faqTag">${tag}</span>
              <span class="faqHook">${hook}:</span>
            </div>
            <div class="faqAns">${safeA}</div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  host.addEventListener("click", (e) => {
    const btn = e.target.closest(".faqBtn");
    if (!btn) return;
    const acc = btn.closest(".faqAcc");
    if (!acc) return;

    const isOpen = acc.classList.contains("open");
    // Close others for a clean experience
    host.querySelectorAll(".faqAcc.open").forEach((n) => {
      if (n === acc) return;
      n.classList.remove("open");
      const b = n.querySelector(".faqBtn");
      if (b) b.setAttribute("aria-expanded", "false");
    });

    acc.classList.toggle("open", !isOpen);
    btn.setAttribute("aria-expanded", (!isOpen).toString());
  });
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function formatWhen(ts) {
  try {
    const d = ts?.toDate ? ts.toDate() : ts ? new Date(ts) : null;
    if (!d || Number.isNaN(d.getTime())) return "";
    return d.toLocaleString();
  } catch {
    return "";
  }
}

async function loadRecentEmails() {
  const host = el("emailsList");
  const meta = el("emailsMeta");
  if (!host || !meta) return;

  meta.textContent = "Loading…";
  host.innerHTML = "";

  try {
    const q = api.query(
      api.collection(db, "contact_messages"),
      api.orderBy("createdAt", "desc"),
      api.limit(30)
    );
    const snap = await api.getDocs(q);

    meta.textContent = `${snap.size} recent`;

    if (snap.empty) {
      host.innerHTML = `<div class="emailEmpty">No messages yet. Be the first to say hi.</div>`;
      return;
    }

    const rows = [];
    snap.forEach((docu) => {
      const d = docu.data() || {};
      const email = normalizeEmail(d.email);
      if (!email) return;
      rows.push({ email, createdAt: d.createdAt });
    });

    const seen = new Set();
    const uniq = rows.filter((r) => {
      if (seen.has(r.email)) return false;
      seen.add(r.email);
      return true;
    });

    host.innerHTML = uniq
      .slice(0, 30)
      .map(
        (r) => `
          <div class="emailItem" role="listitem">
            <div class="emailVal" title="${r.email}">${r.email}</div>
            <div class="emailTime">${formatWhen(r.createdAt)}</div>
          </div>
        `
      )
      .join("");
  } catch (err) {
    console.error("Failed to load emails:", err);
    meta.textContent = "Failed to load";
    host.innerHTML = `<div class="emailEmpty">Could not load emails right now.</div>`;
  }
}

async function loadCrudEmails() {
  const host = el("crudList");
  if (!host) return;

  host.innerHTML = `<div class="emailEmpty">Loading…</div>`;

  try {
    const q = api.query(
      api.collection(db, "contact_messages"),
      api.orderBy("createdAt", "desc"),
      api.limit(50)
    );
    const snap = await api.getDocs(q);

    if (snap.empty) {
      host.innerHTML = `<div class="emailEmpty">No messages to manage.</div>`;
      return;
    }

    host.innerHTML = snap.docs.map((docu) => {
      const d = docu.data() || {};
      const id = docu.id;
      const email = normalizeEmail(d.email);
      const name = String(d.name || "").trim();
      const subject = String(d.subject || "").trim();
      const message = String(d.message || "").trim();
      const createdAt = d.createdAt;

      return `
        <div class="crudItem" data-id="${id}">
          <div class="crudHeader">
            <div class="crudEmail">${email}</div>
            <div class="crudTime">${formatWhen(createdAt)}</div>
          </div>
          <div class="crudBody">${subject ? `<strong>Subject:</strong> ${subject}<br/>` : ""}${message}</div>
          <div class="crudActions">
            <button class="crudBtn edit" data-id="${id}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Edit
            </button>
            <button class="crudBtn delete" data-id="${id}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Delete
            </button>
          </div>
        </div>
      `;
    }).join("");

    // Attach event listeners
    host.addEventListener("click", async (e) => {
      const btn = e.target.closest(".crudBtn");
      if (!btn) return;
      const id = btn.dataset.id;
      if (!id) return;

      if (btn.classList.contains("delete")) {
        if (!confirm("Delete this message permanently?")) return;
        try {
          await api.deleteDoc(api.doc(db, "contact_messages", id));
          toast("Message deleted.", "success", 2000);
          loadCrudEmails();
          loadRecentEmails();
        } catch (err) {
          console.error("Failed to delete:", err);
          toast("Failed to delete.", "error", 2000);
        }
      }

      if (btn.classList.contains("edit")) {
        const item = btn.closest(".crudItem");
        const emailEl = item.querySelector(".crudEmail");
        const bodyEl = item.querySelector(".crudBody");
        const email = emailEl.textContent;
        const bodyText = bodyEl.innerHTML;
        const subjectMatch = bodyText.match(/<strong>Subject:<\/strong> (.+?)<br\/>/);
        const subject = subjectMatch ? subjectMatch[1] : "";
        const message = bodyText.replace(/<strong>Subject:<\/strong> .+?<br\/>/, "").replace(/<br\/>/g, "\n");

        item.innerHTML = `
          <div class="crudEditForm">
            <input class="crudEditInput" value="${email}" placeholder="Email" readonly />
            <input class="crudEditInput" value="${subject}" placeholder="Subject" />
            <textarea class="crudEditTextarea" placeholder="Message">${message}</textarea>
            <div class="crudEditActions">
              <button class="crudEditBtn save" data-id="${id}">Save</button>
              <button class="crudEditBtn cancel" data-id="${id}">Cancel</button>
            </div>
          </div>
        `;
      }
    });

    // Save/Cancel handling
    host.addEventListener("click", async (e) => {
      const btn = e.target.closest(".crudEditBtn");
      if (!btn) return;
      const id = btn.dataset.id;
      if (!id) return;
      const form = btn.closest(".crudEditForm");
      if (!form) return;

      if (btn.classList.contains("save")) {
        const subject = form.querySelector("input[placeholder='Subject']").value.trim();
        const message = form.querySelector("textarea").value.trim();
        try {
          await api.updateDoc(api.doc(db, "contact_messages", id), { subject, message });
          toast("Message updated.", "success", 2000);
          loadCrudEmails();
        } catch (err) {
          console.error("Failed to update:", err);
          toast("Failed to update.", "error", 2000);
        }
      }

      if (btn.classList.contains("cancel")) {
        loadCrudEmails();
      }
    });

  } catch (err) {
    console.error("Failed to load CRUD emails:", err);
    host.innerHTML = `<div class="emailEmpty">Could not load messages.</div>`;
  }
}

async function init() {
  setPillStatus("Connected", true);
  const form = el("contactForm");
  if (!form) return;

  renderFaqAccordion();

  el("refreshEmails")?.addEventListener("click", loadRecentEmails);
  loadRecentEmails();
  loadCrudEmails();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());

    const email = normalizeEmail(payload.email);
    const name = String(payload.name || "").trim();
    const subject = String(payload.subject || "").trim();
    const message = String(payload.message || "").trim();

    if (!email) {
      toast("Please enter a valid email.", "error", 2800);
      return;
    }

    if (!message) {
      toast("Please write a message.", "error", 2800);
      return;
    }

    const btn = form.querySelector("button[type='submit']");
    const prevText = btn?.textContent;
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Sending…";
    }

    try {
      await api.addDoc(api.collection(db, "contact_messages"), {
        name,
        email,
        subject,
        message,
        createdAt: api.serverTimestamp(),
        page: location.pathname
      });

      toast("Message sent! I’ll get back to you soon.", "success", 3200);
      form.reset();
      loadRecentEmails();
    } catch (err) {
      console.error("Failed to send contact message:", err);
      toast("Failed to send. Please try again.", "error", 3200);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = prevText || "Send Message";
      }
    }
  });
}

init();
