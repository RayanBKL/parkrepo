import React, { useState, useRef } from "react";
import { X, Settings, Download, Upload, ShieldCheck, AlertTriangle, RefreshCw, CheckCircle2, Lock } from "lucide-react";
import { exportDatabaseBackup, importDatabaseBackup } from "../services/db";

export default function SettingsModal({
  isOpen,
  onClose,
  parking,
  databaseState,
  onUpdateParkingSettings,
  onRestoreDatabase,
  onResetParking,
}) {
  if (!isOpen) return null;

  const fileInputRef = useRef(null);
  const [laneCount, setLaneCount] = useState(parking?.laneCount || 30);
  const [capacity, setCapacity] = useState(parking?.capacity || 10);
  const [name, setName] = useState(parking?.name || "");
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSaveGeometry = (e) => {
    e.preventDefault();
    onUpdateParkingSettings({
      name: name.trim() || parking.name,
      laneCount: Math.max(1, Number(laneCount) || 30),
      capacity: Math.max(1, Number(capacity) || 10),
    });
    setMsg("Paramètres du parking mis à jour avec succès !");
    setTimeout(() => setMsg(""), 3000);
  };

  const handleDownloadBackup = () => {
    exportDatabaseBackup(databaseState);
    setMsg("Sauvegarde complète téléchargée !");
    setTimeout(() => setMsg(""), 3000);
  };

  const handleUploadBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result;
      const res = importDatabaseBackup(content);
      if (res.success) {
        onRestoreDatabase(res.data);
        setMsg("Base de données restaurée avec succès !");
        setTimeout(() => {
          setMsg("");
          onClose();
        }, 1500);
      } else {
        alert(`Erreur de restauration : ${res.error}`);
      }
    };
    reader.readAsText(file);
  };

  const handleSecureReset = () => {
    if (confirmPhrase.trim().toUpperCase() !== "EFFACER") {
      alert("Veuillez saisir exactement le mot 'EFFACER' pour confirmer.");
      return;
    }
    onResetParking();
    setShowResetConfirm(false);
    setConfirmPhrase("");
    setMsg("Le parking actif a été réinitialisé.");
    setTimeout(() => setMsg(""), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <Settings size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Paramètres & Sauvegardes</h2>
              <p className="text-xs text-slate-400">Configuration du parc et sécurité des données</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {msg && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} />
            {msg}
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Section 1 : Configuration du parking actif */}
          <form onSubmit={handleSaveGeometry} className="space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              Configuration du parking actif ({parking?.name})
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nom du parking</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre de voies</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={laneCount}
                  onChange={(e) => setLaneCount(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Capacité par voie</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Enregistrer la configuration
            </button>
          </form>

          {/* Section 2 : Sauvegardes & Restauration Inviolable */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" />
              Persistance & Sauvegardes
            </h3>
            <p className="text-xs text-slate-400">
              Vos données sont automatiquement enregistrées en continu dans la mémoire de votre navigateur. Vous pouvez également exporter ou restaurer un fichier complet.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group flex items-center gap-3 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                  <Download size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">Exporter Sauvegarde</div>
                  <div className="text-[10px] text-slate-500">Télécharger fichier .json</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/40 text-left transition-all group flex items-center gap-3 cursor-pointer"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleUploadBackup}
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <Upload size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">Restaurer Sauvegarde</div>
                  <div className="text-[10px] text-slate-500">Importer fichier .json</div>
                </div>
              </button>
            </div>
          </div>

          {/* Section 3 : Zone de Danger / Réinitialisation Sécurisée */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle size={14} /> Zone de Réinitialisation
            </h3>

            {!showResetConfirm ? (
              <div className="flex items-center justify-between p-3 bg-rose-950/20 border border-rose-900/40 rounded-2xl">
                <div>
                  <div className="text-xs font-bold text-rose-300">Vider le parking actif</div>
                  <div className="text-[10px] text-slate-400">
                    Efface tous les véhicules du parking sélectionné sans toucher aux autres parkings
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
                >
                  Vider...
                </button>
              </div>
            ) : (
              <div className="p-4 bg-rose-950/40 border border-rose-500/50 rounded-2xl space-y-3 animate-in fade-in">
                <div className="text-xs text-rose-200 font-semibold flex items-center gap-1.5">
                  <Lock size={14} /> Protection anti-suppression accidentelle :
                </div>
                <p className="text-[11px] text-slate-300">
                  Tapez <span className="font-bold text-white bg-slate-900 px-1 py-0.5 rounded">EFFACER</span> ci-dessous pour confirmer la vidange de ce parking :
                </p>
                <input
                  type="text"
                  value={confirmPhrase}
                  onChange={(e) => setConfirmPhrase(e.target.value)}
                  placeholder="Tapez EFFACER"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-rose-500/60 text-rose-300 font-bold text-xs focus:outline-none uppercase"
                />
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetConfirm(false);
                      setConfirmPhrase("");
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-700 text-slate-400 text-xs font-semibold"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    disabled={confirmPhrase.trim().toUpperCase() !== "EFFACER"}
                    onClick={handleSecureReset}
                    className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    Confirmer la vidange
                  </button>
                </div>
              </div>
            )}
          </div>
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
