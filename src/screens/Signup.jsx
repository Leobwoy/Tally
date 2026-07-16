/**
 * Signup.jsx — create account with consent checkbox.
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signUp } from "@/firebase/auth";
import styles from "./Login.module.css";

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSignup(e) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!email.trim() || !password) {
      setError("Please enter email and password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!consent) {
      setError("Please agree to the data storage notice to continue.");
      return;
    }

    setBusy(true);
    try {
      await signUp(email.trim(), password, name.trim());
      navigate("/onboarding", { replace: true });
    } catch (err) {
      console.warn("[Tally] signup failed:", err.code);
      if (err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError("Could not create account. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.page}>
      <img src="/icon.svg" alt="Tally" className={styles.logo} />
      <h1 className={styles.appName}>TALLY</h1>
      <p className={styles.tagline}>Create your account</p>

      <form className={styles.form} onSubmit={handleSignup}>
        <div className={styles.field}>
          <label className={`label ${styles.fieldLabel}`} htmlFor="signup-name">Name</label>
          <input
            id="signup-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
            autoComplete="name"
            autoFocus
          />
        </div>

        <div className={styles.field}>
          <label className={`label ${styles.fieldLabel}`} htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            autoComplete="email"
          />
        </div>

        <div className={styles.field}>
          <label className={`label ${styles.fieldLabel}`} htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            autoComplete="new-password"
          />
        </div>

        <div className={styles.field}>
          <label className={`label ${styles.fieldLabel}`} htmlFor="signup-confirm">Confirm password</label>
          <input
            id="signup-confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={styles.input}
            autoComplete="new-password"
          />
        </div>

        <label className={styles.consent}>
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span>
            I agree that my name and email are stored securely to sync my data across devices.
          </span>
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.cta} disabled={busy}>
          {busy ? "Creating account…" : "Create Account"}
        </button>
      </form>

      <p className={styles.footer}>
        Already have an account?{" "}
        <Link to="/login" className={styles.link}>Log in</Link>
      </p>
    </div>
  );
}
