import React, { useState } from "react";
import { X, KeyRound, Loader2, CheckCircle2, AlertCircle, Building2, Copy, Check, RefreshCw } from "lucide-react";
import { joinParkingWithCode, createParking, regenerateAccessCode } from "../services/cloudDb";

// ---------------------------------------------------------------------------
// Modal de Rejoindre un Parking via Code Secret
// ---------------------------------------------------------------------------

export function JoinParkingModal({ isOpen, onClose, userId, onParкingJoined }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleJoin = async (e) => {
    e.preventDefault();
    setError("");

    if (!code.trim() || code.trim().length < 6) {
      setError("Veuillez saisir un code d'accès valide.");
      return;
    }

    setLoading(true);
    try {
      const result = await joinParkingWithCode(userId, code.trim());
      onParкingJoined(result.parkingId, result.alreadyJoined);
      onClose();
      setCode("");
    } catch (err) {
      setError(err.message || "Code invalide ou expiré. Vérifiez le code et réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Rejoindre un Parking</h2>
              <p className="text-xs text-slate-400">Entrez le code secret partagé par le propriétaire</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleJoin} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Code d'Accès du Parking
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ex: PARK-A1B2-C3D4"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 font-mono font-bold text-sm tracking-widest focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 uppercase text-center"
              autoFocus
            />
            <p className="text-[10px] text-slate-500 mt-1.5 text-center">
              Ce code vous a été transmis par le responsable du parking
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-semibold cursor-pointer">
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold shadow-lg shadow-blue-900/40 flex items-center gap-2 cursor-pointer"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Rejoindre
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal de Gestion du Code d'Accès (Propriétaire)
// ---------------------------------------------------------------------------

export function AccessCodeModal({ isOpen, onClose, parking, userId }) {
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [currentCode, setCurrentCode] = useState(parking?.accessCode || null);

  if (!isOpen || !parking) return null;

  const handleCopy = () => {
    if (!currentCode) return;
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRegenerate = async () => {
    if (!window.confirm("Révoquer l'ancien code et en générer un nouveau ? Les personnes qui ont l'ancien code ne pourront plus l'utiliser pour rejoindre.")) return;

    setRegenerating(true);
    try {
      const newCode = await regenerateAccessCode(parking.id, userId);
      setCurrentCode(newCode);
    } catch (err) {
      alert(err.message);
    } finally {
      setRegenerating(false);
    }
  };

  const isOwner = parking.ownerId === userId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Code d'Accès — {parking.name}</h2>
              <p className="text-xs text-slate-400">Partagez ce code pour inviter des collaborateurs</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center shadow-inner">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Code d'Accès Partageable</div>
            <div className="font-mono font-black text-2xl text-amber-300 tracking-widest mb-3 select-all">
              {currentCode}
            </div>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all shadow-lg hover:shadow-slate-900/50 cursor-pointer"
            >
              {copied ? <><Check size={14} className="text-emerald-400" /> Copié !</> : <><Copy size={14} /> Copier le Code</>}
            </button>
          </div>

          <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl text-xs text-blue-200 space-y-1">
            <div className="font-bold">ℹ Comment partager l'accès :</div>
            <div>1. Transmettez ce code à votre collaborateur (par message, email...)</div>
            <div>2. Il crée un compte sur ParkOptimizer et clique sur "Rejoindre un Parking"</div>
            <div>3. Il saisit ce code → il accède immédiatement en lecture et écriture</div>
          </div>

          {isOwner && (
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="w-full py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {regenerating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Révoquer et Régénérer un Nouveau Code
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
