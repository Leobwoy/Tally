/**
 * Onboarding.jsx
 * Post-signup theme picker. Name comes from Signup.
 */

import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PrefsContext } from "@/App";
import ThemePicker from "@/components/ThemePicker";
import styles from "./Onboarding.module.css";

export default function Onboarding() {
  const { prefs, updatePrefs } = useContext(PrefsContext);
  const navigate = useNavigate();
  const [theme, setTheme] = useState(prefs?.theme ?? "sunrise");

  async function handleGetStarted() {
    await updatePrefs({ theme, onboardingComplete: true });
    navigate("/home", { replace: true });
  }

  return (
    <div className={styles.page}>
      <img src="/icon.svg" alt="Tally" className={styles.logo} />
      <h1 className={styles.appName}>TALLY</h1>
      <p className={styles.tagline}>
        {prefs?.name ? `Welcome, ${prefs.name}` : "Your field service companion"}
      </p>

      <div className={styles.field}>
        <p className={`label ${styles.fieldLabel}`}>Choose Your Theme</p>
        <ThemePicker selected={theme} onChange={setTheme} />
      </div>

      <button className={styles.cta} onClick={handleGetStarted}>
        Get Started →
      </button>

      <p className={styles.footnote}>
        Your data syncs securely to your account across devices.
      </p>
    </div>
  );
}
