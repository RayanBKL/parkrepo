import React, { useState } from "react";
import { X, Mail, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { resetPassword } from "../../services/auth";

export default function ForgotPasswordModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !email.includes("@")) {
      setError("Veuillez saisir une adresse email valide.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Impossible d'envoyer l'email de réinitialisation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Mail size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Mot de passe oublié ?</h3>
              <p className="text-xs text-slate-400">Réinitialisation par email sécurisé</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <h4 className="text-sm font-bold text-white">Email de réinitialisation envoyé !</h4>
            <p className="text-xs text-slate-300">
              Veuillez vérifier votre boîte de réception (et vos spams) à l'adresse <strong>{email}</strong>.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="pt-5 space-y-4">
            <p className="text-xs text-slate-300">
              Saisissez l'email associé à votre compte. Nous vous enverrons un lien pour choisir un nouveau mot de passe.
            </p>

            {error && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Votre email professionnel</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@monparking.fr"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
                autoFocus
                required
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/40 flex items-center gap-1.5 cursor-pointer"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                <span>Envoyer le lien</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
