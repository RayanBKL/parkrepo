import React, { useState, useMemo } from "react";
import {
  Car,
  Search,
  Filter,
  Plus,
  Move,
  LogOut,
  Edit,
  Printer,
  Zap,
  Clock,
  Plane,
  Phone,
  ArrowUpDown,
  FileSpreadsheet,
} from "lucide-react";
import { getUrgencyStyle, timeUntil, fmtDateTime } from "../../services/algorithm";
import { getLaneName } from "../../services/cloudDb";

export default function VehiclesView({
  parking,
  onOpenAddModal,
  onEditVehicle,
  onMoveVehicle,
  onExitVehicle,
  onPrintTicket,
  onSelectVehicleForRetrieval,
  onNavigateView,
}) {
  const [search, setSearch] = useState("");
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [filterLane, setFilterLane] = useState("all");

  // Flatten all vehicles in parking
  const vehicles = useMemo(() => {
    if (!parking?.lanes) return [];
    const list = [];
    parking.lanes.forEach((lane, lIdx) => {
      lane.forEach((v, sIdx) => {
        list.push({ ...v, laneIndex: lIdx, slotIndex: sIdx });
      });
    });
    return list;
  }, [parking]);

  // Filtering
  const filteredVehicles = useMemo(() => {
    const now = new Date();
    return vehicles.filter((v) => {
      if (search.trim()) {
        const q = search.trim().toUpperCase();
        const matchesPlate = v.plate?.toUpperCase().includes(q);
        const matchesModel = v.model?.toUpperCase().includes(q);
        const matchesFlight = v.flightNumber?.toUpperCase().includes(q);
        const matchesPhone = v.phone?.includes(q);
        const matchesNotes = v.notes?.toUpperCase().includes(q);
        if (!matchesPlate && !matchesModel && !matchesFlight && !matchesPhone && !matchesNotes) {
          return false;
        }
      }

      if (filterLane !== "all" && v.laneIndex !== Number(filterLane)) {
        return false;
      }

      if (filterUrgency !== "all") {
        const urg = getUrgencyStyle(v.departure, now);
        if (filterUrgency === "urgent" && urg.color !== "red") return false;
        if (filterUrgency === "today" && urg.color !== "amber") return false;
        if (filterUrgency === "overdue" && urg.color !== "purple") return false;
      }

      return true;
    });
  }, [vehicles, search, filterUrgency, filterLane]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 mb-1">
            <Car size={15} />
            <span>Gestionnaire de Flotte</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Véhicules Garés ({filteredVehicles.length}/{vehicles.length})
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Inventaire des véhicules présents dans <strong>{parking?.name}</strong>.
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-black text-xs shadow-lg shadow-cyan-950/60 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus size={16} />
          <span>+ Déposer un Véhicule</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        {/* Search */}
        <div className="flex-1 max-w-sm min-w-[200px] relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Plaque, vol, client, modèle..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500 uppercase"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Urgence */}
          <select
            value={filterUrgency}
            onChange={(e) => setFilterUrgency(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="all">Tous les délais</option>
            <option value="urgent">🔴 &lt; 2h (Imminent)</option>
            <option value="today">🟡 &lt; 12h (Aujourd'hui)</option>
            <option value="overdue">🟣 Dépassé</option>
          </select>

          {/* Voie */}
          <select
            value={filterLane}
            onChange={(e) => setFilterLane(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="all">Toutes les voies</option>
            {(parking?.lanes || []).map((_, idx) => (
              <option key={idx} value={idx}>
                {getLaneName(idx, parking)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-400 bg-slate-950/60">
                <th className="py-3.5 px-4">Plaque & Modèle</th>
                <th className="py-3.5 px-4">Emplacement</th>
                <th className="py-3.5 px-4">Date de Départ</th>
                <th className="py-3.5 px-4">N° Vol / Contact</th>
                <th className="py-3.5 px-4">Statut Sortie</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Aucun véhicule correspondant dans ce parking.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((v) => {
                  const urg = getUrgencyStyle(v.departure);
                  const isDirect = v.slotIndex === 0;

                  return (
                    <tr key={v.id} className="hover:bg-slate-850/60 transition-colors">
                      {/* Plaque & Modèle */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-amber-300 font-mono font-bold text-xs">
                            {v.plate}
                          </span>
                          <span className="font-bold text-white">{v.model || "Véhicule"}</span>
                        </div>
                      </td>

                      {/* Emplacement */}
                      <td className="py-3 px-4 font-semibold text-slate-300">
                        <span>{getLaneName(v.laneIndex, parking)}</span>
                        <span className="text-[11px] text-slate-500 ml-1.5">(Place {v.slotIndex + 1})</span>
                      </td>

                      {/* Date de départ */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{fmtDateTime(v.departure)}</div>
                        <div className="text-[10px] text-slate-400">{timeUntil(v.departure).label}</div>
                      </td>

                      {/* Vol & Phone */}
                      <td className="py-3 px-4 text-slate-300">
                        {v.flightNumber ? (
                          <div className="flex items-center gap-1 font-mono text-sky-400 font-semibold">
                            <Plane size={11} /> {v.flightNumber}
                          </div>
                        ) : null}
                        {v.phone ? (
                          <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Phone size={10} /> {v.phone}
                          </div>
                        ) : null}
                        {!v.flightNumber && !v.phone && <span className="text-slate-600">—</span>}
                      </td>

                      {/* Statut Sortie */}
                      <td className="py-3 px-4">
                        {isDirect ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                            Direct (Sortie libre)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                            {v.slotIndex} voiture{v.slotIndex > 1 ? "s" : ""} devant
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Assistant Récupération */}
                          <button
                            onClick={() => {
                              if (onSelectVehicleForRetrieval) onSelectVehicleForRetrieval(v.id);
                              if (onNavigateView) onNavigateView("retrieval");
                            }}
                            className="p-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 transition-colors cursor-pointer"
                            title="Assistant de sortie optimisé"
                          >
                            <Zap size={14} />
                          </button>

                          {/* Déplacer */}
                          <button
                            onClick={() => onMoveVehicle(v)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                            title="Déplacer vers une autre voie"
                          >
                            <Move size={14} />
                          </button>

                          {/* Modifier */}
                          <button
                            onClick={() => onEditVehicle(v)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                            title="Modifier les informations"
                          >
                            <Edit size={14} />
                          </button>

                          {/* Ticket */}
                          <button
                            onClick={() => onPrintTicket(v, v.laneIndex, v.slotIndex)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                            title="Imprimer le ticket voiturier"
                          >
                            <Printer size={14} />
                          </button>

                          {/* Sortir */}
                          <button
                            onClick={() => onExitVehicle(v)}
                            className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition-colors cursor-pointer"
                            title="Sortir le véhicule du parc"
                          >
                            <LogOut size={14} />
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
