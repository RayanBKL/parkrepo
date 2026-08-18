import React, { useState } from "react";
import { Car, Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2, AlertCircle, CheckCircle2, KeyRound } from "lucide-react";
import { signUp, signIn, resetPassword } from "../services/auth";

export default function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState("login"); // 'login' | 'register' | 'reset'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const getFirebaseError = (code) => {
    switch (code) {
      case "auth/email-already-in-use":
        return "Cette adresse email est déjà utilisée par un autre compte.";
      case "auth/weak-password":
        return "Le mot de passe doit contenir au moins 6 caractères.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Email ou mot de passe incorrect.";
      case "auth/invalid-email":
        return "Adresse email invalide.";
      case "auth/too-many-requests":
        return "Trop de tentatives. Compte temporairement bloqué. Réessayez dans quelques minutes.";
      case "auth/network-request-failed":
        return "Erreur réseau. Vérifiez votre connexion internet.";
      default:
        return "Une erreur est survenue. Réessayez.";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (mode === "reset") {
      setLoading(true);
      try {
        await resetPassword(email);
        setSuccessMessage("Email de réinitialisation envoyé ! Vérifiez votre boîte mail.");
      } catch (err) {
        setError(getFirebaseError(err.code));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === "register") {
      if (password !== confirmPassword) {
        setError("Les deux mots de passe ne correspondent pas.");
        return;
      }
      if (password.length < 8) {
        setError("Le mot de passe doit contenir au moins 8 caractères pour votre sécurité.");
        return;
      }
    }

    setLoading(true);
    try {
      let user;
      if (mode === "register") {
        user = await signUp(email, password);
      } else {
        user = await signIn(email, password);
      }
      onAuthenticated(user);
    } catch (err) {
      setError(getFirebaseError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Arrière-plan animé */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-500/3 blur-3xl"></div>
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo et Titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-400 p-[2px] shadow-2xl shadow-blue-500/30 mb-4">
            <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
              <Car size={28} className="text-blue-400" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide">
            PARK<span className="text-blue-400">OPTIMIZER</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-medium">Gestion de Parc Auto Professionnelle</p>
        </div>

        {/* Carte du formulaire */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-7 shadow-2xl backdrop-blur">
          {/* Titre du mode */}
          <div className="mb-6">
            <h2 className="text-lg font-black text-white">
              {mode === "login" && "Connexion à votre espace"}
              {mode === "register" && "Créer votre compte"}
              {mode === "reset" && "Réinitialiser le mot de passe"}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {mode === "login" && "Vos données de parking sont chiffrées et sécurisées."}
              {mode === "register" && "Compte sécurisé avec accès isolé à vos parkings."}
              {mode === "reset" && "Saisissez votre email pour recevoir un lien de réinitialisation."}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0" />
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Adresse Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Mot de passe */}
            {mode !== "reset" && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Mot de Passe {mode === "register" && <span className="text-slate-500 font-normal">(8 caractères min.)</span>}
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirmation mot de passe (inscription seulement) */}
            {mode === "register" && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Confirmer le Mot de Passe
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border text-white text-sm focus:outline-none focus:ring-2 ${
                      confirmPassword && confirmPassword !== password
                        ? "border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/20"
                        : confirmPassword && confirmPassword === password
                        ? "border-emerald-500/60 focus:border-emerald-500 focus:ring-emerald-500/20"
                        : "border-slate-700 focus:border-blue-500 focus:ring-blue-500/20"
                    }`}
                    required
                  />
                </div>
              </div>
            )}

            {/* Lien "Mot de passe oublié" */}
            {mode === "login" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => { setMode("reset"); setError(""); }}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                >
                  Mot de passe oublié ?
                </button>
              </div>
            )}

            {/* Bouton de soumission */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-black shadow-lg shadow-blue-900/40 hover:shadow-blue-700/50 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  {mode === "login" && <><ArrowRight size={16} /> Se Connecter</>}
                  {mode === "register" && <><CheckCircle2 size={16} /> Créer Mon Compte</>}
                  {mode === "reset" && <><Mail size={16} /> Envoyer le Lien</>}
                </>
              )}
            </button>
          </form>

          {/* Lien pour changer de mode */}
          <div className="mt-5 pt-5 border-t border-slate-800 text-center space-y-2">
            {mode === "login" && (
              <p className="text-xs text-slate-400">
                Pas encore de compte ?{" "}
                <button
                  onClick={() => { setMode("register"); setError(""); setSuccessMessage(""); }}
                  className="text-blue-400 hover:text-blue-300 font-bold cursor-pointer"
                >
                  Créer un compte gratuitement
                </button>
              </p>
            )}
            {(mode === "register" || mode === "reset") && (
              <p className="text-xs text-slate-400">
                <button
                  onClick={() => { setMode("login"); setError(""); setSuccessMessage(""); }}
                  className="text-blue-400 hover:text-blue-300 font-bold cursor-pointer"
                >
                  ← Retour à la connexion
                </button>
              </p>
            )}

            {/* Badge sécurité */}
            <div className="flex items-center justify-center gap-1.5 pt-1 text-[10px] text-slate-600">
              <KeyRound size={11} />
              <span>Mots de passe chiffrés — Données isolées par compte</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
