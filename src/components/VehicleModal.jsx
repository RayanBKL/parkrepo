import React, { useState, useEffect } from "react";
import { X, Car, Calendar, Clock, Plane, Phone, FileText, CheckCircle2, Sparkles } from "lucide-react";
import { generateVehicleId } from "../services/algorithm";

export default function VehicleModal({ isOpen, onClose, onSave, editingVehicle, targetLaneIndex }) {
  if (!isOpen) return null;

  const [plate, setPlate] = useState("");
  const [model, setModel] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [departureTime, setDepartureTime] = useState("12:00");
  const [flightNumber, setFlightNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
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
    } else {
      // Valeurs par défaut pour nouvel ajout
      const defaultDep = new Date(Date.now() + 2 * 24 * 3600 * 1000); // Dans 2 jours
      defaultDep.setHours(15, 0, 0, 0);
      setDepartureDate(defaultDep.toISOString().slice(0, 10));
      setDepartureTime("15:00");
      setPlate("");
      setModel("");
      setFlightNumber("");
      setPhone("");
      setNotes("");
      setError("");
    }
  }, [editingVehicle, isOpen]);

  // Formatter la plaque automatiquement en majuscules avec tirets
  const handlePlateChange = (val) => {
    let clean = val.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    setPlate(clean);
  };

  // Raccourcis de date de départ
  const setQuickDeparture = (hoursOffset) => {
    const d = new Date(Date.now() + hoursOffset * 3600 * 1000);
    setDepartureDate(d.toISOString().slice(0, 10));
    setDepartureTime(d.toTimeString().slice(0, 5));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!plate.trim()) {
      setError("Veuillez saisir la plaque d'immatriculation.");
      return;
    }
    if (!departureDate || !departureTime) {
      setError("Veuillez saisir la date et l'heure de départ.");
      return;
    }

    const departureIso = new Date(`${departureDate}T${departureTime}:00`).toISOString();

    const vehicleData = {
      id: editingVehicle ? editingVehicle.id : generateVehicleId(),
      plate: plate.trim().toUpperCase(),
      model: model.trim() || "Véhicule Client",
      departure: departureIso,
      arrivedAt: editingVehicle ? editingVehicle.arrivedAt : new Date().toISOString(),
      flightNumber: flightNumber.trim().toUpperCase(),
      phone: phone.trim(),
      notes: notes.trim(),
    };

    onSave(vehicleData, targetLaneIndex);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Car size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">
                {editingVehicle ? "Modifier le Véhicule" : "Déposer / Ajouter un Véhicule"}
              </h2>
              <p className="text-xs text-slate-400">
                {targetLaneIndex !== null && targetLaneIndex !== undefined
                  ? `Placement ciblé dans la Voie ${targetLaneIndex + 1}`
                  : "Placement optimisé automatique selon l'heure de départ"}
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

        {error && (
          <div className="mt-4 p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 font-mono font-bold text-sm tracking-wider focus:outline-none focus:border-blue-500 uppercase"
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Date et Heure de départ / Récupération */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-300">
                Date & Heure de Sortie / Départ *
              </label>
              <div className="flex items-center gap-1 text-[10px] text-blue-400">
                <Sparkles size={11} />
                <span>Raccourcis :</span>
                <button
                  type="button"
                  onClick={() => setQuickDeparture(2)}
                  className="hover:underline text-slate-300 ml-1"
                >
                  +2h
                </button>
                •
                <button
                  type="button"
                  onClick={() => setQuickDeparture(12)}
                  className="hover:underline text-slate-300"
                >
                  +12h
                </button>
                •
                <button
                  type="button"
                  onClick={() => setQuickDeparture(72)}
                  className="hover:underline text-slate-300"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="relative">
                <input
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

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
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 uppercase font-mono"
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
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
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
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-300 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Boutons Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-semibold transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-blue-900/40 transition-all flex items-center gap-2 cursor-pointer"
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
