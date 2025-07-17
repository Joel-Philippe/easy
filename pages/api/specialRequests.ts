import { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Formatage des sauts de ligne
};

if (!getApps().length) {
  initializeApp({
    credential: cert(firebaseConfig),
  });
}

const db = getFirestore();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { email, productTitle, deliveryTime } = req.body; // Ajout du champ deliveryTime dans la requête

    try {
      const docRef = await db.collection('specialRequests').add({
        email,
        productTitle,
        deliveryTime: deliveryTime || 'Non défini', // Ajout du champ deliveryTime
        timestamp: new Date().toISOString(),
      });

      res.status(200).json({ message: 'Special request submitted successfully', id: docRef.id });
    } catch (error) {
      console.error('Error submitting special request:', error);
      res.status(500).json({ message: 'Error submitting special request', error });
    }
  } else if (req.method === 'GET') {
    const { productTitle } = req.query;

    try {
      // Rechercher les acheteurs des produits correspondants avec leur temps de livraison
      const purchasesSnapshot = await db.collection('userCarts')
        .where('items', 'array-contains', { title: productTitle })
        .get();

      const buyers = new Set();
      const productsWithDeliveryTime = [];

      purchasesSnapshot.forEach(doc => {
        const data = doc.data();
        const userEmail = data.userEmail;

        // Parcourir les items pour extraire le temps de livraison
        data.items.forEach(item => {
          if (item.title === productTitle) {
            buyers.add(userEmail);
            productsWithDeliveryTime.push({
              title: item.title,
              deliveryTime: item.deliveryTime || 'Non défini', // Récupérer le temps de livraison s'il existe
            });
          }
        });
      });

      res.status(200).json({
        buyers: Array.from(buyers),
        productsWithDeliveryTime, // Renvoie des produits avec le temps de livraison
      });
    } catch (error) {
      console.error('Error fetching buyers or products:', error);
      res.status(500).json({ message: 'Error fetching buyers or products', error });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
