import React, { useState } from 'react';
import { Mail, RefreshCw, AlertCircle, LogOut } from 'lucide-react';
import { auth } from "../../services/firebase";
import { sendEmailVerification, signOut } from "firebase/auth";

export default function EmailVerificationBlock({ user }) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleResend = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      await sendEmailVerification(user);
      setSent(true);
    } catch (err) {
      if (err.code === 'auth/too-many-requests') {
        setError("Trop de demandes. Veuillez patienter un instant.");
      } else {
        setError("Impossible d'envoyer l'email. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheck = async () => {
    if (user) {
      setLoading(true);
      await user.reload();
      if (user.emailVerified) {
        window.location.reload();
      } else {
        setError("L'email n'est pas encore vérifié. Veuillez vérifier votre boîte de réception.");
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10">
        <div className="w-20 h-20 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/20">
          <Mail size={40} />
        </div>
        
        <h2 className="text-2xl font-black text-white mb-2">Vérifiez votre Email</h2>
        <p className="text-slate-400 text-sm mb-6">
          Nous avons envoyé un lien de confirmation à <strong className="text-white">{user?.email}</strong>. 
          Veuillez cliquer sur le lien pour activer votre compte.
        </p>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-medium p-3 rounded-xl mb-6 flex items-start gap-2 text-left">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {sent && !error && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium p-3 rounded-xl mb-6">
            Email de vérification renvoyé avec succès !
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleCheck}
            disabled={loading}
            className="w-full px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black flex items-center justify-center gap-2 transition-all disabled:opacity-75 disabled:cursor-wait shadow-lg shadow-cyan-500/20"
          >
            {loading ? <RefreshCw className="animate-spin w-5 h-5" /> : null}
            J'ai cliqué sur le lien
          </button>
          
          <button
            onClick={handleResend}
            disabled={loading || sent}
            className="w-full px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Renvoyer l'email
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="text-slate-500 hover:text-slate-300 text-sm font-semibold flex items-center justify-center gap-1.5 mx-auto transition-colors"
          >
            <LogOut size={16} /> Me déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
