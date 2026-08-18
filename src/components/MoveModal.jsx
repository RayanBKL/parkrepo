import React, { useState } from "react";
import { X, ArrowRight, Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";
import { fmtDateTime, assignLane } from "../services/algorithm";

export default function MoveModal({
  isOpen,
  onClose,
  vehicle,
  lanes,
  capacity,
  onConfirmMove,
}) {
  if (!isOpen || !vehicle) return null;

  // Trouver la voie actuelle du véhicule
  let currentLaneIndex = -1;
  let currentSlotIndex = -1;
  lanes.forEach((lane, lIdx) => {
    const sIdx = lane.findIndex((v) => v.id === vehicle.id);
    if (sIdx !== -1) {
      currentLaneIndex = lIdx;
      currentSlotIndex = sIdx;
    }
  });

  const [selectedLane, setSelectedLane] = useState(currentLaneIndex >= 0 ? currentLaneIndex : 0);

  // Calcul de la recommandation de voie par l'algorithme
  const lanesWithoutVehicle = lanes.map((lane) => lane.filter((v) => v.id !== vehicle.id));
  const suggestion = assignLane(lanesWithoutVehicle, capacity, vehicle);

  const handleMove = (targetIdx) => {
    onConfirmMove(vehicle, targetIdx);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl overflow-hidden relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <ArrowRight size={20} className="text-blue-400" />
              Déplacer le véhicule
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Plaque : <span className="text-amber-300 font-mono font-bold">{vehicle.plate}</span> • Départ :{" "}
              {fmtDateTime(vehicle.departure)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Suggestion Intelligente */}
        {suggestion.laneIndex !== -1 && (
          <div
            className={`my-4 p-3.5 border rounded-2xl flex items-center justify-between gap-3 ${
              suggestion.laneIndex === currentLaneIndex
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                : "bg-gradient-to-r from-blue-950/70 to-indigo-950/70 border-blue-500/40 text-blue-200"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  suggestion.laneIndex === currentLaneIndex
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-blue-500/20 text-yellow-300"
                }`}
              >
                {suggestion.laneIndex === currentLaneIndex ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <Sparkles size={16} />
                )}
              </div>
              <div>
                <div className="text-xs font-bold">
                  {suggestion.laneIndex === currentLaneIndex
                    ? "Emplacement Actuel Optimal !"
                    : `Voie ${suggestion.laneIndex + 1} Recommandée`}
                </div>
                <div className="text-[11px] opacity-80">
                  {suggestion.laneIndex === currentLaneIndex
                    ? "Ce véhicule est déjà parfaitement positionné sans blocage."
                    : `Regroupement optimal sans blocage de sortie dans la Voie ${suggestion.laneIndex + 1}.`}
                </div>
              </div>
            </div>
            {suggestion.laneIndex !== currentLaneIndex && (
              <button
                type="button"
                onClick={() => handleMove(suggestion.laneIndex)}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                Placer en V{suggestion.laneIndex + 1}
              </button>
            )}
          </div>
        )}

        {/* Liste des Voies Disponibles */}
        <div className="my-4">
          <label className="block text-xs font-bold text-slate-300 mb-2">
            Ou choisir manuellement une voie de destination :
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-56 overflow-y-auto pr-1">
            {lanes.map((lane, idx) => {
              const count = lane.length;
              const isCurrent = idx === currentLaneIndex;
              const isFull = count >= capacity && !isCurrent;
              const isRec = idx === suggestion.laneIndex;

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isFull}
                  onClick={() => setSelectedLane(idx)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    selectedLane === idx
                      ? "bg-blue-600 text-white border-blue-400 shadow-md ring-2 ring-blue-500/50"
                      : isRec
                      ? "bg-blue-950/40 text-blue-300 border-blue-500/50"
                      : isCurrent
                      ? "bg-slate-800 text-amber-300 border-amber-500/40"
                      : isFull
                      ? "bg-slate-950/40 text-slate-600 border-slate-900 cursor-not-allowed"
                      : "bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800"
                  }`}
                >
                  <div className="text-xs font-black">Voie {idx + 1}</div>
                  <div className="text-[10px] mt-0.5 opacity-80">
                    {count}/{capacity}
                  </div>
                  {isCurrent && <div className="text-[8px] font-bold text-amber-400">Actuelle</div>}
                  {isRec && !isCurrent && <div className="text-[8px] font-bold text-yellow-300">Idéale</div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-semibold transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => handleMove(selectedLane)}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-900/40 transition-all flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 size={16} /> Déplacer vers Voie {selectedLane + 1}
          </button>
        </div>
      </div>
    </div>
  );
}
