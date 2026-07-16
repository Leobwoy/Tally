/**
 * ContactDetail.jsx
 */

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getContact,
  advanceContactStage,
  addInteraction,
} from "@/firebase/firestore";
import { useInteractionsForContact } from "@/hooks/useFirestore";
import { formatEntryDate } from "@/utils/dateHelpers";
import styles from "./ContactDetail.module.css";

const STAGE_LABEL = {
  first_contact: "First Contact",
  return_visit: "Return Visit",
  bible_study: "Bible Study",
  inactive: "Inactive",
};

const NEXT = {
  first_contact: { stage: "return_visit", label: "Mark as Return Visit" },
  return_visit: { stage: "bible_study", label: "Mark as Bible Study" },
};

export default function ContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);
  const [showLog, setShowLog] = useState(false);
  const [topic, setTopic] = useState("");
  const [note, setNote] = useState("");
  const interactions = useInteractionsForContact(id);

  useEffect(() => {
    getContact(id).then((c) => {
      if (!c) navigate("/contacts", { replace: true });
      else setContact(c);
    });
  }, [id, navigate]);

  async function refresh() {
    setContact(await getContact(id));
  }

  async function handleAdvance() {
    const next = NEXT[contact.stage];
    if (!next) return;
    await advanceContactStage(id, next.stage);
    await refresh();
  }

  async function handleInactive() {
    if (!window.confirm("Mark this contact as inactive?")) return;
    await advanceContactStage(id, "inactive");
    await refresh();
  }

  async function handleLog() {
    await addInteraction(id, topic, note);
    setTopic("");
    setNote("");
    setShowLog(false);
  }

  if (!contact) return null;

  const badgeClass =
    contact.stage === "bible_study"
      ? styles.badgeGreen
      : contact.stage === "return_visit"
        ? styles.badgeBlue
        : styles.badgeGrey;

  return (
    <main className={`page ${styles.page}`}>
      <button type="button" className={styles.backBtn} onClick={() => navigate("/contacts")}>
        ← Back
      </button>

      <div className={styles.header}>
        <h1 className={styles.name}>{contact.name}</h1>
        <span className={`${styles.badge} ${badgeClass}`}>
          {STAGE_LABEL[contact.stage] ?? contact.stage}
        </span>
      </div>

      {contact.phone && (
        <p className={styles.phone}>{contact.phone}</p>
      )}

      {NEXT[contact.stage] && (
        <button type="button" className={styles.advanceBtn} onClick={handleAdvance}>
          {NEXT[contact.stage].label}
        </button>
      )}

      {contact.stage !== "inactive" && (
        <button type="button" className={styles.inactiveLink} onClick={handleInactive}>
          Mark as inactive
        </button>
      )}

      <button type="button" className={styles.logBtn} onClick={() => setShowLog((v) => !v)}>
        {showLog ? "Cancel" : "Log a conversation"}
      </button>

      {showLog && (
        <div className={styles.logForm}>
          <input
            className={styles.input}
            placeholder="Topic (e.g. Psalm 83)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <textarea
            className={styles.textarea}
            placeholder="Note (optional)"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button type="button" className={styles.saveBtn} onClick={handleLog}>
            Save conversation
          </button>
        </div>
      )}

      <p className="label" style={{ marginTop: 24, marginBottom: 10 }}>TIMELINE</p>
      {interactions.length === 0 ? (
        <p className={styles.empty}>No conversations logged yet.</p>
      ) : (
        interactions.map((ix) => (
          <div key={ix.id} className={styles.timelineItem}>
            <p className={styles.timelineDate}>{formatEntryDate(ix.date)}</p>
            {ix.topic && <p className={styles.timelineTopic}>{ix.topic}</p>}
            {ix.note && <p className={styles.timelineNote}>{ix.note}</p>}
          </div>
        ))
      )}
    </main>
  );
}
