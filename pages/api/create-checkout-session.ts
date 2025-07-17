import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '@/components/firebaseConfig';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

const YOUR_DOMAIN = process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:3000';

interface MetadataItem {
  id: string;
  title: string;
  count: number;
  price: number;
  price_promo?: number;
}

interface StockVerificationResult {
  success: boolean;
  unavailableItems: string[];
  insufficientStockItems: { title: string; requested: number; available: number }[];
}

// 🔍 Fonction pour SEULEMENT vérifier le stock (SANS le réserver)
async function verifyStockOnly(metadataItems: MetadataItem[]): Promise<StockVerificationResult> {
  const unavailableItems: string[] = [];
  const insufficientStockItems: { title: string; requested: number; available: number }[] = [];

  try {
    console.log("🔍 === VÉRIFICATION DU STOCK SANS RÉSERVATION ===");
    
    // Vérifier le stock de tous les produits
    const stockChecks = await Promise.all(
      metadataItems.map(async (item) => {
        if (!item.id) {
          unavailableItems.push(item.title);
          return { item, available: 0, exists: false };
        }

        const productRef = doc(db, 'cards', item.id);
        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
          unavailableItems.push(item.title);
          return { item, available: 0, exists: false };
        }

        const productData = productSnap.data();
        const totalStock = Number(productData.stock || 0);
        const usedStock = Number(productData.stock_reduc || 0);
        const availableStock = totalStock - usedStock;

        console.log(`📦 ${item.title}: Stock total=${totalStock}, Utilisé=${usedStock}, Disponible=${availableStock}, Demandé=${item.count}`);

        return {
          item,
          available: availableStock,
          exists: true
        };
      })
    );

    // Vérifier si tous les produits ont suffisamment de stock
    for (const check of stockChecks) {
      if (!check.exists) continue;

      if (check.available < check.item.count) {
        insufficientStockItems.push({
          title: check.item.title,
          requested: check.item.count,
          available: check.available
        });
      }
    }

    // Si des problèmes de stock détectés
    if (unavailableItems.length > 0 || insufficientStockItems.length > 0) {
      console.log("❌ Problèmes de stock détectés:", { unavailableItems, insufficientStockItems });
      return {
        success: false,
        unavailableItems,
        insufficientStockItems
      };
    }

    console.log("✅ Stock vérifié avec succès - AUCUNE RÉSERVATION EFFECTUÉE");
    return {
      success: true,
      unavailableItems: [],
      insufficientStockItems: []
    };

  } catch (error) {
    console.error('❌ Erreur lors de la vérification du stock:', error);
    return {
      success: false,
      unavailableItems,
      insufficientStockItems
    };
  }
}

// 🔒 Fonction pour vérifier et réserver le stock de manière atomique (ANCIENNE VERSION - gardée pour compatibilité)
async function verifyAndReserveStock(metadataItems: MetadataItem[]): Promise<StockVerificationResult> {
  const unavailableItems: string[] = [];
  const insufficientStockItems: { title: string; requested: number; available: number }[] = [];

  try {
    await runTransaction(db, async (transaction) => {
      console.log("🔍 Début de la transaction de vérification de stock");
      
      // 1️⃣ Vérifier le stock de tous les produits
      const stockChecks = await Promise.all(
        metadataItems.map(async (item) => {
          if (!item.id) {
            unavailableItems.push(item.title);
            return { item, available: 0, exists: false };
          }

          const productRef = doc(db, 'cards', item.id);
          const productSnap = await transaction.get(productRef);

          if (!productSnap.exists()) {
            unavailableItems.push(item.title);
            return { item, available: 0, exists: false };
          }

          const productData = productSnap.data();
          const totalStock = Number(productData.stock || 0);
          const usedStock = Number(productData.stock_reduc || 0);
          const availableStock = totalStock - usedStock;

          console.log(`📦 ${item.title}: Stock total=${totalStock}, Utilisé=${usedStock}, Disponible=${availableStock}, Demandé=${item.count}`);

          return {
            item,
            available: availableStock,
            exists: true,
            productRef,
            currentData: productData
          };
        })
      );

      // 2️⃣ Vérifier si tous les produits ont suffisamment de stock
      for (const check of stockChecks) {
        if (!check.exists) continue;

        if (check.available < check.item.count) {
          insufficientStockItems.push({
            title: check.item.title,
            requested: check.item.count,
            available: check.available
          });
        }
      }

      // 3️⃣ Si des problèmes de stock, annuler la transaction
      if (unavailableItems.length > 0 || insufficientStockItems.length > 0) {
        console.log("❌ Problèmes de stock détectés:", { unavailableItems, insufficientStockItems });
        throw new Error('Stock insuffisant ou produits indisponibles');
      }

      // 4️⃣ Réserver le stock (augmenter stock_reduc)
      console.log("🔒 Réservation du stock en cours...");
      for (const check of stockChecks) {
        if (check.exists && check.productRef && check.currentData) {
          const newStockReduc = Number(check.currentData.stock_reduc || 0) + check.item.count;
          transaction.update(check.productRef, {
            stock_reduc: newStockReduc
          });
          console.log(`✅ Stock réservé pour ${check.item.title}: +${check.item.count} (nouveau total: ${newStockReduc})`);
        }
      }
    });

    console.log("✅ Stock vérifié et réservé avec succès");
    return {
      success: true,
      unavailableItems: [],
      insufficientStockItems: []
    };

  } catch (error) {
    console.error('❌ Erreur lors de la vérification du stock:', error);
    return {
      success: false,
      unavailableItems,
      insufficientStockItems
    };
  }
}

