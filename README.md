# Coding Quiz Contest Platform (Team Kopilot)

A modern, Firebase-powered web platform for **objective coding quizzes**, **topic-wise test series**, **CRUD question management**, leaderboards, profiles, referrals, and contest workflows.

Built as part of an academic project by **Team Kopilot**.

---

## Highlights

- **Objective quiz engine**
  - Supports objective question workflows with smooth UI and interactive experience.
- **Test series + contest hub**
  - Explore test series, participate in contest flows, and track progress.
- **Full CRUD for questions**
  - Create, read/play, update, and delete question entries.
- **Profiles + CP (Code Points) leveling**
  - Local + Firestore sync of profile and progress.
- **Leaderboard + analytics-style views**
  - Competitive ranking experience for CP.
- **Refer & Earn (modern UI)**
  - A redesigned, animated referral page with curated FAQ and modern styling.
- **Personalization (Settings panel)**
  - Theme presets, theme accents, font selection, language preference, and zoom controls.

---

## Tech Stack

- **Frontend**
  - HTML, CSS, JavaScript (ES Modules)
- **Backend / Cloud**
  - Firebase (Firestore)
  - Firebase Hosting
  - Firebase Cloud Functions (`/functions`)

---

## Project Structure (High-level)

- **Landing**
  - `index.html`
- **Shared UI / Core Modules**
  - `shared/` (base styles, UI helpers, nav, themes, Firebase init)
- **Core Pages**
  - `create/` – create questions
  - `read/` – browse / read / play
  - `update/` – update questions
  - `delete/` – delete questions
- **Test Series & Attempts**
  - `testseries/`
  - `test-attempt.html`
- **Community / Platform**
  - `leaderboard/`
  - `profile/`
  - `notifications/`
  - `bookmarks/`
  - `hub/`
  - `about/`
  - `contact/`
  - `refer/`

---

## Getting Started

### 1) Prerequisites

- A modern browser (Chrome / Edge / Firefox)
- Firebase project (Firestore enabled)

### 2) Firebase Configuration

This project initializes Firebase from:

- `shared/firebase.js`

If you clone this repo for your own deployment, replace the Firebase config in `shared/firebase.js` with your own project credentials.

### 3) Run Locally

Because this is a static web project (plus optional Cloud Functions), you can run it using:

- Firebase Hosting emulator, or
- Any static server

Suggested entry point:

- Open `index.html`

---

## Deployment (Firebase Hosting)

This repo contains Firebase configuration files:

- `firebase.json`
- `firestore.rules`
- `firestore.indexes.json`

You can deploy using standard Firebase CLI workflows.

---

## Screenshots / Demo

Add your screenshots here (recommended):

- Landing page
- Test series page
- Quiz attempt view
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

---

## Notes

- Theme and preferences are stored in `localStorage` and applied site-wide.
- Firestore collections and rules are defined by the Firebase configuration and the app modules under `shared/`.

---

## License

Add a license section if you plan to open-source the project.
