# Coding Quiz Contest Platform

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:7c3aed,100:22d3ee&height=210&section=header&text=Coding%20Quiz%20Contest%20Platform&fontSize=34&fontColor=ffffff&animation=fadeIn&fontAlignY=35" alt="Coding Quiz Contest Platform" />

<a href="https://anjha-101-timen.github.io/Kopilot_The_Coding_Quiz_Contest/">
  <img src="https://readme-typing-svg.demolab.com?font=Inter&weight=700&size=18&duration=2400&pause=600&color=22D3EE&center=true&vCenter=true&width=740&lines=Team+Kopilot+%E2%80%A2+Objective+Quiz+Engine;Create+%E2%86%92+Read%2FPlay+%E2%86%92+Update+%E2%86%92+Delete;Build+skills.+Earn+CP.+Climb+the+Leaderboard." alt="Typing SVG" />
</a>

<p><b>Build skills. Earn CP. Climb the leaderboard.</b></p>

<p>
  <a href="https://anjha-101-timen.github.io/Kopilot_The_Coding_Quiz_Contest/"><b>Live Demo (GitHub Pages)</b></a>
  <br/>
  <sub>Entry point: <code>index.html</code></sub>
</p>

<p>
  <img src="https://img.shields.io/badge/HTML-5-orange" alt="HTML" />
  <img src="https://img.shields.io/badge/CSS-3-blue" alt="CSS" />
  <img src="https://img.shields.io/badge/JavaScript-ES%20Modules-yellow" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Firebase-Firestore-ffca28" alt="Firebase" />
  <img src="https://img.shields.io/badge/Deploy-GitHub%20Pages-black" alt="GitHub Pages" />
</p>

</div>

---

## What is this?

**Coding Quiz Contest Platform** is a modern, Firebase-powered web app for **objective coding MCQs**, **topic-wise test series**, and a **contest-like practice experience**.

It’s designed to feel fast, clean, and motivating:

- **Practice** questions like a quiz game
- **Track** CP (Code Points) as you improve
- **Compete** on leaderboards
- **Create & manage** question banks with full CRUD workflow

---

## Table of Contents

