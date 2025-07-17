import React, { useState, useEffect, useContext } from 'react';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Button, useDisclosure, useToast } from '@chakra-ui/react';
import { GlobalCartContext } from './GlobalCartContext';
import '../app/Panier.css';

interface Product {
  title: string;
  price: string;
  price_promo: string;
  images: string[];
  deliveryTime: string;
}

interface PanierProps {
  selectedProduct: { [key: string]: Product };
  isAlreadyInCart: boolean;
  setButtonText: (text: string) => void;
  buttonText: string;
  onCartUpdate?: () => void;
}

const Panier: React.FC<PanierProps> = ({ selectedProduct, isAlreadyInCart, setButtonText, buttonText, onCartUpdate }) => {
  const [quantity, setQuantity] = useState<{ [key: string]: { count: number, price: number, price_promo: number } }>({});
  const { globalCart, setGlobalCart } = useContext(GlobalCartContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const addToGlobalCart = () => {
    let hasChanges = false;
    const newGlobalCart = { ...globalCart };

    Object.keys(selectedProduct).forEach(key => {
      const product = selectedProduct[key];
      if (!newGlobalCart[product.title]) {
        newGlobalCart[product.title] = {
          count: quantity[product.title]?.count || 1,
          price: Number(product.price),
          price_promo: Number(product.price_promo),
          deliveryTime: product.deliveryTime
        };
        hasChanges = true;
      }
    });

    if (!hasChanges) {
      onOpen();
      return;
    }

    setGlobalCart(newGlobalCart);
    localStorage.setItem('globalCart', JSON.stringify(newGlobalCart));

    let existingCartInfo = JSON.parse(localStorage.getItem('cartInfo') || '[]');
    if (!Array.isArray(existingCartInfo)) {
      existingCartInfo = [existingCartInfo];
    }

    Object.values(selectedProduct).forEach(product => {
      const existingProductIndex = existingCartInfo.findIndex(cart => cart.titles.includes(product.title));
      if (existingProductIndex === -1) {
        const newCartInfo = {
          titles: [product.title],
          prices: [product.price],
          price_promos: [product.price_promo],
          deliveryDates: [product.deliveryTime],
          total: Number(product.price) * (quantity[product.title]?.count || 1),
          images: [product.images],
        };
        existingCartInfo.push(newCartInfo);
      } else {
        const existingProduct = existingCartInfo[existingProductIndex];
        if (!existingProduct.titles.includes(product.title)) {
          existingProduct.titles.push(product.title);
          existingProduct.prices.push(product.price);
          existingProduct.price_promos.push(product.price_promo);
          existingProduct.deliveryDates.push(product.deliveryTime);
          existingProduct.total += Number(product.price) * (quantity[product.title]?.count || 1);
          existingProduct.images.push(product.images);
        }
      }
    });

    localStorage.setItem('cartInfo', JSON.stringify(existingCartInfo));
    setButtonText('Mon panier est à jour');
    toast({
      title: "Succès",
      description: "Votre panier a été mis à jour avec succès.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
    if (onCartUpdate) {
      onCartUpdate();
    }
  };

  useEffect(() => {
    const savedQuantities = JSON.parse(localStorage.getItem('savedQuantities') || '{}');
    const newQuantity = Object.keys(selectedProduct).reduce((acc, key) => {
      return { ...acc, [selectedProduct[key].title]: { count: savedQuantities[selectedProduct[key].title] || 1, price: Number(selectedProduct[key].price), price_promo: Number(selectedProduct[key].price_promo) } };
    }, {});
    setQuantity(newQuantity);
  }, [selectedProduct]);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(quantity));
  }, [quantity]);

  useEffect(() => {
    const isInGlobalCart = Object.values(selectedProduct).some(product => !globalCart[product.title]);
    if (isInGlobalCart) {
      setButtonText('Ajouter au panier');
    } else {
      setButtonText('Mon panier est à jour');
    }
  }, [globalCart, selectedProduct]);

  const handleClick = () => {
    if (buttonText === 'Mon panier est à jour') {
      onOpen();
    } else {
      addToGlobalCart();
    }
  };

  return (
    <div className="panier"
    
    >

      <button className="panier-total-to-add" onClick={handleClick}>
        {buttonText}
      </button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent bg="bisque">
          <ModalHeader>Sélection déjà à jour</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            Votre sélection est déjà à jour dans le panier global.
          </ModalBody>
          <ModalFooter>
            <Button bg="#555" color="bisque" variant="ghost" onClick={onClose}>
              Ok
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default Panier;
