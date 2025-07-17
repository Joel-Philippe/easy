import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'hotmail', // Utilisez votre service de messagerie préféré
  auth: {
    user: process.env.NEXT_PUBLIC_EMAIL_USER, // Votre adresse email
    pass: process.env.NEXT_PUBLIC_EMAIL_PASS, // Votre mot de passe ou App Password si 2FA est activé
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { email, orderDetails } = req.body;

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
      ${generateOrderDetailsHtml(orderDetails)}
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Error sending email' });
  }
}
