import React, { useState } from "react";
import {
  X,
  Building2,
  Plus,
  Check,
  Trash2,
  Copy,
  CheckCircle2,
  ShieldCheck,
  LogOut,
  Crown,
  Users,
  Hash,
  Type,
  KeyRound,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { joinParkingWithCode } from "../services/cloudDb";

export default function ParkingsModal({
  isOpen,
  onClose,
  parkings,
  activeParkingId,
  currentUser,
  onSelectParking,
  onCreateParking,
  onDeleteParking,
  onLeaveParking,
  onParkingJoined,
}) {
  if (!isOpen) return null;

  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [joinSuccess, setJoinSuccess] = useState("");

  const [name, setName] = useState("");
  const [laneCount, setLaneCount] = useState(30);
  const [capacity, setCapacity] = useState(10);
  const [laneNaming, setLaneNaming] = useState("numeric"); // "numeric" | "alphabetic"
  const [parkingModel, setParkingModel] = useState("lifo"); // "lifo" | "fifo" | "bidir"
  const [copiedId, setCopiedId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { id: string, type: 'delete' | 'leave' }

  const handleConfirmAction = (parkingId, type) => {
    if (type === "delete" && onDeleteParking) {
      onDeleteParking(parkingId);
    } else if (type === "leave" && onLeaveParking) {
      onLeaveParking(parkingId);
    }
    setConfirmAction(null);
  };

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    setJoinError("");
    setJoinSuccess("");

    if (!joinCode.trim() || joinCode.trim().length < 6) {
      setJoinError("Veuillez saisir un code d'accès valide.");
      return;
    }

    if (!currentUser) return;

    setJoinLoading(true);
    try {
      const result = await joinParkingWithCode(currentUser.uid, joinCode.trim().toUpperCase());
      setJoinSuccess(`Parking "${result.name || "rejoint"}" ajouté avec succès !`);
      if (onParkingJoined) {
        onParkingJoined(result.parkingId, result.alreadyJoined);
      } else if (onSelectParking) {
        onSelectParking(result.parkingId);
      }
      setTimeout(() => {
        setIsJoining(false);
        setJoinCode("");
        setJoinSuccess("");
      }, 1200);
    } catch (err) {
      setJoinError(err.message || "Code d'accès invalide ou introuvable.");
    } finally {
      setJoinLoading(false);
    }
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreateParking({
      name: name.trim(),
      laneCount: Number(laneCount) || 30,
      capacity: Number(capacity) || 10,
      laneNaming,
      model: parkingModel,
    });

    setName("");
    setLaneCount(30);
    setCapacity(10);
    setLaneNaming("numeric");
    setParkingModel("lifo");
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
          {/* Message de succès lors de la jointure */}
          {joinSuccess && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 size={16} />
              {joinSuccess}
            </div>
          )}

          {isJoining ? (
            /* Formulaire pour Rejoindre un parking existant */
            <form onSubmit={handleJoinSubmit} className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                  <KeyRound size={16} />
                  <span>Rejoindre un parking partagé</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Saisissez le code d'accès à 10 ou 12 caractères que le responsable du parking vous a transmis.
                </p>
              </div>

              {joinError && (
                <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <AlertCircle size={15} className="shrink-0" />
                  {joinError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Code d'accès du parking *
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Ex : PARK-A9T8-UW52"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-amber-300 font-mono font-black text-center text-base tracking-widest uppercase focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  autoFocus
                  required
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsJoining(false);
                    setJoinError("");
                    setJoinCode("");
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold cursor-pointer"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={joinLoading || !joinCode.trim()}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-cyan-950/40 flex items-center gap-1.5 cursor-pointer"
                >
                  {joinLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Rejoindre le Parking
                </button>
              </div>
            </form>
          ) : !isCreating ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-300">Vos parkings ({parkings.length}) :</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsJoining(true);
                      setIsCreating(false);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-inner"
                  >
                    <KeyRound size={14} className="text-cyan-400" /> Rejoindre avec un code
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(true);
                      setIsJoining(false);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-cyan-950/40 cursor-pointer"
                  >
                    <Plus size={14} /> Créer un nouveau parking
                  </button>
                </div>
              </div>

              {parkings.map((p) => {
                const isActive = p.id === activeParkingId;
                const isOwner = p.ownerId === currentUser?.uid;
                const totalCars = (p.lanes || []).reduce((acc, l) => acc + l.length, 0);
                const maxCap = (p.laneCount || 30) * (p.capacity || 10);
                const isConfirming = confirmAction?.id === p.id;

                return (
                  <div key={p.id} className="space-y-1">
                    <div
                      onClick={() => {
                        if (isConfirming) return;
                        onSelectParking(p.id);
                        onClose();
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                        isActive
                          ? "bg-cyan-950/40 border-cyan-500 ring-2 ring-cyan-500/40"
                          : "bg-slate-950 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
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
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-sm text-white">{p.name}</h4>
                              {isActive && (
                                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-bold">
                                  Actif
                                </span>
                              )}
                              {isOwner ? (
                                <span className="text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                  <Crown size={10} /> Créateur
                                </span>
                              ) : (
                                <span className="text-[10px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                  <Users size={10} /> Membre
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                              <span>
                                {p.laneCount || 30} voies × {p.capacity || 10} places
                              </span>
                              <span>•</span>
                              <span className="text-emerald-400 font-semibold">
                                {totalCars} / {maxCap} véhicules
                              </span>
                              <span>•</span>
                              <span className="text-cyan-400/80 font-semibold text-[10px]">
                                {p.model === "fifo" ? "↔️ Drive-Through" : p.model === "bidir" ? "⇄ Bidirectionnel" : "🅿️ Enfilade"}
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
                                <span className="text-emerald-400 font-sans">Copié</span>
                              </>
                            ) : (
                              <>
                                <Copy size={13} className="text-slate-400" />
                                <span>{p.accessCode || "CODE"}</span>
                              </>
                            )}
                          </button>

                          {/* Bouton Supprimer (Propriétaire) ou Quitter (Invité) */}
                          {isOwner ? (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmAction(
                                  isConfirming ? null : { id: p.id, type: "delete" }
                                )
                              }
                              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                                isConfirming && confirmAction?.type === "delete"
                                  ? "bg-rose-600 text-white border-rose-500"
                                  : "bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border-rose-500/30"
                              }`}
                              title="Supprimer définitivement ce parking (Admin)"
                            >
                              <Trash2 size={15} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmAction(
                                  isConfirming ? null : { id: p.id, type: "leave" }
                                )
                              }
                              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                                isConfirming && confirmAction?.type === "leave"
                                  ? "bg-amber-600 text-white border-amber-500"
                                  : "bg-amber-500/10 hover:bg-amber-600 text-amber-400 hover:text-white border-amber-500/30"
                              }`}
                              title="Supprimer de mon compte"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Confirmation inline pour Créateur (Suppression définitive) */}
                      {isConfirming && confirmAction?.type === "delete" && (
                        <div
                          className="p-3.5 bg-rose-950/80 border border-rose-500/60 rounded-xl space-y-2 animate-in fade-in duration-150"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="text-xs text-rose-200 font-semibold">
                            ⚠️ <span className="font-black text-white">Supprimer {p.name} définitivement ?</span>
                            <div className="text-[11px] text-rose-300/80 mt-0.5">
                              Vous êtes le créateur. Cela effacera complètement toutes les données pour <strong>tout le monde</strong>.
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-2 shrink-0 pt-1">
                            <button
                              type="button"
                              onClick={() => setConfirmAction(null)}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                            >
                              Annuler
                            </button>
                            {(p.authorizedUsers || []).length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleConfirmAction(p.id, "leave")}
                                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer"
                                title="Ne supprime pas pour les autres, vous retire seulement"
                              >
                                Quitter uniquement
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleConfirmAction(p.id, "delete")}
                              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer shadow-lg shadow-rose-900/50 flex items-center gap-1.5"
                            >
                              <Trash2 size={13} /> Confirmer suppression
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Confirmation inline pour Membre Invité (Supprimer de son compte) */}
                      {isConfirming && confirmAction?.type === "leave" && (
                        <div
                          className="p-3.5 bg-slate-900 border border-amber-500/50 rounded-xl space-y-2 animate-in fade-in duration-150"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="text-xs text-amber-200 font-semibold">
                            🗑️ <span className="font-black text-white">Supprimer {p.name} de votre compte ?</span>
                            <div className="text-[11px] text-slate-300 mt-0.5">
                              Retire ce parking de votre liste personnelle (il reste accessible pour vos collègues).
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-2 shrink-0 pt-1">
                            <button
                              type="button"
                              onClick={() => setConfirmAction(null)}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                            >
                              Annuler
                            </button>
                            <button
                              type="button"
                              onClick={() => handleConfirmAction(p.id, "leave")}
                              className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer shadow-lg shadow-amber-900/50 flex items-center gap-1.5"
                            >
                              <Trash2 size={13} /> Supprimer de mon compte
                            </button>
                          </div>
                        </div>
                      )}
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

              {/* Style de nommage des voies */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Format de nommage des voies
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setLaneNaming("numeric")}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                      laneNaming === "numeric"
                        ? "bg-cyan-950/60 border-cyan-400 ring-2 ring-cyan-500/40 text-white"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        laneNaming === "numeric" ? "bg-cyan-500 text-white" : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      <Hash size={14} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Numérique</div>
                      <div className="text-[10px] text-slate-400">Voie 1, Voie 2, Voie 3...</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLaneNaming("alphabetic")}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                      laneNaming === "alphabetic"
                        ? "bg-cyan-950/60 border-cyan-400 ring-2 ring-cyan-500/40 text-white"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        laneNaming === "alphabetic" ? "bg-cyan-500 text-white" : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      <Type size={14} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Alphabétique</div>
                      <div className="text-[10px] text-slate-400">Voie A, Voie B, Voie C...</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Modèle de parking physique */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Modèle physique du parking
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    {
                      id: "lifo",
                      label: "Enfilade (LIFO)",
                      emoji: "🅿️",
                      desc: "Cul-de-sac — 1 seule ouverture. Entrée et sortie par le même côté.",
                      detail: "Dernière voiture entrée = première à sortir.",
                    },
                    {
                      id: "fifo",
                      label: "Drive-Through (FIFO)",
                      emoji: "↔️",
                      desc: "Couloir traversant — 2 ouvertures. Entrée d'un côté, sortie de l'autre.",
                      detail: "Première voiture entrée = première à sortir. Zéro blocage.",
                    },
                    {
                      id: "bidir",
                      label: "Bidirectionnel",
                      emoji: "⇄",
                      desc: "Double accès — 2 ouvertures sur la même voie (Porte A et Porte B).",
                      detail: "L'algorithme choisit le côté optimal pour minimiser les blocages.",
                    },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setParkingModel(m.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                        parkingModel === m.id
                          ? "bg-cyan-950/60 border-cyan-400 ring-2 ring-cyan-500/40"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <span className="text-lg leading-none mt-0.5">{m.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          {m.label}
                          {m.id === "lifo" && (
                            <span className="text-[9px] bg-cyan-600 text-white px-1.5 py-0.5 rounded-full font-black">DÉFAUT</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{m.desc}</div>
                        <div className="text-[10px] text-cyan-400/80 mt-0.5 font-semibold">{m.detail}</div>
                      </div>
                      {parkingModel === m.id && (
                        <Check size={15} className="text-cyan-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-2xl flex items-start gap-2">
                <span className="text-amber-400 text-lg leading-none mt-0.5">🔑</span>
                <div>
                  <div className="text-xs font-bold text-amber-300 mb-0.5">Code d'accès sécurisé</div>
                  <div className="text-[11px] text-amber-200/70">
                    Un code unique au format <span className="font-mono font-bold">PARK-XXXX-XXXX</span> sera créé automatiquement pour inviter vos collaborateurs.
                  </div>
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
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold cursor-pointer"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/40 flex items-center gap-1.5 cursor-pointer"
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

