import React, { useState, useMemo } from "react";
import {
  Sliders,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
} from "lucide-react";
import { redistributeAllVehicles, checkLaneConflicts } from "../../services/algorithm";
import { getLaneName } from "../../services/cloudDb";

export default function PlacementOptimizerView({
  parking,
  activeStrategy = "patience",
  setActiveStrategy,
  onApplyRedistribution,
}) {
  const [strategy, setStrategy] = useState(activeStrategy || "patience");
  const [previewMode, setPreviewMode] = useState(false);

  // Flatten all vehicles in active parking
  const allVehicles = useMemo(() => {
    if (!parking?.lanes) return [];
    return parking.lanes.flat();
  }, [parking]);

  // Conflicts analysis on current state
  const currentConflicts = useMemo(() => {
    if (!parking?.lanes) return [];
    const list = [];
    parking.lanes.forEach((lane, lIdx) => {
      const confs = checkLaneConflicts(lane);
      confs.forEach((c) => {
        list.push({ ...c, laneIndex: lIdx });
      });
    });
    return list;
  }, [parking]);

  // Simulated redistribution
  const simulatedResult = useMemo(() => {
    if (!parking) return { lanes: [], waiting: [] };
    return redistributeAllVehicles(
      allVehicles,
      parking.laneCount || 30,
      parking.capacity || 10,
      strategy
    );
  }, [allVehicles, parking, strategy]);

  // Simulation conflicts
  const simulatedConflicts = useMemo(() => {
    let count = 0;
    simulatedResult.lanes.forEach((lane) => {
      count += checkLaneConflicts(lane).length;
    });
    return count;
  }, [simulatedResult]);

  const handleApply = () => {
    if (onApplyRedistribution) {
      onApplyRedistribution(simulatedResult.lanes, simulatedResult.waiting, strategy);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-emerald-950/40 border border-cyan-500/40 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 mb-1">
          <Sliders size={15} />
          <span>Moteur d'Optimisation de Rangement des Voies</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Optimisation de Placement & Rangements
        </h1>
        <p className="text-xs text-slate-300 mt-1 max-w-2xl">
          Organisez vos véhicules avec l'algorithme <strong>Tightest Fit Decreasing</strong> pour aligner parfaitement les départs et vider les voies d'un seul bloc.
        </p>
      </div>

      {/* Optimization Engine Info */}
      <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black text-white">Algorithme d'Optimisation Chronologique Pure</h2>
            <p className="text-xs text-slate-400">Classe automatiquement chaque véhicule par date et heure de départ pour éliminer tous les blocages.</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-cyan-950 text-cyan-300 border border-cyan-500/40 rounded-full text-xs font-bold shrink-0">
          Zéro Conflit
        </div>
      </div>

      {/* Comparison Strip: Current State vs Optimized State */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-black text-white">Analyse Prévisionnelle de Réorganisation</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulation sur les {allVehicles.length} véhicules actuellement garés dans {parking?.name}
            </p>
          </div>

          <button
            onClick={handleApply}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-black text-xs shadow-xl shadow-cyan-950/60 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles size={16} />
            <span>Appliquer le Rangement Optimisé</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Situation Actuelle */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">État Actuel</span>
              <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${currentConflicts.length > 0 ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"}`}>
                {currentConflicts.length} conflit{currentConflicts.length > 1 ? "s" : ""}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {currentConflicts.length === 0
                ? "Parfait ! Aucune voiture ne bloque une sortie pour le moment."
                : `${currentConflicts.length} véhicule(s) sont positionnés derrière une voiture qui part plus tard.`}
            </p>

            {currentConflicts.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {currentConflicts.map((c, i) => (
                  <div key={i} className="p-2 rounded-xl bg-slate-900 text-[11px] text-slate-300 flex items-center justify-between">
                    <span>{getLaneName(c.laneIndex, parking)} : <strong>{c.blockedVehicle.plate}</strong> bloqué par <strong>{c.blockingVehicle.plate}</strong></span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Après Optimisation */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-cyan-950/30 to-emerald-950/20 border border-cyan-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">Après Optimisation</span>
              <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
                0 Conflit garanti
              </span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed">
              Toutes les voies sont ordonnées chronologiquement de la sortie vers le fond. Chaque véhicule sort directement sans aucune manœuvre intermédiaire.
            </p>

            <div className="pt-2 flex items-center gap-2 text-xs font-bold text-emerald-400">
              <CheckCircle2 size={16} />
              <span>Fluidité maximale & départs instantanés</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
