import React, { useState } from "react";
import { Check, ArrowRight, Sparkles, Building2, HelpCircle, ShieldCheck, Zap, ArrowLeft, Car, Users, Layers, Play } from "lucide-react";
import ParkflowLogo from "../ParkflowLogo";
import { PLANS_CONFIG } from "../../services/organization";
import DemoSandboxModal from "./DemoSandboxModal";

export default function PricingPage({ onNavigate, onSelectPlan }) {
  const [isAnnual, setIsAnnual] = useState(true);
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  const handleChoose = (planId) => {
    if (onSelectPlan) onSelectPlan(planId);
    onNavigate("signup");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-white font-sans antialiased">
      {/* Modale Démo Gratuite */}
      <DemoSandboxModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        onSignup={() => onNavigate("signup")}
      />

      {/* Navigation */}
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

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDemoOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all cursor-pointer"
            >
              <Play size={13} className="text-cyan-400 fill-cyan-400" />
              <span>Tester la Démo</span>
            </button>
            <button
              onClick={() => onNavigate("home")}
              className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft size={15} />
              <span>Retour à l'accueil</span>
            </button>
            <button
              onClick={() => onNavigate("login")}
              className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-200 hover:text-white transition-colors cursor-pointer"
            >
              Connexion
            </button>
          </div>
        </div>
      </header>

      {/* Hero Pricing */}
      <section className="pt-16 pb-12 text-center max-w-5xl mx-auto px-4 sm:px-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-cyan-500/30 text-cyan-300 text-xs font-bold mb-4 shadow-inner">
          <Sparkles size={14} className="text-cyan-400" />
          <span>💰 Tarification claire basée sur le volume de véhicules actifs</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
          Une formule adaptée à la capacité de vos parcs.
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
          Payez uniquement en fonction du nombre de véhicules stationnés simultanément.
        </p>

        {/* Action Démo Gratuite */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => setIsDemoOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all shadow-lg shadow-cyan-950/40 flex items-center gap-2 cursor-pointer hover:scale-105"
          >
            <Play size={14} className="text-cyan-400 fill-cyan-400" />
            <span>Tester l'algorithme de tri en direct (Démo Gratuite)</span>
          </button>
        </div>

        {/* Toggle Facturation */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <span className={`text-xs font-bold ${!isAnnual ? "text-white" : "text-slate-400"}`}>Facturation Mensuelle</span>
          <button
            type="button"
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-14 h-8 rounded-full bg-slate-900 border border-slate-700 p-1 relative transition-colors cursor-pointer"
          >
            <div
              className={`w-6 h-6 rounded-full bg-cyan-500 shadow-md transition-transform duration-300 ${
                isAnnual ? "translate-x-6 bg-gradient-to-r from-cyan-400 to-emerald-400" : "translate-x-0"
              }`}
            />
          </button>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${isAnnual ? "text-white" : "text-slate-400"}`}>Facturation Annuelle</span>
            <span className="text-[10px] uppercase font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full">
              -15% de réduction
            </span>
          </div>
        </div>
      </section>

      {/* Grille des 4 Plans */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {/* STARTER */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-black text-white">Starter</h3>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full font-bold">1 Parking</span>
              </div>
              <p className="text-xs text-slate-300 mb-5 min-h-[32px]">
                Pour les parkings indépendants jusqu'à 300 places.
              </p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-black text-white">
                  {isAnnual ? PLANS_CONFIG.starter.priceAnnually : PLANS_CONFIG.starter.priceMonthly}€
                </span>
                <span className="text-xs text-slate-400 font-semibold">/ mois HT</span>
              </div>

              {/* Specs clés différenciantes */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-2.5 text-xs mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5"><Layers size={13} className="text-slate-500" /> Parkings :</span>
                  <strong className="text-white font-bold">1</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5"><Car size={13} className="text-cyan-400" /> Véhicules actifs :</span>
                  <strong className="text-cyan-300 font-bold">300 max</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5"><Users size={13} className="text-slate-500" /> Utilisateurs :</span>
                  <strong className="text-white font-bold">5 inclus</strong>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800 pt-4">
                {PLANS_CONFIG.starter.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check size={14} className="text-cyan-400 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleChoose("starter")}
              className="mt-6 w-full py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/40 transition-all cursor-pointer"
            >
              Créer votre compte
            </button>
          </div>

          {/* BUSINESS */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-black text-white">Business</h3>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full font-bold">1 Parking</span>
              </div>
              <p className="text-xs text-slate-300 mb-5 min-h-[32px]">
                Pour les exploitants et services voituriers jusqu'à 600 places.
              </p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-black text-white">
                  {isAnnual ? PLANS_CONFIG.business.priceAnnually : PLANS_CONFIG.business.priceMonthly}€
                </span>
                <span className="text-xs text-slate-400 font-semibold">/ mois HT</span>
              </div>

              {/* Specs clés différenciantes */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-2.5 text-xs mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5"><Layers size={13} className="text-slate-500" /> Parkings :</span>
                  <strong className="text-white font-bold">1</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5"><Car size={13} className="text-cyan-400" /> Véhicules actifs :</span>
                  <strong className="text-cyan-300 font-bold">600 max</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5"><Users size={13} className="text-slate-500" /> Utilisateurs :</span>
                  <strong className="text-white font-bold">10 inclus</strong>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800 pt-4">
                {PLANS_CONFIG.business.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check size={14} className="text-cyan-400 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleChoose("business")}
              className="mt-6 w-full py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/40 transition-all cursor-pointer"
            >
              Créer votre compte
            </button>
          </div>

          {/* PRO (LE PLUS RECOMMANDÉ) */}
          <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-900 via-cyan-950/50 to-slate-900 border-2 border-cyan-500/80 flex flex-col justify-between relative shadow-2xl shadow-cyan-950/60 transform lg:-translate-y-2">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-white text-[10px] font-black tracking-wider uppercase shadow-md flex items-center gap-1">
              <Zap size={11} />
              <span>Le plus recommandé</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 mt-1">
                <h3 className="text-2xl font-black text-white">Pro</h3>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-2.5 py-1 rounded-full font-bold">
                  3 Parkings
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-5 min-h-[32px]">
                Pour les exploitants multi-parkings jusqu'à 1 000 places par site.
              </p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
                  {isAnnual ? PLANS_CONFIG.pro.priceAnnually : PLANS_CONFIG.pro.priceMonthly}€
                </span>
                <span className="text-xs text-slate-400 font-semibold">/ mois HT</span>
              </div>

              {/* Specs clés différenciantes */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-cyan-500/30 space-y-2.5 text-xs mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-1.5"><Layers size={13} className="text-cyan-400" /> Parkings :</span>
                  <strong className="text-cyan-300 font-bold">Jusqu'à 3</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-1.5"><Car size={13} className="text-emerald-400" /> Véhicules actifs :</span>
                  <strong className="text-emerald-300 font-bold">1 000 / parking</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-1.5"><Users size={13} className="text-cyan-400" /> Utilisateurs :</span>
                  <strong className="text-white font-bold">20 inclus</strong>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-200 border-t border-slate-800/80 pt-4">
                {PLANS_CONFIG.pro.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    <span className="font-semibold">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleChoose("pro")}
              className="mt-6 w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-black text-xs shadow-xl shadow-cyan-950/60 hover:scale-[1.02] transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Créer votre compte</span>
              <ArrowRight size={15} />
            </button>
          </div>

          {/* ENTERPRISE */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-black text-white">Enterprise</h3>
                <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-500/40 px-2.5 py-1 rounded-full font-bold">
                  4+ Parcs
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-5 min-h-[32px]">
                Pour les réseaux aéroportuaires et parcs sur-mesure.
              </p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-black text-white">Sur devis</span>
              </div>

              {/* Specs clés différenciantes */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-2.5 text-xs mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5"><Layers size={13} className="text-indigo-400" /> Parkings :</span>
                  <strong className="text-indigo-300 font-bold">4+ (Sur mesure)</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5"><Car size={13} className="text-white" /> Véhicules actifs :</span>
                  <strong className="text-white font-bold">Sur mesure</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5"><Users size={13} className="text-white" /> Utilisateurs :</span>
                  <strong className="text-white font-bold">Sur mesure</strong>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800 pt-4">
                {PLANS_CONFIG.enterprise.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check size={14} className="text-cyan-400 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleChoose("enterprise")}
              className="mt-6 w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer shadow-inner"
            >
              Demander un devis
            </button>
          </div>
        </div>
      </section>

      {/* FAQ B2B */}
      <section className="py-16 bg-slate-900/30 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-white">Questions Fréquentes</h2>
            <p className="text-xs text-slate-400 mt-2">Tout ce que vous devez savoir avant de déployer Parkeya</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Que signifie la limite de véhicules 'actifs' ?",
                a: "La limite de véhicules correspond au nombre maximum de voitures physiquement stationnées en même temps sur votre parking. Lorsqu'un client récupère sa voiture et qu'elle sort du parc, une place se libère immédiatement dans votre quota !",
              },
              {
                q: "Les véhicules sortis restent-ils dans l'historique et les statistiques ?",
                a: "Oui ! Chaque sortie est archivée avec son heure exacte, son voiturier responsable et la durée du séjour pour alimenter vos rapports d'activité, votre journal d'audit et vos analyses de performance.",
              },
              {
                q: "Puis-je changer d'offre ou faire évoluer mes quotas à tout moment ?",
                a: "Oui, vous pouvez faire évoluer votre abonnement (passer de Starter à Business ou Pro pour ajouter des parkings et utilisateurs) en un clic depuis les paramètres de votre organisation.",
              },
            ].map((faq, i) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-2">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <HelpCircle size={16} className="text-cyan-400 shrink-0" />
                  {faq.q}
                </h4>
                <p className="text-xs text-slate-400 pl-6 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer B2B */}
      <footer className="border-t border-slate-800/80 pt-12 pb-10 bg-slate-950 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ParkflowLogo size={24} />
            <span className="font-bold text-white">Parkeya SaaS</span>
            <span>— Solution B2B éditée par <strong>BKL Vision</strong> (SIRET 107 483 794 00015).</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={() => onNavigate("legal-mentions")} className="hover:text-cyan-400 transition-colors cursor-pointer">
              Mentions Légales
            </button>
            <button onClick={() => onNavigate("legal-privacy")} className="hover:text-cyan-400 transition-colors cursor-pointer">
              Confidentialité & DPA
            </button>
            <button onClick={() => onNavigate("legal-cgu")} className="hover:text-cyan-400 transition-colors cursor-pointer">
              CGV B2B
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
