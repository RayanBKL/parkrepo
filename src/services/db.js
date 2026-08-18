// ---------------------------------------------------------------------------
// Système de Base de Données Persistante & Évolutive (Multi-Parkings)
// ---------------------------------------------------------------------------

const STORAGE_KEY = "PARK_OPTIMIZER_DB_V2";
const BACKUP_KEY = "PARK_OPTIMIZER_DB_BACKUP";

// Données initiales par défaut si aucune base n'existe
const DEFAULT_STATE = {
  version: 2,
  activeParkingId: "parking_1",
  parkings: [
    {
      id: "parking_1",
      name: "Parc Principal (Alyse)",
      code: "PARK-LYON-01",
      description: "Parking principal avec 30 voies et 10 places par voie",
      laneCount: 30,
      capacity: 10,
      lanes: Array.from({ length: 30 }, () => []),
      waiting: [],
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  settings: {
    theme: "dark",
    autoBackup: true,
    alertHoursClose: 2,
    alertHoursMedium: 12,
    alertHoursFar: 48,
    soundAlerts: false,
  },
};

/**
 * Migration automatique pour garantir que l'ajout futur de fonctionnalités
 * ne détruit jamais les données existantes.
 */
function migrateData(raw) {
  if (!raw) return DEFAULT_STATE;
  try {
    let data = typeof raw === "string" ? JSON.parse(raw) : raw;

    // Si c'est un ancien format sans système multi-parkings (V1)
    if (!data.parkings || !Array.isArray(data.parkings)) {
      const oldLanes = data.lanes || Array.from({ length: 30 }, () => []);
      const oldWaiting = data.waiting || [];
      const oldHistory = data.history || [];

      data = {
        version: 2,
        activeParkingId: "parking_1",
        parkings: [
          {
            id: "parking_1",
            name: "Parc Principal",
            code: "PARK-01",
            description: "Parking migré automatiquement",
            laneCount: data.laneCount || 30,
            capacity: data.capacity || 10,
            lanes: oldLanes,
            waiting: oldWaiting,
            history: oldHistory,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        settings: { ...DEFAULT_STATE.settings, ...(data.settings || {}) },
      };
    }

    // Assurer que chaque parking a toutes les clés nécessaires
    data.parkings = data.parkings.map((p, idx) => ({
      id: p.id || `parking_${idx + 1}`,
      name: p.name || `Parking ${idx + 1}`,
      code: p.code || `PARK-${String(idx + 1).padStart(2, "0")}`,
      description: p.description || "",
      laneCount: Number(p.laneCount) || 30,
      capacity: Number(p.capacity) || 10,
      lanes: Array.isArray(p.lanes) ? p.lanes : Array.from({ length: p.laneCount || 30 }, () => []),
      waiting: Array.isArray(p.waiting) ? p.waiting : [],
      history: Array.isArray(p.history) ? p.history : [],
      createdAt: p.createdAt || new Date().toISOString(),
      updatedAt: p.updatedAt || new Date().toISOString(),
    }));

    if (!data.activeParkingId || !data.parkings.some((p) => p.id === data.activeParkingId)) {
      data.activeParkingId = data.parkings[0]?.id || "parking_1";
    }

    data.settings = { ...DEFAULT_STATE.settings, ...(data.settings || {}) };
    data.version = 2;
    return data;
  } catch (err) {
    console.error("Erreur lors de la migration des données :", err);
    return DEFAULT_STATE;
  }
}

/**
 * Charge les données depuis le stockage persistant
 */
export function loadDatabase() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveDatabase(DEFAULT_STATE);
      return DEFAULT_STATE;
    }
    return migrateData(raw);
  } catch (err) {
    console.error("Erreur de lecture de la base de données :", err);
    // Tentative de récupération depuis le backup
    try {
      const backup = localStorage.getItem(BACKUP_KEY);
      if (backup) return migrateData(backup);
    } catch {
      // ignore
    }
    return DEFAULT_STATE;
  }
}

/**
 * Sauvegarde synchrone et persistante dans la base de données
 */
export function saveDatabase(data) {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, serialized);
    // Création d'une sauvegarde de sécurité automatique
    if (data?.settings?.autoBackup !== false) {
      localStorage.setItem(BACKUP_KEY, serialized);
    }
    return true;
  } catch (err) {
    console.error("Erreur de sauvegarde dans la base de données :", err);
    return false;
  }
}

/**
 * Exporte l'intégralité de la base de données en fichier JSON téléchargeable
 */
export function exportDatabaseBackup(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `backup_parking_db_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Importe et restaure une base de données complète depuis un fichier JSON
 */
export function importDatabaseBackup(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    const migrated = migrateData(parsed);
    saveDatabase(migrated);
    return { success: true, data: migrated };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Enregistre un mouvement dans l'historique du parking actif
 */
export function logMovement(parking, type, details) {
  const entry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    type, // 'ENTRY', 'EXIT', 'MOVE', 'IMPORT', 'RESET'
    details,
  };
  return [entry, ...(parking.history || [])].slice(0, 1000); // Garde les 1000 derniers logs
}
