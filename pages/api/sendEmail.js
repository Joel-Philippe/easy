import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'hotmail', // Vous pouvez utiliser d'autres services de messagerie
  auth: {
    user: process.env. NEXT_PUBLIC_EMAIL_USER,
    pass: process.env. NEXT_PUBLIC_EMAIL_PASS,
  },
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { to, subject, message } = req.body;

    const mailOptions = {
      from: process.env.NEXT_PUBLIC_EMAIL_USER,
      to,
      subject,
      text: message,
    };

    try {
      await transporter.sendMail(mailOptions);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
