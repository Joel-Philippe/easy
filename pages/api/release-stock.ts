import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from '@/components/firebaseConfig';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

interface MetadataItem {
  id: string;
  title: string;
  count: number;
  price: number;
  price_promo?: number;
}

// Fonction pour libérer le stock réservé
async function releaseReservedStock(metadataItems: MetadataItem[]): Promise<void> {
  try {
    await runTransaction(db, async (transaction) => {
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

          console.log(`🔄 Stock libéré pour ${item.title}: ${item.count} unité(s)`);
        }
      }
    });
  } catch (error) {
    console.error('❌ Erreur lors de la libération du stock:', error);
    throw error;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ 
        error: 'Session ID manquant',
        code: 'MISSING_SESSION_ID'
      });
    }

    // Récupérer les détails de la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return res.status(404).json({ 
        error: 'Session non trouvée',
        code: 'SESSION_NOT_FOUND'
      });
    }

    // Vérifier si le stock était réservé
    if (session.metadata?.stockReserved !== 'true') {
      return res.status(200).json({ 
        message: 'Aucun stock à libérer pour cette session',
        released: false
      });
    }

    // Récupérer les items de la session
    const metadataItems = JSON.parse(session.metadata?.items || '[]') as MetadataItem[];

    if (metadataItems.length === 0) {
      return res.status(200).json({ 
        message: 'Aucun produit à traiter',
        released: false
      });
    }

    // Libérer le stock réservé
    await releaseReservedStock(metadataItems);

    console.log(`✅ Stock libéré avec succès pour la session: ${sessionId}`);

    res.status(200).json({ 
      message: 'Stock libéré avec succès',
      released: true,
      itemsCount: metadataItems.length
    });

  } catch (error: any) {
    console.error('❌ Erreur lors de la libération du stock:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
}