/**
 * Home.jsx
 * Main dashboard screen.
 * Shows a monthly summary card, month navigation, and list of entries.
 */

import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";

import { PrefsContext } from "@/App";
import db, { deleteEntry, getStatusForMonth } from "@/db/db";
import { triggerSync } from "@/sync/syncEngine";
import EntryCard from "@/components/EntryCard";
import {
  currentMonthKey, prevMonthKey, nextMonthKey,
  isCurrentMonth, formatMonthLabel,
  getGreeting, monthProgressPercent, todayISO,
} from "@/utils/dateHelpers";
import styles from "./Home.module.css";

export default function Home() {
  const { prefs } = useContext(PrefsContext);
  const navigate  = useNavigate();

  /* Active month for the dashboard — defaults to current month */
  const [monthKey, setMonthKey] = useState(currentMonthKey);

  /** Pioneer status for the month currently shown (navigated month, not always “today”). */
  const [viewStatus, setViewStatus] = useState(null);

  useEffect(() => {
    getStatusForMonth(monthKey).then((s) => setViewStatus(s));
  }, [monthKey]);

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
  const monthPct   = isCurrentMonth(monthKey) ? monthProgressPercent() : 100;

  async function handleDelete(id) {
    await deleteEntry(id);
    triggerSync();
  }

  function handleEdit(entry) {
    navigate(`/log/${entry.id}`);
  }

  const monthLabel = formatMonthLabel(monthKey);
  const atCurrentMonth = isCurrentMonth(monthKey);

  const isPublisher = viewStatus?.status === "publisher";
  const goalHours = viewStatus?.goalHours ?? 0;
  const progressPercent = !isPublisher && goalHours > 0 ? (totalHours / goalHours) * 100 : 0;
  const cappedProgress = Math.min(100, Math.max(0, progressPercent));
  const remaining = !isPublisher ? Math.max(0, goalHours - totalHours) : 0;
  const monthIsAlmostOver = monthPct > 75;
  const showWarning =
    viewStatus?.status === "auxiliary" && totalHours < 15 && monthIsAlmostOver && totalHours < goalHours;
  const goalReached = !isPublisher && goalHours > 0 && totalHours >= goalHours;

  const todayEntry =
    atCurrentMonth ? sortedEntries.find((e) => e.date === todayISO()) ?? null : null;
  const todayLogged = !!todayEntry;
  const todayHours = todayEntry ? (parseFloat(todayEntry.hours) || 0) : 0;
  const todayHasBibleStudies = (todayEntry?.bibleStudies?.length ?? 0) > 0;

  function getEncouragementText() {
    if (!viewStatus) return null;

    /** Past (or any non-current) month with no data: skip — avoids “motivation” for months a brand-new user never used. */
    if (!atCurrentMonth && sortedEntries.length === 0) return null;

    if (viewStatus.status === "publisher") {
      if (atCurrentMonth) {
        let msg = null;
        if (todayLogged && todayHasBibleStudies) {
          msg = `Amazing! You did a bible study today.\nThat's ${uniqueBS.size} this month so far.`;
        } else if (todayLogged && !todayHasBibleStudies) {
          msg = "Good job going out today!\nKeep an eye out for bible study opportunities.";
        } else if (!todayLogged && uniqueBS.size > 0) {
          msg = `You have ${uniqueBS.size} bible\nstudy this month. Keep nurturing them!`;
        } else {
          msg = "Every bible study starts with a conversation.\nReady to go today?";
        }

        if (uniqueBS.size >= 3) {
          msg = `Wonderful! ${uniqueBS.size} bible studies\nthis month — that's real impact.`;
        }

        return msg;
      }

      // Past month — only when this month has entries (guarded above)
      if (uniqueBS.size >= 3) {
        return `Wonderful! ${uniqueBS.size} bible studies\nthis month — that's real impact.`;
      }
      if (uniqueBS.size > 0) {
        return `This month you had ${uniqueBS.size} bible ${uniqueBS.size === 1 ? "study" : "studies"}.\nNice work staying close to your students.`;
      }
      return "This month you logged time in the ministry\nwith no bible studies recorded — every good conversation counts.";
    }

    // Auxiliary / Regular
    if (sortedEntries.length === 0) {
      if (!atCurrentMonth) return null;
      return `New month! Your goal is ${goalHours}h.\nReady to start?`;
    }

    if (goalReached && uniqueBS.size > 0) {
      return `Goal reached! ${totalHours.toFixed(1)}h and\n${uniqueBS.size} bible studies this month. Excellent!`;
    }
    if (goalReached && uniqueBS.size === 0) {
      return "Hours goal reached! Now go find\nthat bible study opportunity.";
    }

    const remainingHours = Math.max(0, goalHours - totalHours);
    if (atCurrentMonth) {
      if (todayLogged && todayHasBibleStudies) {
        return `Great day! ${todayHours.toFixed(1)}h logged and\na bible study too. ${totalHours.toFixed(1)}h total this month.`;
      }
      if (todayLogged && !todayHasBibleStudies) {
        return `Good work! ${todayHours.toFixed(1)}h logged today.\n${remainingHours.toFixed(1)}h left to reach your goal.`;
      }
      if (totalHours < goalHours && uniqueBS.size > 0) {
        return `${remainingHours.toFixed(1)}h to your goal, and\n${uniqueBS.size} bible studies already. Keep going!`;
      }
      return null;
    }

    // Past month with entries, goal not reached (or reached handled above)
    if (totalHours < goalHours && uniqueBS.size > 0) {
      return `You finished ${monthLabel} with ${totalHours.toFixed(1)}h toward your ${goalHours}h goal\nand ${uniqueBS.size} bible ${uniqueBS.size === 1 ? "study" : "studies"}.`;
    }
    if (totalHours < goalHours) {
      return `You finished ${monthLabel} with ${totalHours.toFixed(1)}h of your ${goalHours}h goal.`;
    }

    return null;
  }

  const encouragementText = getEncouragementText();

  const pillStyle = (status) => {
    const base = {
      display: "inline-block",
      padding: "5px 10px",
      borderRadius: 999,
      fontSize: 12,
      border: "1px solid var(--color-border)",
      background: "var(--color-bg)",
      marginBottom: 10,
    };
    if (status === "regular") return { ...base, background: "rgba(46, 204, 113, 0.18)", borderColor: "rgba(46, 204, 113, 0.35)" };
    if (status === "auxiliary") return { ...base, background: "rgba(52, 152, 219, 0.18)", borderColor: "rgba(52, 152, 219, 0.35)" };
    return { ...base, background: "rgba(160, 160, 160, 0.12)", borderColor: "rgba(160, 160, 160, 0.25)" };
  };

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
        {viewStatus?.status && (
          <span style={pillStyle(viewStatus.status)}>
            {viewStatus.status === "regular"
              ? "Regular Pioneer"
              : viewStatus.status === "auxiliary"
                ? "Auxiliary Pioneer"
                : "Publisher"}
          </span>
        )}

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
          {!isPublisher ? (
            <>
              <div className={styles.stat}>
                <span className={styles.statValue}>{totalHours.toFixed(1)}</span>
                <span className={styles.statLabel}>HOURS</span>
              </div>
              <div className={styles.divider} />
              <div className={styles.stat}>
                <span className={styles.statValue}>{uniqueBS.size}</span>
                <span className={styles.statLabel}>BIBLE STUDIES</span>
              </div>
            </>
          ) : (
            <div className={styles.stat} style={{ width: "100%" }}>
              <span className={styles.statValue}>{uniqueBS.size}</span>
              <span className={styles.statLabel}>BIBLE STUDIES</span>
            </div>
          )}
        </div>

        {/* Goal progress — hidden for publishers */}
        {atCurrentMonth && !isPublisher && goalHours > 0 && (
          <>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${cappedProgress}%`,
                  background: goalReached
                    ? "rgba(46, 204, 113, 0.95)"
                    : showWarning
                      ? "rgba(245, 158, 11, 0.95)"
                      : "rgba(255, 255, 255, 0.95)",
                }}
              />
            </div>
            <p className={styles.progressLabel}>
              {goalReached
                ? `Goal reached! ${totalHours.toFixed(1)}h / ${goalHours}h`
                : `${totalHours.toFixed(1)}h / ${goalHours}h — ${remaining.toFixed(1)}h to go`}
            </p>
          </>
        )}
      </section>

      {/* Encouragement */}
      {encouragementText && (
        <section
          className={styles.heroCard}
          style={{ padding: 14, marginTop: 12 }}
          aria-label="Encouragement"
        >
          <p style={{ margin: 0, whiteSpace: "pre-line" }}>{encouragementText}</p>
        </section>
      )}

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
