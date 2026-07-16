/**
 * firebase/firestore.js
 * All Firestore CRUD for the currently signed-in user.
 * Offline writes are queued automatically by Firestore persistence.
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "./config";
import localDb from "@/db/db";

function requireUid() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("[Tally] Not signed in");
  return uid;
}

function userRef(uid = requireUid()) {
  return doc(db, "users", uid);
}

function entriesCol(uid = requireUid()) {
  return collection(db, "users", uid, "entries");
}

function contactsCol(uid = requireUid()) {
  return collection(db, "users", uid, "contacts");
}

function interactionsCol(uid = requireUid()) {
  return collection(db, "users", uid, "interactions");
}

function pioneerRef(monthKey, uid = requireUid()) {
  return doc(db, "users", uid, "pioneerStatus", monthKey);
}

/* ─── PROFILE ───────────────────────────────────────────────────────────────── */

export async function getUserProfile() {
  const snap = await getDoc(userRef());
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function updateUserProfile(updates) {
  await setDoc(userRef(), updates, { merge: true });
}

export function subscribeUserProfile(callback) {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    callback(null);
    return () => {};
  }
  return onSnapshot(userRef(uid), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

/* ─── ENTRIES ───────────────────────────────────────────────────────────────── */

export async function saveEntry(entry) {
  const uid = requireUid();
  const { id, ...rest } = entry;
  await setDoc(
    doc(db, "users", uid, "entries", String(id)),
    { ...rest, updatedAt: Date.now() },
    { merge: true }
  );
}

export async function deleteEntry(entryId) {
  const uid = requireUid();
  await deleteDoc(doc(db, "users", uid, "entries", entryId));
}

export async function getEntry(entryId) {
  const uid = requireUid();
  const snap = await getDoc(doc(db, "users", uid, "entries", entryId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/** True if the signed-in user has an entry for the given ISO date. */
export async function hasEntryForDate(dateKey) {
  const uid = requireUid();
  const q = query(entriesCol(uid), where("date", "==", dateKey), limit(1));
  const snap = await getDocs(q);
  return !snap.empty;
}

/**
 * Live subscription for a month's entries (newest first).
 * @returns {() => void} unsubscribe
 */
export function subscribeEntriesForMonth(monthKey, callback) {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    callback([]);
    return () => {};
  }
  const q = query(
    entriesCol(uid),
    where("monthKey", "==", monthKey)
  );
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      rows.sort((a, b) => b.date.localeCompare(a.date));
      callback(rows);
    },
    (err) => {
      console.warn("[Tally] entries subscription error:", err.message);
      callback([]);
    }
  );
}

/** All entries that have a non-empty notes field (for NotesJournal). */
export function subscribeEntriesWithNotes(callback) {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    callback([]);
    return () => {};
  }
  return onSnapshot(
    query(entriesCol(uid), orderBy("date", "desc")),
    (snap) => {
      const rows = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((e) => (e.notes ?? "").trim().length > 0);
      callback(rows);
    },
    (err) => {
      console.warn("[Tally] notes subscription error:", err.message);
      callback([]);
    }
  );
}

/* ─── CONTACTS ──────────────────────────────────────────────────────────────── */

/**
 * @param {string} name
 * @param {"first_contact"|"return_visit"|"bible_study"|"inactive"} stage
 * @param {string} [phone]
 */
export async function createContact(name, stage = "first_contact", phone = "") {
  const uid = requireUid();
  const now = Date.now();
  const ref = doc(contactsCol(uid));
  const data = {
    name: name.trim(),
    phone: (phone ?? "").trim(),
    stage,
    dateAdded: now,
    stageHistory: [{ stage, date: now }],
    updatedAt: now,
  };
  await setDoc(ref, data);
  return { id: ref.id, ...data };
}

export async function advanceContactStage(contactId, newStage) {
  const uid = requireUid();
  const ref = doc(db, "users", uid, "contacts", contactId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Contact not found");
  const data = snap.data();
  const history = [...(data.stageHistory ?? []), { stage: newStage, date: Date.now() }];
  await updateDoc(ref, {
    stage: newStage,
    stageHistory: history,
    updatedAt: Date.now(),
  });
}

export function subscribeContactsByStage(stage, callback) {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    callback([]);
    return () => {};
  }
  const q = query(
    contactsCol(uid),
    where("stage", "==", stage)
  );
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      rows.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      callback(rows);
    },
    (err) => {
      console.warn("[Tally] contacts subscription error:", err.message);
      callback([]);
    }
  );
}

export function subscribeAllContacts(callback) {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    callback([]);
    return () => {};
  }
  return onSnapshot(
    query(contactsCol(uid), orderBy("updatedAt", "desc")),
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    (err) => {
      console.warn("[Tally] all contacts error:", err.message);
      callback([]);
    }
  );
}

