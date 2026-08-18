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
    priceMonthly: 79,
    priceAnnually: 69,
    maxParkings: 1,
    maxUsers: 5,
    maxVehicles: 500,
    features: [
      "1 Parking géré",
      "Jusqu'à 5 utilisateurs",
      "Algorithme Tightest Fit & Grille 2D",
      "Planning des Départs & Arrivées",
      "Module Récupération Optimisée",
      "Historique & Journal d'activité (30j)",
      "Support standard par email",
    ],
  },
  business: {
    id: "business",
    name: "Business",
    priceMonthly: 199,
    priceAnnually: 169,
    maxParkings: 3,
    maxUsers: 15,
    maxVehicles: 2500,
    popular: true,
    features: [
      "Jusqu'à 3 Parkings",
      "Jusqu'à 15 utilisateurs",
      "Tous les algorithmes d'optimisation",
      "Récupération pas-à-pas assistée",
      "Gestion d'équipe & Rôles RBAC avancés",
      "Historique & Audit log illimité",
      "Statistiques & Analytics avancés",
      "Support prioritaire 7j/7",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceMonthly: 449,
    priceAnnually: 389,
    maxParkings: 999,
    maxUsers: 999,
    maxVehicles: 99999,
    features: [
      "Parkings & Utilisateurs illimités",
      "Multi-sites aéroportuaires dédiés",
      "Optimisation de flotte sur-mesure",
      "Accès API & Webhooks",
      "Export comptable & rapports personnalisés",
      "Gestionnaire de compte dédié",
      "SLA garanti 99.9%",
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
  ownerId,
  plan = "business",
}) {
  const orgId = `org_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const planConfig = PLANS_CONFIG[plan] || PLANS_CONFIG.business;

  const orgData = {
    id: orgId,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone.trim(),
    address: address.trim(),
    ownerId,
    subscription: {
      plan: planConfig.id,
      status: "active", // "trialing" | "active" | "past_due" | "canceled"
      maxParkings: planConfig.maxParkings,
      maxUsers: planConfig.maxUsers,
      maxVehicles: planConfig.maxVehicles,
      renewsAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
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
      return snap.data();
    }
  } catch (err) {
    console.warn("Could not fetch organization:", err);
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
