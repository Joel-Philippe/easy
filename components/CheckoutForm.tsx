// components/CheckoutForm.tsx
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { useState } from 'react';

export default function CheckoutForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/success'
      },
      redirect: 'if_required'
    });

    if (error) {
      setMessage(error.message || 'Une erreur est survenue.');
    } else if (paymentIntent?.status === 'succeeded') {
      window.location.href = '/success';
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button
        disabled={isLoading || !stripe || !elements}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {isLoading ? 'Paiement...' : 'Payer'}
      </button>
      {message && <div className="text-red-500">{message}</div>}
    </form>
  );
}
