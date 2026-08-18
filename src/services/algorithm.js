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
 *
 * Stratégies :
 * - 'patience' : Optimisation mathématique pure (Zéro blocage + écart temporel minimal)
 * - 'zoning' : Zonage aéroportuaire par durée de séjour (Court <24h / Moyen 1-7j / Long >7j)
 * - 'flight' : Priorité au regroupement par numéro de vol si renseigné
 */
export function assignLane(lanes, capacity, vehicle, strategy = "patience") {
  const newTime = new Date(vehicle.departure).getTime();
  const now = new Date();
  const diffH = (newTime - now.getTime()) / 3_600_000;
  const laneCount = lanes.length;

  if (isNaN(newTime)) {
    return { laneIndex: -1, insertIndex: -1, waiting: true, strategy: "invalid_date" };
  }

  // 1. Stratégie Optionnelle : Regroupement par Vol (si renseigné)
  if (strategy === "flight" && vehicle.flightNumber) {
    const flightNorm = vehicle.flightNumber.trim().toUpperCase();
    let bestFlightLane = -1;
    let maxFreeInFlight = -1;

    lanes.forEach((lane, idx) => {
      const free = capacity - lane.length;
      if (free <= 0) return;
      const hasSameFlight = lane.some((v) => v.flightNumber && v.flightNumber.trim().toUpperCase() === flightNorm);
      if (hasSameFlight && free > maxFreeInFlight) {
        maxFreeInFlight = free;
        bestFlightLane = idx;
      }
    });

    if (bestFlightLane !== -1) {
      const lane = lanes[bestFlightLane];
      let insertIndex = lane.findIndex((v) => new Date(v.departure).getTime() > newTime);
      if (insertIndex === -1) insertIndex = lane.length;
      return { laneIndex: bestFlightLane, insertIndex, waiting: false, strategy: "flight_match" };
    }
  }

  // 2. Définition de la plage de voies si Zonage activé
  let allowedRange = [0, laneCount - 1];
  if (strategy === "zoning") {
    if (diffH <= 24) {
      allowedRange = [0, Math.max(0, Math.floor(laneCount * 0.35) - 1)];
    } else if (diffH <= 168) {
      allowedRange = [Math.floor(laneCount * 0.35), Math.max(0, Math.floor(laneCount * 0.7) - 1)];
    } else {
      allowedRange = [Math.floor(laneCount * 0.7), laneCount - 1];
    }
  }

  const isAllowed = (idx) => idx >= allowedRange[0] && idx <= allowedRange[1];

  // -------------------------------------------------------------------------
  // ÉTAPE A : Recherche du "Tightest Fit" (ZÉRO BLOCAGE + Écart temporel minimal)
  // -------------------------------------------------------------------------
  // On cherche la voie dont le véhicule au fond part AVANT ou en même temps,
  // MAIS le plus PROCHE possible du nouveau véhicule pour compacter les vagues de sortie !
  let bestTightestLane = -1;
  let smallestGap = Infinity; // Écart en millisecondes le plus faible

  lanes.forEach((lane, idx) => {
    if (strategy === "zoning" && !isAllowed(idx)) return;
    if (lane.length >= capacity || lane.length === 0) return;

    const backVehicle = lane[lane.length - 1];
    const backTime = new Date(backVehicle.departure).getTime();

    // Condition Zéro Blocage : le véhicule au fond part avant ou en même temps
    if (backTime <= newTime) {
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
    if (strategy === "zoning" && !isAllowed(idx)) return;
    if (lane.length === 0 && firstEmptyLane === -1) {
      firstEmptyLane = idx;
    }
  });

  if (firstEmptyLane !== -1) {
    return { laneIndex: firstEmptyLane, insertIndex: 0, waiting: false, strategy: "empty_lane" };
  }

  // Si zonage strict n'a rien trouvé, on réessaie sur l'ensemble du parc
  if (strategy === "zoning") {
    return assignLane(lanes, capacity, vehicle, "patience");
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
    let insertIdx = lane.findIndex((v) => new Date(v.departure).getTime() > newTime);
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
