import React, { useState, useEffect } from "react";
import {
  Building2,
  Users,
  CreditCard,
  User,
  Plus,
  Shield,
  Check,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Lock,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  Zap,
  Loader2,
  Edit,
} from "lucide-react";
import { updateOrganization, getOrganizationUsers, checkUserQuota, PLANS_CONFIG } from "../../services/organization";
import { inviteMemberToOrg, updateUserRoleAndStatus, updateUserAccountPassword, saveUserProfile } from "../../services/auth";
import { getLaneName } from "../../services/cloudDb";
import { Layers, Car, ArrowRight, ArrowLeft, ArrowLeftRight, Save } from "lucide-react";

export default function SettingsView({
  organization,
  setOrganization,
  currentUser,
  userProfile,
  parkings = [],
  activeParking = null,
  onUpdateParkingModel = null,
  onUpdateParkingPricing = null,
  onRefreshOrg,
}) {
  const [activeTab, setActiveTab] = useState("team"); // "org" | "team" | "subscription" | "profile" | "parking"

  // Feedback states
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Tab 1: Organisation state
  const [orgName, setOrgName] = useState(organization?.name || "");
  const [orgEmail, setOrgEmail] = useState(organization?.email || "");
  const [orgPhone, setOrgPhone] = useState(organization?.phone || "");
  const [orgAddress, setOrgAddress] = useState(organization?.address || "");

  // Tab 2: Team members
  const [teamMembers, setTeamMembers] = useState([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("VOITURIER");
  const [inviteParkings, setInviteParkings] = useState(["*"]);

  // Tab 4: Profile & Password
  const [profileFirstName, setProfileFirstName] = useState(userProfile?.firstName || "");
  const [profileLastName, setProfileLastName] = useState(userProfile?.lastName || "");
  const [profilePhone, setProfilePhone] = useState(userProfile?.phone || "");
  const [profileJobTitle, setProfileJobTitle] = useState(userProfile?.jobTitle || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPlanOverride, setCurrentPlanOverride] = useState(null);


  const role = userProfile?.role || "OWNER";
  const isOwner = role === "OWNER";

  // Load team members
  useEffect(() => {
    if (organization?.id) {
      loadTeam();
    }
  }, [organization?.id]);



  const loadTeam = async () => {
    if (!organization?.id) return;
    const users = await getOrganizationUsers(organization.id);
    setTeamMembers(users);
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setErrorMsg("");
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  const showError = (msg) => {
    setErrorMsg(msg);
    setSuccessMsg("");
    setTimeout(() => setErrorMsg(""), 4500);
  };

  // 1. Sauvegarder l'Organisation
  const handleSaveOrg = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateOrganization(organization.id, {
        name: orgName.trim(),
        email: orgEmail.trim(),
        phone: orgPhone.trim(),
        address: orgAddress.trim(),
      });
      if (onRefreshOrg) onRefreshOrg();
      showSuccess("Informations de l'entreprise mises à jour !");
    } catch (err) {
      showError(err.message || "Erreur lors de la mise à jour de l'organisation.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Inviter un employé (avec vérification quota du plan)
  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      showError("Veuillez saisir une adresse email valide.");
      return;
    }

    setLoading(true);
    try {
      // Vérifier le quota d'utilisateurs
      const quota = await checkUserQuota(organization.id);
      if (!quota.allowed) {
        showError(quota.reason);
        setLoading(false);
        return;
      }

      await inviteMemberToOrg({
        orgId: organization.id,
        email: inviteEmail.trim(),
        role: inviteRole,
        assignedParkingIds: inviteParkings,
        inviterName: userProfile?.displayName || "L'administrateur",
      });

      setIsInviteModalOpen(false);
      setInviteEmail("");
      showSuccess(`Invitation envoyée avec succès à ${inviteEmail} !`);
      await loadTeam();
    } catch (err) {
      showError(err.message || "Erreur lors de l'envoi de l'invitation.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Modifier le rôle ou le statut d'un employé
  const handleUpdateMemberStatus = async (userId, newStatus) => {
    try {
      await updateUserRoleAndStatus(userId, { status: newStatus });
      showSuccess(`Statut utilisateur mis à jour (${newStatus === "active" ? "Actif" : "Désactivé"})`);
      await loadTeam();
    } catch (err) {
      showError(err.message || "Erreur lors de la mise à jour du statut.");
    }
  };

  const handleUpdateMemberRole = async (userId, newRole) => {
    try {
      await updateUserRoleAndStatus(userId, { role: newRole });
      showSuccess(`Rôle mis à jour (${newRole})`);
      await loadTeam();
    } catch (err) {
      showError(err.message || "Erreur lors du changement de rôle.");
    }
  };

  // 4. Sauvegarder son profil personnel
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await saveUserProfile(currentUser.uid, {
        firstName: profileFirstName.trim(),
        lastName: profileLastName.trim(),
        phone: profilePhone.trim(),
        jobTitle: profileJobTitle.trim(),
      });
      showSuccess("Votre profil a été enregistré !");
    } catch (err) {
      showError(err.message || "Erreur lors de la mise à jour du profil.");
    } finally {
      setLoading(false);
    }
  };

  // 5. Modifier son mot de passe
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showError("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      await updateUserAccountPassword(newPassword);
      setNewPassword("");
      setConfirmPassword("");
      showSuccess("Mot de passe modifié avec succès !");
    } catch (err) {
      showError(err.message || "Erreur lors de la modification du mot de passe.");
    } finally {
      setLoading(false);
    }
  };

  // Calcul du quota actuel
  const currentPlanId = currentPlanOverride || organization?.subscription?.plan || organization?.plan || "business";
  const currentPlan = PLANS_CONFIG[currentPlanId] || PLANS_CONFIG.business;
  const maxUsers = currentPlan.maxUsers;
  const maxParkings = currentPlan.maxParkings;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 mb-1">
            <Building2 size={15} />
            <span>Administration SaaS & Équipe</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Paramètres de l'Organisation
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gérez vos employés, rôles RBAC, informations d'entreprise et abonnement.
          </p>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        {[
          { id: "team", label: "Utilisateurs & Équipe", icon: Users },
          { id: "parking", label: "Modèle du Parking", icon: Layers },
          { id: "org", label: "Organisation", icon: Building2 },
          { id: "subscription", label: "Abonnement & Quotas", icon: CreditCard },
          { id: "profile", label: "Mon Compte", icon: User },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                isActive
                  ? "bg-cyan-600 text-white shadow-lg shadow-cyan-950/60"
                  : "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-850"
              }`}
            >
              <Icon size={15} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ÉQUIPE & RBAC */}
      {activeTab === "team" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-white">
                Collaborateurs ({teamMembers.length}/{maxUsers})
              </h2>
              <p className="text-xs text-slate-400">
                Attribuez les rôles et permissions aux membres de votre entreprise.
              </p>
            </div>

            {isOwner && (
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black shadow-lg shadow-cyan-950/40 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={15} />
                <span>+ Inviter un utilisateur</span>
              </button>
            )}
          </div>

          {/* Members Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-400 bg-slate-950/60">
                    <th className="py-3.5 px-4">Collaborateur</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Rôle</th>
                    <th className="py-3.5 px-4">Statut</th>
                    {isOwner && <th className="py-3.5 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs">
                  {teamMembers.map((m) => {
                    const isSelf = m.uid === currentUser.uid;
                    const isActive = m.status !== "disabled";

                    return (
                      <tr key={m.uid} className="hover:bg-slate-850/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-800 text-cyan-400 font-black text-xs flex items-center justify-center">
                            {(m.displayName || m.firstName || "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div>{m.displayName || `${m.firstName || ""} ${m.lastName || ""}`.trim() || "Employé"}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{m.jobTitle || "Voiturier"}</div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                          {m.email}
                        </td>

                        <td className="py-3.5 px-4">
                          {isOwner && !isSelf ? (
                            <select
                              value={m.role || "VOITURIER"}
                              onChange={(e) => handleUpdateMemberRole(m.uid, e.target.value)}
                              className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-700 text-cyan-300 text-xs font-bold focus:outline-none focus:border-cyan-500 cursor-pointer"
                            >
                              <option value="OWNER">Owner (Gérant)</option>
                              <option value="MANAGER">Manager</option>
                              <option value="VOITURIER">Voiturier</option>
                              <option value="VIEWER">Viewer (Lecture)</option>
                            </select>
                          ) : (
                            <span className="font-bold text-xs bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-xl text-amber-300">
                              {m.role || "OWNER"}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isActive
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                            }`}
                          >
                            {isActive ? "Actif" : "Désactivé"}
                          </span>
                        </td>

                        {isOwner && (
                          <td className="py-3.5 px-4 text-right">
                            {!isSelf && (
                              <button
                                onClick={() => handleUpdateMemberStatus(m.uid, isActive ? "disabled" : "active")}
                                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                                  isActive
                                    ? "bg-rose-500/10 hover:bg-rose-600 text-rose-300 hover:text-white"
                                    : "bg-emerald-500/10 hover:bg-emerald-600 text-emerald-300 hover:text-white"
                                }`}
                              >
                                {isActive ? "Désactiver" : "Réactiver"}
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB PARKING : MODÈLE PHYSIQUE */}
      {activeTab === "parking" && (
        <div className="space-y-6 max-w-3xl">
          <div>
            <h2 className="text-lg font-black text-white">Modèle Physique du Parking Actif</h2>
            <p className="text-xs text-slate-400 mt-1">
              Définit la logique d'entrée / sortie des véhicules pour <span className="text-cyan-300 font-bold">{activeParking?.name || "votre parking actif"}</span>. Chaque parking peut avoir son propre modèle.
            </p>
          </div>

          {!activeParking ? (
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-sm">
              Aucun parking actif sélectionné. Ouvrez un parking depuis la liste pour modifier son modèle.
            </div>
          ) : (
            <div className="space-y-4">
              {[
                {
                  id: "lifo",
                  label: "Enfilade — LIFO",
                  subtitle: "Cul-de-sac / 1 seule issue",
                  badge: "DÉFAUT",
                  badgeColor: "bg-cyan-600",
                  description: "Une seule ouverture : les véhicules entrent et sortent par la tête de voie. La dernière voiture entrée est la première à sortir.",
                  renderDiagram: () => (
                    <div className="bg-slate-950/80 rounded-2xl p-4 mb-3 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-bold text-xs">
                        <span className="flex items-center gap-1.5">🚪 Entrée & Sortie Unique (Tête de voie)</span>
                        <span className="text-[10px] text-cyan-400 font-mono">Index 0</span>
                      </div>
                      
                      <div className="flex flex-col gap-1.5 pl-4 border-l-2 border-dashed border-cyan-500/40 my-2">
                        <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs">
                          <span className="text-emerald-300 font-bold">🚗 Voiture 3 (Dernière entrée)</span>
                          <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Sortie Directe</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
                          <span>🚗 Voiture 2</span>
                          <span className="text-[10px] text-slate-400">1 déplacement si sortie</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-between text-xs">
                          <span className="text-rose-300 font-bold">🚗 Voiture 1 (1ère entrée)</span>
                          <span className="text-[10px] font-bold bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full">Bloquée au fond</span>
                        </div>
                      </div>

                      <div className="text-center py-1 rounded-lg bg-slate-900/60 text-[10px] text-slate-400 font-bold border border-slate-800">
                        🧱 Fond de voie fermé (Mur / Fin d'allée)
                      </div>
                    </div>
                  ),
                  pros: ["Idéal pour parkings en sous-sol, impasses et allées étroites", "Remplissage automatique optimisé"],
                  cons: ["Nécessite de déplacer les voitures devant pour sortir celles du fond"],
                },
                {
                  id: "fifo",
                  label: "Drive-Through — FIFO",
                  subtitle: "Couloir traversant / 2 ouvertures",
                  badge: null,
                  badgeColor: "",
                  description: "Deux ouvertures opposées : les véhicules entrent par l'arrière et sortent par l'avant. À chaque départ en tête, des manœuvres d'avancée de file sont effectuées pour rapprocher les véhicules suivants de la sortie et libérer la place d'entrée.",
                  renderDiagram: () => (
                    <div className="bg-slate-950/80 rounded-2xl p-4 mb-3 border border-slate-800 space-y-3">
                      {/* Flow Diagram */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                        <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-center text-xs text-emerald-300 font-bold">
                          <div className="text-[10px] text-emerald-400 font-semibold mb-0.5">Point d'accès 1</div>
                          🚗 ENTRÉE
                        </div>
                        <div className="flex items-center justify-center text-cyan-400 font-bold text-xs gap-1">
                          <span>Flux direct</span>
                          <span>➔ ➔ ➔</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-center text-xs text-cyan-300 font-bold">
                          <div className="text-[10px] text-cyan-400 font-semibold mb-0.5">Point d'accès 2</div>
                          🏁 SORTIE DIRECTE
                        </div>
                      </div>

                      {/* Lane Visualization */}
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 overflow-x-auto text-xs">
                        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 text-center shrink-0">
                          <div className="font-bold text-slate-300">Voiture 3</div>
                          <div className="text-[9px] text-slate-400">Dernière entrée</div>
                        </div>
                        <div className="text-cyan-400 font-bold">➔</div>
                        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-center shrink-0">
                          <div className="font-bold">Voiture 2</div>
                          <div className="text-[9px] text-slate-400">Avance d'un cran</div>
                        </div>
                        <div className="text-cyan-400 font-bold">➔</div>
                        <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-center shrink-0">
                          <div className="font-bold">Voiture 1</div>
                          <div className="text-[9px] text-cyan-400 font-bold">Sortie immédiate</div>
                        </div>
                      </div>

                      {/* Manœuvres d'avancée */}
                      <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-center gap-2 text-xs text-cyan-200">
                        <span className="font-bold text-cyan-400">⚡ Manœuvre :</span>
                        <span>Dès que la Voiture 1 sort, les voitures 2 et 3 avancent vers la sortie pour fluidifier les prochains départs.</span>
                      </div>
                    </div>
                  ),
                  pros: ["Sortie immédiate sans demi-tour pour le véhicule en tête", "Sens de circulation continu et clair"],
                  cons: ["Nécessite de faire avancer la file de véhicules d'un cran vers l'avant à chaque rotation", "Nécessite deux voies d'accès physiques indépendantes"],
                },
                {
                  id: "bidir",
                  label: "Bidirectionnel",
                  subtitle: "Double accès / Sortie Porte A & B",
                  badge: null,
                  badgeColor: "",
                  description: "Deux ouvertures sur la même voie (Porte A et Porte B). L'algorithme calcule quel côté nécessite le moins de manœuvres de dégagement pour extraire le véhicule demandé.",
                  renderDiagram: () => (
                    <div className="bg-slate-950/80 rounded-2xl p-4 mb-3 border border-slate-800 space-y-3">
                      {/* Porte A <-> Cars <-> Porte B */}
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="p-2 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 font-bold text-center flex-1">
                          🚪 PORTE A
                          <div className="text-[9px] text-indigo-400 font-normal">Issue Avant</div>
                        </div>
                        <div className="text-purple-400 font-bold">⇄</div>
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-center flex-1">
                          🚗 Voie Centrale
                          <div className="text-[9px] text-slate-400 font-normal">Véhicules stationnés</div>
                        </div>
                        <div className="text-purple-400 font-bold">⇄</div>
                        <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-300 font-bold text-center flex-1">
                          🚪 PORTE B
                          <div className="text-[9px] text-purple-400 font-normal">Issue Arrière</div>
                        </div>
                      </div>

                      {/* Smart routing explanation */}
                      <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex items-center gap-2 text-xs text-indigo-200">
                        <ArrowLeftRight size={16} className="text-indigo-400 shrink-0" />
                        <span>Manœuvres de dégagement ciblées : sortie par Porte A ou B selon le côté ayant le moins de véhicules à déplacer.</span>
                      </div>
                    </div>
                  ),
                  pros: ["Flexibilité maximale : divise par 2 les manœuvres par rapport au LIFO", "Choix dynamique de l'issue d'évacuation la plus rapide"],
                  cons: ["Manœuvres de déplacement temporaire requises si le véhicule se trouve au milieu de la voie"],
                },
              ].map((model) => {
                const isSelected = (activeParking.model || "lifo") === model.id;
                return (
                  <div
                    key={model.id}
                    className={`p-5 rounded-3xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-cyan-950/40 border-cyan-500 ring-2 ring-cyan-500/30 shadow-xl shadow-cyan-950/40"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                    }`}
                    onClick={() => {
                      if (onUpdateParkingModel && !isSelected) {
                        onUpdateParkingModel(activeParking.id, model.id);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-sm font-black text-white">{model.label}</h3>
                          <span className="text-[10px] text-slate-400">{model.subtitle}</span>
                          {model.badge && (
                            <span className={`text-[9px] ${model.badgeColor} text-white px-1.5 py-0.5 rounded-full font-black`}>{model.badge}</span>
                          )}
                          {isSelected && (
                            <span className="text-[9px] bg-cyan-500 text-white px-1.5 py-0.5 rounded-full font-black">ACTIF</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 mb-3">{model.description}</p>

                        {/* Schéma visuel graphique */}
                        {model.renderDiagram()}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <div className="text-emerald-400 font-bold mb-1">✅ Avantages</div>
                            {model.pros.map((p, i) => <div key={i} className="text-slate-300">• {p}</div>)}
                          </div>
                          <div>
                            <div className="text-rose-400 font-bold mb-1">⚠️ Contraintes</div>
                            {model.cons.map((c, i) => <div key={i} className="text-slate-300">• {c}</div>)}
                          </div>
                        </div>
                      </div>

                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                        isSelected ? "bg-cyan-500 border-cyan-400" : "bg-slate-800 border-slate-700"
                      }`}>
                        {isSelected ? <Check size={16} className="text-white" /> : <span className="text-slate-500 text-xs">○</span>}
                      </div>
                    </div>

                    {isSelected && onUpdateParkingModel && (
                      <div className="mt-3 pt-3 border-t border-cyan-500/20 text-[11px] text-cyan-300 font-semibold">
                        ✅ Modèle actif pour "{activeParking.name}". Cliquez sur une autre carte pour changer immédiatement.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}


      {/* TAB 2: ORGANISATION */}
      {activeTab === "org" && (
        <form onSubmit={handleSaveOrg} className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 max-w-2xl space-y-4 shadow-xl">
          <div>
            <h2 className="text-lg font-black text-white">Profil de l'Entreprise</h2>
            <p className="text-xs text-slate-400">Coordonnées officielles de votre structure</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Nom de la société</label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Email officiel</label>
              <input
                type="email"
                value={orgEmail}
                onChange={(e) => setOrgEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Téléphone</label>
              <input
                type="tel"
                value={orgPhone}
                onChange={(e) => setOrgPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Adresse du siège</label>
            <input
              type="text"
              value={orgAddress}
              onChange={(e) => setOrgAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
            />
          </div>

          {isOwner && (
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/40 transition-all cursor-pointer flex items-center gap-2"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                <span>Sauvegarder les modifications</span>
              </button>
            </div>
          )}
        </form>
      )}

      {/* TAB 3: ABONNEMENT & QUOTAS */}
      {activeTab === "subscription" && (
        <div className="space-y-6 max-w-4xl">
          {/* Plan Actuel */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold mb-1">
                Abonnement Actuel
              </div>
              <h2 className="text-2xl font-black text-white">Plan {currentPlan.name}</h2>
              <p className="text-xs text-slate-300 mt-1">
                Statut : <span className="text-emerald-400 font-bold">Actif</span> • {currentPlan.priceMonthly}€ HT / mois
              </p>
            </div>

            <div className="px-4 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400">Renouvellement</div>
              <div className="text-xs font-bold text-white">Dans 30 jours</div>
            </div>
          </div>

          {/* Jauges d'utilisation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Utilisateurs */}
            <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>Employés / Utilisateurs</span>
                <span className="font-mono text-cyan-400">
                  {teamMembers.length} / {maxUsers}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full"
                  style={{ width: `${Math.min(100, (teamMembers.length / maxUsers) * 100)}%` }}
                />
              </div>
            </div>

            {/* Parkings */}
            <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>Parkings Autorisés</span>
                <span className="font-mono text-emerald-400">
                  {parkings.length} / {maxParkings}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${Math.min(100, (parkings.length / maxParkings) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Grille de mise à niveau des offres */}
          {isOwner && (
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-black text-white">Faire évoluer votre formule</h3>
                  <p className="text-xs text-slate-400">Passez au niveau supérieur pour augmenter vos quotas de parkings et de véhicules.</p>
                </div>
                {(currentUser?.email === "bouaklirayan@gmail.com" || userProfile?.role === "SUPERADMIN") && (
                  <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold flex items-center gap-1.5 shadow-lg shadow-amber-950/30">
                    <Sparkles size={12} className="text-amber-400" />
                    <span>Mode Fondateur (Bypass Test Actif)</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.values(PLANS_CONFIG).map((p) => {
                  const isCurrent = currentPlanId === p.id;
                  const isMasterAdmin = currentUser?.email === "bouaklirayan@gmail.com" || userProfile?.role === "SUPERADMIN";

                  return (
                    <div
                      key={p.id}
                      className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                        isCurrent
                          ? "bg-cyan-950/60 border-cyan-400 ring-2 ring-cyan-500/40"
                          : "bg-slate-950 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-white text-xs">{p.name}</span>
                          {isCurrent && (
                            <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-900 text-cyan-300 font-bold">
                              Actif
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-black text-white">
                          {p.priceMonthly ? `${p.priceMonthly}€/m` : "Sur devis"}
                        </div>
                        <div className="text-[11px] text-slate-400 space-y-1 pt-2 border-t border-slate-850">
                          <div>🅿️ {p.maxParkings > 50 ? "Illimités" : `${p.maxParkings} parking${p.maxParkings > 1 ? "s" : ""}`}</div>
                          <div>🚗 {p.maxVehicles > 5000 ? "Sur mesure" : `${p.maxVehicles} véh.`}</div>
                          <div>👥 {p.maxUsers > 50 ? "Sur mesure" : `${p.maxUsers} users`}</div>
                        </div>
                      </div>

                      {!isCurrent && (
                        <button
                          type="button"
                          disabled={loading}
                          onClick={async () => {
                            try {
                              setLoading(true);
                              let currentOrgId = organization?.id;

                              if (!currentOrgId) {
                                const { createOrganization } = await import("../../services/organization");
                                const newOrg = await createOrganization({
                                  name: userProfile?.displayName ? `Entreprise ${userProfile.displayName}` : "Mon Entreprise",
                                  email: currentUser?.email || "contact@monparking.fr",
                                  ownerId: currentUser?.uid,
                                  plan: p.id,
                                  status: isMasterAdmin ? "ACTIVE" : "PENDING_PAYMENT",
                                });
                                currentOrgId = newOrg.id;
                                setOrganization(newOrg);
                              }

                              if (isMasterAdmin) {
                                setCurrentPlanOverride(p.id);
                                const updatedSubscription = {
                                  plan: p.id,
                                  status: "active",
                                  maxUsers: p.maxUsers,
                                  maxParkings: p.maxParkings,
                                  maxVehicles: p.maxVehicles,
                                };
                                await updateOrganization(currentOrgId, {
                                  plan: p.id,
                                  subscription: updatedSubscription,
                                });
                                setOrganization(prev => ({
                                  ...prev,
                                  plan: p.id,
                                  subscription: updatedSubscription,
                                }));
                                if (onRefreshOrg) onRefreshOrg();
                                showSuccess(`[DEV] Formule basculée vers ${p.name} !`);
                              } else {
                                const { httpsCallable } = await import("firebase/functions");
                                const { functions } = await import("../../services/firebase");
                                const createCheckout = httpsCallable(functions, "createStripeCheckout");
                                const { data } = await createCheckout({
                                  planId: p.id,
                                  orgId: currentOrgId,
                                  billingCycle: "monthly",
                                  origin: window.location.origin,
                                });
                                if (data && data.url) {
                                  window.location.href = data.url;
                                } else {
                                  showError("Impossible de créer la session Stripe.");
                                }
                              }
                            } catch (err) {
                              showError(err.message || "Erreur de changement d'offre.");
                            } finally {
                              setLoading(false);
                            }
                          }}
                          className={`mt-4 w-full py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-inner ${
                            isMasterAdmin 
                              ? "bg-amber-600/80 hover:bg-amber-500 text-white" 
                              : "bg-slate-800 hover:bg-cyan-600 text-white"
                          }`}
                        >
                          {isMasterAdmin ? `Basculer vers ${p.name} (Dev)` : `Mettre à niveau vers ${p.name}`}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Zone de Danger (Résiliation) */}
          {isOwner && (
            <div className="mt-8 p-6 rounded-3xl border border-rose-500/30 bg-rose-950/10 space-y-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-rose-400 flex items-center gap-2">
                  <AlertCircle size={16} />
                  Zone de Danger
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  La résiliation entraîne la perte immédiate de l'accès à ParkOptimizer pour vous et votre équipe.
                </p>
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  if (window.confirm("Êtes-vous sûr de vouloir résilier votre abonnement ? Cette action coupe l'accès immédiatement.")) {
                    try {
                      setLoading(true);
                      const { httpsCallable } = await import("firebase/functions");
                      const { functions } = await import("../../services/firebase");
                      const cancelSub = httpsCallable(functions, "cancelStripeSubscription");
                      await cancelSub({ orgId: organization.id });
                      
                      // Forcer le rafraichissement local pour retomber sur le mur de paiement
                      window.location.reload();
                    } catch (err) {
                      showError(err.message || "Erreur lors de la résiliation.");
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
                className="shrink-0 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                Résilier l'abonnement
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MON PROFIL */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
          {/* Informations Personnelles */}
          <form onSubmit={handleSaveProfile} className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
            <h3 className="text-base font-black text-white">Mes Informations</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Prénom</label>
                <input
                  type="text"
                  value={profileFirstName}
                  onChange={(e) => setProfileFirstName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nom</label>
                <input
                  type="text"
                  value={profileLastName}
                  onChange={(e) => setProfileLastName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Téléphone</label>
              <input
                type="tel"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Poste / Titre</label>
              <input
                type="text"
                value={profileJobTitle}
                onChange={(e) => setProfileJobTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Enregistrer mon profil
            </button>
          </form>

          {/* Modification de Mot de passe */}
          <form onSubmit={handleChangePassword} className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
            <h3 className="text-base font-black text-white">Changer de Mot de Passe</h3>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Nouveau mot de passe</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="6 caractères minimum"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Confirmer le mot de passe</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Répétez le mot de passe"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Mettre à jour le mot de passe
            </button>
          </form>
        </div>
      )}

      {/* Modal Inviter un Utilisateur */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-base font-black text-white mb-1">Inviter un nouveau collaborateur</h3>
            <p className="text-xs text-slate-400 mb-4">
              L'utilisateur recevra un accès pour rejoindre votre organisation.
            </p>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Email du collaborateur *</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="voiturier@monparking.fr"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Rôle et Permissions *</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="VOITURIER">Voiturier (Recherche, Déplacements, Sorties)</option>
                  <option value="MANAGER">Manager (Gestion des véhicules et des parcs)</option>
                  <option value="VIEWER">Viewer (Consultation seule / Lecture)</option>
                  <option value="OWNER">Owner (Administrateur / Co-gérant)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/40 flex items-center gap-1.5 cursor-pointer"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                  <span>Envoyer l'invitation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
