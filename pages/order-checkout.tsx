// pages/order-checkout.tsx (exemple de page Next.js)
import React, { useContext } from 'react';
import { Box, Heading, useToast } from '@chakra-ui/react';
import DeliveryForm from '../components/DeliveryForm';
import { GlobalCartContext } from '../components/GlobalCartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';

const OrderCheckout = () => {
  const { globalCart } = useContext(GlobalCartContext);
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();

  // Construit le tableau selectedItems à partir de globalCart
  const selectedItems = Object.entries(globalCart).map(([title, item]) => ({
    title,
    count: item.count,
    price: item.price,
    price_promo: item.price_promo,
    deliveryTime: item.deliveryTime,
  }));

  const handleOrderSubmit = async (deliveryData: any) => {
    // Préparer l'objet orderData avec les informations utilisateur et la commande
    const orderData = {
      customer_email: user?.email || 'anonymous@example.com',
      displayName: user?.displayName || "Client",
      deliveryInfo: deliveryData,
      items: selectedItems,
    };

    console.log("Envoi de la commande :", orderData);

    try {
      const response = await fetch('/api/add-order', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      const result = await response.json();
      if (response.ok) {
        toast({
          title: "Commande enregistrée",
          description: `Votre commande a été enregistrée avec l'ID ${result.orderId}.`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        // Vous pouvez vider le panier ou rediriger l'utilisateur ici
        router.push('/success');
      } else {
        throw new Error(result.message || "Erreur d'enregistrement de la commande");
      }
    } catch (error: any) {
      console.error("Error recording order:", error);
      toast({
        title: "Erreur",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={8}>
      <Heading mb={4}>Confirmer votre commande</Heading>
      <DeliveryForm
        onSubmit={handleOrderSubmit}
        selectedItems={selectedItems}
        requestId="votreRequestIdSiNecessaire" // Optionnel
      />
    </Box>
  );
};

export default OrderCheckout;
