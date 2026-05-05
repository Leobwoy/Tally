/**
 * App.jsx
 * Root component for Tally.
 *
 * Responsibilities:
 *  - Load user preferences from IndexedDB on startup
 *  - Apply the correct theme + dark mode via CSS variables
 *  - Decide whether to show Onboarding or the main app
 *  - Set up routing between the four main screens
 *  - Start the background sync listener
 */

import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Amplify } from "aws-amplify";

import { loadPreferences, savePreferences } from "@/db/db";
import { applyTheme } from "@/themes/themes";
import { startSyncListener, triggerSync } from "@/sync/syncEngine";

import BottomNav    from "@/components/BottomNav";
import Onboarding   from "@/screens/Onboarding";
import Home         from "@/screens/Home";
import LogEntry     from "@/screens/LogEntry";
import Monthly      from "@/screens/Monthly";
import Settings     from "@/screens/Settings";

/* ─── AWS AMPLIFY CONFIGURATION ─────────────────────────────────────────────── */
/*
 * These values come from your .env file (VITE_ prefix exposes them to the browser).
 * Until you have AWS set up, the app works fully offline — Amplify is only
 * used by syncEngine.js which checks for a valid session before doing anything.
 */
if (import.meta.env.VITE_AWS_REGION) {
  Amplify.configure({
    Auth: {
      Cognito: {
        region:           import.meta.env.VITE_AWS_REGION,
        userPoolId:       import.meta.env.VITE_COGNITO_USER_POOL_ID,
        userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
      },
    },
  });
}

/* ─── CONTEXT ───────────────────────────────────────────────────────────────── */
/**
 * PrefsContext — shared across all screens so any component can read or
 * update user preferences without prop-drilling.
 */
export const PrefsContext = React.createContext(null);

/* ─── COMPONENT ─────────────────────────────────────────────────────────────── */
export default function App() {
  const [prefs, setPrefs]   = useState(null);  // null = still loading
  const [ready, setReady]   = useState(false);

  /* Load preferences from IndexedDB on first mount */
  useEffect(() => {
    loadPreferences()
  .then((p) => {
    setPrefs(p);
    applyTheme(p.theme, p.dark);
    setReady(true);
  })
  .catch((err) => {
    console.warn("[Tally] loadPreferences failed completely, using defaults:", err);
    const defaults = { id: "user", name: "", theme: "sunrise", dark: false, awsUserId: null };
    setPrefs(defaults);
    applyTheme(defaults.theme, defaults.dark);
    setReady(true);
  });

    /* Start listening for online events to trigger background sync */
    startSyncListener();

    /* Attempt a sync immediately in case we're already online */
    triggerSync();
  }, []);

  /* Re-apply theme whenever prefs change */
  useEffect(() => {
    if (prefs) applyTheme(prefs.theme, prefs.dark);
  }, [prefs?.theme, prefs?.dark]);

  /**
   * Update one or more preference fields, persist to IndexedDB,
   * and update local state — all in one call.
   * Used by Settings.jsx and Onboarding.jsx.
   *
   * @param {Partial<typeof prefs>} updates
   */
  async function updatePrefs(updates) {
    const next = { ...prefs, ...updates };
    setPrefs(next);
    await savePreferences(updates);
  }

  /* Blank screen while IndexedDB loads (usually < 50ms) */
  if (!ready) return null;

  /* User hasn't completed onboarding yet */
  const isNewUser = !prefs.name;

  return (
    <PrefsContext.Provider value={{ prefs, updatePrefs }}>
      {isNewUser ? (
        /* Onboarding has no nav bar */
        <Routes>
          <Route path="*" element={<Onboarding />} />
        </Routes>
      ) : (
        <>
          <Routes>
            <Route path="/"         element={<Navigate to="/home" replace />} />
            <Route path="/home"     element={<Home />} />
            <Route path="/log"      element={<LogEntry />} />
            <Route path="/log/:id"  element={<LogEntry />} />
            <Route path="/monthly"  element={<Monthly />} />
            <Route path="/settings" element={<Settings />} />
            {/* Fallback — redirect unknown paths to home */}
            <Route path="*"         element={<Navigate to="/home" replace />} />
          </Routes>
          <BottomNav />
        </>
      )}
    </PrefsContext.Provider>
  );
}
