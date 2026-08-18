import React, { useState } from "react";
import {
  X,
  Sparkles,
  Plus,
  ArrowRight,
  RotateCcw,
  Car,
  Clock,
  Plane,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Play,
  Zap,
} from "lucide-react";
import { assignLane } from "../../services/algorithm";
import { getLaneName } from "../../services/cloudDb";

// Données initiales de simulation pour la démo
const INITIAL_DEMO_LANES = [
  [
    { id: "d1", plate: "AA-123-BB", model: "Peugeot 208", departure: "2026-08-20T14:00", departureDate: "2026-08-20", departureTime: "14:00", flightNumber: "AF1234" },
    { id: "d2", plate: "BB-456-CC", model: "Tesla Model 3", departure: "2026-08-21T09:30", departureDate: "2026-08-21", departureTime: "09:30" },
  ],
  [
    { id: "d3", plate: "CC-789-DD", model: "Audi A3", departure: "2026-08-19T18:00", departureDate: "2026-08-19", departureTime: "18:00", flightNumber: "TO456" },
  ],
  [
    { id: "d4", plate: "DD-012-EE", model: "Renault Clio", departure: "2026-08-22T11:15", departureDate: "2026-08-22", departureTime: "11:15" },
    { id: "d5", plate: "EE-345-FF", model: "VW Golf", departure: "2026-08-23T16:45", departureDate: "2026-08-23", departureTime: "16:45" },
  ],
];

