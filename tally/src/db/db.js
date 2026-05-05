/**
 * db.js
 * Defines the local IndexedDB database using Dexie.js.
 *
 * Tables:
 *  - entries       : Daily field service log entries
 *  - contacts      : Known bible study contact names (for autocomplete)
 *  - preferences   : Single-row user preferences (theme, dark mode, name)
 *  - syncQueue     : Entries waiting to be synced to AWS when online
 */

import Dexie from "dexie";

const db = new Dexie("TallyDB");

/**
 * Schema version 1.
 *
 * Dexie schema syntax:
 *   ++id       = auto-increment primary key
 *   &field     = unique index
 *   field      = regular index
 *   [a+b]      = compound index
 *
 * Only indexed fields need to be listed — other fields are stored freely.
 */
db.version(1).stores({
  /**
   * entries — one row per field service day
   * Fields stored (not all indexed):
   *   id         : string — UUID generated client-side
   *   date       : string — ISO date "YYYY-MM-DD", used as unique key per user
   *   hours      : number — total hours for the day
   *   bibleStudies: string[] — array of contact names studied with that day
   *   notes      : string — optional free-text note
   *   monthKey   : string — "YYYY-MM", used to quickly fetch all entries for a month
   *   synced     : boolean — false until successfully pushed to AWS
   *   updatedAt  : number — epoch ms, used for conflict resolution during sync
   */
  entries: "&id, date, monthKey, synced",

  /**
   * contacts — known bible study names for autocomplete
   * Fields:
   *   name       : string — unique name (primary key)
   */
  contacts: "&name",

  /**
   * preferences — single row, always id = "user"
   * Fields:
   *   id         : "user" (constant)
   *   name       : string — user's display name
   *   theme      : keyof THEMES — active color theme
   *   dark       : boolean — dark mode on/off
   *   awsUserId  : string|null — Cognito sub, set after login
   */
  preferences: "&id",

  /**
   * syncQueue — entries that need to be pushed to AWS
   * Fields:
   *   entryId    : string — references entries.id
   *   action     : "upsert" | "delete"
   *   queuedAt   : number — epoch ms
   */
  syncQueue: "++id, entryId, queuedAt",
});

export default db;

/* ─── PREFERENCE HELPERS ────────────────────────────────────────────────────── */

/**
 * Load user preferences from IndexedDB.
 * Returns defaults if no preferences have been saved yet.
 *
 * @returns {Promise<{name:string, theme:string, dark:boolean, awsUserId:string|null}>}
 */
export async function loadPreferences() {
  const prefs = await db.preferences.get("user");
  return prefs ?? { id: "user", name: "", theme: "sunrise", dark: false, awsUserId: null };
}

/**
 * Save (merge) a partial preferences object.
 * Only the fields you pass in are updated — others are preserved.
 *
 * @param {Partial<{name, theme, dark, awsUserId}>} updates
 */
export async function savePreferences(updates) {
  const existing = await loadPreferences();
  await db.preferences.put({ ...existing, ...updates, id: "user" });
}

/* ─── ENTRY HELPERS ─────────────────────────────────────────────────────────── */

/**
 * Upsert a single entry into IndexedDB and add it to the sync queue.
 *
 * @param {object} entry — must include all fields listed in the schema comment above
 */
export async function saveEntry(entry) {
  const now = Date.now();
  const record = { ...entry, synced: false, updatedAt: now };

  // Use a transaction so both writes succeed or both fail
  await db.transaction("rw", db.entries, db.syncQueue, async () => {
    await db.entries.put(record);
    await db.syncQueue.put({ entryId: entry.id, action: "upsert", queuedAt: now });
  });
}

/**
 * Soft-delete an entry from IndexedDB and queue the deletion for AWS sync.
 *
 * @param {string} id — entry UUID
 */
export async function deleteEntry(id) {
  await db.transaction("rw", db.entries, db.syncQueue, async () => {
    await db.entries.delete(id);
    await db.syncQueue.put({ entryId: id, action: "delete", queuedAt: Date.now() });
  });
}

/**
 * Fetch all entries for a given month, sorted newest-first.
 *
 * @param {string} monthKey — format "YYYY-MM"
 * @returns {Promise<object[]>}
 */
export async function getEntriesForMonth(monthKey) {
  return db.entries
    .where("monthKey")
    .equals(monthKey)
    .sortBy("date")
    .then((rows) => rows.reverse()); // newest first
}

/* ─── CONTACT HELPERS ───────────────────────────────────────────────────────── */

/**
 * Add new contact names (from a bible study entry) if they don't already exist.
 *
 * @param {string[]} names
 */
export async function addContacts(names) {
  const records = names.map((name) => ({ name: name.trim() }));
  // bulkPut with ignoreErrors skips duplicates silently
  await db.contacts.bulkPut(records).catch(Dexie.BulkError, () => {});
}

/**
 * Search contacts by partial name match (case-insensitive).
 *
 * @param {string} query
 * @returns {Promise<string[]>} — array of matching names
 */
export async function searchContacts(query) {
  const lower = query.toLowerCase();
  const all   = await db.contacts.toArray();
  return all
    .map((c) => c.name)
    .filter((name) => name.toLowerCase().includes(lower))
    .sort();
}
