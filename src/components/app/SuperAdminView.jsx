import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Building2,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Shield,
  Crown,
  Search,
  ChevronUp,
  ChevronDown,
  Play,
  Pause,
  CreditCard,
  BarChart3,
  Zap,
  Trash2,
} from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../services/firebase";

const STATUS_CONFIG = {
  ACTIVE:          { label: "Actif",           color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", icon: CheckCircle2 },
  CANCELED:        { label: "Résilié",          color: "text-rose-400",    bg: "bg-rose-500/10 border-rose-500/30",       icon: XCircle },
  PAST_DUE:        { label: "Impayé",           color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/30",     icon: AlertCircle },
  PENDING_PAYMENT: { label: "En attente",       color: "text-slate-400",   bg: "bg-slate-500/10 border-slate-500/30",     icon: Clock },
  UNKNOWN:         { label: "Inconnu",          color: "text-slate-500",   bg: "bg-slate-800 border-slate-700",           icon: AlertCircle },
};

const PLAN_COLORS = {
  starter:    "text-slate-300 bg-slate-800/80 border-slate-700",
  business:   "text-cyan-300 bg-cyan-950/60 border-cyan-500/30",
  pro:        "text-indigo-300 bg-indigo-950/60 border-indigo/30",
  enterprise: "text-amber-300 bg-amber-950/60 border-amber-500/30",
};

function KpiCard({ icon: Icon, label, value, sub, color = "text-cyan-400" }) {
  return (
    <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-start gap-4 shadow-xl">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-slate-800 ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-2xl font-black text-white">{value}</div>
        <div className="text-xs font-bold text-slate-300">{label}</div>
        {sub && <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

export default function SuperAdminView({ currentUser }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [actionLoading, setActionLoading] = useState(null);
  const [claimInitialized, setClaimInitialized] = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fn = httpsCallable(functions, "getSuperAdminStats");
      const result = await fn({});
      setStats(result.data);
    } catch (err) {
      setError(err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialiser le custom claim au premier chargement si pas encore fait
  useEffect(() => {
    const initClaim = async () => {
      try {
        const tokenResult = await currentUser.getIdTokenResult(true);
        if (!tokenResult.claims.superAdmin) {
          const fn = httpsCallable(functions, "initializeSuperAdmin");
          await fn({});
          // Forcer le refresh du token pour que le claim soit actif
          await currentUser.getIdToken(true);
          setClaimInitialized(true);
        }
      } catch (err) {
        console.warn("initializeSuperAdmin:", err.message);
      }
    };
    initClaim();
  }, [currentUser]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const handleOrgAction = async (orgId, action) => {
    setActionLoading(orgId + action);
    try {
      const fn = httpsCallable(functions, "superAdminUpdateOrg");
      const payload = { orgId };
      if (action === "activate")  payload.newStatus = "ACTIVE";
      if (action === "cancel")    payload.newStatus = "CANCELED";
      if (action === "pending")   payload.newStatus = "PENDING_PAYMENT";
      await fn(payload);
      await loadStats();
    } catch (err) {
      alert("Erreur : " + (err.message || "Action échouée"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteOrg = async (orgId, orgName) => {
    const confirmation = window.confirm(
      `⚠️ ATTENTION : Supprimer définitivement l'organisation "${orgName}" ?\n\nCette action va :\n- Supprimer l'organisation de la base de données Firestore\n- Résilier l'abonnement Stripe si actif\n- Détacher les utilisateurs associés`
    );
    if (!confirmation) return;

    setActionLoading(orgId + "delete");
    try {
      const fn = httpsCallable(functions, "superAdminDeleteOrg");
      await fn({ orgId });
      await loadStats();
    } catch (err) {
      alert("Erreur de suppression : " + (err.message || "Échec"));
    } finally {
      setActionLoading(null);
    }
  };

  const filteredOrgs = (stats?.orgs || [])
    .filter(o =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase()) ||
      o.plan.toLowerCase().includes(search.toLowerCase()) ||
      o.status.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let av = a[sortKey] || "";
      let bv = b[sortKey] || "";
      if (sortDir === "asc") return av > bv ? 1 : -1;
      return av < bv ? 1 : -1;
    });

  const SortIcon = ({ k }) => sortKey === k
    ? (sortDir === "asc" ? <ChevronUp size={12} className="text-cyan-400" /> : <ChevronDown size={12} className="text-cyan-400" />)
    : <ChevronDown size={12} className="text-slate-600" />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Crown size={18} className="text-amber-400" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">
              Super Admin — Accès Fondateur
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">Vue Globale</h1>
          <p className="text-xs text-slate-400 mt-1">Tableau de bord privé — visible uniquement par toi.</p>
        </div>
        <button
          onClick={loadStats}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:border-cyan-500/50 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {claimInitialized && (
        <div className="px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2">
          <Zap size={14} />
          Custom Claim Super Admin initialisé ! Reconnecte-toi pour l'activer définitivement.
        </div>
      )}

      {error && (
        <div className="px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* KPIs */}
      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <KpiCard
              icon={TrendingUp}
              label="MRR Estimé"
              value={`${stats.mrr}€`}
              sub="Mensuel récurrent"
              color="text-emerald-400"
            />
            <KpiCard
              icon={Users}
              label="Total Clients"
              value={stats.totalOrgs}
              color="text-cyan-400"
            />
            <KpiCard
              icon={CheckCircle2}
              label="Actifs"
              value={stats.activeOrgs}
              sub={`dont ${stats.trialingOrgs} en essai`}
              color="text-emerald-400"
            />
            <KpiCard
              icon={AlertCircle}
              label="Impayés"
              value={stats.pastDueOrgs}
              color="text-amber-400"
            />
            <KpiCard
              icon={XCircle}
              label="Résiliés"
              value={stats.canceledOrgs}
              color="text-rose-400"
            />
            <KpiCard
              icon={Clock}
              label="En attente"
              value={stats.pendingOrgs}
              sub="Sans abonnement"
              color="text-slate-400"
            />
          </div>

          {/* Barre MRR visuelle */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/30 via-slate-900 to-cyan-950/30 border border-emerald-500/20 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                <BarChart3 size={14} />
                Répartition des abonnements actifs
              </div>
              <span className="text-xs font-mono text-slate-400">{stats.activeOrgs} clients</span>
            </div>
            <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-slate-800">
              {["trialing", "active"].map((s, i) => {
                const count = i === 0 ? stats.trialingOrgs : (stats.activeOrgs - stats.trialingOrgs);
                const pct = stats.activeOrgs > 0 ? (count / stats.activeOrgs) * 100 : 0;
                return pct > 0 ? (
                  <div
                    key={s}
                    className={i === 0 ? "bg-amber-500" : "bg-emerald-500"}
                    style={{ width: `${pct}%` }}
                    title={`${s}: ${count}`}
                  />
                ) : null;
              })}
            </div>
            <div className="flex gap-4 mt-2 text-[10px] text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />En cours</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />En essai</span>
            </div>
          </div>

          {/* Table des organisations */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex-1 relative min-w-48">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, email, plan..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <span className="text-xs text-slate-500">{filteredOrgs.length} résultat(s)</span>
            </div>

            <div className="rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                {[
                  { key: "name", label: "Organisation", span: 3 },
                  { key: "plan", label: "Plan", span: 1 },
                  { key: "status", label: "Statut", span: 2 },
                  { key: "createdAt", label: "Créé le", span: 2 },
                  { key: "updatedAt", label: "MàJ", span: 2 },
                  { key: "_actions", label: "Actions", span: 2 },
                ].map(col => (
                  <div
                    key={col.key}
                    className={`col-span-${col.span} flex items-center gap-1 ${col.key !== "_actions" ? "cursor-pointer hover:text-slate-300" : ""}`}
                    onClick={() => col.key !== "_actions" && handleSort(col.key)}
                  >
                    {col.label}
                    {col.key !== "_actions" && <SortIcon k={col.key} />}
                  </div>
                ))}
              </div>

              {/* Table rows */}
              <div className="divide-y divide-slate-800/60 bg-slate-950">
                {filteredOrgs.length === 0 && (
                  <div className="px-4 py-8 text-center text-xs text-slate-500">Aucune organisation trouvée.</div>
                )}
                {filteredOrgs.map((org) => {
                  const statusCfg = STATUS_CONFIG[org.status] || STATUS_CONFIG.UNKNOWN;
                  const StatusIcon = statusCfg.icon;
                  const isTrialing = org.subscriptionStatus === "trialing";
                  return (
                    <div key={org.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-slate-900/50 transition-colors text-xs">
                      {/* Org name */}
                      <div className="col-span-3">
                        <div className="font-bold text-white truncate">{org.name}</div>
                        <div className="text-slate-500 text-[10px] truncate">{org.email}</div>
                      </div>

                      {/* Plan */}
                      <div className="col-span-1">
                        <span className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold border ${PLAN_COLORS[org.plan] || "text-slate-400 bg-slate-800 border-slate-700"}`}>
                          {org.plan}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="col-span-2 flex items-center gap-1.5">
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${statusCfg.bg} ${statusCfg.color}`}>
                          <StatusIcon size={10} />
                          {statusCfg.label}
                        </span>
                        {isTrialing && (
                          <span className="px-1.5 py-0.5 rounded-lg text-[9px] font-bold border bg-amber-950/40 text-amber-300 border-amber-500/30">
                            Essai
                          </span>
                        )}
                      </div>

                      {/* Created */}
                      <div className="col-span-2 text-slate-400 text-[10px]">
                        {org.createdAt ? new Date(org.createdAt).toLocaleDateString("fr-FR") : "—"}
                      </div>

                      {/* Updated */}
                      <div className="col-span-2 text-slate-400 text-[10px]">
                        {org.updatedAt ? new Date(org.updatedAt).toLocaleDateString("fr-FR") : "—"}
                      </div>

                      {/* Actions */}
                      <div className="col-span-2 flex items-center gap-1.5 flex-wrap">
                        {org.status !== "ACTIVE" && (
                          <button
                            disabled={!!actionLoading}
                            onClick={() => handleOrgAction(org.id, "activate")}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold cursor-pointer disabled:opacity-50 transition-colors"
                            title="Activer"
                          >
                            <Play size={10} />
                            Activer
                          </button>
                        )}
                        {org.status === "ACTIVE" && (
                          <button
                            disabled={!!actionLoading}
                            onClick={() => handleOrgAction(org.id, "pending")}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 border border-slate-600 text-[10px] font-bold cursor-pointer disabled:opacity-50 transition-colors"
                            title="Suspendre"
                          >
                            <Pause size={10} />
                            Suspendre
                          </button>
                        )}
                        {org.stripeCustomerId && (
                          <a
                            href={`https://dashboard.stripe.com/customers/${org.stripeCustomerId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold cursor-pointer transition-colors"
                            title="Voir dans Stripe"
                          >
                            <CreditCard size={10} />
                            Stripe
                          </a>
                        )}
                        <button
                          disabled={!!actionLoading}
                          onClick={() => handleDeleteOrg(org.id, org.name)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold cursor-pointer disabled:opacity-50 transition-colors"
                          title="Supprimer définitivement"
                        >
                          <Trash2 size={10} />
                          Suppr.
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {loading && !stats && (
        <div className="py-24 flex flex-col items-center gap-3 text-slate-500">
          <RefreshCw size={24} className="animate-spin text-cyan-500" />
          <span className="text-xs">Chargement des données...</span>
        </div>
      )}
    </div>
  );
}
