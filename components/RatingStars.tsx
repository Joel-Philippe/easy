import { useEffect, useState } from 'react';
import { FaStar } from 'react-icons/fa';
import { getAuth } from 'firebase/auth';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface RatingStarsProps {
  productId: string;
  averageRating: number;
  userHasRated: boolean;
  onVote: () => void;
}

export default function RatingStars({
  productId,
  averageRating,
  userHasRated,
  onVote,
}: RatingStarsProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleVote = async (value: number) => {
    if (!user) {
      toast.error('Vous devez être connecté pour voter.');
      return;
    }

    try {
      const token = await user.getIdToken();

      const response = await axios.post(
        '/api/rate-product',
        {
          rating: value,
          productId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success('Votre vote a été enregistré !');
      setSelected(value); // mettre à jour l'état local
      onVote(); // déclenche une mise à jour dans le parent
    } catch (error: any) {
      if (
        error.response &&
        error.response.status === 400 &&
        error.response.data.message === 'Vous avez déjà noté ce produit.'
      ) {
        toast.error('Vous avez déjà voté pour ce produit.');
      } else {
        console.error('Erreur lors du vote :', error);
        toast.error("Une erreur est survenue lors de l'envoi du vote.");
      }
    }
  };

  const displayStars = selected || hovered || Math.round(averageRating);

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <FaStar
          key={star}
          size={20}
          color={
            star <= displayStars
              ? 'rgb(245, 127, 23)'
              : 'lightgray'
          }
          onMouseEnter={() => !userHasRated && setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => !userHasRated && handleVote(star)}
          style={{ cursor: user && !userHasRated ? 'pointer' : 'not-allowed' }}
        />
      ))}
    </div>
  );
}
