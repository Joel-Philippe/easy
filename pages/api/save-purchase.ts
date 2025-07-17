import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/components/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { email, items } = req.body;

    try {
      await addDoc(collection(db, 'purchases'), {
        email,
        items,
        timestamp: new Date().toISOString(),
      });

      res.status(200).json({ message: 'Purchase added successfully' });
    } catch (error) {
      console.error('Error adding purchase:', error);
      res.status(500).json({ message: 'Failed to add purchase' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
