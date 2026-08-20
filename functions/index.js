const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")(process.env.STRIPE_SECRET || "sk_test_temp_replace_me");
const cors = require("cors")({ origin: true });
const nodemailer = require("nodemailer");

admin.initializeApp();
const db = admin.firestore();

// Helper : envoi d'email via SMTP (Brevo / Gmail / autre)
// Configurez SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS dans functions/.env
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
  });
}

async function sendWelcomeEmail(toEmail, orgName, planName, isTrialing) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("SMTP non configuré — email de bienvenue non envoyé.");
    return;
  }
  try {
    const transporter = createTransporter();
    const trialMsg = isTrialing
      ? "<p>Votre période d'essai de 7 jours a commencé. Aucun prélèvement ne sera effectué avant la fin de cette période.</p>"
      : "<p>Votre abonnement est actif. Vous avez désormais accès à toutes les fonctionnalités de votre plan.</p>";

    await transporter.sendMail({
      from: `"Parkeya" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: `🎉 Bienvenue sur Parkeya — Plan ${planName} activé !`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #0891b2, #10b981); padding: 40px; text-align: center;">
            <h1 style="color: white; font-size: 28px; margin: 0;">Bienvenue sur Parkeya ! 🅿️</h1>
          </div>
          <div style="padding: 32px;">
            <p style="font-size: 16px;">Bonjour,</p>
            <p>Votre organisation <strong>${orgName}</strong> est maintenant configurée sur Parkeya avec le plan <strong>${planName}</strong>.</p>
            ${trialMsg}
            <h3 style="color: #22d3ee;">Pour commencer :</h3>
            <ul style="line-height: 2;">
              <li>📍 Créez votre premier parking depuis le Dashboard</li>
              <li>🚗 Ajoutez vos premiers véhicules</li>
              <li>👥 Invitez votre équipe via les Paramètres</li>
            </ul>
            <div style="margin: 32px 0; text-align: center;">
              <a href="https://parkeya.fr" style="background: #0891b2; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 15px;">Accéder à mon espace →</a>
            </div>
            <p style="font-size: 12px; color: #64748b;">Une question ? Répondez à cet email ou contactez-nous à contact@parkeya.fr</p>
          </div>
        </div>
      `,
    });
    console.log(`Email de bienvenue envoyé à ${toEmail}`);
  } catch (err) {
    // Ne pas faire échouer le webhook si l'email plante
    console.error("Erreur envoi email de bienvenue:", err.message);
  }
}

