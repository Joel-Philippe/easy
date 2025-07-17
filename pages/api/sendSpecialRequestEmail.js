import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, displayName, selectedProducts } = req.body;

    const transporter = nodemailer.createTransport({
      service: 'hotmail', // ou tout autre service de messagerie
      auth: {
        user: process.env.NEXT_PUBLIC_EMAIL_USER,
        pass: process.env.NEXT_PUBLIC_EMAIL_PASS,
      },
    });

    const productList = selectedProducts.map((product) => `${product.title} - ${product.price}€`).join('\n');

    const mailOptions = {
      from: process.env.NEXT_PUBLIC_EMAIL_USER,
      to: email,
      subject: 'Synthèse de votre demande spéciale',
      text: `Bonjour ${displayName},\n\nVoici les détails de votre demande spéciale :\n${productList},\n\nVous recevrez une confirmation dans votre compte TIME, dans la rubrique 'Message' lorsque votre demande sera acceptée. \n\nA bientôt !`,
    };

    try {
      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: 'Email envoyé avec succès' });
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'email', error });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Méthode ${req.method} non autorisée`);
  }
}
