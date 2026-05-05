/**
 * Settings.jsx
 * User preferences screen — name, theme, dark mode, data management.
 */

import React, { useContext, useState } from "react";
import { PrefsContext } from "@/App";
import ThemePicker from "@/components/ThemePicker";
import db from "@/db/db";
import styles from "./Settings.module.css";

export default function Settings() {
  const { prefs, updatePrefs } = useContext(PrefsContext);

  const [editingName, setEditingName] = useState(false);
  const [nameVal,     setNameVal]     = useState(prefs.name);

  async function saveName() {
    const trimmed = nameVal.trim();
    if (trimmed) await updatePrefs({ name: trimmed });
    setEditingName(false);
  }

  async function handleClearData() {
    const confirmed = window.confirm(
      "This will permanently delete ALL your entries and contacts. This cannot be undone. Are you sure?"
    );
    if (!confirmed) return;

    await db.transaction("rw", db.entries, db.contacts, db.syncQueue, async () => {
      await db.entries.clear();
      await db.contacts.clear();
      await db.syncQueue.clear();
    });
  }

  return (
    <main className={`page ${styles.page}`}>
      <h1 className={styles.title}>Settings</h1>

      {/* ── PROFILE ── */}
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
            </div>
            <button
              className={styles.editBtn}
              onClick={() => { setNameVal(prefs.name); setEditingName(true); }}
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {/* ── APPEARANCE ── */}
      <p className="label" style={{ marginBottom: 10 }}>APPEARANCE</p>
      <div className={styles.card} style={{ marginBottom: 22 }}>
        {/* Dark mode toggle */}
        <div className={styles.toggleRow}>
          <span className={styles.toggleLabel}>🌙 Dark Mode</span>
          <button
            className={styles.toggle}
            style={{ background: prefs.dark ? "var(--color-primary)" : "var(--color-border)" }}
            onClick={() => updatePrefs({ dark: !prefs.dark })}
            role="switch"
            aria-checked={prefs.dark}
            aria-label="Toggle dark mode"
          >
            <div
              className={styles.toggleThumb}
              style={{ left: prefs.dark ? 25 : 3 }}
            />
          </button>
        </div>

        <div className={styles.divider} />

        {/* Theme picker */}
        <p className={styles.subLabel}>🎨 Color Theme</p>
        <ThemePicker
          selected={prefs.theme}
          onChange={(theme) => updatePrefs({ theme })}
        />
      </div>

      {/* ── DATA & PRIVACY ── */}
      <p className="label" style={{ marginBottom: 10 }}>DATA & PRIVACY</p>
      <div className={styles.card} style={{ marginBottom: 22 }}>
        <div className={styles.dataRow}>
          <span className={styles.dataIcon}>☁️</span>
          <div>
            <p className={styles.dataTitle}>Cloud Backup</p>
            <p className={styles.dataDesc}>
              Entries sync to your private AWS account when online.
            </p>
          </div>
          <span className={styles.statusBadge}>Active</span>
        </div>   

        <div className={styles.divider} />

        <div className={styles.dataRow}>
          <span className={styles.dataIcon}>🔒</span>  
          <div>
            <p className={styles.dataTitle}>Your Data</p>
            <p className={styles.dataDesc}>
              Stored locally first, then synced. Nobody else has access.
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        <button className={styles.dangerBtn} onClick={handleClearData}>
          🗑 Clear All Data
        </button>
      </div>

      {/* Version footer */}
      <p className={styles.version}>
        ✦ TALLY v1.0 · Field Service Tracker{"\n"}
        <span>Offline-first · AWS-backed · PWA</span>
      </p>
    </main>
  );
}