// 1. Fonction pour créer la session Checkout (Appelable depuis le frontend)
exports.createStripeCheckout = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Vous devez être connecté.");
  }

  const { planId, orgId, billingCycle = "monthly", trialDays = 7 } = data;
  if (!planId || !orgId) {
    throw new functions.https.HttpsError("invalid-argument", "planId et orgId requis.");
  }

  // Vérification de sécurité : S'assurer que l'utilisateur possède l'organisation
  const orgDoc = await db.collection("organizations").doc(orgId).get();
  if (!orgDoc.exists || orgDoc.data().ownerId !== context.auth.uid) {
    throw new functions.https.HttpsError("permission-denied", "Accès non autorisé à cette organisation.");
  }

  // Définition des tarifs mensuels et annuels en centimes (€)
  const plans = {
    starter: { 
      name: "Starter (1 Parking, 300 Véhicules)", 
      monthlyAmount: 12900, 
      annualAmount: 109 * 12 * 100 // 1308€ / an (109€/mois)
    },
    business: { 
      name: "Business (1 Parking, 600 Véhicules)", 
      monthlyAmount: 19900, 
      annualAmount: 169 * 12 * 100 // 2028€ / an (169€/mois)
    },
    pro: { 
      name: "Pro (3 Parkings, 3000 Véhicules)", 
      monthlyAmount: 29900, 
      annualAmount: 249 * 12 * 100 // 2988€ / an (249€/mois)
    },
    enterprise: { 
      name: "Enterprise (Sur-mesure)", 
      monthlyAmount: 49900, 
      annualAmount: 419 * 12 * 100 
    },
  };

  const selectedPlanConfig = plans[planId] || plans["business"];
  const isAnnual = billingCycle === "annually" || billingCycle === "annual";
  const amount = isAnnual ? selectedPlanConfig.annualAmount : selectedPlanConfig.monthlyAmount;
  const interval = isAnnual ? "year" : "month";
  
  // Si l'organisation a déjà eu une période d'essai, on la supprime
  const hasHadTrial = orgDoc.data().hasHadTrial === true;
  const trialPeriodDays = (Number(trialDays) > 0 && !hasHadTrial) ? Number(trialDays) : undefined;

  // Validation stricte anti-Open Redirect
  function isAllowedOrigin(origin) {
    if (!origin || typeof origin !== "string") return false;
    try {
      const url = new URL(origin);
      const hostname = url.hostname;
      // Localhost pour le développement
      if (hostname === "localhost" || hostname === "127.0.0.1") return true;
      // Domaines Firebase Cloud du projet (strict)
      if (hostname === "parkeya.web.app" || hostname === "parkeya.firebaseapp.com") return true;
      // Domaines personnalisés du projet
      if (hostname === "parkeya.fr" || hostname === "www.parkeya.fr" || hostname === "parkflow.fr" || hostname === "www.parkflow.fr") return true;
      if (hostname.includes("hostinger") || hostname.endsWith(".hostingersite.com")) return true;
      return false;
    } catch (e) {
      return false;
    }
  }

  const clientOrigin = isAllowedOrigin(data.origin)
    ? data.origin.replace(/\/$/, "")
    : "https://parkeya.web.app";

  try {
    const sessionParams = {
      mode: "subscription",
      allow_promotion_codes: true,
      customer_email: context.auth.token.email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Abonnement Parkeya — Plan ${selectedPlanConfig.name} (${isAnnual ? "Facturation Annuelle" : "Facturation Mensuelle"})`,
              description: trialPeriodDays
                ? `${trialPeriodDays} jours d'essai gratuit, puis facturation automatique. Annulable à tout moment.`
                : `Accès complet au logiciel Parkeya (${isAnnual ? "Engagement 1 an - 2 mois offerts" : "Sans engagement"}).`,
            },
            unit_amount: amount,
            recurring: {
              interval: interval,
            },
          },
          quantity: 1,
        },
      ],
      managed_payments: {
        enabled: false,
      },
      success_url: `${clientOrigin}/?payment=success&orgId=${orgId}`,
      cancel_url: `${clientOrigin}/?payment=cancel`,
      metadata: {
        orgId: orgId,
        userId: context.auth.uid,
        billingCycle: interval,
        planId: planId || "business",
      },
    };

    // Ajouter la période d'essai si demandée
    // L'utilisateur entre sa carte maintenant, le débit a lieu après trialPeriodDays jours
    if (trialPeriodDays) {
      sessionParams.subscription_data = {
        trial_period_days: trialPeriodDays,
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return { url: session.url };
  } catch (error) {
    console.error("Stripe error details:", JSON.stringify(error, null, 2));
    // Renvoyer le vrai message Stripe au client pour faciliter le debug
    const stripeMsg = error?.raw?.message || error?.message || "Erreur Stripe inconnue";
    throw new functions.https.HttpsError("internal", stripeMsg);
  }
});

