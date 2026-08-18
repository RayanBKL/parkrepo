import React, { useState } from "react";
import { Car, AlertTriangle, CheckCircle2, RefreshCw, Plus, Sparkles } from "lucide-react";
import VehicleCard from "./VehicleCard";
import { checkLaneConflicts } from "../services/algorithm";

export default function ParkingGrid({
  lanes,
  capacity,
  searchQuery,
  filterUrgency,
  onExitVehicle,
  onMoveVehicle,
  onEditVehicle,
  onPrintTicket,
  onAddVehicleToLane,
  onSortLane,
  onDropVehicleToLane,
  selectedVehicleId,
  setSelectedVehicleId,
}) {
  const [dragOverLaneIdx, setDragOverLaneIdx] = useState(null);
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const handleDragOver = (e, laneIdx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverLaneIdx !== laneIdx) {
      setDragOverLaneIdx(laneIdx);
    }
  };

  const handleDragLeave = (e, laneIdx) => {
    if (dragOverLaneIdx === laneIdx) {
      setDragOverLaneIdx(null);
    }
  };

  const handleDrop = (e, targetLaneIdx) => {
    e.preventDefault();
    setDragOverLaneIdx(null);
    try {
      const raw = e.dataTransfer.getData("application/json");
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.vehicleId && data.fromLaneIndex !== targetLaneIdx) {
        onDropVehicleToLane(data.vehicleId, data.fromLaneIndex, targetLaneIdx);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="parking-grid-container pb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {lanes.map((lane, laneIdx) => {
          const occupancy = lane.length;
          const isFull = occupancy >= capacity;
          const freeSlots = capacity - occupancy;
          const conflicts = checkLaneConflicts(lane);
          const hasConflicts = conflicts.length > 0;
          const isDragTarget = dragOverLaneIdx === laneIdx;

          // Filtrer les véhicules selon la recherche ou le filtre d'urgence
          const visibleVehicles = lane.map((v, slotIdx) => {
            const isMatchQuery =
              !normalizedQuery ||
              v.plate.toLowerCase().includes(normalizedQuery) ||
              (v.model && v.model.toLowerCase().includes(normalizedQuery)) ||
              (v.flightNumber && v.flightNumber.toLowerCase().includes(normalizedQuery)) ||
              `voie ${laneIdx + 1}`.includes(normalizedQuery);

            const now = new Date();
            const diffH = (new Date(v.departure).getTime() - now.getTime()) / 3_600_000;
            let isMatchFilter = true;
            if (filterUrgency === "2h") isMatchFilter = diffH <= 2;
            else if (filterUrgency === "12h") isMatchFilter = diffH <= 12;
            else if (filterUrgency === "48h") isMatchFilter = diffH <= 48;
            else if (filterUrgency === "conflicts") isMatchFilter = conflicts.some((c) => c.blockedVehicle.id === v.id);

            return {
              vehicle: v,
              slotIdx,
              isMatch: isMatchQuery && isMatchFilter,
              isBlocked: conflicts.some((c) => c.blockedVehicle.id === v.id),
            };
          });

          const anyVisible = visibleVehicles.some((item) => item.isMatch);

          return (
            <div
              key={laneIdx}
              onDragOver={(e) => handleDragOver(e, laneIdx)}
              onDragLeave={(e) => handleDragLeave(e, laneIdx)}
              onDrop={(e) => handleDrop(e, laneIdx)}
              className={`lane-column flex flex-col rounded-2xl border transition-all duration-200 ${
                isDragTarget
                  ? "border-blue-400 bg-blue-950/40 ring-2 ring-blue-500/50 scale-[1.01]"
                  : hasConflicts
                  ? "border-amber-500/40 bg-slate-900/80 shadow-amber-900/10 shadow-lg"
                  : "border-slate-800/80 bg-slate-900/60 hover:border-slate-700"
              } ${!anyVisible && normalizedQuery ? "opacity-30" : "opacity-100"}`}
            >
              {/* Entête de la Voie */}
              <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/40 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                      occupancy === 0
                        ? "bg-slate-800 text-slate-400"
                        : isFull
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    }`}
                  >
                    {laneIdx + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                      Voie {laneIdx + 1}
                      {hasConflicts && (
                        <span title="Conflit de sortie détecté !" className="text-amber-400">
                          <AlertTriangle size={13} />
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      {occupancy} / {capacity} places {freeSlots > 0 ? `(${freeSlots} libre${freeSlots > 1 ? "s" : ""})` : "(Pleine)"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {hasConflicts && (
                    <button
                      onClick={() => onSortLane(laneIdx)}
                      title="Réorganiser automatiquement cette voie pour lever le conflit"
                      className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw size={12} />
                    </button>
                  )}
                  {freeSlots > 0 && (
                    <button
                      onClick={() => onAddVehicleToLane(laneIdx)}
                      title={`Ajouter un véhicule directement dans la Voie ${laneIdx + 1}`}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <Plus size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Indicateur de sens de circulation */}
              <div className="px-3 py-1 bg-slate-950/60 text-[9px] text-slate-400 flex items-center justify-between border-b border-slate-800/40">
                <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                  ▲ Sortie (P1)
                </span>
                <span className="text-slate-400">Entrée ▼</span>
              </div>

              {/* Liste des véhicules dans la voie */}
              <div className="p-2.5 flex-1 flex flex-col gap-2 min-h-[140px]">
                {lane.length === 0 ? (
                  <div
                    onClick={() => onAddVehicleToLane(laneIdx)}
                    className="flex-1 flex flex-col items-center justify-center p-4 border border-dashed border-slate-800 hover:border-blue-500/50 rounded-xl cursor-pointer group transition-all"
                  >
                    <Car size={20} className="text-slate-600 group-hover:text-blue-400 mb-1 transition-colors" />
                    <span className="text-xs text-slate-500 group-hover:text-slate-300 font-medium">Voie libre</span>
                    <span className="text-[10px] text-slate-600 group-hover:text-blue-400 flex items-center gap-0.5 mt-1">
                      <Plus size={10} /> Déposer ici
                    </span>
                  </div>
                ) : (
                  visibleVehicles.map(({ vehicle, slotIdx, isMatch, isBlocked }) => (
                    <div
                      key={vehicle.id}
                      className={`transition-all duration-200 ${!isMatch ? "opacity-25 grayscale" : ""}`}
                    >
                      <VehicleCard
                        vehicle={vehicle}
                        laneIndex={laneIdx}
                        slotIndex={slotIdx}
                        isHead={slotIdx === 0}
                        isBlocked={isBlocked}
                        onExit={onExitVehicle}
                        onMove={onMoveVehicle}
                        onEdit={onEditVehicle}
                        onPrintTicket={onPrintTicket}
                        onSelect={() => setSelectedVehicleId(vehicle.id)}
                        isSelected={selectedVehicleId === vehicle.id}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
