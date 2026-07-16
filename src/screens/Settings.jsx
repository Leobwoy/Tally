/**
 * Settings.jsx — profile, pioneer status, appearance, reminders, account.
 */

import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { PrefsContext } from "@/App";
import ThemePicker from "@/components/ThemePicker";
import {
  getStatusForMonth,
  setStatusForMonth,
  setDefaultStatus as saveDefaultPioneerStatus,
  clearAllUserData,
} from "@/firebase/firestore";
import { logOut } from "@/firebase/auth";
import { currentMonthKey, formatMonthLabel } from "@/utils/dateHelpers";
import { requestNotificationPermission, scheduleReminder, cancelReminder } from "@/utils/reminderEngine";
import { CURRENT_VERSION, CHANGELOG } from "@/utils/changelog";
import styles from "./Settings.module.css";

export default function Settings() {
  const { prefs, updatePrefs } = useContext(PrefsContext);

  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(prefs.name);

  const [defaultStatus, setDefaultStatusUI] = useState(prefs.defaultStatus ?? "publisher");
  const [defaultGoalHours, setDefaultGoalHoursUI] = useState(prefs.defaultGoalHours ?? 0);

  const [thisMonthStatus, setThisMonthStatus] = useState(null);
  const [showMonthOverride, setShowMonthOverride] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState("publisher");
  const [overrideGoalHours, setOverrideGoalHours] = useState(0);
  const [alsoSetDefault, setAlsoSetDefault] = useState(false);

  const [remindersEnabled, setRemindersEnabled] = useState(!!prefs.remindersEnabled);
  const [reminderHour, setReminderHour] = useState(prefs.reminderHour ?? 18);
  const [reminderError, setReminderError] = useState("");
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showPioneerNew, setShowPioneerNew] = useState(
    () => !localStorage.getItem("tally_pioneer_new_seen")
  );

  const defaultSaveSkip = useRef(true);

  const monthKey = useMemo(() => currentMonthKey(), []);
  const monthLabel = useMemo(() => formatMonthLabel(monthKey), [monthKey]);

  useEffect(() => {
    if (showPioneerNew) localStorage.setItem("tally_pioneer_new_seen", "1");
  }, [showPioneerNew]);

  useEffect(() => {
    setDefaultStatusUI(prefs.defaultStatus ?? "publisher");
    setDefaultGoalHoursUI(prefs.defaultGoalHours ?? 0);
    setRemindersEnabled(!!prefs.remindersEnabled);
    setReminderHour(prefs.reminderHour ?? 18);
    setNameVal(prefs.name);
  }, [prefs.defaultStatus, prefs.defaultGoalHours, prefs.remindersEnabled, prefs.reminderHour, prefs.name]);

  useEffect(() => {
    getStatusForMonth(monthKey).then((s) => {
      setThisMonthStatus(s);
      setOverrideStatus(s.status);
      setOverrideGoalHours(s.goalHours);
    });
  }, [monthKey]);

  useEffect(() => {
    if (defaultSaveSkip.current) {
      defaultSaveSkip.current = false;
      return;
    }
    if (defaultStatus === "publisher") {
      saveDefaultPioneerStatus("publisher", 0);
      updatePrefs({ defaultStatus: "publisher", defaultGoalHours: 0 });
      return;
    }
    saveDefaultPioneerStatus(defaultStatus, defaultGoalHours);
    updatePrefs({ defaultStatus, defaultGoalHours });
  }, [defaultStatus, defaultGoalHours]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveName() {
    const trimmed = nameVal.trim();
    if (trimmed) await updatePrefs({ name: trimmed });
    setEditingName(false);
  }

  async function handleClearData() {
    const confirmed = window.confirm(
      "This will permanently delete ALL your entries and contacts from your account. This cannot be undone. Are you sure?"
    );
    if (!confirmed) return;
    await clearAllUserData();
  }

  async function handleLogout() {
    cancelReminder();
    await logOut();
  }

  function StatusCard({ title, desc, subtext, selected, onClick }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={styles.card}
        style={{
          textAlign: "left",
          width: "100%",
          marginBottom: 10,
          border: selected ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
          boxShadow: selected ? "0 0 0 2px color-mix(in srgb, var(--color-primary) 20%, transparent)" : "none",
        }}
        aria-pressed={selected}
      >
        <p className="label" style={{ marginBottom: 6 }}>{title}</p>
        <p style={{ margin: 0, opacity: 0.9 }}>{desc}</p>
        {subtext && (
          <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--color-subtext)" }}>{subtext}</p>
        )}
      </button>
    );
  }

  function statusBadge(status) {
    const base = {
      display: "inline-block",
      padding: "4px 10px",
      borderRadius: 999,
      fontSize: 12,
      border: "1px solid var(--color-border)",
      background: "var(--color-bg)",
    };
    if (status === "regular") return { ...base, background: "rgba(46, 204, 113, 0.18)", borderColor: "rgba(46, 204, 113, 0.35)" };
    if (status === "auxiliary") return { ...base, background: "rgba(52, 152, 219, 0.18)", borderColor: "rgba(52, 152, 219, 0.35)" };
    return { ...base, background: "rgba(160, 160, 160, 0.12)", borderColor: "rgba(160, 160, 160, 0.25)" };
  }

  const reminderHourOptions = useMemo(
    () => Array.from({ length: 16 }, (_, i) => i + 6),
    []
  );

  return (
    <main className={`page ${styles.page}`}>
      {showVersionHistory ? (
        <>
          <button type="button" className={styles.backBtn} onClick={() => setShowVersionHistory(false)}>
            ← Back
          </button>
          <h1 className={styles.historyTitle}>Version History</h1>
          {CHANGELOG.map((entry, i) => (
            <div key={entry.version}>
              <div className={styles.aboutRow}>
                <span style={{ fontSize: 13, fontWeight: "bold", color: "var(--color-primary)" }}>
                  v{entry.version}
                </span>
                <span style={{ fontSize: 11, color: "var(--color-subtext)" }}>{entry.date}</span>
              </div>
              <p style={{ fontSize: 15, fontWeight: "bold", color: "var(--color-text)", marginBottom: 8 }}>
                {entry.title}
              </p>
              {entry.features.map((feature) => (
                <p key={feature} style={{ fontSize: 12, color: "var(--color-subtext)", padding: "3px 0", lineHeight: 1.5 }}>
                  · {feature}
                </p>
              ))}
              {i < CHANGELOG.length - 1 && <div className={styles.divider} style={{ margin: "16px 0" }} />}
            </div>
          ))}
        </>
      ) : (
        <>
          <h1 className={styles.title}>Settings</h1>

          <p className="label" style={{ marginBottom: 10 }}>PROFILE</p>
          <div className={styles.card} style={{ marginBottom: 22 }}>
            {editingName ? (
              <div className={styles.nameEdit}>
                <input
                  value={nameVal}
                  onChange={(e) => setNameVal(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveName()}
                  className={styles.nameInput}
                  autoFocus
                />
                <button className={styles.saveNameBtn} onClick={saveName}>✓</button>
              </div>
            ) : (
              <div className={styles.nameRow}>
                <div>
                  <p className="label">NAME</p>
                  <p className={styles.nameValue}>{prefs.name}</p>
                  {prefs.email && (
                    <p style={{ fontSize: 12, color: "var(--color-subtext)", marginTop: 4 }}>{prefs.email}</p>
                  )}
                </div>
                <button className={styles.editBtn} onClick={() => { setNameVal(prefs.name); setEditingName(true); }}>
                  Edit
                </button>
              </div>
            )}
          </div>

          <p className="label" style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
            PIONEER STATUS
            {showPioneerNew && (
              <span style={{
                fontSize: 10,
                fontWeight: "bold",
                padding: "2px 8px",
                borderRadius: 999,
                background: "var(--color-soft)",
                color: "var(--color-accent)",
              }}>
                New
              </span>
            )}
          </p>
          <div className={styles.card} style={{ marginBottom: 22 }}>
            <p className={styles.subLabel} style={{ marginBottom: 10 }}>Default Status</p>

            <StatusCard
              title="Publisher"
              desc="No hour reporting required"
              selected={defaultStatus === "publisher"}
              onClick={() => { setDefaultStatusUI("publisher"); setDefaultGoalHoursUI(0); }}
            />
            <StatusCard
              title="Auxiliary Pioneer"
              desc="Report 15–30 hours per month"
              subtext="For those reporting 15–30 hours some months"
              selected={defaultStatus === "auxiliary"}
              onClick={() => {
                setDefaultStatusUI("auxiliary");
                setDefaultGoalHoursUI(Math.min(30, Math.max(15, defaultGoalHours || 15)));
              }}
            />
            {defaultStatus === "auxiliary" && (
              <div style={{ marginBottom: 10 }}>
                <p className="label" style={{ marginBottom: 8 }}>Monthly goal: {defaultGoalHours} hours</p>
                <input
                  type="range"
                  min={15}
                  max={30}
                  step={1}
                  value={defaultGoalHours}
                  onChange={(e) => setDefaultGoalHoursUI(Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>
            )}
            <StatusCard
              title="Regular Pioneer"
              desc="Report 50 hours per month"
              subtext="For those reporting 50 hours every month"
              selected={defaultStatus === "regular"}
              onClick={() => { setDefaultStatusUI("regular"); setDefaultGoalHoursUI(50); }}
            />

            <div className={styles.divider} />

            <p className={styles.subLabel} style={{ marginBottom: 10 }}>This Month Override</p>
            <p className="label" style={{ marginBottom: 6 }}>MONTH: {monthLabel}</p>
            <p style={{ marginTop: 0, marginBottom: 10, opacity: 0.9 }}>
              Your status this month{" "}
              {thisMonthStatus?.status && (
                <span style={statusBadge(thisMonthStatus.status)}>
                  {thisMonthStatus.status === "regular"
                    ? "Regular Pioneer"
                    : thisMonthStatus.status === "auxiliary"
                      ? "Auxiliary Pioneer"
                      : "Publisher"}
                </span>
              )}
            </p>

            {!showMonthOverride ? (
              <button
                className={styles.editBtn}
                onClick={() => { setAlsoSetDefault(false); setShowMonthOverride(true); }}
                style={{ width: "100%" }}
              >
                Change this month&apos;s status
              </button>
            ) : (
              <div>
                <StatusCard title="Publisher" desc="No hour reporting required" selected={overrideStatus === "publisher"} onClick={() => { setOverrideStatus("publisher"); setOverrideGoalHours(0); }} />
                <StatusCard title="Auxiliary Pioneer" desc="Report 15–30 hours per month" selected={overrideStatus === "auxiliary"} onClick={() => { setOverrideStatus("auxiliary"); setOverrideGoalHours(Math.min(30, Math.max(15, overrideGoalHours || 15))); }} />
                {overrideStatus === "auxiliary" && (
                  <div style={{ marginBottom: 10 }}>
                    <p className="label" style={{ marginBottom: 8 }}>Monthly goal: {overrideGoalHours} hours</p>
                    <input type="range" min={15} max={30} step={1} value={overrideGoalHours} onChange={(e) => setOverrideGoalHours(Number(e.target.value))} style={{ width: "100%" }} />
                  </div>
                )}
                <StatusCard title="Regular Pioneer" desc="Report 50 hours per month" selected={overrideStatus === "regular"} onClick={() => { setOverrideStatus("regular"); setOverrideGoalHours(50); }} />

                <label style={{ display: "flex", alignItems: "center", gap: 10, margin: "10px 0 12px" }}>
                  <input type="checkbox" checked={alsoSetDefault} onChange={(e) => setAlsoSetDefault(e.target.checked)} />
                  <span style={{ opacity: 0.9 }}>Also set as my default status</span>
                </label>

                <button
                  className={styles.saveNameBtn}
                  style={{ width: "100%" }}
                  onClick={async () => {
                    await setStatusForMonth(monthKey, overrideStatus, overrideGoalHours);
                    if (alsoSetDefault) {
                      setDefaultStatusUI(overrideStatus);
                      setDefaultGoalHoursUI(overrideStatus === "publisher" ? 0 : overrideGoalHours);
                      await saveDefaultPioneerStatus(overrideStatus, overrideStatus === "publisher" ? 0 : overrideGoalHours);
                      await updatePrefs({ defaultStatus: overrideStatus, defaultGoalHours: overrideStatus === "publisher" ? 0 : overrideGoalHours });
                    }
                    setThisMonthStatus(await getStatusForMonth(monthKey));
                    setShowMonthOverride(false);
                  }}
                >
                  Save for {monthLabel}
                </button>
              </div>
            )}
          </div>

          <p className="label" style={{ marginBottom: 10 }}>APPEARANCE</p>
          <div className={styles.card} style={{ marginBottom: 22 }}>
            <div className={styles.toggleRow}>
              <span className={styles.toggleLabel}>🌙 Dark Mode</span>
              <button
                className={styles.toggle}
                style={{ background: prefs.dark ? "var(--color-primary)" : "var(--color-border)" }}
                onClick={() => updatePrefs({ dark: !prefs.dark })}
                role="switch"
                aria-checked={prefs.dark}
              >
                <div className={styles.toggleThumb} style={{ left: prefs.dark ? 25 : 3 }} />
              </button>
            </div>
            <div className={styles.divider} />
            <p className={styles.subLabel}>🎨 Color Theme</p>
            <ThemePicker selected={prefs.theme} onChange={(theme) => updatePrefs({ theme })} />
          </div>

          <p className="label" style={{ marginBottom: 10 }}>REMINDERS</p>
          <div className={styles.card} style={{ marginBottom: 22 }}>
            <div className={styles.toggleRow}>
              <span className={styles.toggleLabel}>🔔 Daily reminder</span>
              <button
                className={styles.toggle}
                style={{ background: remindersEnabled ? "var(--color-primary)" : "var(--color-border)" }}
                onClick={async () => {
                  setReminderError("");
                  if (remindersEnabled) {
                    setRemindersEnabled(false);
                    await updatePrefs({ remindersEnabled: false });
                    cancelReminder();
                    return;
                  }
                  const ok = await requestNotificationPermission();
                  if (!ok) {
                    setReminderError("Please allow notifications in your browser settings.");
                    return;
                  }
                  scheduleReminder(reminderHour);
                  setRemindersEnabled(true);
                  await updatePrefs({ remindersEnabled: true, reminderHour });
                }}
                role="switch"
                aria-checked={remindersEnabled}
              >
                <div className={styles.toggleThumb} style={{ left: remindersEnabled ? 25 : 3 }} />
              </button>
            </div>
            {reminderError && <p className={styles.error} style={{ marginTop: 10 }}>{reminderError}</p>}
            {remindersEnabled && (
              <>
                <div className={styles.divider} />
                <p className={styles.subLabel} style={{ marginBottom: 10 }}>Reminder time</p>
                <select
                  value={reminderHour}
                  onChange={async (e) => {
                    const hour = Number(e.target.value);
                    setReminderHour(hour);
                    scheduleReminder(hour);
                    await updatePrefs({ reminderHour: hour });
                  }}
                  className={styles.nameInput}
                >
                  {reminderHourOptions.map((h) => (
                    <option key={h} value={h}>
                      {new Date(2000, 0, 1, h, 0, 0).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>

          <p className="label" style={{ marginBottom: 10 }}>DATA & PRIVACY</p>
          <div className={styles.card} style={{ marginBottom: 22 }}>
            <div className={styles.dataRow}>
              <span className={styles.dataIcon}>☁️</span>
              <div>
                <p className={styles.dataTitle}>Cloud Sync</p>
                <p className={styles.dataDesc}>Your data syncs to Firebase when online.</p>
              </div>
              <span className={styles.statusBadge}>Active</span>
            </div>
            <div className={styles.divider} />
            <button className={styles.dangerBtn} onClick={handleClearData}>🗑 Clear All Data</button>
            <div className={styles.divider} />
            <button className={styles.editBtn} style={{ width: "100%" }} onClick={handleLogout}>
              Log out
            </button>
          </div>

          <p className="label" style={{ marginBottom: 10 }}>ABOUT</p>
          <div className={styles.card} style={{ marginBottom: 22 }}>
            <div className={styles.aboutRow}>
              <span style={{ fontSize: 13, color: "var(--color-text)" }}>Current version</span>
              <span style={{ fontSize: 13, color: "var(--color-primary)", fontWeight: "bold" }}>{CURRENT_VERSION}</span>
            </div>
            <div className={styles.divider} />
            <div
              className={styles.aboutRowClickable}
              onClick={() => setShowVersionHistory(true)}
              onKeyDown={(e) => e.key === "Enter" && setShowVersionHistory(true)}
              role="button"
              tabIndex={0}
            >
              <span style={{ fontSize: 13, color: "var(--color-text)" }}>Version history</span>
              <span style={{ fontSize: 18, color: "var(--color-subtext)" }}>›</span>
            </div>
          </div>

          <p className={styles.version}>
            ✦ TALLY v{CURRENT_VERSION} · Field Service Tracker{"\n"}
            <span>Made with Love, By Leo.</span>
          </p>
        </>
      )}
    </main>
  );
}
