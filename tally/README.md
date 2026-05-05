# ✦ Tally — Field Service Hour Tracker

A mobile-first PWA for tracking field service hours and bible studies.
Offline-first, AWS-backed, installable from the browser.

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
Leave the `.env` values empty for now — the app works fully offline without AWS.
Fill them in later when you set up AWS (see AWS Setup below).

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
├── App.jsx                  # Root, routing, theme provider
├── index.css                # Global styles + CSS variables
├── main.jsx                 # Entry point, PWA registration
├── themes/
│   └── themes.js            # Color themes + CSS variable injection
├── db/
│   └── db.js                # IndexedDB schema (Dexie.js)
├── sync/
│   └── syncEngine.js        # Offline-first AWS sync engine
├── screens/
│   ├── Onboarding.jsx/.css  # First launch — name + theme
│   ├── Home.jsx/.css        # Dashboard — monthly summary + entries
│   ├── LogEntry.jsx/.css    # Create/edit a daily log entry
│   ├── Monthly.jsx/.css     # Report view + PDF/Excel export
│   └── Settings.jsx/.css    # Preferences — name, theme, dark mode
├── components/
│   ├── BottomNav.jsx/.css   # Persistent bottom navigation
│   ├── EntryCard.jsx/.css   # Single entry display
│   ├── Timer.jsx/.css       # Stopwatch for logging hours
│   ├── BibleStudyInput.jsx  # Name input with autocomplete
│   └── ThemePicker.jsx/.css # Theme selection grid
└── utils/
    ├── dateHelpers.js       # Date formatting and month navigation
    └── exportHelpers.js     # PDF (jsPDF) and Excel (SheetJS) export
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

## AWS Setup (v2.0 — when you're ready)

You'll need:
1. **AWS Cognito User Pool** — for user accounts and auth
2. **DynamoDB table** — for storing entries
3. **Lambda functions** — GET /entries, PUT /entries, DELETE /entries/:id
4. **HTTP API Gateway** — to expose the Lambda functions

Once set up, fill in your `.env` file with the values and redeploy.
The sync engine (`src/sync/syncEngine.js`) is already fully written and waiting.

---

## Version Roadmap

| Version | Features |
|---------|----------|
| v1.0 | Core tracking, offline-first, PDF/Excel export, 4 themes |
| v1.1 | Goals/targets, reminders, notes, streak tracker |
| v1.2 | Year view, chart, bible study contact details |
| v2.0 | AWS cloud backup, multi-device sync, user accounts |