export async function getContact(contactId) {
  const uid = requireUid();
  const snap = await getDoc(doc(db, "users", uid, "contacts", contactId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/** Case-insensitive name search across all contacts. */
export async function searchContacts(queryText) {
  const uid = requireUid();
  const snap = await getDocs(contactsCol(uid));
  const lower = queryText.toLowerCase();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((c) => c.name?.toLowerCase().includes(lower) && c.stage !== "inactive")
    .sort((a, b) => a.name.localeCompare(b.name));
}

/* ─── INTERACTIONS ──────────────────────────────────────────────────────────── */

export async function addInteraction(contactId, topic = "", note = "", date = null) {
  const uid = requireUid();
  const now = Date.now();
  const data = {
    contactId,
    date: date ?? new Date().toISOString().slice(0, 10),
    topic: (topic ?? "").trim(),
    note: (note ?? "").trim(),
    createdAt: now,
  };
  const ref = await addDoc(interactionsCol(uid), data);
  // Bump contact updatedAt so lists sort correctly
  await updateDoc(doc(db, "users", uid, "contacts", contactId), { updatedAt: now }).catch(() => {});
  return { id: ref.id, ...data };
}

export function subscribeInteractionsForContact(contactId, callback) {
  const uid = auth.currentUser?.uid;
  if (!uid || !contactId) {
    callback([]);
    return () => {};
  }
  const q = query(
    interactionsCol(uid),
    where("contactId", "==", contactId),
    orderBy("date", "desc")
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    (err) => {
      console.warn("[Tally] interactions error:", err.message);
      callback([]);
    }
  );
}

export async function getLatestInteraction(contactId) {
  const uid = requireUid();
  const q = query(
    interactionsCol(uid),
    where("contactId", "==", contactId),
    orderBy("date", "desc")
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

/* ─── PIONEER STATUS ────────────────────────────────────────────────────────── */

export async function getStatusForMonth(monthKey) {
  const uid = requireUid();
  const snap = await getDoc(pioneerRef(monthKey, uid));
  if (snap.exists()) {
    return { monthKey, ...snap.data() };
  }
  const profile = await getUserProfile();
  return {
    monthKey,
    status: profile?.defaultStatus ?? "publisher",
    goalHours: profile?.defaultGoalHours ?? 0,
    isOverride: false,
  };
}

export async function setStatusForMonth(monthKey, status, goalHours) {
  await setDoc(pioneerRef(monthKey), {
    status,
    goalHours,
    isOverride: true,
  });
}

export async function setDefaultStatus(status, goalHours) {
  await updateUserProfile({ defaultStatus: status, defaultGoalHours: goalHours });
}

/* ─── CLEAR ALL USER DATA ───────────────────────────────────────────────────── */

export async function clearAllUserData() {
  const uid = requireUid();
  const batchDelete = async (colRef) => {
    const snap = await getDocs(colRef);
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    if (!snap.empty) await batch.commit();
  };
  await batchDelete(entriesCol(uid));
  await batchDelete(contactsCol(uid));
  await batchDelete(interactionsCol(uid));
  await batchDelete(collection(db, "users", uid, "pioneerStatus"));
}

/* ─── MIGRATION FROM LOCAL DEXIE ────────────────────────────────────────────── */

/**
 * One-time migration of v1.0/v1.1 Dexie data into Firestore.
 * Safe to call multiple times — no-ops if already migrated or no local data.
 */
export async function migrateLocalDataToFirestore() {
  const uid = requireUid();
  const profile = await getUserProfile();
  if (profile?.migratedFromLocal) return { migrated: false, reason: "already" };

  try {
    if (!localDb.isOpen()) await localDb.open();
  } catch {
    await updateUserProfile({ migratedFromLocal: true });
    return { migrated: false, reason: "no-local-db" };
  }

  let migratedCount = 0;

  // Entries
  if (localDb.entries) {
    try {
      const rows = await localDb.entries.toArray();
      for (const entry of rows) {
        await saveEntry({
          id: entry.id,
          date: entry.date,
          hours: entry.hours ?? 0,
          bibleStudies: entry.bibleStudies ?? [],
          notes: entry.notes ?? "",
          monthKey: entry.monthKey,
        });
        migratedCount += 1;
      }
    } catch (err) {
      console.warn("[Tally] entry migration skipped:", err.message);
    }
  }

  // Contacts (old shape: { name } only)
  if (localDb.contacts) {
    try {
      const rows = await localDb.contacts.toArray();
      for (const c of rows) {
        if (!c.name) continue;
        await createContact(c.name, "bible_study", "");
        migratedCount += 1;
      }
    } catch (err) {
      console.warn("[Tally] contact migration skipped:", err.message);
    }
  }

  // Pioneer status overrides
  if (localDb.pioneerStatus) {
    try {
      const rows = await localDb.pioneerStatus.toArray();
      for (const row of rows) {
        await setStatusForMonth(row.monthKey, row.status, row.goalHours ?? 0);
        migratedCount += 1;
      }
    } catch (err) {
      console.warn("[Tally] pioneer migration skipped:", err.message);
    }
  }

  // Clear legacy tables so migration never re-runs with stale data
  try {
    const tables = [];
    if (localDb.entries) tables.push(localDb.entries);
    if (localDb.contacts) tables.push(localDb.contacts);
    if (localDb.syncQueue) tables.push(localDb.syncQueue);
    if (localDb.pioneerStatus) tables.push(localDb.pioneerStatus);
    if (tables.length > 0) {
      await localDb.transaction("rw", tables, async () => {
        for (const t of tables) await t.clear();
      });
    }
  } catch (err) {
    console.warn("[Tally] could not clear local tables:", err.message);
  }

  await updateUserProfile({ migratedFromLocal: true });
  return { migrated: migratedCount > 0, count: migratedCount };
}
