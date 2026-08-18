import React, { useState, useEffect } from "react";
import {
  X,
  Users,
  Crown,
  UserCheck,
  UserMinus,
  Copy,
  Check,
  ShieldCheck,
  Mail,
  Phone,
  Briefcase,
  KeyRound,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { getUsersProfiles } from "../services/auth";
import { removeUserFromParking } from "../services/cloudDb";

export default function CollaboratorsModal({
  isOpen,
  onClose,
  parking,
  currentUser,
  onMemberRemoved,
  onOpenAccessCode,
}) {
  if (!isOpen || !parking) return null;

  const isOwner = parking.ownerId === currentUser?.uid;
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const [error, setError] = useState("");

  const authorizedUsers = parking.authorizedUsers || [parking.ownerId].filter(Boolean);

  useEffect(() => {
    async function loadMembers() {
      setLoading(true);
      try {
        const list = await getUsersProfiles(authorizedUsers);
        setMembers(list);
      } catch (err) {
        console.error("Error fetching team profiles:", err);
      } finally {
        setLoading(false);
      }
    }
    if (isOpen) {
      loadMembers();
    }
  }, [parking.id, parking.authorizedUsers, isOpen]);

  const handleCopyCode = () => {
    if (parking.accessCode) {
      navigator.clipboard.writeText(parking.accessCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleRemoveMember = async (targetUserId) => {
    try {
      await removeUserFromParking(parking.id, currentUser.uid, targetUserId);
      setMembers((prev) => prev.filter((m) => m.uid !== targetUserId));
      setConfirmRemoveId(null);
      if (onMemberRemoved) {
        onMemberRemoved(targetUserId);
      }
    } catch (err) {
      console.error("Error removing member:", err);
      setError(err.message || "Erreur lors du retrait du collaborateur.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl overflow-hidden relative max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Users size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Équipe & Membres
              </h2>
              <p className="text-xs text-slate-400">
                Personnes ayant accès au parking <span className="text-cyan-300 font-bold">"{parking.name}"</span>
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

        {/* Message d'erreur */}
        {error && (
          <div className="mt-4 p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Code de partage rapide */}
        <div className="my-4 p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <KeyRound size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Code d'accès du parking</div>
              <div className="text-[10px] text-slate-400 font-mono">
                {parking.accessCode || "PARK-XXXX-XXXX"}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 text-amber-300 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-inner shrink-0"
          >
            {copiedCode ? (
              <>
                <Check size={13} className="text-emerald-400" />
                <span className="text-emerald-400">Copié !</span>
              </>
            ) : (
              <>
                <Copy size={13} className="text-slate-400" />
                <span>Copier</span>
              </>
            )}
          </button>
        </div>

        {/* Liste des Membres */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          <div className="text-xs font-bold text-slate-300 flex items-center justify-between pb-1">
            <span>Collaborateurs autorisés ({members.length}) :</span>
            {isOwner && (
              <span className="text-[10px] text-amber-400 font-normal">
                👑 Vous êtes l'administrateur
              </span>
            )}
          </div>

          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 size={24} className="text-cyan-400 animate-spin" />
              <span className="text-xs">Chargement des comptes...</span>
            </div>
          ) : members.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">
              Aucun membre trouvé sur ce parking.
            </div>
          ) : (
            members.map((member) => {
              const isMemberOwner = member.uid === parking.ownerId;
              const isCurrentUser = member.uid === currentUser?.uid;
              const initials =
                (member.firstName && member.lastName
                  ? `${member.firstName[0]}${member.lastName[0]}`
                  : member.displayName
                  ? member.displayName.substring(0, 2)
                  : member.email
                  ? member.email.substring(0, 2)
                  : "U"
                ).toUpperCase();

              const memberName =
                member.firstName || member.lastName
                  ? `${member.firstName || ""} ${member.lastName || ""}`.trim()
                  : member.displayName || member.email?.split("@")[0] || "Collaborateur";

              return (
                <div
                  key={member.uid}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isCurrentUser
                      ? "bg-cyan-950/30 border-cyan-500/40 ring-1 ring-cyan-500/30"
                      : "bg-slate-950/60 border-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${
                          isMemberOwner
                            ? "bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-900/40"
                            : "bg-gradient-to-tr from-cyan-600 to-emerald-600 text-white shadow-md shadow-cyan-950/50"
                        }`}
                      >
                        {initials}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white truncate max-w-[150px]">
                            {memberName}
                          </span>
                          {isCurrentUser && (
                            <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-semibold">
                              Vous
                            </span>
                          )}
                          {isMemberOwner ? (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                              <Crown size={10} /> Créateur
                            </span>
                          ) : (
                            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                              <UserCheck size={10} className="text-emerald-400" /> Membre
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                          <span className="text-cyan-400 font-medium">
                            {member.jobTitle || "Voiturier"}
                          </span>
                          <span>•</span>
                          <span className="truncate max-w-[160px] text-slate-500">
                            {member.email}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action de révocation (créateur uniquement, et pas sur lui-même) */}
                    {isOwner && !isMemberOwner && (
                      <div className="shrink-0">
                        {confirmRemoveId === member.uid ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setConfirmRemoveId(null)}
                              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold cursor-pointer"
                            >
                              Annuler
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(member.uid)}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold cursor-pointer shadow-md shadow-rose-900/50"
                            >
                              Confirmer
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmRemoveId(member.uid)}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 text-xs transition-all cursor-pointer"
                            title="Retirer ce membre du parking"
                          >
                            <UserMinus size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <ShieldCheck size={14} className="text-emerald-400" />
            Accès sécurisé par code unique
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
