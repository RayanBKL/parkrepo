import React, { useState } from "react";
import {
  User,
  Building2,
  Car,
  ArrowLeft,
  Lock,
  Mail,
  Phone,
  MapPin,
  Hash,
  Type,
  Loader2,
  Sparkles,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import ParkflowLogo from "../ParkflowLogo";
import { signUp } from "../../services/auth";
import { createOrganization } from "../../services/organization";
import { createParking } from "../../services/cloudDb";
import { sendEmailVerification } from "firebase/auth";

export default function SignupOnboarding({ onNavigate, onComplete, initialPlan = "business" }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [siret, setSiret] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [parkingName, setParkingName] = useState("");
  const [laneCount, setLaneCount] = useState(30);
  const [capacity, setCapacity] = useState(10);
  const [laneNaming, setLaneNaming] = useState("numeric");

  const handleAccountCreation = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");

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
    if (!orgName.trim()) {
      setError("Veuillez renseigner le nom de votre entreprise.");
      return;
    }
    if (!parkingName.trim()) {
      setError("Veuillez donner un nom à votre premier parking.");
      return;
    }

    setLoading(true);
    try {
      const user = await signUp(email, password, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: `${firstName.trim()} ${lastName.trim()}`,
        phone: orgPhone.trim(),
        jobTitle: "Gérant / Fondateur",
        role: "OWNER",
        status: "active",
      });

      const org = await createOrganization({
        name: orgName.trim(),
        siret: siret.trim(),
        email: email.trim(),
        phone: orgPhone.trim(),
        address: orgAddress.trim(),
        ownerId: user.uid,
        plan: initialPlan,
        billingCycle: "monthly",
        status: "PENDING_PAYMENT",
      });

      const { updateUserRoleAndStatus } = await import("../../services/auth");
      await updateUserRoleAndStatus(user.uid, {
        role: "OWNER",
        organizationId: org.id,
        assignedParkingIds: ["*"],
      });

      await createParking(user.uid, {
        name: parkingName.trim(),
        address: orgAddress.trim(),
        organizationId: org.id,
        laneCount: Number(laneCount) || 30,
        capacity: Number(capacity) || 10,
        laneNaming,
        userName: `${firstName.trim()} ${lastName.trim()}`,
      });

      // Send Verification Email immediately
      await sendEmailVerification(user);

      if (onComplete) {
        onComplete({ user, organization: org });
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
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-4">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate("home")}>
          <ParkflowLogo size={34} />
          <span className="text-xl font-black text-white tracking-tight">
            Park<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">eya</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate("home")}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Retour à l'accueil</span>
          </button>
          <button
            onClick={() => onNavigate("login")}
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            Se connecter
          </button>
        </div>
      </header>

      <main className="max-w-4xl w-full mx-auto my-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative">
        {error && (
          <div className="mb-6 p-4 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertCircle size={16} className="text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        <form onSubmit={handleAccountCreation} className="space-y-6 animate-in fade-in max-w-2xl mx-auto">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[11px] font-bold mb-2">
              <Sparkles size={13} />
              <span>Inscription SaaS — Essai 7 jours sans engagement</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Créez votre compte Administrateur
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Renseignez vos coordonnées et votre entreprise pour générer votre espace Parkeya sécurisé.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest border-b border-slate-800 pb-2">
              Vos informations
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1.5 ml-1">Prénom</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                    placeholder="ex: Jean"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1.5 ml-1">Nom</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                    placeholder="ex: Dupont"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1.5 ml-1">E-mail Professionnel</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  placeholder="ex: contact@monentreprise.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1.5 ml-1">Mot de passe (Min. 6 caractères)</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest border-b border-slate-800 pb-2">
              Votre Entreprise
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1.5 ml-1">Nom de l'entreprise</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                    placeholder="ex: Auto Services Paris"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1.5 ml-1">Numéro SIRET (Optionnel)</label>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    value={siret}
                    onChange={(e) => setSiret(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                    placeholder="ex: 123 456 789 00012"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1.5 ml-1">Téléphone Pro</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="tel"
                    required
                    value={orgPhone}
                    onChange={(e) => setOrgPhone(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                    placeholder="ex: 01 23 45 67 89"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1.5 ml-1">Ville ou Adresse du siège</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    required
                    value={orgAddress}
                    onChange={(e) => setOrgAddress(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                    placeholder="ex: Paris, France"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest border-b border-slate-800 pb-2">
              Votre Premier Parking
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-400 mb-1.5 ml-1">Nom du parking</label>
                <div className="relative">
                  <Car className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    required
                    value={parkingName}
                    onChange={(e) => setParkingName(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                    placeholder="ex: Dépôt Orly Sud"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 flex gap-3 text-cyan-200">
              <Car className="shrink-0 mt-0.5 text-cyan-400" size={16} />
              <p className="text-[11px] leading-relaxed">
                Ce premier parking sera généré avec des paramètres par défaut que vous pourrez modifier plus tard dans l'application (Nombre de voies, Capacité).
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-8 w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-cyan-950/80 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? <Loader2 size={18} className="animate-spin text-slate-950" /> : <CheckCircle2 size={18} className="text-slate-950" />}
            Créer mon compte et mon espace Parkeya
          </button>
        </form>
      </main>

      <footer className="text-center text-xs text-slate-500 py-2">
        <span>© {new Date().getFullYear()} Parkeya SaaS B2B — Plateforme sécurisée d'optimisation logistique pour voituriers.</span>
      </footer>
    </div>
  );
}
