// ---------------------------------------------------------------------------
// Service Import / Export Excel (.xlsx / .csv)
// ---------------------------------------------------------------------------

import * as XLSX from "xlsx";
import { generateVehicleId, fmtDateTime } from "./algorithm";
import { getLaneName } from "./cloudDb";

const COLUMN_HINTS = {
  plate: /plaque|immatricul|plate|registration|immat/i,
  model: /mod[eè]le|marque|model|v[eé]hicule|vehicule/i,
  departureDate: /date.*(d[eé]part|sortie|retour|fin)/i,
  departureTime: /heure.*(d[eé]part|sortie|retour|fin)/i,
  departureFull: /d[eé]part|departure|sortie|retour/i,
  arrivedDate: /date.*(arriv[eé]e|d[eé]pose|d[eé]but)/i,
  arrivedTime: /heure.*(arriv[eé]e|d[eé]pose|d[eé]but)/i,
  flight: /vol|flight|n.*vol/i,
  phone: /tel|t[eé]l[eé]phone|phone|contact/i,
  client: /client|nom|passager|nom.*client/i,
};

function findColumn(headers, regex) {
  return headers.find((h) => regex.test(h));
}

export function parseExcelFile(arrayBuffer) {
  try {
    const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return { success: false, error: "Le fichier Excel est vide ou illisible." };
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    if (rows.length === 0) {
      return { success: false, error: "La première feuille ne contient aucune ligne." };
    }

    const headers = Object.keys(rows[0]);
    const plateCol = findColumn(headers, COLUMN_HINTS.plate);
    const modelCol = findColumn(headers, COLUMN_HINTS.model);
    const depCol = findColumn(headers, COLUMN_HINTS.departureFull);
    const flightCol = findColumn(headers, COLUMN_HINTS.flight);
    const phoneCol = findColumn(headers, COLUMN_HINTS.phone);
    const clientCol = findColumn(headers, COLUMN_HINTS.client);

    if (!plateCol) {
      return {
        success: false,
        error: `Impossible de trouver une colonne 'Plaque' ou 'Immatriculation'. Colonnes détectées : ${headers.join(", ")}`,
        headers,
      };
    }

    const vehicles = [];
    let skipped = 0;

    rows.forEach((row, idx) => {
      const rawPlate = String(row[plateCol] || "").trim();
      if (!rawPlate) {
        skipped++;
        return;
      }

      // Traitement date de départ
      let departureIso = "";
      if (depCol && row[depCol]) {
        const rawDep = row[depCol];
        const d = rawDep instanceof Date ? rawDep : new Date(rawDep);
        if (!isNaN(d.getTime())) {
          departureIso = d.toISOString();
        }
      }

      if (!departureIso) {
        // Définir par défaut à J+3 si non précisé
        const defaultD = new Date(Date.now() + 3 * 24 * 3600 * 1000);
        defaultD.setHours(12, 0, 0, 0);
        departureIso = defaultD.toISOString();
      }

      vehicles.push({
        id: generateVehicleId(),
        plate: rawPlate.toUpperCase().replace(/\s+/g, "-"),
        model: modelCol && row[modelCol] ? String(row[modelCol]).trim() : "Non spécifié",
        departure: departureIso,
        arrivedAt: new Date().toISOString(),
        flightNumber: flightCol && row[flightCol] ? String(row[flightCol]).trim() : "",
        phone: phoneCol && row[phoneCol] ? String(row[phoneCol]).trim() : "",
        client: clientCol && row[clientCol] ? String(row[clientCol]).trim() : "",
        notes: `Importé ligne ${idx + 2}`,
      });
    });

    return {
      success: true,
      vehicles,
      totalRows: rows.length,
      skipped,
      headers,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Exporte l'ensemble des véhicules actuels du parking vers un classeur Excel
 */
export function exportParkingToExcel(parking) {
  const data = [];

  // Véhicules dans les voies
  parking.lanes.forEach((lane, laneIdx) => {
    lane.forEach((v, pos) => {
      data.push({
        Statut: "En Parc",
        Voie: getLaneName(laneIdx, parking),
        Position: pos + 1 === 1 ? "1 (Sortie)" : `${pos + 1}`,
        Immatriculation: v.plate,
        Modèle: v.model || "—",
        "Date Départ": fmtDateTime(v.departure),
        "Date Arrivée": fmtDateTime(v.arrivedAt),
        "N° Vol": v.flightNumber || "—",
        Téléphone: v.phone || "—",
        Notes: v.notes || "",
      });
    });
  });

  // Véhicules en attente
  (parking.waiting || []).forEach((v, idx) => {
    data.push({
      Statut: "File d'attente",
      Voie: "En Attente",
      Position: idx + 1,
      Immatriculation: v.plate,
      Modèle: v.model || "—",
      "Date Départ": fmtDateTime(v.departure),
      "Date Arrivée": fmtDateTime(v.arrivedAt),
      "N° Vol": v.flightNumber || "—",
      Téléphone: v.phone || "—",
      Notes: v.notes || "",
    });
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Parc Actuel");

  // Feuille Historique
  if (parking.history && parking.history.length > 0) {
    const histData = parking.history.map((h) => ({
      Date: fmtDateTime(h.timestamp),
      Type: h.type,
      Détails: JSON.stringify(h.details || {}),
    }));
    const wsHist = XLSX.utils.json_to_sheet(histData);
    XLSX.utils.book_append_sheet(wb, wsHist, "Historique");
  }

  XLSX.writeFile(wb, `${parking.name.replace(/\s+/g, "_")}_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
