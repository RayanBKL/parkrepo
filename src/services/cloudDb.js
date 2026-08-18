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
} from "firebase/firestore";
import { db } from "./firebase";

// ---------------------------------------------------------------------------
// HACHAGE SHA-256 du Code d'Accès (côté client, via Web Crypto API)
// Le code brut n'est JAMAIS stocké dans la base de données.
// ---------------------------------------------------------------------------

async function hashAccessCode(code) {
  const normalized = code.trim().toUpperCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized + "::PARKOPTIMIZER_SALT_2026");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
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
  const hashedCode = await hashAccessCode(rawCode);

  const parkingData = {
    id: parkingId,
    name: config.name,
    description: config.description || "",
    laneCount: Number(config.laneCount) || 30,
    capacity: Number(config.capacity) || 10,
    ownerId: userId,
    authorizedUsers: [userId], // Propriétaire toujours inclus
    hashedAccessCode: hashedCode,
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
  await setDoc(doc(db, "accessCodes", hashedCode), {
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
 * Le code est hashé avant toute requête — le code brut ne transite jamais
 */
export async function joinParkingWithCode(userId, rawCode) {
  const hashedCode = await hashAccessCode(rawCode);

  // Lookup du hash dans la table des codes d'accès
  const codeDoc = await getDoc(doc(db, "accessCodes", hashedCode));
  if (!codeDoc.exists()) {
    throw new Error("Code d'accès invalide ou expiré.");
  }

  const { parkingId } = codeDoc.data();

  // Vérifier que l'utilisateur n'a pas déjà accès
  const parkingSnap = await getDoc(doc(db, "parkings", parkingId));
  if (!parkingSnap.exists()) {
    throw new Error("Ce parking n'existe plus.");
  }

  const parkingData = parkingSnap.data();
  if (parkingData.authorizedUsers.includes(userId)) {
    return { alreadyJoined: true, parkingId, name: parkingData.name };
  }

  // Ajouter l'utilisateur aux utilisateurs autorisés (lecture + écriture)
  await updateDoc(doc(db, "parkings", parkingId), {
    authorizedUsers: arrayUnion(userId),
  });

  return { alreadyJoined: false, parkingId, name: parkingData.name };
}

/**
 * Met à jour les données complètes d'un parking (lanes, waiting, history...)
 * Appelé après chaque opération métier
 */
export async function saveParkingData(parkingId, data) {
  const { rawAccessCode, lanes, ...safeData } = data; // Ne jamais sauvegarder le code brut
  
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
 * Supprime un parking (propriétaire uniquement)
 */
export async function deleteParking(parkingId, userId) {
  const snap = await getDoc(doc(db, "parkings", parkingId));
  if (!snap.exists()) throw new Error("Parking introuvable.");
  if (snap.data().ownerId !== userId) throw new Error("Seul le propriétaire peut supprimer ce parking.");

  // Supprimer le code d'accès associé
  const hashedCode = snap.data().hashedAccessCode;
  if (hashedCode) {
    await deleteDoc(doc(db, "accessCodes", hashedCode));
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
  const oldHash = snap.data().hashedAccessCode;
  if (oldHash) await deleteDoc(doc(db, "accessCodes", oldHash));

  const newRawCode = generateAccessCode();
  const newHash = await hashAccessCode(newRawCode);

  await updateDoc(doc(db, "parkings", parkingId), {
    hashedAccessCode: newHash,
    updatedAt: serverTimestamp(),
  });

  await setDoc(doc(db, "accessCodes", newHash), {
    parkingId,
    ownerId: userId,
    parkingName: snap.data().name,
    createdAt: serverTimestamp(),
  });

  return newRawCode;
}
