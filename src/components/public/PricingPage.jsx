import React, { useState } from "react";
import { Check, ArrowRight, Sparkles, Building2, HelpCircle, ShieldCheck, Zap } from "lucide-react";
import ParkflowLogo from "../ParkflowLogo";
import { PLANS_CONFIG } from "../../services/organization";

export default function PricingPage({ onNavigate, onSelectPlan }) {
  const [isAnnual, setIsAnnual] = useState(true);

  const handleChoose = (planId) => {
    if (onSelectPlan) onSelectPlan(planId);
    onNavigate("signup");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-white font-sans antialiased">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate("home")}>
            <div className="drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <ParkflowLogo size={36} />
            </div>
            <span className="text-xl font-black text-white tracking-tight flex items-center">
              Park<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 font-extrabold ml-0.5">Flow</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate("home")}
              className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Retour à l'accueil
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
      <section className="pt-16 pb-20 text-center max-w-5xl mx-auto px-4 sm:px-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-cyan-500/30 text-cyan-300 text-xs font-bold mb-4 shadow-inner">
          <Sparkles size={14} className="text-cyan-400" />
          <span>Des tarifs clairs, adaptés à la taille de vos parcs</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
          Investissez dans l'efficacité de vos voituriers.
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
          Rentabilisez votre abonnement dès le premier mois grâce aux heures de manœuvres économisées et au zéro sinistre.
        </p>

        {/* Toggle Facturation */}
        <div className="mt-10 flex items-center justify-center gap-4">
          <span className={`text-xs font-bold ${!isAnnual ? "text-white" : "text-slate-400"}`}>Mensuel</span>
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
            <span className={`text-xs font-bold ${isAnnual ? "text-white" : "text-slate-400"}`}>Annuel</span>
            <span className="text-[10px] uppercase font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full">
              -15% de réduction
            </span>
          </div>
        </div>
      </section>

      {/* Grille des Plans */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* STARTER */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black text-white">Starter</h3>
                <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full font-bold">1 Parking</span>
              </div>
              <p className="text-xs text-slate-400 mb-6">
                Idéal pour les petits parkings d'appoint ou exploitants indépendants.
              </p>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-black text-white">
                  {isAnnual ? PLANS_CONFIG.starter.priceAnnually : PLANS_CONFIG.starter.priceMonthly}€
                </span>
                <span className="text-xs text-slate-400 font-semibold">/ mois HT</span>
              </div>

              <ul className="space-y-3.5 text-xs text-slate-300 border-t border-slate-800 pt-6">
                {PLANS_CONFIG.starter.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <Check size={16} className="text-cyan-400 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleChoose("starter")}
              className="mt-8 w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer shadow-inner"
            >
              Choisir le plan Starter
            </button>
          </div>

          {/* BUSINESS (POPULAIRE) */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-cyan-950/40 border-2 border-cyan-500/80 flex flex-col justify-between relative shadow-2xl shadow-cyan-950/50 transform lg:-translate-y-2">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-white text-[11px] font-black tracking-wider uppercase shadow-md flex items-center gap-1.5">
              <Zap size={12} />
              <span>Le plus recommandé</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4 mt-2">
                <h3 className="text-2xl font-black text-white">Business</h3>
                <span className="text-xs bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-3 py-1 rounded-full font-bold">
                  3 Parkings
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-6">
                La solution complète pour les sociétés de voituriers aéroportuaires et multi-équipes.
              </p>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
                  {isAnnual ? PLANS_CONFIG.business.priceAnnually : PLANS_CONFIG.business.priceMonthly}€
                </span>
                <span className="text-xs text-slate-400 font-semibold">/ mois HT</span>
              </div>

              <ul className="space-y-3.5 text-xs text-slate-200 border-t border-slate-800/80 pt-6">
                {PLANS_CONFIG.business.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-400 shrink-0" />
                    <span className="font-semibold">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleChoose("business")}
              className="mt-8 w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-black text-sm shadow-xl shadow-cyan-950/60 hover:scale-[1.02] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Commencer avec Business</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* ENTERPRISE */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black text-white">Enterprise</h3>
                <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-500/40 px-3 py-1 rounded-full font-bold">
                  Illimité
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-6">
                Pour les grands groupes aéroportuaires et parcs de plusieurs milliers de places.
              </p>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-black text-white">
                  {isAnnual ? PLANS_CONFIG.enterprise.priceAnnually : PLANS_CONFIG.enterprise.priceMonthly}€
                </span>
                <span className="text-xs text-slate-400 font-semibold">/ mois HT</span>
              </div>

              <ul className="space-y-3.5 text-xs text-slate-300 border-t border-slate-800 pt-6">
                {PLANS_CONFIG.enterprise.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <Check size={16} className="text-cyan-400 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleChoose("enterprise")}
              className="mt-8 w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer shadow-inner"
            >
              Contacter pour Enterprise
            </button>
          </div>
        </div>
      </section>

      {/* FAQ B2B */}
      <section className="py-16 bg-slate-900/30 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-white">Questions Fréquentes</h2>
            <p className="text-xs text-slate-400 mt-2">Tout ce que vous devez savoir avant de déployer ParkFlow</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Puis-je changer d'offre ou annuler à tout moment ?",
                a: "Oui, vous pouvez faire évoluer votre plan (upgrader pour ajouter des parkings ou des voituriers) à tout moment depuis les paramètres de votre organisation.",
              },
              {
                q: "Comment fonctionne l'accès pour mes voituriers sur le terrain ?",
                a: "Vos voituriers reçoivent une invitation avec leurs accès. Ils peuvent se connecter depuis une tablette ou smartphone pour rechercher et sortir des véhicules en quelques secondes.",
              },
              {
                q: "Mes données sont-elles isolées des autres entreprises ?",
                a: "Absolument. ParkFlow utilise une architecture multi-tenant stricte : aucune autre entreprise ne peut accéder à vos parcs, véhicules ou plannings.",
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
    </div>
  );
}
