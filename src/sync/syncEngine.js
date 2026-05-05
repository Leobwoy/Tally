/**
 * syncEngine.js
 * Offline-first sync engine for Tally.
 *
 * How it works:
 *  1. Every save/delete writes to IndexedDB first (instant, offline-safe).
 *  2. The entry is also added to a syncQueue table.
 *  3. When the device comes online, this engine drains the queue,
 *     pushing each item to AWS Lambda → DynamoDB.
 *  4. Successfully synced items are marked synced=true and removed from the queue.
 *  5. If a push fails, the item stays in the queue and retries next time online.
 *
 * This module:
 *  - Starts a listener on window online/offline events
 *  - Exposes a manual triggerSync() for immediate use after a save
 *  - Handles auth headers via AWS Amplify's current session token
 */

import { fetchAuthSession } from "aws-amplify/auth";
import db from "@/db/db";

/** Base URL of your AWS HTTP API Gateway endpoint. Set in .env as VITE_API_URL */
const API_URL = import.meta.env.VITE_API_URL;

/** Whether a sync is currently in progress — prevents overlapping runs */
let syncing = false;

/**
 * Get the current Cognito JWT access token for authenticating API requests.
 * Returns null if the user is not signed in (sync will be skipped).
 *
 * @returns {Promise<string|null>}
 */
async function getAuthToken() {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.accessToken?.toString() ?? null;
  } catch {
    // Not signed in or session expired — skip sync silently
    return null;
  }
}

/**
 * Push a single sync queue item to AWS.
 * Handles both upsert (save) and delete actions.
 *
 * @param {{ entryId: string, action: "upsert"|"delete" }} queueItem
 * @param {string} authToken — Cognito JWT
 * @returns {Promise<boolean>} — true if successful
 */
async function pushQueueItem(queueItem, authToken) {
  const { entryId, action } = queueItem;

  try {
    if (action === "upsert") {
      // Fetch the full entry from IndexedDB to send to AWS
      const entry = await db.entries.get(entryId);
      if (!entry) {
        // Entry was deleted locally before sync — just remove from queue
        await db.syncQueue.where("entryId").equals(entryId).delete();
        return true;
      }

      const response = await fetch(`${API_URL}/entries`, {
        method:  "PUT",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify(entry),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      // Mark entry as synced in IndexedDB
      await db.entries.update(entryId, { synced: true });

    } else if (action === "delete") {
      const response = await fetch(`${API_URL}/entries/${entryId}`, {
        method:  "DELETE",
        headers: { "Authorization": `Bearer ${authToken}` },
      });

      // 404 means already deleted on server — that's fine
      if (!response.ok && response.status !== 404) {
        throw new Error(`HTTP ${response.status}`);
      }
    }

    // Remove successfully processed item from the queue
    await db.syncQueue.where("entryId").equals(entryId).delete();
    return true;

  } catch (error) {
    // Leave the item in the queue — it will retry on next sync
    console.warn(`[Tally Sync] Failed to sync entry ${entryId}:`, error.message);
    return false;
  }
}

/**
 * Drain the sync queue — push all pending items to AWS.
 * Safe to call multiple times; will skip if already running.
 *
 * @returns {Promise<void>}
 */
export async function triggerSync() {
  // Skip if already syncing, offline, or no API URL configured
  if (syncing || !navigator.onLine || !API_URL) return;

  const authToken = await getAuthToken();
  if (!authToken) return; // User not signed in — nothing to sync

  const queue = await db.syncQueue.orderBy("queuedAt").toArray();
  if (queue.length === 0) return;

  syncing = true;

  try {
    // Process queue items sequentially to avoid race conditions
    for (const item of queue) {
      await pushQueueItem(item, authToken);
    }
  } finally {
    syncing = false;
  }
}

/**
 * Pull all entries for the signed-in user from AWS and merge into IndexedDB.
 * Called once after login to hydrate the local database.
 *
 * Merge strategy: AWS record wins if its updatedAt is newer than the local copy.
 *
 * @returns {Promise<void>}
 */
export async function pullFromAWS() {
  if (!navigator.onLine || !API_URL) return;

  const authToken = await getAuthToken();
  if (!authToken) return;

  try {
    const response = await fetch(`${API_URL}/entries`, {
      headers: { "Authorization": `Bearer ${authToken}` },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const remoteEntries = await response.json(); // array of entry objects

    for (const remote of remoteEntries) {
      const local = await db.entries.get(remote.id);

      // Only overwrite local data if remote is newer
      if (!local || remote.updatedAt > local.updatedAt) {
        await db.entries.put({ ...remote, synced: true });
      }
    }
  } catch (error) {
    console.warn("[Tally Sync] Pull from AWS failed:", error.message);
  }
}

/**
 * Start listening for online/offline events.
 * Triggers a sync automatically when the device comes back online.
 * Call this once from App.jsx on mount.
 */
export function startSyncListener() {
  window.addEventListener("online", () => {
    // Small delay to let the connection stabilise before syncing
    setTimeout(triggerSync, 1500);
  });
}
