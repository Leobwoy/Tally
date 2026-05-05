/**
 * LogEntry.jsx
 * Create a new entry or edit an existing one.
 * Route: /log (new) or /log/:id (edit)
 */

import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
// Using browser-native crypto.randomUUID() — no import needed

import db, { saveEntry, addContacts } from "@/db/db";
import { triggerSync } from "@/sync/syncEngine";
import { todayISO, toMonthKey } from "@/utils/dateHelpers";
import Timer from "@/components/Timer";
import BibleStudyInput from "@/components/BibleStudyInput";
import styles from "./LogEntry.module.css";

export default function LogEntry() {
  const { id }   = useParams();   // present when editing
  const navigate = useNavigate();
  const isEdit   = !!id;

  /* Form state */
  const [date,         setDate]         = useState(todayISO());
  const [hours,        setHours]        = useState("");
  const [inputMode,    setInputMode]    = useState("manual"); // "manual" | "timer"
  const [bibleStudies, setBibleStudies] = useState([]);
  const [notes,        setNotes]        = useState("");
  const [loading,      setLoading]      = useState(isEdit);
  const [error,        setError]        = useState("");

  /* Load existing entry when editing */
  useEffect(() => {
    if (!isEdit) return;
    db.entries.get(id).then((entry) => {
      if (!entry) { navigate("/home", { replace: true }); return; }
      setDate(entry.date);
      setHours(String(entry.hours));
      setBibleStudies(entry.bibleStudies ?? []);
      setNotes(entry.notes ?? "");
      setLoading(false);
    });
  }, [id, isEdit, navigate]);

  function handleTimerUse(decimalHours) {
    setHours(String(decimalHours));
    setInputMode("manual"); // Switch to manual so user can see and adjust the value
  }

  async function handleSave() {
    /* Validate */
    const parsedHours = parseFloat(hours);
    if (!hours || isNaN(parsedHours) || parsedHours <= 0) {
      setError("Please enter a valid number of hours greater than 0.");
      return;
    }
    if (!date) {
      setError("Please select a date.");
      return;
    }

    setError("");

    const [y, m] = date.split("-").map(Number);
    const entry = {
      id:           isEdit ? id : crypto.randomUUID(),
      date,
      hours:        parsedHours,
      bibleStudies,
      notes:        notes.trim(),
      monthKey:     toMonthKey(y, m - 1),
    };

    await saveEntry(entry);

    /* Persist any new contact names for future autocomplete */
    if (bibleStudies.length > 0) {
      await addContacts(bibleStudies);
    }

    /* Fire and forget — sync in background */
    triggerSync();

    navigate("/home", { replace: true });
  }

  if (loading) return null;

  return (
    <main className={`page ${styles.page}`}>
      {/* Back + title */}
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className={styles.title}>{isEdit ? "Edit Entry" : "Log Your Day"}</h1>
      </div>

      {/* Date */}
      <div className={styles.field}>
        <label className="label" htmlFor="entry-date">Date</label>
        <input
          id="entry-date"
          type="date"
          value={date}
          max={todayISO()}
          onChange={(e) => setDate(e.target.value)}
          className={styles.dateInput}
        />
      </div>

      {/* Hours */}
      <div className={styles.field}>
        <p className="label">Hours</p>
        <div className={styles.card}>
          {/* Mode toggle */}
          <div className={styles.modeToggle}>
            {["manual", "timer"].map((mode) => (
              <button
                key={mode}
                className={`${styles.modeBtn} ${inputMode === mode ? styles.modeBtnActive : ""}`}
                onClick={() => setInputMode(mode)}
              >
                {mode === "manual" ? "✏️ Manual" : "⏱ Timer"}
              </button>
            ))}
          </div>

          {inputMode === "manual" ? (
            <div className={styles.manualWrap}>
              <input
                type="number"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="e.g. 2.5"
                min="0.01"
                step="0.25"
                className={styles.hoursInput}
                inputMode="decimal"
              />
              <p className={styles.hoursHint}>Enter hours as a decimal (e.g. 1.5 = 1h 30min)</p>
            </div>
          ) : (
            <Timer onUse={handleTimerUse} />
          )}

          {/* Show saved value from timer */}
          {inputMode === "manual" && hours && parseFloat(hours) > 0 && (
            <p className={styles.savedHours}>
              ✓ {parseFloat(hours).toFixed(2)} hours
            </p>
          )}
        </div>
      </div>

      {/* Bible studies */}
      <div className={styles.field}>
        <p className="label">Bible Studies <span className={styles.optional}>(optional)</span></p>
        <div className={styles.card}>
          <BibleStudyInput value={bibleStudies} onChange={setBibleStudies} />
        </div>
      </div>

      {/* Notes */}
      <div className={styles.field}>
        <label className="label" htmlFor="entry-notes">
          Notes <span className={styles.optional}>(optional)</span>
        </label>
        <textarea
          id="entry-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any notes from today..."
          rows={3}
          className={styles.textarea}
        />
      </div>

      {/* Error message */}
      {error && <p className={styles.error}>{error}</p>}

      {/* Save button */}
      <button className={styles.saveBtn} onClick={handleSave}>
        {isEdit ? "Update Entry ✓" : "Save Entry ✓"}
      </button>
    </main>
  );
}