export default function DemoSandboxModal({ isOpen, onClose, onSignup }) {
  if (!isOpen) return null;

  const [lanes, setLanes] = useState(INITIAL_DEMO_LANES);
  const [capacity] = useState(4);
  const [plate, setPlate] = useState("");
  const [model, setModel] = useState("");
  const [departureDate, setDepartureDate] = useState("2026-08-20");
  const [departureTime, setDepartureTime] = useState("10:00");
  const [flightNumber, setFlightNumber] = useState("");
  const [lastAlgorithmResult, setLastAlgorithmResult] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [retrievalSteps, setRetrievalSteps] = useState(null);

  // Ajouter un véhicule dans la simulation et tester l'algorithme
  const handleSimulateAdd = (e) => {
    e.preventDefault();
    if (!plate.trim()) return;

    const isoDeparture = `${departureDate}T${departureTime}`;
    const newVehicle = {
      id: "demo-" + Date.now(),
      plate: plate.toUpperCase().trim(),
      model: model.trim() || "Véhicule",
      departure: isoDeparture,
      departureDate,
      departureTime,
      flightNumber: flightNumber.trim() || undefined,
    };

    // Calcul de l'assignation par l'algorithme Tightest Fit
    const assignment = assignLane(lanes, capacity, newVehicle, "patience");

    if (assignment.waiting || assignment.laneIndex === -1) {
      setLastAlgorithmResult({
        success: false,
        message: "Toutes les voies sont actuellement pleines à leur capacité maximale (4/4) ! Le véhicule est placé en file d'attente.",
      });
      return;
    }

    const newLanes = lanes.map((lane) => [...lane]);
    newLanes[assignment.laneIndex].splice(assignment.insertIndex, 0, newVehicle);
    setLanes(newLanes);

    const laneName = getLaneName(assignment.laneIndex);
    setLastAlgorithmResult({
      success: true,
      laneName,
      position: assignment.insertIndex + 1,
      strategy: assignment.strategy,
      message: `✨ Véhicule assigné automatiquement à la ${laneName} (Position ${assignment.insertIndex + 1}/${capacity}) pour un départ prévu le ${departureDate} à ${departureTime}.`,
    });

    // Reset formulaire
    setPlate("");
    setModel("");
    setFlightNumber("");
    setSelectedVehicle(null);
    setRetrievalSteps(null);
  };

  // Simuler la récupération d'un véhicule
  const handleSelectVehicleForRetrieval = (v, laneIdx, posIdx) => {
    setSelectedVehicle(v);
    const lane = lanes[laneIdx];
    // Véhicules bloquants devant lui (positions avant lui vers la sortie)
    const blocking = lane.slice(0, posIdx);

    setRetrievalSteps({
      target: v,
      laneName: getLaneName(laneIdx),
      blockingCount: blocking.length,
      blockingVehicles: blocking,
      directExit: blocking.length === 0,
    });
  };

  // Réinitialiser la simulation
  const handleReset = () => {
    setLanes(INITIAL_DEMO_LANES);
    setLastAlgorithmResult(null);
    setSelectedVehicle(null);
    setRetrievalSteps(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-5xl max-h-[92vh] bg-slate-900 border border-cyan-500/40 rounded-3xl shadow-2xl shadow-cyan-950/80 flex flex-col overflow-hidden text-slate-100 font-sans">
        {/* Header de la Démo */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Zap size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">Démo Interactive de Tri</h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold">
                  Mode Bac à Sable
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Testez en temps réel l'algorithme d'ordonnancement sans inscription requise
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Réinitialiser</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Corps de la Démo */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Bandeau d'information Sandbox */}
          <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-cyan-200">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-cyan-400 shrink-0" />
              <span>
                <strong>Comment tester ?</strong> Ajoutez un véhicule avec sa date/heure de retour. L'algorithme calcule instantanément sa voie optimale. Cliquez ensuite sur une voiture pour tester l'assistant de sortie.
              </span>
            </div>
            <button
              onClick={() => {
                onClose();
                if (onSignup) onSignup();
              }}
              className="shrink-0 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <span>Créer mon vrai parking</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Formulaire de simulation d'entrée */}
            <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Plus size={14} className="text-cyan-400" />
                <span>Simuler l'entrée d'un véhicule</span>
              </h3>

              <form onSubmit={handleSimulateAdd} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Immatriculation</label>
                  <input
                    type="text"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value)}
                    placeholder="ex: FJ-892-AZ"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold tracking-wider uppercase focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Modèle</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="ex: Peugeot 3008"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Date Retour</label>
                    <input
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Heure</label>
                    <input
                      type="time"
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">N° de Vol (Optionnel)</label>
                  <input
                    type="text"
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                    placeholder="ex: AF789"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>Calculer & Placer le Véhicule</span>
                </button>
              </form>

              {/* Résultat algorithme */}
              {lastAlgorithmResult && (
                <div
                  className={`p-3 rounded-xl border text-xs leading-relaxed animate-in fade-in ${
                    lastAlgorithmResult.success
                      ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                      : "bg-amber-950/40 border-amber-500/40 text-amber-200"
                  }`}
                >
                  <div className="font-bold mb-0.5">Décision de l'Algorithme :</div>
                  {lastAlgorithmResult.message}
                </div>
              )}
            </div>

            {/* Visualisation Grille 2D des Voies */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Layers size={14} className="text-emerald-400" />
                  <span>Grille de Rangement en Direct (3 Voies • Capacité 4)</span>
                </h3>
                <span className="text-[11px] text-slate-500">Cliquez sur un véhicule pour tester la sortie</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {lanes.map((lane, laneIdx) => {
                  const laneName = getLaneName(laneIdx);
                  return (
                    <div key={laneIdx} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-850">
                        <span className="font-bold text-xs text-white">{laneName}</span>
                        <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                          {lane.length}/{capacity}
                        </span>
                      </div>

                      {/* Sortie de voie */}
                      <div className="text-[10px] uppercase font-mono text-center text-slate-500 py-1 bg-slate-900/50 rounded-lg mb-2 border border-dashed border-slate-800">
                        ⬇️ Sens de Sortie
                      </div>

                      {/* Véhicules dans la voie */}
                      <div className="space-y-2 flex-1">
                        {lane.map((v, posIdx) => (
                          <div
                            key={v.id}
                            onClick={() => handleSelectVehicleForRetrieval(v, laneIdx, posIdx)}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer text-xs ${
                              selectedVehicle?.id === v.id
                                ? "bg-cyan-950 border-cyan-400 ring-2 ring-cyan-500/40 text-white"
                                : "bg-slate-900 border-slate-700/80 hover:border-slate-600 text-slate-200"
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span className="font-mono text-cyan-300">{v.plate}</span>
                              <span className="text-[10px] text-slate-400">{v.departureTime}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 truncate mt-0.5">{v.model}</div>
                            <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                              <span>📅 {v.departureDate}</span>
                              {v.flightNumber && <span className="text-emerald-400">✈️ {v.flightNumber}</span>}
                            </div>
                          </div>
                        ))}

                        {/* Emplacements vides */}
                        {Array.from({ length: Math.max(0, capacity - lane.length) }).map((_, i) => (
                          <div
                            key={`empty-${i}`}
                            className="h-14 rounded-xl border border-dashed border-slate-850 flex items-center justify-center text-[10px] text-slate-600"
                          >
                            Place Libre
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Module Assistant Récupération */}
              {retrievalSteps && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Car size={16} className="text-cyan-400" />
                      <span className="font-bold text-xs text-white">
                        Assistant de Sortie pour <strong className="text-cyan-300">{retrievalSteps.target.plate}</strong> ({retrievalSteps.laneName})
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        retrievalSteps.directExit
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                          : "bg-amber-950 text-amber-300 border border-amber-500/40"
                      }`}
                    >
                      {retrievalSteps.directExit ? "Sortie Directe (0 blocage)" : `${retrievalSteps.blockingCount} véhicule(s) à déplacer`}
                    </span>
                  </div>

                  {retrievalSteps.directExit ? (
                    <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-200 flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                      <span>Ce véhicule est en tête de file ! Sortie immédiate sans aucune manœuvre requise.</span>
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs">
                      <div className="text-slate-400">Ordre optimal de manœuvre guidée :</div>
                      {retrievalSteps.blockingVehicles.map((b, idx) => (
                        <div key={b.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                          <span className="text-slate-300">
                            Étape {idx + 1} : Déplacer <strong className="text-white font-mono">{b.plate}</strong> ({b.model}) vers une voie tampon
                          </span>
                          <span className="text-[10px] text-amber-400 font-semibold">Manœuvre requise</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Démo */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-400 text-center sm:text-left">
            Prêt à optimiser la gestion physique de votre véritable parking ?
          </div>
          <button
            onClick={() => {
              onClose();
              if (onSignup) onSignup();
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-bold text-xs shadow-lg shadow-cyan-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Créer mon compte professionnel</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
