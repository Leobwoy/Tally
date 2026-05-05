/**
 * Onboarding.jsx
 * First-launch screen. Collects user name and theme preference.
 * Shown only when prefs.name is empty. After completing, user
 * is redirected to /home and never sees this screen again.
 */

import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PrefsContext } from "@/App";
import ThemePicker from "@/components/ThemePicker";
import styles from "./Onboarding.module.css";

export default function Onboarding() {
  const { prefs, updatePrefs } = useContext(PrefsContext);
  const navigate = useNavigate();

  const [name,  setName]  = useState("");
  const [theme, setTheme] = useState(prefs?.theme ?? "sunrise");

  const canSubmit = name.trim().length > 0;

  async function handleGetStarted() {
    if (!canSubmit) return;
    await updatePrefs({ name: name.trim(), theme });
    navigate("/home", { replace: true });
  }

  return (
    <div className={styles.page}>
      {/* Logo */}
      <div className={styles.logo}>✦</div>
      <h1 className={styles.appName}>TALLY</h1>
      <p className={styles.tagline}>Your field service companion</p>

      {/* Name input */}
      <div className={styles.field}>
        <label className={`label ${styles.fieldLabel}`} htmlFor="name-input">
          Your Name
        </label>
        <input
          id="name-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGetStarted()}
          placeholder="Enter your name..."
          className={styles.input}
          autoFocus
          autoComplete="name"
        />
      </div>

      {/* Theme picker */}
      <div className={styles.field}>
        <p className={`label ${styles.fieldLabel}`}>Choose Your Theme</p>
        <ThemePicker selected={theme} onChange={setTheme} />
      </div>

      {/* CTA */}
      <button
        className={styles.cta}
        onClick={handleGetStarted}
        disabled={!canSubmit}
      >
        Get Started →
      </button>

      <p className={styles.footnote}>
        Your data stays on your device and syncs to the cloud when online.
      </p>
    </div>
  );
}
