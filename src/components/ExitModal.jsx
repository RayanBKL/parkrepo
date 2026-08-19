import React, { useEffect, useState } from "react";
import { X, Receipt, Clock, CreditCard, CheckCircle2 } from "lucide-react";
import { calculatePrice } from "../services/billing";

export default function ExitModal({ isOpen, vehicle, parking, onConfirm, onCancel }) {
  if (!isOpen || !vehicle) return null;

  const [bill, setBill] = useState(null);

  useEffect(() => {
    if (vehicle && parking) {
      const exitedAt = new Date();
      const pricing = parking.pricing || { hourlyRate: 0, dailyRate: 0, currency: "EUR" };
      const calculated = calculatePrice(vehicle.arrivedAt, exitedAt, pricing);
      setBill(calculated);
    }
  }, [vehicle, parking]);

  if (!bill) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Receipt size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Facturation</h2>
              <p className="text-xs text-slate-400">Véhicule {vehicle.plate}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="py-6 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Temps de stationnement</span>
              <span className="font-bold text-white flex items-center gap-1"><Clock size={14}/> {bill.hours} h</span>
            </div>
            
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Tarif appliqué</span>
              <span className="font-bold text-cyan-300">
                {parking.pricing?.hourlyRate ? `${parking.pricing.hourlyRate}${bill.currency}/h` : "Gratuit"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 to-emerald-950/40 border border-cyan-500/30">
            <span className="text-sm font-bold text-white">Total à régler</span>
            <span className="text-2xl font-black text-cyan-400">
              {bill.formatted} {bill.currency}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            onClick={() => onConfirm(bill)}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/40 transition-all flex items-center gap-2 cursor-pointer"
          >
            <CreditCard size={16} />
            Confirmer & Sortir
          </button>
        </div>
      </div>
    </div>
  );
}
