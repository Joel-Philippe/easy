import { buffer } from "micro";
import type { NextApiRequest, NextApiResponse } from "next";
import { stripe } from "../../utils/stripe";
import { db } from "@/components/firebaseConfig";
import { sendOrderConfirmationEmail } from "@/utils/resendEmailService";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  runTransaction,
} from "firebase/firestore";

// ✅ Vérification des variables d'environnement au démarrage
if (!process.env.RESEND_API_KEY) {
  console.error('❌ Configuration Resend manquante dans le webhook');
  console.error('🔧 Vérifiez RESEND_API_KEY dans .env.local');
} else {
  console.log('✅ RESEND_API_KEY détectée dans le webhook');
}

export const config = {
  api: { bodyParser: false },
};

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

interface MetadataItem {
  id: string;
  title: string;
  count: number;
  price: number;
  price_promo?: number;
}

// 🔄 Fonction pour mettre à jour le stock UNIQUEMENT après paiement réussi
async function updateStockAfterPayment(items: Array<{ id: string; count: number; title: string }>): Promise<void> {
  try {
    console.log('🔄 === MISE À JOUR DU STOCK APRÈS PAIEMENT RÉUSSI ===');
    
    await runTransaction(db, async (transaction) => {
      for (const item of items) {
        if (!item.id || !item.count) continue;

        const productRef = doc(db, 'cards', item.id);
        const productSnap = await transaction.get(productRef);

        if (productSnap.exists()) {
          const productData = productSnap.data();
          const currentStock = Number(productData.stock || 0);
          const currentStockReduc = Number(productData.stock_reduc || 0);
          
          // ✅ INCRÉMENTER le stock_reduc avec la quantité vendue
          const newStockReduc = currentStockReduc + item.count;
          
          // Calculer le nouveau pourcentage
          const pourcentage = currentStock > 0 
            ? Math.min(Math.round((newStockReduc / currentStock) * 100), 100)
            : 0;
          
          // Mettre à jour les deux champs
          transaction.update(productRef, {
            stock_reduc: newStockReduc,
            pourcentage_vendu: pourcentage,
          });

          console.log(`✅ Stock mis à jour pour "${item.title}":`, {
            id: item.id,
            quantité_vendue: item.count,
            ancien_stock_reduc: currentStockReduc,
            nouveau_stock_reduc: newStockReduc,
            stock_total: currentStock,
            pourcentage: pourcentage
          });
        } else {
          console.warn(`⚠️ Produit non trouvé pour l'ID : ${item.id}`);
        }
      }
    });
    
    console.log('✅ Mise à jour du stock terminée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du stock:', error);
    throw error; // Propager l'erreur pour que le webhook puisse la gérer
  }
}

