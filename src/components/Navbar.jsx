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
  X,
} from "lucide-react";

import ParkflowLogo from "./ParkflowLogo";

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
          <div className="hover:scale-105 transition-transform duration-300 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <ParkflowLogo size={36} />
          </div>
          <span className="text-lg font-black text-white tracking-tight flex items-center">
            Park<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 font-extrabold ml-0.5">Flow</span>
          </span>
        </div>

        {/* Onglets de Vue (Grille 2D vs Planning Départs) */}
        <div className="flex items-center bg-slate-900/80 p-1.5 rounded-full border border-slate-800/80 shadow-inner">
          <button
            onClick={() => setActiveTab("grid")}
            className={`px-4 py-1.5 rounded-full text-[11px] font-black transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider ${
              activeTab === "grid"
                ? "bg-cyan-600 text-white shadow-lg shadow-cyan-900/50"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <LayoutGrid size={14} />
            <span>Voies</span>
          </button>

          <button
            onClick={() => setActiveTab("schedule")}
            className={`px-4 py-1.5 rounded-full text-[11px] font-black transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider ${
              activeTab === "schedule"
                ? "bg-cyan-600 text-white shadow-lg shadow-cyan-900/50"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Calendar size={14} />
            <span>Planning</span>
          </button>
        </div>

        {/* Sélecteur de Parking Multi-Sites */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={onOpenParkingsModal}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-white text-[11px] font-black transition-all shadow-inner group cursor-pointer"
            >
              <Building2 size={15} className="text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="max-w-[130px] sm:max-w-[160px] truncate">{activeParking?.name || "Parc Principal"}</span>
              <span className="text-[10px] font-mono text-amber-300 bg-slate-950/80 px-2 py-0.5 rounded-full border border-slate-800 shadow-inner">
                {activeParking?.accessCode || "CODE"}
              </span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
          </div>

          {/* Horloge en direct */}
          <div className="hidden xl:flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900/60 border border-slate-800 text-[11px] font-mono font-bold text-slate-300">
            <Clock size={14} className="text-sky-400" />
            <span>
              {currentTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          </div>
        </div>

        {/* Barre de Recherche Globale */}
        <div className="flex-1 max-w-sm min-w-[180px] relative group">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Plaque, vol, voie..."
            className="w-full pl-10 pr-4 py-2 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all font-semibold"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 text-xs transition-colors"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Actions Principales */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenAddModal}
            className="group relative px-4 py-2 rounded-full bg-gradient-to-r from-cyan-600 via-emerald-600 to-cyan-600 hover:from-cyan-500 hover:via-emerald-500 hover:to-cyan-500 bg-[length:200%_auto] text-white text-xs font-black shadow-lg shadow-cyan-900/40 hover:shadow-cyan-700/60 transition-all flex items-center gap-1.5 cursor-pointer overflow-hidden hover:scale-105"
          >
            <div className="absolute inset-0 w-full h-full bg-white/20 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out"></div>
            <Plus size={16} className="relative z-10" />
            <span className="relative z-10">+ Véhicule</span>
          </button>

          <button
            onClick={onOpenImportModal}
            className="px-3 py-2 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer hover:text-emerald-400 hover:border-emerald-500/30"
          >
            <FileSpreadsheet size={15} />
            <span className="hidden sm:inline">Import</span>
          </button>

          <button
            onClick={onExportExcel}
            title="Exporter l'état actuel du parc en Excel"
            className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-emerald-400 transition-colors cursor-pointer"
          >
            <Download size={15} />
          </button>

          <button
            onClick={onOpenHistoryModal}
            title="Historique des mouvements"
            className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
          >
            <History size={15} />
          </button>

          <button
            onClick={onOpenSettingsModal}
            title="Paramètres et sauvegardes"
            className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <Settings size={15} />
          </button>

          {/* Rejoindre un Parking */}
          <button
            onClick={onOpenJoinParking}
            title="Rejoindre un parking via un code d'accès"
            className="p-2 rounded-full bg-cyan-600/10 hover:bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 transition-colors cursor-pointer"
          >
            <KeyRound size={15} />
          </button>

          {/* Code d'Accès du Parking Actif */}
          <button
            onClick={onOpenAccessCode}
            title="Voir et partager le code d'accès de ce parking"
            className="px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:text-amber-300 transition-all cursor-pointer text-[10px] font-black flex items-center gap-1.5 hover:shadow-[0_0_10px_rgba(245,158,11,0.2)]"
          >
            <KeyRound size={13} /> Code
          </button>

          {/* Compte Utilisateur & Déconnexion */}
          <div className="flex items-center gap-1.5 pl-3 border-l border-slate-800/80 ml-1">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 font-bold">
              <User size={14} className="text-cyan-400" />
              <span className="max-w-[100px] truncate">{currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Compte'}</span>
            </div>
            <button
              onClick={onLogOut}
              title="Se déconnecter"
              className="p-2 rounded-full bg-slate-900/80 hover:bg-rose-500/20 border border-slate-700/80 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
