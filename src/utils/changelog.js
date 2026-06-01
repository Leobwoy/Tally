/**
 * changelog.js
 * Master list of all Tally app versions and their features.
 *
 * HOW TO ADD A NEW VERSION:
 *   1. Add a new entry object at the TOP of the CHANGELOG array
 *   2. Update CURRENT_VERSION to match
 * Never edit or remove old entries.
 */

export const CURRENT_VERSION = "1.1.0";

export const CHANGELOG = [
  {
    version: "1.1.0",
    title: "Pioneer Status and Goals",
    date: "June 2026",
    features: [
      "Set your publisher status — Publisher, Auxiliary Pioneer, or Regular Pioneer",
      "Monthly hour goals with progress tracking for pioneers",
      "Per-month status override — change your status for specific months",
      "Smart encouragement messages based on your bible studies and hours",
      "Daily reminder notifications so you never forget to log",
      "Reports and exports now adapt automatically to your status",
      "Publishers no longer see hours — only bible studies",
    ],
  },
  {
    version: "1.0.0",
    title: "Welcome to Tally",
    date: "May 2026",
    features: [
      "Log your field service hours and bible studies every day",
      "Track bible study contacts with name autocomplete",
      "Monthly reports exportable as PDF and Excel",
      "4 color themes — Sunrise, Calm Sky, Forest, Lavender",
      "Dark mode support",
      "Works fully offline — no internet required",
      "Installable from the browser as a PWA",
    ],
  },
];
