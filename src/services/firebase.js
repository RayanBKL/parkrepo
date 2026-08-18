// ---------------------------------------------------------------------------
// Firebase Configuration — À remplir avec vos propres clés Firebase
// ---------------------------------------------------------------------------
// INSTRUCTIONS POUR CONFIGURER FIREBASE :
// 1. Allez sur https://console.firebase.google.com
// 2. Créez un nouveau projet (ex: "ParkOptimizer")
// 3. Cliquez sur "Ajouter une application Web" (</>)
// 4. Copiez les valeurs de firebaseConfig ci-dessous
// 5. Activez Authentication → Email/Mot de passe
// 6. Créez la base Firestore → Mode Production
// 7. Copiez les règles de sécurité depuis FIRESTORE_RULES.md
// ---------------------------------------------------------------------------

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ⚠️ REMPLACEZ CES VALEURS PAR VOTRE CONFIG FIREBASE ⚠️
const firebaseConfig = {
  apiKey: "AIzaSyCS2zuLBV4e5-sLnvB_o3SdktLEZrG3RDA",
  authDomain: "parkoptimizer-6838a.firebaseapp.com",
  projectId: "parkoptimizer-6838a",
  storageBucket: "parkoptimizer-6838a.firebasestorage.app",
  messagingSenderId: "1024606622666",
  appId: "1:1024606622666:web:08604ed23985ffcd5cf533"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
