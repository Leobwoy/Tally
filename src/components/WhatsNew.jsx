/**
 * WhatsNew.jsx
 * Modal shown when the user updates to a new app version.
 */

import React from "react";
import { CHANGELOG } from "@/utils/changelog";
import styles from "./WhatsNew.module.css";

export default function WhatsNew({ version, onDismiss }) {
  const entry = CHANGELOG.find((c) => c.version === version);
  if (!entry) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="whats-new-title">
      <div className={styles.modal}>
        <p className="label">WHAT&apos;S NEW</p>

        <span className={styles.versionBadge}>
          v{entry.version} · {entry.date}
        </span>

        <h2 id="whats-new-title" className={styles.title}>{entry.title}</h2>

        <div className={styles.divider} />

        <p className="label" style={{ marginBottom: 10 }}>IN THIS UPDATE</p>

        {entry.features.map((feature) => (
          <div key={feature} className={styles.featureRow}>
            <span className={styles.dot} aria-hidden="true" />
            <span className={styles.featureText}>{feature}</span>
          </div>
        ))}

        <div className={styles.divider} />

        <p className={styles.hint}>
          Find all previous updates in Settings → About
        </p>

        <button type="button" className={styles.gotItBtn} onClick={onDismiss}>
          Got it, thanks!
        </button>
      </div>
    </div>
  );
}
