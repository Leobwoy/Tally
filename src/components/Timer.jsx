/**
 * Timer.jsx — stopwatch with RUNNING / PAUSED indicator.
 * Passes full-precision decimal hours (no rounding).
 */

import React, { useState, useEffect, useRef } from "react";
import styles from "./Timer.module.css";

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export default function Timer({ onUse }) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  function handleStartPause() {
    setRunning((r) => !r);
  }

  function handleReset() {
    setRunning(false);
    setSeconds(0);
  }

  function handleUse() {
    if (seconds === 0) return;
    setRunning(false);
    onUse(seconds / 3600);
  }

  const hasTime = seconds > 0;

  return (
    <div className={styles.wrap}>
      {running && (
        <div className={styles.statusRunning}>
          <span className={styles.pulseDot} aria-hidden="true" />
          RUNNING
        </div>
      )}
      {!running && hasTime && (
        <div className={styles.statusPaused}>
          <span className={styles.staticDot} aria-hidden="true" />
          PAUSED
        </div>
      )}

      <div className={styles.display}>{formatTime(seconds)}</div>

      <div className={styles.controls}>
        <button
          className={`${styles.btn} ${running ? styles.pause : styles.start}`}
          onClick={handleStartPause}
        >
          {running ? "⏸ Pause" : hasTime ? "▶ Resume" : "▶ Start"}
        </button>

        {hasTime && !running && (
          <button className={`${styles.btn} ${styles.use}`} onClick={handleUse}>
            ✓ Use Time
          </button>
        )}

        {hasTime && (
          <button className={`${styles.btn} ${styles.reset}`} onClick={handleReset}>
            ↺
          </button>
        )}
      </div>
    </div>
  );
}
