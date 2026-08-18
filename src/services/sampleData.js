// ---------------------------------------------------------------------------
// Données de Démonstration & Échantillon Alyse Parc Auto
// ---------------------------------------------------------------------------

import { generateVehicleId } from "./algorithm";

export const REAL_ALYSE_BOOKINGS = [
  ["CN-861-VW", "14/08/26", "16:54", "18/08/26", "15:15", "Peugeot 208"],
  ["AB-630-VQ", "11/08/26", "06:56", "18/08/26", "16:30", "Renault Clio"],
  ["CQ-554-BZ", "09/08/26", "16:00", "18/08/26", "16:45", "Citroën C3"],
  ["BQ-893-BG", "05/08/26", "04:24", "18/08/26", "17:50", "Volkswagen Golf"],
  ["MC-856-MP", "11/08/26", "11:08", "18/08/26", "17:50", "Toyota Yaris"],
  ["GW-164-LL", "06/08/26", "08:03", "18/08/26", "17:55", "Ford Fiesta"],
  ["GB-294-SJ", "08/08/26", "19:33", "18/08/26", "18:00", "Opel Corsa"],
  ["GR-784-DK", "08/08/26", "04:06", "18/08/26", "20:25", "Fiat 500"],
  ["GS-415-WY", "11/08/26", "12:39", "18/08/26", "21:35", "Dacia Sandero"],
  ["GY-059-WX", "13/08/26", "04:58", "18/08/26", "21:45", "BMW Série 1"],
  ["HL-122-LF", "14/08/26", "04:42", "18/08/26", "21:45", "Audi A3"],
  ["CL-224-DY", "09/08/26", "03:20", "18/08/26", "21:45", "Mercedes Classe A"],
  ["EG-926-AP", "08/08/26", "19:46", "18/08/26", "22:10", "Nissan Micra"],
  ["CZ-748-WR", "09/08/26", "04:53", "18/08/26", "22:45", "Kia Picanto"],
  ["AB-017-SG", "06/08/26", "04:21", "18/08/26", "22:45", "Hyundai i20"],
  ["HF-555-YM", "10/08/26", "18:12", "18/08/26", "23:45", "Peugeot 308"],
  ["FB-785-BG", "08/08/26", "17:54", "18/08/26", "23:55", "Renault Captur"],
  ["FY-852-MY", "08/08/26", "14:00", "18/08/26", "09:25", "Citroën C4"],
  ["CY-198-BG", "05/08/26", "12:39", "18/08/26", "09:40", "VW Polo"],
  ["GD-905-EC", "07/08/26", "19:52", "18/08/26", "09:40", "Toyota Corolla"],
  ["AR-468-PQ", "07/08/26", "04:00", "18/08/26", "10:30", "Ford Puma"],
  ["GA-548-YH", "04/08/26", "07:46", "18/08/26", "10:30", "Opel Mokka"],
  ["BZ-021-QL", "12/08/26", "09:21", "18/08/26", "11:15", "Fiat Panda"],
  ["EX-656-TN", "03/08/26", "14:56", "18/08/26", "11:45", "Dacia Duster"],
  ["GT-324-QS", "06/08/26", "10:17", "18/08/26", "12:10", "BMW Série 3"],
  ["DT-045-LP", "14/08/26", "11:17", "18/08/26", "12:30", "Audi Q3"],
  ["CM-200-AH", "08/08/26", "05:03", "18/08/26", "14:10", "Mercedes GLA"],
  ["FZ-741-RB", "11/08/26", "06:55", "18/08/26", "14:15", "Nissan Qashqai"],
  ["AR-060-KV", "07/08/26", "19:24", "18/08/26", "23:55", "Kia Sportage"],
  ["EQ-487-TS", "10/08/26", "04:41", "19/08/26", "09:30", "Hyundai Tucson"],
  ["CX-249-QG", "07/08/26", "10:01", "19/08/26", "10:20", "Peugeot 3008"],
  ["GZ-514-EM", "07/08/26", "04:03", "19/08/26", "11:55", "Renault Austral"],
  ["BB-751-PA", "03/08/26", "11:51", "19/08/26", "12:00", "Citroën C5 Aircross"],
  ["GW-955-BX", "12/08/26", "03:26", "19/08/26", "12:00", "VW Tiguan"],
  ["HB-500-VW", "12/08/26", "03:28", "19/08/26", "12:00", "Toyota RAV4"],
  ["FY-578-PW", "08/08/26", "10:01", "19/08/26", "12:00", "Ford Kuga"],
  ["GY-953-YA", "08/08/26", "18:57", "19/08/26", "12:15", "Opel Grandland"],
  ["GP-447-JV", "11/08/26", "13:11", "19/08/26", "14:40", "Tesla Model 3"],
];

