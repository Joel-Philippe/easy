import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { session_id } = req.query;

    if (!session_id || typeof session_id !== 'string') {
      return res.status(400).json({ 
        error: 'Session ID manquant ou invalide',
        code: 'INVALID_SESSION_ID'
      });
    }

    // Récupérer les détails de la session Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (!session) {
      return res.status(404).json({ 
        error: 'Session non trouvée',
        code: 'SESSION_NOT_FOUND'
      });
    }

    // Extraire les informations pertinentes
    const orderDetails = {
      sessionId: session.id,
      customer_email: session.customer_email,
      totalPaid: ((session.amount_total || 0) / 100).toFixed(2),
      currency: session.currency?.toUpperCase() || 'EUR',
      payment_status: session.payment_status,
      displayName: session.metadata?.displayName || 'Client',
      created: new Date(session.created * 1000).toLocaleString('fr-FR'),
    };

    res.status(200).json(orderDetails);

  } catch (error: any) {
    console.error('❌ Erreur lors de la récupération des détails:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
}