/**
 * hooks/useFirestore.js
 * React hooks wrapping Firestore onSnapshot subscriptions.
 */

import { useEffect, useState } from "react";
import {
  subscribeUserProfile,
  subscribeEntriesForMonth,
  subscribeContactsByStage,
  subscribeAllContacts,
  subscribeEntriesWithNotes,
  subscribeInteractionsForContact,
} from "@/firebase/firestore";

export function useUserProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeUserProfile((p) => {
      setProfile(p);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { profile, loading };
}

export function useEntriesForMonth(monthKey) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!monthKey) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeEntriesForMonth(monthKey, (rows) => {
      setEntries(rows);
      setLoading(false);
    });
    return unsub;
  }, [monthKey]);

  return { entries, loading };
}

export function useContactsByStage(stage) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!stage) {
      setContacts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeContactsByStage(stage, (rows) => {
      setContacts(rows);
      setLoading(false);
    });
    return unsub;
  }, [stage]);

  return { contacts, loading };
}

export function useAllContacts() {
  const [contacts, setContacts] = useState([]);
  useEffect(() => {
    return subscribeAllContacts(setContacts);
  }, []);
  return contacts;
}

export function useEntriesWithNotes() {
  const [entries, setEntries] = useState([]);
  useEffect(() => {
    return subscribeEntriesWithNotes(setEntries);
  }, []);
  return entries;
}

export function useInteractionsForContact(contactId) {
  const [interactions, setInteractions] = useState([]);
  useEffect(() => {
    if (!contactId) {
      setInteractions([]);
      return;
    }
    return subscribeInteractionsForContact(contactId, setInteractions);
  }, [contactId]);
  return interactions;
}
