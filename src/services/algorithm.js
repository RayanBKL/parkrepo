// ---------------------------------------------------------------------------
// Algorithme de Placement Intelligent & Stratégies Aéroportuaires
// ---------------------------------------------------------------------------

let uidCounter = Date.now();

export function generateVehicleId() {
  return `V-${(uidCounter++).toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
}

export const fmtDateTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const fmtDateOnly = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
};

export const fmtTimeOnly = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const timeUntil = (iso, now = new Date()) => {
  if (!iso) return { label: "—", past: false, diffHours: 999 };
  const diffMs = new Date(iso).getTime() - now.getTime();
  const past = diffMs < 0;
  const abs = Math.abs(diffMs);
  const diffHours = diffMs / 3_600_000;
  const h = Math.floor(abs / 3_600_000);
  const m = Math.floor((abs % 3_600_000) / 60_000);

  let label;
  if (h >= 24) {
    const days = Math.floor(h / 24);
    const remH = h % 24;
    label = `${days}j ${remH}h`;
  } else if (h > 0) {
    label = `${h}h ${m}m`;
  } else {
    label = `${m} min`;
  }

  if (past) label = `+${label}`;

  return { label, past, diffHours };
};

// Urgence : rouge (<2h), jaune (<12h), vert (<48h), bleu (>48h), violet (dépassé)
export const getUrgencyStyle = (iso, now = new Date()) => {
  if (!iso) return { bg: "#3B5D74", border: "#2C4657", text: "#EAF1F5", badge: "Normal", color: "blue" };
  const diffMs = new Date(iso).getTime() - now.getTime();
  const diffH = diffMs / 3_600_000;

  if (diffMs < 0) {
    return {
      bg: "#7C3AED",
      border: "#6D28D9",
      text: "#FFFFFF",
      badge: "Dépassé",
      color: "purple",
    };
  }
  if (diffH <= 2) {
    return {
      bg: "#EF4444",
      border: "#DC2626",
      text: "#FFFFFF",
      badge: "< 2h (Imminent)",
      color: "red",
    };
  }
  if (diffH <= 12) {
    return {
      bg: "#F59E0B",
      border: "#D97706",
      text: "#18181B",
      badge: "< 12h (Aujourd'hui)",
      color: "amber",
    };
  }
  if (diffH <= 48) {
    return {
      bg: "#10B981",
      border: "#059669",
      text: "#064E3B",
      badge: "< 48h (Prochainement)",
      color: "emerald",
    };
  }
  return {
    bg: "#3B82F6",
    border: "#2563EB",
    text: "#EFF6FF",
    badge: "> 48h (Séjour long)",
    color: "blue",
  };
};

/**
 * Assigne automatiquement la voie optimale pour un véhicule.
 * Algorithme Expert : Tightest Fit Decreasing (Plus proche voisin chronologique) + Score Anti-Blocage
 * Optimisation mathématique pure (Zéro blocage + écart temporel minimal)
 */
export function assignLane(lanes, capacity, vehicle, strategy = "patience") {
  const departureStr =
    vehicle.departure ||
    (vehicle.departureDate && vehicle.departureTime
      ? `${vehicle.departureDate}T${vehicle.departureTime}`
      : vehicle.departureDate);
  const newTime = new Date(departureStr).getTime();
  const now = new Date();
  const laneCount = lanes.length;

  if (isNaN(newTime)) {
    return { laneIndex: -1, insertIndex: -1, waiting: true, strategy: "invalid_date" };
  }

  // Helper pour extraire le timestamp de n'importe quel véhicule
  const getVehicleTime = (v) => {
    if (!v) return NaN;
    const str = v.departure || (v.departureDate && v.departureTime ? `${v.departureDate}T${v.departureTime}` : v.departureDate);
    return new Date(str).getTime();
  };

  // -------------------------------------------------------------------------
  // ÉTAPE A : Recherche du "Tightest Fit" (ZÉRO BLOCAGE + Écart temporel minimal)
  // -------------------------------------------------------------------------
  // On cherche la voie dont le véhicule au fond part AVANT ou en même temps,
  // MAIS le plus PROCHE possible du nouveau véhicule pour compacter les vagues de sortie !
  let bestTightestLane = -1;
  let smallestGap = Infinity; // Écart en millisecondes le plus faible

  lanes.forEach((lane, idx) => {
    if (lane.length >= capacity || lane.length === 0) return;

    const backVehicle = lane[lane.length - 1];
    const backTime = getVehicleTime(backVehicle);

    // Condition Zéro Blocage : le véhicule au fond part avant ou en même temps
    if (!isNaN(backTime) && backTime <= newTime) {
      const gap = newTime - backTime;
      // On veut le gap le plus petit possible (ex: 2h d'écart plutôt que 5 jours)
      if (gap < smallestGap) {
        smallestGap = gap;
        bestTightestLane = idx;
      }
    }
  });

  if (bestTightestLane !== -1) {
    const isSameDate = smallestGap === 0;
    return {
      laneIndex: bestTightestLane,
      insertIndex: lanes[bestTightestLane].length,
      waiting: false,
      strategy: isSameDate ? "same_date" : "tightest_fit",
    };
  }

  // -------------------------------------------------------------------------
  // ÉTAPE B : Voie totalement vide (Préserve les voies pour démarrer de nouvelles vagues)
  // -------------------------------------------------------------------------
  let firstEmptyLane = -1;
  lanes.forEach((lane, idx) => {
    if (lane.length === 0 && firstEmptyLane === -1) {
      firstEmptyLane = idx;
    }
  });

  if (firstEmptyLane !== -1) {
    return { laneIndex: firstEmptyLane, insertIndex: 0, waiting: false, strategy: "empty_lane" };
  }

  // -------------------------------------------------------------------------
  // ÉTAPE C : Repli d'optimisation (Voie avec le moins de perturbation)
  // -------------------------------------------------------------------------
  // Si toutes les voies sont déjà occupées avec des départs futurs, on calcule
  // le coût de réorganisation pour choisir la voie causant le moins de gêne.
  let bestFallbackLane = -1;
  let minConflictCost = Infinity;

  lanes.forEach((lane, idx) => {
    const free = capacity - lane.length;
    if (free <= 0) return;

    // Calcul de l'indice d'insertion pour maintenir le tri
    let insertIdx = lane.findIndex((v) => getVehicleTime(v) > newTime);
    if (insertIdx === -1) insertIdx = lane.length;

    // Coût : nombre de véhicules à déplacer pour cette insertion
    const vehiclesBehind = lane.length - insertIdx;
    const cost = vehiclesBehind * 100 - free;

    if (cost < minConflictCost) {
      minConflictCost = cost;
      bestFallbackLane = idx;
    }
  });

  if (bestFallbackLane !== -1) {
    const lane = lanes[bestFallbackLane];
    let insertIndex = lane.findIndex((v) => new Date(v.departure).getTime() > newTime);
    if (insertIndex === -1) insertIndex = lane.length;
    return { laneIndex: bestFallbackLane, insertIndex, waiting: false, strategy: "min_cost_fallback" };
  }

  // -------------------------------------------------------------------------
  // ÉTAPE D : Parc saturé -> File d'attente
  // -------------------------------------------------------------------------
  return { laneIndex: -1, insertIndex: -1, waiting: true, strategy: "waiting_queue" };
}

// ===========================================================================
// MODÈLES DE PARKING PHYSIQUES
// ===========================================================================

/**
 * Constantes des modèles de parking physiques.
 * Chaque parking peut avoir son propre modèle.
 */
export const PARKING_MODELS = {
  TIGHTEST_FIT: "tightest_fit", // Ancien système (rétrocompat) — tri chronologique optimisé
  LIFO: "lifo",                 // Enfilade / Cul-de-sac — Last In First Out
  FIFO: "fifo",                 // Couloir traversant — First In First Out (2 sorties)
  BIDIR: "bidir",               // Bidirectionnel — 2 accès, sortie du côté le moins bloqué
};

// ---------------------------------------------------------------------------
// LIFO — Enfilade (Dead-end / Stack)
// Convention : index 0 = SORTIE. La dernière voiture entrée est en position 0.
// Pour récupérer une voiture profonde, toutes celles au-dessus doivent partir d'abord.
// ---------------------------------------------------------------------------

/**
 * LIFO : insère la voiture en tête de voie (index 0 = sortie).
 * Choisit la voie avec le plus de places libres pour minimiser les empilements futurs.
 */
export function assignLaneLIFO(lanes, capacity, vehicle) {
  // Cherche la voie non pleine avec le moins de véhicules (la plus vide) → moins de blocages futurs
  let bestLane = -1;
  let fewestCars = Infinity;

  lanes.forEach((lane, idx) => {
    if (lane.length < capacity && lane.length < fewestCars) {
      fewestCars = lane.length;
      bestLane = idx;
    }
  });

  if (bestLane === -1) {
    return { laneIndex: -1, insertIndex: -1, waiting: true, strategy: "lifo_full" };
  }

  // En LIFO, on insère TOUJOURS en position 0 (tête = sortie)
  return { laneIndex: bestLane, insertIndex: 0, waiting: false, strategy: "lifo" };
}

/**
 * LIFO : calcule le plan de récupération.
 * Toutes les voitures de position 0..targetPos-1 bloquent la voiture cible.
 * Elles doivent être déplacées dans d'autres voies (elles-mêmes en position 0).
 */
export function getRetrievalPlanLIFO(parking, vehicleId) {
  const lanes = parking.lanes || [];
  const capacity = parking.capacity || 10;

  let targetLaneIdx = -1;
  let targetPosIdx = -1;
  let targetVehicle = null;

  lanes.forEach((lane, li) => {
    lane.forEach((v, pi) => {
      if (v.id === vehicleId || v.plate?.toUpperCase() === vehicleId?.toUpperCase()) {
        targetLaneIdx = li;
        targetPosIdx = pi;
        targetVehicle = v;
      }
    });
  });

  if (!targetVehicle) return null;

  // Véhicules bloquants : positions 0 .. targetPosIdx - 1
  const steps = [];
  for (let i = 0; i < targetPosIdx; i++) {
    const blocker = lanes[targetLaneIdx][i];
    // Trouver une voie d'accueil (on prend la plus vide, insère en tête)
    let destLane = -1;
    let fewest = Infinity;
    lanes.forEach((lane, idx) => {
      if (idx !== targetLaneIdx && lane.length < capacity && lane.length < fewest) {
        fewest = lane.length;
        destLane = idx;
      }
    });
    steps.push({
      step: i + 1,
      type: "MOVE_BLOCKING",
      vehicle: blocker,
      fromLaneIndex: targetLaneIdx,
      fromSlotIndex: i,
      toLaneIndex: destLane,
      description: `Sortir temporairement ${blocker.plate} (${blocker.model || "Véhicule"}) → ${destLane !== -1 ? `Voie ${destLane + 1}` : "Parking externe"}`,
    });
  }

  steps.push({
    step: steps.length + 1,
    type: "RETRIEVE_TARGET",
    vehicle: targetVehicle,
    fromLaneIndex: targetLaneIdx,
    fromSlotIndex: targetPosIdx,
    toLaneIndex: null,
    description: `Récupérer et sortir ${targetVehicle.plate} — voie dégagée`,
  });

  return {
    model: "lifo",
    targetVehicle,
    targetLaneIndex: targetLaneIdx,
    targetSlotIndex: targetPosIdx,
    isDirect: targetPosIdx === 0,
    movesCount: targetPosIdx,
    steps,
  };
}

// ---------------------------------------------------------------------------
// FIFO — Drive-Through (Couloir traversant, 2 ouvertures)
// Convention : les voitures entrent par la QUEUE (fin), sortent par la TÊTE (index 0).
// Aucun blocage possible : la première voiture entrée est toujours en tête.
// ---------------------------------------------------------------------------

/**
 * FIFO : insère la voiture en queue de voie (fin = côté entrée).
 * Choisit la voie avec le moins de véhicules.
 */
export function assignLaneFIFO(lanes, capacity, vehicle) {
  let bestLane = -1;
  let fewestCars = Infinity;

  lanes.forEach((lane, idx) => {
    if (lane.length < capacity && lane.length < fewestCars) {
      fewestCars = lane.length;
      bestLane = idx;
    }
  });

  if (bestLane === -1) {
    return { laneIndex: -1, insertIndex: -1, waiting: true, strategy: "fifo_full" };
  }

  // En FIFO, on insère TOUJOURS en fin de voie
  return { laneIndex: bestLane, insertIndex: lanes[bestLane].length, waiting: false, strategy: "fifo" };
}

/**
 * FIFO : pas de blocage possible — la voiture en position 0 sort toujours directement.
 */
export function getRetrievalPlanFIFO(parking, vehicleId) {
  const lanes = parking.lanes || [];

  let targetLaneIdx = -1;
  let targetPosIdx = -1;
  let targetVehicle = null;

  lanes.forEach((lane, li) => {
    lane.forEach((v, pi) => {
      if (v.id === vehicleId || v.plate?.toUpperCase() === vehicleId?.toUpperCase()) {
        targetLaneIdx = li;
        targetPosIdx = pi;
        targetVehicle = v;
      }
    });
  });

  if (!targetVehicle) return null;

  // En FIFO, seule la voiture en position 0 peut sortir par la tête.
  // Si la voiture n'est pas en position 0, elle n'est pas encore accessible par la sortie.
  // Elle sortira naturellement quand les voitures devant elle seront sorties.
  const isAccessible = targetPosIdx === 0;

  const steps = [];
  if (!isAccessible) {
    steps.push({
      step: 1,
      type: "INFO",
      vehicle: null,
      description: `En mode Drive-Through, ${targetVehicle.plate} sortira automatiquement après les ${targetPosIdx} véhicule(s) entrés avant elle. Aucune manœuvre requise.`,
    });
  }

  steps.push({
    step: steps.length + 1,
    type: "RETRIEVE_TARGET",
    vehicle: targetVehicle,
    fromLaneIndex: targetLaneIdx,
    fromSlotIndex: targetPosIdx,
    toLaneIndex: null,
    description: isAccessible
      ? `Récupérer ${targetVehicle.plate} — en tête de couloir, sortie directe`
      : `${targetVehicle.plate} sera disponible en sortie après ${targetPosIdx} départ(s)`,
  });

  return {
    model: "fifo",
    targetVehicle,
    targetLaneIndex: targetLaneIdx,
    targetSlotIndex: targetPosIdx,
    isDirect: isAccessible,
    movesCount: 0, // jamais de manœuvres en FIFO
    steps,
  };
}

// ---------------------------------------------------------------------------
// BIDIRECTIONNEL — Double accès (Porte A = index 0, Porte B = index fin)
// On peut entrer/sortir des deux côtés.
// L'algorithme choisit le côté qui minimise les blocages futurs.
// ---------------------------------------------------------------------------

/**
 * BIDIR : calcule le coût d'insertion des deux côtés et choisit le meilleur.
 * "Côté A" = index 0 (tête), "Côté B" = dernier index (queue).
 */
export function assignLaneBidir(lanes, capacity, vehicle) {
  const getVehicleTime = (v) => {
    if (!v) return NaN;
    const str = v.departure || (v.departureDate && v.departureTime ? `${v.departureDate}T${v.departureTime}` : v.departureDate);
    return new Date(str).getTime();
  };
  const newTime = getVehicleTime(vehicle);

  let bestLane = -1;
  let bestSide = "A"; // "A" = tête (index 0), "B" = queue (index fin)
  let minBlockingCost = Infinity;

  lanes.forEach((lane, idx) => {
    if (lane.length >= capacity) return;

    /**
     * En bidirectionnel, si on insère côté A (index 0) :
     *   - Les blocages = toutes les voitures déjà côté A (1ère moitié) qui partent APRÈS nous
     *     (car elles seront devant nous, et on devra les sortir par A avant d'accéder à nous)
     * Si on insère côté B (index fin) :
     *   - Les blocages = toutes les voitures déjà côté B (2ème moitié) qui partent APRÈS nous
     */
    const half = Math.floor(lane.length / 2);
    // Côté A : on pose la voiture en index 0, les "blocants" futurs sont ceux de la 1ère moitié qui partent après
    const costSideA = lane.slice(0, half + 1).filter((v) => {
      const t = getVehicleTime(v);
      return !isNaN(t) && t > newTime;
    }).length;
    // Côté B : on pose la voiture en fin, les "blocants" futurs sont ceux de la 2ème moitié qui partent après
    const costSideB = lane.slice(half).filter((v) => {
      const t = getVehicleTime(v);
      return !isNaN(t) && t > newTime;
    }).length;

    const minCost = Math.min(costSideA, costSideB);
    const side = costSideA <= costSideB ? "A" : "B";

    if (minCost < minBlockingCost || (minCost === minBlockingCost && bestLane === -1)) {
      minBlockingCost = minCost;
      bestLane = idx;
      bestSide = side;
    }
  });

  if (bestLane === -1) {
    // Aucune voie non-pleine — chercher juste la première non-pleine
    const fallback = lanes.findIndex((l) => l.length < capacity);
    if (fallback === -1) return { laneIndex: -1, insertIndex: -1, waiting: true, strategy: "bidir_full" };
    bestLane = fallback;
    bestSide = "A";
  }

  const insertIndex = bestSide === "A" ? 0 : lanes[bestLane].length;
  return { laneIndex: bestLane, insertIndex, waiting: false, strategy: `bidir_${bestSide.toLowerCase()}`, side: bestSide };
}

/**
 * BIDIR : calcule le plan de récupération (sortie par le côté le moins bloqué).
 */
export function getRetrievalPlanBidir(parking, vehicleId) {
  const lanes = parking.lanes || [];
  const capacity = parking.capacity || 10;

  let targetLaneIdx = -1;
  let targetPosIdx = -1;
  let targetVehicle = null;

  lanes.forEach((lane, li) => {
    lane.forEach((v, pi) => {
      if (v.id === vehicleId || v.plate?.toUpperCase() === vehicleId?.toUpperCase()) {
        targetLaneIdx = li;
        targetPosIdx = pi;
        targetVehicle = v;
      }
    });
  });

  if (!targetVehicle) return null;

  const lane = lanes[targetLaneIdx] || [];
  const laneLen = lane.length;

  // Blocages côté A (index 0) : véhicules de 0..targetPosIdx-1
  const blockersA = lane.slice(0, targetPosIdx);
  // Blocages côté B (fin) : véhicules de targetPosIdx+1..fin
  const blockersB = lane.slice(targetPosIdx + 1);

  const useSideA = blockersA.length <= blockersB.length;
  const blockers = useSideA ? blockersA : blockersB;
  const sideLabel = useSideA ? "A (avant)" : "B (arrière)";

  const steps = [];
  blockers.forEach((blocker, i) => {
    let destLane = -1;
    let fewest = Infinity;
    lanes.forEach((l, idx) => {
      if (idx !== targetLaneIdx && l.length < capacity && l.length < fewest) {
        fewest = l.length;
        destLane = idx;
      }
    });
    steps.push({
      step: i + 1,
      type: "MOVE_BLOCKING",
      vehicle: blocker,
      fromLaneIndex: targetLaneIdx,
      fromSlotIndex: useSideA ? i : targetPosIdx + 1 + i,
      toLaneIndex: destLane,
      description: `Sortir temporairement ${blocker.plate} par Porte ${sideLabel} → ${destLane !== -1 ? `Voie ${destLane + 1}` : "Parking externe"}`,
    });
  });

  steps.push({
    step: steps.length + 1,
    type: "RETRIEVE_TARGET",
    vehicle: targetVehicle,
    fromLaneIndex: targetLaneIdx,
    fromSlotIndex: targetPosIdx,
    toLaneIndex: null,
    description: `Récupérer ${targetVehicle.plate} par Porte ${sideLabel}`,
  });

  return {
    model: "bidir",
    targetVehicle,
    targetLaneIndex: targetLaneIdx,
    targetSlotIndex: targetPosIdx,
    isDirect: blockers.length === 0,
    movesCount: blockers.length,
    usedSide: useSideA ? "A" : "B",
    steps,
  };
}

// ---------------------------------------------------------------------------
// DISPATCHER — Sélectionne l'algorithme selon le modèle du parking
// ---------------------------------------------------------------------------

/**
 * Assigne un véhicule selon le modèle physique du parking.
 * @param {Array[]} lanes - tableau de voies
 * @param {number} capacity - capacité par voie
 * @param {Object} vehicle - le véhicule à placer
 * @param {string} model - le modèle physique du parking (PARKING_MODELS)
 * @param {string} strategy - stratégie Tightest Fit si model="tightest_fit"
 */
export function assignVehicleToParking(lanes, capacity, vehicle, model = PARKING_MODELS.LIFO, strategy = "patience") {
  switch (model) {
    case PARKING_MODELS.FIFO:
      return assignLaneFIFO(lanes, capacity, vehicle);
    case PARKING_MODELS.BIDIR:
      return assignLaneBidir(lanes, capacity, vehicle);
    case PARKING_MODELS.TIGHTEST_FIT:
      return assignLane(lanes, capacity, vehicle, strategy);
    case PARKING_MODELS.LIFO:
    default:
      return assignLaneLIFO(lanes, capacity, vehicle);
  }
}

/**
 * Calcule le plan de récupération selon le modèle physique du parking.
 * @param {Object} parking - objet parking complet (avec .model, .lanes, .capacity)
 * @param {string} vehicleId - ID ou plaque du véhicule à récupérer
 */
export function getRetrievalPlan(parking, vehicleId) {
  const model = parking?.model || PARKING_MODELS.LIFO;
  switch (model) {
    case PARKING_MODELS.FIFO:
      return getRetrievalPlanFIFO(parking, vehicleId);
    case PARKING_MODELS.BIDIR:
      return getRetrievalPlanBidir(parking, vehicleId);
    case PARKING_MODELS.TIGHTEST_FIT:
      return calculateRetrievalPlan(parking, vehicleId); // ancien système
    case PARKING_MODELS.LIFO:
    default:
      return getRetrievalPlanLIFO(parking, vehicleId);
  }
}

/**
 * Réorganise et distribue l'ensemble des véhicules
 */
export function redistributeAllVehicles(vehicles, laneCount, capacity, strategy = "patience") {
  // Trier tous les véhicules par date de départ chronologique
  const sorted = [...vehicles].sort((a, b) => new Date(a.departure) - new Date(b.departure));
  
  const lanes = Array.from({ length: laneCount }, () => []);
  const overflow = [];

  sorted.forEach((vehicle) => {
    const result = assignLane(lanes, capacity, vehicle, strategy);
    if (!result.waiting && result.laneIndex !== -1) {
      lanes[result.laneIndex].splice(result.insertIndex, 0, vehicle);
    } else {
      overflow.push(vehicle);
    }
  });

  return { lanes, waiting: overflow };
}

/**
 * Vérifie les conflits de blocage dans une voie
 */
export function checkLaneConflicts(lane) {
  const conflicts = [];
  for (let i = 0; i < lane.length - 1; i++) {
    const current = new Date(lane[i].departure).getTime();
    const behind = new Date(lane[i + 1].departure).getTime();
    if (behind < current) {
      conflicts.push({
        blockedIndex: i + 1,
        blockedVehicle: lane[i + 1],
        blockingIndex: i,
        blockingVehicle: lane[i],
      });
    }
  }
  return conflicts;
}

/**
 * Calcule le plan de récupération optimisé pour sortir un véhicule donné.
 * Détecte les véhicules bloquants et détermine l'ordre exact de déplacement.
 */
export function calculateRetrievalPlan(parking, vehicleId) {
  if (!parking || !parking.lanes || !vehicleId) return null;

  let targetLaneIndex = -1;
  let targetSlotIndex = -1;
  let targetVehicle = null;

  parking.lanes.forEach((lane, lIdx) => {
    lane.forEach((v, sIdx) => {
      if (v.id === vehicleId || v.plate?.toUpperCase() === vehicleId?.toUpperCase()) {
        targetLaneIndex = lIdx;
        targetSlotIndex = sIdx;
        targetVehicle = v;
      }
    });
  });

  if (!targetVehicle) return null;

  const currentLane = parking.lanes[targetLaneIndex] || [];
  
  // Dans une voie enfilade, les véhicules situés aux indices 0 .. targetSlotIndex - 1 bloquent la sortie
  const blockingVehicles = [];
  for (let i = 0; i < targetSlotIndex; i++) {
    const blockingV = currentLane[i];
    if (blockingV) {
      // Trouver la meilleure voie d'accueil temporaire ou définitive pour ce véhicule
      const simulatedLanes = parking.lanes.map((l, idx) => (idx === targetLaneIndex ? l.slice(i + 1) : [...l]));
      const destAssignment = assignLane(simulatedLanes, parking.capacity || 10, blockingV, "patience");
      
      blockingVehicles.push({
        slotIndex: i,
        vehicle: blockingV,
        suggestedLaneIndex: destAssignment.laneIndex !== -1 ? destAssignment.laneIndex : null,
      });
    }
  }

  const movesCount = blockingVehicles.length;
  const isDirect = movesCount === 0;

  // Étapes de récupération
  const steps = [];
  blockingVehicles.forEach((item, stepNum) => {
    steps.push({
      step: stepNum + 1,
      type: "MOVE_BLOCKING",
      vehicle: item.vehicle,
      fromLaneIndex: targetLaneIndex,
      fromSlotIndex: item.slotIndex,
      toLaneIndex: item.suggestedLaneIndex,
      description: `Déplacer ${item.vehicle.plate} (${item.vehicle.model || "Véhicule"}) vers une voie dégagée`,
    });
  });

  steps.push({
    step: steps.length + 1,
    type: "RETRIEVE_TARGET",
    vehicle: targetVehicle,
    fromLaneIndex: targetLaneIndex,
    fromSlotIndex: targetSlotIndex,
    description: `Récupérer et sortir ${targetVehicle.plate} (Voie maintenant libre)`,
  });

  return {
    targetVehicle,
    targetLaneIndex,
    targetSlotIndex,
    isDirect,
    movesCount,
    blockingVehicles,
    steps,
  };
}

