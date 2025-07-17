// pages/api/create-payment-intent.ts
import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16'
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const { items, delivery } = req.body;

  // ✅ Validation : s'assurer que items est un tableau
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: '`items` is required and must be an array' });
  }

  try {
    // ✅ Calcul du montant total
    const amount = items.reduce((total: number, item: any) => {
      return total + item.price * item.quantity;
    }, 0);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'eur',
      metadata: {
        items: JSON.stringify(items),
        ...(delivery ? { delivery: JSON.stringify(delivery) } : {})
      },
      automatic_payment_methods: { enabled: true }
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Stripe Payment Error:', err); // ✅ debug dans le terminal
    res.status(500).json({ error: 'Erreur lors de la création du paiement' });
  }
}
