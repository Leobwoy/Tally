/**
 * ThemePicker.jsx
 * Reusable grid of theme cards. Used in both Onboarding and Settings.
 *
 * Props:
 *   selected  {string}   — currently active theme ID
 *   onChange  {function} — called with the new theme ID when user taps a card
 */

import React from "react";
import { THEMES } from "@/themes/themes";
import styles from "./ThemePicker.module.css";

export default function ThemePicker({ selected, onChange }) {
  return (
    <div className={styles.grid}>
      {Object.entries(THEMES).map(([id, theme]) => (
        <button
          key={id}
          className={`${styles.card} ${selected === id ? styles.selected : ""}`}
          style={{
            background:   theme.card,
            borderColor:  selected === id ? theme.primary : theme.border,
          }}
          onClick={() => onChange(id)}
          aria-label={`${theme.name} theme`}
          aria-pressed={selected === id}
        >
          {/* Color swatch */}
          <div
            className={styles.swatch}
            style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }}
          />

          <div className={styles.info}>
            <span className={styles.name} style={{ color: theme.text }}>
              {theme.emoji} {theme.name}
            </span>

            {/* Mini palette preview */}
            <div className={styles.palette}>
              {[theme.primary, theme.soft, theme.card].map((col, i) => (
                <div
                  key={i}
                  className={styles.dot}
                  style={{ background: col, border: `1px solid ${theme.border}` }}
                />
              ))}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
