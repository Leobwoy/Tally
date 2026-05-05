/**
 * Monthly.jsx
 * Monthly report screen — table of entries, totals, and export buttons.
 */

import React, { useContext, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { PrefsContext } from "@/App";
import db from "@/db/db";
import { exportPDF, exportExcel } from "@/utils/exportHelpers";
import {
  currentMonthKey, prevMonthKey, nextMonthKey,
  isCurrentMonth, formatMonthLabel, formatReportDate,
} from "@/utils/dateHelpers";
import styles from "./Monthly.module.css";

export default function Monthly() {
  const { prefs } = useContext(PrefsContext);
  const [monthKey, setMonthKey] = useState(currentMonthKey);

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
        <div className={`${styles.summaryCard} ${styles.summaryPrimary}`}>
          <span className={styles.summaryValue}>{totalHours.toFixed(1)}</span>
          <span className={styles.summaryLabel}>TOTAL HOURS</span>
        </div>
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
              <span>HRS</span>
              <span>BS</span>
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
                <span className={styles.hoursCell}>{parseFloat(entry.hours).toFixed(1)}h</span>
                <span className={styles.bsCell}>{entry.bibleStudies?.length ?? 0}</span>
              </div>
            ))}

            {/* Totals row */}
            <div className={`${styles.tableRow} ${styles.tableTotal}`}>
              <span>TOTAL</span>
              <span>{totalHours.toFixed(1)}h</span>
              <span>{uniqueBS.length}</span>
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
              onClick={() => exportPDF(sorted, monthKey, prefs.name, prefs.theme)}
            >
              📄 Export PDF
            </button>
            <button
              className={styles.exportExcel}
              onClick={() => exportExcel(sorted, monthKey, prefs.name, prefs.theme)}
            >
              📊 Export Excel
            </button>
          </div>
        </>
      )}
    </main>
  );
}
