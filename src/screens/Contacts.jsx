/**
 * Contacts.jsx — First Contact → Return Visit → Bible Study pipeline.
 */

import React, { useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createContact, getLatestInteraction } from "@/firebase/firestore";
import { useAllContacts } from "@/hooks/useFirestore";
import { formatEntryDate } from "@/utils/dateHelpers";
import styles from "./Contacts.module.css";

const TABS = [
  { id: "first_contact", label: "First Contact" },
  { id: "return_visit", label: "Return Visit" },
  { id: "bible_study", label: "Bible Study" },
];

const EMPTY = {
  first_contact: "No first contacts yet. Tap + to add someone new.",
  return_visit: "No return visits yet. Advance a first contact when you visit again.",
  bible_study: "No bible studies yet. Keep nurturing your return visits!",
};

export default function Contacts() {
  const navigate = useNavigate();
  const allContacts = useAllContacts();
  const [tab, setTab] = useState("first_contact");
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [stage, setStage] = useState("first_contact");
  const [previews, setPreviews] = useState({});

  const counts = useMemo(() => ({
    first_contact: allContacts.filter((c) => c.stage === "first_contact").length,
    return_visit: allContacts.filter((c) => c.stage === "return_visit").length,
    bible_study: allContacts.filter((c) => c.stage === "bible_study").length,
  }), [allContacts]);

  const contacts = useMemo(
    () => allContacts.filter((c) => c.stage === tab),
    [allContacts, tab]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next = {};
      for (const c of contacts) {
        try {
          const last = await getLatestInteraction(c.id);
          if (last) {
            next[c.id] = `${formatEntryDate(last.date)}${last.topic ? ` · ${last.topic}` : ""}`;
          }
        } catch { /* ignore */ }
      }
      if (!cancelled) setPreviews(next);
    })();
    return () => { cancelled = true; };
  }, [contacts]);

  async function handleSave() {
    if (!name.trim()) return;
    const created = await createContact(name.trim(), stage, phone.trim());
    setShowAdd(false);
    setName("");
    setPhone("");
    setStage("first_contact");
    setTab(stage);
    navigate(`/contacts/${created.id}`);
  }

  return (
    <main className={`page ${styles.page}`}>
      <h1 className={styles.title}>Contacts</h1>

      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`${styles.tab} ${tab === t.id ? styles.tabActive : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label} ({counts[t.id]})
          </button>
        ))}
      </div>

      {contacts.length === 0 ? (
        <div className={styles.empty}>
          <p>{EMPTY[tab]}</p>
        </div>
      ) : (
        contacts.map((c) => (
          <button
            key={c.id}
            type="button"
            className={styles.card}
            onClick={() => navigate(`/contacts/${c.id}`)}
          >
            <div>
              <p className={styles.name}>{c.name}</p>
              <p className={styles.preview}>{previews[c.id] || "No conversations yet"}</p>
            </div>
            <span className={styles.chevron}>›</span>
          </button>
        ))
      )}

      <button className={styles.fab} onClick={() => setShowAdd(true)} aria-label="Add contact">+</button>

      {showAdd && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <p className="label" style={{ marginBottom: 12 }}>NEW CONTACT</p>
            <input
              className={styles.input}
              placeholder="Name (required)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <input
              className={styles.input}
              placeholder="Phone (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <select className={styles.input} value={stage} onChange={(e) => setStage(e.target.value)}>
              <option value="first_contact">First Contact</option>
              <option value="return_visit">Return Visit</option>
              <option value="bible_study">Bible Study</option>
            </select>
            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => setShowAdd(false)}>Cancel</button>
              <button type="button" className={styles.saveBtn} onClick={handleSave} disabled={!name.trim()}>Save</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
