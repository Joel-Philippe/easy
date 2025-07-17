export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }
  
    const { email } = req.body;
  
    if (!email) {
      return res.status(400).json({ message: 'Missing email' });
    }
  
    // Comparer l'email de l'utilisateur à l'email admin dans la variable d'environnement
    const adminEmail = process.env.NEXT_PUBLIC_FIREBASE_ADMIN_EMAIL;
  
    // S'assurer que la variable d'environnement est bien configurée
    if (!adminEmail) {
      return res.status(500).json({ message: 'Admin email not set in environment variables' });
    }
  
    if (email === adminEmail) {
      return res.status(200).json({ isAdmin: true });
    } else {
      return res.status(200).json({ isAdmin: false });
    }
  }
  