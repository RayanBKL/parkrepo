import React from "react";
import { X, Layers, Sparkles, LogOut, ArrowRight, Clock, Plus } from "lucide-react";
import { fmtDateTime, timeUntil, getUrgencyStyle } from "../services/algorithm";

export default function WaitingQueueModal({
  isOpen,
  onClose,
  waitingVehicles,
  onAssignWaitingVehicle,
  onAutoAssignAllWaiting,
  onRemoveFromWaiting,
}) {
  if (!isOpen) return null;

  const now = new Date();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl overflow-hidden relative max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Layers size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">File d'Attente & Surplus</h2>
              <p className="text-xs text-slate-400">
                {waitingVehicles.length} véhicule{waitingVehicles.length > 1 ? "s" : ""} en attente d'affectation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {waitingVehicles.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Layers size={36} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">Aucun véhicule en file d'attente</p>
              <p className="text-xs text-slate-600 mt-1">Tous les véhicules sont actuellement placés dans les voies</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-xs font-bold text-slate-300">Véhicules non affectés :</span>
                <button
                  type="button"
                  onClick={onAutoAssignAllWaiting}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-purple-950/40 cursor-pointer"
                >
                  <Sparkles size={13} className="text-yellow-300" />
                  Placer automatiquement dans le parc
                </button>
              </div>

              {waitingVehicles.map((v, idx) => {
                const countdown = timeUntil(v.departure, now);
                const urgency = getUrgencyStyle(v.departure, now);

                return (
                  <div
                    key={v.id || idx}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="license-plate font-mono font-black text-xs tracking-wider px-2 py-1 rounded bg-slate-900 text-amber-300 border border-slate-700">
                        {v.plate}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200">{v.model || "Véhicule"}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>Départ : {fmtDateTime(v.departure)}</span>
                          <span
                            className="font-semibold px-1.5 py-0.2 rounded"
                            style={{ backgroundColor: urgency.bg, color: urgency.text }}
                          >
                            {countdown.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onAssignWaitingVehicle(v)}
                        className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowRight size={13} /> Placer
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveFromWaiting(v.id)}
                        className="p-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs transition-all cursor-pointer"
                        title="Retirer de la file d'attente"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
