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
import { doc, setDoc, getDoc, getDocs, collection, query, where, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

/**
 * Crée un nouveau compte utilisateur
 */
export async function signUp(email, password, profileData = {}) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  const firstName = profileData.firstName?.trim() || "";
  const lastName = profileData.lastName?.trim() || "";
  const fullName = `${firstName} ${lastName}`.trim() || profileData.displayName?.trim() || email.split("@")[0];

  // Mettre à jour le profil Firebase Auth
  try {
    await updateProfile(user, { displayName: fullName });
  } catch (e) {
    console.warn("Could not update profile displayName:", e);
  }

  // Créer le profil utilisateur dans Firestore
  try {
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: email.toLowerCase().trim(),
      firstName,
      lastName,
      displayName: fullName,
      phone: profileData.phone?.trim() || "",
      jobTitle: profileData.jobTitle?.trim() || "Voiturier",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      plan: "free",
    });
  } catch (e) {
    console.warn("User doc in Firestore could not be written yet:", e);
  }

  return user;
}

/**
 * Met à jour le profil de l'utilisateur dans Firestore et Firebase Auth
 */
export async function saveUserProfile(userId, data) {
  const firstName = data.firstName?.trim() || "";
  const lastName = data.lastName?.trim() || "";
  const fullName = `${firstName} ${lastName}`.trim() || data.displayName?.trim() || "Utilisateur";

  if (auth.currentUser) {
    try {
      await updateProfile(auth.currentUser, { displayName: fullName });
    } catch (e) {
      console.warn("Could not update auth displayName:", e);
    }
  }

  await setDoc(
    doc(db, "users", userId),
    {
      uid: userId,
      email: (auth.currentUser?.email || data.email || "").toLowerCase().trim(),
      firstName,
      lastName,
      displayName: fullName,
      phone: data.phone?.trim() || "",
      jobTitle: data.jobTitle?.trim() || "",
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return { ...data, displayName: fullName };
}

/**
 * Récupère les profils d'une liste d'IDs utilisateurs (pour afficher les membres d'un parking)
 */
export async function getUsersProfiles(userIds = []) {
  if (!Array.isArray(userIds) || userIds.length === 0) return [];

  const profiles = [];
  // Firestore limits 'in' queries to 30 elements, but parkings usually have a small team
  // For safety, batch fetch or fetch individually via getDoc
  await Promise.all(
    userIds.map(async (uid) => {
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
          profiles.push({ uid, ...snap.data() });
        } else {
          profiles.push({
            uid,
            displayName: `Membre (${uid.substring(0, 5)})`,
            email: "Email masqué",
          });
        }
      } catch (err) {
        profiles.push({
          uid,
          displayName: `Membre (${uid.substring(0, 5)})`,
          email: "—",
        });
      }
    })
  );

  return profiles;
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

