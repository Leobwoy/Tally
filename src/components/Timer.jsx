/**
 * Timer.jsx
 * Stopwatch component used in the LogEntry screen.
 * Counts up from 0, lets the user pause/resume, then "use" the elapsed time.
 *
 * Props:
 *   onUse  {function(hours: number)} — called when user taps "Use Time"
 *                                       with the elapsed time as a decimal number
 */

import React, { useState, useEffect, useRef } from "react";
import styles from "./Timer.module.css";

/** Format elapsed seconds as HH:MM:SS */
function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export default function Timer({ onUse }) {
  const [seconds,  setSeconds]  = useState(0);
  const [running,  setRunning]  = useState(false);
  const intervalRef = useRef(null);

  /* Start or stop the interval based on running state */
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
    /* Convert seconds to decimal hours, rounded to 2 decimal places */
    const decimalHours = Math.round((seconds / 3600) * 100) / 100;
    onUse(decimalHours);
  }

  const hasTime = seconds > 0;

  return (
    <div className={styles.wrap}>
      {/* Display */}
      <div className={styles.display}>{formatTime(seconds)}</div>

      {running && (
        <div className={styles.runningLabel}>Timer running...</div>
      )}

      {/* Controls */}
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
