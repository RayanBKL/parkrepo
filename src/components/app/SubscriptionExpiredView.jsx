import React from "react";
import { AlertCircle, CreditCard, LogOut } from "lucide-react";

export default function SubscriptionExpiredView({ onManageBilling, onLogout }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 p-6 min-h-screen z-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-10 h-10" />
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Abonnement Annulé</h2>
          <p className="text-gray-600">
            L'accès à votre espace de travail a été suspendu car votre abonnement est annulé ou le paiement a échoué.
          </p>
        </div>

        <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl text-sm text-orange-800 text-left">
          Vos données sont conservées, mais vous devez souscrire à un nouveau plan pour réactiver votre accès et celui de vos collaborateurs.
        </div>

        <div className="pt-4 flex flex-col space-y-3">
          <button
            onClick={onManageBilling}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            <CreditCard className="w-5 h-5" />
            Gérer la facturation
          </button>
          
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