// 🔄 Fonction pour libérer le stock en cas d'annulation
async function releaseReservedStock(metadataItems: MetadataItem[]): Promise<void> {
  try {
    await runTransaction(db, async (transaction) => {
      console.log("🔄 Libération du stock réservé...");
      
      for (const item of metadataItems) {
        if (!item.id) continue;

        const productRef = doc(db, 'cards', item.id);
        const productSnap = await transaction.get(productRef);

        if (productSnap.exists()) {
          const productData = productSnap.data();
          const currentStockReduc = Number(productData.stock_reduc || 0);
          const newStockReduc = Math.max(0, currentStockReduc - item.count);
          
          transaction.update(productRef, {
            stock_reduc: newStockReduc
          });

          console.log(`🔄 Stock libéré pour ${item.title}: -${item.count} (nouveau total: ${newStockReduc})`);
        }
      }
    });
  } catch (error) {
    console.error('❌ Erreur lors de la libération du stock:', error);
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      console.log("🔒 === DÉMARRAGE CRÉATION PAYMENTINTENT ===");
      console.log("📦 Données reçues:", req.body);
      
      const { 
        items, 
        customer_email, 
        displayName, 
        photoURL, 
        deliveryInfo, 
        requestId, 
        metadataItems,
        payment_method_types = ['card'],
        useCheckout = false,
        // 🔑 NOUVEAUX PARAMÈTRES POUR CONTRÔLER LA RÉSERVATION DE STOCK
        skipStockReservation = false,
        skipStockUpdate = false,
        updateStockOnlyAfterPayment = false
      } = req.body;

      // Vérifier que metadataItems existe
      if (!metadataItems || !Array.isArray(metadataItems) || metadataItems.length === 0) {
        return res.status(400).json({ 
          error: 'Aucun produit à vérifier',
          code: 'NO_ITEMS'
        });
      }

      // 🔒 ÉTAPE 1: Choisir le mode de vérification de stock
      let stockVerification: StockVerificationResult;
      
      if (skipStockReservation || skipStockUpdate || updateStockOnlyAfterPayment) {
        console.log("🔍 === MODE: VÉRIFICATION SANS RÉSERVATION ===");
        console.log("🔑 Paramètres:", { skipStockReservation, skipStockUpdate, updateStockOnlyAfterPayment });
        console.log("✅ Le stock sera mis à jour UNIQUEMENT après confirmation du paiement par le webhook");
        
        // Vérifier le stock SANS le réserver
        stockVerification = await verifyStockOnly(metadataItems);
      } else {
        console.log("🔒 === MODE: VÉRIFICATION AVEC RÉSERVATION (ANCIEN MODE) ===");
        console.log("⚠️ Le stock sera réservé immédiatement");
        
        // Ancien mode : vérifier et réserver le stock
        stockVerification = await verifyAndReserveStock(metadataItems);
      }

      // Gérer les erreurs de stock
      if (!stockVerification.success) {
        let errorMessage = '🚨 Certains produits ne sont plus disponibles:\n';
        
        if (stockVerification.unavailableItems.length > 0) {
          errorMessage += `\n❌ Produits indisponibles: ${stockVerification.unavailableItems.join(', ')}`;
        }
        
        if (stockVerification.insufficientStockItems.length > 0) {
          errorMessage += '\n⚠️ Stock insuffisant pour:';
          stockVerification.insufficientStockItems.forEach(item => {
            errorMessage += `\n  • ${item.title}: ${item.requested} demandé(s), ${item.available} disponible(s)`;
          });
        }

        console.log("❌ Erreur de stock:", errorMessage);
        return res.status(409).json({ 
          error: errorMessage,
          code: 'INSUFFICIENT_STOCK',
          details: {
            unavailableItems: stockVerification.unavailableItems,
            insufficientStockItems: stockVerification.insufficientStockItems
          }
        });
      }

      console.log("✅ Vérification de stock terminée avec succès");

      // 🔒 ÉTAPE 2: Créer PaymentIntent ou Checkout Session selon le mode
      try {
        if (useCheckout) {
          // Mode Checkout Session (redirection vers Stripe)
          console.log("💳 Création de la session Stripe Checkout...");
          
          const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: items,
            mode: 'payment',
            success_url: `${YOUR_DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${YOUR_DOMAIN}/cancel?session_id={CHECKOUT_SESSION_ID}`,
            customer_email,
            shipping_address_collection: {
              allowed_countries: ['FR', 'BE'],
            },
            expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // Expire dans 30 minutes
            metadata: {
              items: JSON.stringify(metadataItems),
              displayName: displayName || '',
              photoURL: photoURL || '',
              deliveryInfo: JSON.stringify(deliveryInfo || {}),
              requestId: requestId || '',
              // 🔑 Marquer si le stock a été réservé ou non
              stockReserved: (skipStockReservation || skipStockUpdate || updateStockOnlyAfterPayment) ? 'false' : 'true',
              updateStockOnlyAfterPayment: updateStockOnlyAfterPayment ? 'true' : 'false'
            }
          });

          console.log("✅ Session Stripe créée avec succès:", session.id);
          res.status(200).json({ sessionId: session.id });
        } else {
          // Mode PaymentIntent (paiement intégré)
          console.log("💳 Création du PaymentIntent...");
          
          // Calculer le montant total
          const amount = items.reduce((total, item) => {
            return total + (item.price_data.unit_amount * item.quantity);
          }, 0);

          const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'eur',
            payment_method_types,
            metadata: {
              items: JSON.stringify(metadataItems),
              displayName: displayName || '',
              photoURL: photoURL || '',
              deliveryInfo: JSON.stringify(deliveryInfo || {}),
              requestId: requestId || '',
              customer_email: customer_email || '',
              // 🔑 Marquer si le stock a été réservé ou non
              stockReserved: (skipStockReservation || skipStockUpdate || updateStockOnlyAfterPayment) ? 'false' : 'true',
              updateStockOnlyAfterPayment: updateStockOnlyAfterPayment ? 'true' : 'false'
            }
          });

          console.log("✅ PaymentIntent créé avec succès:", paymentIntent.id);
          
          if (skipStockReservation || skipStockUpdate || updateStockOnlyAfterPayment) {
            console.log("🔑 IMPORTANT: Aucun stock n'a été modifié - mise à jour uniquement après paiement réussi");
          }
          
          res.status(200).json({ 
            client_secret: paymentIntent.client_secret,
            payment_intent_id: paymentIntent.id
          });
        }

      } catch (stripeError) {
        // Si la création échoue ET que le stock avait été réservé, le libérer
        console.error('❌ Erreur lors de la création Stripe:', stripeError);
        
        if (!(skipStockReservation || skipStockUpdate || updateStockOnlyAfterPayment)) {
          console.log("🔄 Libération du stock suite à l'erreur Stripe...");
          await releaseReservedStock(metadataItems);
        } else {
          console.log("ℹ️ Aucun stock à libérer car aucune réservation n'avait été effectuée");
        }
        
        throw stripeError;
      }

    } catch (error: any) {
      console.error('❌ Erreur générale:', error);
      res.status(500).json({ 
        error: error.message || 'Erreur interne du serveur',
        code: 'INTERNAL_ERROR'
      });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}