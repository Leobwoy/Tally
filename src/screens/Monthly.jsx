/**
 * Monthly.jsx
 * Monthly report screen — table of entries, totals, and export buttons.
 */

import React, { useContext, useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { PrefsContext } from "@/App";
import db, { getStatusForMonth } from "@/db/db";
import { exportPDF, exportExcel } from "@/utils/exportHelpers";
import {
  currentMonthKey, prevMonthKey, nextMonthKey,
  isCurrentMonth, formatMonthLabel, formatReportDate,
} from "@/utils/dateHelpers";
import styles from "./Monthly.module.css";

export default function Monthly() {
  const { prefs } = useContext(PrefsContext);
  const [monthKey, setMonthKey] = useState(currentMonthKey);
  const [monthStatus, setMonthStatus] = useState(null);

  useEffect(() => {
    getStatusForMonth(monthKey).then((s) => setMonthStatus(s));
  }, [monthKey]);

  const entries = useLiveQuery(
    () => db.entries.where("monthKey").equals(monthKey).sortBy("date"),
    [monthKey],
    []
  );

  /* Oldest-first for the report table */
  const sorted = [...(entries ?? [])];

  const totalHours = sorted.reduce((s, e) => s + (parseFloat(e.hours) || 0), 0);
  const uniqueBS   = [...new Set(sorted.flatMap((e) => e.bibleStudies ?? []))];
  const monthLabel = formatMonthLabel(monthKey);
  const atCurrent  = isCurrentMonth(monthKey);
  const isPublisher = monthStatus?.status === "publisher";
  const goalHours = monthStatus?.goalHours ?? 0;
  const remaining = !isPublisher ? Math.max(0, goalHours - totalHours) : 0;
  const goalReached = !isPublisher && goalHours > 0 && totalHours >= goalHours;

  return (
    <main className={`page ${styles.page}`}>
      <p className="label">MONTHLY REPORT</p>

      {/* Month navigation */}
      <div className={styles.monthNav}>
        <button
          className={styles.navBtn}
          onClick={() => setMonthKey(prevMonthKey(monthKey))}
          aria-label="Previous month"
        >‹</button>
        <h1 className={styles.monthLabel}>{monthLabel}</h1>
        <button
          className={styles.navBtn}
          onClick={() => setMonthKey(nextMonthKey(monthKey))}
          disabled={atCurrent}
          aria-label="Next month"
          style={{ opacity: atCurrent ? 0.3 : 1 }}
        >›</button>
      </div>

      {/* Summary cards */}
      <div className={styles.summaryRow}>
        {!isPublisher && (
          <div className={`${styles.summaryCard} ${styles.summaryPrimary}`}>
            <span className={styles.summaryValue}>{totalHours.toFixed(1)}</span>
            <span className={styles.summaryLabel}>TOTAL HOURS</span>
            {goalHours > 0 && (
              <div style={{ marginTop: 8, fontSize: 12, opacity: 0.9 }}>
                {goalReached ? (
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: "rgba(46, 204, 113, 0.18)",
                      border: "1px solid rgba(46, 204, 113, 0.35)",
                    }}
                  >
                    Goal reached ✓
                  </span>
                ) : (
                  <span>{remaining.toFixed(1)}h remaining</span>
                )}
              </div>
            )}
          </div>
        )}
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue} style={{ color: "var(--color-primary)" }}>
            {uniqueBS.length}
          </span>
          <span className={styles.summaryLabel}>BIBLE STUDIES</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue} style={{ color: "var(--color-primary)" }}>
            {sorted.length}
          </span>
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
          {/* Entry table */}
          <div className={styles.tableWrap}>
            {/* Table header */}
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
                {!isPublisher && <span className={styles.hoursCell}>{parseFloat(entry.hours).toFixed(1)}h</span>}
              </div>
            ))}

            {/* Totals row */}
            <div className={`${styles.tableRow} ${styles.tableTotal}`}>
              <span>TOTAL</span>
              <span>{uniqueBS.length}</span>
              {!isPublisher && <span>{totalHours.toFixed(1)}h</span>}
            </div>
          </div>

          {/* Bible study names */}
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

          {/* Export buttons */}
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
