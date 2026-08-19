import React from "react";
import { Car, Clock, AlertTriangle, Layers, Sparkles, Filter, Compass } from "lucide-react";

export default function StatsBar({
  parking,
  filterUrgency,
  setFilterUrgency,
  activeStrategy,
  setActiveStrategy,
  onAutoRedistribute,
  onOpenWaiting,
}) {
  const lanes = parking?.lanes || [];
  const capacity = parking?.capacity || 10;
  const laneCount = parking?.laneCount || 30;
  const totalSlots = laneCount * capacity;

  // Calcul des statistiques
  let totalParked = 0;
  let count2h = 0;
  let count12h = 0;
  let count48h = 0;
  let countFar = 0;
  let countOverdue = 0;
  let totalConflicts = 0;

  const now = new Date();

  lanes.forEach((lane) => {
    totalParked += lane.length;
    for (let i = 0; i < lane.length - 1; i++) {
      if (new Date(lane[i + 1].departure).getTime() < new Date(lane[i].departure).getTime()) {
        totalConflicts++;
      }
    }

    lane.forEach((v) => {
      const diffMs = new Date(v.departure).getTime() - now.getTime();
      const diffH = diffMs / 3_600_000;
      if (diffMs < 0) countOverdue++;
      else if (diffH <= 2) count2h++;
      else if (diffH <= 12) count12h++;
      else if (diffH <= 48) count48h++;
      else countFar++;
    });
  });

  const waitingCount = (parking?.waiting || []).length;
  const occupancyPercent = totalSlots > 0 ? Math.round((totalParked / totalSlots) * 100) : 0;
  const availableSlots = Math.max(0, totalSlots - totalParked);

  return (
    <div className="stats-bar bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl p-4 mb-6 shadow-xl space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* KPI 1 : Taux d'occupation */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Car size={22} />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{totalParked}</span>
              <span className="text-xs text-slate-400">/ {totalSlots} places</span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  occupancyPercent > 90 ? "bg-rose-500/20 text-rose-300" : "bg-emerald-500/20 text-emerald-300"
                }`}
              >
                {occupancyPercent}%
              </span>
            </div>
            <p className="text-xs text-slate-400">{availableSlots} places disponibles</p>
          </div>
        </div>

        {/* Badges d'urgence & Filtres rapides */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterUrgency(filterUrgency === "all" ? "" : "all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
              filterUrgency === "all" || !filterUrgency
                ? "bg-slate-800 text-slate-100 border-slate-600 shadow"
                : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
          >
            <Filter size={12} /> Tous ({totalParked})
          </button>

          <button
            onClick={() => setFilterUrgency(filterUrgency === "2h" ? "" : "2h")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
              filterUrgency === "2h"
                ? "bg-rose-500/30 text-rose-200 border-rose-400 ring-2 ring-rose-500/40"
                : "bg-rose-950/40 text-rose-300 border-rose-900/60 hover:bg-rose-900/40"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            Urgent &lt; 2h ({count2h})
          </button>

          <button
            onClick={() => setFilterUrgency(filterUrgency === "12h" ? "" : "12h")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
              filterUrgency === "12h"
                ? "bg-amber-500/30 text-amber-200 border-amber-400 ring-2 ring-amber-500/40"
                : "bg-amber-950/40 text-amber-300 border-amber-900/60 hover:bg-amber-900/40"
            }`}
          >
            Aujourd'hui ({count12h})
          </button>

          <button
            onClick={() => setFilterUrgency(filterUrgency === "48h" ? "" : "48h")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
              filterUrgency === "48h"
                ? "bg-emerald-500/30 text-emerald-200 border-emerald-400 ring-2 ring-emerald-500/40"
                : "bg-emerald-950/40 text-emerald-300 border-emerald-900/60 hover:bg-emerald-900/40"
            }`}
          >
            &lt; 48h ({count48h})
          </button>

          {totalConflicts > 0 && (
            <button
              onClick={() => setFilterUrgency(filterUrgency === "conflicts" ? "" : "conflicts")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                filterUrgency === "conflicts"
                  ? "bg-amber-500 text-slate-950 border-amber-300 font-bold"
                  : "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
              }`}
            >
              <AlertTriangle size={13} /> {totalConflicts} Conflit{totalConflicts > 1 ? "s" : ""}
            </button>
          )}

          {waitingCount > 0 && (
            <button
              onClick={onOpenWaiting}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 flex items-center gap-1.5 animate-pulse cursor-pointer"
            >
              <Layers size={13} /> File d'attente ({waitingCount})
            </button>
          )}
        </div>

        {/* Bouton Répartition Optimale */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onAutoRedistribute && onAutoRedistribute()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/30 hover:shadow-cyan-700/50 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles size={14} className="text-yellow-300" />
            <span>Réorganiser tout le parc</span>
          </button>
        </div>
      </div>
    </div>
  );
}
