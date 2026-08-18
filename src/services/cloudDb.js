// ---------------------------------------------------------------------------
// Service Base de Données Cloud — Firestore avec Temps Réel & Sécurité
// ---------------------------------------------------------------------------

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "./firebase";

// Suppression de hashAccessCode - le code brut sera utilisé comme identifiant simple.

/**
 * Convertit un index numérique (0, 1, 2... 25, 26, 27) en lettres (A, B, C... Z, AA, AB)
 */
export function indexToLetter(idx) {
  let result = "";
  let temp = Number(idx);
  while (temp >= 0) {
    result = String.fromCharCode(65 + (temp % 26)) + result;
    temp = Math.floor(temp / 26) - 1;
  }
  return result;
}

/**
 * Retourne le nom d'affichage d'une voie en tenant compte des personnalisations et du mode de nommage
 */
export function getLaneName(laneIdx, parking) {
  if (laneIdx === undefined || laneIdx === null || laneIdx < 0) return "Voie ?";
  const idx = Number(laneIdx);
  if (parking?.laneNames && parking.laneNames[idx] && typeof parking.laneNames[idx] === "string" && parking.laneNames[idx].trim()) {
    return parking.laneNames[idx].trim();
  }
  if (parking?.laneNaming === "alphabetic") {
    return `Voie ${indexToLetter(idx)}`;
  }
  return `Voie ${idx + 1}`;
}

/**
 * Génère un code d'accès aléatoire lisible pour le partage
 * (ex: PARK-A1B2-C3D4)
 */
export function generateAccessCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const segment = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `PARK-${segment()}-${segment()}`;
}

// ---------------------------------------------------------------------------
// Helpers pour la Sérialisation (Firestore ne supporte pas les nested arrays)
// ---------------------------------------------------------------------------

function serializeLanes(lanesArray) {
  if (!Array.isArray(lanesArray)) return {};
  const obj = {};
  lanesArray.forEach((lane, i) => {
    obj[i] = lane || [];
  });
  return obj;
}

function deserializeLanes(lanesObj, laneCount) {
  const count = Number(laneCount) || 30;
  if (!lanesObj) return Array.from({ length: count }, () => []);
  if (Array.isArray(lanesObj) && !Array.isArray(lanesObj[0])) {
    // Cas où c'était déjà un tableau, on s'assure que c'est un tableau de tableaux
  }
  const arr = [];
  for (let i = 0; i < count; i++) {
    arr.push(lanesObj[i] || []);
  }
  return arr;
}

// ---------------------------------------------------------------------------
// PARKINGS — Création, Lecture, Mise à Jour Temps Réel
// ---------------------------------------------------------------------------

/**
 * Crée un nouveau parking pour l'utilisateur connecté.
 * Un code d'accès hashé est généré et stocké pour le partage sécurisé.
 */
