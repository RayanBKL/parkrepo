import React, { useState, useEffect, useMemo } from "react";
import { X, Car, Calendar, Clock, Plane, Phone, FileText, CheckCircle2, Sparkles, Navigation, Layers } from "lucide-react";
import { generateVehicleId, assignLane } from "../services/algorithm";
import { getLaneName } from "../services/cloudDb";

export default function VehicleModal({
  isOpen,
  onClose,
  onSave,
  editingVehicle,
  targetLaneIndex,
  parking,
  activeStrategy = "patience",
}) {
  if (!isOpen) return null;

  const [plate, setPlate] = useState("");
  const [model, setModel] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [departureTime, setDepartureTime] = useState("12:00");
  const [flightNumber, setFlightNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedLane, setSelectedLane] = useState(
    targetLaneIndex !== null && targetLaneIndex !== undefined ? targetLaneIndex : "auto"
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingVehicle) {
      setPlate(editingVehicle.plate || "");
      setModel(editingVehicle.model || "");
      setFlightNumber(editingVehicle.flightNumber || "");
      setPhone(editingVehicle.phone || "");
      setNotes(editingVehicle.notes || "");

      if (editingVehicle.departure) {
        const d = new Date(editingVehicle.departure);
        if (!isNaN(d.getTime())) {
          setDepartureDate(d.toISOString().slice(0, 10));
          setDepartureTime(d.toTimeString().slice(0, 5));
        }
      }
      setSelectedLane(targetLaneIndex !== null && targetLaneIndex !== undefined ? targetLaneIndex : "auto");
    } else {
      setPlate("");
      setModel("");
      setFlightNumber("");
      setPhone("");
      setNotes("");
      setError("");

      const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
      setDepartureDate(tomorrow.toISOString().slice(0, 10));
      setDepartureTime("14:00");
      setSelectedLane(targetLaneIndex !== null && targetLaneIndex !== undefined ? targetLaneIndex : "auto");
    }
  }, [editingVehicle, isOpen, targetLaneIndex]);

  // Formatter la plaque automatiquement en majuscules
  const handlePlateChange = (val) => {
    setPlate(val.toUpperCase().replace(/\s+/g, ""));
    setError("");
  };

  // Raccourcis de date de départ
  const setQuickDeparture = (hoursOffset) => {
    const d = new Date(Date.now() + hoursOffset * 3600 * 1000);
    setDepartureDate(d.toISOString().slice(0, 10));
    setDepartureTime(d.toTimeString().slice(0, 5));
  };

  // Calcul en direct de la voie recommandée par l'algorithme
  const recommendation = useMemo(() => {
    if (!parking?.lanes || !departureDate || !departureTime) return null;
    const departureDateTime = new Date(`${departureDate}T${departureTime}:00`);
    if (isNaN(departureDateTime.getTime())) return null;

    const dummy = {
      departure: departureDateTime.toISOString(),
      flightNumber: flightNumber.trim().toUpperCase(),
    };

    const res = assignLane(parking.lanes, parking.capacity || 10, dummy, activeStrategy);
    if (res.waiting || res.laneIndex === -1) {
      return { laneIndex: -1, isFull: true, name: "File d'attente", reason: "Toutes les voies sont complètes" };
    }

    const name = getLaneName(res.laneIndex, parking);
    const lane = parking.lanes[res.laneIndex] || [];
    const free = (parking.capacity || 10) - lane.length;

    let reason = "Aligné chronologiquement (0 blocage)";
    if (res.strategy === "same_date") reason = "Départ à la même heure";
    if (res.strategy === "flight_match") reason = "Même numéro de vol";
    if (res.strategy === "empty_lane") reason = "Voie totalement libre";

    return {
      laneIndex: res.laneIndex,
      name,
      reason,
      free,
      isFull: false,
    };
  }, [parking, departureDate, departureTime, flightNumber, activeStrategy]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!plate.trim()) {
      setError("Le numéro d'immatriculation est obligatoire.");
      return;
    }

    if (!departureDate || !departureTime) {
      setError("La date et l'heure de départ sont obligatoires.");
      return;
    }

    const departureDateTime = new Date(`${departureDate}T${departureTime}:00`);
    if (isNaN(departureDateTime.getTime())) {
      setError("Date de départ invalide.");
      return;
    }

    const vehicleData = {
      id: editingVehicle ? editingVehicle.id : generateVehicleId(),
      plate: plate.trim().toUpperCase(),
      model: model.trim() || "Véhicule Client",
      departure: departureDateTime.toISOString(),
      arrivedAt: editingVehicle ? editingVehicle.arrivedAt : new Date().toISOString(),
      flightNumber: flightNumber.trim().toUpperCase(),
      phone: phone.trim(),
      notes: notes.trim(),
    };

    const finalLane = selectedLane === "auto" ? null : Number(selectedLane);
    onSave(vehicleData, finalLane);
    onClose();
  };

  const isPretargeted = targetLaneIndex !== null && targetLaneIndex !== undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Car size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">
                {editingVehicle ? "Modifier le Véhicule" : "Ajouter / Déposer un Véhicule"}
              </h2>
              <p className="text-xs text-slate-400">
                {isPretargeted
                  ? `Placement ciblé dans ${getLaneName(targetLaneIndex, parking)}`
                  : "Placement optimisé automatique selon l'algorithme de tri"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 flex-1 overflow-y-auto pr-1">
          {/* Plaque & Modèle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Plaque d'immatriculation *
              </label>
              <input
                type="text"
                value={plate}
                onChange={(e) => handlePlateChange(e.target.value)}
                placeholder="ex: AA-123-BB"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 font-mono font-bold text-sm tracking-wider focus:outline-none focus:border-cyan-500 uppercase"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Marque / Modèle</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="ex: Peugeot 208, Clio..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Date et Heure de départ / Récupération */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-300">
                Date & Heure de Sortie / Départ *
              </label>
              <div className="flex items-center gap-1 text-[10px] text-cyan-400">
                <Sparkles size={11} />
                <span>Raccourcis :</span>
                <button
                  type="button"
                  onClick={() => setQuickDeparture(2)}
                  className="hover:underline text-slate-300 ml-1 cursor-pointer"
                >
                  +2h
                </button>
                •
                <button
                  type="button"
                  onClick={() => setQuickDeparture(12)}
                  className="hover:underline text-slate-300 cursor-pointer"
                >
                  +12h
                </button>
                •
                <button
                  type="button"
                  onClick={() => setQuickDeparture(72)}
                  className="hover:underline text-slate-300 cursor-pointer"
                >
                  +3j
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="relative">
                <input
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Proposition / Recommandation dynamique de la meilleure voie */}
          {recommendation && !isPretargeted && (
            <div className="p-3.5 bg-gradient-to-r from-cyan-950/50 via-slate-900 to-emerald-950/50 border border-cyan-500/40 rounded-2xl animate-in fade-in">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <Navigation size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Meilleure voie :</span>
                      <span className="text-cyan-300 font-extrabold bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/50">
                        {recommendation.name}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      💡 {recommendation.reason} ({recommendation.free} place(s) restante(s))
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  <select
                    value={selectedLane}
                    onChange={(e) => setSelectedLane(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-[11px] font-bold focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="auto">Auto (Recommandé : {recommendation.name})</option>
                    {(parking?.lanes || []).map((lane, idx) => {
                      const freeSlots = (parking.capacity || 10) - lane.length;
                      return (
                        <option key={idx} value={idx}>
                          {getLaneName(idx, parking)} ({freeSlots} libre{freeSlots > 1 ? "s" : ""})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Numéro de vol & Téléphone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Plane size={12} className="text-sky-400" /> N° de Vol Retour (optionnel)
              </label>
              <input
                type="text"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value)}
                placeholder="ex: AF1234, TO456"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500 uppercase font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Phone size={12} className="text-emerald-400" /> Téléphone Client
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="ex: 06 12 34 56 78"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
              <FileText size={12} className="text-slate-400" /> Instructions / Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ex: Nettoyage demandé, clé déposée casier 4..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-300 text-xs font-semibold focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Boutons Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/40 transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 size={16} />
              {editingVehicle ? "Sauvegarder les modifications" : "Enregistrer et Placer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

