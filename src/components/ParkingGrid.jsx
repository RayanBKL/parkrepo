import React, { useState } from "react";
import { Car, AlertTriangle, RefreshCw, Plus, Edit2, Check, X } from "lucide-react";
import VehicleCard from "./VehicleCard";
import { checkLaneConflicts } from "../services/algorithm";
import { getLaneName, indexToLetter } from "../services/cloudDb";

export default function ParkingGrid({
  parking,
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
  onRenameLane,
  selectedVehicleId,
  setSelectedVehicleId,
}) {
  const [dragOverLaneIdx, setDragOverLaneIdx] = useState(null);
  const [editingLaneIdx, setEditingLaneIdx] = useState(null);
  const [tempLaneName, setTempLaneName] = useState("");
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const handleStartRename = (laneIdx) => {
    setEditingLaneIdx(laneIdx);
    setTempLaneName(getLaneName(laneIdx, parking));
  };

  const handleSaveRename = (laneIdx) => {
    if (onRenameLane) {
      onRenameLane(laneIdx, tempLaneName);
    }
    setEditingLaneIdx(null);
  };

  const handleCancelRename = () => {
    setEditingLaneIdx(null);
    setTempLaneName("");
  };

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
          const currentLaneName = getLaneName(laneIdx, parking);
          const isEditingThisLane = editingLaneIdx === laneIdx;

          // Repère court pour le badge carré (ex: 1, 2, A, B, ...)
          const shortBadge =
            parking?.laneNaming === "alphabetic"
              ? indexToLetter(laneIdx)
              : `${laneIdx + 1}`;

          // Filtrer les véhicules selon la recherche ou le filtre d'urgence
          const visibleVehicles = lane.map((v, slotIdx) => {
            const isMatchQuery =
              !normalizedQuery ||
              v.plate.toLowerCase().includes(normalizedQuery) ||
              (v.model && v.model.toLowerCase().includes(normalizedQuery)) ||
              (v.flightNumber && v.flightNumber.toLowerCase().includes(normalizedQuery)) ||
              `voie ${laneIdx + 1}`.includes(normalizedQuery) ||
              currentLaneName.toLowerCase().includes(normalizedQuery);

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
                  ? "border-cyan-400 bg-cyan-950/40 ring-2 ring-cyan-500/50 scale-[1.01]"
                  : hasConflicts
                  ? "border-amber-500/40 bg-slate-900/80 shadow-amber-900/10 shadow-lg"
                  : "border-slate-800/80 bg-slate-900/60 hover:border-slate-700"
              } ${!anyVisible && normalizedQuery ? "opacity-30" : "opacity-100"}`}
            >
              {/* Entête de la Voie */}
              <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/40 rounded-t-2xl">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      occupancy === 0
                        ? "bg-slate-800 text-slate-400"
                        : isFull
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    }`}
                  >
                    {shortBadge}
                  </div>

                  {isEditingThisLane ? (
                    <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={tempLaneName}
                        onChange={(e) => setTempLaneName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveRename(laneIdx);
                          if (e.key === "Escape") handleCancelRename();
                        }}
                        className="w-full px-2 py-0.5 rounded bg-slate-950 border border-cyan-500 text-white text-xs font-bold focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveRename(laneIdx)}
                        className="p-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer"
                        title="Valider"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelRename}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                        title="Annuler"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="min-w-0 flex-1 group/title">
                      <div className="flex items-center gap-1.5">
                        <h3
                          className="font-bold text-sm text-slate-100 truncate cursor-pointer hover:text-cyan-300 transition-colors"
                          onClick={() => handleStartRename(laneIdx)}
                          title="Cliquer pour renommer cette voie"
                        >
                          {currentLaneName}
                        </h3>
                        <button
                          type="button"
                          onClick={() => handleStartRename(laneIdx)}
                          className="opacity-0 group-hover/title:opacity-100 text-slate-400 hover:text-cyan-300 transition-opacity p-0.5"
                          title="Renommer"
                        >
                          <Edit2 size={11} />
                        </button>
                        {hasConflicts && (
                          <span title="Conflit de sortie détecté !" className="text-amber-400 shrink-0">
                            <AlertTriangle size={13} />
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {occupancy} / {capacity} places {freeSlots > 0 ? `(${freeSlots} libre${freeSlots > 1 ? "s" : ""})` : "(Pleine)"}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-1">
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
                      title={`Ajouter un véhicule directement dans ${currentLaneName}`}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
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
                    className="flex-1 flex flex-col items-center justify-center p-4 border border-dashed border-slate-800 hover:border-cyan-500/50 rounded-xl cursor-pointer group transition-all"
                  >
                    <Car size={20} className="text-slate-600 group-hover:text-cyan-400 mb-1 transition-colors" />
                    <span className="text-xs text-slate-500 group-hover:text-slate-300 font-medium">Voie libre</span>
                    <span className="text-[10px] text-slate-600 group-hover:text-cyan-400 flex items-center gap-0.5 mt-1">
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
                        parking={parking}
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

