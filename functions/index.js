const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")(process.env.STRIPE_SECRET || "sk_test_temp_replace_me");
const cors = require("cors")({ origin: true });

admin.initializeApp();
const db = admin.firestore();

// 1. Fonction pour créer la session Checkout (Appelable depuis le frontend)
exports.createStripeCheckout = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Vous devez être connecté.");
  }

  const { planId, orgId, billingCycle = "monthly" } = data;
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

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      allow_promotion_codes: true, // Permet les codes promos & réductions Stripe (ex: -100% pour vos tests)
      customer_email: context.auth.token.email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Abonnement Parkeya — Plan ${selectedPlanConfig.name} (${isAnnual ? "Facturation Annuelle" : "Facturation Mensuelle"})`,
              description: `Accès complet au logiciel Parkeya (${isAnnual ? "Engagement 1 an - 2 mois offerts" : "Sans engagement"}).`,
              tax_code: "txcd_10103000",
            },
            unit_amount: amount,
            recurring: {
              interval: interval,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `https://parkeya.web.app/?payment=success&orgId=${orgId}`,
      cancel_url: `https://parkeya.web.app/?payment=cancel`,
      metadata: {
        orgId: orgId,
        userId: context.auth.uid,
        billingCycle: interval,
      },
    });

    return { url: session.url };
  } catch (error) {
    console.error("Stripe error:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// 2. Webhook Stripe pour recevoir la confirmation de paiement
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

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orgId = session.metadata.orgId;

      if (orgId) {
        try {
          // Activer l'organisation
          await db.collection("organizations").doc(orgId).update({
            status: "ACTIVE",
            stripeSubscriptionId: session.subscription,
            stripeCustomerId: session.customer,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`Organisation ${orgId} activée avec succès !`);
        } catch (error) {
          console.error(`Erreur d'activation de l'organisation ${orgId}:`, error);
        }
      }
    }

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
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`Organisation ${orgDoc.id} annulée suite à la suppression de l'abonnement.`);
        }
      } catch (error) {
        console.error("Erreur lors de l'annulation de l'abonnement :", error);
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

  // 1. Chercher le code dans Firestore (Admin SDK ignore les règles de sécurité)
  const codeDoc = await db.collection("accessCodes").doc(normalizedCode).get();
  
  if (!codeDoc.exists) {
    throw new functions.https.HttpsError("not-found", "Code d'accès invalide ou expiré.");
  }

  const { parkingId, ownerId, parkingName } = codeDoc.data();

  // 2. Vérifier si l'utilisateur est déjà dans le parking (optionnel mais propre)
  const parkingDoc = await db.collection("parkings").doc(parkingId).get();
  if (!parkingDoc.exists) {
    throw new functions.https.HttpsError("not-found", "Le parking associé n'existe plus.");
  }

  const authorizedUsers = parkingDoc.data().authorizedUsers || [];
  if (authorizedUsers.includes(context.auth.uid)) {
    return { alreadyJoined: true, parkingId, name: parkingName };
  }

  // 3. Vérifier les limites de l'organisation (maxUsers)
  if (ownerId) {
    const orgQuery = await db.collection("organizations").where("ownerId", "==", ownerId).limit(1).get();
    if (!orgQuery.empty) {
      const org = orgQuery.docs[0].data();
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

  // 4. Ajouter l'utilisateur au parking
  try {
    await db.collection("parkings").doc(parkingId).update({
      authorizedUsers: admin.firestore.FieldValue.arrayUnion(context.auth.uid),
    });
    return { alreadyJoined: false, parkingId, name: parkingName };
  } catch (error) {
    console.error("Erreur lors de l'ajout au parking:", error);
    throw new functions.https.HttpsError("internal", "Erreur lors de la jonction au parking.");
  }
});
