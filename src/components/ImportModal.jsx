import React, { useState, useRef } from "react";
import { X, Upload, FileSpreadsheet, Sparkles, CheckCircle2, AlertCircle, Layers, RefreshCw } from "lucide-react";
import { parseExcelFile } from "../services/excel";
import { getAlyseSampleVehicles, generateSyntheticVehicles } from "../services/sampleData";

export default function ImportModal({ isOpen, onClose, onImportVehicles }) {
  if (!isOpen) return null;

  const fileInputRef = useRef(null);
  const [parsedData, setParsedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [importMode, setImportMode] = useState("replace"); // 'replace' ou 'append'

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");

    const reader = new FileReader();
    reader.onload = (evt) => {
      const buffer = evt.target?.result;
      const result = parseExcelFile(buffer);
      setLoading(false);
      if (result.success) {
        setParsedData(result);
      } else {
        setError(result.error || "Erreur lors de la lecture du fichier Excel.");
      }
    };
    reader.onerror = () => {
      setLoading(false);
      setError("Impossible de lire le fichier sélectionné.");
    };
    reader.readAsArrayBuffer(file);
  };

  const handleLoadAlyseSample = () => {
    const vehicles = getAlyseSampleVehicles();
    setParsedData({
      success: true,
      vehicles,
      totalRows: vehicles.length,
      skipped: 0,
      headers: ["Plaque", "Arrivée", "Départ", "Modèle"],
      isSample: true,
      sampleName: "Jeu Réel Alyse Parc Auto (38 véhicules réels)",
    });
  };

  const handleLoadSynthetic = (count) => {
    const vehicles = generateSyntheticVehicles(count);
    setParsedData({
      success: true,
      vehicles,
      totalRows: count,
      skipped: 0,
      headers: ["Plaque", "Modèle", "Départ", "Vol"],
      isSample: true,
      sampleName: `Parc de Simulation (${count} véhicules générés)`,
    });
  };

  const handleConfirmImport = () => {
    if (!parsedData || !parsedData.vehicles || parsedData.vehicles.length === 0) return;
    onImportVehicles(parsedData.vehicles, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Importer des Réservations / Véhicules</h2>
              <p className="text-xs text-slate-400">Fichier Excel (.xlsx, .xls), CSV ou jeux de données Alyse</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-5 space-y-5">
          {error && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Zone d'importation de fichier */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-emerald-500 bg-slate-950/60 hover:bg-slate-950/90 rounded-2xl p-6 text-center cursor-pointer transition-all group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-slate-800 group-hover:bg-emerald-600/20 text-slate-400 group-hover:text-emerald-400 flex items-center justify-center mx-auto mb-3 transition-colors">
              <Upload size={24} />
            </div>
            <p className="text-sm font-bold text-slate-200">
              {loading ? "Lecture du fichier en cours..." : "Cliquez ou glissez votre fichier Excel / CSV ici"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Compatible avec les exports Alyse Parc Auto, FlightPark, et tableaux de réservations
            </p>
          </div>

          {/* Raccourcis de jeux de données */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
              <Sparkles size={13} className="text-yellow-400" />
              Ou charger des données prêtes à l'emploi :
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleLoadAlyseSample}
                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/40 text-left transition-all group cursor-pointer"
              >
                <div className="text-xs font-bold text-blue-400 group-hover:text-blue-300">Données Réelles Alyse</div>
                <div className="text-[11px] text-slate-400 mt-0.5">38 véhicules du planning</div>
              </button>

              <button
                type="button"
                onClick={() => handleLoadSynthetic(120)}
                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group cursor-pointer"
              >
                <div className="text-xs font-bold text-emerald-400 group-hover:text-emerald-300">Simulateur Moyen</div>
                <div className="text-[11px] text-slate-400 mt-0.5">120 véhicules étalés sur 30j</div>
              </button>

              <button
                type="button"
                onClick={() => handleLoadSynthetic(280)}
                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/40 text-left transition-all group cursor-pointer"
              >
                <div className="text-xs font-bold text-purple-400 group-hover:text-purple-300">Parc Plein (Stress test)</div>
                <div className="text-[11px] text-slate-400 mt-0.5">280 véhicules sur 30 voies</div>
              </button>
            </div>
          </div>

          {/* Prévisualisation des données lues */}
          {parsedData && (
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  {parsedData.sampleName || "Fichier analysé avec succès"} : {parsedData.vehicles.length} véhicules détectés
                </span>
                {parsedData.skipped > 0 && (
                  <span className="text-[10px] text-amber-400">
                    ({parsedData.skipped} lignes ignorées car sans plaque/date)
                  </span>
                )}
              </div>

              {/* Aperçu du tableau */}
              <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-800/80">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 text-[10px] sticky top-0 uppercase font-semibold">
                    <tr>
                      <th className="p-2">#</th>
                      <th className="p-2">Plaque</th>
                      <th className="p-2">Modèle</th>
                      <th className="p-2">Départ prévu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {parsedData.vehicles.slice(0, 15).map((v, i) => (
                      <tr key={i} className="hover:bg-slate-900/50">
                        <td className="p-2 text-slate-500">{i + 1}</td>
                        <td className="p-2 font-bold text-amber-300">{v.plate}</td>
                        <td className="p-2 text-slate-300 font-sans">{v.model}</td>
                        <td className="p-2 text-slate-400">{new Date(v.departure).toLocaleString("fr-FR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {parsedData.vehicles.length > 15 && (
                <p className="text-[10px] text-slate-500 text-center">
                  + {parsedData.vehicles.length - 15} autres véhicules...
                </p>
              )}

              {/* Choix du mode d'import */}
              <div className="pt-2 border-t border-slate-800/80">
                <label className="block text-xs font-bold text-slate-300 mb-2">Mode d'injection :</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setImportMode("replace")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      importMode === "replace"
                        ? "bg-blue-600/20 border-blue-500 text-blue-300 ring-1 ring-blue-500"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <RefreshCw size={13} /> Remplacer tout le parc
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Répartit tous les véhicules importés de zéro
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportMode("append")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      importMode === "append"
                        ? "bg-emerald-600/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <Layers size={13} /> Ajouter aux existants
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Conserve les véhicules actuels et insère les nouveaux
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-semibold transition-colors cursor-pointer"
          >
            Fermer
          </button>
          <button
            type="button"
            disabled={!parsedData || parsedData.vehicles.length === 0}
            onClick={handleConfirmImport}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold shadow-lg shadow-emerald-900/40 transition-all flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 size={16} />
            Importer et Répartir ({parsedData?.vehicles?.length || 0} véhicules)
          </button>
        </div>
      </div>
    </div>
  );
}
