import React, { useState, useEffect, useRef } from "react";
import {
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
  Users,
  X,
  Sliders,
  Plus,
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
  onOpenProfileModal,
  onOpenCollaboratorsModal,
  onLogOut,
}) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fermer le menu lors d'un clic en dehors
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = currentUser?.displayName || currentUser?.email?.split("@")[0] || "Mon Compte";
  const teamCount = (activeParking?.authorizedUsers || []).length || 1;

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

        {/* Actions & Menu Unifié */}
        <div className="flex items-center gap-2">
          {/* Bouton + Véhicule */}
          <button
            onClick={onOpenAddModal}
            className="px-3.5 py-2 rounded-full bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white text-xs font-black shadow-lg shadow-cyan-900/40 hover:shadow-cyan-700/60 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105"
            title="Ajouter / Déposer un véhicule"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">+ Véhicule</span>
          </button>

          {/* Menu Déroulant Centralisé (Paramètres & Outils) */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-bold transition-all cursor-pointer shadow-inner ${
                isMenuOpen
                  ? "bg-cyan-600 border-cyan-400 text-white shadow-lg shadow-cyan-900/50"
                  : "bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 text-slate-200 hover:text-white"
              }`}
              title="Menu des outils et paramètres du parking"
            >
              <Settings size={16} className={`transition-transform duration-300 ${isMenuOpen ? "rotate-90 text-white" : "text-cyan-400"}`} />
              <span className="hidden sm:inline">Options</span>
              <ChevronDown size={13} className={`text-slate-400 transition-transform ${isMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Menu Popover */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900/95 border border-slate-700/90 rounded-2xl p-1.5 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Outils & Paramètres
                  </div>
                  <div className="text-xs font-bold text-white truncate">
                    {activeParking?.name || "Parking Actuel"}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenSettingsModal();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
                      <Sliders size={13} />
                    </div>
                    <span>Configuration du parking</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenCollaboratorsModal();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                        <Users size={13} />
                      </div>
                      <span>Équipe & Membres</span>
                    </div>
                    <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded-full">
                      {teamCount}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenHistoryModal();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-lg bg-sky-600/20 text-sky-400 flex items-center justify-center">
                      <History size={13} />
                    </div>
                    <span>Historique des mouvements</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenImportModal();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-200 hover:text-emerald-400 hover:bg-slate-800/80 transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                      <FileSpreadsheet size={13} />
                    </div>
                    <span>Importer Excel (.xlsx / .csv)</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onExportExcel();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-200 hover:text-emerald-400 hover:bg-slate-800/80 transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                      <Download size={13} />
                    </div>
                    <span>Exporter l'état du parc</span>
                  </button>

                  <div className="pt-1 mt-1 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenJoinParking();
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-cyan-300 hover:text-cyan-200 hover:bg-cyan-950/40 transition-colors flex items-center gap-2.5 cursor-pointer"
                    >
                      <div className="w-6 h-6 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
                        <KeyRound size={13} />
                      </div>
                      <span>Rejoindre un autre parking</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Compte Utilisateur & Déconnexion */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800/80 ml-1">
            <button
              onClick={onOpenProfileModal}
              title="Gérer mon profil (Nom, Prénom, Téléphone, Titre)"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-cyan-950/60 border border-slate-700/80 hover:border-cyan-500/50 text-[11px] text-slate-200 hover:text-white font-bold transition-all cursor-pointer shadow-inner group"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-[10px] text-white font-black group-hover:scale-105 transition-transform">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="max-w-[90px] sm:max-w-[120px] truncate">{displayName}</span>
            </button>
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


