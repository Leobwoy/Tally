import db, { getStatusForMonth } from "@/db/db";
import { currentMonthKey, todayISO } from "@/utils/dateHelpers";

let timeoutId = null;

export async function requestNotificationPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
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
      const existingEntry = await db.entries.where("date").equals(todayKey).first();
      if (existingEntry) {
        scheduleReminder(hourOfDay);
        return;
      }

      const status = await getStatusForMonth(currentMonthKey());

      const message =
        status.status === "publisher"
          ? "Don't forget to log your bible studies today!"
          : "Don't forget to log your field service hours today!";

      // If permission was revoked, this will throw in some browsers
      // but we still reschedule for tomorrow.
      new Notification("Tally", {
        body: message,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: "daily-reminder",
      });
    } catch (err) {
      // Silent: reminders are best-effort.
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

