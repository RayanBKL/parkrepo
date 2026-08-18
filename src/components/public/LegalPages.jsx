import React, { useState } from "react";
import {
  ShieldCheck,
  FileText,
  Lock,
  Scale,
  Server,
  Cookie,
  ArrowLeft,
  Building2,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
} from "lucide-react";
import ParkeyaLogo from "../ParkeyaLogo";

export default function LegalPages({ onNavigate, initialTab = "mentions" }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  const tabs = [
    { id: "mentions", label: "Mentions Légales", icon: Building2 },
    { id: "privacy", label: "Politique de Confidentialité & RGPD", icon: Lock },
    { id: "dpa", label: "Accord DPA (Sous-traitance des Données)", icon: ShieldCheck },
    { id: "cgu-cgv", label: "CGU & CGV Professionnelles (B2B)", icon: Scale },
    { id: "cookies", label: "Politique relative aux Cookies", icon: Cookie },
    { id: "subprocessors", label: "Sous-traitants & Hébergement", icon: Server },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-white font-sans antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate("home")}>
            <div className="drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <ParkeyaLogo size={36} />
            </div>
            <span className="text-xl font-black text-white tracking-tight flex items-center">
              Park<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 font-extrabold ml-0.5">eya</span>
            </span>
          </div>

          <button
            onClick={() => onNavigate("home")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs sm:text-sm font-bold text-slate-300 hover:text-white transition-all cursor-pointer shadow-inner"
          >
            <ArrowLeft size={16} />
            <span>Retour au site</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Navigation Sidebar */}
          <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
            <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-1.5 shadow-2xl backdrop-blur-xl">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold px-3 py-2">
                Cadre Juridique & Conformité
              </div>
              {tabs.map((t) => {
                const Icon = t.icon;
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left ${
                      isActive
                        ? "bg-gradient-to-r from-cyan-600 to-emerald-600 text-white shadow-lg shadow-cyan-950/60 font-black scale-[1.02]"
                        : "text-slate-400 hover:text-white hover:bg-slate-850"
                    }`}
                  >
                    <Icon size={16} className={isActive ? "text-white" : "text-cyan-400 shrink-0"} />
                    <span className="truncate">{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Fiche Entreprise Éditeur */}
            <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-850 space-y-3 text-xs shadow-xl">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <Building2 size={16} />
                <span>Édité par BKL Vision</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Parkeya est une solution logicielle SaaS propriétaire développée et exploitée par l'agence technologique <strong>BKL Vision</strong> (SIRET 107 483 794 00015).
              </p>
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <Mail size={13} className="text-cyan-400" />
                  <a href="mailto:contact@bklvision.fr" className="hover:text-white transition-colors">contact@bklvision.fr</a>
                </div>
                <div className="flex items-center gap-2">
                  <ExternalLink size={13} className="text-emerald-400" />
                  <a href="https://bklvision.fr" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">https://bklvision.fr</a>
                </div>
              </div>
            </div>
          </aside>

          {/* Section Document Actif */}
          <section className="lg:col-span-8 bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 text-slate-300 text-xs sm:text-sm leading-relaxed">
            {/* 1. MENTIONS LÉGALES */}
            {activeTab === "mentions" && (
              <div className="space-y-6 animate-in fade-in">
                <div className="border-b border-slate-800 pb-5">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">Transparence Légale & LCEN</span>
                  <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Mentions Légales</h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Conformément aux dispositions de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN).
                  </p>
                </div>

                {/* Bloc Entreprise */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-850 space-y-3">
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Building2 size={18} className="text-cyan-400" />
                    <span>1. Éditeur de la Plateforme & Propriétaire</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Dénomination / Nom commercial :</span>
                      <strong className="text-white">BKL Vision</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Forme juridique :</span>
                      <strong className="text-white">Entrepreneur Individuel (EI)</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Titulaire & Dirigeant :</span>
                      <strong className="text-white">Rayan BOUAKLI</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Numéro SIREN :</span>
                      <strong className="text-cyan-300 font-mono">107 483 794</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Numéro SIRET (Siège) :</span>
                      <strong className="text-cyan-300 font-mono">107 483 794 00015</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Code APE / NAF :</span>
                      <strong className="text-white font-mono">6201Z (Programmation informatique)</strong>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-500 block text-[11px]">Adresse du siège social :</span>
                      <strong className="text-white">13 Allée Louis Tondino, 13730 Saint-Victoret, FRANCE</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Email de contact officiel :</span>
                      <strong className="text-cyan-400">contact@bklvision.fr</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Site web institutionnel de l'agence :</span>
                      <strong className="text-emerald-400">https://bklvision.fr</strong>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-500 block text-[11px]">Directeur de la publication :</span>
                      <strong className="text-white">Rayan BOUAKLI (Fondateur BKL Vision)</strong>
                    </div>
                  </div>
                </div>

                {/* Bloc Hébergement */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-850 space-y-3">
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Server size={18} className="text-emerald-400" />
                    <span>2. Prestataires d'Hébergement & Infrastructure Cloud</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <strong className="text-white block">A. Hébergement Web & Noms de Domaine :</strong>
                      <p className="text-slate-300 mt-0.5">
                        <strong>Hostinger International Ltd.</strong> — 61 Lordou Vironos Street, 6023 Larnaca, Chypre.<br />
                        Site web : <a href="https://www.hostinger.fr" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">https://www.hostinger.fr</a>
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-900">
                      <strong className="text-white block">B. Base de Données Temps Réel & Authentification Sécurisée :</strong>
                      <p className="text-slate-300 mt-0.5">
                        <strong>Google Cloud Platform / Firebase</strong> — Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irlande (Infrastructures localisées en Union Européenne).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Propriété intellectuelle */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-850 space-y-2 text-xs">
                  <h3 className="font-bold text-white text-base">3. Propriété Intellectuelle & Droits d'Auteur</h3>
                  <p className="text-slate-300 leading-relaxed">
                    L'application logicielle <strong>Parkeya</strong>, comprenant son code source, son algorithme propriétaire d'ordonnancement de véhicules (Tightest Fit Decreasing), sa structure de base de données, son interface graphique, son logo et ses éléments de marque, est une création originale protégée par le Code de la Propriété Intellectuelle au bénéfice exclusif de <strong>BKL Vision (Rayan BOUAKLI EI)</strong>.
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Toute reproduction, décompilation, ingénierie inverse, extraction de données ou diffusion non autorisée constitue une contrefaçon passible des sanctions civiles et pénales prévues par la loi.
                  </p>
                </div>
              </div>
            )}

            {/* 2. CONFIDENTIALITÉ & RGPD */}
            {activeTab === "privacy" && (
              <div className="space-y-6 animate-in fade-in">
                <div className="border-b border-slate-800 pb-5">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">Protection des Données Personnelles</span>
                  <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Politique de Confidentialité & RGPD</h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Conforme au Règlement Général sur la Protection des Données (RGPD - UE 2016/679) et à la loi Informatique et Libertés.
                  </p>
                </div>

                {/* Encadré d'or pour la protection juridique */}
                <div className="p-5 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-cyan-300">
                    <ShieldCheck size={18} />
                    <span>Principe Clé de Séparation des Responsabilités (Art. 28 RGPD)</span>
                  </div>
                  <p className="leading-relaxed">
                    <strong>BKL Vision</strong> édite Parkeya en tant que solution logicielle pure. BKL Vision agit en qualité de <strong>Sous-Traitant Technique</strong> (Data Processor) et n'a aucune vocation à exploiter, commercialiser ou céder les données renseignées par les entreprises clientes dans le cadre de leur activité de stationnement.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-white text-base">1. Distinction des Rôles RGPD</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-2">
                      <strong className="text-amber-300 block text-xs uppercase font-mono">Le Client (L'Exploitant du Parking)</strong>
                      <span className="text-xs font-bold text-white">Responsable du Traitement (Data Controller)</span>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        L'exploitant du parking décide librement de la collecte des informations de ses propres clients (plaques d'immatriculation, modèles, numéros de vol, téléphones). Il en garantit la conformité légale et la légitimité.
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-2">
                      <strong className="text-emerald-300 block text-xs uppercase font-mono">BKL Vision (Éditeur Parkeya)</strong>
                      <span className="text-xs font-bold text-white">Sous-Traitant Technique (Data Processor)</span>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        BKL Vision met à disposition l'hébergement sécurisé et exécute les calculs de placement et de restitution selon les seules instructions techniques de l'exploitant.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-white text-base">2. Données Traitées & Finalités Opérationnelles</h3>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    <li className="p-3 rounded-xl bg-slate-950 border border-slate-850">
                      <strong className="text-white">• Données du Compte Client (Entreprise / Voiturier) :</strong> Nom, prénom, adresse email professionnelle, mot de passe chiffré, rôle attribué (Owner, Manager, Voiturier).<br />
                      <span className="text-slate-400 text-[11px]">Finalité : Authentification sécurisée, gestion des droits RBAC et facturation de l'abonnement.</span>
                    </li>
                    <li className="p-3 rounded-xl bg-slate-950 border border-slate-850">
                      <strong className="text-white">• Données Opérationnelles Véhicules :</strong> Plaque d'immatriculation, modèle de voiture, date et heure d'arrivée/départ, numéro de vol éventuel.<br />
                      <span className="text-slate-400 text-[11px]">Finalité : Calcul de l'assignation de voie optimale (Tightest Fit Decreasing) et guidage de sortie sans blocage.</span>
                    </li>
                    <li className="p-3 rounded-xl bg-slate-950 border border-slate-850">
                      <strong className="text-white">• Données de Traçabilité (Journal d'Audit) :</strong> Historique horodaté des manœuvres et déplacements effectués par les collaborateurs.<br />
                      <span className="text-slate-400 text-[11px]">Finalité : Sécurité interne du parc, prévention des litiges opérationnels et supervision du parc.</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-white text-base">3. Durée de Conservation & Droits des Utilisateurs</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Les données sont conservées pendant toute la durée contractuelle active du compte. À la résiliation ou suppression d'un parc, les données sont immédiatement purgées ou restituées selon le protocole de fin de contrat.
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Conformément à la réglementation RGPD, vous bénéficiez d'un droit permanent d'accès, de rectification, de portabilité et de suppression de vos données personnelles en adressant un email à : <strong className="text-cyan-400">contact@bklvision.fr</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* 3. DPA (DATA PROCESSING AGREEMENT) */}
            {activeTab === "dpa" && (
              <div className="space-y-6 animate-in fade-in">
                <div className="border-b border-slate-800 pb-5">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">Annexe Contractuelle RGPD (Art. 28)</span>
                  <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Accord de Traitement des Données (DPA)</h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Entre l'Entreprise Cliente (Responsable de Traitement) et BKL Vision (Sous-Traitant).
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-200 text-xs space-y-2">
                  <strong className="font-bold text-sm text-amber-300 block">Stipulation Explicite de Non-Responsabilité :</strong>
                  <p className="leading-relaxed">
                    L'exploitant du parking reconnaît qu'il est seul responsable de la saisie des plaques d'immatriculation et informations clients dans Parkeya. <strong>BKL Vision</strong> ne vérifie pas l'exactitude de ces informations et décline toute responsabilité quant à l'origine ou l'utilisation faite de ces données en dehors du strict fonctionnement technique de l'application.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-white text-base">1. Objet & Périmètre du Traitement</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Le présent DPA encadre le traitement technique automatisé des données nécessaires à la fourniture des services de gestion de parcs, d'optimisation de rangement et de calcul des plans de sortie via Parkeya.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-white text-base">2. Engagements de Sécurité de BKL Vision</h3>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li>• <strong>Isolation Multi-Tenant :</strong> Cloisonnement strict des données entre les différentes organisations clientes.</li>
                    <li>• <strong>Chiffrement en Transit & au Repos :</strong> Flux réseau sécurisés par protocoles HTTPS/TLS et bases de données Firebase hébergées sur serveurs européens hautement protégés.</li>
                    <li>• <strong>Confidentialité Absolue :</strong> Engagement formel de non-divulgation, non-cession et non-utilisation commerciale des données métiers.</li>
                    <li>• <strong>Notification d'Incident :</strong> Notification sans délai au Client en cas d'incident de sécurité avéré compromettant l'intégrité de ses données.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* 4. CGU / CGV B2B */}
            {activeTab === "cgu-cgv" && (
              <div className="space-y-6 animate-in fade-in">
                <div className="border-b border-slate-800 pb-5">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">Contrat Commercial B2B</span>
                  <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Conditions Générales d'Utilisation & de Vente (B2B)</h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Applicables à tout abonnement professionnel souscrit auprès de l'entreprise BKL Vision pour le service Parkeya.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-2">
                    <h4 className="font-bold text-white text-sm">Article 1 — Objet & Souscription</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Parkeya est un service SaaS d'optimisation de stationnement accessible par abonnement mensuel ou annuel. La souscription est réservée aux professionnels (sociétés d'exploitation de parkings, voituriers, aéroports, concessions).
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-2">
                    <h4 className="font-bold text-white text-sm">Article 2 — Tarifs, Facturation & Quotas</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Les tarifs sont indiqués en euros Hors Taxes (HT). L'accès aux fonctionnalités est assujetti au respect des quotas du plan choisi (*Starter*, *Business*, *Enterprise*). Le renouvellement est tacite à chaque échéance et peut être résilié à tout moment depuis les Paramètres sans pénalité.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-2">
                    <h4 className="font-bold text-white text-sm">Article 3 — Disponibilité & Responsabilité</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      BKL Vision s'engage à apporter tout le soin nécessaire à la fourniture d'un service disponible 99,9% du temps (obligation de moyens). BKL Vision ne saurait être tenue pour responsable des sinistres physiques, dommages aux véhicules survenus sur le terrain ou erreurs de manœuvre commises par les voituriers exploitants.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-2">
                    <h4 className="font-bold text-white text-sm">Article 4 — Droit Applicable & Juridiction</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Les présentes conditions sont soumises au droit français. Tout litige relatif à leur validité ou exécution sera porté devant les tribunaux compétents du ressort du siège de BKL Vision.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 5. COOKIES */}
            {activeTab === "cookies" && (
              <div className="space-y-6 animate-in fade-in">
                <div className="border-b border-slate-800 pb-5">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">Respect de la Vie Privée</span>
                  <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Politique relative aux Cookies & Traceurs</h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Conforme aux lignes directrices de la CNIL relatives aux traceurs exemptés de consentement.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
                    <CheckCircle2 size={18} />
                    <span>Zéro Traceur Publicitaire Invasif</span>
                  </div>
                  <p className="leading-relaxed">
                    Parkeya applique une politique de sobriété numérique stricte : l'application n'utilise <strong>aucun cookie tiers publicitaire</strong> (pas de pixel Meta, TikTok ou tracking intrusif). Seuls les traceurs strictement indispensables au fonctionnement du service SaaS sont déployés.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-white text-base">Cookies Techniques Strictement Nécessaires</h3>
                  <div className="space-y-2 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-850 flex justify-between items-center">
                      <div>
                        <strong className="text-white block font-mono text-cyan-300">Firebase Auth Session Token</strong>
                        <span className="text-slate-400 text-[11px]">Permet de maintenir votre session sécurisée lors des déplacements dans l'application.</span>
                      </div>
                      <span className="text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">Exempté</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-850 flex justify-between items-center">
                      <div>
                        <strong className="text-white block font-mono text-cyan-300">User UI Preferences</strong>
                        <span className="text-slate-400 text-[11px]">Mémorise la vue active (Grille 2D ou Planning) et les filtres de vos parcs.</span>
                      </div>
                      <span className="text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">Exempté</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. SOUS-TRAITANTS */}
            {activeTab === "subprocessors" && (
              <div className="space-y-6 animate-in fade-in">
                <div className="border-b border-slate-800 pb-5">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">Chaîne de Confiance & Sécurité</span>
                  <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Sous-Traitants Ultérieurs & Infrastructures</h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Liste exhaustive et transparente des tiers techniques participant à l'exécution du service Parkeya.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 font-bold text-white bg-slate-950">
                        <th className="py-3.5 px-4">Prestataire</th>
                        <th className="py-3.5 px-4">Fonction / Rôle</th>
                        <th className="py-3.5 px-4">Localisation des Données</th>
                        <th className="py-3.5 px-4">Garanties RGPD</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      <tr>
                        <td className="py-3.5 px-4 font-bold text-cyan-300">Google Cloud / Firebase</td>
                        <td className="py-3.5 px-4">Authentification, Base de données temps réel Firestore, Sécurité des accès</td>
                        <td className="py-3.5 px-4">Union Européenne (Région Europe)</td>
                        <td className="py-3.5 px-4 text-emerald-400 font-semibold">Clauses Contractuelles Types UE / ISO 27001</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-4 font-bold text-cyan-300">Hostinger International Ltd.</td>
                        <td className="py-3.5 px-4">Hébergement des fichiers frontend, CDN et gestion DNS</td>
                        <td className="py-3.5 px-4">Union Européenne</td>
                        <td className="py-3.5 px-4 text-emerald-400 font-semibold">Conformité RGPD stricte</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 text-xs text-slate-400">
                  <strong>Engagement :</strong> BKL Vision s'engage à n'ajouter aucun sous-traitant technique sans s'assurer au préalable de son parfait alignement avec les exigences de sécurité et de confidentialité du RGPD.
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Footer Juridique */}
      <footer className="border-t border-slate-800/80 py-8 bg-slate-950 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>© {new Date().getFullYear()} <strong>BKL Vision</strong> — Tous droits réservés.</div>
          <div>Solution logicielle B2B éditée par Rayan BOUAKLI (EI) • SIRET 107 483 794 00015</div>
        </div>
      </footer>
    </div>
  );
}
