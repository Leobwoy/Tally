/**
 * firebase/auth.js
 * Email/password auth helpers for Tally.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./config";

/**
 * Create a new account and seed the Firestore user profile.
 * @param {string} email
 * @param {string} password
 * @param {string} displayName
 */
export async function signUp(email, password, displayName) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });

  await setDoc(doc(db, "users", cred.user.uid), {
    name: displayName.trim(),
    email: email.trim().toLowerCase(),
    theme: "sunrise",
    dark: false,
    defaultStatus: "publisher",
    defaultGoalHours: 0,
    remindersEnabled: false,
    reminderHour: 18,
    lastSeenVersion: "",
    onboardingComplete: false,
    migratedFromLocal: false,
    createdAt: serverTimestamp(),
  });

  return cred.user;
}

/**
 * @param {string} email
 * @param {string} password
 */
export async function logIn(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logOut() {
  await signOut(auth);
}

/**
 * @param {string} email
 */
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Subscribe to auth state changes.
 * @param {(user: import("firebase/auth").User|null) => void} callback
 * @returns {() => void} unsubscribe
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
