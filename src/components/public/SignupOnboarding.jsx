import React, { useState } from "react";
import {
  User,
  Building2,
  Car,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  MapPin,
  Hash,
  Type,
  Loader2,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import ParkflowLogo from "../ParkflowLogo";
import { signUp } from "../../services/auth";
import { createOrganization, PLANS_CONFIG } from "../../services/organization";
import { createParking } from "../../services/cloudDb";

export default function SignupOnboarding({ onNavigate, onComplete, initialPlan = "business" }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Étape 1 : Administrateur (Owner)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Étape 2 : Entreprise (Organisation)
  const [orgName, setOrgName] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(initialPlan);

  // Étape 3 : Premier Parking
  const [parkingName, setParkingName] = useState("");
  const [parkingAddress, setParkingAddress] = useState("");
  const [laneCount, setLaneCount] = useState(30);
  const [capacity, setCapacity] = useState(10);
  const [laneNaming, setLaneNaming] = useState("numeric"); // "numeric" | "alphabetic"

  const handleStep1Submit = (e) => {
    e.preventDefault();
    setError("");
    if (!firstName.trim() || !lastName.trim()) {
      setError("Veuillez renseigner votre prénom et votre nom.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Veuillez renseigner une adresse email valide.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setStep(2);
  };

  const handleStep2Submit = (e) => {
    e.preventDefault();
    setError("");
    if (!orgName.trim()) {
      setError("Veuillez renseigner le nom de votre entreprise.");
      return;
    }
    setStep(3);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!parkingName.trim()) {
      setError("Veuillez donner un nom à votre premier parking.");
      return;
    }

    setLoading(true);
    try {
      // 1. Créer le compte Firebase Auth + profil Owner
      const user = await signUp(email, password, {
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        phone: orgPhone,
        jobTitle: "Gérant / Fondateur",
        role: "OWNER",
        status: "active",
      });

      // 2. Créer l'Organisation
      const org = await createOrganization({
        name: orgName,
        email: email,
        phone: orgPhone,
        address: orgAddress,
        ownerId: user.uid,
        plan: selectedPlan,
      });

      // 3. Mettre à jour l'utilisateur avec son organizationId
      // (signUp stocke ce qu'on lui donne, on met à jour)
      const { updateUserRoleAndStatus } = await import("../../services/auth");
      await updateUserRoleAndStatus(user.uid, {
        role: "OWNER",
        organizationId: org.id,
        assignedParkingIds: ["*"],
      });

      // 4. Créer le 1er parking lié à cette organisation
      const newParking = await createParking(user.uid, {
        name: parkingName.trim(),
        address: parkingAddress.trim(),
        organizationId: org.id,
        laneCount: Number(laneCount) || 30,
        capacity: Number(capacity) || 10,
        laneNaming,
        userName: `${firstName} ${lastName}`,
      });

      if (onComplete) {
        onComplete({ user, organization: org, parking: newParking });
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message || "Une erreur est survenue lors de la création de votre compte.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-white font-sans antialiased p-4 sm:p-6">
      {/* Header */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between py-4">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate("home")}>
          <ParkflowLogo size={32} />
          <span className="text-lg font-black text-white">
            Park<span className="text-cyan-400">eya</span>
          </span>
        </div>
        <button
          onClick={() => onNavigate("login")}
          className="text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          Déjà un compte ? <span className="text-cyan-400">Se connecter</span>
        </button>
      </header>

      {/* Card Form */}
      <main className="max-w-xl w-full mx-auto my-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
        {/* Stepper Header */}
        <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-5">
          {[
            { num: 1, label: "Administrateur", icon: User },
            { num: 2, label: "Entreprise", icon: Building2 },
            { num: 3, label: "Parking", icon: Car },
          ].map((s) => {
            const Icon = s.icon;
            const isDone = step > s.num;
            const isCurrent = step === s.num;
            return (
              <div key={s.num} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    isDone
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                      ? "bg-cyan-500 text-white shadow-lg shadow-cyan-900/50 scale-105"
                      : "bg-slate-800 text-slate-500"
                  }`}
                >
                  {isDone ? <CheckCircle2 size={16} /> : s.num}
                </div>
                <span
                  className={`hidden sm:inline text-xs font-bold ${
                    isCurrent ? "text-white" : isDone ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-rose-300 text-xs font-semibold animate-in fade-in">
            {error}
          </div>
        )}

        {/* ÉTAPE 1 : Administrateur */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-4 animate-in fade-in">
            <div>
              <h2 className="text-xl font-black text-white">Créer votre compte Administrateur</h2>
              <p className="text-xs text-slate-400 mt-1">
                Vous serez le propriétaire principal (Owner) de votre organisation.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Prénom *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="ex: Rayan"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nom *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="ex: Ben"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Email Professionnel *</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@monparking.fr"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Mot de passe sécurisé *</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6 caractères minimum"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continuer vers l'entreprise</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
        )}

        {/* ÉTAPE 2 : Entreprise */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-4 animate-in fade-in">
            <div>
              <h2 className="text-xl font-black text-white">Votre Entreprise / Organisation</h2>
              <p className="text-xs text-slate-400 mt-1">
                Configurez les informations officielles de votre société d'exploitation.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Nom de l'entreprise *</label>
              <div className="relative">
                <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="ex: Valet Park Orly SAS, Parc Express..."
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Téléphone Pro</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="tel"
                    value={orgPhone}
                    onChange={(e) => setOrgPhone(e.target.value)}
                    placeholder="ex: 01 23 45 67 89"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Plan choisi</label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="starter">Plan Starter (1 parking / 5 utilisateurs)</option>
                  <option value="business">Plan Business (3 parkings / 15 utilisateurs)</option>
                  <option value="enterprise">Plan Enterprise (Illimité)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Adresse du siège social</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={orgAddress}
                  onChange={(e) => setOrgAddress(e.target.value)}
                  placeholder="ex: 12 avenue de l'Aéroport, 94390 Orly"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold cursor-pointer"
              >
                Retour
              </button>
              <button
                type="submit"
                className="flex-1 py-3.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Configurer mon premier parking</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
        )}

        {/* ÉTAPE 3 : Premier Parking */}
        {step === 3 && (
          <form onSubmit={handleFinalSubmit} className="space-y-4 animate-in fade-in">
            <div>
              <h2 className="text-xl font-black text-white">Votre Premier Parking</h2>
              <p className="text-xs text-slate-400 mt-1">
                Définissez la structure de votre premier parc automobile.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Nom du Parking *</label>
              <div className="relative">
                <Car size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={parkingName}
                  onChange={(e) => setParkingName(e.target.value)}
                  placeholder="ex: Parking Orly Valet P1"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
                  autoFocus
                  required
                />
              </div>
            </div>

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
                  <Hash size={16} className="text-cyan-400 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-white">Numérique</div>
                    <div className="text-[10px] text-slate-400">Voie 1, Voie 2...</div>
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
                  <Type size={16} className="text-cyan-400 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-white">Alphabétique</div>
                    <div className="text-[10px] text-slate-400">Voie A, Voie B...</div>
                  </div>
                </button>
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
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Places par voie</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold cursor-pointer"
              >
                Retour
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white text-xs font-black shadow-xl shadow-cyan-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                <span>Finaliser & Ouvrir Parkeya</span>
              </button>
            </div>
          </form>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 py-2">
        <span>© {new Date().getFullYear()} Parkeya SaaS B2B — Données chiffrées & isolées.</span>
      </footer>
    </div>
  );
}
