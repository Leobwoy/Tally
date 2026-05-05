/**
 * BottomNav.jsx
 * Persistent bottom navigation bar shown on all screens except Onboarding.
 * Highlights the active route and navigates on tap.
 */

import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./BottomNav.module.css";

const NAV_ITEMS = [
  { path: "/home",     icon: "🏠", label: "Home"    },
  { path: "/log",      icon: "✏️", label: "Log"     },
  { path: "/monthly",  icon: "📊", label: "Report"  },
  { path: "/settings", icon: "⚙️", label: "Settings"},
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className={styles.nav} aria-label="Main navigation">
      {NAV_ITEMS.map(({ path, icon, label }) => {
        /* Consider /log and /log/:id both as "log" active state */
        const isActive = location.pathname.startsWith(path);

        return (
          <button
            key={path}
            className={`${styles.item} ${isActive ? styles.active : ""}`}
            onClick={() => navigate(path)}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
          >
            <span className={styles.icon}>{icon}</span>
            <span className={styles.label}>{label}</span>
            {isActive && <span className={styles.dot} aria-hidden="true" />}
          </button>
        );
      })}
    </nav>
  );
}
