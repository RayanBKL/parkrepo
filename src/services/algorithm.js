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
 * Assigne automatiquement la voie optimale pour un véhicule selon la stratégie choisie.
 * Stratégies :
 * - 'patience' : Patience Sorting pur (regroupement même heure + tri sans blocage)
 * - 'zoning' : Zonage aéroportuaire (Voies 1-30 découpées en zones court, moyen et long séjour)
 * - 'flight' : Priorité au regroupement par numéro de vol
 */
export function assignLane(lanes, capacity, vehicle, strategy = "patience") {
  const newTime = new Date(vehicle.departure).getTime();
  const now = new Date();
  const diffH = (newTime - now.getTime()) / 3_600_000;
  const laneCount = lanes.length;

  // 1. Stratégie : Priorité Vol (si le véhicule a un n° de vol)
  if (strategy === "flight" && vehicle.flightNumber) {
    const flightNorm = vehicle.flightNumber.trim().toUpperCase();
    let flightLane = -1;
    let flightFree = -1;

    lanes.forEach((lane, idx) => {
      const free = capacity - lane.length;
      if (free <= 0) return;
      const hasSameFlight = lane.some((v) => v.flightNumber && v.flightNumber.trim().toUpperCase() === flightNorm);
      if (hasSameFlight && free > flightFree) {
        flightFree = free;
        flightLane = idx;
      }
    });

    if (flightLane !== -1) {
      const lane = lanes[flightLane];
      let insertIndex = lane.findIndex((v) => new Date(v.departure).getTime() > newTime);
      if (insertIndex === -1) insertIndex = lane.length;
      return { laneIndex: flightLane, insertIndex, waiting: false, strategy: "flight_match" };
    }
  }

  // 2. Stratégie : Zonage Aéroportuaire
  let allowedRange = [0, laneCount - 1];
  if (strategy === "zoning") {
    if (diffH <= 24) {
      // Court séjour (< 24h) -> Premières voies (ex: tiers 1)
      allowedRange = [0, Math.max(0, Math.floor(laneCount * 0.35) - 1)];
    } else if (diffH <= 168) {
      // Moyen séjour (1 à 7j) -> Voies du milieu (ex: tiers 2)
      allowedRange = [Math.floor(laneCount * 0.35), Math.max(0, Math.floor(laneCount * 0.7) - 1)];
    } else {
      // Long séjour (> 7j) -> Dernières voies (ex: tiers 3)
      allowedRange = [Math.floor(laneCount * 0.7), laneCount - 1];
    }
  }

  // Helper pour vérifier si un idx de voie est dans la zone autorisée
  const isAllowed = (idx) => idx >= allowedRange[0] && idx <= allowedRange[1];

  // A. Priorité absolue : même heure exacte de départ
  let sameDateLane = -1;
  let sameDateFree = -1;

  lanes.forEach((lane, idx) => {
    if (strategy === "zoning" && !isAllowed(idx)) return;
    const free = capacity - lane.length;
    if (free <= 0) return;
    const hasSameDate = lane.some((v) => new Date(v.departure).getTime() === newTime);
    if (hasSameDate && free > sameDateFree) {
      sameDateFree = free;
      sameDateLane = idx;
    }
  });

  if (sameDateLane !== -1) {
    const lane = lanes[sameDateLane];
    let insertIndex = lane.findIndex((v) => new Date(v.departure).getTime() > newTime);
    if (insertIndex === -1) insertIndex = lane.length;
    return { laneIndex: sameDateLane, insertIndex, waiting: false, strategy: "same_date" };
  }

  // B. Cas optimal : voie dont le dernier véhicule (au fond) part AVANT ou EN MÊME TEMPS
  let bestLane = -1;
  let bestBackDeparture = -Infinity;
  let emptyLane = -1;

  lanes.forEach((lane, idx) => {
    if (strategy === "zoning" && !isAllowed(idx)) return;
    if (lane.length >= capacity) return;
    if (lane.length === 0) {
      if (emptyLane === -1) emptyLane = idx;
      return;
    }
    const backTime = new Date(lane[lane.length - 1].departure).getTime();
    if (backTime <= newTime && backTime > bestBackDeparture) {
      bestBackDeparture = backTime;
      bestLane = idx;
    }
  });

  if (bestLane !== -1) {
    return { laneIndex: bestLane, insertIndex: lanes[bestLane].length, waiting: false, strategy: "optimal_order" };
  }

  if (emptyLane !== -1) {
    return { laneIndex: emptyLane, insertIndex: 0, waiting: false, strategy: "empty_lane" };
  }

  // C. Repli 1 : essayer sur toutes les voies même hors zone si zonage était activé
  if (strategy === "zoning") {
    return assignLane(lanes, capacity, vehicle, "patience");
  }

  // D. Repli 2 : voie la plus dégagée
  let fallbackLane = -1;
  let mostFree = -1;

  lanes.forEach((lane, idx) => {
    const free = capacity - lane.length;
    if (free > 0 && free > mostFree) {
      mostFree = free;
      fallbackLane = idx;
    }
  });

  if (fallbackLane !== -1) {
    const lane = lanes[fallbackLane];
    let insertIndex = lane.findIndex((v) => new Date(v.departure).getTime() > newTime);
    if (insertIndex === -1) insertIndex = lane.length;
    return { laneIndex: fallbackLane, insertIndex, waiting: false, strategy: "fallback_sorted" };
  }

  // E. Aucune place
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
