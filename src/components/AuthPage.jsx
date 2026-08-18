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

  const getFirebaseError = (err) => {
    console.error("Firebase Error:", err);
    const code = err?.code || "";
    switch (code) {
      case "auth/operation-not-allowed":
      case "auth/admin-restricted-operation":
        return "L'authentification Email/Mot de passe n'est pas encore activée dans la console Firebase (Étape 4).";
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
      case "permission-denied":
        return "Accès refusé par les règles Firestore. Vérifiez l'onglet Règles.";
      default:
        return err?.message ? `Erreur (${code || "détail"}): ${err.message}` : "Une erreur est survenue. Réessayez.";
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
        setError(getFirebaseError(err));
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
      setError(getFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Arrière-plan animé */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-cyan-600/10 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-emerald-600/10 blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan-500/3 blur-3xl"></div>
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo et Titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6 animate-in fade-in slide-up">
            <ParkflowLogo size={80} />
          </div>

          <h1 className="text-4xl font-black text-white text-center mb-2 tracking-tight">
            PARK<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">FLOW</span>
          </h1>
          <p className="text-slate-400 text-center mb-10 font-medium">Optimisation Intelligente</p>
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
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  placeholder="Email professionnel"
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
                    className="w-full pl-11 pr-12 py-3.5 rounded-2xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    placeholder="Mot de passe"
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
                    className={`w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-900 border text-white text-sm focus:outline-none focus:ring-2 transition-all ${
                      confirmPassword && confirmPassword !== password
                        ? "border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/20"
                        : confirmPassword && confirmPassword === password
                        ? "border-emerald-500/60 focus:border-emerald-500 focus:ring-emerald-500/20"
                        : "border-slate-700 focus:border-cyan-500 focus:ring-cyan-500/20"
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
                  className="text-cyan-400 hover:text-cyan-300 font-bold ml-1"
                >
                  Mot de passe oublié ?
                </button>
              </div>
            )}

            {/* Bouton de soumission */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-lg shadow-lg shadow-cyan-900/40 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
                  className="text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer"
                >
                  Créer un compte gratuitement
                </button>
              </p>
            )}
            {(mode === "register" || mode === "reset") && (
              <p className="text-xs text-slate-400">
                <button
                  onClick={() => { setMode("login"); setError(""); setSuccessMessage(""); }}
                  className="text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer"
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
