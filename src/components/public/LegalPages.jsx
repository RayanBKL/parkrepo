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
  HelpCircle,
} from "lucide-react";
import ParkflowLogo from "../ParkflowLogo";

export default function LegalPages({ onNavigate, initialTab = "mentions" }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  const tabs = [
    { id: "mentions", label: "Mentions Légales", icon: Building2 },
    { id: "privacy", label: "Confidentialité & RGPD", icon: Lock },
    { id: "dpa", label: "Accord DPA (Sous-traitance)", icon: ShieldCheck },
    { id: "cgu-cgv", label: "CGU / CGV B2B", icon: Scale },
    { id: "cookies", label: "Gestion des Cookies", icon: Cookie },
    { id: "subprocessors", label: "Sous-traitants", icon: Server },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-white font-sans antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate("home")}>
            <div className="drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <ParkflowLogo size={36} />
            </div>
            <span className="text-xl font-black text-white tracking-tight flex items-center">
              Park<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 font-extrabold ml-0.5">eya</span>
              <span className="ml-2 text-[10px] uppercase font-mono tracking-widest bg-cyan-950 text-cyan-400 border border-cyan-500/40 px-2 py-0.5 rounded-full font-bold">
                Espace Juridique
              </span>
            </span>
          </div>

          <button
            onClick={() => onNavigate("home")}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Retour à l'accueil</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Navigation Sidebar */}
          <aside className="lg:col-span-4 space-y-2">
            <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold px-3 py-2">
                Documents Contractuels & Légaux
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
                        ? "bg-cyan-600 text-white shadow-lg shadow-cyan-950/60 font-black"
                        : "text-slate-400 hover:text-white hover:bg-slate-850"
                    }`}
                  >
                    <Icon size={16} className={isActive ? "text-white" : "text-cyan-400"} />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-5 rounded-3xl bg-cyan-950/30 border border-cyan-500/30 space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <ShieldCheck size={16} />
                <span>Conformité RGPD & B2B</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Parkeya garantit la stricte isolation des données de chaque organisation cliente et agit en qualité de <strong>sous-traitant technique</strong> (Art. 28 RGPD).
              </p>
            </div>
          </aside>

          {/* Tab Contents */}
          <section className="lg:col-span-8 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 text-slate-300 text-xs sm:text-sm leading-relaxed">
            {/* 1. MENTIONS LÉGALES */}
            {activeTab === "mentions" && (
              <div className="space-y-6 animate-in fade-in">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white">Mentions Légales</h1>
                  <p className="text-xs text-slate-400 mt-1">Conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN).</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <h3 className="font-bold text-white text-base">1. Éditeur de la Plateforme</h3>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    <li><strong>Service SaaS :</strong> Parkeya (Logiciel B2B de gestion de parkings)</li>
                    <li><strong>Exploitant :</strong> Rayan BOUAKKAZ (Entrepreneur Individuel / EI)</li>
                    <li><strong>Statut juridique :</strong> Micro-entreprise / Entrepreneur Individuel</li>
                    <li><strong>Contact Email :</strong> contact@parkeya.com (ou email du gérant)</li>
                    <li><strong>Directeur de la publication :</strong> Rayan BOUAKKAZ</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <h3 className="font-bold text-white text-base">2. Hébergement de la Plateforme</h3>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    <li><strong>Hébergement Web & Domaine :</strong> Hostinger International Ltd.</li>
                    <li><strong>Adresse Hébergeur :</strong> 61 Lordou Vironos Street, 6023 Larnaca, Chypre</li>
                    <li><strong>Site web Hébergeur :</strong> https://www.hostinger.fr</li>
                    <li><strong>Base de Données & Authentification Cloud :</strong> Google Cloud Platform / Firebase (Région Europe)</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <h3 className="font-bold text-white text-base">3. Propriété Intellectuelle</h3>
                  <p className="text-xs text-slate-300">
                    L'ensemble des éléments constituant le logiciel Parkeya (algorithmes de tri, code source, interfaces, logos, marques et graphismes) est la propriété exclusive de l'Éditeur. Toute reproduction ou distribution non autorisée est formellement interdite.
                  </p>
                </div>
              </div>
            )}

            {/* 2. CONFIDENTIALITÉ & RGPD */}
            {activeTab === "privacy" && (
              <div className="space-y-6 animate-in fade-in">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white">Politique de Confidentialité & RGPD</h1>
                  <p className="text-xs text-slate-400 mt-1">Dernière mise à jour : 2026 • Respect strict du Règlement Général sur la Protection des Données (UE 2016/679).</p>
                </div>

                <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-200 text-xs">
                  <strong>Principe Fondamental :</strong> Parkeya fournit une solution logicielle à destination des professionnels du stationnement. Les données personnelles saisies dans l'application par les clients sont strictement confidentielles et ne font l'objet d'aucune vente ou exploitation commerciale tierce.
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-white text-base">1. Rôles et Responsabilités dans le Traitement des Données</h3>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <p>
                      <strong>A. Le Client (L'exploitant du parking) :</strong> Agit en qualité de <strong>Responsable du Traitement (Data Controller)</strong> pour toutes les données de ses clients finaux (plaques d'immatriculation, numéros de vol, dates, téléphones clients).
                    </p>
                    <p>
                      <strong>B. Parkeya :</strong> Agit en qualité de <strong>Sous-Traitant Technique (Data Processor)</strong> au sens de l'Article 28 du RGPD, hébergeant les données uniquement pour permettre le fonctionnement des fonctionnalités opérationnelles de tri et de gestion.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-white text-base">2. Données Collectées & Finalités</h3>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li>• <strong>Comptes Utilisateurs (Employés) :</strong> Nom, Prénom, Email pro, Rôle RBAC (Finalité : Authentification sécurisée et attribution des droits).</li>
                    <li>• <strong>Véhicules & Stationnement :</strong> Immatriculation, modèle, date et heure d'arrivée/départ (Finalité : Calcul de l'algorithme d'ordonnancement et optimisation des sorties).</li>
                    <li>• <strong>Journal d'Audit :</strong> Horodatage des manœuvres et actions des collaborateurs (Finalité : Traçabilité et sécurité opérationnelle interne).</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-white text-base">3. Durée de Conservation & Exercice des Droits</h3>
                  <p className="text-xs text-slate-300">
                    Les données sont conservées pendant toute la durée active de l'abonnement du Client. Conformément au RGPD, chaque utilisateur dispose d'un droit d'accès, de rectification, de portabilité et de suppression de ses données sur simple demande à <strong>contact@parkeya.com</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* 3. DPA (DATA PROCESSING AGREEMENT) */}
            {activeTab === "dpa" && (
              <div className="space-y-6 animate-in fade-in">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white">Accord de Traitement des Données (DPA)</h1>
                  <p className="text-xs text-slate-400 mt-1">Conformément à l'Article 28 du Règlement Général sur la Protection des Données (RGPD).</p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-200 text-xs">
                  <strong>Clause de Non-Responsabilité sur les Données Métier :</strong> L'exploitant du parking assume l'entière responsabilité de la légitimité de la collecte des données de ses propres clients (plaques d'immatriculation, informations clients). Parkeya n'effectue aucun traitement de ces données en dehors des instructions et requêtes logicielles initiées par le Client.
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-white text-base">1. Objet du DPA</h3>
                  <p className="text-xs text-slate-300">
                    Le présent Accord régit le traitement des données à caractère personnel effectué par Parkeya pour le compte du Client dans le cadre de l'utilisation du logiciel de gestion de parkings en mode SaaS.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-white text-base">2. Engagements de Parkeya (Sous-Traitant)</h3>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li>• <strong>Stricte Confidentialité :</strong> Les données du Client sont traitées uniquement selon ses instructions directes.</li>
                    <li>• <strong>Isolation Multi-Tenant :</strong> Chaque organisation cliente dispose d'un espace hermétique inaccessible aux tiers.</li>
                    <li>• <strong>Sécurité & Chiffrement :</strong> Toutes les communications sont protégées par chiffrement HTTPS/TLS et authentification par jetons sécurisés.</li>
                    <li>• <strong>Restitution et Suppression :</strong> À la résiliation du compte, l'ensemble des données de véhicules et d'historique de l'organisation est intégralement effacé.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* 4. CGU / CGV */}
            {activeTab === "cgu-cgv" && (
              <div className="space-y-6 animate-in fade-in">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white">Conditions Générales d'Utilisation & de Vente (B2B)</h1>
                  <p className="text-xs text-slate-400 mt-1">Régissant l'accès et l'abonnement professionnel aux services Parkeya.</p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-white text-base">1. Souscription & Plans SaaS</h3>
                  <p className="text-xs text-slate-300">
                    Les abonnements Parkeya sont souscrits au mois ou à l'année selon les plans *Starter*, *Business* ou *Enterprise*. Chaque plan définit un quota maximal d'utilisateurs et de parkings gérés.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-white text-base">2. Disponibilité & Maintenance</h3>
                  <p className="text-xs text-slate-300">
                    Parkeya met en œuvre tous les moyens raisonnables pour assurer une disponibilité de 99.9% de ses services hébergés. Des opérations de maintenance programmées peuvent être effectuées lors des heures de faible affluence.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-white text-base">3. Résiliation</h3>
                  <p className="text-xs text-slate-300">
                    L'abonnement peut être résilié à tout moment par le Client depuis son espace Paramètres sans frais de résiliation, prenant effet à la fin de la période de facturation en cours.
                  </p>
                </div>
              </div>
            )}

            {/* 5. COOKIES */}
            {activeTab === "cookies" && (
              <div className="space-y-6 animate-in fade-in">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white">Politique de Cookies & Traceurs</h1>
                  <p className="text-xs text-slate-400 mt-1">Transparence totale sur les mécanismes techniques utilisés.</p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs">
                  <strong>Cookies Strictement Nécessaires :</strong> Parkeya utilise exclusivement des cookies et tokens techniques d'authentification et de maintien de session sécurisée. Aucun cookie publicitaire tiers ou traceur invasif n'est installé sans votre consentement.
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-white text-base">Liste des traceurs fonctionnels utilisés</h3>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li>• <strong>Token de Session Firebase Auth :</strong> Maintient l'employé connecté lors de la navigation entre les voies et le dashboard.</li>
                    <li>• <strong>Préférences d'Affichage :</strong> Mémorise le mode de vue (Voies 2D / Planning) et le tri sélectionné.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* 6. SOUS-TRAITANTS */}
            {activeTab === "subprocessors" && (
              <div className="space-y-6 animate-in fade-in">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white">Liste des Sous-Traitants Techniques</h1>
                  <p className="text-xs text-slate-400 mt-1">Conformément aux recommandations de la CNIL et du RGPD.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 font-bold text-white bg-slate-950">
                        <th className="py-3 px-4">Prestataire</th>
                        <th className="py-3 px-4">Rôle / Fonction</th>
                        <th className="py-3 px-4">Localisation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      <tr>
                        <td className="py-3 px-4 font-bold text-cyan-300">Google Cloud / Firebase</td>
                        <td className="py-3 px-4">Authentification, Base de données temps réel Firestore</td>
                        <td className="py-3 px-4">Union Européenne</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-bold text-cyan-300">Hostinger International</td>
                        <td className="py-3 px-4">Hébergement de l'application web & DNS</td>
                        <td className="py-3 px-4">Union Européenne (Chypre / France)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
