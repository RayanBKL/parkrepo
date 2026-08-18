import React from "react";
import {
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  Building2,
  Users,
  Car,
  Clock,
  LayoutGrid,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Play,
  BarChart3,
  Layers,
} from "lucide-react";
import ParkflowLogo from "../ParkflowLogo";

export default function LandingPage({ onNavigate }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-white font-sans antialiased overflow-x-hidden">
      {/* Navigation Publique */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate("home")}>
            <div className="drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <ParkflowLogo size={36} />
            </div>
            <span className="text-xl font-black text-white tracking-tight flex items-center">
              Park<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 font-extrabold ml-0.5">eya</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <button onClick={() => onNavigate("home")} className="hover:text-white transition-colors cursor-pointer">
              Produit
            </button>
            <a href="#problem-solution" className="hover:text-white transition-colors">
              Fonctionnalités
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              Comment ça marche
            </a>
            <button onClick={() => onNavigate("pricing")} className="hover:text-white transition-colors cursor-pointer">
              Tarifs
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate("login")}
              className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-200 hover:text-white transition-colors cursor-pointer"
            >
              Connexion
            </button>
            <button
              onClick={() => onNavigate("signup")}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 via-emerald-500 to-cyan-500 bg-[length:200%_auto] hover:bg-right transition-all duration-300 text-white text-xs sm:text-sm font-black shadow-lg shadow-cyan-900/40 hover:shadow-cyan-600/50 hover:scale-105 cursor-pointer flex items-center gap-2"
            >
              <span>Commencer</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 lg:pt-24 lg:pb-32 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cyan-600/15 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-emerald-600/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-cyan-300 text-xs font-bold mb-6 shadow-inner animate-in fade-in slide-in-from-top-4 duration-500">
            <Sparkles size={14} className="text-cyan-400" />
            <span>Logiciel d'Optimisation de Parking & Voituriers Aéroportuaires</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] max-w-5xl mx-auto">
            Optimisez votre parking. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
              Réduisez les déplacements.
            </span> <br />
            Récupérez plus intelligemment.
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-normal">
            Le logiciel d'exploitation nouvelle génération pour parkings longue durée et services voituriers. 
            Déterminez l'ordre optimal de placement et sortez n'importe quel véhicule avec le <strong>minimum absolu de manœuvres</strong>.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate("signup")}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-black text-base shadow-xl shadow-cyan-950/60 hover:shadow-cyan-700/50 hover:scale-105 transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <span>Démarrer l'essai gratuit</span>
              <ArrowRight size={18} />
            </button>
            <button
              onClick={() => onNavigate("pricing")}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-700 hover:border-slate-600 text-slate-200 hover:text-white font-bold text-base transition-all flex items-center justify-center gap-2 cursor-pointer shadow-inner"
            >
              <BarChart3 size={18} className="text-cyan-400" />
              <span>Voir les offres & tarifs</span>
            </button>
          </div>

          {/* Key Metrics Strip */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <div className="text-2xl sm:text-3xl font-black text-cyan-400">0 Blocage</div>
              <div className="text-xs text-slate-400 mt-0.5">Tri algorithmique Tightest Fit</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">-70%</div>
              <div className="text-xs text-slate-400 mt-0.5">De manœuvres de véhicules</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <div className="text-2xl sm:text-3xl font-black text-sky-400">&lt; 30 sec</div>
              <div className="text-xs text-slate-400 mt-0.5">Pour localiser et sortir un client</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <div className="text-2xl sm:text-3xl font-black text-amber-400">100% Cloud</div>
              <div className="text-xs text-slate-400 mt-0.5">Multi-sites & Rôles d'équipe</div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Problème vs Solution */}
      <section id="problem-solution" className="py-20 bg-slate-900/40 border-y border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs uppercase font-mono tracking-widest text-cyan-400 font-bold mb-2">
              Le Défi Opérationnel
            </h2>
            <p className="text-3xl sm:text-4xl font-black text-white">
              Gérer des centaines de véhicules en voies enfilées sans logiciel adapté est un cauchemar logistique.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Colonne Le Problème */}
            <div className="p-8 rounded-3xl bg-rose-950/15 border border-rose-500/20 space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-black text-rose-200">Sans Parkeya : Chaos & Manœuvres Inutiles</h3>
              <ul className="space-y-4 text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="text-rose-400 font-bold text-lg leading-none">✕</span>
                  <span><strong>Véhicules bloqués :</strong> Déplacer 4 voitures pour en sortir une seule lors d'un retour client imprévu.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-400 font-bold text-lg leading-none">✕</span>
                  <span><strong>Perte de temps en heure de pointe :</strong> Retards lors des vagues de retour de vols aéroportuaires.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-400 font-bold text-lg leading-none">✕</span>
                  <span><strong>Manque de traçabilité :</strong> Impossible de savoir quel voiturier a déplacé une clé ou garé un véhicule.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-400 font-bold text-lg leading-none">✕</span>
                  <span><strong>Risques d'accrochage accrus :</strong> Chaque manœuvre superflue augmente le risque de sinistre.</span>
                </li>
              </ul>
            </div>

            {/* Colonne La Solution */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-cyan-950/30 to-emerald-950/20 border border-cyan-500/30 space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-black text-cyan-200">Avec Parkeya SaaS : Précision & Fluidité Totale</h3>
              <ul className="space-y-4 text-sm text-slate-200">
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Placement Optimisé Automatique :</strong> L'algorithme place chaque voiture dans la voie idéale selon son heure de départ.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Module Récupération Assistée :</strong> Indique exactement quel véhicule déplacer et où, pour débloquer la sortie en 2 clics.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Rôles RBAC pour l'équipe :</strong> Interfaces adaptées pour le Gérant, le Manager et le Voiturier sur tablette.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Journal d'audit complet :</strong> Historique horodaté de chaque mouvement et action réalisée.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section id="how-it-works" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-xs uppercase font-mono tracking-widest text-emerald-400 font-bold mb-2">
              Processus Simple & Intuitif
            </h2>
            <p className="text-3xl sm:text-5xl font-black text-white">
              Comment Parkeya transforme votre gestion en 5 étapes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[
              {
                step: "01",
                title: "Créez votre parking",
                desc: "Configurez vos voies (numériques ou alphabétiques) et la capacité de vos emplacements.",
                icon: Building2,
              },
              {
                step: "02",
                title: "Invitez votre équipe",
                desc: "Ajoutez vos managers et voituriers avec leurs accès et rôles sécurisés.",
                icon: Users,
              },
              {
                step: "03",
                title: "Enregistrez les arrivées",
                desc: "Saisie rapide de la plaque et de la date de départ prévue (ou import Excel d'un coup).",
                icon: Car,
              },
              {
                step: "04",
                title: "Rangement optimisé",
                desc: "L'algorithme suggère en direct la meilleure voie sans jamais bloquer les sorties.",
                icon: LayoutGrid,
              },
              {
                step: "05",
                title: "Récupération éclair",
                desc: "Sortez le véhicule directement ou suivez le guide pas-à-pas de déblocage.",
                icon: Clock,
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-mono font-black text-cyan-400 group-hover:scale-110 transition-transform">
                        {item.step}
                      </span>
                      <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 group-hover:text-cyan-400 group-hover:bg-cyan-950 flex items-center justify-center transition-colors">
                        <Icon size={16} />
                      </div>
                    </div>
                    <h4 className="font-bold text-base text-white mb-2">{item.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 relative bg-gradient-to-b from-slate-950 via-cyan-950/20 to-slate-950 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black text-white">
            Prêt à optimiser la gestion de vos parcs automobiles ?
          </h2>
          <p className="text-base text-slate-400 max-w-2xl mx-auto">
            Rejoignez les exploitants de parkings et services voituriers qui économisent des heures de manœuvres chaque jour.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate("signup")}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-black text-base shadow-xl shadow-cyan-950/60 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Créer mon entreprise sur Parkeya</span>
              <ArrowRight size={18} />
            </button>
            <button
              onClick={() => onNavigate("login")}
              className="px-6 py-4 text-slate-300 hover:text-white font-bold text-sm cursor-pointer"
            >
              Déjà client ? Se connecter
            </button>
          </div>
        </div>
      </section>

      {/* Footer B2B Complet */}
      <footer className="border-t border-slate-800/80 pt-16 pb-12 bg-slate-950 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-slate-850">
          {/* Col 1 : Marque & Présentation */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <ParkflowLogo size={28} />
              <span className="text-lg font-black text-white">
                Park<span className="text-cyan-400">eya</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              La plateforme intelligente de gestion et d'optimisation des parkings professionnels, voituriers aéroportuaires et parcs longue durée.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-semibold">
              <ShieldCheck size={14} />
              <span>Conformité RGPD & Hébergement Cloud Sécurisé</span>
            </div>
          </div>

          {/* Col 2 : Produit */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase text-[11px] font-mono tracking-wider">Produit</h4>
            <ul className="space-y-2">
              <li>
                <a href="#how-it-works" className="hover:text-cyan-400 transition-colors">Fonctionnalités</a>
              </li>
              <li>
                <button onClick={() => onNavigate("pricing")} className="hover:text-cyan-400 transition-colors cursor-pointer">
                  Tarifs & Abonnements
                </button>
              </li>
              <li>
                <a href="#problem-solution" className="hover:text-cyan-400 transition-colors">Récupération Optimisée</a>
              </li>
              <li>
                <button onClick={() => onNavigate("signup")} className="hover:text-cyan-400 transition-colors cursor-pointer">
                  Essai Gratuit
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3 : Entreprise */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase text-[11px] font-mono tracking-wider">Entreprise</h4>
            <ul className="space-y-2">
              <li>
                <a href="#problem-solution" className="hover:text-cyan-400 transition-colors">À propos</a>
              </li>
              <li>
                <a href="mailto:contact@bklvision.fr" className="hover:text-cyan-400 transition-colors">contact@bklvision.fr</a>
              </li>
              <li>
                <a href="https://bklvision.fr" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">Site Agence (bklvision.fr)</a>
              </li>
              <li>
                <button onClick={() => onNavigate("login")} className="hover:text-cyan-400 transition-colors cursor-pointer">
                  Espace Client
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4 : Légal & RGPD */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase text-[11px] font-mono tracking-wider">Légal & Données</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <button onClick={() => onNavigate("legal-mentions")} className="hover:text-cyan-400 transition-colors cursor-pointer">
                  Mentions Légales
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("legal-privacy")} className="hover:text-cyan-400 transition-colors cursor-pointer">
                  Politique de Confidentialité
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("legal-dpa")} className="hover:text-cyan-400 transition-colors cursor-pointer">
                  Accord DPA (Sous-traitance)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("legal-cgu")} className="hover:text-cyan-400 transition-colors cursor-pointer">
                  CGU / CGV B2B
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("legal-cookies")} className="hover:text-cyan-400 transition-colors cursor-pointer">
                  Gestion des Cookies
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("legal-subprocessors")} className="hover:text-cyan-400 transition-colors cursor-pointer">
                  Sous-traitants techniques
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div>© {new Date().getFullYear()} <strong>BKL Vision</strong> — Tous droits réservés.</div>
          <div>Solution logicielle B2B éditée par Rayan BOUAKLI (EI) • SIRET 107 483 794 00015</div>
        </div>
      </footer>
    </div>
  );
}
