import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/components/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import nodemailer from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }

  const { email, items, displayName, photoURL } = req.body;

  try {
    // Enregistrement des détails de l'achat dans Firestore
    const docRef = await addDoc(collection(db, 'userCarts'), {
      userEmail: email,
      userDisplayName: displayName || "Anonyme", // Valeur par défaut si displayName est undefined
      userPhotoURL: photoURL || "",             // Valeur par défaut vide si photoURL est undefined
      items,
      purchaseDate: serverTimestamp(),
      timestamp: serverTimestamp(),
    });

    // Envoi de l'email de confirmation
    const transporter = nodemailer.createTransport({
      service: 'hotmail',
      auth: {
        user: process.env.NEXT_PUBLIC_EMAIL_USER,
        pass: process.env.NEXT_PUBLIC_EMAIL_PASS,
      },
    });

    const generateOrderDetailsHtml = (orderDetails) => {
      return `
        <h2>Détails de votre commande</h2>
        <table style="width:100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="border: 1px solid #dddddd; text-align: left; padding: 8px;">Produit</th>
              <th style="border: 1px solid #dddddd; text-align: left; padding: 8px;">Quantité</th>
              <th style="border: 1px solid #dddddd; text-align: left; padding: 8px;">Prix</th>
            </tr>
          </thead>
          <tbody>
            ${orderDetails.map(item => `
              <tr>
                <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${item.title}</td>
                <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${item.count}</td>
                <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${item.price}€</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    };

    const mailOptions = {
      from: process.env.NEXT_PUBLIC_EMAIL_USER,
      to: email,
      subject: 'Confirmation de commande',
      html: `
        <h1>Merci pour votre achat !</h1>
        <p>Voici les détails de votre commande :</p>
        ${generateOrderDetailsHtml(items)}
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Purchase completed and email sent successfully' });
  } catch (error) {
    console.error('Error processing purchase:', error);
    res.status(500).json({ message: `Error processing purchase: ${error.message}` });
  }
}
