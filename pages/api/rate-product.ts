import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/components/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { verifyFirebaseToken } from '@/utils/verifyFirebaseToken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { rating, comment = '', productId } = req.body;
  const authHeader = req.headers.authorization;

  // Log de débogage
  console.log('POST /api/rate-product body:', req.body);
  console.log('Authorization header:', authHeader);

  // Validation de productId
  if (!productId || typeof productId !== 'string' || productId.trim() === '') {
    return res.status(400).json({ success: false, message: 'ProductId invalide.' });
  }

  // Validation de rating
  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'Rating invalide. Il doit être un nombre entre 1 et 5.' });
  }

  // Validation du header Authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: No or malformed token' });
  }

  const token = authHeader.split(' ')[1];
  const decodedUser = await verifyFirebaseToken(token);

  if (!decodedUser) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
  }

  const userId = decodedUser.uid;

  try {
    const cardRef = doc(db, 'cards', productId);
    const cardSnap = await getDoc(cardRef);

    if (!cardSnap.exists()) {
      return res.status(404).json({ success: false, message: 'Produit introuvable.' });
    }

    const cardData = cardSnap.data();
    const existingReviews = cardData?.reviews || [];

    const alreadyVoted = existingReviews.some((r: any) => r.userId === userId);
    if (alreadyVoted) {
      return res.status(400).json({ success: false, message: 'Vous avez déjà noté ce produit.' });
    }

    const newReview = {
      userId,
      rating,
      comment,
      date: new Date().toISOString(),
    };

    const updatedReviews = [...existingReviews, newReview];
    const newAverage =
      updatedReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / updatedReviews.length;

    await updateDoc(cardRef, {
      reviews: updatedReviews,
      stars: parseFloat(newAverage.toFixed(1)),
    });

    return res.status(200).json({
      success: true,
      message: 'Vote enregistré.',
      newAverage,
      reviews: updatedReviews,
    });
  } catch (error: any) {
    console.error('Erreur serveur dans /api/rate-product:', error);
    return res.status(500).json({ success: false, message: error.message || 'Erreur interne.' });
  }
}
