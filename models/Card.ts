// pages/api/cards.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/components/firebaseConfig';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc
} from 'firebase/firestore';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const cardsCol = collection(db, "cards");
        const snapshot = await getDocs(cardsCol);
        const cards = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
        res.status(200).json({ success: true, data: cards });
      } catch (error: any) {
        console.error(error);
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    case 'POST':
      try {
        // Conversion explicite en nombre
        const stock = Number(req.body.stock) || 0;
        const stock_reduc = Number(req.body.stock_reduc) || 0;
        const computedPourcentage = stock > 0 ? Math.round(((stock - stock_reduc) / stock) * 100) : 0;

        const newCard = {
          title: req.body.title,
          subtitle: req.body.subtitle,
          description: req.body.description,
          images: req.body.images,
          stock: stock,
          stock_reduc: stock_reduc,
          pourcentage_disponible: computedPourcentage,
          price: req.body.price,
          price_promo: req.body.price_promo,
          time: req.body.time,
          deliveryTime: req.body.deliveryTime,
          point_important_un: req.body.point_important_un,
          point_important_deux: req.body.point_important_deux,
          point_important_trois: req.body.point_important_trois,
          point_important_quatre: req.body.point_important_quatre,
          img_point_important_un: req.body.img_point_important_un,
          img_point_important_deux: req.body.img_point_important_deux,
          img_point_important_trois: req.body.img_point_important_trois,
          img_point_important_quatre: req.body.img_point_important_quatre,
          prenom_du_proposant: req.body.prenom_du_proposant,
          photo_du_proposant: req.body.photo_du_proposant,
          origine: req.body.origine,
          caracteristiques: req.body.caracteristiques,
          produits_derives: req.body.produits_derives.map((produit: any) => ({
            ...produit,
            deliveryTime: produit.deliveryTime
          })),
          categorie: req.body.categorie,
          categorieImage: req.body.categorieImage,
          categorieBackgroundColor: req.body.categorieBackgroundColor,
          affiche: req.body.affiche,
          nouveau: true,

          // ⭐ Champs de notation
          reviews: [],     // Vide au départ
          stars: 0         // Moyenne initiale
        };

        const docRef = await addDoc(collection(db, "cards"), newCard);
        res.status(201).json({ success: true, data: { _id: docRef.id, ...newCard } });
      } catch (error: any) {
        console.error(error);
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    case 'PATCH':
      try {
        const cardId = req.query.id as string;
        if (!cardId) {
          return res.status(400).json({ success: false, message: "Missing card id" });
        }

        const cardRef = doc(db, "cards", cardId);

        // Cas spécial : ajout d'un commentaire/note utilisateur
        if (req.body.newReview) {
          const cardSnap = await getDoc(cardRef);
          const cardData = cardSnap.data();
          const reviews = cardData?.reviews || [];

          const newReview = req.body.newReview; // { userId, rating, comment?, date? }
          const updatedReviews = [...reviews, {
            ...newReview,
            date: newReview.date || new Date().toISOString()
          }];

          const newAvg = updatedReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / updatedReviews.length;

          await updateDoc(cardRef, {
            reviews: updatedReviews,
            stars: parseFloat(newAvg.toFixed(1))
          });

          const updatedDoc = await getDoc(cardRef);
          return res.status(200).json({ success: true, data: { _id: updatedDoc.id, ...updatedDoc.data() } });
        }

        // Sinon modification classique
        await updateDoc(cardRef, req.body);
        const updatedDoc = await getDoc(cardRef);
        res.status(200).json({ success: true, data: { _id: updatedDoc.id, ...updatedDoc.data() } });
      } catch (error: any) {
        console.error(error);
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    default:
      res.status(400).json({ success: false, message: "Method not allowed" });
      break;
  }
}
