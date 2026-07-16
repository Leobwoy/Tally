/**
 * EntryCard.jsx
 */

import React from "react";
import { formatEntryDate, formatDuration } from "@/utils/dateHelpers";
import styles from "./EntryCard.module.css";

export default function EntryCard({ entry, onEdit, onDelete }) {
  const studies = entry.bibleStudies ?? [];
  const hasStudies = studies.length > 0;
  const hasNotes = !!entry.notes?.trim();
  const hoursVal = parseFloat(entry.hours) || 0;

  function handleDelete() {
    if (window.confirm("Delete this entry? This cannot be undone.")) {
      onDelete(entry.id);
    }
  }

  return (
    <article className={styles.card}>
      <div className={styles.body}>
        <div className={styles.date}>{formatEntryDate(entry.date)}</div>
        <div className={styles.studies}>
          {hasStudies ? `📖 ${studies.join(", ")}` : "No bible studies"}
        </div>
        {hasNotes && <div className={styles.notes}>&ldquo;{entry.notes}&rdquo;</div>}
      </div>

      <div className={styles.right}>
        {hoursVal > 0 && (
          <div className={styles.hours}>{formatDuration(hoursVal)}</div>
        )}
        <div className={styles.actions}>
          <button
            className={styles.iconBtn}
            onClick={() => onEdit(entry)}
            aria-label={`Edit entry for ${formatEntryDate(entry.date)}`}
            title="Edit"
          >
            ✏️
          </button>
          <button
            className={styles.iconBtnDanger}
            onClick={handleDelete}
            aria-label={`Delete entry for ${formatEntryDate(entry.date)}`}
            title="Delete"
          >
            🗑
          </button>
        </div>
      </div>
    </article>
  );
}
