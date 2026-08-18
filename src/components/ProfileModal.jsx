import React, { useState, useEffect } from "react";
import { X, User, Mail, Phone, Briefcase, CheckCircle2, ShieldCheck, Save, Loader2 } from "lucide-react";
import { saveUserProfile, getUserProfile } from "../services/auth";

export default function ProfileModal({ isOpen, onClose, currentUser, onProfileUpdated }) {
  if (!isOpen || !currentUser) return null;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("Voiturier");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const p = await getUserProfile(currentUser.uid);
        if (p) {
          setFirstName(p.firstName || "");
          setLastName(p.lastName || "");
          setPhone(p.phone || "");
          setJobTitle(p.jobTitle || "Voiturier");
        } else if (currentUser.displayName) {
          const parts = currentUser.displayName.split(" ");
          setFirstName(parts[0] || "");
          setLastName(parts.slice(1).join(" ") || "");
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
      }
    }
    loadProfile();
  }, [currentUser, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSaved(false);

    try {
      const updated = await saveUserProfile(currentUser.uid, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        jobTitle: jobTitle.trim(),
        email: currentUser.email,
      });

      if (onProfileUpdated) {
        onProfileUpdated(updated);
      }

      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error("Error saving profile:", err);
      setError(err.message || "Erreur lors de l'enregistrement du profil.");
    } finally {
      setLoading(false);
    }
  };

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Mon Compte / Profil</h2>
              <p className="text-xs text-slate-400">Vos informations visibles par votre équipe</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Message de succès ou erreur */}
        {saved && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={16} />
            Profil mis à jour avec succès !
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Aperçu Carte Profil */}
        <div className="my-5 p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-cyan-900/40 shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-black text-white truncate">
              {firstName || lastName ? `${firstName} ${lastName}`.trim() : "Votre Nom"}
            </h3>
            <p className="text-xs text-cyan-400 font-semibold">{jobTitle || "Voiturier"}</p>
            <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Prénom *</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="ex: Rayan"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Nom *</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="ex: Dupont"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Poste / Titre</label>
            <div className="relative">
              <Briefcase size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="ex: Responsable Parc, Voiturier, Chef d'équipe..."
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Numéro de téléphone</label>
            <div className="relative">
              <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="ex: 06 12 34 56 78"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Adresse Email</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={currentUser.email}
                disabled
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-slate-400 text-xs font-medium cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <ShieldCheck size={13} className="text-emerald-400" />
              Compte sécurisé
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold cursor-pointer"
              >
                Fermer
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/40 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Enregistrer
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
