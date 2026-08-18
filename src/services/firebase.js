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
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_PROJECT.firebaseapp.com",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_PROJECT.appspot.com",
  messagingSenderId: "VOTRE_SENDER_ID",
  appId: "VOTRE_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
