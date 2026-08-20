// ---------------------------------------------------------------------------
// Service Organisation & Abonnements — Parkeya SaaS B2B
// ---------------------------------------------------------------------------

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// Plans et quotas par défaut
export const PLANS_CONFIG = {
  starter: {
    id: "starter",
    name: "Starter",
    priceMonthly: 129,
    priceAnnually: 109,
    maxParkings: 1,
    maxUsers: 5,
    maxVehicles: 300,
    features: [
      "1 Parking",
      "Jusqu'à 300 véhicules actifs (sur parc)",
      "5 Comptes utilisateurs inclus",
      "Support standard par email",
    ],
  },
  business: {
    id: "business",
    name: "Business",
    priceMonthly: 199,
    priceAnnually: 169,
    maxParkings: 1,
    maxUsers: 10,
    maxVehicles: 600,
    features: [
      "1 Parking",
      "Jusqu'à 600 véhicules actifs (sur parc)",
      "10 Comptes utilisateurs inclus",
      "Support prioritaire",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 299,
    priceAnnually: 249,
    maxParkings: 3,
    maxUsers: 20,
    maxVehicles: 3000,
    popular: true,
    features: [
      "Jusqu'à 3 Parkings",
      "Jusqu'à 1 000 véhicules actifs / parking",
      "20 Comptes utilisateurs inclus",
      "Gestion multi-sites centralisée",
      "Support prioritaire 7j/7",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceMonthly: null, // Sur devis
    priceAnnually: null,
    maxParkings: 999,
    maxUsers: 999,
    maxVehicles: 99999,
    features: [
      "4+ Parkings (Multi-parcs)",
      "Véhicules actifs sur mesure (illimité)",
      "Comptes utilisateurs sur mesure (illimité)",
      "Accompagnement & Déploiement sur site",
      "Support dédié 24/7 + SLA garanti",
    ],
  },
};

/**
 * Crée une nouvelle Organisation dans Firestore
 */
export async function createOrganization({
  name,
  email,
  phone = "",
  address = "",
  siret = "",
  ownerId,
  plan = "business",
  billingCycle = "monthly",
  status = "PENDING_PAYMENT",
}) {
  const orgId = `org_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const planConfig = PLANS_CONFIG[plan] || PLANS_CONFIG.business;

  const orgData = {
    id: orgId,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: (phone || "").trim(),
    address: (address || "").trim(),
    siret: (siret || "").trim(),
    ownerId,
    status, // PENDING_PAYMENT par défaut — ACTIVE après confirmation Stripe
    subscription: {
      plan: planConfig.id,
      billingCycle,
      status: "pending_payment", // Mis à jour par le webhook Stripe
      maxParkings: planConfig.maxParkings,
      maxUsers: planConfig.maxUsers,
      maxVehicles: planConfig.maxVehicles,
      renewsAt: null,
      trialEndsAt: null,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, "organizations", orgId), orgData);
  return orgData;
}


/**
 * Récupère les informations d'une Organisation
 */
export async function getOrganization(orgId) {
  if (!orgId) return null;
  try {
    const snap = await getDoc(doc(db, "organizations", orgId));
    if (snap.exists()) {
      // Toujours inclure l'ID du document Firestore comme fallback sur le champ id
      return { id: snap.id, ...snap.data() };
    }
  } catch (err) {
    console.warn("Could not fetch organization:", err);
  }
  return null;
}

/**
 * Récupère l'Organisation d'un utilisateur par son ID de propriétaire
 */
export async function getOrganizationByOwner(ownerId) {
  if (!ownerId) return null;
  try {
    const q = query(collection(db, "organizations"), where("ownerId", "==", ownerId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      // Toujours inclure l'ID du document Firestore comme fallback sur le champ id
      return { id: snap.docs[0].id, ...snap.docs[0].data() };
    }
  } catch (err) {
    console.warn("Could not fetch organization by owner:", err);
  }
  return null;
}

/**
 * Met à jour les paramètres d'une organisation
 */
export async function updateOrganization(orgId, updateData) {
  if (!orgId) return;
  const ref = doc(db, "organizations", orgId);
  await updateDoc(ref, {
    ...updateData,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Récupère tous les utilisateurs d'une organisation
 */
export async function getOrganizationUsers(orgId) {
  if (!orgId) return [];
  try {
    const q = query(collection(db, "users"), where("organizationId", "==", orgId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
  } catch (err) {
    console.warn("Could not fetch organization users:", err);
    return [];
  }
}

/**
 * Vérifie si une organisation peut ajouter un nouvel utilisateur selon son plan
 */
export async function checkUserQuota(orgId) {
  const org = await getOrganization(orgId);
  if (!org) return { allowed: false, reason: "Organisation introuvable" };

  const users = await getOrganizationUsers(orgId);
  const max = org.subscription?.maxUsers || PLANS_CONFIG.starter.maxUsers;

  if (users.length >= max) {
    return {
      allowed: false,
      current: users.length,
      max,
      reason: `Limite du plan atteinte (${users.length}/${max} utilisateurs). Passez au plan supérieur.`,
    };
  }

  return { allowed: true, current: users.length, max };
}

/**
 * Vérifie si une organisation peut ajouter un nouveau parking selon son plan
 */
export async function checkParkingQuota(orgId, currentParkingsCount) {
  const org = await getOrganization(orgId);
  if (!org) return { allowed: false, reason: "Organisation introuvable" };

  const max = org.subscription?.maxParkings || PLANS_CONFIG.starter.maxParkings;

  if (currentParkingsCount >= max) {
    return {
      allowed: false,
      current: currentParkingsCount,
      max,
      reason: `Limite de parkings atteinte (${currentParkingsCount}/${max}). Passez à l'offre supérieure.`,
    };
  }

  return { allowed: true, current: currentParkingsCount, max };
}