- [Live Demo](#live-demo)
- [Animated Documentation](#animated-documentation)
- [Key Features](#key-features)
- [Quick Navigation (Pages)](#quick-navigation-pages)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Detailed Folder Documentation](#detailed-folder-documentation)
- [Run Locally](#run-locally)
- [Firebase Setup Notes](#firebase-setup-notes)
- [Deployment](#deployment)
- [Screenshots](#screenshots)
- [University / Course / Team Details](#university--course--team-details)

---

## Live Demo

- **GitHub Pages**: https://anjha-101-timen.github.io/Kopilot_The_Coding_Quiz_Contest/

> Entry point: `index.html`

---

## Animated Documentation

<div align="center">

<a href="./docs.html">
  <img src="https://capsule-render.vercel.app/api?type=soft&color=0:7c3aed,100:22d3ee&height=120&section=header&text=Open%20Animated%20Docs&fontSize=28&fontColor=ffffff&animation=twinkling" alt="Open Animated Docs" />
</a>

<b>Want gradients, boxes, effects, animations, and interactive browsing?</b>

<br/>

<a href="./docs.html"><b>Open the full animated documentation page →</b></a>

</div>

---

## Key Features

### Learning & gameplay

- **Objective quiz engine**
  - Smooth attempt flow
  - Consistent UI across pages
- **Question browsing**
  - Filters + search
  - Focus links (jump to a question)
- **Play mode + results**
  - Attempt quizzes
  - View performance and outcomes

### Full CRUD workflow

- **Create** questions and publish to Firestore
- **Read** / browse and play
- **Update** questions safely
- **Delete** with guardrails

### Competitive layer

- **Profiles + CP (Code Points)**
  - Progress tracking
  - Local-first experience with Firestore sync
- **Leaderboard**
  - Competitive ranking view

### Personalization

- **Settings panel**
  - Theme presets
  - Accent colors
  - Font selection
  - Language preference
  - Zoom controls

<details>
<summary><b>Why this feels “next level”</b></summary>

- **Local-first UX**: fast UI even when network sync is still in progress.
- **Reusable shared UI**: consistent navigation + shared components.
- **GitHub Pages safe paths**: internal routing works under repo subpath.

</details>

---

## Quick Navigation (Pages)

| Area | Path |
| --- | --- |
| Landing | `index.html` |
| Create Questions | `create/create.html` |
| Browse / Read | `read/read.html` |
| Update Questions | `update/update.html` |
| Delete Questions | `delete/delete.html` |
| Quiz Runner | `play/play.html` |
| Results | `results/results.html` |
| Test Series | `testseries/testseries.html` |
| Leaderboard | `leaderboard/leaderboard.html` |
| Profile | `profile/profile.html` |
| Refer & Earn | `refer/refer.html` |
| About / Contact | `about/about.html`, `contact/contact.html` |

---

## Tech Stack

- **Frontend**
  - HTML, CSS
  - JavaScript (ES Modules)
- **Backend / Data**
  - Firebase Firestore
- **Hosting**
  - GitHub Pages (for demo)
  - Firebase Hosting (optional)

---

## Project Structure

- `index.html` — Landing / entry point
- `shared/` — shared UI, navigation, theme, Firebase init, helpers
- `create/` `read/` `update/` `delete/` — CRUD modules
- `play/` `results/` — quiz runner + results
- `testseries/` — series listing and packs
- `leaderboard/` `profile/` `bookmarks/` `hub/` — platform features

---

## Detailed Folder Documentation

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:22d3ee,100:7c3aed&height=4&section=header" alt="divider" />

<b>Every folder = a feature. Every page = a mission.</b>

<sub>Tip: Each module below has an <code>.html</code> page (UI), a <code>.css</code> file (design), and a <code>.js</code> file (logic).</sub>

</div>

### Core entry

| Item | What it does | Files |
| --- | --- | --- |
| **Landing / Home** | The GitHub Pages entry point. Brand, hero, quick navigation, and "Start Exploring" CTA. | `index.html` + `shared/landing.css` + `shared/landing.js` |

---

<details>
<summary><b><code>about/</code> — About the platform (story + mission)</b></summary>

- **Purpose**
  - This is the “who we are / why we built this” page.
  - A high-energy hero banner + feature cards.
- **UI entry**
  - `about/about.html`
- **Styling**
  - `about/about.css`
- **Logic**
  - `about/about.js`

<sub>Vibe: Motivation + credibility — "We build coders who win."</sub>

</details>

<details>
<summary><b><code>bookmarks/</code> — Save & revisit important exams/questions</b></summary>

- **Purpose**
  - Bookmark exams/questions and return anytime.
  - Includes empty state + refresh.
- **UI entry**
  - `bookmarks/bookmarks.html`
- **Styling**
  - `bookmarks/bookmarks.css`
- **Logic**
  - `bookmarks/bookmarks.js`
- **Uses shared modules**
  - `shared/bookmarks.js` (bookmark storage + helpers)

<sub>Vibe: "Save today, win tomorrow."</sub>

</details>

<details>
<summary><b><code>branches/</code> — Branch explorer (curated computer fields)</b></summary>

- **Purpose**
  - A visual catalogue of top computer science fields (AI/ML/DL/DS/…)
  - Cards with "Explore" and "Start" actions.
- **UI entry**
  - `branches/branches.html`
- **Styling**
  - `branches/branches.css`
- **Logic**
  - `branches/branches.js`

<sub>Vibe: "Pick a path. Master it. Become unstoppable."</sub>

</details>

<details>
<summary><b><code>contact/</code> — Contact page (feedback + collaboration)</b></summary>

- **Purpose**
  - A polished contact experience with clear info blocks (email, response time, etc.).
- **UI entry**
  - `contact/contact.html`
- **Styling**
  - `contact/contact.css`
- **Logic**
  - `contact/contact.js`

<sub>Vibe: "Small feedback. Big impact."</sub>

</details>

---

### CRUD modules (Create → Read → Update → Delete)

<details>
<summary><b><code>create/</code> — Exam creation + question framing (Publish)</b></summary>

- **Purpose**
  - Create a new exam configuration.
  - Frame questions under that exam.
  - Publish to Firestore.
- **UI entry**
  - `create/create.html`
- **Styling**
  - `create/create.css`
- **Logic**
  - `create/create.js`

<sub>Mindset: "If you can create questions, you can create champions."</sub>

</details>

<details>
<summary><b><code>read/</code> — Browse exams + open question bank (Read-only + Play)</b></summary>

- **Purpose**
  - Display exam cards.
  - Open an exam to see framed questions.
  - Start the contest (Play), view Results, or Manage (Update).
- **UI entry**
  - `read/read.html`
- **Styling**
  - `read/read.css`
- **Logic**
  - `read/read.js`

<sub>Vibe: "Choose an exam. Enter the arena."</sub>

</details>

<details>
<summary><b><code>update/</code> — Manage exams + edit questions (Save changes)</b></summary>

- **Purpose**
  - Select an exam.
  - Load its questions.
  - Edit safely and save updates.
- **UI entry**
  - `update/update.html`
- **Styling**
  - `update/update.css`
- **Logic**
  - `update/update.js`

<sub>Vibe: "Upgrade your question bank like you upgrade your skills."</sub>

</details>

<details>
<summary><b><code>delete/</code> — Remove framed questions (with guardrails)</b></summary>

- **Purpose**
  - Choose an exam.
  - Permanently delete questions you no longer want.
- **UI entry**
  - `delete/delete.html`
- **Styling**
  - `delete/delete.css`
- **Logic**
  - `delete/delete.js`

<sub>Vibe: "Cut the noise. Keep the best."</sub>

</details>

---

### Gameplay & performance

<details>
<summary><b><code>play/</code> — Contest mode (timer + palette + attempt flow)</b></summary>

- **Purpose**
  - The quiz runner.
  - Includes per-question timer, question palette, and navigation.
- **UI entry**
  - `play/play.html`
- **Styling**
  - `play/play.css`
- **Logic**
  - `play/play.js`

<sub>Vibe: "Every question is a round. Every round is a step up."</sub>

</details>

<details>
<summary><b><code>results/</code> — Score analysis + attempt history</b></summary>

- **Purpose**
  - After a round, show analysis and breakdown.
  - Includes chips (CP, question type) and multiple analysis panels.
- **UI entry**
  - `results/results.html`
- **Styling**
  - `results/results.css`
- **Logic**
  - `results/results.js`

<sub>Vibe: "Don’t just practice — measure, learn, dominate."</sub>

</details>

---

### Competitive + identity

<details>
<summary><b><code>leaderboard/</code> — CP ranking (competition layer)</b></summary>

- **Purpose**
  - Show CP rank.
  - Motivational hero + ranked list.
- **UI entry**
  - `leaderboard/leaderboard.html`
- **Styling**
  - `leaderboard/leaderboard.css`
- **Logic**
  - `leaderboard/leaderboard.js`

<sub>Vibe: "Your CP is your proof."</sub>

</details>

<details>
<summary><b><code>profile/</code> — Personal profile + stats + save</b></summary>

- **Purpose**
  - Set display name and bio.
  - View CP/level/rank/device stats.
- **UI entry**
  - `profile/profile.html`
- **Styling**
  - `profile/profile.css`
- **Logic**
  - `profile/profile.js`

<sub>Vibe: "Build your identity. Build your legacy."</sub>

</details>

<details>
<summary><b><code>refer/</code> — Refer & Earn (share link + referral stats)</b></summary>

- **Purpose**
  - Copy/share referral link.
  - Track referral stats and leaderboard.
  - Includes FAQ-style content.
- **UI entry**
  - `refer/refer.html`
- **Styling**
  - `refer/refer.css`
- **Logic**
  - `refer/refer.js`

<sub>Vibe: "Turn friends into code warriors."</sub>

</details>

---

### Contest ecosystem

<details>
<summary><b><code>hub/</code> — Contest Hub (tabs: Description / Tests / Announcements)</b></summary>

- **Purpose**
  - Central place for contest-style navigation.
  - Tabs for overview, tests, announcements.
  - Stats: available exams, total questions, your CP.
- **UI entry**
  - `hub/hub.html`
- **Styling**
  - `hub/hub.css`
- **Logic**
  - `hub/hub.js`

<sub>Vibe: "Everything you need. One hub."</sub>

</details>

<details>
<summary><b><code>contest/</code> — Admin-style Contest Hub (create + filter)</b></summary>

- **Purpose**
  - Browse past/current/future contests.
  - Filters (status, date range, search) + create contest action.
- **UI entry**
  - `contest/contest.html`
- **Styling**
  - `contest/contest.css`
- **Logic**
  - `contest/contest.js`

<sub>Vibe: "Run contests like a pro."</sub>

</details>

<details>
<summary><b><code>contests/</code> — Contests (table + powerful filters)</b></summary>

- **Purpose**
  - View contests in a structured table layout.
  - Filter by status (All/Live/Upcoming/Past), code, name, and time.
- **UI entry**
  - `contests/contests.html`
- **Styling**
  - `contests/contests.css`
- **Logic**
  - `contests/contests.js`

<sub>Vibe: "Find the next contest. Claim the next win."</sub>

</details>

---

### Productivity modules

<details>
<summary><b><code>notifications/</code> — Notifications (updates + contest alerts)</b></summary>

- **Purpose**
  - Show platform updates, contest alerts, announcements.
  - Filter by examId and mark all as read.
- **UI entry**
  - `notifications/notifications.html`
- **Styling**
  - `notifications/notifications.css`
- **Logic**
  - `notifications/notifications.js`

<sub>Vibe: "Never miss an update."</sub>

</details>

<details>
<summary><b><code>languages/</code> — UI language selection (instant apply)</b></summary>

- **Purpose**
  - Search and select UI language.
  - Quick chips (English, Hindi, Bengali, Tamil, Telugu, Urdu…).
- **UI entry**
  - `languages/languages.html`
- **Styling**
  - `languages/languages.css`
- **Logic**
  - `languages/languages.js`
- **Related shared modules**
  - `shared/i18n.js`, `shared/langs.js`

<sub>Vibe: "Your language. Your comfort. Your speed."</sub>

</details>

---

### Test Series system (Coders Tester)

<details>
<summary><b><code>testseries/</code> — Test series catalog + series detail (tabs + filters)</b></summary>

- **Purpose**
  - Premium-looking test series catalogue.
  - Series detail page with tabs (Test / Study Material / Announcements).
  - Filters for attempted/non-attempted/resume, per-problem view, pagination.
- **UI entry**
  - `testseries/testseries.html` (catalog)
  - `testseries/series.html` (series detail)
- **Styling**
  - `testseries/testseries.css`
  - `testseries/series.css`
- **Logic**
  - `testseries/testseries.js`
  - `testseries/series.js`

<sub>Vibe: "Practice like it’s a finals match."</sub>

</details>

---

### LeetCode-style and standalone test utilities

<details>
<summary><b><code>leet-test/</code> — LeetCode concept test + analysis + GATE format test</b></summary>

- **Purpose**
  - Interactive objective tests inspired by LeetCode concept practice.
  - Dedicated analysis page.
  - GATE-style test format with results.
- **Key pages**
  - `leet-test/leet-test.html` (test runner)
  - `leet-test/analyze.html` (analysis)
  - `leet-test/gate-test-format.html` (GATE format)
  - `leet-test/gate-results.html` (GATE results)
- **Helper**
  - `leet-test/test-integration-helper.js`
- **Docs**
  - `leet-test/GATE-TEST-SYSTEM-README.md`

<sub>Vibe: "Concepts → Confidence → CP."</sub>

</details>

<details>
<summary><b>Standalone HTML flows (root)</b></summary>

- `online-test-system.html` — Online test system entry.
- `offline-test-system.html` — Offline variant / fallback.
- `test-attempt.html` — Test attempt view.
- `emergency-test-launcher.html` — Launcher for emergency flows.

</details>

---

### Shared system (the “engine room”)

<details>
<summary><b><code>shared/</code> — Shared UI, theme, Firebase, i18n, and reusable logic</b></summary>

| File | Role |
| --- | --- |
| `shared/firebase.js` | Firebase initialization (Firestore connection). |
| `shared/nav.js` + `shared/nav.css` | Global navigation + settings modal (themes, fonts, accents, language, zoom). |
| `shared/base.css` | Global design system (buttons, cards, layout, tokens). |
| `shared/page.css` | Shared page scaffolding styles (headers, shells, panels). |
| `shared/level.js` + `shared/level.css` | CP/level logic and UI layer. |
| `shared/ui.js` | Toasts and small UI helpers. |
| `shared/attempts.js` | Attempt storage + tracking. |
| `shared/exams.js` | Exam card rendering helpers. |
| `shared/questions.js` | Question rendering + actions (focus/edit/delete links). |
| `shared/i18n.js`, `shared/langs.js` | Language packs + selection utilities. |
| `shared/landing.css`, `shared/landing.js` | Landing page visuals + live stats hookup. |
| `shared/zoom-widget.html` | Shared zoom widget template. |

<sub>Vibe: "One shared system, many powerful pages."</sub>

</details>

---

### Backend / configuration

<details>
<summary><b><code>functions/</code> — Firebase Cloud Functions (minimal)</b></summary>

- `functions/index.js` — Firebase Functions entry (AI generation removed).
- `functions/package.json` + lock — dependencies for functions.

</details>

<details>
<summary><b>Firebase config files (root)</b></summary>

- `firebase.json` — hosting / firebase config.
- `firestore.rules` — Firestore security rules.
- `firestore.indexes.json` — Firestore indexes.
- `firebase_database_structure.md` — database structure documentation.

</details>

---

### Data & integration assets

<details>
<summary><b>Large datasets and integrations</b></summary>

- `leet.json` — large LeetCode dataset used for packs/lists.
- `leet_test_integration.js` — integration logic for LeetCode-style flows.
- `demo-test-questions.json` — sample/demo question set.

</details>

---

### Notes about “animations” in GitHub README

> GitHub doesn’t apply custom CSS animations inside README, but animated SVG banners (like the header above) work perfectly because they render as images.

---

## Run Locally

Because this is a static website (plus Firebase), run it with any static server.

- **Recommended**: use a local static server (so ES modules load correctly).
- Entry point: open `index.html` in the browser via the server URL.

---

## Firebase Setup Notes

Firebase is initialized from:

- `shared/firebase.js`

If you fork/clone for your own deployment:

- Replace the Firebase config in `shared/firebase.js` with your own Firebase project credentials.

---

## Deployment

### GitHub Pages

This repository is configured to work on GitHub Pages under the repo path:

- `/Kopilot_The_Coding_Quiz_Contest/`

Internal links were updated to be **GitHub Pages-safe** (relative paths).

### Firebase Hosting (optional)

Firebase-related config files (if you use Firebase Hosting):

- `firebase.json`
- `firestore.rules`
- `firestore.indexes.json`

---

## Screenshots

Add screenshots here:

- Landing page
- Test series page
- Quiz runner
- Results
- Leaderboard
- Profile
- Refer & Earn

---

## University / Course / Team Details

**K.R. Mangalam University**  
**Course**: B.Tech CSE Core  
**Semester**: VI  
**Section**: C  

**Team Name**: Kopilot  
**Team Code**: 26E3100  

### Team Members

1. **Ajay Nath Jha** : 2301010170
2. **Mukul** : 2301010167
3. **Varun Yadav** : 2301010173
4. **Priyanshu** : 2301010148
5. **Manish Ambawat** : 2301010147
