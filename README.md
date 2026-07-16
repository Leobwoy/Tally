# ✦ Tally — Field Service Hour Tracker

A mobile-first PWA for tracking field service hours and bible studies.
Offline-first, Firebase-backed, installable from the browser.

---

## Getting Started

### 1. Install dependencies
```bash
cd tally
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
```
Fill in your Firebase project credentials (see [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for details).

### 3. Run in development
```bash
npm run dev
```
Open http://localhost:5173 in your browser.

### 4. Build for production
```bash
npm run build
npm run preview
```

---

## Project Structure

```
src/
├── App.jsx                       # Root, routing, auth state, theme provider
├── index.css                     # Global styles + CSS variables
├── main.jsx                      # Entry point, PWA registration
├── sw.js                         # Service worker (reminders + precaching)
├── themes/
│   └── themes.js                 # Color themes + CSS variable injection
├── db/
│   └── db.js                     # Device-only IndexedDB (Dexie) for preferences
├── firebase/
│   ├── config.js                 # Firebase App, Auth, Firestore init
│   ├── auth.js                   # Firebase Auth helpers (login/signup/logout)
│   └── firestore.js              # All Firestore CRUD + migration logic
├── hooks/
│   └── useFirestore.js           # React hooks wrapping onSnapshot subscriptions
├── screens/
│   ├── Login.jsx/.css            # Email/password login
│   ├── Signup.jsx/.css           # Create account
│   ├── Onboarding.jsx/.css       # Post-signup theme picker
│   ├── Home.jsx/.css             # Dashboard — monthly summary + entries
│   ├── LogEntry.jsx/.css         # Create/edit a daily log entry
│   ├── Monthly.jsx/.css          # Report view + PDF/Excel export
│   ├── Contacts.jsx/.css         # Contact list by stage
│   ├── ContactDetail.jsx/.css    # Individual contact + interactions
│   ├── NotesJournal.jsx/.css     # Browse all notes
│   ├── NoteReader.jsx/.css       # Read-only notepad view
│   └── Settings.jsx/.css         # Profile, pioneer status, appearance, reminders
├── components/
│   ├── BottomNav.jsx/.css        # Persistent bottom navigation
│   ├── EntryCard.jsx/.css        # Single entry display card
│   ├── Timer.jsx/.css            # Stopwatch for logging hours
│   ├── WhatsNew.jsx/.css         # Version update modal
│   └── ThemePicker.jsx/.css      # Theme selection grid
└── utils/
    ├── dateHelpers.js            # Date formatting and month navigation
    ├── exportHelpers.js          # PDF (jsPDF) and Excel (ExcelJS) export
    ├── reminderEngine.js         # Daily notification scheduling
    └── changelog.js              # Version history data
```

---

## Installing as a PWA

**Android (Chrome):**
1. Open the app URL in Chrome
2. Tap the three-dot menu → "Add to Home screen"
3. Tap Install

**iPhone (Safari):**
1. Open the app URL in Safari
2. Tap the Share button → "Add to Home Screen"
3. Tap Add

---

## Firebase Setup

See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for full instructions. You'll need:
1. **Firebase Authentication** — Email/password sign-in
2. **Cloud Firestore** — Document database with offline persistence
3. **Firestore Security Rules** — Deploy `firestore.rules` to restrict user data

---

## Version Roadmap

| Version | Features |
|---------|----------|
| v1.0 | Core tracking, offline-first, PDF/Excel export, 4 themes |
| v1.1 | Pioneer status & goals, encouragement messages, reminders |
| v1.1.1 | Firebase cloud sync, contacts, notes journal, note reader |
