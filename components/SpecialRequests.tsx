import React, { useEffect, useState } from 'react';
import { Box, Text, Flex, Button, Avatar, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody } from '@chakra-ui/react';
import { db } from '@/components/firebaseConfig';
import SpecialRequestForm from '@/components/SpecialRequestForm';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const SpecialRequests = () => {
  const { user } = useAuth();
  const [specialRequests, setSpecialRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDeliveryFormOpen, setIsDeliveryFormOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fetchSpecialRequests = async () => {
      if (!user?.email) return;
      const q = query(collection(db, 'specialRequests'), where('senderEmail', '==', user.email));
      const querySnapshot = await getDocs(q);
      setSpecialRequests(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchSpecialRequests();
  }, [user]);

  const handlePayment = (request) => {
    setSelectedRequest(request);
    setIsDeliveryFormOpen(true);
    toast({
      title: 'Demande spéciale',
      description: `Le temps de livraison de la demande spéciale est généralement de 7 à 10 jours pour : ${request.selectedProducts.map(p => p.title).join(', ')}`,
      status: 'info',
      duration: 5000,
      isClosable: true,
    });
  };

  const handleDeliveryFormSubmit = async (formData) => {
    try {
      const stripe = await stripePromise;

      const payload = {
        items: selectedRequest.selectedProducts,
        deliveryInfo: formData,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        requestId: selectedRequest.id,
      };

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Impossible de créer la session de paiement');
      }

      const session = await response.json();
      const { error } = await stripe.redirectToCheckout({ sessionId: session.id });

      if (error) {
        console.error('Stripe Checkout Error:', error);
        toast({
          title: 'Erreur de paiement',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Erreur lors de la redirection vers Stripe:', error);
      toast({
        title: 'Erreur de paiement',
        description: 'Une erreur est survenue lors de la redirection vers Stripe.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <Flex color={'#5c2222'} textAlign="center" wrap="wrap" justifyContent="space-around">
        {specialRequests.length > 0 ? (
          specialRequests.map((request, index) => (
            <Box key={index} borderWidth="1px" borderRadius="lg" overflow="hidden" p={4} m={2} width="280px">
              <Flex alignItems="center" mb={3}>
                <Avatar src={request.sellerPhoto} name={request.sellerName} size="md" mr={3} />
                <Text fontWeight="bold">{request.sellerName}</Text>
              </Flex>

              <Text>
                <b>Produit:</b> {request.selectedProducts.map(product => product.title).join(', ')}
              </Text>
              <Text><b>Date:</b> {new Date(request.timestamp).toLocaleString()}</Text>

              {/* Vérification explicite des statuts */}
              {request.status === 'accepted' && (
                <Text color="#FF9800" fontWeight="bold">Demande acceptée</Text>
              )}
              {request.status === 'paid' && (
                <Text color="#4CAF50" fontWeight="bold">Statut: Payée</Text>
              )}
              {(!request.status || request.status === 'pending') && (
                <Text color="#FF5722" fontWeight="bold">Statut: En attente</Text>
              )}

              {/* Afficher le bouton seulement si la demande est acceptée */}
              {request.status === 'accepted' && request.status !== 'paid' && (
                <Button mt={4} color={'white'} background="#F57F17" onClick={() => handlePayment(request)}
                  _hover={{
                    borderRadius: 'md',
                    color: '#FF9800',
                    background: 'rgba(0, 0, 0, 0.1)',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  Je prends
                </Button>
              )}
            </Box>
          ))
        ) : (
          <Text>Aucune demande spéciale trouvée.</Text>
        )}
      </Flex>

      {isDeliveryFormOpen && (
        <Modal isOpen={isDeliveryFormOpen} onClose={() => setIsDeliveryFormOpen(false)}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Formulaire de livraison</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedRequest && (
                <SpecialRequestForm
                  onSubmit={handleDeliveryFormSubmit}
                  selectedItems={selectedRequest.selectedProducts}
                  requestId={selectedRequest.id}
                />
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </Box>
  );
};

export default SpecialRequests;
