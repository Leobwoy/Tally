/**
 * NoteReader.jsx — read-only notepad view for a single entry's notes.
 */

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getEntry } from "@/firebase/firestore";
import { formatEntryDate, formatDuration } from "@/utils/dateHelpers";
import styles from "./NoteReader.module.css";

export default function NoteReader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      navigate("/notes", { replace: true });
      return;
    }
    getEntry(id).then((e) => {
      if (!e) {
        navigate("/notes", { replace: true });
        return;
      }
      setEntry(e);
      setLoading(false);
    });
  }, [id, navigate]);

  if (loading) return null;

  const hoursVal = parseFloat(entry.hours) || 0;
  const studies = entry.bibleStudies ?? [];
  const hasNotes = (entry.notes ?? "").trim().length > 0;

  return (
    <main className={`page ${styles.page}`}>
      <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className={styles.header}>
        <p className={styles.date}>{formatEntryDate(entry.date)}</p>
        <div className={styles.meta}>
          {hoursVal > 0 && (
            <span className={styles.metaPill}>⏱ {formatDuration(hoursVal)}</span>
          )}
          {studies.length > 0 && (
            <span className={styles.metaPill}>📖 {studies.length} bible {studies.length === 1 ? "study" : "studies"}</span>
          )}
        </div>
      </div>

      <div className={styles.noteCard}>
        <p className={styles.noteLabel}>NOTE</p>
        {hasNotes ? (
          <p className={styles.noteText}>{entry.notes}</p>
        ) : (
          <p className={styles.emptyNote}>No notes recorded for this day.</p>
        )}

        {studies.length > 0 && (
          <div className={styles.studiesSection}>
            <div className={styles.divider} />
            <p className={styles.noteLabel}>BIBLE STUDIES</p>
            <div>
              {studies.map((name) => (
                <span key={name} className={styles.studyPill}>{name}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        className={styles.editBtn}
        onClick={() => navigate(`/log/${entry.id}`)}
      >
        ✏️ Edit this entry
      </button>
    </main>
  );
}
