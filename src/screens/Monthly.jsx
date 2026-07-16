/**
 * Monthly.jsx — report screen with Firestore entries.
 */

import React, { useContext, useEffect, useState } from "react";
import { PrefsContext } from "@/App";
import { getStatusForMonth } from "@/firebase/firestore";
import { useEntriesForMonth } from "@/hooks/useFirestore";
import { exportPDF, exportExcel } from "@/utils/exportHelpers";
import {
  currentMonthKey, prevMonthKey, nextMonthKey,
  isCurrentMonth, formatMonthLabel, formatReportDate, formatDuration,
} from "@/utils/dateHelpers";
import styles from "./Monthly.module.css";

export default function Monthly() {
  const { prefs } = useContext(PrefsContext);
  const [monthKey, setMonthKey] = useState(currentMonthKey);
  const [monthStatus, setMonthStatus] = useState(null);

  const { entries } = useEntriesForMonth(monthKey);
  const sorted = [...(entries ?? [])].reverse(); // oldest-first for table

  useEffect(() => {
    getStatusForMonth(monthKey).then(setMonthStatus).catch(() => setMonthStatus(null));
  }, [monthKey]);

  const totalHours = sorted.reduce((s, e) => s + (parseFloat(e.hours) || 0), 0);
  const uniqueBS = [...new Set(sorted.flatMap((e) => e.bibleStudies ?? []))];
  const monthLabel = formatMonthLabel(monthKey);
  const atCurrent = isCurrentMonth(monthKey);
  const isPublisher = monthStatus?.status === "publisher";
  const goalHours = monthStatus?.goalHours ?? 0;
  const remaining = !isPublisher ? Math.max(0, goalHours - totalHours) : 0;
  const goalReached = !isPublisher && goalHours > 0 && totalHours >= goalHours;

  return (
    <main className={`page ${styles.page}`}>
      <p className="label">MONTHLY REPORT</p>

      <div className={styles.monthNav}>
        <button className={styles.navBtn} onClick={() => setMonthKey(prevMonthKey(monthKey))} aria-label="Previous month">‹</button>
        <h1 className={styles.monthLabel}>{monthLabel}</h1>
        <button
          className={styles.navBtn}
          onClick={() => setMonthKey(nextMonthKey(monthKey))}
          disabled={atCurrent}
          aria-label="Next month"
          style={{ opacity: atCurrent ? 0.3 : 1 }}
        >›</button>
      </div>

      <div className={styles.summaryRow}>
        {!isPublisher && (
          <div className={`${styles.summaryCard} ${styles.summaryPrimary}`}>
            <span className={styles.summaryValue}>{formatDuration(totalHours)}</span>
            <span className={styles.summaryLabel}>TOTAL HOURS</span>
            {goalHours > 0 && (
              <div style={{ marginTop: 8, fontSize: 12, opacity: 0.9 }}>
                {goalReached ? (
                  <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 999, background: "rgba(46, 204, 113, 0.18)", border: "1px solid rgba(46, 204, 113, 0.35)" }}>
                    Goal reached ✓
                  </span>
                ) : (
                  <span>{formatDuration(remaining)} remaining</span>
                )}
              </div>
            )}
          </div>
        )}
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue} style={{ color: "var(--color-primary)" }}>{uniqueBS.length}</span>
          <span className={styles.summaryLabel}>BIBLE STUDIES</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue} style={{ color: "var(--color-primary)" }}>{sorted.length}</span>
          <span className={styles.summaryLabel}>DAYS OUT</span>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className={styles.empty}>
          <span>📊</span>
          <p>No entries for {monthLabel}</p>
        </div>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <div className={`${styles.tableRow} ${styles.tableHead}`}>
              <span>DATE</span>
              <span>BS</span>
              {!isPublisher && <span>HRS</span>}
            </div>

            {sorted.map((entry, i) => (
              <div
                key={entry.id}
                className={styles.tableRow}
                style={{ background: i % 2 === 0 ? "var(--color-card)" : "var(--color-bg)" }}
              >
                <div className={styles.dateCell}>
                  <span className={styles.datePrimary}>{formatReportDate(entry.date)}</span>
                  {entry.bibleStudies?.length > 0 && (
                    <span className={styles.dateSub}>{entry.bibleStudies.join(", ")}</span>
                  )}
                </div>
                <span className={styles.bsCell}>{entry.bibleStudies?.length ?? 0}</span>
                {!isPublisher && (
                  <span className={styles.hoursCell}>{formatDuration(parseFloat(entry.hours) || 0)}</span>
                )}
              </div>
            ))}

            <div className={`${styles.tableRow} ${styles.tableTotal}`}>
              <span>TOTAL</span>
              <span>{uniqueBS.length}</span>
              {!isPublisher && <span>{formatDuration(totalHours)}</span>}
            </div>
          </div>

          {uniqueBS.length > 0 && (
            <div className={styles.contactsCard}>
              <p className="label" style={{ marginBottom: 10 }}>BIBLE STUDY CONTACTS</p>
              <div className={styles.pills}>
                {uniqueBS.map((name) => (
                  <span key={name} className={styles.pill}>{name}</span>
                ))}
              </div>
            </div>
          )}

          <p className="label" style={{ marginTop: 8, marginBottom: 8 }}>Ready to share your report?</p>
          <div className={styles.exportRow}>
            <button
              className={styles.exportPDF}
              onClick={() => exportPDF(sorted, monthKey, prefs.name, prefs.theme, monthStatus)}
            >
              📄 Export PDF
            </button>
            <button
              className={styles.exportExcel}
              onClick={() => exportExcel(sorted, monthKey, prefs.name, prefs.theme, monthStatus)}
            >
              📊 Export Excel
            </button>
          </div>
        </>
      )}
    </main>
  );
}
