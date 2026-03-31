# Coding Quiz Contest Platform

<div align="center">

### Team Kopilot • Objective Quiz Engine • Test Series • Leaderboards

<b>Build skills. Earn CP. Climb the leaderboard.</b>

[Live Demo (GitHub Pages)](https://anjha-101-timen.github.io/Kopilot_The_Coding_Quiz_Contest/)

<br/>

![HTML](https://img.shields.io/badge/HTML-5-orange)
![CSS](https://img.shields.io/badge/CSS-3-blue)
![JavaScript](https://img.shields.io/badge/JavaScript-ES%20Modules-yellow)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-ffca28)
![Hosting](https://img.shields.io/badge/Deploy-GitHub%20Pages-black)

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
- [Key Features](#key-features)
- [Quick Navigation (Pages)](#quick-navigation-pages)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
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
