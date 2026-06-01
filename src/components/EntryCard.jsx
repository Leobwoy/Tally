/**
 * EntryCard.jsx
 * Displays a single field service log entry on the Home screen.
 *
 * Props:
 *   entry     {object}   — the entry object from IndexedDB
 *   onEdit    {function} — called when user taps Edit
 *   onDelete  {function} — called when user taps Delete (after confirmation)
 */

import React from "react";
import { formatEntryDate } from "@/utils/dateHelpers";
import styles from "./EntryCard.module.css";

export default function EntryCard({ entry, onEdit, onDelete }) {
  const hours       = parseFloat(entry.hours).toFixed(1);
  const studies     = entry.bibleStudies ?? [];
  const hasStudies  = studies.length > 0;
  const hasNotes    = !!entry.notes?.trim();

  function handleDelete() {
    if (window.confirm("Delete this entry? This cannot be undone.")) {
      onDelete(entry.id);
    }
  }

  return (
    <article className={styles.card}>
      <div className={styles.body}>
        {/* Date */}
        <div className={styles.date}>{formatEntryDate(entry.date)}</div>

        {/* Bible studies */}
        <div className={styles.studies}>
          {hasStudies
            ? `📖 ${studies.join(", ")}`
            : "No bible studies"}
        </div>

        {/* Optional notes preview */}
        {hasNotes && (
          <div className={styles.notes}>"{entry.notes}"</div>
        )}
      </div>

      <div className={styles.right}>
        {/* Hours badge — hidden when zero (e.g. publishers) */}
        {parseFloat(entry.hours) > 0 && (
          <div className={styles.hours}>{hours}h</div>
        )}

        {/* Action buttons */}
        <div className={styles.actions}>
          <button
            className={styles.editBtn}
            onClick={() => onEdit(entry)}
            aria-label={`Edit entry for ${formatEntryDate(entry.date)}`}
          >
            Edit
          </button>
          <button
            className={styles.deleteBtn}
            onClick={handleDelete}
            aria-label={`Delete entry for ${formatEntryDate(entry.date)}`}
          >
            Del
          </button>
        </div>
      </div>
    </article>
  );
}
