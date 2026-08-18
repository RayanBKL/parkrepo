import React, { useState, useMemo } from "react";
import {
  Zap,
  Search,
  CheckCircle2,
  AlertTriangle,
  Car,
  ArrowRight,
  Sparkles,
  Move,
  LogOut,
  Clock,
  Plane,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { calculateRetrievalPlan, fmtDateTime, getUrgencyStyle } from "../../services/algorithm";
import { getLaneName } from "../../services/cloudDb";

export default function RetrievalOptimizerView({
  parking,
  selectedVehicleId,
  onExitVehicle,
  onMoveVehicle,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTargetId, setActiveTargetId] = useState(selectedVehicleId || "");

  // Flatten all vehicles in parking
  const allVehicles = useMemo(() => {
    if (!parking?.lanes) return [];
    const list = [];
    parking.lanes.forEach((lane, lIdx) => {
      lane.forEach((v, sIdx) => {
        list.push({ ...v, laneIndex: lIdx, slotIndex: sIdx });
      });
    });
    return list;
  }, [parking]);

  // Filtered vehicles for picker
  const filteredVehicles = useMemo(() => {
    if (!searchQuery.trim()) return allVehicles;
    const q = searchQuery.trim().toUpperCase();
    return allVehicles.filter(
      (v) =>
        v.plate?.toUpperCase().includes(q) ||
        v.model?.toUpperCase().includes(q) ||
        v.flightNumber?.toUpperCase().includes(q)
    );
  }, [allVehicles, searchQuery]);

  // If no vehicle explicitly selected, default to first urgent or first found
  const currentSelectedId = activeTargetId || (filteredVehicles.length > 0 ? filteredVehicles[0].id : null);

  // Calculate retrieval plan
  const plan = useMemo(() => {
    if (!parking || !currentSelectedId) return null;
    return calculateRetrievalPlan(parking, currentSelectedId);
  }, [parking, currentSelectedId]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/40 border border-cyan-500/40 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 mb-1">
          <Zap size={15} />
          <span>Assistant de Déblocage & Récupération Intelligente</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Sortie & Récupération Optimisée
        </h1>
        <p className="text-xs text-slate-300 mt-1 max-w-2xl">
          Sélectionnez un véhicule pour analyser sa voie et générer automatiquement le plan de manœuvre avec le <strong>minimum de déplacements</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Vehicle Selector */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Sélectionner un véhicule ({allVehicles.length})</span>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une plaque, vol..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500 uppercase"
              />
            </div>

            {/* List of Vehicles */}
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {filteredVehicles.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">Aucun véhicule trouvé</div>
              ) : (
                filteredVehicles.map((v) => {
                  const isSelected = v.id === currentSelectedId;
                  const isBlocked = v.slotIndex > 0;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setActiveTargetId(v.id)}
                      className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-cyan-950/80 border-cyan-400 ring-2 ring-cyan-500/40 text-white shadow-md"
                          : "bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold text-xs">
                          {v.plate}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{v.model || "Véhicule"}</div>
                          <div className="text-[10px] text-slate-400">
                            {getLaneName(v.laneIndex, parking)} • Pos. {v.slotIndex + 1}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        {isBlocked ? (
                          <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                            {v.slotIndex} bloquant{v.slotIndex > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                            Direct (Sortie)
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Execution Plan */}
        <div className="lg:col-span-7">
          {plan ? (
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
              {/* Target Vehicle Header Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-white font-black text-sm shadow-md">
                    <Car size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-amber-300 font-mono tracking-wider">
                        {plan.targetVehicle.plate}
                      </span>
                      <span className="text-xs font-bold text-white">({plan.targetVehicle.model})</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Emplacement actuel : <strong>{getLaneName(plan.targetLaneIndex, parking)}</strong> (Position {plan.targetSlotIndex + 1})
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-slate-400">Départ prévu :</div>
                  <div className="text-xs font-bold text-white">{fmtDateTime(plan.targetVehicle.departure)}</div>
                </div>
              </div>

              {/* Status Banner */}
              {plan.isDirect ? (
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <CheckCircle2 size={22} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-emerald-300">Récupération Directe</h4>
                      <p className="text-xs text-slate-300">
                        Aucun véhicule ne bloque la sortie. La voiture est en première position.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onExitVehicle(plan.targetVehicle)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/60 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <LogOut size={15} />
                    <span>Sortir le véhicule</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <AlertTriangle size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-amber-300">
                      {plan.movesCount} déplacement{plan.movesCount > 1 ? "s" : ""} nécessaire{plan.movesCount > 1 ? "s" : ""}
                    </h4>
                    <p className="text-xs text-slate-300">
                      Suivez les étapes ci-dessous pour libérer la voie avec le minimum absolu de manœuvres.
                    </p>
                  </div>
                </div>
              )}

              {/* Step-by-Step Instructions */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Ordre recommandé des manœuvres :
                </div>

                <div className="space-y-2.5">
                  {plan.steps.map((st) => {
                    const isMove = st.type === "MOVE_BLOCKING";
                    return (
                      <div
                        key={st.step}
                        className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isMove ? "bg-slate-950 border-slate-800" : "bg-emerald-950/30 border-emerald-500/50"
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              isMove ? "bg-slate-800 text-slate-300" : "bg-emerald-600 text-white"
                            }`}
                          >
                            {st.step}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-amber-300 text-xs">{st.vehicle.plate}</span>
                              <span className="text-xs font-bold text-white">{st.description}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {isMove ? (
                                <span>
                                  De {getLaneName(st.fromLaneIndex, parking)} (Pos. {st.fromSlotIndex + 1}) ➔{" "}
                                  <span className="text-cyan-400 font-bold">
                                    {st.toLaneIndex !== null ? getLaneName(st.toLaneIndex, parking) : "Voie Libre"}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-emerald-400 font-semibold">Véhicule libéré pour le client</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Button for each step */}
                        {isMove ? (
                          <button
                            onClick={() => onMoveVehicle(st.vehicle)}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <Move size={13} />
                            <span>Déplacer</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onExitVehicle(st.vehicle)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-lg shadow-emerald-950/50"
                          >
                            <LogOut size={14} />
                            <span>Sortir</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center text-slate-500 text-sm">
              Sélectionnez un véhicule à gauche pour afficher son plan de déblocage optimisé.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
