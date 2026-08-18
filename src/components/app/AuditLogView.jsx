import React, { useState, useMemo } from "react";
import {
  History,
  Search,
  Filter,
  Car,
  Move,
  LogOut,
  Plus,
  Building2,
  Clock,
  User,
  ShieldCheck,
} from "lucide-react";
import { fmtDateTime } from "../../services/algorithm";

export default function AuditLogView({ parking, parkings = [] }) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Collect history from active parking or all parkings
  const logs = useMemo(() => {
    if (!parking?.history) return [];
    return [...parking.history].reverse();
  }, [parking]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filterType !== "all" && log.type !== filterType) {
        return false;
      }
      if (search.trim()) {
        const q = search.trim().toUpperCase();
        const msg = (log.details?.message || "").toUpperCase();
        const plate = (log.details?.plate || "").toUpperCase();
        const user = (log.user || "").toUpperCase();
        if (!msg.includes(q) && !plate.includes(q) && !user.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [logs, search, filterType]);

  const getActionBadge = (type) => {
    switch (type) {
      case "ADD":
      case "CREATE_PARKING":
        return { label: "Entrée / Ajout", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", icon: Plus };
      case "MOVE":
        return { label: "Déplacement", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40", icon: Move };
      case "EXIT":
        return { label: "Sortie Client", color: "bg-rose-500/20 text-rose-300 border-rose-500/40", icon: LogOut };
      default:
        return { label: "Action", color: "bg-slate-500/20 text-slate-300 border-slate-500/40", icon: History };
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 mb-1">
            <History size={15} />
            <span>Traçabilité & Journal d'Audit</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Journal d'Activité ({filteredLogs.length} événements)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Historique complet des mouvements et opérations réalisés dans <strong>{parking?.name}</strong>.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex-1 max-w-sm min-w-[200px] relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une plaque, collaborateur..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer"
        >
          <option value="all">Tous les types d'actions</option>
          <option value="ADD">Entrées de véhicules</option>
          <option value="MOVE">Déplacements / Manœuvres</option>
          <option value="EXIT">Sorties de véhicules</option>
        </select>
      </div>

      {/* Logs Timeline List */}
      <div className="space-y-2.5">
        {filteredLogs.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center text-slate-500 text-xs">
            Aucun événement enregistré correspondant aux critères.
          </div>
        ) : (
          filteredLogs.map((log, idx) => {
            const badge = getActionBadge(log.type);
            const Icon = badge.icon;
            const timeStr = fmtDateTime(log.timestamp);
            const userName = log.user || log.details?.user || "Voiturier";

            return (
              <div
                key={log.id || idx}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5 sm:mt-0">
                    <Icon size={15} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded-full border ${badge.color}`}>
                        {badge.label}
                      </span>
                      {log.details?.plate && (
                        <span className="font-mono font-bold text-amber-300 text-xs bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {log.details.plate}
                        </span>
                      )}
                      <span className="text-xs font-bold text-white">
                        {log.details?.message || "Opération effectuée"}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <User size={12} className="text-slate-500" />
                        <strong className="text-slate-300">{userName}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right text-[11px] font-mono text-slate-400 shrink-0">
                  {timeStr}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
