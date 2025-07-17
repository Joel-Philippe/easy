// components/CheckoutForm.js
import React from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@chakra-ui/react';

const CheckoutForm = ({ onPaymentSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const toast = useToast();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: elements.getElement(CardElement),
    });

    if (error) {
      toast({
        title: "Erreur",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Simulate payment success
    if (paymentMethod) {
      toast({
        title: "Paiement réussi",
        description: "Votre paiement a été traité avec succès.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      onPaymentSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe}>
        Payer
      </button>
    </form>
  );
};

export default CheckoutForm;