export async function createParking(userId, config) {
  const parkingId = `pkg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const rawCode = config.code || generateAccessCode();

  const parkingData = {
    id: parkingId,
    name: config.name,
    description: config.description || "",
    laneCount: Number(config.laneCount) || 30,
    capacity: Number(config.capacity) || 10,
    laneNaming: config.laneNaming || "numeric", // "numeric" | "alphabetic"
    laneNames: config.laneNames || {}, // { 0: "Voie VIP", ... }
    ownerId: userId,
    authorizedUsers: [userId], // Propriétaire toujours inclus
    accessCode: rawCode,
    lanes: serializeLanes(Array.from({ length: config.laneCount || 30 }, () => [])),
    waiting: [],
    history: [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "CREATE_PARKING",
        details: { message: `Parking "${config.name}" créé` },
      },
    ],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, "parkings", parkingId), parkingData);

  // Stocker une entrée dans la collection des codes d'accès pour lookup rapide
  await setDoc(doc(db, "accessCodes", rawCode), {
    parkingId,
    ownerId: userId,
    parkingName: config.name,
    createdAt: serverTimestamp(),
  });

  // Retourner le parking avec le code brut (affiché une seule fois au propriétaire)
  // On renvoie un tableau de tableaux pour l'application Frontend
  return { 
    ...parkingData, 
    rawAccessCode: rawCode, 
    lanes: deserializeLanes(parkingData.lanes, parkingData.laneCount) 
  };
}

/**
 * Récupère tous les parkings auxquels l'utilisateur a accès (propriétaire ou invité)
 */
export async function getUserParkings(userId) {
  const q = query(
    collection(db, "parkings"),
    where("authorizedUsers", "array-contains", userId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return { ...data, id: d.id, lanes: deserializeLanes(data.lanes, data.laneCount) };
  });
}

/**
 * Rejoindre un parking via son Code d'Accès (lecture + écriture)
 */
export async function joinParkingWithCode(userId, rawCode) {
  const normalizedCode = rawCode.trim().toUpperCase();

  const codeDoc = await getDoc(doc(db, "accessCodes", normalizedCode));
  if (!codeDoc.exists()) {
    throw new Error("Code d'accès invalide ou expiré.");
  }

  const { parkingId, parkingName } = codeDoc.data();

  try {
    await updateDoc(doc(db, "parkings", parkingId), {
      authorizedUsers: arrayUnion(userId),
    });
    return { alreadyJoined: false, parkingId, name: parkingName };
  } catch (err) {
    if (err.code === "permission-denied") {
      return { alreadyJoined: true, parkingId, name: parkingName };
    }
    throw err;
  }
}

/**
 * Quitte un parking (retire l'utilisateur de authorizedUsers).
 * Si plus personne n'est dans authorizedUsers, supprime définitivement le parking.
 */
export async function leaveParking(parkingId, userId) {
  const snap = await getDoc(doc(db, "parkings", parkingId));
  if (!snap.exists()) return { deletedPermanently: true };
  
  const data = snap.data();
  const currentUsers = Array.isArray(data.authorizedUsers) ? data.authorizedUsers : [data.ownerId].filter(Boolean);
  const remainingUsers = currentUsers.filter((u) => u !== userId);

  if (remainingUsers.length === 0) {
    // Plus personne n'a accès à ce parking -> suppression définitive automatique
    const accessCode = data.accessCode;
    if (accessCode) {
      await deleteDoc(doc(db, "accessCodes", accessCode)).catch(() => {});
    }
    await deleteDoc(doc(db, "parkings", parkingId));
    return { deletedPermanently: true };
  } else {
    // Il reste d'autres utilisateurs
    const updates = {
      authorizedUsers: arrayRemove(userId),
    };
    // Si c'était le créateur qui quitte, on transmet le rôle de propriétaire au premier membre restant
    if (data.ownerId === userId && remainingUsers.length > 0) {
      updates.ownerId = remainingUsers[0];
    }
    await updateDoc(doc(db, "parkings", parkingId), updates);
    return { deletedPermanently: false };
  }
}

/**
 * Met à jour les données complètes d'un parking (lanes, waiting, history...)
 * Appelé après chaque opération métier
 */
export async function saveParkingData(parkingId, data) {
  const { rawAccessCode, accessCode, lanes, ...safeData } = data; // Ne pas recraser l'accessCode
  
  if (lanes) {
    safeData.lanes = serializeLanes(lanes);
  }

  await updateDoc(doc(db, "parkings", parkingId), {
    ...safeData,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Écoute les changements en temps réel d'un parking (mise à jour < 1 seconde)
 * Retourne une fonction de désabonnement (unsubscribe)
 */
export function subscribeToParking(parkingId, callback) {
  return onSnapshot(doc(db, "parkings", parkingId), (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      callback({ id: snap.id, ...data, lanes: deserializeLanes(data.lanes, data.laneCount) });
    }
  });
}

export function subscribeToParkingList(userId, callback, onError) {
  const q = query(
    collection(db, "parkings"),
    where("authorizedUsers", "array-contains", userId)
  );
  return onSnapshot(q, (snap) => {
    const parkings = snap.docs.map((d) => {
      const data = d.data();
      return { id: d.id, ...data, lanes: deserializeLanes(data.lanes, data.laneCount) };
    });
    callback(parkings);
  }, (err) => {
    console.error("Erreur onSnapshot (accès refusé ou DB manquante):", err);
    if (onError) onError(err);
  });
}

/**
 * Supprime un parking définitivement pour tout le monde (créateur / propriétaire uniquement)
 */
export async function deleteParking(parkingId, userId) {
  const snap = await getDoc(doc(db, "parkings", parkingId));
  if (!snap.exists()) throw new Error("Parking introuvable.");
  if (snap.data().ownerId !== userId) {
    throw new Error("Seul le créateur ou administrateur du parking peut le supprimer définitivement.");
  }

  // Supprimer le code d'accès associé
  const accessCode = snap.data().accessCode;
  if (accessCode) {
    await deleteDoc(doc(db, "accessCodes", accessCode)).catch(() => {});
  }

  await deleteDoc(doc(db, "parkings", parkingId));
}

/**
 * Régénère un nouveau code d'accès pour un parking (révocation de l'ancien)
 */
export async function regenerateAccessCode(parkingId, userId) {
  const snap = await getDoc(doc(db, "parkings", parkingId));
  if (!snap.exists()) throw new Error("Parking introuvable.");
  if (snap.data().ownerId !== userId) throw new Error("Seul le propriétaire peut régénérer le code.");

  // Supprimer l'ancien code d'accès
  const oldCode = snap.data().accessCode;
  if (oldCode) await deleteDoc(doc(db, "accessCodes", oldCode)).catch(() => {});

  const newRawCode = generateAccessCode();

  await updateDoc(doc(db, "parkings", parkingId), {
    accessCode: newRawCode,
    updatedAt: serverTimestamp(),
  });

  await setDoc(doc(db, "accessCodes", newRawCode), {
    parkingId,
    ownerId: userId,
    parkingName: snap.data().name,
    createdAt: serverTimestamp(),
  });

  return newRawCode;
}

