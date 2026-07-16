/**
 * App.jsx
 * Root component for Tally v1.2.
 *
 * - Device theme/dark from Dexie (instant)
 * - Auth via Firebase; profile + data via Firestore
 * - Offline sync handled by Firestore persistence
 */

import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { loadPreferences, savePreferences } from "@/db/db";
import { applyTheme } from "@/themes/themes";
import { onAuthChange } from "@/firebase/auth";
import {
  getUserProfile,
  updateUserProfile,
  migrateLocalDataToFirestore,
  subscribeUserProfile,
} from "@/firebase/firestore";
import { scheduleReminder } from "@/utils/reminderEngine";
import { CURRENT_VERSION } from "@/utils/changelog";
import WhatsNew from "@/components/WhatsNew";

import BottomNav from "@/components/BottomNav";
import Onboarding from "@/screens/Onboarding";
import Login from "@/screens/Login";
import Signup from "@/screens/Signup";
import Home from "@/screens/Home";
import LogEntry from "@/screens/LogEntry";
import Contacts from "@/screens/Contacts";
import ContactDetail from "@/screens/ContactDetail";
import NotesJournal from "@/screens/NotesJournal";
import NoteReader from "@/screens/NoteReader";
import Monthly from "@/screens/Monthly";
import Settings from "@/screens/Settings";

export const PrefsContext = React.createContext(null);

export default function App() {
  /** undefined = checking auth, null = logged out, User = logged in */
  const [user, setUser] = useState(undefined);
  const [localPrefs, setLocalPrefs] = useState(null);
  const [profile, setProfile] = useState(null);
  const [ready, setReady] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  /* Instant theme from Dexie + persistent storage request */
  useEffect(() => {
    loadPreferences()
      .then((p) => {
        setLocalPrefs(p);
        applyTheme(p.theme ?? "sunrise", !!p.dark);
        setReady(true);
      })
      .catch(() => {
        const defaults = { theme: "sunrise", dark: false };
        setLocalPrefs(defaults);
        applyTheme(defaults.theme, defaults.dark);
        setReady(true);
      });

    if (navigator.storage?.persist) {
      navigator.storage.persist().then((granted) => {
        console.log("[Tally] persistent storage:", granted);
      });
    }
  }, []);

  /* Auth listener */
  useEffect(() => {
    const unsub = onAuthChange((u) => setUser(u));
    return unsub;
  }, []);

  /* Profile subscription + migration when signed in */
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    let cancelled = false;
    let unsubProfile = () => {};

    (async () => {
      setMigrating(true);
      try {
        await migrateLocalDataToFirestore();
      } catch (err) {
        console.warn("[Tally] migration error:", err.message);
      }
      if (cancelled) return;
      setMigrating(false);

      unsubProfile = subscribeUserProfile((p) => {
        setProfile(p);
        if (p?.theme != null || p?.dark != null) {
          // Keep Dexie in sync when profile carries theme (legacy) but prefer localPrefs for theme
        }
        if (p?.name && p.lastSeenVersion !== CURRENT_VERSION) {
          setShowWhatsNew(true);
        }
        if (p?.remindersEnabled) {
          scheduleReminder(p.reminderHour ?? 18);
        }
      });
    })();

    return () => {
      cancelled = true;
      unsubProfile();
    };
  }, [user]);

  useEffect(() => {
    if (localPrefs) applyTheme(localPrefs.theme, localPrefs.dark);
  }, [localPrefs?.theme, localPrefs?.dark]);

  async function updateLocalPrefs(updates) {
    const next = { ...localPrefs, ...updates };
    setLocalPrefs(next);
    await savePreferences(updates);
    if (updates.theme != null || updates.dark != null) {
      applyTheme(next.theme, next.dark);
    }
  }

  async function updateProfile(updates) {
    await updateUserProfile(updates);
    setProfile((prev) => (prev ? { ...prev, ...updates } : prev));
  }

  /**
   * Unified updater used by Settings/Onboarding.
   * Theme/dark → Dexie; everything else → Firestore profile.
   */
  async function updatePrefs(updates) {
    const localKeys = {};
    const profileKeys = {};
    for (const [k, v] of Object.entries(updates)) {
      if (k === "theme" || k === "dark") localKeys[k] = v;
      else profileKeys[k] = v;
    }
    if (Object.keys(localKeys).length) await updateLocalPrefs(localKeys);
    if (Object.keys(profileKeys).length) await updateProfile(profileKeys);
  }

  async function handleDismissWhatsNew() {
    setShowWhatsNew(false);
    await updateProfile({ lastSeenVersion: CURRENT_VERSION });
  }

  /* Merged prefs view for screens that still read prefs.name / prefs.theme etc. */
  const prefs = {
    ...(localPrefs ?? { theme: "sunrise", dark: false }),
    ...(profile ?? {}),
    name: profile?.name ?? "",
    theme: localPrefs?.theme ?? profile?.theme ?? "sunrise",
    dark: localPrefs?.dark ?? profile?.dark ?? false,
  };

  if (!ready || user === undefined) return null;
  if (user && migrating) return null;

  const isLoggedOut = user === null;
  const needsOnboarding = user && profile && profile.onboardingComplete === false;
  // Wait for profile to load when logged in
  if (user && profile === null && !migrating) {
    // Still loading profile snapshot
  }

  return (
    <PrefsContext.Provider value={{ prefs, profile, localPrefs, updatePrefs, updateLocalPrefs, updateProfile, user }}>
      {isLoggedOut ? (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : needsOnboarding || (user && profile && !profile.onboardingComplete) ? (
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="*" element={<Navigate to="/onboarding" replace />} />
        </Routes>
      ) : !profile ? (
        null
      ) : (
        <>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/log" element={<LogEntry />} />
            <Route path="/log/:id" element={<LogEntry />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/contacts/:id" element={<ContactDetail />} />
            <Route path="/notes" element={<NotesJournal />} />
            <Route path="/notes/:id" element={<NoteReader />} />
            <Route path="/monthly" element={<Monthly />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/login" element={<Navigate to="/home" replace />} />
            <Route path="/signup" element={<Navigate to="/home" replace />} />
            <Route path="/onboarding" element={<Navigate to="/home" replace />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
          <BottomNav />
        </>
      )}

      {showWhatsNew && (
        <WhatsNew version={CURRENT_VERSION} onDismiss={handleDismissWhatsNew} />
      )}
    </PrefsContext.Provider>
  );
}