// 2. Webhook Stripe pour recevoir les notifications et synchroniser les abonnements
exports.stripeWebhook = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_temp_replace_me";

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    } catch (err) {
      console.error("Webhook Error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // 1. Idempotence : Éviter de traiter deux fois le même événement
    try {
      const eventRef = db.collection("stripeEvents").doc(event.id);
      const eventDoc = await eventRef.get();
      if (eventDoc.exists) {
        console.log(`Événement ${event.id} déjà traité (idempotence).`);
        return res.json({ received: true, duplicate: true });
      }
      await eventRef.set({
        type: event.type,
        created: event.created,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.warn("Could not check event idempotency:", err);
    }

    const plansConfig = {
      starter: { maxParkings: 1, maxUsers: 5, maxVehicles: 300 },
      business: { maxParkings: 1, maxUsers: 10, maxVehicles: 600 },
      pro: { maxParkings: 3, maxUsers: 20, maxVehicles: 3000 },
      enterprise: { maxParkings: 999, maxUsers: 999, maxVehicles: 99999 },
    };

    // Événement 1 : Checkout completé (cart enregistrée — accès immédiat même en trial)
    // La carte est validée, l'abonnement créé. Si trial : statut trialing, sinon active.
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orgId = session.metadata?.orgId;
      const planId = session.metadata?.planId || "business";
      const planDetails = plansConfig[planId] || plansConfig["business"];

      if (orgId) {
        try {
          // Récupérer le statut réel de l'abonnement Stripe pour savoir si c'est un trial
          let subStatus = "active";
          let trialEnd = null;
          if (session.subscription) {
            const stripeSub = await stripe.subscriptions.retrieve(session.subscription);
            subStatus = stripeSub.status; // "trialing" ou "active"
            trialEnd = stripeSub.trial_end
              ? new Date(stripeSub.trial_end * 1000).toISOString()
              : null;
          }

          const orgStatus = subStatus === "trialing" ? "ACTIVE" : "ACTIVE"; // Accès accordé dans tous les cas

          await db.collection("organizations").doc(orgId).update({
            status: orgStatus,
            plan: planId,
            "subscription.plan": planId,
            "subscription.status": subStatus,       // "trialing" ou "active"
            "subscription.maxParkings": planDetails.maxParkings,
            "subscription.maxUsers": planDetails.maxUsers,
            "subscription.maxVehicles": planDetails.maxVehicles,
            ...(trialEnd ? { "subscription.trialEndsAt": trialEnd } : {}),
            stripeSubscriptionId: session.subscription || null,
            stripeCustomerId: session.customer || null,
            hasHadTrial: true, // On scelle le fait qu'ils ont eu (ou refusé) leur essai
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log(`Organisation ${orgId} activée — plan ${planId}, statut Stripe: ${subStatus}`);

          // Envoyer l'email de bienvenue
          try {
            const orgData = (await db.collection("organizations").doc(orgId).get()).data();
            const planNames = { starter: "Starter", business: "Business", pro: "Pro", enterprise: "Enterprise" };
            await sendWelcomeEmail(
              session.customer_details?.email || context?.auth?.token?.email || "",
              orgData?.name || "Votre organisation",
              planNames[planId] || planId,
              subStatus === "trialing"
            );
          } catch (emailErr) {
            console.warn("Email de bienvenue non envoyé:", emailErr.message);
          }
        } catch (error) {
          console.error(`Erreur d'activation de l'organisation ${orgId}:`, error);
        }
      }
    }

    // Événement 2 : Paiement réussi d'une facture (Renouvellement mensuel/annuel automatique)
    if (event.type === "invoice.payment_succeeded" || event.type === "invoice.paid") {
      const invoice = event.data.object;
      const subId = invoice.subscription;
      const customerId = invoice.customer;

      try {
        let orgDoc = null;
        if (subId) {
          const snap = await db.collection("organizations").where("stripeSubscriptionId", "==", subId).limit(1).get();
          if (!snap.empty) orgDoc = snap.docs[0];
        }
        if (!orgDoc && customerId) {
          const snap = await db.collection("organizations").where("stripeCustomerId", "==", customerId).limit(1).get();
          if (!snap.empty) orgDoc = snap.docs[0];
        }

        if (orgDoc) {
          const renewsAt = invoice.lines?.data?.[0]?.period?.end
            ? new Date(invoice.lines.data[0].period.end * 1000).toISOString()
            : new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();

          await orgDoc.ref.update({
            status: "ACTIVE",
            "subscription.status": "active",
            "subscription.renewsAt": renewsAt,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log(`Abonnement renouvelé pour l'organisation ${orgDoc.id} jusqu'au ${renewsAt}.`);
        }
      } catch (error) {
        console.error("Erreur lors du traitement de invoice.payment_succeeded:", error);
      }
    }

    // Événement 3 : Échec de paiement (Carte expirée, fonds insuffisants)
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object;
      const subId = invoice.subscription;
      try {
        if (subId) {
          const snap = await db.collection("organizations").where("stripeSubscriptionId", "==", subId).limit(1).get();
          if (!snap.empty) {
            const orgDoc = snap.docs[0];
            await orgDoc.ref.update({
              status: "PAST_DUE",
              "subscription.status": "past_due",
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.warn(`Paiement échoué pour l'organisation ${orgDoc.id}, statut passé à PAST_DUE.`);
          }
        }
      } catch (error) {
        console.error("Erreur lors du traitement de invoice.payment_failed:", error);
      }
    }

    // Événement 4 : Abonnement supprimé / résilié
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      try {
        const orgsSnapshot = await db.collection("organizations")
          .where("stripeSubscriptionId", "==", subscription.id)
          .get();
          
        if (!orgsSnapshot.empty) {
          const orgDoc = orgsSnapshot.docs[0];
          await orgDoc.ref.update({
            status: "CANCELED",
            "subscription.status": "canceled",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log(`Organisation ${orgDoc.id} annulée suite à la résiliation de l'abonnement.`);
        }
      } catch (error) {
        console.error("Erreur lors de l'annulation de l'abonnement :", error);
      }
    }

    // Événement 5 : Mise à jour de l'abonnement Stripe (changement de statut direct)
    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object;
      try {
        const snap = await db.collection("organizations").where("stripeSubscriptionId", "==", subscription.id).limit(1).get();
        if (!snap.empty) {
          const orgDoc = snap.docs[0];
          const newStatus = subscription.status === "active" ? "ACTIVE" : (subscription.status === "past_due" ? "PAST_DUE" : (subscription.status === "canceled" ? "CANCELED" : orgDoc.data().status));
          await orgDoc.ref.update({
            status: newStatus,
            "subscription.status": subscription.status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      } catch (error) {
        console.error("Erreur lors de customer.subscription.updated:", error);
      }
    }

    res.json({ received: true });
  });
});

// 3. Fonction sécurisée pour rejoindre un parking via code (Server-Side)
exports.joinParking = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Vous devez être connecté.");
  }

  const { code } = data;
  if (!code) {
    throw new functions.https.HttpsError("invalid-argument", "Le code d'accès est requis.");
  }
  const normalizedCode = code.trim().toUpperCase();

  // 0. Anti-Brute Force (Rate Limiting par UID)
  const rateLimitRef = db.collection("rateLimits").doc(context.auth.uid);
  const rateLimitDoc = await rateLimitRef.get();
  
  const now = admin.firestore.Timestamp.now();
  let attempts = 0;
  
  if (rateLimitDoc.exists) {
    const data = rateLimitDoc.data();
    // Si la dernière tentative date de moins de 15 minutes
    if (now.toMillis() - data.lastAttempt.toMillis() < 15 * 60 * 1000) {
      attempts = data.attempts || 0;
      if (attempts >= 5) {
        throw new functions.https.HttpsError("resource-exhausted", "Trop de tentatives échouées. Réessayez dans 15 minutes.");
      }
    }
  }

  // 1. Chercher le code dans Firestore (Admin SDK ignore les règles de sécurité)
  const codeDoc = await db.collection("accessCodes").doc(normalizedCode).get();
  
  if (!codeDoc.exists) {
    // Enregistrer la tentative échouée
    await rateLimitRef.set({
      attempts: attempts + 1,
      lastAttempt: now
    });
    throw new functions.https.HttpsError("not-found", "Code d'accès invalide ou expiré.");
  }
  
  // Si le code est valide, on réinitialise les tentatives
  if (attempts > 0) {
    await rateLimitRef.delete();
  }

  const { parkingId, ownerId, parkingName } = codeDoc.data();

  // 2. Vérifier si l'utilisateur est déjà dans le parking (optionnel mais propre)
  const parkingDoc = await db.collection("parkings").doc(parkingId).get();
  if (!parkingDoc.exists) {
    throw new functions.https.HttpsError("not-found", "Le parking associé n'existe plus.");
  }
  
  if (parkingDoc.data().ownerId !== ownerId) {
    throw new functions.https.HttpsError("failed-precondition", "Code d'accès invalide.");
  }

  const authorizedUsers = parkingDoc.data().authorizedUsers || [];
  if (authorizedUsers.includes(context.auth.uid)) {
    return { alreadyJoined: true, parkingId, name: parkingName };
  }

  // 3. Vérifier le statut et les limites de l'organisation (maxUsers)
  if (ownerId) {
    const orgQuery = await db.collection("organizations").where("ownerId", "==", ownerId).limit(1).get();
    if (!orgQuery.empty) {
      const org = orgQuery.docs[0].data();
      if (org.status === "CANCELED") {
        throw new functions.https.HttpsError("permission-denied", "L'abonnement de cette organisation est résilié ou inactif.");
      }

      const maxUsers = org.subscription?.maxUsers || 5; // Limite starter par défaut si non trouvé
      
      // Compter les utilisateurs uniques dans tous les parkings de ce propriétaire
      const parkingsQuery = await db.collection("parkings").where("ownerId", "==", ownerId).get();
      const uniqueUsers = new Set();
      parkingsQuery.forEach(doc => {
        const users = doc.data().authorizedUsers || [];
        users.forEach(u => uniqueUsers.add(u));
      });
      
      if (!uniqueUsers.has(context.auth.uid) && uniqueUsers.size >= maxUsers) {
        throw new functions.https.HttpsError("resource-exhausted", `Le quota d'utilisateurs de cette organisation est atteint (${maxUsers} max).`);
      }
    }
  }

  // 4. Ajouter l'utilisateur au parking & synchroniser son organisation
  try {
    await db.collection("parkings").doc(parkingId).update({
      authorizedUsers: admin.firestore.FieldValue.arrayUnion(context.auth.uid),
    });

    // Synchroniser l'organisation dans le document utilisateur s'il n'en a pas encore
    const userRef = db.collection("users").doc(context.auth.uid);
    const userDoc = await userRef.get();
    const parkingOrgId = parkingDoc.data().organizationId;
    if (userDoc.exists && !userDoc.data().organizationId && parkingOrgId) {
      await userRef.update({
        organizationId: parkingOrgId,
        role: userDoc.data().role || "VOITURIER",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return { alreadyJoined: false, parkingId, name: parkingName };
  } catch (error) {
    console.error("Erreur lors de l'ajout au parking:", error);
    throw new functions.https.HttpsError("internal", "Erreur lors de la jonction au parking.");
  }
});

// 4. Fonction pour récupérer les informations d'un ticket numérique (Publique, non authentifiée)
exports.getPublicTicket = functions.https.onCall(async (data, context) => {
  const { ticketId } = data;
  if (!ticketId || typeof ticketId !== 'string') {
    throw new functions.https.HttpsError("invalid-argument", "Format de ticket invalide.");
  }

  const lastUnderscore = ticketId.lastIndexOf("_");
  if (lastUnderscore === -1) {
    throw new functions.https.HttpsError("invalid-argument", "Format de ticket invalide.");
  }

  const pId = ticketId.substring(0, lastUnderscore);
  const vId = ticketId.substring(lastUnderscore + 1);

  if (!pId || !vId) {
    throw new functions.https.HttpsError("invalid-argument", "Format de ticket invalide.");
  }

  // Requête avec les droits Admin pour lire le parking complet, même sans être connecté
  const parkingDoc = await db.collection("parkings").doc(pId).get();
  
  if (!parkingDoc.exists) {
    throw new functions.https.HttpsError("not-found", "Parking introuvable.");
  }

  const pData = parkingDoc.data();
  let foundVehicle = null;

  // Chercher dans les voies
  let lanesObj = pData.lanes;
  if (lanesObj) {
    // Les lanes sont stockées sous forme d'objet { "0": [...], "1": [...] }
    for (const key in lanesObj) {
      if (Array.isArray(lanesObj[key])) {
        const v = lanesObj[key].find(veh => veh.id === vId);
        if (v) { foundVehicle = v; break; }
      }
    }
  }

  // Chercher dans l'attente
  if (!foundVehicle && Array.isArray(pData.waiting)) {
    foundVehicle = pData.waiting.find(v => v.id === vId);
  }

  // Chercher dans l'historique archivé
  if (!foundVehicle && Array.isArray(pData.archivedVehicles)) {
    foundVehicle = pData.archivedVehicles.find(v => v.id === vId);
  }

  if (!foundVehicle) {
    throw new functions.https.HttpsError("not-found", "Véhicule introuvable.");
  }

  // On renvoie UNIQUEMENT les infos utiles au client, sans divulguer le reste des véhicules
  // et sans exposer le 'id' du parking si possible, mais on peut le renvoyer pour affichage.
  // En fait, on renvoie les données nécessaires au ticket:
  return {
    vehicle: {
      id: foundVehicle.id,
      plate: foundVehicle.plate,
      model: foundVehicle.model,
      arrivedAt: foundVehicle.arrivedAt,
      departure: foundVehicle.departure,
      flightNumber: foundVehicle.flightNumber,
      photos: foundVehicle.photos || [],
      exitedAt: foundVehicle.exitedAt,
    },
    parking: {
      name: pData.name,
    }
  };
});

// 5. Fonction pour résilier un abonnement (Appelable depuis le frontend)
exports.cancelStripeSubscription = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Vous devez être connecté.");
  }

  const { orgId } = data;
  if (!orgId) {
    throw new functions.https.HttpsError("invalid-argument", "orgId est requis.");
  }

  // Vérifier la permission
  const orgRef = db.collection("organizations").doc(orgId);
  const orgDoc = await orgRef.get();
  
  if (!orgDoc.exists || orgDoc.data().ownerId !== context.auth.uid) {
    throw new functions.https.HttpsError("permission-denied", "Accès non autorisé.");
  }

  const stripeSubscriptionId = orgDoc.data().stripeSubscriptionId;
  if (!stripeSubscriptionId) {
    throw new functions.https.HttpsError("not-found", "Aucun abonnement Stripe actif trouvé.");
  }

  try {
    // Annulation immédiate sur Stripe
    await stripe.subscriptions.cancel(stripeSubscriptionId);

    // Mise à jour de la BDD pour couper l'accès tout de suite (sans attendre le webhook)
    await orgRef.update({
      status: "CANCELED",
      "subscription.status": "canceled",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Erreur annulation Stripe:", error);
    throw new functions.https.HttpsError("internal", error.message || "Erreur d'annulation.");
  }
});

// 6. Initialiser le rôle Super Admin (Custom Claim Firebase)
// Ne peut être exécuté que si l'email de l'appelant est dans la liste SUPERADMIN_EMAILS
exports.initializeSuperAdmin = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Non connecté.");
  }

  // Liste des emails autorisés — jamais exposée au client
  const allowedEmails = (process.env.SUPERADMIN_EMAILS || "bouaklirayan@gmail.com")
    .split(",")
    .map(e => e.trim().toLowerCase());

  const callerEmail = (context.auth.token.email || "").toLowerCase();
  if (!allowedEmails.includes(callerEmail)) {
    throw new functions.https.HttpsError("permission-denied", "Accès refusé.");
  }

  // Poser le custom claim sur ce compte
  await admin.auth().setCustomUserClaims(context.auth.uid, { superAdmin: true });
  console.log(`Custom claim superAdmin posé sur ${callerEmail}`);
  return { success: true };
});

// 7. Obtenir les statistiques Super Admin (liste des orgs, MRR, etc.)
exports.getSuperAdminStats = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Non connecté.");
  }

  // Double vérification : Custom Claim ET email
  const isSuperAdmin = context.auth.token.superAdmin === true;
  const allowedEmails = (process.env.SUPERADMIN_EMAILS || "bouaklirayan@gmail.com")
    .split(",")
    .map(e => e.trim().toLowerCase());
  const callerEmail = (context.auth.token.email || "").toLowerCase();

  if (!isSuperAdmin && !allowedEmails.includes(callerEmail)) {
    throw new functions.https.HttpsError("permission-denied", "Accès refusé.");
  }

  try {
    // Récupérer toutes les organisations
    const orgsSnap = await db.collection("organizations").get();
    const orgs = orgsSnap.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d.name || "—",
        email: d.email || "—",
        status: d.status || "UNKNOWN",
        plan: d.plan || d.subscription?.plan || "—",
        subscriptionStatus: d.subscription?.status || "—",
        createdAt: d.createdAt?.toDate?.().toISOString() || null,
        updatedAt: d.updatedAt?.toDate?.().toISOString() || null,
        stripeCustomerId: d.stripeCustomerId || null,
        stripeSubscriptionId: d.stripeSubscriptionId || null,
        ownerId: d.ownerId || null,
      };
    });

    // Calculer le MRR approximatif
    const pricePerPlan = { starter: 129, business: 199, pro: 299, enterprise: 499 };
    const activeOrgs = orgs.filter(o => o.status === "ACTIVE");
    const mrr = activeOrgs.reduce((sum, o) => sum + (pricePerPlan[o.plan] || 0), 0);

    return {
      totalOrgs: orgs.length,
      activeOrgs: activeOrgs.length,
      trialingOrgs: orgs.filter(o => o.subscriptionStatus === "trialing").length,
      canceledOrgs: orgs.filter(o => o.status === "CANCELED").length,
      pastDueOrgs: orgs.filter(o => o.status === "PAST_DUE").length,
      pendingOrgs: orgs.filter(o => o.status === "PENDING_PAYMENT").length,
      mrr,
      orgs,
    };
  } catch (error) {
    console.error("Erreur getSuperAdminStats:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// 8. Action Super Admin : Modifier le statut d'une organisation
exports.superAdminUpdateOrg = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Non connecté.");
  }

  const isSuperAdmin = context.auth.token.superAdmin === true;
  const allowedEmails = (process.env.SUPERADMIN_EMAILS || "bouaklirayan@gmail.com")
    .split(",")
    .map(e => e.trim().toLowerCase());
  const callerEmail = (context.auth.token.email || "").toLowerCase();

  if (!isSuperAdmin && !allowedEmails.includes(callerEmail)) {
    throw new functions.https.HttpsError("permission-denied", "Accès refusé.");
  }

  const { orgId, newStatus, newPlan } = data;
  if (!orgId) {
    throw new functions.https.HttpsError("invalid-argument", "orgId requis.");
  }

  const updatePayload = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
  if (newStatus) updatePayload.status = newStatus;
  if (newPlan) {
    const plansConfig = {
      starter: { maxParkings: 1, maxUsers: 5, maxVehicles: 300 },
      business: { maxParkings: 1, maxUsers: 10, maxVehicles: 600 },
      pro: { maxParkings: 3, maxUsers: 20, maxVehicles: 3000 },
      enterprise: { maxParkings: 999, maxUsers: 999, maxVehicles: 99999 },
    };
    const planDetails = plansConfig[newPlan] || plansConfig.business;
    updatePayload.plan = newPlan;
    updatePayload["subscription.plan"] = newPlan;
    updatePayload["subscription.maxParkings"] = planDetails.maxParkings;
    updatePayload["subscription.maxUsers"] = planDetails.maxUsers;
    updatePayload["subscription.maxVehicles"] = planDetails.maxVehicles;
  }

  await db.collection("organizations").doc(orgId).update(updatePayload);
  console.log(`[SuperAdmin] Organisation ${orgId} mise à jour:`, updatePayload);
  return { success: true };
});

