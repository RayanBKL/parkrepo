// ---------------------------------------------------------------------------
// Service d'Authentification — Comptes Utilisateurs Sécurisés
// ---------------------------------------------------------------------------

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, getDoc, getDocs, updateDoc, collection, query, where, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

/**
 * Crée un nouveau compte utilisateur avec organisation et rôle RBAC
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

  const role = profileData.role || "OWNER"; // Par défaut OWNER lors de la création d'entreprise
  const status = profileData.status || "active"; // "active" | "invited" | "disabled"
  const organizationId = profileData.organizationId || null;
  const assignedParkingIds = profileData.assignedParkingIds || ["*"];

  // Créer le profil utilisateur dans Firestore
  try {
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: email.toLowerCase().trim(),
      firstName,
      lastName,
      displayName: fullName,
      phone: profileData.phone?.trim() || "",
      jobTitle: profileData.jobTitle?.trim() || (role === "OWNER" ? "Gérant / Propriétaire" : "Voiturier"),
      role,
      status,
      organizationId,
      assignedParkingIds,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
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
 * Met à jour le mot de passe de l'utilisateur connecté
 */
export async function updateUserAccountPassword(newPassword) {
  if (!auth.currentUser) throw new Error("Aucun utilisateur connecté.");
  await updatePassword(auth.currentUser, newPassword);
}

/**
 * Met à jour le rôle, statut ou parkings assignés d'un utilisateur
 */
export async function updateUserRoleAndStatus(userId, { role, status, assignedParkingIds, jobTitle }) {
  const ref = doc(db, "users", userId);
  const data = { updatedAt: serverTimestamp() };
  if (role !== undefined) data.role = role;
  if (status !== undefined) data.status = status;
  if (assignedParkingIds !== undefined) data.assignedParkingIds = assignedParkingIds;
  if (jobTitle !== undefined) data.jobTitle = jobTitle;

  await updateDoc(ref, data);
  return data;
}

/**
 * Invite un nouvel employé dans une organisation
 */
export async function inviteMemberToOrg({ orgId, email, role = "VOITURIER", assignedParkingIds = ["*"], inviterName = "L'administrateur" }) {
  if (orgId) {
    const { checkUserQuota } = await import("./organization");
    const quota = await checkUserQuota(orgId);
    if (!quota.allowed) {
      throw new Error(quota.reason);
    }
  }

  const inviteId = `inv_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const inviteData = {
    id: inviteId,
    email: email.toLowerCase().trim(),
    organizationId: orgId,
    role,
    assignedParkingIds,
    status: "invited", // "invited" | "accepted" | "declined"
    inviterName,
    createdAt: serverTimestamp(),
  };

  await setDoc(doc(db, "invitations", inviteId), inviteData);
  return inviteData;
}

/**
 * Récupère les invitations en attente pour une organisation
 */
export async function getOrganizationInvitations(orgId) {
  if (!orgId) return [];
  try {
    const q = query(collection(db, "invitations"), where("organizationId", "==", orgId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn("Could not fetch invitations:", err);
    return [];
  }
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




