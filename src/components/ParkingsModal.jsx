import React, { useState } from "react";
import { X, Building2, Plus, Check, Trash2, Copy, CheckCircle2, ShieldCheck, Car } from "lucide-react";

export default function ParkingsModal({
  isOpen,
  onClose,
  parkings,
  activeParkingId,
  onSelectParking,
  onCreateParking,
  onDeleteParking,
}) {
  if (!isOpen) return null;

  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [laneCount, setLaneCount] = useState(30);
  const [capacity, setCapacity] = useState(10);
  const [copiedId, setCopiedId] = useState(null);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreateParking({
      name: name.trim(),
      // Ne pas passer de code — generateAccessCode() dans cloudDb.js s'en charge
      laneCount: Number(laneCount) || 30,
      capacity: Number(capacity) || 10,
    });

    setName("");
    setIsCreating(false);
  };

  const handleCopyCode = (pCode, id) => {
    navigator.clipboard.writeText(pCode);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 shadow-2xl overflow-hidden relative max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Building2 size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Gestion Multi-Parkings</h2>
              <p className="text-xs text-slate-400">
                Créez, gérez et partagez l'accès à plusieurs parcs automobiles
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {!isCreating ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Vos parkings ({parkings.length}) :</span>
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-cyan-950/40 cursor-pointer"
                >
                  <Plus size={14} /> Créer un nouveau parking
                </button>
              </div>

              {parkings.map((p) => {
                const isActive = p.id === activeParkingId;
                const totalCars = (p.lanes || []).reduce((acc, l) => acc + l.length, 0);
                const maxCap = (p.laneCount || 30) * (p.capacity || 10);

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectParking(p.id);
                      onClose();
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isActive
                        ? "bg-cyan-950/40 border-cyan-500 ring-2 ring-cyan-500/40"
                        : "bg-slate-950 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                          isActive
                            ? "bg-cyan-600 text-white shadow-lg shadow-cyan-900/50"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        <Building2 size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-white">{p.name}</h4>
                          {isActive && (
                            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-bold">
                              Actif
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                          <span>
                            {p.laneCount || 30} voies × {p.capacity || 10} places
                          </span>
                          <span>•</span>
                          <span className="text-emerald-400 font-semibold">
                            {totalCars} / {maxCap} véhicules
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {/* Code de partage */}
                      <button
                        type="button"
                        onClick={() => handleCopyCode(p.accessCode || p.code || p.id, p.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-inner"
                        title="Copier le code d'accès"
                      >
                        {copiedId === p.id ? (
                          <>
                            <Check size={13} className="text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Copié !</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} className="text-slate-400" />
                            <span>{p.accessCode || p.code || "PARK-01"}</span>
                          </>
                        )}
                      </button>

                      {/* Bouton de suppression disponible pour tout parking */}
                      <button
                        type="button"
                        onClick={() => onDeleteParking(p.id)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 transition-all cursor-pointer hover:shadow-lg hover:shadow-rose-900/50"
                        title="Supprimer définitivement ce parking"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Formulaire de création d'un nouveau parking */
            <form onSubmit={handleCreate} className="space-y-4 animate-in fade-in">
              <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl text-xs text-cyan-200">
                Chaque parking possède sa propre base de voies, véhicules, historiques et réglages indépendants.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nom du Parking *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Parking Orly Valet, Parc B..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-500"
                  autoFocus
                  required
                />
              </div>

              <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-2xl flex items-start gap-2">
                <span className="text-amber-400 text-lg leading-none mt-0.5">🔑</span>
                <div>
                  <div className="text-xs font-bold text-amber-300 mb-0.5">Code d'accès généré automatiquement</div>
                  <div className="text-[11px] text-amber-200/70">Un code unique au format <span className="font-mono font-bold">PARK-XXXX-XXXX</span> sera créé automatiquement. Vous pourrez le copier et le partager après la création.</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Nombre de voies</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={laneCount}
                    onChange={(e) => setLaneCount(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Capacité par voie</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/40 flex items-center gap-1.5"
                >
                  <Plus size={14} /> Créer le Parking
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <ShieldCheck size={14} className="text-emerald-400" />
            Données persistées automatiquement
          </div>
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
