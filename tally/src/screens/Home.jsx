/**
 * Home.jsx
 * Main dashboard screen.
 * Shows a monthly summary card, month navigation, and list of entries.
 */

import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";

import { PrefsContext } from "@/App";
import db, { deleteEntry } from "@/db/db";
import { triggerSync } from "@/sync/syncEngine";
import EntryCard from "@/components/EntryCard";
import {
  currentMonthKey, prevMonthKey, nextMonthKey,
  isCurrentMonth, formatMonthLabel,
  getGreeting, monthProgressPercent,
} from "@/utils/dateHelpers";
import styles from "./Home.module.css";

export default function Home() {
  const { prefs } = useContext(PrefsContext);
  const navigate  = useNavigate();

  /* Active month for the dashboard — defaults to current month */
  const [monthKey, setMonthKey] = useState(currentMonthKey);

  /* Live query — re-renders automatically when IndexedDB changes */
  const entries = useLiveQuery(
    () => db.entries.where("monthKey").equals(monthKey).sortBy("date"),
    [monthKey],
    []
  );

  /* Sorted newest-first for display */
  const sortedEntries = [...(entries ?? [])].reverse();

  /* Compute totals */
  const totalHours = sortedEntries.reduce((s, e) => s + (parseFloat(e.hours) || 0), 0);
  const uniqueBS   = new Set(sortedEntries.flatMap((e) => e.bibleStudies ?? []));
  const progress   = isCurrentMonth(monthKey) ? monthProgressPercent() : 100;

  async function handleDelete(id) {
    await deleteEntry(id);
    triggerSync();
  }

  function handleEdit(entry) {
    navigate(`/log/${entry.id}`);
  }

  const monthLabel = formatMonthLabel(monthKey);
  const atCurrentMonth = isCurrentMonth(monthKey);

  return (
    <main className={`page ${styles.page}`}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <p className="label">{getGreeting().toUpperCase()}</p>
          <h1 className={styles.userName}>
            {prefs.name} <span className={styles.star}>✦</span>
          </h1>
        </div>
        <time className={styles.todayDate}>
          {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
        </time>
      </header>

      {/* Monthly hero card */}
      <section className={styles.heroCard} aria-label="Monthly summary">
        <div className={styles.heroNav}>
          <button
            className={styles.navBtn}
            onClick={() => setMonthKey(prevMonthKey(monthKey))}
            aria-label="Previous month"
          >‹</button>

          <div className={styles.heroMonth}>
            <p className={styles.heroMonthSub}>FIELD SERVICE</p>
            <h2 className={styles.heroMonthLabel}>{monthLabel}</h2>
          </div>

          <button
            className={styles.navBtn}
            onClick={() => setMonthKey(nextMonthKey(monthKey))}
            disabled={atCurrentMonth}
            aria-label="Next month"
            style={{ opacity: atCurrentMonth ? 0.3 : 1 }}
          >›</button>
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{totalHours.toFixed(1)}</span>
            <span className={styles.statLabel}>HOURS</span>
          </div>
          <div className={styles.divider} />
          <div className={styles.stat}>
            <span className={styles.statValue}>{uniqueBS.size}</span>
            <span className={styles.statLabel}>BIBLE STUDIES</span>
          </div>
        </div>

        {/* Month progress bar — only shown for current month */}
        {atCurrentMonth && (
          <>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
            <p className={styles.progressLabel}>{progress}% of month complete</p>
          </>
        )}
      </section>

      {/* Entries list */}
      <div className={styles.listHeader}>
        <p className="label">ENTRIES THIS MONTH</p>
        <span className={styles.entryCount}>{sortedEntries.length} days</span>
      </div>

      {sortedEntries.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📋</span>
          <p className={styles.emptyText}>No entries yet for {monthLabel}</p>
          <p className={styles.emptyHint}>Tap + to log your first day</p>
        </div>
      ) : (
        sortedEntries.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))
      )}

      {/* FAB — log new entry */}
      <button
        className={styles.fab}
        onClick={() => navigate("/log")}
        aria-label="Log new entry"
      >+</button>
    </main>
  );
}
