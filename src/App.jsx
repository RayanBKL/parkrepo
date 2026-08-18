import React, { useState, useEffect, useMemo, useRef } from "react";
import confetti from "canvas-confetti";
import { Plus, KeyRound } from "lucide-react";

// Services Auth & Cloud
import { onAuthChange, logOut } from "./services/auth";
import {
  createParking,
  subscribeToParkingList,
  subscribeToParking,
  saveParkingData,
  deleteParking,
  leaveParking,
  getLaneName,
  generateAccessCode,
} from "./services/cloudDb";
import { assignLane, redistributeAllVehicles, generateVehicleId } from "./services/algorithm";
import { exportParkingToExcel } from "./services/excel";
import { getAlyseSampleVehicles } from "./services/sampleData";
import { logMovement } from "./services/db";

// Composants
import AuthPage from "./components/AuthPage";
import Navbar from "./components/Navbar";
import StatsBar from "./components/StatsBar";
import ParkingGrid from "./components/ParkingGrid";
import DeparturesSchedule from "./components/DeparturesSchedule";
import VehicleModal from "./components/VehicleModal";
import ImportModal from "./components/ImportModal";
import MoveModal from "./components/MoveModal";
import HistoryModal from "./components/HistoryModal";
import SettingsModal from "./components/SettingsModal";
import WaitingQueueModal from "./components/WaitingQueueModal";
import TicketModal from "./components/TicketModal";
import { JoinParkingModal, AccessCodeModal } from "./components/AccessCodeModals";
import ParkingsModal from "./components/ParkingsModal";
import ParkflowLogo from "./components/ParkflowLogo";

// Loader plein écran
function FullScreenLoader({ message }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 font-sans">
      <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-600 via-emerald-500 to-sky-400 p-[2px] shadow-2xl shadow-cyan-500/30 animate-pulse">
        <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-cyan-400 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      </div>
      <p className="text-slate-400 text-sm font-medium">{message || "Chargement..."}</p>
    </div>
  );
}

