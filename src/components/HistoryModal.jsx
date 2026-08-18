import React, { useState } from "react";
import { X, History, Search, Download, Trash2, ArrowRight, LogOut, Plus, RefreshCw } from "lucide-react";
import { fmtDateTime } from "../services/algorithm";
import * as XLSX from "xlsx";

export default function HistoryModal({ isOpen, onClose, history, onClearHistory, parkingName }) {
  if (!isOpen) return null;

  const [search, setSearch] = useState("");

  const filteredHistory = (history || []).filter((item) => {
    const q = search.toLowerCase();
    const typeStr = item.type?.toLowerCase() || "";
    const detailStr = JSON.stringify(item.details || {}).toLowerCase();
    return typeStr.includes(q) || detailStr.includes(q);
  });

  const handleExportHistory = () => {
    const data = filteredHistory.map((item) => ({
      Date: fmtDateTime(item.timestamp),
      Type: item.type,
      Plaque: item.details?.plate || item.details?.vehicle?.plate || "—",
      Modèle: item.details?.model || item.details?.vehicle?.model || "—",
      Voie: item.details?.lane !== undefined ? `Voie ${item.details.lane + 1}` : "—",
      Détails: JSON.stringify(item.details || {}),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Historique");
    XLSX.writeFile(wb, `Historique_${parkingName || "Parc"}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const getLogIcon = (type) => {
    switch (type) {
      case "ENTRY":
        return <Plus size={14} className="text-emerald-400" />;
      case "EXIT":
        return <LogOut size={14} className="text-rose-400" />;
      case "MOVE":
        return <ArrowRight size={14} className="text-cyan-400" />;
      case "REDISTRIBUTE":
      case "IMPORT":
        return <RefreshCw size={14} className="text-purple-400" />;
      default:
        return <History size={14} className="text-slate-400" />;
    }
  };

  const getLogLabel = (type) => {
    switch (type) {
      case "ENTRY":
        return "Entrée / Dépôt";
      case "EXIT":
        return "Sortie / Délogé";
      case "MOVE":
        return "Déplacement";
      case "REDISTRIBUTE":
        return "Répartition globale";
      case "IMPORT":
        return "Import Excel";
      case "RESET":
        return "Réinitialisation";
      default:
        return type;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full p-6 shadow-2xl overflow-hidden relative max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <History size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Historique des Opérations & Mouvements</h2>
              <p className="text-xs text-slate-400">
                Traçabilité complète des entrées, sorties et déplacements de véhicules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par plaque, action, voie..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportHistory}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download size={13} /> Exporter Excel
            </button>
            <button
              type="button"
              onClick={onClearHistory}
              className="px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 size={13} /> Effacer
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <History size={36} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">Aucun événement enregistré</p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-slate-950 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                    {getLogIcon(item.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{getLogLabel(item.type)}</span>
                      {item.details?.plate && (
                        <span className="font-mono font-bold text-amber-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                          {item.details.plate}
                        </span>
                      )}
                      {item.details?.model && (
                        <span className="text-slate-400">({item.details.model})</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {item.details?.message ||
                        (item.details?.targetLane !== undefined
                          ? `Affecté à la Voie ${item.details.targetLane + 1}`
                          : "") ||
                        JSON.stringify(item.details || {})}
                    </div>
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-500 whitespace-nowrap">
                  {fmtDateTime(item.timestamp)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
