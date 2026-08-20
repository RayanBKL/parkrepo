import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Zap, Loader2 } from 'lucide-react';
import { httpsCallable } from "firebase/functions";
import { functions } from "../../services/firebase";

const cn = (...classes) => classes.filter(Boolean).join(' ');

export default function AuroraPricing({ organization, currentUser }) {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [loadingPlan, setLoadingPlan] = useState(null);

  const plans = [
    {
      id: "starter",
      name: 'Starter',
      price: { monthly: 129, yearly: 1290 },
      description: 'Pour les petits parkings indépendants.',
      features: ['1 parking géré', 'Jusqu\'à 300 véhicules', '5 comptes utilisateurs', 'Support standard'],
      isFeatured: false,
    },
    {
      id: "business",
      name: 'Business',
      price: { monthly: 199, yearly: 1990 },
      description: 'Idéal pour la majorité des opérations.',
      features: ['1 parking géré', 'Jusqu\'à 600 véhicules', '10 comptes utilisateurs', 'Support prioritaire', 'Statistiques avancées'],
      isFeatured: true,
    },
    {
      id: "pro",
      name: 'Pro',
      price: { monthly: 299, yearly: 2990 },
      description: 'Pour les flottes à haute rotation.',
      features: ['Jusqu\'à 3 parkings', '1000 véhicules par parc', '20 comptes utilisateurs', 'API & Intégrations', 'Récupération Optimisée (IA)'],
      isFeatured: false,
    },
  ];

  const handleSubscribe = async (planId) => {
    if (!organization || !currentUser) return;
    setLoadingPlan(planId);
    try {
      const createCheckout = httpsCallable(functions, "createStripeCheckout");
      const { data } = await createCheckout({
        orgId: organization.id,
        planId: planId,
        billingCycle: billingCycle === 'yearly' ? 'annually' : 'monthly',
        trialDays: 7, // 7 days trial
        origin: window.location.origin,
      });
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Erreur Checkout:", err);
      alert("Une erreur est survenue lors de la connexion au paiement. Veuillez réessayer.");
      setLoadingPlan(null);
    }
  };

  const fadeUpVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.15 + 0.3,
        duration: 0.6,
        ease: "easeInOut",
      },
    }),
  };

  return (
    <div className="relative w-full min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden font-sans">
      {/* The interactive gradient background */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="aurora-bg">
          <div className="aurora-shape-1"></div>
          <div className="aurora-shape-2"></div>
        </div>
      </div>
      <style>{`
        .aurora-bg { position: absolute; inset: 0; filter: blur(100px); }
        .aurora-shape-1, .aurora-shape-2 { position: absolute; border-radius: 50%; }
        .aurora-shape-1 { width: 600px; height: 600px; background-color: rgba(6, 182, 212, 0.5); top: -10%; left: -10%; animation: moveAurora1 20s infinite alternate ease-in-out; }
        .aurora-shape-2 { width: 500px; height: 500px; background-color: rgba(16, 185, 129, 0.5); bottom: -10%; right: -10%; animation: moveAurora2 25s infinite alternate ease-in-out; }
        @keyframes moveAurora1 { from { transform: translate(0, 0) rotate(0deg); } to { transform: translate(100px, 50px) rotate(180deg); } }
        @keyframes moveAurora2 { from { transform: translate(0, 0) rotate(0deg); } to { transform: translate(-100px, -50px) rotate(-180deg); } }
        
        .card-aurora, .card-aurora-featured {
          background-size: 300% 300%;
          animation: gradient-animation 10s ease infinite;
          filter: blur(50px);
        }
        .card-aurora { background-image: linear-gradient(45deg, #0891b2, #059669); }
        .card-aurora-featured { background-image: linear-gradient(45deg, #0ea5e9, #10b981); }
        [class*="card-aurora"] { transition: opacity 0.5s ease; }
        .group:hover .card-aurora, .group:hover .card-aurora-featured,
        div:hover > .card-aurora, div:hover > .card-aurora-featured {
          opacity: 0.3;
        }
        @keyframes gradient-animation {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <div className="relative z-10 flex flex-col items-center text-center mt-12 mb-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6"
        >
          <Zap className="h-4 w-4 text-cyan-400" />
          <span className="text-sm font-medium text-cyan-200">
            Abonnement Requis
          </span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: "easeInOut" }}
          className="text-4xl md:text-6xl font-black tracking-tight mb-4 text-white"
        >
          Finalisez votre inscription
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
          className="text-slate-400 max-w-lg mb-8"
        >
          Votre compte est créé ! Choisissez un plan pour activer ParkOptimizer et profiter de 7 jours d'essai gratuits.
        </motion.p>

        {/* Billing Cycle Toggle */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8, ease: "easeInOut" }}
          className="flex items-center justify-center space-x-4"
        >
          <span className={cn("text-sm font-bold", billingCycle === 'monthly' ? 'text-white' : 'text-slate-500')}>Mensuel</span>
          <div 
            className="w-14 h-8 flex items-center bg-slate-800 rounded-full p-1 cursor-pointer"
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
          >
            <motion.div 
              className="w-6 h-6 bg-cyan-500 rounded-full"
              layout
              transition={{ type: 'spring', stiffness: 700, damping: 30 }}
              style={{ marginLeft: billingCycle === 'yearly' ? 'auto' : '0' }}
            />
          </div>
          <span className={cn("text-sm font-bold", billingCycle === 'yearly' ? 'text-white' : 'text-slate-500')}>Annuel</span>
          <span className="text-xs text-emerald-400 font-black px-2 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">-2 MOIS</span>
        </motion.div>
      </div>

      {/* Pricing Cards */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full pb-20">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.id}
            custom={index}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -10 }}
            className={cn(
              "group relative p-8 rounded-3xl border overflow-hidden flex flex-col",
              plan.isFeatured ? 'bg-slate-900 border-cyan-500/50 shadow-2xl shadow-cyan-950/50' : 'bg-slate-950/80 border-slate-800 backdrop-blur-xl'
            )}
          >
            <div className={cn(
              "absolute inset-0 opacity-0 transition-opacity duration-500 pointer-events-none",
              plan.isFeatured ? 'card-aurora-featured' : 'card-aurora'
            )}></div>
            
            {plan.isFeatured && (
              <div className="absolute top-0 right-0 text-[10px] font-black text-slate-950 bg-cyan-400 px-4 py-1.5 rounded-bl-xl tracking-wider uppercase">
                Recommandé
              </div>
            )}
            
            <div className="relative z-10 flex flex-col flex-1">
              <h3 className="text-2xl font-black text-white">{plan.name}</h3>
              <p className="text-slate-400 text-sm mt-2 h-10">{plan.description}</p>
              
              <div className="flex items-baseline mt-6 mb-8">
                <span className="text-5xl font-black text-white tracking-tight">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={billingCycle}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="inline-block"
                    >
                      {plan.price[billingCycle]}€
                    </motion.span>
                  </AnimatePresence>
                </span>
                <span className="text-slate-500 ml-2 font-bold">/{billingCycle === 'monthly' ? 'mois' : 'an'}</span>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map(feature => (
                  <li key={feature} className="flex items-start text-slate-300 text-sm font-medium">
                    <CheckCircle className="h-5 w-5 text-cyan-500 mr-3 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => handleSubscribe(plan.id)}
                disabled={loadingPlan !== null}
                className={cn(
                  "w-full mt-auto text-sm font-black rounded-xl py-4 transition-all flex items-center justify-center gap-2",
                  plan.isFeatured 
                    ? "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20" 
                    : "bg-slate-800 hover:bg-slate-700 text-white",
                  loadingPlan === plan.id ? "opacity-75 cursor-wait" : "",
                  loadingPlan !== null && loadingPlan !== plan.id ? "opacity-50 cursor-not-allowed" : ""
                )}
              >
                {loadingPlan === plan.id ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Redirection...
                  </>
                ) : (
                  "Essai Gratuit 7 Jours"
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
