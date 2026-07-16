/**
 * LogEntry.jsx — create/edit daily log with contact tagging.
 */

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getEntry,
  saveEntry,
  getStatusForMonth,
  searchContacts,
  createContact,
  addInteraction,
} from "@/firebase/firestore";
import { todayISO, toMonthKey, formatDuration } from "@/utils/dateHelpers";
import Timer from "@/components/Timer";
import styles from "./LogEntry.module.css";

const STAGE_COLOR = {
  first_contact: { bg: "rgba(160,160,160,0.18)", border: "rgba(160,160,160,0.35)" },
  return_visit: { bg: "rgba(52,152,219,0.18)", border: "rgba(52,152,219,0.35)" },
  bible_study: { bg: "rgba(46,204,113,0.18)", border: "rgba(46,204,113,0.35)" },
};

export default function LogEntry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [date, setDate] = useState(todayISO());
  const [hours, setHours] = useState("");
  const [unit, setUnit] = useState("hours"); // "hours" | "minutes"
  const [inputMode, setInputMode] = useState("manual");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState("");
  const [currentStatus, setCurrentStatus] = useState(null);

  /** @type {Array<{id?:string, name:string, stage:string, topic:string, isNew?:boolean}>} */
  const [tagged, setTagged] = useState([]);
  const [quickStage, setQuickStage] = useState(null);
  const [quickName, setQuickName] = useState("");
  const [quickTopic, setQuickTopic] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (!isEdit) return;
    getEntry(id).then((entry) => {
      if (!entry) { navigate("/home", { replace: true }); return; }
      setDate(entry.date);
      setHours(String(entry.hours ?? ""));
      setNotes(entry.notes ?? "");
      setTagged((entry.bibleStudies ?? []).map((name) => ({
        name,
        stage: "bible_study",
        topic: "",
      })));
      setLoading(false);
    });
  }, [id, isEdit, navigate]);

  useEffect(() => {
    if (!date) return;
    const [y, m] = date.split("-").map(Number);
    getStatusForMonth(toMonthKey(y, m - 1)).then(setCurrentStatus).catch(() => setCurrentStatus(null));
  }, [date]);

  useEffect(() => {
    if (!quickName.trim()) { setSuggestions([]); return; }
    searchContacts(quickName).then(setSuggestions).catch(() => setSuggestions([]));
  }, [quickName]);

  function handleTimerUse(decimalHours) {
    setHours(String(decimalHours));
    setUnit("hours");
    setInputMode("manual");
  }

  function addTagged(contact) {
    if (tagged.some((t) => t.name.toLowerCase() === contact.name.toLowerCase())) return;
    setTagged([...tagged, {
      id: contact.id,
      name: contact.name,
      stage: contact.stage ?? quickStage ?? "first_contact",
      topic: quickTopic.trim(),
      isNew: contact.isNew,
    }]);
    setQuickStage(null);
    setQuickName("");
    setQuickTopic("");
    setSuggestions([]);
  }

  async function confirmQuickAdd() {
    const name = quickName.trim();
    if (!name || !quickStage) return;
    const existing = suggestions.find((s) => s.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      addTagged({ ...existing, topic: quickTopic });
      return;
    }
    addTagged({ name, stage: quickStage, isNew: true, topic: quickTopic });
  }

  function removeTagged(name) {
    setTagged(tagged.filter((t) => t.name !== name));
  }

  async function handleSave() {
    const isPublisher = currentStatus?.status === "publisher";
    let parsedHours = 0;
    if (!isPublisher) {
      const raw = parseFloat(hours);
      if (!hours || isNaN(raw) || raw <= 0) {
        setError("Please enter a valid duration greater than 0.");
        return;
      }
      parsedHours = unit === "minutes" ? raw / 60 : raw;
    }
    if (!date) {
      setError("Please select a date.");
      return;
    }
    setError("");

    const [y, m] = date.split("-").map(Number);
    const resolved = [];
    for (const t of tagged) {
      let contactId = t.id;
      if (t.isNew || !contactId) {
        const created = await createContact(t.name, t.stage);
        contactId = created.id;
      }
      await addInteraction(contactId, t.topic || "", "", date);
      resolved.push({ ...t, id: contactId });
    }

    const bibleStudies = resolved
      .filter((t) => t.stage === "bible_study")
      .map((t) => t.name);

    const entry = {
      id: isEdit ? id : crypto.randomUUID(),
      date,
      hours: parsedHours,
      bibleStudies,
      notes: notes.trim(),
      monthKey: toMonthKey(y, m - 1),
    };

    await saveEntry(entry);
    navigate("/home", { replace: true });
  }

  if (loading) return null;
  const isPublisher = currentStatus?.status === "publisher";

  return (
    <main className={`page ${styles.page}`}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
        <h1 className={styles.title}>{isEdit ? "Edit Entry" : "Log Your Day"}</h1>
      </div>

      <div className={styles.field}>
        <label className="label" htmlFor="entry-date">Date</label>
        <div className={styles.dateWrap}>
          <span className={styles.dateIcon} aria-hidden="true">📅</span>
          <input
            id="entry-date"
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            className={styles.dateInputLarge}
          />
        </div>
        <p className={styles.hoursHint}>You can log for any past date — just pick the date above</p>
      </div>

      {!isPublisher && (
        <div className={styles.field}>
          <p className="label">Hours</p>
          <div className={styles.card}>
            <div className={styles.modeToggle}>
              {["manual", "timer"].map((mode) => (
                <button
                  key={mode}
                  className={`${styles.modeBtn} ${inputMode === mode ? styles.modeBtnActive : ""}`}
                  onClick={() => setInputMode(mode)}
                >
                  {mode === "manual" ? "✏️ Manual" : "⏱ Timer"}
                </button>
              ))}
            </div>

            {inputMode === "manual" ? (
              <div className={styles.manualWrap}>
                <div className={styles.modeToggle} style={{ marginBottom: 12 }}>
                  {["hours", "minutes"].map((u) => (
                    <button
                      key={u}
                      type="button"
                      className={`${styles.modeBtn} ${unit === u ? styles.modeBtnActive : ""}`}
                      onClick={() => setUnit(u)}
                    >
                      {u === "hours" ? "Hours" : "Minutes"}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder={unit === "minutes" ? "e.g. 90" : "e.g. 2.5"}
                  min="0.01"
                  step={unit === "minutes" ? "1" : "0.01"}
                  className={styles.hoursInput}
                  inputMode="decimal"
                />
                <p className={styles.hoursHint}>
                  {unit === "minutes"
                    ? "Enter whole minutes (converted to hours on save)"
                    : "Enter hours as a decimal — full precision is kept"}
                </p>
                {currentStatus?.status === "regular" && (
                  <p className={styles.hoursHint}>Regular pioneers report 50h/month</p>
                )}
                {currentStatus?.status === "auxiliary" && (
                  <p className={styles.hoursHint}>Auxiliary pioneers report {currentStatus.goalHours}h this month</p>
                )}
                {hours && parseFloat(hours) > 0 && (
                  <p className={styles.savedHours}>
                    ✓ {formatDuration(unit === "minutes" ? parseFloat(hours) / 60 : parseFloat(hours))}
                  </p>
                )}
              </div>
            ) : (
              <Timer onUse={handleTimerUse} />
            )}
          </div>
        </div>
      )}

      <div className={styles.field}>
        <p className="label">Who did you talk to today? <span className={styles.optional}>(optional)</span></p>
        <div className={styles.card}>
          <div className={styles.modeToggle} style={{ marginBottom: 12 }}>
            {[
              { id: "first_contact", label: "+ First Contact" },
              { id: "return_visit", label: "+ Return Visit" },
              { id: "bible_study", label: "+ Bible Study" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                className={`${styles.modeBtn} ${quickStage === p.id ? styles.modeBtnActive : ""}`}
                onClick={() => setQuickStage(quickStage === p.id ? null : p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {quickStage && (
            <div style={{ marginBottom: 12 }}>
              <input
                className={styles.hoursInput}
                style={{ fontSize: 15, marginBottom: 8 }}
                placeholder="Name…"
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
              />
              {suggestions.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  {suggestions.slice(0, 5).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={styles.modeBtn}
                      style={{ marginRight: 6, marginBottom: 6 }}
                      onClick={() => addTagged(s)}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
              <input
                className={styles.hoursInput}
                style={{ fontSize: 14, marginBottom: 8 }}
                placeholder="Topic (optional)"
                value={quickTopic}
                onChange={(e) => setQuickTopic(e.target.value)}
              />
              <button type="button" className={styles.saveBtn} style={{ marginTop: 0 }} onClick={confirmQuickAdd}>
                Add
              </button>
            </div>
          )}

          {tagged.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {tagged.map((t) => {
                const colors = STAGE_COLOR[t.stage] ?? STAGE_COLOR.first_contact;
                return (
                  <span
                    key={t.name}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 10px",
                      borderRadius: 999,
                      background: colors.bg,
                      border: `1px solid ${colors.border}`,
                      fontSize: 13,
                    }}
                  >
                    {t.name}
                    <button
                      type="button"
                      onClick={() => removeTagged(t.name)}
                      style={{ border: "none", background: "none", cursor: "pointer", fontSize: 14 }}
                      aria-label={`Remove ${t.name}`}
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className={styles.field}>
        <label className="label" htmlFor="entry-notes">
          Notes <span className={styles.optional}>(optional)</span>
        </label>
        <textarea
          id="entry-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any notes from today..."
          rows={3}
          className={styles.textarea}
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button className={styles.saveBtn} onClick={handleSave}>
        {isEdit ? "Update Entry ✓" : "Save Entry ✓"}
      </button>
    </main>
  );
}
