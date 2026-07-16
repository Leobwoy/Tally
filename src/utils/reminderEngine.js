/**
 * reminderEngine.js
 * Schedules daily reminders via setTimeout, delivered through the service worker
 * when possible (more reliable when the tab is backgrounded).
 *
 * Note: Full reliability when the app is fully closed requires a future native
 * wrap with Capacitor Local Notifications.
 */

import { hasEntryForDate, getStatusForMonth } from "@/firebase/firestore";
import { currentMonthKey, todayISO } from "@/utils/dateHelpers";

let timeoutId = null;

export async function requestNotificationPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

function postReminderToServiceWorker(message) {
  const payload = {
    type: "SHOW_REMINDER",
    title: "Tally",
    body: message,
    icon: "/icon-192.png",
  };

  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage(payload);
    return;
  }

  if (Notification.permission === "granted") {
    new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      badge: "/icon-192.png",
      tag: "daily-reminder",
    });
  }
}

export function scheduleReminder(hourOfDay = 18) {
  cancelReminder();

  const now = new Date();
  const target = new Date();
  target.setHours(hourOfDay, 0, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);

  const msUntilReminder = target.getTime() - now.getTime();

  timeoutId = window.setTimeout(async () => {
    try {
      const todayKey = todayISO();
      const logged = await hasEntryForDate(todayKey);
      if (logged) return;

      const status = await getStatusForMonth(currentMonthKey());
      const message =
        status.status === "publisher"
          ? "Don't forget to log your bible studies today!"
          : "Don't forget to log your field service hours today!";

      postReminderToServiceWorker(message);
    } catch {
      // best-effort
    } finally {
      scheduleReminder(hourOfDay);
    }
  }, msUntilReminder);

  try {
    localStorage.setItem("tally_reminder_id", String(timeoutId));
  } catch {
    // ignore
  }
}

export function cancelReminder() {
  if (timeoutId != null) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
  try {
    localStorage.removeItem("tally_reminder_id");
  } catch {
    // ignore
  }
}
