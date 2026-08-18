import React, { useState, useEffect } from "react";
import {
  Car,
  Plus,
  FileSpreadsheet,
  Download,
  History,
  Settings,
  Building2,
  Search,
  ChevronDown,
  Clock,
  LayoutGrid,
  Calendar,
  KeyRound,
  LogOut,
  User,
} from "lucide-react";

export default function Navbar({
  parkings,
  activeParking,
  currentUser,
  onSelectParking,
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
  onOpenAddModal,
  onOpenImportModal,
  onExportExcel,
  onOpenHistoryModal,
  onOpenParkingsModal,
  onOpenSettingsModal,
  onOpenJoinParking,
  onOpenAccessCode,
  onLogOut,
}) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Logo & Titre */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-400 p-[1px] shadow-lg shadow-blue-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center text-blue-400">
              <Car size={22} className="animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-white tracking-wide">
                PARK<span className="text-blue-400">OPTIMIZER</span>
              </h1>
              <span className="text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.2 rounded-full uppercase tracking-wider">
                PRO V2
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Gestion de Parc & Attribution Intelligente
            </p>
          </div>
        </div>

        {/* Onglets de Vue (Grille 2D vs Planning Départs) */}
        <div className="flex items-center bg-slate-900 p-1 rounded-2xl border border-slate-800 shadow-inner">
          <button
            onClick={() => setActiveTab("grid")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "grid"
                ? "bg-blue-600 text-white shadow-md shadow-blue-900/50"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <LayoutGrid size={14} />
            <span>Voies (Grille 2D)</span>
          </button>

          <button
            onClick={() => setActiveTab("schedule")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "schedule"
                ? "bg-blue-600 text-white shadow-md shadow-blue-900/50"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Calendar size={14} />
            <span>Planning Départs</span>
          </button>
        </div>

        {/* Sélecteur de Parking Multi-Sites */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={onOpenParkingsModal}
              className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-700/80 text-white text-xs font-bold transition-all shadow-inner group cursor-pointer"
            >
              <Building2 size={14} className="text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="max-w-[130px] sm:max-w-[160px] truncate">{activeParking?.name || "Parc Principal"}</span>
              <span className="text-[10px] font-mono text-amber-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                {activeParking?.code || "PARK-01"}
              </span>
              <ChevronDown size={13} className="text-slate-400" />
            </button>
          </div>

          {/* Horloge en direct */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-300">
            <Clock size={13} className="text-sky-400" />
            <span>
              {currentTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          </div>
        </div>

        {/* Barre de Recherche Globale */}
        <div className="flex-1 max-w-sm min-w-[180px] relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Plaque (ex: AB-123-CD), vol, voie..."
            className="w-full pl-9 pr-4 py-1.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
            >
              ×
            </button>
          )}
        </div>

        {/* Actions Principales */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenAddModal}
            className="px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-900/40 hover:shadow-blue-700/50 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            <span>+ Véhicule</span>
          </button>

          <button
            onClick={onOpenImportModal}
            className="px-3 py-1.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer hover:text-white"
          >
            <FileSpreadsheet size={14} className="text-emerald-400" />
            <span className="hidden sm:inline">Import</span>
          </button>

          <button
            onClick={onExportExcel}
            title="Exporter l'état actuel du parc en Excel"
            className="p-2 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-emerald-300 transition-colors cursor-pointer"
          >
            <Download size={15} />
          </button>

          <button
            onClick={onOpenHistoryModal}
            title="Historique des mouvements"
            className="p-2 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-blue-300 transition-colors cursor-pointer"
          >
            <History size={15} />
          </button>

          <button
            onClick={onOpenSettingsModal}
            title="Paramètres et sauvegardes"
            className="p-2 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <Settings size={15} />
          </button>

          {/* Rejoindre un Parking */}
          <button
            onClick={onOpenJoinParking}
            title="Rejoindre un parking via un code d'accès"
            className="p-2 rounded-2xl bg-blue-600/20 hover:bg-blue-600 border border-blue-500/40 text-blue-300 hover:text-white transition-colors cursor-pointer"
          >
            <KeyRound size={15} />
          </button>

          {/* Code d'Accès du Parking Actif */}
          <button
            onClick={onOpenAccessCode}
            title="Voir et partager le code d'accès de ce parking"
            className="px-2.5 py-1.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-amber-200 transition-colors cursor-pointer text-[10px] font-bold flex items-center gap-1"
          >
            <KeyRound size={12} /> Code
          </button>

          {/* Compte Utilisateur & Déconnexion */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-semibold">
              <User size={13} className="text-blue-400" />
              <span className="max-w-[100px] truncate">{currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Compte'}</span>
            </div>
            <button
              onClick={onLogOut}
              title="Se déconnecter"
              className="p-2 rounded-2xl bg-slate-900 hover:bg-rose-600/20 border border-slate-700 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