export default function App() {
  // --- État d'Authentification ---
  const [currentUser, setCurrentUser] = useState(undefined); // undefined = en cours de chargement
  const [authLoading, setAuthLoading] = useState(true);

  // --- État des Parkings (Cloud) ---
  const [parkings, setParkings] = useState([]);
  const [activeParkingId, setActiveParkingId] = useState(null);
  const [parkingsLoading, setParkingsLoading] = useState(false);
  const [firestoreError, setFirestoreError] = useState(null);

  // --- Synchronisation Temps Réel (abonnements Firestore) ---
  const unsubParkingListRef = useRef(null);
  const unsubActiveParkingRef = useRef(null);

  // --- Interface ---
  const [activeTab, setActiveTab] = useState("grid");
  const [activeStrategy, setActiveStrategy] = useState("patience");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // --- Modales ---
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
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isAccessCodeModalOpen, setIsAccessCodeModalOpen] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  // --- Toast ---
  const showToast = (message, type = "success") => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // --- Parking Actif ---
  const activeParking = useMemo(() => {
    if (!activeParkingId || parkings.length === 0) return null;
    return parkings.find((p) => p.id === activeParkingId) || parkings[0] || null;
  }, [parkings, activeParkingId]);

  // =========================================================================
  // Authentification & Abonnements Temps Réel
  // =========================================================================

  useEffect(() => {
    // Écoute les changements d'état de connexion
    const unsub = onAuthChange((user) => {
      setCurrentUser(user);
      setAuthLoading(false);

      if (user) {
        setParkingsLoading(true);
        setFirestoreError(null);
        // Abonnement temps réel à la liste des parkings de l'utilisateur
        if (unsubParkingListRef.current) unsubParkingListRef.current();
        unsubParkingListRef.current = subscribeToParkingList(
          user.uid, 
          (updatedParkings) => {
            setParkings(updatedParkings);
            setParkingsLoading(false);
            setFirestoreError(null);

            if (updatedParkings.length > 0) {
              setActiveParkingId((prev) => {
                if (prev && updatedParkings.some((p) => p.id === prev)) return prev;
                return updatedParkings[0].id;
              });
            }
          },
          (err) => {
            setParkingsLoading(false);
            setFirestoreError(err.message || "Accès refusé. Avez-vous créé la base de données Firestore et publié les règles de sécurité ?");
          }
        );
      } else {
        // Déconnexion : nettoyer les abonnements
        if (unsubParkingListRef.current) unsubParkingListRef.current();
        if (unsubActiveParkingRef.current) unsubActiveParkingRef.current();
        setParkings([]);
        setActiveParkingId(null);
      }
    });

    return () => {
      unsub();
      if (unsubParkingListRef.current) unsubParkingListRef.current();
      if (unsubActiveParkingRef.current) unsubActiveParkingRef.current();
    };
  }, []);

  // Helper pour sauvegarder les données du parking actif sur Firestore
  const updateActiveParking = async (updaterFn) => {
    if (!activeParking) return;
    const updated = updaterFn({ ...activeParking });
    // Mise à jour optimiste locale immédiate
    setParkings((prev) => prev.map((p) => (p.id === activeParking.id ? updated : p)));
    // Sauvegarde cloud
    try {
      await saveParkingData(activeParking.id, updated);
    } catch (err) {
      showToast("Erreur de synchronisation cloud.", "error");
      console.error(err);
    }
  };

  // =========================================================================
  // Actions Métier — Véhicules
  // =========================================================================

  const handleSaveVehicle = async (vehicleData, directLaneIndex) => {
    await updateActiveParking((p) => {
      let newLanes = p.lanes.map((l) => [...l]);
      let newWaiting = [...(p.waiting || [])];
      let actionType = editingVehicle ? "EDIT" : "ENTRY";
      let detailMsg = "";

      if (editingVehicle) {
        newLanes = newLanes.map((lane) => lane.filter((v) => v.id !== vehicleData.id));
        newWaiting = newWaiting.filter((v) => v.id !== vehicleData.id);
        detailMsg = `Modification du véhicule ${vehicleData.plate}`;
      }

      if (directLaneIndex !== null && directLaneIndex !== undefined && directLaneIndex >= 0) {
        const lane = newLanes[directLaneIndex] || [];
        const laneName = getLaneName(directLaneIndex, p);
        if (lane.length < p.capacity) {
          const insertIdx = lane.findIndex((v) => new Date(v.departure).getTime() > new Date(vehicleData.departure).getTime());
          if (insertIdx === -1) lane.push(vehicleData);
          else lane.splice(insertIdx, 0, vehicleData);
          newLanes[directLaneIndex] = lane;
          detailMsg = `Véhicule ${vehicleData.plate} placé dans ${laneName}`;
        } else {
          newWaiting.push(vehicleData);
          detailMsg = `${laneName} pleine : ${vehicleData.plate} en file d'attente`;
        }
      } else {
        const assignment = assignLane(newLanes, p.capacity, vehicleData, activeStrategy);
        if (!assignment.waiting && assignment.laneIndex !== -1) {
          newLanes[assignment.laneIndex].splice(assignment.insertIndex, 0, vehicleData);
          detailMsg = `Véhicule ${vehicleData.plate} affecté à ${getLaneName(assignment.laneIndex, p)}`;
        } else {
          newWaiting.push(vehicleData);
          detailMsg = `Parc complet : ${vehicleData.plate} en file d'attente`;
        }
      }

      return {
        ...p,
        lanes: newLanes,
        waiting: newWaiting,
        history: logMovement(p, actionType, { plate: vehicleData.plate, model: vehicleData.model, message: detailMsg }),
      };
    });

    setEditingVehicle(null);
    setTargetLaneForAdd(null);
    showToast(`Véhicule ${vehicleData.plate} enregistré !`);
  };

  const handleExitVehicle = async (vehicle) => {
    let exitedLaneIndex = -1;

    await updateActiveParking((p) => {
      let newLanes = p.lanes.map((lane, idx) => {
        return lane.filter((v) => {
          if (v.id === vehicle.id) { exitedLaneIndex = idx; return false; }
          return true;
        });
      });
      let newWaiting = [...(p.waiting || [])];

      if (newWaiting.length > 0) {
        const nextWaiting = newWaiting[0];
        const assign = assignLane(newLanes, p.capacity, nextWaiting, activeStrategy);
        if (!assign.waiting && assign.laneIndex !== -1) {
          newLanes[assign.laneIndex].splice(assign.insertIndex, 0, nextWaiting);
          newWaiting.shift();
        }
      }

      return {
        ...p,
        lanes: newLanes,
        waiting: newWaiting,
        history: logMovement(p, "EXIT", { plate: vehicle.plate, model: vehicle.model, lane: exitedLaneIndex, message: `Sortie du véhicule ${vehicle.plate}` }),
      };
    });

    confetti({ particleCount: 25, spread: 60, origin: { y: 0.8 }, colors: ["#10B981", "#3B82F6", "#F59E0B"] });
    showToast(`Véhicule ${vehicle.plate} sorti du parc !`);
  };

  const handleConfirmMove = async (vehicle, targetLaneIndex) => {
    await updateActiveParking((p) => {
      let fromLane = -1;
      let newLanes = p.lanes.map((lane, idx) => lane.filter((v) => {
        if (v.id === vehicle.id) { fromLane = idx; return false; }
        return true;
      }));
      const destLane = newLanes[targetLaneIndex];
      const insertIdx = destLane.findIndex((v) => new Date(v.departure).getTime() > new Date(vehicle.departure).getTime());
      if (insertIdx === -1) destLane.push(vehicle);
      else destLane.splice(insertIdx, 0, vehicle);

      const fromName = getLaneName(fromLane, p);
      const toName = getLaneName(targetLaneIndex, p);

      return {
        ...p,
        lanes: newLanes,
        history: logMovement(p, "MOVE", { plate: vehicle.plate, fromLane, toLane: targetLaneIndex, message: `${vehicle.plate} déplacé ${fromName} → ${toName}` }),
      };
    });
    showToast(`Véhicule ${vehicle.plate} déplacé en ${getLaneName(targetLaneIndex, activeParking)}`);
  };

  const handleDropVehicleToLane = (vehicleId, fromLaneIndex, targetLaneIndex) => {
    if (!activeParking) return;
    let draggedVehicle = null;
    activeParking.lanes.forEach((lane) => { const f = lane.find((v) => v.id === vehicleId); if (f) draggedVehicle = f; });
    if (draggedVehicle) handleConfirmMove(draggedVehicle, targetLaneIndex);
  };

  const handleSortLane = async (laneIndex) => {
    await updateActiveParking((p) => {
      const newLanes = p.lanes.map((l) => [...l]);
      newLanes[laneIndex].sort((a, b) => new Date(a.departure) - new Date(b.departure));
      return { ...p, lanes: newLanes, history: logMovement(p, "SORT_LANE", { lane: laneIndex, message: `Réorganisation de ${getLaneName(laneIndex, p)}` }) };
    });
    showToast(`${getLaneName(laneIndex, activeParking)} réorganisée !`);
  };

  const handleRenameLane = async (laneIdx, newName) => {
    if (!activeParking) return;
    await updateActiveParking((p) => {
      const nextNames = { ...(p.laneNames || {}) };
      if (newName && newName.trim()) {
        nextNames[laneIdx] = newName.trim();
      } else {
        delete nextNames[laneIdx];
      }
      return { ...p, laneNames: nextNames };
    });
    showToast(`Voie mise à jour : ${newName || "Par défaut"}`);
  };

  const handleAutoRedistributeAll = async (strategy = activeStrategy) => {
    await updateActiveParking((p) => {
      const allVehicles = [...p.lanes.flat(), ...(p.waiting || [])];
      const { lanes, waiting } = redistributeAllVehicles(allVehicles, p.laneCount, p.capacity, strategy);
      return { ...p, lanes, waiting, history: logMovement(p, "REDISTRIBUTE", { strategy, totalVehicles: allVehicles.length, message: `Répartition globale (${strategy})` }) };
    });
    confetti({ particleCount: 40, spread: 70, origin: { y: 0.6 } });
    showToast(`Parc réorganisé selon la stratégie : ${strategy.toUpperCase()}`);
  };

  const handleImportVehicles = async (importedVehicles, mode) => {
    await updateActiveParking((p) => {
      let newLanes, newWaiting;
      if (mode === "replace") {
        const result = redistributeAllVehicles(importedVehicles, p.laneCount, p.capacity, activeStrategy);
        newLanes = result.lanes;
        newWaiting = result.waiting;
      } else {
        newLanes = p.lanes.map((l) => [...l]);
        newWaiting = [...(p.waiting || [])];
        importedVehicles.forEach((veh) => {
          const assign = assignLane(newLanes, p.capacity, veh, activeStrategy);
          if (!assign.waiting && assign.laneIndex !== -1) newLanes[assign.laneIndex].splice(assign.insertIndex, 0, veh);
          else newWaiting.push(veh);
        });
      }
      return { ...p, lanes: newLanes, waiting: newWaiting, history: logMovement(p, "IMPORT", { count: importedVehicles.length, mode, message: `Import de ${importedVehicles.length} véhicules (${mode})` }) };
    });
    showToast(`${importedVehicles.length} véhicules importés avec succès !`);
  };

  // =========================================================================
  // Multi-Parkings (Cloud)
  // =========================================================================

  const handleCreateParking = async (config) => {
    if (!currentUser) return;
    try {
      const newParking = await createParking(currentUser.uid, config);
      setActiveParkingId(newParking.id);
      showToast(`Parking "${config.name}" créé !`);
      return newParking;
    } catch (err) {
      showToast("Erreur lors de la création du parking.", "error");
    }
  };

  const handleDeleteParking = async (pkgId) => {
    if (!currentUser) return;
    const targetParking = parkings.find((p) => p.id === pkgId);
    const pName = targetParking?.name || "ce parking";

    try {
      await deleteParking(pkgId, currentUser.uid);
      showToast(`Parking "${pName}" supprimé définitivement.`);

      const remaining = parkings.filter((p) => p.id !== pkgId);
      if (remaining.length > 0) {
        setActiveParkingId(remaining[0].id);
      } else {
        setActiveParkingId(null);
        setIsParkingsModalOpen(false);
      }
    } catch (err) {
      console.error("Erreur suppression parking:", err);
      showToast(err.message || "Erreur lors de la suppression du parking.", "error");
    }
  };

  const handleLeaveParking = async (pkgId) => {
    if (!currentUser) return;
    const targetParking = parkings.find((p) => p.id === pkgId);
    const pName = targetParking?.name || "ce parking";

    try {
      const res = await leaveParking(pkgId, currentUser.uid);
      if (res?.deletedPermanently) {
        showToast(`Dernier membre parti : parking "${pName}" supprimé.`);
      } else {
        showToast(`Parking "${pName}" retiré de votre compte.`);
      }

      const remaining = parkings.filter((p) => p.id !== pkgId);
      if (remaining.length > 0) {
        setActiveParkingId(remaining[0].id);
      } else {
        setActiveParkingId(null);
        setIsParkingsModalOpen(false);
      }
    } catch (err) {
      console.error("Erreur départ parking:", err);
      showToast(err.message || "Erreur lors du retrait du parking.", "error");
    }
  };

  const handleJoinedParking = (parkingId, alreadyJoined) => {
    setActiveParkingId(parkingId);
    showToast(alreadyJoined ? "Parking déjà dans votre liste !" : "Parking rejoint avec succès !");
  };

  const handleUpdateParkingSettings = async (settings) => {
    await updateActiveParking((p) => {
      let newLanes = [...p.lanes];
      if (settings.laneCount > newLanes.length) {
        while (newLanes.length < settings.laneCount) newLanes.push([]);
      } else if (settings.laneCount < newLanes.length) {
        const overflow = newLanes.slice(settings.laneCount).flat();
        newLanes = newLanes.slice(0, settings.laneCount);
        p.waiting = [...(p.waiting || []), ...overflow];
      }
      return {
        ...p,
        name: settings.name,
        laneCount: settings.laneCount,
        capacity: settings.capacity,
        laneNaming: settings.laneNaming || p.laneNaming || "numeric",
        laneNames: settings.laneNames !== undefined ? settings.laneNames : (p.laneNames || {}),
        lanes: newLanes,
      };
    });
    showToast("Paramètres enregistrés.");
  };

  const handleResetParking = async () => {
    await updateActiveParking((p) => ({
      ...p,
      lanes: Array.from({ length: p.laneCount }, () => []),
      waiting: [],
      history: logMovement(p, "RESET", { message: "Vidange complète du parking" }),
    }));
    showToast("Parking vidé.");
  };

  const handleClearHistory = async () => {
    await updateActiveParking((p) => ({ ...p, history: [] }));
    showToast("Historique effacé.");
  };

  const handleAssignWaitingVehicle = async (vehicle) => {
    await updateActiveParking((p) => {
      const newWaiting = (p.waiting || []).filter((v) => v.id !== vehicle.id);
      const newLanes = p.lanes.map((l) => [...l]);
      const assign = assignLane(newLanes, p.capacity, vehicle, activeStrategy);
      if (!assign.waiting && assign.laneIndex !== -1) {
        newLanes[assign.laneIndex].splice(assign.insertIndex, 0, vehicle);
        showToast(`${vehicle.plate} placé en ${getLaneName(assign.laneIndex, p)}`);
      } else {
        newWaiting.push(vehicle);
        showToast("Aucune place disponible.", "error");
      }
      return { ...p, lanes: newLanes, waiting: newWaiting };
    });
  };

  const handleAutoAssignAllWaiting = async () => {
    await updateActiveParking((p) => {
      const newLanes = p.lanes.map((l) => [...l]);
      const stillWaiting = [];
      (p.waiting || []).forEach((veh) => {
        const assign = assignLane(newLanes, p.capacity, veh, activeStrategy);
        if (!assign.waiting && assign.laneIndex !== -1) newLanes[assign.laneIndex].splice(assign.insertIndex, 0, veh);
        else stillWaiting.push(veh);
      });
      showToast(`${(p.waiting || []).length - stillWaiting.length} véhicule(s) placé(s).`);
      return { ...p, lanes: newLanes, waiting: stillWaiting };
    });
  };

  const handleRemoveFromWaiting = async (vehicleId) => {
    await updateActiveParking((p) => ({ ...p, waiting: (p.waiting || []).filter((v) => v.id !== vehicleId) }));
  };

  // =========================================================================
  // Rendu — États de chargement & Authentification
  // =========================================================================

  if (authLoading) return <FullScreenLoader message="Vérification de votre session..." />;

  if (!currentUser) return <AuthPage onAuthenticated={(user) => setCurrentUser(user)} />;

  if (firestoreError) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-500 border border-rose-500/30 flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-black text-white mb-2">Erreur de Connexion Firestore</h2>
          <p className="text-sm text-slate-400 mb-6">{firestoreError}</p>
          <button onClick={() => logOut()} className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold transition-colors cursor-pointer">
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  if (parkingsLoading) return <FullScreenLoader message="Chargement de vos parkings..." />;

  if (parkings.length === 0) {
    return (
      <div className="min-h-screen bg-[#070e17] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Glow de fond Cyan & Emeraude */}
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-cyan-500/15 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl animate-pulse"></div>

        <div className="max-w-md w-full bg-slate-900/90 border border-slate-700/80 rounded-[32px] p-8 shadow-2xl text-center backdrop-blur-2xl animate-in fade-in slide-up relative z-10">
          <div className="inline-flex items-center justify-center mb-6 hover:scale-105 transition-transform duration-300 drop-shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            <ParkflowLogo size={72} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2 tracking-wide flex items-center justify-center gap-1">
            Bienvenue sur Park<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 font-extrabold ml-0.5">Flow</span>
          </h2>
          <p className="text-xs text-slate-400 font-medium mb-8 leading-relaxed">
            Vous n'avez accès à aucun parking pour le moment. Créez votre premier parc automobile ou rejoignez-en un via un code secret.
          </p>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setIsParkingsModalOpen(true)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-cyan-900/40 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] cursor-pointer"
            >
              <Plus size={18} /> Créer un Parking
            </button>
            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-200 font-bold text-sm shadow-inner transition-all flex items-center justify-center gap-2 hover:scale-[1.02] cursor-pointer"
            >
              <KeyRound size={18} /> Rejoindre avec un Code
            </button>
          </div>

          <button onClick={() => logOut()} className="mt-8 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
            Se déconnecter
          </button>
        </div>

        {/* Modales nécessaires pour l'état vide */}
        <ParkingsModal
          isOpen={isParkingsModalOpen}
          onClose={() => setIsParkingsModalOpen(false)}
          parkings={parkings}
          activeParkingId={null}
          currentUser={currentUser}
          onSelectParking={setActiveParkingId}
          onCreateParking={handleCreateParking}
          onDeleteParking={handleDeleteParking}
          onLeaveParking={handleLeaveParking}
        />
        <JoinParkingModal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} userId={currentUser?.uid} onParkingJoined={handleJoinedParking} />
      </div>
    );
  }

  const emptyParking = {
    id: null,
    name: "Chargement...",
    laneCount: 30,
    capacity: 10,
    laneNaming: "numeric",
    laneNames: {},
    lanes: Array.from({ length: 30 }, () => []),
    waiting: [],
    history: [],
  };
  const parking = activeParking || emptyParking;

  // =========================================================================
  // Rendu Principal
  // =========================================================================

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-600 selection:text-white font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className={`px-4 py-3 rounded-2xl border shadow-2xl text-xs font-bold flex items-center gap-2.5 ${
            toastMessage.type === "error"
              ? "bg-rose-950/95 border-rose-500 text-rose-200 shadow-rose-950/50"
              : "bg-slate-900/95 border-cyan-500/80 text-white shadow-cyan-950/60"
          }`}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            {toastMessage.message}
          </div>
        </div>
      )}

      <Navbar
        parkings={parkings}
        activeParking={parking}
        currentUser={currentUser}
        onSelectParking={setActiveParkingId}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => { setEditingVehicle(null); setTargetLaneForAdd(null); setIsAddModalOpen(true); }}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onExportExcel={() => exportParkingToExcel(parking)}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
        onOpenParkingsModal={() => setIsParkingsModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenJoinParking={() => setIsJoinModalOpen(true)}
        onOpenAccessCode={() => setIsAccessCodeModalOpen(true)}
        onLogOut={async () => { await logOut(); }}
      />

      <main className="flex-1 max-w-[1920px] w-full mx-auto px-4 sm:px-6 pt-5">
        <StatsBar
          parking={parking}
          filterUrgency={filterUrgency}
          setFilterUrgency={setFilterUrgency}
          activeStrategy={activeStrategy}
          setActiveStrategy={setActiveStrategy}
          onAutoRedistribute={handleAutoRedistributeAll}
          onOpenWaiting={() => setIsWaitingModalOpen(true)}
        />

        {activeTab === "grid" && (
          <ParkingGrid
            parking={parking}
            lanes={parking.lanes}
            capacity={parking.capacity}
            searchQuery={searchQuery}
            filterUrgency={filterUrgency}
            onExitVehicle={handleExitVehicle}
            onMoveVehicle={(vehicle) => { setMovingVehicle(vehicle); setIsMoveModalOpen(true); }}
            onEditVehicle={(vehicle) => { setEditingVehicle(vehicle); setIsAddModalOpen(true); }}
            onPrintTicket={(v, l, s) => { setTicketData({ vehicle: v, laneIndex: l, slotIndex: s }); setIsTicketModalOpen(true); }}
            onAddVehicleToLane={(laneIdx) => { setEditingVehicle(null); setTargetLaneForAdd(laneIdx); setIsAddModalOpen(true); }}
            onSortLane={handleSortLane}
            onDropVehicleToLane={handleDropVehicleToLane}
            onRenameLane={handleRenameLane}
            selectedVehicleId={selectedVehicleId}
            setSelectedVehicleId={setSelectedVehicleId}
          />
        )}

        {activeTab === "schedule" && (
          <DeparturesSchedule
            parking={parking}
            onExitVehicle={handleExitVehicle}
            onMoveVehicle={(vehicle) => { setMovingVehicle(vehicle); setIsMoveModalOpen(true); }}
            onPrintTicket={(v, l, s) => { setTicketData({ vehicle: v, laneIndex: l, slotIndex: s }); setIsTicketModalOpen(true); }}
            onEditVehicle={(vehicle) => { setEditingVehicle(vehicle); setIsAddModalOpen(true); }}
          />
        )}
      </main>

      {/* Modales */}
      <VehicleModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setEditingVehicle(null); setTargetLaneForAdd(null); }}
        onSave={handleSaveVehicle}
        editingVehicle={editingVehicle}
        targetLaneIndex={targetLaneForAdd}
        parking={parking}
      />
      <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImportVehicles={handleImportVehicles} />
      <MoveModal
        isOpen={isMoveModalOpen}
        onClose={() => { setIsMoveModalOpen(false); setMovingVehicle(null); }}
        vehicle={movingVehicle}
        parking={parking}
        lanes={parking.lanes}
        capacity={parking.capacity}
        onConfirmMove={handleConfirmMove}
      />
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={parking.history}
        parking={parking}
        onClearHistory={handleClearHistory}
        parkingName={parking.name}
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        parking={parking}
        databaseState={{}}
        currentUser={currentUser}
        onUpdateParkingSettings={handleUpdateParkingSettings}
        onRestoreDatabase={() => {}}
        onResetParking={handleResetParking}
        onDeleteParking={handleDeleteParking}
        onLeaveParking={handleLeaveParking}
      />
      <WaitingQueueModal isOpen={isWaitingModalOpen} onClose={() => setIsWaitingModalOpen(false)} waitingVehicles={parking.waiting || []} onAssignWaitingVehicle={handleAssignWaitingVehicle} onAutoAssignAllWaiting={handleAutoAssignAllWaiting} onRemoveFromWaiting={handleRemoveFromWaiting} />
      <TicketModal
        isOpen={isTicketModalOpen}
        onClose={() => { setIsTicketModalOpen(false); setTicketData(null); }}
        vehicle={ticketData?.vehicle}
        laneIndex={ticketData?.laneIndex}
        slotIndex={ticketData?.slotIndex}
        parking={parking}
        parkingName={parking.name}
      />
      <ParkingsModal
        isOpen={isParkingsModalOpen}
        onClose={() => setIsParkingsModalOpen(false)}
        parkings={parkings}
        activeParkingId={parking.id}
        currentUser={currentUser}
        onSelectParking={setActiveParkingId}
        onCreateParking={handleCreateParking}
        onDeleteParking={handleDeleteParking}
        onLeaveParking={handleLeaveParking}
      />
      <JoinParkingModal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} userId={currentUser?.uid} onParkingJoined={handleJoinedParking} />
      <AccessCodeModal isOpen={isAccessCodeModalOpen} onClose={() => setIsAccessCodeModalOpen(false)} parking={parking} userId={currentUser?.uid} />
    </div>
  );
}

