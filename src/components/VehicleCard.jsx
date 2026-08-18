import React from "react";
import { Clock, ArrowRight, LogOut, Edit3, AlertCircle, Plane, Phone, FileText, GripVertical } from "lucide-react";
import { fmtDateTime, timeUntil, getUrgencyStyle } from "../services/algorithm";

export default function VehicleCard({
  vehicle,
  laneIndex,
  slotIndex,
  isHead,
  isBlocked,
  onExit,
  onMove,
  onEdit,
  onPrintTicket,
  onSelect,
  isSelected,
}) {
  const now = new Date();
  const countdown = timeUntil(vehicle.departure, now);
  const urgency = getUrgencyStyle(vehicle.departure, now);

  const handleDragStart = (e) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        vehicleId: vehicle.id,
        fromLaneIndex: laneIndex,
      })
    );
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onSelect}
      className={`vehicle-card relative p-2.5 rounded-xl border transition-all duration-200 cursor-grab active:cursor-grabbing select-none ${
        isSelected
          ? "ring-2 ring-cyan-500 bg-slate-800 shadow-lg scale-[1.02] border-cyan-400"
          : "bg-slate-900/90 hover:bg-slate-800/90 border-slate-800 hover:border-slate-700 shadow-sm"
      } ${isBlocked ? "border-amber-500/60 ring-1 ring-amber-500/30" : ""}`}
    >
      {/* Badge Numéro de position dans la voie + Poignée Drag */}
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <div className="flex items-center gap-1.5">
          <GripVertical size={11} className="text-slate-600 hover:text-slate-400 cursor-grab" />
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              isHead ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold" : "bg-slate-800 text-slate-400"
            }`}
          >
            {isHead ? "Sortie (P1)" : `P${slotIndex + 1}`}
          </span>
          {isBlocked && (
            <span
              title="Attention : ce véhicule part avant celui devant lui !"
              className="flex items-center gap-0.5 text-[9px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 py-0.5 rounded"
            >
              <AlertCircle size={10} /> Bloqué
            </span>
          )}
        </div>

        {/* Badge Urgence Départ */}
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm"
          style={{
            backgroundColor: urgency.bg,
            color: urgency.text,
          }}
        >
          <Clock size={10} />
          {countdown.label}
        </span>
      </div>

      {/* Plaque d'immatriculation */}
      <div className="flex items-center justify-between gap-1 my-1">
        <div className="license-plate font-mono font-black text-xs tracking-wider px-2 py-0.5 rounded bg-slate-950 text-amber-300 border border-slate-700 shadow-inner flex items-center gap-1.5">
          <span className="text-[9px] font-sans font-bold text-cyan-400 bg-cyan-950 px-1 py-0.2 rounded-xs">F</span>
          <span>{vehicle.plate}</span>
        </div>
      </div>

      {/* Modèle & Infos */}
      <div className="flex items-center justify-between text-xs text-slate-300 font-medium truncate mt-1">
        <span className="truncate max-w-[130px]" title={vehicle.model}>
          {vehicle.model || "Véhicule"}
        </span>
        {vehicle.flightNumber && (
          <span className="text-[10px] text-sky-400 flex items-center gap-0.5 font-mono font-bold">
            <Plane size={9} /> {vehicle.flightNumber}
          </span>
        )}
      </div>

      {/* Date précise */}
      <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
        <span>Départ :</span>
        <span className="font-semibold text-slate-200">{fmtDateTime(vehicle.departure)}</span>
      </div>

      {/* Barre d'action rapide au survol ou sélection */}
      <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExit(vehicle);
          }}
          title="Faire sortir le véhicule (libérer la place)"
          className="flex-1 py-1 px-1.5 text-[10px] font-semibold bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded border border-emerald-500/30 transition-colors flex items-center justify-center gap-1 cursor-pointer"
        >
          <LogOut size={10} /> Sortie
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onMove(vehicle);
          }}
          title="Changer de voie"
          className="py-1 px-1.5 text-[10px] font-semibold bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white rounded border border-cyan-500/30 transition-colors flex items-center justify-center gap-0.5 cursor-pointer"
        >
          <ArrowRight size={10} /> Voie
        </button>

        {onPrintTicket && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrintTicket(vehicle, laneIndex, slotIndex);
            }}
            title="Imprimer le ticket"
            className="py-1 px-1.5 text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 transition-colors flex items-center justify-center cursor-pointer"
          >
            <FileText size={10} />
          </button>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(vehicle);
          }}
          title="Modifier les détails"
          className="py-1 px-1.5 text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 transition-colors flex items-center justify-center cursor-pointer"
        >
          <Edit3 size={10} />
        </button>
      </div>
    </div>
  );
}
