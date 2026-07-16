/**
 * Login.jsx — email/password sign-in screen.
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logIn, resetPassword } from "@/firebase/auth";
import styles from "./Login.module.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      await logIn(email.trim(), password);
      navigate("/home", { replace: true });
    } catch (err) {
      console.warn("[Tally] login failed:", err.code);
      setError("Incorrect email or password.");
    } finally {
      setBusy(false);
    }
  }

  async function handleForgot() {
    setError("");
    setInfo("");
    if (!email.trim()) {
      setError("Enter your email above, then tap Forgot password.");
      return;
    }
    try {
      await resetPassword(email.trim());
      setInfo("Password reset email sent. Check your inbox.");
    } catch (err) {
      console.warn("[Tally] reset failed:", err.code);
      setError("Could not send reset email. Check the address and try again.");
    }
  }

  return (
    <div className={styles.page}>
      <img src="/icon.svg" alt="Tally" className={styles.logo} />
      <h1 className={styles.appName}>TALLY</h1>
      <p className={styles.tagline}>Welcome back</p>

      <form className={styles.form} onSubmit={handleLogin}>
        <div className={styles.field}>
          <label className={`label ${styles.fieldLabel}`} htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            autoComplete="email"
            autoFocus
          />
        </div>

        <div className={styles.field}>
          <label className={`label ${styles.fieldLabel}`} htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            autoComplete="current-password"
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}
        {info && <p className={styles.info}>{info}</p>}

        <button type="submit" className={styles.cta} disabled={busy}>
          {busy ? "Signing in…" : "Log In"}
        </button>
      </form>

      <button type="button" className={styles.linkBtn} onClick={handleForgot}>
        Forgot password?
      </button>

      <p className={styles.footer}>
        Don&apos;t have an account?{" "}
        <Link to="/signup" className={styles.link}>Sign up</Link>
      </p>
    </div>
  );
}