// Fonction pour libérer le stock en cas d'annulation/expiration
async function releaseReservedStock(metadataItems: MetadataItem[]): Promise<void> {
  try {
    console.log('🔄 === LIBÉRATION DU STOCK RÉSERVÉ ===');
    
    await runTransaction(db, async (transaction) => {
      for (const item of metadataItems) {
        if (!item.id) continue;

        const productRef = doc(db, 'cards', item.id);
        const productSnap = await transaction.get(productRef);

        if (productSnap.exists()) {
          const productData = productSnap.data();
          const currentStockReduc = Number(productData.stock_reduc || 0);
          const newStockReduc = Math.max(0, currentStockReduc - item.count);
          
          // Recalculer le pourcentage
          const currentStock = Number(productData.stock || 0);
          const pourcentage = currentStock > 0 
            ? Math.min(Math.round((newStockReduc / currentStock) * 100), 100)
            : 0;
          
          transaction.update(productRef, {
            stock_reduc: newStockReduc,
            pourcentage_vendu: pourcentage,
          });

          console.log(`🔄 Stock libéré pour ${item.title}: ${item.count} unité(s)`);
        }
      }
    });
  } catch (error) {
    console.error('❌ Erreur lors de la libération du stock:', error);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔗 === WEBHOOK STRIPE APPELÉ ===');
  console.log('📋 Method:', req.method);
  console.log('📋 Headers:', Object.keys(req.headers));
  
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  // 1️⃣ Vérification de la signature Stripe
  let event;
  try {
    console.log('🔐 Vérification de la signature Stripe...');
    const buf = await buffer(req);
    const sig = req.headers["stripe-signature"];
    if (!sig) throw new Error("Missing Stripe signature");
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    console.log('✅ Signature Stripe validée');
  } catch (err: any) {
    console.error("⚠️ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`📨 Événement Stripe reçu: ${event.type}`);

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent: any = event.data.object;
        console.log('✅ === PAIEMENT RÉUSSI (Payment Intent) ===');
        console.log('📋 Payment Intent ID:', paymentIntent.id);
        console.log('📧 Customer email:', paymentIntent.receipt_email);
        console.log('💰 Amount:', paymentIntent.amount);

        // Vérifier si on a les métadonnées nécessaires
        if (!paymentIntent.metadata || !paymentIntent.metadata.items) {
          console.log('⚠️ Pas de métadonnées d\'articles trouvées dans Payment Intent');
          console.log('📋 Métadonnées disponibles:', paymentIntent.metadata);
          break;
        }

        // Reconstituer les articles depuis les métadonnées
        const rawItemsPI = JSON.parse(paymentIntent.metadata.items || '[]');
        console.log('📦 Raw items from Payment Intent metadata:', rawItemsPI);
        
        const itemsPI: Array<{
          id: string;
          title: string;
          count: number;
          price: number;
          price_promo: number | null;
          images: string[];
          deliveryTime: string;
        }> = [];

        for (const it of rawItemsPI) {
          const { id, title, count } = it;
          if (!id || !count) continue;

          const productRef = doc(db, "cards", id);
          const snap = await getDoc(productRef);
          if (!snap.exists()) {
            console.warn(`⚠️ Produit non trouvé pour l'ID : ${id}`);
            continue;
          }
          const data = snap.data();
          itemsPI.push({
            id,
            title,
            count,
            price: Number(data.price) || 0,
            price_promo: data.price_promo != null ? Number(data.price_promo) : null,
            images: Array.isArray(data.images) ? data.images : [],
            deliveryTime: data.deliveryTime || "",
          });
        }
        console.log('📦 Items reconstitués (Payment Intent):', itemsPI.length, 'articles');

        // Parse les infos de livraison
        let deliveryInfoPI = {};
        if (paymentIntent.metadata?.deliveryInfo) {
          try {
            deliveryInfoPI = JSON.parse(paymentIntent.metadata.deliveryInfo);
            console.log("📋 Informations de livraison récupérées (Payment Intent):", deliveryInfoPI);
          } catch (e) {
            console.error("❌ Error parsing deliveryInfo (Payment Intent):", e);
          }
        }

        // Enregistrer la commande
        const orderDataPI = {
          customer_email: paymentIntent.receipt_email || paymentIntent.metadata?.customer_email || paymentIntent.metadata?.customerEmail,
          displayName: paymentIntent.metadata?.displayName || "Client",
          deliveryInfo: deliveryInfoPI,
          items: itemsPI,
          totalPaid: (paymentIntent.amount || 0) / 100,
          createdAt: serverTimestamp(),
          sessionId: paymentIntent.id,
          status: 'completed',
          rawMetadata: paymentIntent.metadata || {},
          timestamp: new Date().toISOString()
        };
        
        console.log("💾 === SAUVEGARDE COMMANDE (Payment Intent) ===");
        console.log("📧 Email:", orderDataPI.customer_email);
        console.log("👤 Nom:", orderDataPI.displayName);
        console.log("💰 Total:", orderDataPI.totalPaid);
        
        if (!orderDataPI.customer_email) {
          console.error("❌ Pas d'email client trouvé dans Payment Intent");
          console.log("📋 Métadonnées complètes:", paymentIntent.metadata);
          console.log("🔍 receipt_email:", paymentIntent.receipt_email);
          console.log("🔍 metadata.customer_email:", paymentIntent.metadata?.customer_email);
          console.log("🔍 metadata.customerEmail:", paymentIntent.metadata?.customerEmail);
          break;
        }
        
        const orderRefPI = await addDoc(collection(db, "orders"), orderDataPI);
        console.log("✅ Order saved to Firestore (Payment Intent):", orderRefPI.id);

        // 🔄 MISE À JOUR DU STOCK APRÈS PAIEMENT RÉUSSI
        try {
          await updateStockAfterPayment(itemsPI.map(item => ({
            id: item.id,
            count: item.count,
            title: item.title
          })));
        } catch (stockError) {
          console.error("❌ Erreur critique lors de la mise à jour du stock:", stockError);
          // Ne pas faire échouer le webhook pour une erreur de stock
          // La commande est déjà enregistrée et l'email sera envoyé
        }

        // Envoi de l'email de confirmation
        console.log("📧 === DÉBUT ENVOI EMAIL (Payment Intent) ===");
        console.log("📧 Destinataire:", orderDataPI.customer_email);
        console.log("👤 Nom client:", orderDataPI.displayName);
        console.log("📦 Nombre d'articles:", itemsPI.length);
        console.log("🔧 Vérification de la fonction sendOrderConfirmationEmail:", typeof sendOrderConfirmationEmail);
        console.log("🔧 RESEND_API_KEY présente:", !!process.env.RESEND_API_KEY);
        
        // Préparer les données pour Resend
        const emailDataPI = {
          customerName: orderDataPI.displayName,
          customerEmail: orderDataPI.customer_email,
          orderDate: new Date().toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          items: itemsPI.map(item => ({
            title: item.title,
            count: item.count,
            price: item.price_promo || item.price,
            total: item.count * (item.price_promo || item.price)
          })),
          totalPaid: orderDataPI.totalPaid,
          deliveryInfo: deliveryInfoPI as any,
          sessionId: paymentIntent.id
        };
        
        console.log("📧 Données email préparées (Payment Intent):", {
          customerEmail: emailDataPI.customerEmail,
          customerName: emailDataPI.customerName,
          totalPaid: emailDataPI.totalPaid,
          itemsCount: emailDataPI.items.length
        });
        
        console.log("📧 Appel de sendOrderConfirmationEmail...");
        const emailResultPI = await sendOrderConfirmationEmail(emailDataPI);
        console.log("📧 Résultat brut de sendOrderConfirmationEmail:", emailResultPI);

        if (emailResultPI.success) {
          console.log("✅ === EMAIL ENVOYÉ AVEC SUCCÈS (Payment Intent) ===");
          console.log("📧 Message ID:", emailResultPI.messageId || 'Non fourni par Resend');
          console.log("📧 Destinataire:", orderDataPI.customer_email);
          console.log("💰 Montant:", orderDataPI.totalPaid, "€");
        } else {
          console.error("❌ === ÉCHEC ENVOI EMAIL (Payment Intent) ===");
          console.error("📝 Erreur:", emailResultPI.error);
        }
        break;

      case "checkout.session.completed":
        const session: any = event.data.object;
        console.log('✅ === PAIEMENT RÉUSSI ===');
        console.log('📋 Session ID:', session.id);
        console.log('📧 Customer email:', session.customer_email);
        console.log('💰 Amount total:', session.amount_total);

        // 2️⃣ Reconstitue les items avec leurs données complètes
        const rawItems = session.metadata?.items
          ? JSON.parse(session.metadata.items)
          : [];
        console.log('📦 Raw items from metadata:', rawItems);
        
        const items: Array<{
          id: string;
          title: string;
          count: number;
          price: number;
          price_promo: number | null;
          images: string[];
          deliveryTime: string;
        }> = [];

        for (const it of rawItems) {
          const { id, title, count } = it;
          if (!id || !count) continue;

          const productRef = doc(db, "cards", id);
          const snap = await getDoc(productRef);
          if (!snap.exists()) {
            console.warn(`⚠️ Produit non trouvé pour l'ID : ${id}`);
            continue;
          }
          const data = snap.data();
          items.push({
            id,
            title,
            count,
            price: Number(data.price) || 0,
            price_promo: data.price_promo != null ? Number(data.price_promo) : null,
            images: Array.isArray(data.images) ? data.images : [],
            deliveryTime: data.deliveryTime || "",
          });
        }
        console.log('📦 Items reconstitués:', items.length, 'articles');

        // 3️⃣ Parse les infos de livraison
        let deliveryInfo = {};
        if (session.metadata?.deliveryInfo) {
          try {
            deliveryInfo = JSON.parse(session.metadata.deliveryInfo);
            console.log("📋 Informations de livraison récupérées:", deliveryInfo);
          } catch (e) {
            console.error("❌ Error parsing deliveryInfo:", e);
            console.log("📋 Données brutes deliveryInfo:", session.metadata.deliveryInfo);
          }
        }

        // 4️⃣ Enregistre la commande avec totalPaid
        const orderData = {
          customer_email: session.customer_email,
          displayName: session.metadata.displayName || "Client",
          deliveryInfo: deliveryInfo, // 🔧 S'assurer que deliveryInfo est bien inclus
          items,
          totalPaid: (session.amount_total || 0) / 100,
          createdAt: serverTimestamp(),
          sessionId: session.id,
          status: 'completed',
          // 🔧 Ajouter des champs supplémentaires pour le debug
          rawMetadata: session.metadata || {},
          timestamp: new Date().toISOString()
        };
        
        console.log("💾 === SAUVEGARDE COMMANDE ===");
        console.log("📧 Email:", orderData.customer_email);
        console.log("👤 Nom:", orderData.displayName);
        console.log("💰 Total:", orderData.totalPaid);
        
        const orderRef = await addDoc(collection(db, "orders"), orderData);
        console.log("✅ Order saved to Firestore:", orderRef.id);

        // 🔄 MISE À JOUR DU STOCK APRÈS PAIEMENT RÉUSSI
        try {
          await updateStockAfterPayment(items.map(item => ({
            id: item.id,
            count: item.count,
            title: item.title
          })));
        } catch (stockError) {
          console.error("❌ Erreur critique lors de la mise à jour du stock:", stockError);
          // Ne pas faire échouer le webhook pour une erreur de stock
          // La commande est déjà enregistrée et l'email sera envoyé
        }

        // 6️⃣ Envoi de l'email de confirmation via Resend
        console.log("📧 === DÉBUT ENVOI EMAIL ===");
        console.log("📧 Destinataire:", session.customer_email);
        console.log("👤 Nom client:", orderData.displayName);
        console.log("📦 Nombre d'articles:", items.length);
        console.log("🔧 Vérification de la fonction sendOrderConfirmationEmail:", typeof sendOrderConfirmationEmail);
        console.log("🔧 RESEND_API_KEY présente:", !!process.env.RESEND_API_KEY);
        
        // Préparer les données email
        const emailData = {
          customerName: orderData.displayName,
          customerEmail: session.customer_email,
          orderDate: new Date().toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          items: items.map(item => ({
            title: item.title,
            count: item.count,
            price: item.price_promo || item.price,
            total: item.count * (item.price_promo || item.price)
          })),
          totalPaid: orderData.totalPaid,
          deliveryInfo: deliveryInfo as any,
          sessionId: session.id
        };
        
        console.log("📧 Données email préparées:", {
          customerEmail: emailData.customerEmail,
          customerName: emailData.customerName,
          totalPaid: emailData.totalPaid,
          itemsCount: emailData.items.length
        });
        
        console.log("📧 Appel de sendOrderConfirmationEmail...");
        const emailResult = await sendOrderConfirmationEmail(emailData);
        console.log("📧 Résultat brut de sendOrderConfirmationEmail:", emailResult);

        if (emailResult.success) {
          console.log("✅ === EMAIL ENVOYÉ AVEC SUCCÈS ===");
          console.log("📧 Message ID:", emailResult.messageId || 'Non fourni');
          console.log("📧 Destinataire:", session.customer_email);
          console.log("💰 Montant:", orderData.totalPaid, "€");
        } else {
          console.error("❌ === ÉCHEC ENVOI EMAIL ===");
          console.error("📝 Erreur:", emailResult.error);
        }
        break;

      case "checkout.session.expired":
        const expiredSession: any = event.data.object;
        console.log('⏰ Session expirée:', expiredSession.id);

        // Libérer le stock réservé
        if (expiredSession.metadata?.stockReserved === 'true') {
          const expiredItems = JSON.parse(expiredSession.metadata?.items || '[]') as MetadataItem[];
          await releaseReservedStock(expiredItems);
          console.log('🔄 Stock libéré pour session expirée:', expiredSession.id);
        }
        break;

      case "payment_intent.payment_failed":
        const failedPayment: any = event.data.object;
        console.log('❌ Paiement échoué:', failedPayment.id);
        
        // Si le stock avait été réservé, le libérer
        if (failedPayment.metadata?.stockReserved === 'true' && failedPayment.metadata?.items) {
          const failedItems = JSON.parse(failedPayment.metadata.items || '[]') as MetadataItem[];
          await releaseReservedStock(failedItems);
          console.log('🔄 Stock libéré pour paiement échoué:', failedPayment.id);
        }
        break;

      default:
        console.log(`ℹ️ Événement Stripe non géré: ${event.type}`);
    }
  } catch (err: any) {
    console.error("❌ === ERREUR WEBHOOK ===");
    console.error("📝 Message:", err.message);
    console.error("📋 Stack:", err.stack);
    
    // Log spécifique pour les erreurs d'email
    if (err.message?.includes('Resend') || err.message?.includes('API key')) {
      console.error("📧 Erreur spécifique à l'envoi d'email:", err.message);
      console.error("🔧 Vérifiez votre configuration Resend dans .env.local");
    }
    
    // 📋 Log de tous les événements pour debugging
    console.log('📊 === RÉSUMÉ ÉVÉNEMENT ===');
    console.log('🔖 Type:', event.type);
    console.log('🆔 ID:', event.id);
    if (event.data?.object?.id) {
      console.log('🎯 Object ID:', event.data.object.id);
    }
    console.log('📅 Créé:', new Date(event.created * 1000).toISOString());
  }

  // 7️⃣ Toujours renvoyer 200 OK à Stripe
  console.log("✅ Webhook traité, réponse 200 envoyée à Stripe");
  res.json({ received: true });
}