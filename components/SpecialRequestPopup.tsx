import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  useToast,
  VStack,
  Box,
  Avatar,
  Flex,
  Checkbox,
} from '@chakra-ui/react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/components/firebaseConfig';
import ImageSlider from '@/components/ImageSlider';

const SpecialRequestModal = ({ isOpen, onClose, currentCard, allProducts }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<any>>(new Set());
  const [alreadyRequestedProducts, setAlreadyRequestedProducts] = useState<Set<string>>(new Set());
  const [sellerInfo, setSellerInfo] = useState(null);
  const [isSecondModalOpen, setIsSecondModalOpen] = useState(false);
  const toast = useToast();

  // Réinitialiser la sélection des produits à l'ouverture de la popup
  useEffect(() => {
    if (isOpen) {
      setSelectedProducts(new Set()); // Réinitialiser les produits sélectionnés
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchRequestedProducts = async () => {
      if (user && user.email) {
        setSelectedProducts(new Set()); // S'assurer que les produits sélectionnés sont réinitialisés
        setAlreadyRequestedProducts(new Set());

        const q = query(
          collection(db, 'specialRequests'),
          where('senderEmail', '==', user.email)
        );
        const querySnapshot = await getDocs(q);

        const requestedProducts = new Set();
        querySnapshot.forEach((doc) => {
          doc.data().selectedProducts.forEach((product) => {
            requestedProducts.add(product.title);
          });
        });

        setAlreadyRequestedProducts(requestedProducts);
      }
    };

    fetchRequestedProducts();
  }, [user, currentCard]);

  const handleProductSelection = (product: any) => {
    setSelectedProducts((prevSelectedProducts) => {
      const newSet = new Set(prevSelectedProducts);
      if (newSet.has(product)) {
        newSet.delete(product);
      } else {
        newSet.add(product);
      }
      return newSet;
    });
  };

  const fetchSellerInfo = async () => {
    // Vérifier à nouveau la sélection avant d'afficher le profil
    if (selectedProducts.size === 0) {
      toast({
        title: 'Aucun produit sélectionné',
        description: 'Veuillez sélectionner au moins un produit pour voir les informations du proposant.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      if (currentCard) {
        const { prenom_du_proposant, photo_du_proposant } = currentCard;

        if (prenom_du_proposant && photo_du_proposant) {
          setSellerInfo({
            prenom: prenom_du_proposant,
            photo: photo_du_proposant,
          });
        } else {
          throw new Error('Informations du proposant indisponibles.');
        }
      }

      setIsSubmitting(false);
      setIsSecondModalOpen(true);
    } catch (error) {
      console.error('Erreur lors de la récupération des informations du proposant:', error);
      setError(error.message);
      setIsSubmitting(false);
    }
  };

  const handleSubmitSpecialRequest = async () => {
    const selectedProductsList = Array.from(selectedProducts).map((product: any) => ({
      title: product.title,
      price: product.price,
    }));

    if (selectedProductsList.length === 0) {
      toast({
        title: 'Aucun produit sélectionné',
        description: 'Veuillez sélectionner au moins un produit pour faire une demande spéciale.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
      return;
    }

    try {
      const request = {
        senderEmail: user.email,
        senderDisplayName: user.displayName,
        selectedProducts: selectedProductsList,
        sellerName: currentCard.prenom_du_proposant,
        sellerPhoto: currentCard.photo_du_proposant,
        timestamp: new Date().toISOString(),
      };

      await addDoc(collection(db, 'specialRequests'), request);

      await fetch('/api/sendSpecialRequestEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          displayName: user.displayName,
          selectedProducts: selectedProductsList,
        }),
      });

      toast({
        title: 'Demande envoyée',
        description: 'Votre demande spéciale a été envoyée avec succès.',
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });

      setIsSecondModalOpen(false);
      onClose();
    } catch (error) {
      console.error("Erreur lors de l'envoi de la demande spéciale:", error);
      toast({
        title: 'Erreur',
        description: "Une erreur est survenue lors de l'envoi de la demande spéciale.",
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent p={[2, 3, 4]} m={[2, 3, 4]} background={'#fff4df'} maxHeight="80vh" display="flex" flexDirection="column">
          <ModalHeader>Faire une demande spéciale</ModalHeader>
          <ModalCloseButton />
          <ModalBody overflowY="auto" flex="1">
            <VStack align="start" spacing={4}>
              {allProducts.map((product, index) => (
                <Box key={index} borderWidth="1px" borderRadius="lg" overflow="hidden" p={2} w="100%">
                  <Checkbox
                    onChange={() => handleProductSelection(product)}
                    isChecked={selectedProducts.has(product) || alreadyRequestedProducts.has(product.title)}
                    isDisabled={alreadyRequestedProducts.has(product.title)}
                    colorScheme="blue"
                    size="lg"
                  >
                    <Text fontWeight="bold">{product.title}, {product.price}€</Text>
                  </Checkbox>
                  <ImageSlider images={product.images} style={{ maxWidth: '200px', maxHeight: '200px' }} />
                  {alreadyRequestedProducts.has(product.title) && (
                    <Text color="#9E9E9E">Demande déjà réalisée</Text>
                  )}
                </Box>
              ))}
            </VStack>
            {error && <Text color="red.500">{error}</Text>}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Annuler
            </Button>
            <Button
              colorScheme="green"
              onClick={fetchSellerInfo}
              isLoading={isSubmitting}
              isDisabled={selectedProducts.size === 0} // Désactiver le bouton si aucun produit sélectionné
            >
              Rechercher
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isSecondModalOpen} onClose={() => setIsSecondModalOpen(false)} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent p={[2, 3, 4]} m={[2, 3, 4]} background={"#fff4df"} maxHeight="80vh" display="flex" flexDirection="column">
          <ModalHeader fontSize="1em">Propriétaire de l'offre</ModalHeader>
          <ModalCloseButton />
          <ModalBody overflowY="auto" flex="1">
            {sellerInfo ? (
              <Box borderRadius="lg" w="100%">
                <Flex alignItems="center">
                  <Avatar src={sellerInfo.photo} name={sellerInfo.prenom} size="md" mr={4} />
                  <Text fontWeight="bold">{sellerInfo.prenom}</Text>
                </Flex>
              </Box>
            ) : (
              <Text>Aucune information disponible pour ce proposant</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={() => setIsSecondModalOpen(false)}>
              Fermer
            </Button>
            <Button colorScheme="green" onClick={handleSubmitSpecialRequest}>
              Envoyer la demande
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default SpecialRequestModal;
