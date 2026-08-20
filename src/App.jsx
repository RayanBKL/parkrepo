import React, { useState, useEffect, useMemo, useRef } from "react";
import { Plus, KeyRound, AlertCircle, LogOut, ArrowLeft, ChevronRight, Sparkles } from "lucide-react";

// Services Auth & Cloud
import { onAuthChange, logOut, getUserProfile } from "./services/auth";
import { auth } from "./services/firebase";
import {
  createParking,
  subscribeToParkingList,
  subscribeToParking,
  saveParkingData,
  deleteParking,
  leaveParking,
  getLaneName,
  generateAccessCode,
  updateParkingModel,
} from "./services/cloudDb";
import { getOrganization, getOrganizationByOwner, createOrganization } from "./services/organization";
import { assignLane, assignVehicleToParking, PARKING_MODELS, redistributeAllVehicles, generateVehicleId } from "./services/algorithm";
import { exportParkingToExcel } from "./services/excel";
import { logMovement } from "./services/db";

// Composants Publics
import LandingPage from "./components/public/LandingPage";
import PricingPage from "./components/public/PricingPage";
import SignupOnboarding from "./components/public/SignupOnboarding";
import LoginPage from "./components/public/LoginPage";
import LegalPages from "./components/public/LegalPages";
import PublicTicketView from "./components/public/PublicTicketView";
import SubscriptionExpiredView from "./components/app/SubscriptionExpiredView";
import EmailVerificationBlock from "./components/public/EmailVerificationBlock";
import AuroraPricing from "./components/public/AuroraPricing";

// Composants SaaS App
import Sidebar from "./components/app/Sidebar";
import DashboardView from "./components/app/DashboardView";
import VehiclesView from "./components/app/VehiclesView";
import RetrievalOptimizerView from "./components/app/RetrievalOptimizerView";
import AuditLogView from "./components/app/AuditLogView";
import AnalyticsView from "./components/app/AnalyticsView";
import SettingsView from "./components/app/SettingsView";
import ReservationsView from "./components/app/ReservationsView";

