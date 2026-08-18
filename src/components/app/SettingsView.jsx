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

export default function SettingsView({
  organization,
  setOrganization,
  currentUser,
  userProfile,
  parkings = [],
  onRefreshOrg,
}) {
  const [activeTab, setActiveTab] = useState("team"); // "org" | "team" | "subscription" | "profile"

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
  const currentPlanId = organization?.subscription?.plan || "business";
  const currentPlan = PLANS_CONFIG[currentPlanId] || PLANS_CONFIG.business;
  const maxUsers = organization?.subscription?.maxUsers || currentPlan.maxUsers;
  const maxParkings = organization?.subscription?.maxParkings || currentPlan.maxParkings;

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