// 9. Action Super Admin : Supprimer définitivement une organisation de la BDD
exports.superAdminDeleteOrg = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Non connecté.");
  }

  const isSuperAdmin = context.auth.token.superAdmin === true;
  const allowedEmails = (process.env.SUPERADMIN_EMAILS || "bouaklirayan@gmail.com")
    .split(",")
    .map(e => e.trim().toLowerCase());
  const callerEmail = (context.auth.token.email || "").toLowerCase();

  if (!isSuperAdmin && !allowedEmails.includes(callerEmail)) {
    throw new functions.https.HttpsError("permission-denied", "Accès refusé.");
  }

  const { orgId } = data;
  if (!orgId) {
    throw new functions.https.HttpsError("invalid-argument", "orgId requis.");
  }

  try {
    const orgRef = db.collection("organizations").doc(orgId);
    const orgDoc = await orgRef.get();

    if (!orgDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Organisation introuvable.");
    }

    const orgData = orgDoc.data();

    // 1. Annuler l'abonnement Stripe si existant
    if (orgData.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(orgData.stripeSubscriptionId);
        console.log(`[SuperAdmin] Abonnement Stripe ${orgData.stripeSubscriptionId} annulé pour org ${orgId}`);
      } catch (stripeErr) {
        console.warn(`[SuperAdmin] Erreur annulation Stripe pour org ${orgId}:`, stripeErr.message);
      }
    }

    // 2. Dissocier les utilisateurs attachés à cette organisation
    const usersSnap = await db.collection("users").where("organizationId", "==", orgId).get();
    const batch = db.batch();
    usersSnap.docs.forEach(userDoc => {
      batch.update(userDoc.ref, {
        organizationId: null,
        role: "OWNER",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    // 3. Supprimer le document organisation de Firestore
    batch.delete(orgRef);

    await batch.commit();
    console.log(`[SuperAdmin] Organisation ${orgId} supprimée de la base de données par ${callerEmail}.`);
    return { success: true };
  } catch (error) {
    console.error("Erreur superAdminDeleteOrg:", error);
    throw new functions.https.HttpsError("internal", error.message || "Erreur de suppression.");
  }
});

