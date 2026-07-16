/**
 * NotesJournal.jsx — all-time list of daily notes.
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { useEntriesWithNotes } from "@/hooks/useFirestore";
import { formatEntryDate, formatDuration } from "@/utils/dateHelpers";
import styles from "./NotesJournal.module.css";

export default function NotesJournal() {
  const navigate = useNavigate();
  const entries = useEntriesWithNotes();

  return (
    <main className={`page ${styles.page}`}>
      <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>
        ← Back
      </button>
      <h1 className={styles.title}>All Notes</h1>

      {entries.length === 0 ? (
        <div className={styles.empty}>
          <p>No notes yet. Add a note when logging your day.</p>
        </div>
      ) : (
        entries.map((e) => (
          <article key={e.id} className={styles.card}>
            <div className={styles.cardTop}>
              <div>
                <p className={styles.date}>{formatEntryDate(e.date)}</p>
                {(parseFloat(e.hours) || 0) > 0 && (
                  <p className={styles.hours}>{formatDuration(e.hours)}</p>
                )}
              </div>
              <button
                type="button"
                className={styles.editBtn}
                onClick={() => navigate(`/notes/${e.id}`)}
                aria-label="Edit note"
              >
                ✏️
              </button>
            </div>
            <p className={styles.note}>{e.notes}</p>
          </article>
        ))
      )}
    </main>
  );
}