const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const MODELS = [
  "Peugeot 208", "Renault Clio", "Citroën C3", "Volkswagen Golf", "Toyota Yaris",
  "Ford Fiesta", "Opel Corsa", "Fiat 500", "Dacia Sandero", "BMW Série 1",
  "Audi A3", "Mercedes Classe A", "Nissan Micra", "Kia Picanto", "Hyundai i20",
  "Tesla Model 3", "Peugeot 2008", "Renault Captur", "Toyota RAV4", "VW Tiguan"
];

function plateFromIndex(i) {
  const l1 = LETTERS[i % LETTERS.length];
  const l2 = LETTERS[Math.floor(i / LETTERS.length) % LETTERS.length];
  const l3 = LETTERS[Math.floor(i / (LETTERS.length ** 2)) % LETTERS.length];
  const num = String(((i * 37 + 101) % 900) + 100);
  return `${l1}${l2}-${num}-${l3}${LETTERS[(i * 7) % LETTERS.length]}`;
}

export function parseAlyseDate(dateStr, timeStr) {
  try {
    // Format DD/MM/YY ou DD/MM/YYYY
    const [d, m, y] = dateStr.split("/").map(Number);
    const [hh, mm] = timeStr.split(":").map(Number);
    const fullYear = y < 100 ? 2000 + y : y;
    const date = new Date(fullYear, m - 1, d, hh, mm, 0);
    return date.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export function generateSyntheticVehicles(count = 150) {
  const base = Date.now();
  const monthMs = 30 * 24 * 3_600_000;

  return Array.from({ length: count }, (_, i) => {
    const spread = (i / count) * monthMs;
    const jitter = (Math.random() - 0.5) * (monthMs / count) * 1.6;
    const minuteSlot = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
    const d = new Date(base + Math.max(10 * 60 * 1000, spread + jitter));
    d.setMinutes(minuteSlot, 0, 0);

    return {
      id: generateVehicleId(),
      plate: plateFromIndex(i),
      model: MODELS[i % MODELS.length],
      departure: d.toISOString(),
      arrivedAt: new Date(base - Math.random() * 5 * 24 * 3_600_000).toISOString(),
      flightNumber: Math.random() > 0.4 ? `AF${Math.floor(1000 + Math.random() * 8999)}` : "",
      phone: Math.random() > 0.5 ? `06 ${Math.floor(10 + Math.random() * 89)} ${Math.floor(10 + Math.random() * 89)} ${Math.floor(10 + Math.random() * 89)} ${Math.floor(10 + Math.random() * 89)}` : "",
      notes: "",
    };
  });
}

export function getAlyseSampleVehicles() {
  return REAL_ALYSE_BOOKINGS.map(([plate, arrDate, arrTime, depDate, depTime, model]) => ({
    id: generateVehicleId(),
    plate,
    model: model || "Véhicule Client",
    arrivedAt: parseAlyseDate(arrDate, arrTime),
    departure: parseAlyseDate(depDate, depTime),
    flightNumber: "",
    phone: "",
    notes: "Import Alyse",
  }));
}
