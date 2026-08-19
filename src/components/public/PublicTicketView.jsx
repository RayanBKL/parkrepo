import React, { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../services/firebase";
import { Car, Clock, Plane, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { fmtDateTime } from "../../services/algorithm";

export default function PublicTicketView({ ticketId }) {
  const [vehicle, setVehicle] = useState(null);
  const [parking, setParking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ticketId) {
      setError("Lien de ticket invalide.");
      setLoading(false);
      return;
    }

    const fetchTicket = async () => {
      try {
        const getPublicTicket = httpsCallable(functions, "getPublicTicket");
        const result = await getPublicTicket({ ticketId });
        
        setVehicle(result.data.vehicle);
        setParking(result.data.parking);
      } catch (err) {
        if (err.code === "functions/not-found") {
          setError(err.message);
        } else {
          setError("Impossible de charger le ticket. Lien invalide ou expiré.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [ticketId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-bold">Chargement de votre ticket...</p>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-black text-white mb-2">Ticket Invalide</h2>
        <p className="text-slate-400 text-sm max-w-sm">{error || "Ce ticket n'existe pas ou a expiré."}</p>
      </div>
    );
  }

  const isExited = !!vehicle.exitedAt;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center py-12 px-4 font-sans relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden relative z-10">
        
        {/* Header */}
        <div className="p-6 text-center border-b border-slate-800 bg-slate-950/50">
          <div className="text-[10px] uppercase tracking-widest text-cyan-500 font-black mb-1">
            {parking?.name || "Park Optimizer"}
          </div>
          <h1 className="text-2xl font-black text-white">Ticket Numérique</h1>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center -mt-4 relative z-20">
          {isExited ? (
            <span className="bg-slate-800 border-2 border-slate-700 text-slate-300 font-black text-xs px-4 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Terminé (Sorti)
            </span>
          ) : (
            <span className="bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-400 font-black text-xs px-4 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-emerald-500/20">
              <Car size={14} /> En Cours
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-6 space-y-6">
          <div className="text-center">
            <div className="text-3xl font-mono font-black text-amber-300 tracking-widest bg-slate-950 py-3 rounded-xl border-2 border-slate-800 shadow-inner">
              {vehicle.plate}
            </div>
            <div className="text-sm font-bold text-slate-400 mt-2">{vehicle.model || "Véhicule Client"}</div>
          </div>

          <div className="space-y-3 bg-slate-950/40 p-5 rounded-2xl border border-slate-800 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                <Clock size={16} className="text-slate-400"/> Arrivée
              </span>
              <span className="text-white font-bold">{fmtDateTime(vehicle.arrivedAt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                <Clock size={16} className="text-cyan-400"/> Départ prévu
              </span>
              <span className="text-cyan-300 font-black">{fmtDateTime(vehicle.departure)}</span>
            </div>
            
            {vehicle.flightNumber && (
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/50">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                  <Plane size={16} className="text-sky-400"/> Vol Retour
                </span>
                <span className="text-sky-300 font-mono font-bold">{vehicle.flightNumber}</span>
              </div>
            )}
          </div>

          {vehicle.photos && vehicle.photos.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Photos d'état</div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {vehicle.photos.map((url, idx) => (
                  <a key={idx} href={url} target="_blank" rel="noreferrer" className="shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-800 hover:border-cyan-500 transition-colors">
                    <img src={url} alt={`État ${idx}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 bg-cyan-950/20 text-center border-t border-cyan-500/20">
          <p className="text-[10px] text-cyan-400 font-semibold">
            Présentez ce ticket au voiturier ou scannez le QR code de l'allée pour récupérer votre véhicule.
          </p>
        </div>
      </div>
    </div>
  );
}