// Composants Existants Réutilisés
import StatsBar from "./components/StatsBar";
import ParkingGrid from "./components/ParkingGrid";
import DeparturesSchedule from "./components/DeparturesSchedule";
import VehicleModal from "./components/VehicleModal";
import ImportModal from "./components/ImportModal";
import MoveModal from "./components/MoveModal";
import TicketModal from "./components/TicketModal";
import ParkingsModal from "./components/ParkingsModal";
import { JoinParkingModal } from "./components/AccessCodeModals";


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
  // --- Navigation Publique (si non connecté) ---
  const [publicPage, setPublicPage] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("ticket")) return "ticket";
    return "home";
  }); // "home" | "pricing" | "signup" | "login" | "ticket"
  const [ticketIdParam] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("ticket");
  });
  const [selectedPlanForSignup, setSelectedPlanForSignup] = useState("business");

  // --- État d'Authentification & SaaS ---
  const [currentUser, setCurrentUser] = useState(undefined);
  const [userProfile, setUserProfile] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // --- État des Parkings (Cloud) ---
  const [parkings, setParkings] = useState([]);
  const [activeParkingId, setActiveParkingId] = useState(null);
  const [parkingsLoading, setParkingsLoading] = useState(false);

  // --- Vue SaaS Active (si connecté) ---
  const [activeView, setActiveView] = useState("dashboard"); // "dashboard" | "parkings" | "vehicles" | "schedule" | "retrieval" | "history" | "analytics" | "settings"
  const [activeTab, setActiveTab] = useState("grid"); // "grid" | "schedule" dans la vue Parkings
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
  const [isParkingsModalOpen, setIsParkingsModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  // Subscriptions refs
  const unsubParkingListRef = useRef(null);

  // --- Toast helper ---
  const showToast = (message, type = "success") => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // --- Navigation Fluide avec Historique Navigateur ---
  const handleNavigatePublic = (page) => {
    setPublicPage(page);
    window.history.pushState({ publicPage: page }, "");
  };

  const handleNavigateView = (view) => {
    setActiveView(view);
    window.history.pushState({ activeView: view }, "");
  };

  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state) {
        if (e.state.publicPage) setPublicPage(e.state.publicPage);
        if (e.state.activeView) setActiveView(e.state.activeView);
      }
    };
    window.addEventListener("popstate", handlePopState);

    // Vérifier les redirections Stripe
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      showToast("Paiement validé avec succès ! Redirection en cours...", "success");
      // On nettoie l'URL
      window.history.replaceState({}, document.title, "/");
    } else if (params.get("payment") === "cancel") {
      showToast("Le paiement a été annulé.", "error");
      window.history.replaceState({}, document.title, "/");
    }

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // --- Active Parking ---
  const activeParking = useMemo(() => {
    if (!activeParkingId || parkings.length === 0) return null;
    return parkings.find((p) => p.id === activeParkingId) || parkings[0] || null;
  }, [parkings, activeParkingId]);

  // =========================================================================
  // Authentification & Chargement Organisation / Profil
  // =========================================================================

  const refreshUserData = async (user) => {
    if (!user) {
      setUserProfile(null);
      setOrganization(null);
      return;
    }

    try {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);

      let org = null;
      if (profile?.organizationId) {
        org = await getOrganization(profile.organizationId);
      }
      if (!org) {
        org = await getOrganizationByOwner(user.uid);
      }

      if (org) {
        setOrganization(org);
        if (profile?.organizationId !== org.id) {
          const { updateUserRoleAndStatus } = await import("./services/auth");
          await updateUserRoleAndStatus(user.uid, {
            organizationId: org.id,
            role: profile?.role || "OWNER",
          });
        }
        return org;
      } else {
        // Migration automatique pour les comptes existants : création d'une organisation par défaut
        const fallbackOrg = await createOrganization({
          name: profile?.displayName ? `Organisation de ${profile.displayName}` : "Mon Entreprise",
          email: user.email,
          ownerId: user.uid,
          plan: "business",
        });
        setOrganization(fallbackOrg);
        const { updateUserRoleAndStatus } = await import("./services/auth");
        await updateUserRoleAndStatus(user.uid, {
          organizationId: fallbackOrg.id,
          role: profile?.role || "OWNER",
        });
        return fallbackOrg;
      }
    } catch (err) {
      console.warn("Could not load user profile / organization:", err);
      return null;
    }
  };

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (user) {
        // ---------------------------------------------------------------
        // Vérification critique : forcer le refresh du token Firebase.
        // Si le compte a été supprimé depuis la console Firebase,
        // getIdToken(true) lève une exception (auth/user-token-expired
        // ou auth/user-not-found) et on force la déconnexion.
        // ---------------------------------------------------------------
        try {
          await user.getIdToken(true);
        } catch (tokenErr) {
          console.warn("Token invalide ou compte supprimé, déconnexion forcée:", tokenErr.code);
          // Nettoyer la session locale Firebase
          try { await auth.signOut(); } catch (_) {}
          // onAuthStateChanged sera rappelé avec user=null → redirect automatique
          return;
        }

        setCurrentUser(user);
        setAuthLoading(false);
        setParkingsLoading(true);
        const org = await refreshUserData(user);

        // Abonnement temps réel à la liste des parkings uniquement si l'organisation est active
        if (org && org.status !== "PENDING_PAYMENT") {
          if (unsubParkingListRef.current) unsubParkingListRef.current();
          unsubParkingListRef.current = subscribeToParkingList(
            user.uid,
            (updatedParkings) => {
              setParkings(updatedParkings);
              setParkingsLoading(false);

              if (updatedParkings.length > 0) {
                setActiveParkingId((prev) => {
                  if (prev && updatedParkings.some((p) => p.id === prev)) return prev;
                  return updatedParkings[0].id;
                });
              }
            },
            (err) => {
              console.error("Parkings subscribe error:", err);
              setParkingsLoading(false);
            }
          );
        } else {
          setParkingsLoading(false);
        }
      } else {
        setCurrentUser(null);
        setAuthLoading(false);
        setParkings([]);
        setActiveParkingId(null);
        if (unsubParkingListRef.current) {
          unsubParkingListRef.current();
          unsubParkingListRef.current = null;
        }
      }
    });

    return () => {
      unsub();
      if (unsubParkingListRef.current) unsubParkingListRef.current();
    };
  }, []);

  // =========================================================================
  // Opérations Véhicules & Parkings
  // =========================================================================

  const updateActiveParking = async (updaterFn) => {
    if (!activeParking) return;
    const updated = updaterFn(activeParking);
    const success = await saveParkingData(activeParking.id, updated);
    if (!success) {
      showToast("Erreur de synchronisation avec le cloud.", "error");
    }
    return success;
  };

  // Enregistrer ou modifier un véhicule
  const handleSaveVehicle = async (vehicleData, directLaneIndex = null) => {
    const isEdit = !!editingVehicle;
    const authorName = userProfile?.displayName || currentUser?.email || "Voiturier";

    // Vérification de quota du plan d'abonnement (uniquement à l'ajout d'un nouveau véhicule)
    if (!isEdit && activeParking) {
      const currentCarsCount = (activeParking.lanes || []).reduce((acc, l) => acc + l.length, 0) + (activeParking.waiting || []).length;
      const maxVehicles = organization?.subscription?.maxVehicles || PLANS_CONFIG.starter.maxVehicles;
      if (currentCarsCount >= maxVehicles) {
        showToast(`Limite du plan atteinte (${currentCarsCount}/${maxVehicles} véhicules). Passez à l'offre supérieure.`, "error");
        return;
      }
    }

    await updateActiveParking((p) => {
      let newLanes = p.lanes.map((l) => [...l]);
      let newWaiting = [...(p.waiting || [])];

      if (isEdit) {
        newLanes = newLanes.map((lane) =>
          lane.map((v) => (v.id === vehicleData.id ? { ...v, ...vehicleData } : v))
        );
        newWaiting = newWaiting.map((v) =>
          v.id === vehicleData.id ? { ...v, ...vehicleData } : v
        );
      } else {
        // Placement direct ou optimisé
        if (directLaneIndex !== null && directLaneIndex !== undefined) {
          const lane = newLanes[directLaneIndex] || [];
          if (lane.length < p.capacity) {
            let insertIdx = lane.findIndex(
              (v) => new Date(v.departure).getTime() > new Date(vehicleData.departure).getTime()
            );
            if (insertIdx === -1) insertIdx = lane.length;
            newLanes[directLaneIndex].splice(insertIdx, 0, vehicleData);
          } else {
            newWaiting.push(vehicleData);
          }
        } else {
          const assignment = assignVehicleToParking(newLanes, p.capacity, vehicleData, p.model || PARKING_MODELS.LIFO, activeStrategy);
          if (assignment.waiting || assignment.laneIndex === -1) {
            newWaiting.push(vehicleData);
          } else {
            newLanes[assignment.laneIndex].splice(assignment.insertIndex, 0, vehicleData);
          }
        }
      }

      const actionType = isEdit ? "EDIT" : "ADD";
      const detailMsg = isEdit
        ? `Modification véhicule ${vehicleData.plate}`
        : `Entrée véhicule ${vehicleData.plate} (${vehicleData.model})`;

      return {
        ...p,
        lanes: newLanes,
        waiting: newWaiting,
        history: logMovement(p, actionType, {
          plate: vehicleData.plate,
          model: vehicleData.model,
          message: detailMsg,
          user: authorName,
        }),
      };
    });

    setEditingVehicle(null);
    setTargetLaneForAdd(null);
    showToast(`Véhicule ${vehicleData.plate} enregistré !`);
  };

  // Sortie d'un véhicule
  const handleExitVehicle = async (vehicle) => {
    let exitedLaneIndex = -1;
    const authorName = userProfile?.displayName || currentUser?.email || "Voiturier";

    await updateActiveParking((p) => {
      let newLanes = p.lanes.map((lane, idx) => {
        return lane.filter((v) => {
          if (v.id === vehicle.id) {
            exitedLaneIndex = idx;
            return false;
          }
          return true;
        });
      });
      let newWaiting = [...(p.waiting || [])];

      if (newWaiting.length > 0) {
        const nextWaiting = newWaiting[0];
        const assign = assignVehicleToParking(newLanes, p.capacity, nextWaiting, p.model || PARKING_MODELS.LIFO, activeStrategy);
        if (!assign.waiting && assign.laneIndex !== -1) {
          newLanes[assign.laneIndex].splice(assign.insertIndex, 0, nextWaiting);
          newWaiting.shift();
        }
      }

      const archivedRecord = {
        ...vehicle,
        exitedAt: new Date().toISOString(),
        exitedBy: authorName,
        exitedLane: exitedLaneIndex,
      };

      const prevArchived = Array.isArray(p.archivedVehicles) ? p.archivedVehicles : [];
      const updatedArchived = [archivedRecord, ...prevArchived].slice(0, 1000);

      return {
        ...p,
        lanes: newLanes,
        waiting: newWaiting,
        archivedVehicles: updatedArchived,
        history: logMovement(p, "EXIT", {
          plate: vehicle.plate,
          model: vehicle.model,
          lane: exitedLaneIndex,
          message: `Sortie du véhicule ${vehicle.plate}`,
          user: authorName,
        }),
      };
    });

    showToast(`Véhicule ${vehicle.plate} sorti du parc !`);
  };

  // Déplacer un véhicule
  const handleConfirmMove = async (vehicle, targetLaneIdx) => {
    const authorName = userProfile?.displayName || currentUser?.email || "Voiturier";
    await updateActiveParking((p) => {
      let oldLaneIdx = -1;
      let newLanes = p.lanes.map((lane, idx) => {
        const filtered = lane.filter((v) => {
          if (v.id === vehicle.id) {
            oldLaneIdx = idx;
            return false;
          }
          return true;
        });
        return filtered;
      });

      const destLane = newLanes[targetLaneIdx] || [];
      let insertIdx = destLane.findIndex(
        (v) => new Date(v.departure).getTime() > new Date(vehicle.departure).getTime()
      );
      if (insertIdx === -1) insertIdx = destLane.length;
      destLane.splice(insertIdx, 0, vehicle);
      newLanes[targetLaneIdx] = destLane;

      return {
        ...p,
        lanes: newLanes,
        history: logMovement(p, "MOVE", {
          plate: vehicle.plate,
          fromLane: oldLaneIdx,
          toLane: targetLaneIdx,
          message: `Déplacement ${vehicle.plate} de ${getLaneName(oldLaneIdx, p)} vers ${getLaneName(targetLaneIdx, p)}`,
          user: authorName,
        }),
      };
    });

    setMovingVehicle(null);
    setIsMoveModalOpen(false);
    showToast(`Véhicule ${vehicle.plate} déplacé vers ${getLaneName(targetLaneIdx, activeParking)} !`);
  };

  // Réorganisation optimisée complète
  const handleApplyRedistribution = async (optimizedLanes, waitingQueue, newStrategy) => {
    const authorName = userProfile?.displayName || currentUser?.email || "Gérant";
    await updateActiveParking((p) => ({
      ...p,
      lanes: optimizedLanes,
      waiting: waitingQueue,
      history: logMovement(p, "REDISTRIBUTE", {
        message: `Réorganisation globale des voies (Stratégie : ${newStrategy})`,
        user: authorName,
      }),
    }));

    showToast("Parc réorganisé de manière optimale !");
  };

  // Importer des véhicules
  const handleImportVehicles = async (newVehicles) => {
    const authorName = userProfile?.displayName || currentUser?.email || "Import Excel";
    await updateActiveParking((p) => {
      const allVehicles = [...p.lanes.flat(), ...newVehicles];
      const result = redistributeAllVehicles(allVehicles, p.laneCount, p.capacity, activeStrategy);

      return {
        ...p,
        lanes: result.lanes,
        waiting: result.waiting,
        history: logMovement(p, "IMPORT", {
          message: `Importation de ${newVehicles.length} véhicules via Excel`,
          user: authorName,
        }),
      };
    });

    setIsImportModalOpen(false);
    showToast(`${newVehicles.length} véhicules importés avec succès !`);
  };

  // Création d'un nouveau parking
  const handleCreateParking = async (config) => {
    if (!currentUser) return;
    const authorName = userProfile?.displayName || currentUser?.email || "Gérant";
    const newPkg = await createParking(currentUser.uid, {
      ...config,
      organizationId: organization?.id || null,
      userName: authorName,
    });
    setActiveParkingId(newPkg.id);
    setIsParkingsModalOpen(false);
    showToast(`Parking "${newPkg.name}" créé avec succès !`);
  };

  // Supprimer définitivement
  const handleDeleteParking = async (parkingId) => {
    if (!currentUser) return;
    await deleteParking(parkingId, currentUser.uid);
    showToast("Parking supprimé définitivement.");
  };

  // Quitter / Supprimer de son compte
  const handleLeaveParking = async (parkingId) => {
    if (!currentUser) return;
    await leaveParking(parkingId, currentUser.uid);
    showToast("Parking retiré de votre compte.");
  };

  // Renommer une voie
  const handleRenameLane = async (laneIdx, newName) => {
    await updateActiveParking((p) => {
      const currentNames = { ...(p.laneNames || {}) };
      if (!newName || !newName.trim()) {
        delete currentNames[laneIdx];
      } else {
        currentNames[laneIdx] = newName.trim();
      }
      return {
        ...p,
        laneNames: currentNames,
      };
    });
    showToast(`Voie mise à jour : ${newName || `Voie ${laneIdx + 1}`}`);
  };

  // =========================================================================
  // RENDU CONDITIONNEL : Site Public vs SaaS Connecté
  // =========================================================================

  if (authLoading) {
    return <FullScreenLoader message="Vérification de session..." />;
  }

  // Utilisateur NON connecté -> Affichage des pages publiques
  if (!currentUser) {
    if (publicPage.startsWith("legal-")) {
      const tab = publicPage.replace("legal-", "");
      return <LegalPages onNavigate={handleNavigatePublic} initialTab={tab} />;
    }

    if (publicPage === "pricing") {
      return (
        <PricingPage
          onNavigate={handleNavigatePublic}
          onSelectPlan={(planId) => {
            setSelectedPlanForSignup(planId);
            handleNavigatePublic("signup");
          }}
        />
      );
    }

    if (publicPage === "signup") {
      return (
        <SignupOnboarding
          onNavigate={handleNavigatePublic}
          initialPlan={selectedPlanForSignup}
          onComplete={async ({ user }) => {
            setCurrentUser(user);
            await refreshUserData(user);
            handleNavigateView("dashboard");
          }}
        />
      );
    }

    if (publicPage === "login") {
      return (
        <LoginPage
          onNavigate={handleNavigatePublic}
          onLoginSuccess={async (user) => {
            setCurrentUser(user);
            await refreshUserData(user);
            handleNavigateView("dashboard");
          }}
        />
      );
    }

    if (publicPage === "ticket") {
      return <PublicTicketView ticketId={ticketIdParam} />;
    }

    // Par défaut : Landing Page
    return <LandingPage onNavigate={handleNavigatePublic} />;
  }

  // Utilisateur DÉSACTIVÉ par son gérant
  if (userProfile?.status === "disabled") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-rose-500/40 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-xl font-black text-white">Compte Désactivé</h2>
          <p className="text-xs text-slate-300">
            L'accès à votre compte a été suspendu par le gérant de votre organisation. Veuillez contacter votre administrateur.
          </p>
          <button
            onClick={() => logOut()}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  // Abonnement ANNULÉ
  if (organization?.status === "CANCELED" && activeTab !== "settings") {
    return (
      <SubscriptionExpiredView
        onManageBilling={() => handleNavigateView("settings")}
        onLogout={() => logOut()}
      />
    );
  }

  // =========================================================================
  // APPLICATION SAAS B2B (Connecté)
  // =========================================================================

  if (!currentUser.emailVerified) {
    return <EmailVerificationBlock user={currentUser} />;
  }

  if (organization?.status === "PENDING_PAYMENT") {
    return <AuroraPricing organization={organization} currentUser={currentUser} />;
  }

  const viewTitles = {
    parkings: "Gestion des Voies & Parkings",
    vehicles: "Gestionnaire de Flotte & Véhicules",
    schedule: "Planning des Arrivées & Départs",
    retrieval: "Assistant de Récupération Optimisée",
    history: "Journal d'Activité & Audit",
    analytics: "Statistiques & Performance",
    settings: "Paramètres de l'Organisation",
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans antialiased selection:bg-cyan-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div
            className={`px-5 py-3 rounded-2xl border shadow-2xl text-xs font-bold flex items-center gap-2 backdrop-blur-xl ${
              toastMessage.type === "error"
                ? "bg-rose-950/90 border-rose-500/50 text-rose-200"
                : "bg-slate-900/95 border-cyan-500/50 text-cyan-200 shadow-cyan-950/50"
            }`}
          >
            {toastMessage.type === "error" ? <AlertCircle size={16} className="text-rose-400" /> : <Sparkles size={16} className="text-cyan-400" />}
            <span>{toastMessage.message}</span>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        activeView={activeView}
        setActiveView={handleNavigateView}
        organization={organization}
        currentUser={currentUser}
        userProfile={userProfile}
        parkings={parkings}
        activeParking={activeParking}
        onSelectParking={setActiveParkingId}
        onOpenParkingsModal={() => setIsParkingsModalOpen(true)}
        onLogOut={async () => {
          await logOut();
          handleNavigatePublic("home");
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <main className="flex-1 max-w-[1920px] w-full mx-auto px-4 sm:px-8 pt-6 pb-12">

          {/* ============================================================= */}
              {/* BANDEAU D'ESSAI 7 JOURS (accès débloqué, carte enregistrée)   */}
              {/* ============================================================= */}
              {(organization?.subscription?.status === "trialing" || organization?.subscription?.trialEndsAt) && (
                <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold shadow-lg">
                  <div className="flex items-center gap-2.5">
                    <Sparkles size={16} className="text-emerald-400 shrink-0" />
                    <span>
                      ✨ <strong>Version d&apos;essai 7 jours</strong> — Validez votre abonnement ou résiliez-le à tout moment
                      {organization.subscription.trialEndsAt && (
                        <> (Premier débit automatique le <strong className="text-white">{new Date(organization.subscription.trialEndsAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</strong>)</>
                      )}
                    </span>
                  </div>
                  <button
                    onClick={() => handleNavigateView("settings")}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                  >
                    Gérer mon abonnement →
                  </button>
                </div>
              )}

              {/* Barre de retour rapide & Fil d'Ariane pour les sous-vues */}
              {activeView !== "dashboard" && (
            <div className="mb-4 flex items-center justify-between gap-3 text-xs">
              <button
                onClick={() => handleNavigateView("dashboard")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer shadow-inner"
              >
                <ArrowLeft size={14} className="text-cyan-400" />
                <span>Retour au Tableau de Bord</span>
              </button>

              <div className="hidden sm:flex items-center gap-2 text-slate-500 font-medium">
                <span className="cursor-pointer hover:text-slate-300" onClick={() => handleNavigateView("dashboard")}>Dashboard</span>
                <ChevronRight size={12} />
                <span className="text-cyan-400 font-bold uppercase tracking-wider text-[11px]">{viewTitles[activeView] || activeView}</span>
              </div>
            </div>
          )}

          {/* VUE 1 : DASHBOARD */}
          {activeView === "dashboard" && (
            <DashboardView
              organization={organization}
              parkings={parkings}
              activeParking={activeParking}
              onNavigateView={handleNavigateView}
              onOpenAddModal={() => {
                setEditingVehicle(null);
                setTargetLaneForAdd(null);
                setIsAddModalOpen(true);
              }}
              onSelectVehicleForRetrieval={(vId) => {
                setSelectedVehicleId(vId);
                handleNavigateView("retrieval");
              }}
            />
          )}

          {/* VUE 2 : PARKINGS (GRILLE 2D & PLANNING) */}
          {activeView === "parkings" && activeParking && (
            <div className="space-y-6">
              {/* Stats Bar & Strategy Switcher */}
              <StatsBar
                parking={activeParking}
                filterUrgency={filterUrgency}
                setFilterUrgency={setFilterUrgency}
                activeStrategy={activeStrategy}
                setActiveStrategy={setActiveStrategy}
                onAutoRedistribute={() => {
                  const result = redistributeAllVehicles(
                    activeParking.lanes.flat(),
                    activeParking.laneCount,
                    activeParking.capacity,
                    activeStrategy
                  );
                  handleApplyRedistribution(result.lanes, result.waiting, activeStrategy);
                }}
                onOpenWaiting={() => {}}
              />

              {/* View Selector Tabs (Voies vs Planning) */}
              <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-slate-800">
                <div className="flex items-center bg-slate-900/80 p-1.5 rounded-full border border-slate-800 shadow-inner">
                  <button
                    onClick={() => setActiveTab("grid")}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      activeTab === "grid"
                        ? "bg-cyan-600 text-white shadow-lg shadow-cyan-950/50"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Vue Voies (Grille 2D)
                  </button>
                  <button
                    onClick={() => setActiveTab("schedule")}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      activeTab === "schedule"
                        ? "bg-cyan-600 text-white shadow-lg shadow-cyan-950/50"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Planning des Départs
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Importer Excel
                  </button>
                  <button
                    onClick={() => exportParkingToExcel(activeParking)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Exporter Excel
                  </button>
                  <button
                    onClick={() => {
                      setEditingVehicle(null);
                      setTargetLaneForAdd(null);
                      setIsAddModalOpen(true);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white text-xs font-black shadow-lg shadow-cyan-950/50 cursor-pointer"
                  >
                    + Véhicule
                  </button>
                </div>
              </div>

              {/* Grille 2D */}
              {activeTab === "grid" && (
                <ParkingGrid
                  parking={activeParking}
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
                  onPrintTicket={(v, l, s) => {
                    setTicketData({ vehicle: v, laneIndex: l, slotIndex: s });
                    setIsTicketModalOpen(true);
                  }}
                  onAddVehicleToLane={(laneIdx) => {
                    setEditingVehicle(null);
                    setTargetLaneForAdd(laneIdx);
                    setIsAddModalOpen(true);
                  }}
                  onSortLane={() => {}}
                  onDropVehicleToLane={handleConfirmMove}
                  onRenameLane={handleRenameLane}
                  selectedVehicleId={selectedVehicleId}
                  setSelectedVehicleId={setSelectedVehicleId}
                />
              )}

              {/* Planning Départs */}
              {activeTab === "schedule" && (
                <DeparturesSchedule
                  parking={activeParking}
                  onExitVehicle={handleExitVehicle}
                  onMoveVehicle={(vehicle) => {
                    setMovingVehicle(vehicle);
                    setIsMoveModalOpen(true);
                  }}
                  onPrintTicket={(v, l, s) => {
                    setTicketData({ vehicle: v, laneIndex: l, slotIndex: s });
                    setIsTicketModalOpen(true);
                  }}
                  onEditVehicle={(vehicle) => {
                    setEditingVehicle(vehicle);
                    setIsAddModalOpen(true);
                  }}
                />
              )}
            </div>
          )}

          {/* VUE 3 : VÉHICULES (FLOTTE TABULAIRE) */}
          {activeView === "vehicles" && activeParking && (
            <VehiclesView
              parking={activeParking}
              onOpenAddModal={() => {
                setEditingVehicle(null);
                setTargetLaneForAdd(null);
                setIsAddModalOpen(true);
              }}
              onEditVehicle={(v) => {
                setEditingVehicle(v);
                setIsAddModalOpen(true);
              }}
              onMoveVehicle={(v) => {
                setMovingVehicle(v);
                setIsMoveModalOpen(true);
              }}
              onExitVehicle={handleExitVehicle}
              onPrintTicket={(v, l, s) => {
                setTicketData({ vehicle: v, laneIndex: l, slotIndex: s });
                setIsTicketModalOpen(true);
              }}
              onSelectVehicleForRetrieval={(vId) => setSelectedVehicleId(vId)}
              onNavigateView={setActiveView}
            />
          )}

          {/* VUE 4 : ARRIVÉES & DÉPARTS */}
          {activeView === "schedule" && activeParking && (
            <DeparturesSchedule
              parking={activeParking}
              onExitVehicle={handleExitVehicle}
              onMoveVehicle={(vehicle) => {
                setMovingVehicle(vehicle);
                setIsMoveModalOpen(true);
              }}
              onPrintTicket={(v, l, s) => {
                setTicketData({ vehicle: v, laneIndex: l, slotIndex: s });
                setIsTicketModalOpen(true);
              }}
              onEditVehicle={(vehicle) => {
                setEditingVehicle(vehicle);
                setIsAddModalOpen(true);
              }}
            />
          )}


          {/* VUE 5 : RÉCUPÉRATION OPTIMISÉE (DÉBLOCAGE) */}
          {activeView === "retrieval" && activeParking && (
            <RetrievalOptimizerView
              parking={activeParking}
              selectedVehicleId={selectedVehicleId}
              onExitVehicle={handleExitVehicle}
              onMoveVehicle={(v) => {
                setMovingVehicle(v);
                setIsMoveModalOpen(true);
              }}
            />
          )}

          {/* VUE 6 : JOURNAL D'ACTIVITÉ / AUDIT */}
          {activeView === "history" && activeParking && (
            <AuditLogView parking={activeParking} parkings={parkings} />
          )}

          {/* VUE 8 : STATISTIQUES & PERFORMANCE */}
          {activeView === "analytics" && (
            <AnalyticsView parking={activeParking} parkings={parkings} />
          )}

          {/* VUE 9 : PARAMÈTRES (ORGANISATION, ÉQUIPE, ABONNEMENT) */}
          {activeView === "settings" && (
            <SettingsView
              organization={organization}
              setOrganization={setOrganization}
              currentUser={currentUser}
              userProfile={userProfile}
              parkings={parkings}
              activeParking={activeParking}
              onUpdateParkingModel={async (parkingId, model) => {
                await updateParkingModel(parkingId, model);
                showToast(`Modèle mis à jour : ${model === "lifo" ? "Enfilade" : model === "fifo" ? "Drive-Through" : "Bidirectionnel"} ✅`);
              }}
              onRefreshOrg={() => refreshUserData(currentUser)}
            />
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODALES OPÉRATIONNELLES */}
      {/* ========================================================================= */}

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
        parking={activeParking}
        activeStrategy={activeStrategy}
        organization={organization}
      />

      <MoveModal
        isOpen={isMoveModalOpen}
        onClose={() => {
          setIsMoveModalOpen(false);
          setMovingVehicle(null);
        }}
        vehicle={movingVehicle}
        parking={activeParking}
        lanes={activeParking?.lanes || []}
        capacity={activeParking?.capacity || 10}
        onConfirmMove={handleConfirmMove}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportVehicles={handleImportVehicles}
      />

      <TicketModal
        isOpen={isTicketModalOpen}
        onClose={() => {
          setIsTicketModalOpen(false);
          setTicketData(null);
        }}
        ticketData={ticketData}
        parking={activeParking}
        parkingName={activeParking?.name}
      />

      <ParkingsModal
        isOpen={isParkingsModalOpen}
        onClose={() => setIsParkingsModalOpen(false)}
        parkings={parkings}
        activeParkingId={activeParking?.id}
        currentUser={currentUser}
        organization={organization}
        onSelectParking={setActiveParkingId}
        onCreateParking={handleCreateParking}
        onDeleteParking={handleDeleteParking}
        onLeaveParking={handleLeaveParking}
        onParkingJoined={(pkgId) => {
          setActiveParkingId(pkgId);
          setIsParkingsModalOpen(false);
        }}
      />

      <JoinParkingModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        userId={currentUser?.uid}
        onParkingJoined={(pkgId) => {
          setActiveParkingId(pkgId);
          setIsJoinModalOpen(false);
        }}
      />
    </div>
  );
}
