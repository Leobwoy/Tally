/**
 * dateHelpers.js
 * Pure utility functions for all date operations in Tally.
 * Uses date-fns for reliable, locale-aware formatting.
 */

import {
  format,
  parseISO,
  getYear,
  getMonth,
  addMonths,
  subMonths,
  getDaysInMonth,
  startOfMonth,
} from "date-fns";

/* ─── ISO DATE STRINGS ──────────────────────────────────────────────────────── */

/**
 * Today's date as an ISO string "YYYY-MM-DD".
 * @returns {string}
 */
export function todayISO() {
  return format(new Date(), "yyyy-MM-dd");
}

/**
 * Build an ISO date string from year, month (0-indexed), and day.
 * @param {number} year
 * @param {number} month — 0-indexed (0 = January)
 * @param {number} day
 * @returns {string}
 */
export function toISO(year, month, day) {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

/* ─── MONTH KEYS ────────────────────────────────────────────────────────────── */

/**
 * Get the monthKey "YYYY-MM" for a given year and month (0-indexed).
 * Used as the IndexedDB index for grouping entries by month.
 * @param {number} year
 * @param {number} month — 0-indexed
 * @returns {string}
 */
export function toMonthKey(year, month) {
  const m = String(month + 1).padStart(2, "0");
  return `${year}-${m}`;
}

/**
 * Get the monthKey for today.
 * @returns {string}
 */
export function currentMonthKey() {
  return format(new Date(), "yyyy-MM");
}

/**
 * Extract year and month (0-indexed) from a monthKey string.
 * @param {string} monthKey — "YYYY-MM"
 * @returns {{ year: number, month: number }}
 */
export function parseMonthKey(monthKey) {
  const [y, m] = monthKey.split("-").map(Number);
  return { year: y, month: m - 1 };
}

/* ─── NAVIGATION ────────────────────────────────────────────────────────────── */

/**
 * Move one month forward, returning a new monthKey.
 * @param {string} monthKey
 * @returns {string}
 */
export function nextMonthKey(monthKey) {
  const { year, month } = parseMonthKey(monthKey);
  const next = addMonths(new Date(year, month, 1), 1);
  return format(next, "yyyy-MM");
}

/**
 * Move one month backward, returning a new monthKey.
 * @param {string} monthKey
 * @returns {string}
 */
export function prevMonthKey(monthKey) {
  const { year, month } = parseMonthKey(monthKey);
  const prev = subMonths(new Date(year, month, 1), 1);
  return format(prev, "yyyy-MM");
}

/**
 * Check if a monthKey represents the current calendar month.
 * Used to disable the "next month" button on the home screen.
 * @param {string} monthKey
 * @returns {boolean}
 */
export function isCurrentMonth(monthKey) {
  return monthKey === currentMonthKey();
}

/* ─── DISPLAY FORMATTING ────────────────────────────────────────────────────── */

/**
 * Format an ISO date string for display in entry cards.
 * e.g. "2026-05-02" → "May 2, Sat"
 * @param {string} iso
 * @returns {string}
 */
export function formatEntryDate(iso) {
  return format(parseISO(iso), "MMM d, EEE");
}

/**
 * Format an ISO date string for the report table.
 * e.g. "2026-05-02" → "2 May 2026"
 * @param {string} iso
 * @returns {string}
 */
export function formatReportDate(iso) {
  return format(parseISO(iso), "d MMM yyyy");
}

/**
 * Format a monthKey for display as a heading.
 * e.g. "2026-05" → "May 2026"
 * @param {string} monthKey
 * @returns {string}
 */
export function formatMonthLabel(monthKey) {
  const { year, month } = parseMonthKey(monthKey);
  return format(new Date(year, month, 1), "MMMM yyyy");
}

/**
 * Get a time-of-day greeting based on the current hour.
 * @returns {"Good morning"|"Good afternoon"|"Good evening"}
 */
export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Calculate what percentage of the current month has elapsed.
 * Useful for the subtle month progress bar on the Home screen.
 * @returns {number} — 0 to 100
 */
export function monthProgressPercent() {
  const now   = new Date();
  const day   = now.getDate();
  const total = getDaysInMonth(startOfMonth(now));
  return Math.round((day / total) * 100);
}

/**
 * Human-friendly duration from decimal hours.
 * < 1h → "X min"; clean fractions → "Xh Ymin"; else → "X.Xh"
 * @param {number} hours
 * @returns {string}
 */
export function formatDuration(hours) {
  const h = Number(hours) || 0;
  if (h <= 0) return "0 min";
  if (h < 1) {
    const mins = Math.round(h * 60);
    return `${mins} min`;
  }
  const whole = Math.floor(h);
  const mins = Math.round((h - whole) * 60);
  if (mins === 0) return `${whole}h`;
  if (mins === 60) return `${whole + 1}h`;
  if (mins % 5 === 0 || Math.abs(h * 60 - Math.round(h * 60)) < 0.01) {
    return `${whole}h ${mins}min`;
  }
  const rounded = Math.round(h * 10) / 10;
  return `${rounded}h`;
}
