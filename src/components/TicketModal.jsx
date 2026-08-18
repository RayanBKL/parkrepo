import React from "react";
import { X, Printer, Car, QrCode, Calendar, Clock, Plane, Phone, FileText } from "lucide-react";
import { fmtDateTime } from "../services/algorithm";

export default function TicketModal({ isOpen, onClose, vehicle, laneIndex, slotIndex, parkingName }) {
  if (!isOpen || !vehicle) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl overflow-hidden relative">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <FileText size={18} className="text-cyan-400" />
            Fiche Véhicule & Porte-Clé
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Aperçu du Ticket Imprimable */}
        <div id="printable-ticket" className="my-4 p-5 bg-white text-slate-950 rounded-2xl shadow-lg font-sans">
          {/* Header du ticket */}
          <div className="text-center pb-3 border-b-2 border-dashed border-slate-300">
            <div className="text-xs font-black uppercase tracking-widest text-slate-500">
              {parkingName || "PARK OPTIMIZER PRO"}
            </div>
            <div className="text-xl font-black tracking-tight mt-0.5">BON DE PRISE EN CHARGE</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Valet & Airport Parking Management</div>
          </div>

          {/* Plaque centrale */}
          <div className="my-3 py-2 text-center bg-slate-900 text-amber-300 rounded-xl font-mono font-black text-xl tracking-widest border-2 border-slate-800 shadow-inner">
            {vehicle.plate}
          </div>

          {/* Détails Véhicule & Emplacement */}
          <div className="space-y-2 text-xs divide-y divide-slate-100">
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-500 font-semibold">Emplacement :</span>
              <span className="font-black text-sm bg-cyan-100 text-cyan-900 px-2 py-0.5 rounded">
                VOIE {laneIndex !== undefined ? laneIndex + 1 : "?"} (Pos {slotIndex !== undefined ? slotIndex + 1 : "?"})
              </span>
            </div>

            <div className="flex items-center justify-between pt-1.5">
              <span className="text-slate-500 font-semibold">Modèle :</span>
              <span className="font-bold text-slate-800">{vehicle.model || "—"}</span>
            </div>

            <div className="flex items-center justify-between pt-1.5">
              <span className="text-slate-500 font-semibold">Départ Prévu :</span>
              <span className="font-black text-red-600">{fmtDateTime(vehicle.departure)}</span>
            </div>

            <div className="flex items-center justify-between pt-1.5">
              <span className="text-slate-500 font-semibold">Arrivée Dépose :</span>
              <span className="font-medium text-slate-700">{fmtDateTime(vehicle.arrivedAt)}</span>
            </div>

            {vehicle.flightNumber && (
              <div className="flex items-center justify-between pt-1.5">
                <span className="text-slate-500 font-semibold">Vol Retour :</span>
                <span className="font-mono font-bold text-sky-700">{vehicle.flightNumber}</span>
              </div>
            )}

            {vehicle.phone && (
              <div className="flex items-center justify-between pt-1.5">
                <span className="text-slate-500 font-semibold">Téléphone Client :</span>
                <span className="font-mono font-bold text-slate-800">{vehicle.phone}</span>
              </div>
            )}

            {vehicle.notes && (
              <div className="pt-1.5">
                <span className="text-slate-500 font-semibold block text-[10px]">Instructions / Clé :</span>
                <span className="font-medium text-slate-800 italic">{vehicle.notes}</span>
              </div>
            )}
          </div>

          {/* QR / Code barre factice */}
          <div className="mt-4 pt-3 border-t-2 border-dashed border-slate-300 text-center flex flex-col items-center">
            <div className="font-mono text-[10px] text-slate-400 tracking-widest uppercase">
              ID: {vehicle.id}
            </div>
            <div className="text-[9px] text-slate-400 mt-1">À fixer aux clés ou poser sur le tableau de bord</div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold"
          >
            Fermer
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/40 flex items-center gap-1.5 cursor-pointer"
          >
            <Printer size={14} /> Imprimer le Ticket
          </button>
        </div>
      </div>
    </div>
  );
}
