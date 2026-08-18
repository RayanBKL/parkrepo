import React, { useState, useEffect, useMemo, useRef } from "react";
import confetti from "canvas-confetti";
import {
  loadDatabase,
  saveDatabase,
  logMovement,
} from "./services/db";
import {
  assignLane,
  redistributeAllVehicles,
  generateVehicleId,
} from "./services/algorithm";
import { exportParkingToExcel } from "./services/excel";
import { getAlyseSampleVehicles } from "./services/sampleData";

import Navbar from "./components/Navbar";
import StatsBar from "./components/StatsBar";
import ParkingGrid from "./components/ParkingGrid";
import DeparturesSchedule from "./components/DeparturesSchedule";
import VehicleModal from "./components/VehicleModal";
import ImportModal from "./components/ImportModal";
import MoveModal from "./components/MoveModal";
import HistoryModal from "./components/HistoryModal";
import ParkingsModal from "./components/ParkingsModal";
import SettingsModal from "./components/SettingsModal";
import WaitingQueueModal from "./components/WaitingQueueModal";
import TicketModal from "./components/TicketModal";

export default function App() {
  // 1. État de la Base de Données Persistante
  const [dbState, setDbState] = useState(() => loadDatabase());
  const [activeParkingId, setActiveParkingId] = useState(() => dbState.activeParkingId);

  // Synchronisation automatique et persistante dans la DB à chaque changement
  useEffect(() => {
    saveDatabase(dbState);
  }, [dbState]);

  // Récupérer le parking actif courant
  const activeParking = useMemo(() => {
    return (
      dbState.parkings.find((p) => p.id === activeParkingId) ||
      dbState.parkings[0] || {
        id: "parking_1",
        name: "Parc Principal",
        laneCount: 30,
        capacity: 10,
        lanes: Array.from({ length: 30 }, () => []),
        waiting: [],
        history: [],
      }
    );
  }, [dbState.parkings, activeParkingId]);

  // 2. États d'interface
  const [activeTab, setActiveTab] = useState("grid"); // 'grid' ou 'schedule'
  const [activeStrategy, setActiveStrategy] = useState("patience"); // 'patience', 'zoning', 'flight'
  const [searchQuery, setSearchQuery] = useState("");
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [targetLaneForAdd, setTargetLaneForAdd] = useState(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [movingVehicle, setMovingVehicle] = useState(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isParkingsModalOpen, setIsParkingsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isWaitingModalOpen, setIsWaitingModalOpen] = useState(false);

  // Ticket Modal
  const [ticketData, setTicketData] = useState(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  // Notification Toast Helper
  const showToast = (message, type = "success") => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper pour mettre à jour le parking actif dans dbState
  const updateActiveParking = (updaterFn) => {
    setDbState((prev) => {
      const updatedParkings = prev.parkings.map((p) => {
        if (p.id === activeParking.id) {
          const updated = updaterFn(p);
          return { ...updated, updatedAt: new Date().toISOString() };
        }
        return p;
      });
      return { ...prev, parkings: updatedParkings };
    });
  };

  // Initialisation avec l'échantillon Alyse si le parking est complètement vide au 1er lancement
  useEffect(() => {
    const totalVehicles = activeParking.lanes.reduce((acc, l) => acc + l.length, 0);
    if (totalVehicles === 0 && (!activeParking.history || activeParking.history.length === 0)) {
      const samples = getAlyseSampleVehicles();
      const { lanes, waiting } = redistributeAllVehicles(
        samples,
        activeParking.laneCount,
        activeParking.capacity,
        activeStrategy
      );
      updateActiveParking((p) => ({
        ...p,
        lanes,
        waiting,
        history: logMovement(p, "IMPORT", {
          message: "Chargement initial du planning Alyse Parc Auto (38 véhicules)",
          count: samples.length,
        }),
      }));
    }
  }, []);

  // -------------------------------------------------------------------------
  // Actions Métier (Véhicules, Voies, Répartition)
  // -------------------------------------------------------------------------

  // 1. Ajouter ou Modifier un véhicule
  const handleSaveVehicle = (vehicleData, directLaneIndex) => {
    updateActiveParking((p) => {
      let newLanes = p.lanes.map((l) => [...l]);
      let newWaiting = [...p.waiting];
      let actionType = "ENTRY";
      let detailMsg = "";

      // Cas Modification
      if (editingVehicle) {
        actionType = "EDIT";
        // Retirer l'ancien
        newLanes = newLanes.map((lane) => lane.filter((v) => v.id !== vehicleData.id));
        newWaiting = newWaiting.filter((v) => v.id !== vehicleData.id);
        detailMsg = `Modification du véhicule ${vehicleData.plate}`;
      }

      // Insertion dans la voie
      if (directLaneIndex !== null && directLaneIndex !== undefined && directLaneIndex >= 0) {
        // Placement forcé dans une voie spécifique
        const lane = newLanes[directLaneIndex] || [];
        if (lane.length < p.capacity) {
          const insertIdx = lane.findIndex(
            (v) => new Date(v.departure).getTime() > new Date(vehicleData.departure).getTime()
          );
          if (insertIdx === -1) lane.push(vehicleData);
          else lane.splice(insertIdx, 0, vehicleData);
          newLanes[directLaneIndex] = lane;
          detailMsg = `Véhicule ${vehicleData.plate} placé dans la Voie ${directLaneIndex + 1}`;
        } else {
          newWaiting.push(vehicleData);
          detailMsg = `Voie ${directLaneIndex + 1} pleine : ${vehicleData.plate} placé en file d'attente`;
        }
      } else {
        // Placement via Stratégie choisie
        const assignment = assignLane(newLanes, p.capacity, vehicleData, activeStrategy);
        if (!assignment.waiting && assignment.laneIndex !== -1) {
          const targetLane = newLanes[assignment.laneIndex];
          targetLane.splice(assignment.insertIndex, 0, vehicleData);
          detailMsg = `Véhicule ${vehicleData.plate} affecté automatiquement à la Voie ${assignment.laneIndex + 1}`;
        } else {
          newWaiting.push(vehicleData);
          detailMsg = `Parc complet : véhicule ${vehicleData.plate} placé en file d'attente`;
        }
      }

      const updatedHistory = logMovement(p, actionType, {
        plate: vehicleData.plate,
        model: vehicleData.model,
        message: detailMsg,
        vehicle: vehicleData,
      });

      return {
        ...p,
        lanes: newLanes,
        waiting: newWaiting,
        history: updatedHistory,
      };
    });

    setEditingVehicle(null);
    setTargetLaneForAdd(null);
    showToast(`Véhicule ${vehicleData.plate} enregistré avec succès !`);
  };

  // 2. Sortie / Délogement d'un véhicule (Libérer la place)
  const handleExitVehicle = (vehicle) => {
    let exitedLaneIndex = -1;

    updateActiveParking((p) => {
      let newLanes = p.lanes.map((lane, idx) => {
        const filtered = lane.filter((v) => {
          if (v.id === vehicle.id) {
            exitedLaneIndex = idx;
            return false;
          }
          return true;
        });
        return filtered;
      });

      let newWaiting = [...p.waiting];

      // Si une place vient de se libérer et qu'il y a des véhicules en attente,
      // on essaie de placer le premier véhicule d'attente
      if (newWaiting.length > 0) {
        const nextWaiting = newWaiting[0];
        const assign = assignLane(newLanes, p.capacity, nextWaiting, activeStrategy);
        if (!assign.waiting && assign.laneIndex !== -1) {
          newLanes[assign.laneIndex].splice(assign.insertIndex, 0, nextWaiting);
          newWaiting.shift();
        }
      }

      const updatedHistory = logMovement(p, "EXIT", {
        plate: vehicle.plate,
        model: vehicle.model,
        lane: exitedLaneIndex,
        message: `Sortie confirmée du véhicule ${vehicle.plate} (Voie ${exitedLaneIndex + 1})`,
        vehicle,
      });

      return {
        ...p,
        lanes: newLanes,
        waiting: newWaiting,
        history: updatedHistory,
      };
    });

    // Effet visuel confettis légers
    confetti({
      particleCount: 25,
      spread: 60,
      origin: { y: 0.8 },
      colors: ["#10B981", "#3B82F6", "#F59E0B"],
    });

    showToast(`Véhicule ${vehicle.plate} sorti du parc ! Place libérée.`);
  };

  // 3. Déplacer un véhicule vers une voie cible (Manuel ou Drag & Drop)
  const handleConfirmMove = (vehicle, targetLaneIndex) => {
    updateActiveParking((p) => {
      // 1. Retirer de l'ancienne voie
      let fromLane = -1;
      let newLanes = p.lanes.map((lane, idx) => {
        const filtered = lane.filter((v) => {
          if (v.id === vehicle.id) {
            fromLane = idx;
            return false;
          }
          return true;
        });
        return filtered;
      });

      // 2. Insérer dans la nouvelle voie à l'index trié chronologiquement
      const destLane = newLanes[targetLaneIndex];
      const insertIdx = destLane.findIndex(
        (v) => new Date(v.departure).getTime() > new Date(vehicle.departure).getTime()
      );
      if (insertIdx === -1) destLane.push(vehicle);
      else destLane.splice(insertIdx, 0, vehicle);

      const updatedHistory = logMovement(p, "MOVE", {
        plate: vehicle.plate,
        fromLane,
        toLane: targetLaneIndex,
        message: `Véhicule ${vehicle.plate} déplacé de Voie ${fromLane + 1} vers Voie ${targetLaneIndex + 1}`,
      });

      return {
        ...p,
        lanes: newLanes,
        history: updatedHistory,
      };
    });

    showToast(`Véhicule ${vehicle.plate} déplacé en Voie ${targetLaneIndex + 1}`);
  };

  // Gestion du Drag & Drop direct sur la grille
  const handleDropVehicleToLane = (vehicleId, fromLaneIndex, targetLaneIndex) => {
    let draggedVehicle = null;
    activeParking.lanes.forEach((lane) => {
      const found = lane.find((v) => v.id === vehicleId);
      if (found) draggedVehicle = found;
    });

    if (draggedVehicle) {
      handleConfirmMove(draggedVehicle, targetLaneIndex);
    }
  };

  // 4. Trier une voie spécifique
  const handleSortLane = (laneIndex) => {
    updateActiveParking((p) => {
      const newLanes = p.lanes.map((l) => [...l]);
      newLanes[laneIndex].sort((a, b) => new Date(a.departure) - new Date(b.departure));

      const updatedHistory = logMovement(p, "SORT_LANE", {
        lane: laneIndex,
        message: `Réorganisation et levée des conflits de la Voie ${laneIndex + 1}`,
      });

      return { ...p, lanes: newLanes, history: updatedHistory };
    });
    showToast(`Voie ${laneIndex + 1} réorganisée chronologiquement !`);
  };

  // 5. Répartition Optimale Globale (Selon la stratégie)
  const handleAutoRedistributeAll = (strategy = activeStrategy) => {
    updateActiveParking((p) => {
      const allVehicles = [];
      p.lanes.forEach((lane) => allVehicles.push(...lane));
      allVehicles.push(...p.waiting);

      const { lanes, waiting } = redistributeAllVehicles(
        allVehicles,
        p.laneCount,
        p.capacity,
        strategy
      );

      const updatedHistory = logMovement(p, "REDISTRIBUTE", {
        totalVehicles: allVehicles.length,
        strategy,
        message: `Répartition globale optimisée (${strategy}) sur ${p.laneCount} voies (${allVehicles.length} véhicules)`,
      });

      return {
        ...p,
        lanes,
        waiting,
        history: updatedHistory,
      };
    });

    confetti({
      particleCount: 40,
      spread: 70,
      origin: { y: 0.6 },
    });

    showToast(`Tout le parc a été réorganisé selon la stratégie : ${strategy.toUpperCase()}`);
  };

  // 6. Importation de véhicules (Excel / CSV)
  const handleImportVehicles = (importedVehicles, mode) => {
    updateActiveParking((p) => {
      let newLanes = p.lanes.map((l) => [...l]);
      let newWaiting = [...p.waiting];

      if (mode === "replace") {
        const { lanes, waiting } = redistributeAllVehicles(
          importedVehicles,
          p.laneCount,
          p.capacity,
          activeStrategy
        );
        newLanes = lanes;
        newWaiting = waiting;
      } else {
        // Mode Append (ajouter aux véhicules existants)
        importedVehicles.forEach((veh) => {
          const assign = assignLane(newLanes, p.capacity, veh, activeStrategy);
          if (!assign.waiting && assign.laneIndex !== -1) {
            newLanes[assign.laneIndex].splice(assign.insertIndex, 0, veh);
          } else {
            newWaiting.push(veh);
          }
        });
      }

      const updatedHistory = logMovement(p, "IMPORT", {
        count: importedVehicles.length,
        mode,
        message: `Importation réussie de ${importedVehicles.length} véhicules (Mode : ${mode})`,
      });

      return {
        ...p,
        lanes: newLanes,
        waiting: newWaiting,
        history: updatedHistory,
      };
    });

    showToast(`${importedVehicles.length} véhicules importés avec succès !`);
  };

  // 7. Multi-Parkings : Créer / Supprimer / Basculer
  const handleCreateParking = (newConfig) => {
    const newId = `pkg_${Date.now()}`;
    const newPkg = {
      id: newId,
      name: newConfig.name,
      code: newConfig.code,
      description: "",
      laneCount: newConfig.laneCount || 30,
      capacity: newConfig.capacity || 10,
      lanes: Array.from({ length: newConfig.laneCount || 30 }, () => []),
      waiting: [],
      history: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: "CREATE_PARKING",
          details: { message: `Création du parking ${newConfig.name}` },
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDbState((prev) => ({
      ...prev,
      activeParkingId: newId,
      parkings: [...prev.parkings, newPkg],
    }));
    setActiveParkingId(newId);
    showToast(`Nouveau parking "${newConfig.name}" créé avec succès !`);
  };

  const handleDeleteParking = (pkgId) => {
    if (dbState.parkings.length <= 1) {
      alert("Impossible de supprimer le dernier parking restant.");
      return;
    }
    const remaining = dbState.parkings.filter((p) => p.id !== pkgId);
    const nextActive = remaining[0].id;

    setDbState((prev) => ({
      ...prev,
      activeParkingId: nextActive,
      parkings: remaining,
    }));
    setActiveParkingId(nextActive);
    showToast("Parking supprimé de la base de données.");
  };

  const handleSelectParking = (pkgId) => {
    setDbState((prev) => ({ ...prev, activeParkingId: pkgId }));
    setActiveParkingId(pkgId);
  };

  // 8. Paramètres du Parking
  const handleUpdateParkingSettings = (settings) => {
    updateActiveParking((p) => {
      let newLanes = [...p.lanes];
      const newLaneCount = settings.laneCount;

      if (newLaneCount > newLanes.length) {
        while (newLanes.length < newLaneCount) {
          newLanes.push([]);
        }
      } else if (newLaneCount < newLanes.length) {
        const overflow = [];
        for (let i = newLaneCount; i < newLanes.length; i++) {
          overflow.push(...newLanes[i]);
        }
        newLanes = newLanes.slice(0, newLaneCount);
        p.waiting = [...p.waiting, ...overflow];
      }

      return {
        ...p,
        name: settings.name,
        laneCount: newLaneCount,
        capacity: settings.capacity,
        lanes: newLanes,
      };
    });
    showToast("Paramètres du parking enregistrés.");
  };

  // 9. Vider le parking actif
  const handleResetParking = () => {
    updateActiveParking((p) => ({
      ...p,
      lanes: Array.from({ length: p.laneCount }, () => []),
      waiting: [],
      history: logMovement(p, "RESET", { message: "Vidange complète du parking" }),
    }));
    showToast("Le parking a été vidé.");
  };

  // 10. Effacer l'historique
  const handleClearHistory = () => {
    updateActiveParking((p) => ({ ...p, history: [] }));
    showToast("Historique effacé.");
  };

  // 11. Restaurer une base de données entière
  const handleRestoreDatabase = (restoredData) => {
    setDbState(restoredData);
    setActiveParkingId(restoredData.activeParkingId);
    showToast("Base de données restaurée avec succès !");
  };

  // 12. File d'attente
  const handleAssignWaitingVehicle = (vehicle) => {
    updateActiveParking((p) => {
      const newWaiting = p.waiting.filter((v) => v.id !== vehicle.id);
      const newLanes = p.lanes.map((l) => [...l]);
      const assign = assignLane(newLanes, p.capacity, vehicle, activeStrategy);

      if (!assign.waiting && assign.laneIndex !== -1) {
        newLanes[assign.laneIndex].splice(assign.insertIndex, 0, vehicle);
        showToast(`Véhicule ${vehicle.plate} placé en Voie ${assign.laneIndex + 1}`);
      } else {
        newWaiting.push(vehicle);
        showToast("Aucune place libre disponible actuellement dans le parc.", "error");
      }

      return { ...p, lanes: newLanes, waiting: newWaiting };
    });
  };

  const handleAutoAssignAllWaiting = () => {
    updateActiveParking((p) => {
      const newLanes = p.lanes.map((l) => [...l]);
      const stillWaiting = [];

      p.waiting.forEach((veh) => {
        const assign = assignLane(newLanes, p.capacity, veh, activeStrategy);
        if (!assign.waiting && assign.laneIndex !== -1) {
          newLanes[assign.laneIndex].splice(assign.insertIndex, 0, veh);
        } else {
          stillWaiting.push(veh);
        }
      });

      const placedCount = p.waiting.length - stillWaiting.length;
      showToast(`${placedCount} véhicule(s) placé(s) depuis la file d'attente.`);

      return { ...p, lanes: newLanes, waiting: stillWaiting };
    });
  };

  const handleRemoveFromWaiting = (vehicleId) => {
    updateActiveParking((p) => ({
      ...p,
      waiting: p.waiting.filter((v) => v.id !== vehicleId),
    }));
  };

  // 13. Ouvrir Ticket Imprimable
  const handleOpenTicket = (vehicle, laneIndex, slotIndex) => {
    setTicketData({ vehicle, laneIndex, slotIndex });
    setIsTicketModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div
            className={`px-4 py-3 rounded-2xl border shadow-2xl text-xs font-bold flex items-center gap-2.5 ${
              toastMessage.type === "error"
                ? "bg-rose-950/95 border-rose-500 text-rose-200 shadow-rose-950/50"
                : "bg-slate-900/95 border-blue-500/80 text-white shadow-blue-950/60"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            {toastMessage.message}
          </div>
        </div>
      )}

      {/* Navbar Supérieure */}
      <Navbar
        parkings={dbState.parkings}
        activeParking={activeParking}
        onSelectParking={handleSelectParking}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => {
          setEditingVehicle(null);
          setTargetLaneForAdd(null);
          setIsAddModalOpen(true);
        }}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onExportExcel={() => exportParkingToExcel(activeParking)}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
        onOpenParkingsModal={() => setIsParkingsModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
      />

      {/* Corps de l'application */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto px-4 sm:px-6 pt-5">
        {/* Barre de KPI & Filtres rapides */}
        <StatsBar
          parking={activeParking}
          filterUrgency={filterUrgency}
          setFilterUrgency={setFilterUrgency}
          activeStrategy={activeStrategy}
          setActiveStrategy={setActiveStrategy}
          onAutoRedistribute={handleAutoRedistributeAll}
          onOpenWaiting={() => setIsWaitingModalOpen(true)}
        />

        {/* Vue 1 : Grille 2D des Voies avec Glisser-Déposer */}
        {activeTab === "grid" && (
          <ParkingGrid
            lanes={activeParking.lanes}
            capacity={activeParking.capacity}
            searchQuery={searchQuery}
            filterUrgency={filterUrgency}
            onExitVehicle={handleExitVehicle}
            onMoveVehicle={(vehicle) => {
              setMovingVehicle(vehicle);
              setIsMoveModalOpen(true);
            }}
            onEditVehicle={(vehicle) => {
              setEditingVehicle(vehicle);
              setIsAddModalOpen(true);
            }}
            onPrintTicket={handleOpenTicket}
            onAddVehicleToLane={(laneIdx) => {
              setEditingVehicle(null);
              setTargetLaneForAdd(laneIdx);
              setIsAddModalOpen(true);
            }}
            onSortLane={handleSortLane}
            onDropVehicleToLane={handleDropVehicleToLane}
            selectedVehicleId={selectedVehicleId}
            setSelectedVehicleId={setSelectedVehicleId}
          />
        )}

        {/* Vue 2 : Feuille de Route / Planning Chronologique Départs Voiturier */}
        {activeTab === "schedule" && (
          <DeparturesSchedule
            parking={activeParking}
            onExitVehicle={handleExitVehicle}
            onMoveVehicle={(vehicle) => {
              setMovingVehicle(vehicle);
              setIsMoveModalOpen(true);
            }}
            onPrintTicket={handleOpenTicket}
            onEditVehicle={(vehicle) => {
              setEditingVehicle(vehicle);
              setIsAddModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Modales Interactives */}
      <VehicleModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingVehicle(null);
          setTargetLaneForAdd(null);
        }}
        onSave={handleSaveVehicle}
        editingVehicle={editingVehicle}
        targetLaneIndex={targetLaneForAdd}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportVehicles={handleImportVehicles}
      />

      <MoveModal
        isOpen={isMoveModalOpen}
        onClose={() => {
          setIsMoveModalOpen(false);
          setMovingVehicle(null);
        }}
        vehicle={movingVehicle}
        lanes={activeParking.lanes}
        capacity={activeParking.capacity}
        onConfirmMove={handleConfirmMove}
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={activeParking.history}
        onClearHistory={handleClearHistory}
        parkingName={activeParking.name}
      />

      <ParkingsModal
        isOpen={isParkingsModalOpen}
        onClose={() => setIsParkingsModalOpen(false)}
        parkings={dbState.parkings}
        activeParkingId={activeParking.id}
        onSelectParking={handleSelectParking}
        onCreateParking={handleCreateParking}
        onDeleteParking={handleDeleteParking}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        parking={activeParking}
        databaseState={dbState}
        onUpdateParkingSettings={handleUpdateParkingSettings}
        onRestoreDatabase={handleRestoreDatabase}
        onResetParking={handleResetParking}
      />

      <WaitingQueueModal
        isOpen={isWaitingModalOpen}
        onClose={() => setIsWaitingModalOpen(false)}
        waitingVehicles={activeParking.waiting}
        onAssignWaitingVehicle={handleAssignWaitingVehicle}
        onAutoAssignAllWaiting={handleAutoAssignAllWaiting}
        onRemoveFromWaiting={handleRemoveFromWaiting}
      />

      <TicketModal
        isOpen={isTicketModalOpen}
        onClose={() => {
          setIsTicketModalOpen(false);
          setTicketData(null);
        }}
        vehicle={ticketData?.vehicle}
        laneIndex={ticketData?.laneIndex}
        slotIndex={ticketData?.slotIndex}
        parkingName={activeParking.name}
      />
    </div>
  );
}
