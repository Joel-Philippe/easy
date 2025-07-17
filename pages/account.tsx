import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Box, FormControl, FormLabel, Input, Button, Avatar, useToast, VStack, HStack, Text, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Flex
} from '@chakra-ui/react';
import CustomMenuItem from '@/components/CustomMenuItem';
import { loadStripe } from '@stripe/stripe-js';
import SpecialRequestForm from '@/components/SpecialRequestForm';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/components/firebaseConfig';
import emailjs from 'emailjs-com';
import DeleteAccountButton from '@/components/DeleteAccountButton';
import Purchases from '@/components/Purchases';
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY); // Assurez-vous que la clé publique est bien configurée

const AccountPage = () => {
  const { user, updateDisplayName, updateProfilePhoto, resetPassword, placeOrder } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoFile, setPhotoFile] = useState(null);
  const [activeForm, setActiveForm] = useState<'displayName' | 'profilePhoto' | 'specialRequests' | 'changePassword' | 'purchases' | 'messages' | 'requests' | null>(null);
  const [specialRequests, setSpecialRequests] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedItems, setSelectedItems] = useState({ purchases: [], messages: [] });
  const [buyers, setBuyers] = useState([]);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDisplayNameModalOpen, setIsDisplayNameModalOpen] = useState(false);
  const [isProfilePhotoModalOpen, setIsProfilePhotoModalOpen] = useState(false);
  const [isSpecialRequestsModalOpen, setIsSpecialRequestsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [isDeliveryFormOpen, setIsDeliveryFormOpen] = useState(false); // Nouvel état pour le formulaire de livraison
  const [selectedRequest, setSelectedRequest] = useState(null); // Stocke la demande spéciale sélectionnée pour le paiement
  const toast = useToast();

  const handlePasswordReset = async () => {
    if (!user || !user.email) return;

    try {
      await resetPassword(user.email);
      toast({
        title: 'Email de réinitialisation envoyé.',
        description: `Un email a été envoyé à ${user.email} pour réinitialiser votre mot de passe.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      fetchPurchases();
    }
  }, [user]);

  const handleDisplayNameUpdate = async () => {
    try {
      await updateDisplayName(displayName);
      toast({
        title: 'Pseudo mis à jour.',
        description: "Votre pseudo a été mis à jour avec succès.",
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDisplayNameModalOpen(false);
    }
  };

  const handleProfilePhotoUpdate = async () => {
    try {
      await updateProfilePhoto(photoFile);
      toast({
        title: 'Photo de profil mise à jour.',
        description: "Votre photo de profil a été mise à jour avec succès.",
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProfilePhotoModalOpen(false);
    }
  };

  const fetchSpecialRequests = async () => {
    if (!user || !user.email) return;

    const q = query(collection(db, 'specialRequests'), where('senderEmail', '==', user.email));
    const querySnapshot = await getDocs(q);

    const requests = [];
    querySnapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() });
    });

    setSpecialRequests(requests);
  };

  const fetchPurchases = async () => {
    if (!user || !user.email) return;

    const q = query(collection(db, 'userCarts'), where('userEmail', '==', user.email));
    const querySnapshot = await getDocs(q);

    const purchases = [];
    querySnapshot.forEach((doc) => {
      purchases.push(doc.data());
    });

    setPurchases(purchases);
  };

  const fetchMessages = async () => {
    if (!user || !user.email) return;

    const q = query(collection(db, 'messages'), where('receiverEmail', '==', user.email));
    const querySnapshot = await getDocs(q);

    const messages = [];
    querySnapshot.forEach((doc) => {
      messages.push(doc.data());
    });

    setMessages(messages);
  };

  useEffect(() => {
    if (activeForm === 'specialRequests') {
      fetchSpecialRequests();
    } else if (activeForm === 'purchases') {
      fetchPurchases();
    } else if (activeForm === 'messages') {
      fetchMessages();
    } else if (activeForm === 'requests') {
      fetchRequests();
    }
  }, [activeForm]);

  const handlePlaceOrder = async (items, category) => {
    try {
      for (const item of items) {
        await placeOrder(item);
      }
      toast({
        title: 'Commande validée',
        description: 'Vous avez validé la commande pour les produits sélectionnés.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setSelectedItems((prevState) => ({ ...prevState, [category]: [] }));
      fetchPurchases();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handlePayment = (request) => {
    setSelectedRequest(request); // Stocke la demande spéciale sélectionnée
    setIsDeliveryFormOpen(true); // Ouvre le formulaire de livraison

    toast({
      title: 'Demande spéciale',
      description: `Le temps de livraison de la demande spéciale est généralement de 7 à 10 Jours pour la demande : ${request.selectedProducts.map(p => p.title).join(', ')}`,
      status: 'info',
      duration: 5000,
      isClosable: true,
    });

    // Ajouter une logique pour traiter le paiement
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
        requestId: selectedRequest.id,  // Utilisation de requestId
      };

      // Ajout d'un log pour vérifier le contenu avant de créer la session
      console.log("Payload envoyé à l'API create-checkout-session:", payload);

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
      console.error('Error redirecting to Stripe:', error);
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
    <Box height={'1000px'} p={[2, 4]} color="black">
      <CustomMenuItem />
      <Box p={[2, 4]} textAlign="center">
        <Avatar src={user?.photoURL} name={user?.displayName} size="2xl" mb={4} alignSelf="center" />
        {user?.email && (
          <Text fontWeight="700" marginBottom="50px" fontSize="md" mt={2} color="rgb(199, 165, 255)">{user.email}</Text>
        )}
        <VStack spacing={4} align="center">
          <HStack spacing={2} wrap="wrap" justify="center">
            <DeleteAccountButton />
            <Button onClick={() => setActiveForm('displayName')} colorScheme={activeForm === 'displayName' ? 'teal' : 'gray'}>
              Pseudo
            </Button>
            <Button onClick={() => setActiveForm('profilePhoto')} colorScheme={activeForm === 'profilePhoto' ? 'teal' : 'gray'}>
              Photo profil
            </Button>
            <Button onClick={() => setActiveForm('specialRequests')} colorScheme={activeForm === 'specialRequests' ? 'teal' : 'gray'}>
              Mes Demandes Spéciales
            </Button>
            <Button onClick={() => setActiveForm('purchases')} colorScheme={activeForm === 'purchases' ? 'teal' : 'gray'}>
              Achats
            </Button>
            <Button onClick={() => setActiveForm('messages')} colorScheme={activeForm === 'messages' ? 'teal' : 'gray'}>
              Messages
            </Button>
            <Button onClick={() => setActiveForm('changePassword')} colorScheme={activeForm === 'changePassword' ? 'teal' : 'gray'}>
              Mot de passe
            </Button>
          </HStack>

          {activeForm === 'displayName' && (
            <form onSubmit={(e) => { e.preventDefault(); setIsDisplayNameModalOpen(true); }} style={{ width: '100%', maxWidth: '400px' }}>
              <FormControl id="displayName" mb={4}>
                <FormLabel>Pseudo</FormLabel>
                <Input
                  type="text"
                  placeholder="Pseudo"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </FormControl>
              <Button type="submit" color='white' colorScheme="teal" width="full" background='brown'>
                Mettre à jour le pseudo
              </Button>
            </form>
          )}

          {activeForm === 'profilePhoto' && (
            <form onSubmit={(e) => { e.preventDefault(); setIsProfilePhotoModalOpen(true); }} style={{ width: '100%', maxWidth: '400px' }}>
              <FormControl id="photo" mb={4}>
                <FormLabel>Photo de profil</FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files[0])}
                />
              </FormControl>
              <Button type="submit" color='white' colorScheme="teal" width="full" background='brown'>
                Mettre à jour la photo de profil
              </Button>
            </form>
          )}

          {activeForm === 'specialRequests' && (
            <Box color={"#607D8B"} mt={4} w="100%">
              <Text fontSize="xl" mb={4}>Mes Demandes Spéciales</Text>
              <Flex textAlign="left" wrap="wrap" justifyContent="space-around">
                {specialRequests.length > 0 ? specialRequests.map((request, index) => (
                  <Box key={index} borderWidth="1px" borderRadius="lg" overflow="hidden" p={4} m={2} flexBasis="306px" flexGrow={1}>
                    <Text>
                      <Text as="span" fontWeight="bold">Produit: </Text>
                      <Text as="span">{request.selectedProducts.map(product => product.title).join(', ')}</Text>
                    </Text>
                    <Text mb={2}></Text>
                    <Text>
                      <Text as="span" fontWeight="bold">Proposant: </Text>
                      <Text as="span">{request.sellerName}</Text>
                    </Text>
                    <Avatar src={request.sellerPhoto} name={request.sellerName} size="md" mt={2} />
                    <Text mb={2}></Text>
                    <Text>
                      <Text as="span" fontWeight="bold">Date: </Text>
                      <Text as="span">{new Date(request.timestamp).toLocaleString()}</Text>
                    </Text>

                    {/* Affichage du statut */}
                    {request.status === 'accepted' && (
                      <Text color="#FF9800" fontWeight="bold">Demande acceptée</Text>
                    )}
                    {request.status === 'paid' && (
                      <Text color="#4CAF50" fontWeight="bold">Statut: Payée</Text>
                    )}

                    {/* Afficher le bouton "Payer" uniquement si la demande n'est pas encore payée */}
                    {request.status === 'accepted' && request.status !== 'paid' && (
                      <Button mt={4} colorScheme="teal" onClick={() => handlePayment(request)}>
                        Je prends
                      </Button>
                    )}
                  </Box>
                )) : (
                  <Text>Aucune demande spéciale trouvée.</Text>
                )}
              </Flex>

              {/* Modal pour le formulaire de livraison */}
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
                        requestId={selectedRequest.id}  // Inclure requestId ici
                      />
                    )}
                  </ModalBody>
                </ModalContent>
              </Modal>
            </Box>
          )}

        {activeForm === 'purchases' && <Purchases />}

          {activeForm === 'messages' && (
            <Box mt={4} w="100%">
              <Text fontSize="xl" mb={4}>Messages</Text>
              <VStack spacing={4} align="stretch">
                {messages.map((message, index) => (
                  <Box key={index} borderWidth="1px" borderRadius="lg" overflow="hidden" p={4} w="100%">
                    <Text fontWeight="bold">De:</Text>
                    <Text mb={2}>{message.senderDisplayName}</Text>
                    <Text fontWeight="bold">Message:</Text>
                    <Text mb={2}>{message.message}</Text>
                    <Text fontWeight="bold">Date:</Text>
                    <Text>{new Date(message.timestamp).toLocaleString()}</Text>
                  </Box>
                ))}
              </VStack>
            </Box>
          )}

          {activeForm === 'changePassword' && (
            <Button color='white' background='#e15600' onClick={() => setIsPasswordModalOpen(true)} colorScheme="teal">
              Changer de mot de passe
            </Button>
          )}

              
        </VStack>
      </Box>

      <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirmer le changement de mot de passe</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Êtes-vous sûr de vouloir changer votre mot de passe ? Un email sera envoyé à {user?.email} pour réinitialiser votre mot de passe.</Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={() => setIsPasswordModalOpen(false)}>
              Annuler
            </Button>
            <Button colorScheme="teal" onClick={handlePasswordReset}>
              Confirmer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isDisplayNameModalOpen} onClose={() => setIsDisplayNameModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirmer la mise à jour du pseudo</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Êtes-vous sûr de vouloir mettre à jour votre pseudo ?</Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={() => setIsDisplayNameModalOpen(false)}>
              Annuler
            </Button>
            <Button colorScheme="teal" onClick={handleDisplayNameUpdate}>
              Confirmer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isProfilePhotoModalOpen} onClose={() => setIsProfilePhotoModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirmer la mise à jour de la photo de profil</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Êtes-vous sûr de vouloir mettre à jour votre photo de profil ?</Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={() => setIsProfilePhotoModalOpen(false)}>
              Annuler
            </Button>
            <Button colorScheme="teal" onClick={handleProfilePhotoUpdate}>
              Confirmer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isSpecialRequestsModalOpen} onClose={() => setIsSpecialRequestsModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Acheteurs potentiels</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {buyers.length > 0 ? (
              buyers.map((buyer, index) => (
                <Text key={index}>{buyer}</Text>
              ))
            ) : (
              <Text>Aucun acheteur trouvé pour ce produit.</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={() => setIsSpecialRequestsModalOpen(false)}>
              Fermer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AccountPage;
