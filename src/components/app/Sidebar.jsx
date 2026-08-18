import React, { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Car,
  Calendar,
  Zap,
  Sliders,
  History,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  User,
  Shield,
  Layers,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react";
import ParkflowLogo from "../ParkflowLogo";

export default function Sidebar({
  activeView,
  setActiveView,
  organization,
  currentUser,
  userProfile,
  parkings = [],
  activeParking,
  onSelectParking,
  onOpenParkingsModal,
  onLogOut,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const role = userProfile?.role || "OWNER"; // "OWNER" | "MANAGER" | "VOITURIER" | "VIEWER"

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["OWNER", "MANAGER", "VIEWER"] },
    { id: "parkings", label: "Parkings", icon: Building2, roles: ["OWNER", "MANAGER", "VOITURIER", "VIEWER"] },
    { id: "vehicles", label: "Véhicules", icon: Car, roles: ["OWNER", "MANAGER", "VOITURIER", "VIEWER"] },
    { id: "schedule", label: "Arrivées / Départs", icon: Calendar, roles: ["OWNER", "MANAGER", "VOITURIER", "VIEWER"] },
    { id: "retrieval", label: "Récupération Optimisée", icon: Zap, roles: ["OWNER", "MANAGER", "VOITURIER", "VIEWER"], badge: "Smart" },
    { id: "placement", label: "Optimisation Voies", icon: Sliders, roles: ["OWNER", "MANAGER", "VOITURIER"] },
    { id: "history", label: "Journal d'Activité", icon: History, roles: ["OWNER", "MANAGER", "VIEWER"] },
    { id: "analytics", label: "Statistiques", icon: BarChart3, roles: ["OWNER", "MANAGER", "VIEWER"] },
    { id: "settings", label: "Paramètres", icon: Settings, roles: ["OWNER", "MANAGER"] },
  ];

  const allowedNav = navItems.filter((item) => item.roles.includes(role));

  const roleBadgeStyles = {
    OWNER: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    MANAGER: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    VOITURIER: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    VIEWER: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  };

  const displayName = userProfile?.displayName || currentUser?.displayName || currentUser?.email?.split("@")[0] || "Utilisateur";

  const renderNavContent = () => (
    <div className="flex flex-col h-full justify-between p-3">
      {/* Top: Logo & Org */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2 pt-1 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <ParkflowLogo size={30} />
            {!isCollapsed && (
              <div className="truncate">
                <div className="text-sm font-black text-white tracking-tight flex items-center">
                  Park<span className="text-cyan-400">eya</span>
                </div>
                <div className="text-[10px] text-slate-400 font-semibold truncate max-w-[140px]">
                  {organization?.name || "Mon Entreprise"}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={isCollapsed ? "Agrandir le menu" : "Réduire le menu"}
          >
            <ChevronLeft size={16} className={`transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Sélecteur de Parking Rapide */}
        {!isCollapsed ? (
          <div className="px-1">
            <button
              onClick={onOpenParkingsModal}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-left transition-all cursor-pointer group shadow-inner"
            >
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-7 h-7 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
                  <Building2 size={14} />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-white truncate">
                    {activeParking?.name || "Parc Principal"}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {activeParking?.laneCount || 30} voies • {activeParking?.capacity || 10} pl/voie
                  </div>
                </div>
              </div>
              <ChevronDown size={14} className="text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={onOpenParkingsModal}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 hover:bg-slate-800 transition-colors cursor-pointer"
              title={activeParking?.name || "Changer de parking"}
            >
              <Building2 size={18} />
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="space-y-1 pt-1">
          {allowedNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setIsMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-cyan-600 text-white shadow-lg shadow-cyan-950/60 font-black"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-850"
                } ${isCollapsed ? "justify-center px-2" : ""}`}
                title={item.label}
              >
                <Icon size={17} className={`shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between truncate">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Profile & Logout */}
      <div className="pt-3 border-t border-slate-800/80 space-y-2">
        <div className={`flex items-center gap-2.5 p-2 rounded-2xl bg-slate-900/60 border border-slate-800 ${isCollapsed ? "justify-center p-1.5" : ""}`}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-white text-xs font-black shrink-0 shadow-md">
            {displayName.charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="flex-1 truncate">
              <div className="text-xs font-bold text-white truncate">{displayName}</div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`text-[9px] uppercase font-mono font-bold px-1.5 py-0.2 rounded-full border ${roleBadgeStyles[role] || roleBadgeStyles.VOITURIER}`}>
                  {role}
                </span>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onLogOut}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer ${isCollapsed ? "justify-center px-2" : ""}`}
          title="Se déconnecter"
        >
          <LogOut size={16} className="shrink-0" />
          {!isCollapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="md:hidden fixed top-3 left-3 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white shadow-xl backdrop-blur-md cursor-pointer"
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)}>
          <aside
            className="w-72 h-full bg-slate-950 border-r border-slate-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {renderNavContent()}
          </aside>
        </div>
      )}

      {/* Desktop Sticky Sidebar */}
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 bg-slate-950/95 border-r border-slate-800/80 shadow-2xl backdrop-blur-xl transition-all duration-300 z-30 shrink-0 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {renderNavContent()}
      </aside>
    </>
  );
}
