/**
 * BottomNav.jsx — 5-item nav including Contacts.
 */

import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./BottomNav.module.css";

const NAV_ITEMS = [
  { path: "/home", icon: "🏠", label: "Home" },
  { path: "/log", icon: "✏️", label: "Log" },
  { path: "/contacts", icon: "👥", label: "Contacts" },
  { path: "/monthly", icon: "📊", label: "Report" },
  { path: "/settings", icon: "⚙️", label: "Settings" },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className={styles.nav} aria-label="Main navigation">
      {NAV_ITEMS.map(({ path, icon, label }) => {
        const isActive =
          path === "/log"
            ? location.pathname.startsWith("/log")
            : path === "/contacts"
              ? location.pathname.startsWith("/contacts")
              : location.pathname.startsWith(path);

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
