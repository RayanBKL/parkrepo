// ---------------------------------------------------------------------------
// Service d'Authentification — Comptes Utilisateurs Sécurisés
// ---------------------------------------------------------------------------

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

/**
 * Crée un nouveau compte utilisateur
 * Le mot de passe est géré par Firebase Auth (jamais stocké en clair)
 */
export async function signUp(email, password, displayName) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  const name = displayName?.trim() || email.split("@")[0];

  // Mettre à jour le profil avec le nom d'affichage
  await updateProfile(user, { displayName: name });

  // Créer le profil utilisateur dans Firestore
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: email.toLowerCase().trim(),
    displayName: name,
    createdAt: serverTimestamp(),
    plan: "free",
  });

  return user;
}

/**
 * Connexion avec email + mot de passe
 */
export async function signIn(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

/**
 * Déconnexion
 */
export async function logOut() {
  await signOut(auth);
}

/**
 * Écoute les changements d'état d'authentification
 * Retourne l'utilisateur connecté ou null
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Récupère le profil complet de l'utilisateur depuis Firestore
 */
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (snap.exists()) return snap.data();
  return null;
}

/**
 * Envoie un email de réinitialisation de mot de passe
 */
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Retourne l'utilisateur actuellement connecté (ou null)
 */
export function getCurrentUser() {
  return auth.currentUser;
}
