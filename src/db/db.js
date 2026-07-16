/**
 * db.js
 * Device-only IndexedDB via Dexie.
 *
 * v1.2: preferences (theme/dark) stay local for instant load.
 * Legacy stores (entries, contacts, pioneerStatus, syncQueue) remain in the
 * schema so migrateLocalDataToFirestore() can still read old v1.0/v1.1 data,
 * then clear them. New app code must use Firestore — not these tables.
 */

import Dexie from "dexie";

const db = new Dexie("TallyDB");

const STORE_SCHEMA = {
  entries: "&id, date, monthKey, synced",
  contacts: "&name",
  preferences: "&id",
  syncQueue: "++id, entryId, queuedAt",
};

db.version(1).stores(STORE_SCHEMA);

db.version(2).stores({
  ...STORE_SCHEMA,
  pioneerStatus: "&monthKey, status, goalHours",
});

export default db;

/**
 * Load device UI preferences (theme + dark). Instant — no auth required.
 */
export async function loadPreferences() {
  try {
    if (!db.isOpen()) await db.open();
    const prefs = await db.preferences.get("user");
    return prefs ?? { id: "user", theme: "sunrise", dark: false };
  } catch (err) {
    console.warn("[Tally] DB error, retrying after delete:", err.name);
    try {
      await db.delete();
      await db.open();
      return { id: "user", theme: "sunrise", dark: false };
    } catch {
      return { id: "user", theme: "sunrise", dark: false };
    }
  }
}

/**
 * Merge and save device UI preferences.
 * @param {Partial<{theme:string, dark:boolean}>} updates
 */
export async function savePreferences(updates) {
  const existing = await loadPreferences();
  await db.preferences.put({ ...existing, ...updates, id: "user" });
}
