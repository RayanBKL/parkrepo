import React, { useState } from "react";
import {
  Clock,
  Car,
  Plane,
  Phone,
  Printer,
  Search,
  Calendar,
} from "lucide-react";
import { fmtDateOnly, fmtTimeOnly, timeUntil, getUrgencyStyle } from "../services/algorithm";
import { getLaneName } from "../services/cloudDb";

export default function DeparturesSchedule({
  parking,
  onExitVehicle,
  onMoveVehicle,
  onPrintTicket,
  onEditVehicle,
}) {
  const [scheduleFilter, setScheduleFilter] = useState("all"); // '2h', 'today', 'tomorrow', 'week', 'all'
  const [query, setQuery] = useState("");

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  // Aplatir tous les véhicules avec leur voie et position
  const allVehicles = [];
  (parking.lanes || []).forEach((lane, laneIdx) => {
    lane.forEach((vehicle, slotIdx) => {
      allVehicles.push({
        ...vehicle,
        laneIndex: laneIdx,
        slotIndex: slotIdx,
        isHead: slotIdx === 0,
      });
    });
  });

  // Trier chronologiquement par date de départ
  allVehicles.sort((a, b) => new Date(a.departure) - new Date(b.departure));

  // Filtrer selon la recherche et le filtre temporel
  const filteredList = allVehicles.filter((v) => {
    const q = query.trim().toLowerCase();
    const laneName = getLaneName(v.laneIndex, parking).toLowerCase();
    const matchQuery =
      !q ||
      v.plate.toLowerCase().includes(q) ||
      (v.model && v.model.toLowerCase().includes(q)) ||
      (v.flightNumber && v.flightNumber.toLowerCase().includes(q)) ||
      `voie ${v.laneIndex + 1}`.includes(q) ||
      laneName.includes(q);

    if (!matchQuery) return false;

    const depDate = new Date(v.departure);
    const depDateStr = !isNaN(depDate.getTime()) ? depDate.toISOString().slice(0, 10) : "";
    const diffH = (depDate.getTime() - now.getTime()) / 3_600_000;

    if (scheduleFilter === "2h") return diffH <= 2;
    if (scheduleFilter === "today") return depDateStr === todayStr || diffH <= 12;
    if (scheduleFilter === "tomorrow") return depDateStr === tomorrowStr;
    if (scheduleFilter === "week") return diffH <= 168; // 7 jours
    return true;
  });

  const handlePrintSchedule = () => {
    window.print();
  };

  return (
    <div className="departures-schedule space-y-4 pb-12 animate-in fade-in duration-150">
      {/* Barre d'outils et filtres du planning */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <Calendar size={20} />
          </div>
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              Feuille de Route Départs — Planning Voituriers
            </h2>
            <p className="text-xs text-slate-400">
              Ordre chronologique précis des sorties prévues pour le service voiturier
            </p>
          </div>
        </div>

        {/* Filtres de période */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrer plaque, vol..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            onClick={() => setScheduleFilter("2h")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              scheduleFilter === "2h"
                ? "bg-rose-500/30 text-rose-200 border-rose-400 font-bold ring-2 ring-rose-500/30"
                : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
          >
            Imminent &lt; 2h
          </button>

          <button
            onClick={() => setScheduleFilter("today")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              scheduleFilter === "today"
                ? "bg-amber-500/30 text-amber-200 border-amber-400 font-bold ring-2 ring-amber-500/30"
                : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
          >
            Aujourd'hui
          </button>

          <button
            onClick={() => setScheduleFilter("tomorrow")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              scheduleFilter === "tomorrow"
                ? "bg-cyan-500/30 text-cyan-200 border-cyan-400 font-bold ring-2 ring-cyan-500/30"
                : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
          >
            Demain
          </button>

          <button
            onClick={() => setScheduleFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              scheduleFilter === "all"
                ? "bg-slate-800 text-white border-slate-600 font-bold"
                : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
          >
            Tous ({allVehicles.length})
          </button>

          <button
            onClick={handlePrintSchedule}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer hover:text-white"
          >
            <Printer size={14} /> Imprimer Feuille
          </button>
        </div>
      </div>

      {/* Tableau Chronologique */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/90 text-slate-400 text-[11px] uppercase tracking-wider font-bold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Heure Sortie</th>
                <th className="p-3.5">Urgence</th>
                <th className="p-3.5">Immatriculation</th>
                <th className="p-3.5">Emplacement</th>
                <th className="p-3.5">Modèle & Vol</th>
                <th className="p-3.5">Contact Client</th>
                <th className="p-3.5 text-right">Actions Terrain</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans text-xs">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <Car size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-sm">Aucun départ prévu pour ce filtre</p>
                  </td>
                </tr>
              ) : (
                filteredList.map((v) => {
                  const countdown = timeUntil(v.departure, now);
                  const urgency = getUrgencyStyle(v.departure, now);

                  return (
                    <tr
                      key={v.id}
                      className="hover:bg-slate-850/60 transition-colors group"
                    >
                      {/* Heure Sortie */}
                      <td className="p-3.5 font-bold text-white whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-sm text-sky-300">
                          <Clock size={14} className="text-sky-400" />
                          <span>{fmtTimeOnly(v.departure)}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {fmtDateOnly(v.departure)}
                        </div>
                      </td>

                      {/* Urgence */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className="px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 shadow-sm"
                          style={{ backgroundColor: urgency.bg, color: urgency.text }}
                        >
                          {countdown.label}
                        </span>
                      </td>

                      {/* Plaque */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="license-plate font-mono font-black text-xs tracking-wider px-2.5 py-1 rounded bg-slate-950 text-amber-300 border border-slate-700">
                          {v.plate}
                        </div>
                      </td>

                      {/* Emplacement dans le parc */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded-lg bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 font-bold text-xs">
                            {getLaneName(v.laneIndex, parking)}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              v.isHead
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {v.isHead ? "En Tête (P1)" : `Position ${v.slotIndex + 1}`}
                          </span>
                        </div>
                      </td>

                      {/* Modèle & Vol */}
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-200">{v.model || "Véhicule"}</div>
                        {v.flightNumber && (
                          <div className="text-[11px] text-sky-400 font-mono flex items-center gap-1 mt-0.5">
                            <Plane size={11} /> Vol {v.flightNumber}
                          </div>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="p-3.5 text-slate-400 text-[11px]">
                        {v.phone ? (
                          <div className="flex items-center gap-1 text-slate-300 font-mono">
                            <Phone size={11} className="text-emerald-400" /> {v.phone}
                          </div>
                        ) : (
                          <span>—</span>
                        )}
                        {v.notes && <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{v.notes}</div>}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onPrintTicket(v, v.laneIndex, v.slotIndex)}
                            title="Imprimer ticket de clés / véhicule"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          >
                            <FileText size={14} />
                          </button>
                          <button
                            onClick={() => onMoveVehicle(v)}
                            title="Changer de voie"
                            className="p-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white transition-colors cursor-pointer"
                          >
                            <ArrowRight size={14} />
                          </button>
                          <button
                            onClick={() => onExitVehicle(v)}
                            title="Confirmer la sortie du véhicule"
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <LogOut size={13} /> Sortie
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
