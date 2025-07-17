import React, { useState, useEffect, useContext, useRef } from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Button, useDisclosure } from '@chakra-ui/react';
import ImageSlider from '../components/ImageSlider';
import Panier from '../components/panier';
import { GlobalCartContext } from './GlobalCartContext';
import '../app/Panier.css';

const ProductCard = ({ card, setGlobalCartCount }) => {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [productToRemove, setProductToRemove] = useState(null);
  const [isAlreadyInCart, setIsAlreadyInCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(() => {
    if (card && card.title) {
      const savedProduct = localStorage.getItem(card.title);
      if (savedProduct) {
        try {
          return JSON.parse(savedProduct);
        } catch (error) {
          console.error('Error parsing saved product:', error);
          return {};
        }
      }
    }
    return {};
  });
  const [buttonText, setButtonText] = useState('Ajouter au panier');

  const { globalCart, setGlobalCart } = useContext(GlobalCartContext);
  const popupRef = useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleClickOpen = () => {
    setOpen(true);
    document.body.classList.add('no-scroll');
    checkIfAlreadyInCart();
  };

  const handleClose = () => {
    setOpen(false);
    document.body.classList.remove('no-scroll');
  };

  const handleConfirmClose = () => {
    setConfirmOpen(false);
  };

  const handleConfirmRemove = () => {
    if (productToRemove) {
      handleAddClick(productToRemove.id, productToRemove.title, productToRemove.price, productToRemove.price_promo, productToRemove.images, productToRemove.deliveryTime, true);
      setProductToRemove(null);
    }
    setConfirmOpen(false);
  };

  const checkIfAlreadyInCart = () => {
    const existingCartInfo = JSON.parse(localStorage.getItem('cartInfo') || '[]');
    const productTitles = Object.values(selectedProduct).map(product => product.title);
  
    const isInCart = existingCartInfo.some(cart =>
      Array.isArray(cart.titles) &&
      cart.titles.every(title => productTitles.includes(title)) &&
      productTitles.every(title => cart.titles.includes(title))
    );
  
    setIsAlreadyInCart(isInCart);
  };
  

  useEffect(() => {
    if (card && card.title) {
      localStorage.setItem(card.title, JSON.stringify(selectedProduct));
      checkIfAlreadyInCart();
    }
  }, [selectedProduct]);

  const calculateSelectedPercentage = () => {
    if (!card) return 0;
    const totalProducts = 1 + (card.produits_derives ? card.produits_derives.length : 0);
    const selectedCount = selectedProduct ? Object.values(selectedProduct).filter(Boolean).length : 0;
    return (selectedCount / totalProducts) * 100;
  };

  const selectedPercentage = calculateSelectedPercentage() || 0;

  const handleAddClick = (id, title, price, price_promo, images, deliveryTime, confirmRemoval = false) => {
    if (!confirmRemoval && selectedProduct && selectedProduct[id]) {
      setProductToRemove({ id, title, price, price_promo, images, deliveryTime });
      setConfirmOpen(true);
      return;
    }

    setSelectedProduct(prevState => {
      const newState = { ...prevState };
      if (newState[id]) {
        delete newState[id];

        const newGlobalCart = { ...globalCart };
        delete newGlobalCart[title];
        setGlobalCart(newGlobalCart);
        localStorage.setItem('globalCart', JSON.stringify(newGlobalCart));

        let cartInfo = JSON.parse(localStorage.getItem('cartInfo') || '[]');
        if (!Array.isArray(cartInfo)) {
          cartInfo = [cartInfo];
        }
        const productIndex = cartInfo.findIndex(cart => cart.titles.includes(title));
        if (productIndex !== -1) {
          const titleIndex = cartInfo[productIndex].titles.indexOf(title);
          if (titleIndex !== -1) {
            cartInfo[productIndex].prices.splice(titleIndex, 1);
            cartInfo[productIndex].price_promos.splice(titleIndex, 1);
            cartInfo[productIndex].titles.splice(titleIndex, 1);
            cartInfo[productIndex].deliveryDates.splice(titleIndex, 1); // Remove delivery date
            if (cartInfo[productIndex].images && cartInfo[productIndex].images.length > titleIndex) {
              cartInfo[productIndex].images.splice(titleIndex, 1);
            }
            if (cartInfo[productIndex].titles.length === 0) {
              cartInfo.splice(productIndex, 1);
            }
          }
        }
        localStorage.setItem('cartInfo', JSON.stringify(cartInfo));
      } else {
        newState[id] = { title, price: Number(price), price_promo: Number(price_promo), images, deliveryTime };
      }
      localStorage.setItem('cart', JSON.stringify(newState));
      setButtonText('Mettre à jour mon panier');
      checkIfAlreadyInCart();
      return newState;
    });
  };

  const addToGlobalCart = () => {
    const newCart = { ...globalCart };
    Object.values(selectedProduct).forEach(product => {
      if (!newCart[product.title]) {
        newCart[product.title] = { count: 1, price: product.price, price_promo: product.price_promo, deliveryTime: product.deliveryTime };
      } else {
        newCart[product.title].count += 1;
      }
    });
    setGlobalCart(newCart);
    localStorage.setItem('globalCart', JSON.stringify(newCart));

    const totalItems = Object.values(newCart).reduce((sum, item) => sum + item.count, 0);
    setGlobalCartCount(totalItems);

    setButtonText('Mon panier est à jour');
  };

  const isSelectedInGlobalCart = () => {
    return Object.values(selectedProduct).some(product => !globalCart[product.title]);
  };

  const handleClickOutside = (event) => {
    if (popupRef.current && !popupRef.current.contains(event.target)) {
      handleClose();
    }
  };

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const hasProduitsDerivesWithTitles = card && card.produits_derives && card.produits_derives.some(product => product.titre);

  return (
    <div>
      <button
        onClick={handleClickOpen}
        style={{ 
          border: selectedPercentage > 0 ? 'gold' : 'gold',
          color: '#ac5a1e',
          fontWeight: '900',
          borderStyle: 'dotted',
          borderWidth: '4px',
          borderRadius: '20px',
          padding: '10px',
          opacity: selectedPercentage === 0 ? 1 : `${selectedPercentage / 100}`
        }}
      >
        ça m'interesse 
      </button>
      {open && (
        <div className="dialog-overlay">
          <div className="dialog-content" ref={popupRef}>
            <button onClick={handleClose} style={{ color: '#ac5a1e' }}>Fermer</button>
            <h2 style={{ color: '#333', fontSize: '16px', fontWeight: 'bold' }}>{card.title}
            {card.deliveryTime && (
              <p style={{ color: '#ac5a1e', fontStyle: 'italic', fontSize: '15px', fontWeight: '200' }}>Temps de livraison: {card.deliveryTime}</p>
            )}
            </h2>
            <div style={{ position: 'relative' }}>
              {card.images.length > 0 && (
                <>
                  <ImageSlider images={card.images} />
                  {selectedProduct && selectedProduct['main'] && (
                    <FaCheckCircle
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      color: 'white',
                      fontSize: 50
                    }}
                  />
                  )}
                </>
              )}
            </div>
            <p style={{ color: '#ac5a1e', fontSize: '16px', fontWeight: 'bold' }}>
              {card.price_promo ? (
                <>
                  <span style={{ color: '#9E9E9E', textDecoration: 'line-through' }}>{card.price}€</span>
                  <span style={{ color: '#ac5a1e', marginLeft: '10px' }}>{card.price_promo}€</span>
                </>
              ) : (
                <span>{card.price}€</span>
              )}
              <button 
                style={{ 
                  margin: '10px', 
                  color: selectedProduct && selectedProduct['main'] ? 'rgb(255 152 0)' : 'rgb(255 152 0)'
                }} 
                onClick={() => handleAddClick('main', card.title, card.price, card.price_promo, card.images, card.deliveryTime)}
              >
                {selectedProduct && selectedProduct['main'] ? 'Enlever du panier ?' : 'Sélectionner la proposition'}
              </button>
            </p>
            {hasProduitsDerivesWithTitles && (
              <>
                <h2 style={{ color: '#ac5a1e', fontSize: 'larger', fontWeight: 'bold', marginBottom: '10px', marginTop: '20px' }}>En rapport avec cette l'offre</h2>
                {card.produits_derives.map((product, index) => (
                  product.titre && (
                    <div key={index} style={{ position: 'relative' }}>
                      <h3 style={{ color: '#333', fontSize: '16px', fontWeight: 'bold' }}>{product.titre}
                      {product.deliveryTime && (
                        <p style={{ color: '#ac5a1e', fontStyle: 'italic', fontSize: '15px', fontWeight: '200'}}>Temps de livraison: {product.deliveryTime}</p>
                      )}
                      </h3>
                      {product.images && product.images.length > 0 && (
                        <div style={{ position: 'relative' }}>
                          <ImageSlider images={product.images} />
                          {selectedProduct && selectedProduct[index] && (
                            <FaCheckCircle
                            style={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              color: 'white',
                              fontSize: 50
                            }}
                          />
                          )}
                        </div>
                      )}
                      {product.price_promo ? (
                        <p style={{ color: '#ac5a1e', fontSize: '16px', fontWeight: 'bold',}}>
                          <span style={{ color: '#9E9E9E', textDecoration: 'line-through' }}>{product.prix}€</span>
                          <span style={{ color: '#ac5a1e', marginLeft: '10px' }}>{product.price_promo}€</span>
                          <button 
                            style={{ 
                              margin: '15px',
                              color: selectedProduct && selectedProduct[index] ? 'rgb(255 152 0)' : 'rgb(255 152 0)'
                            }} 
                            onClick={() => handleAddClick(index, product.titre, product.prix, product.price_promo, product.images, product.deliveryTime)}
                          >
                            {selectedProduct && selectedProduct[index] ? 'Enlever du panier ?' : 'Sélectionner la proposition'}
                          </button>
                        </p>
                      ) : (
                        <p style={{ color: '#ac5a1e', fontSize: '16px', fontWeight: 'bold' }}>
                          <span>{product.prix}€</span>
                          <button 
                            style={{ 
                              margin: '15px', 
                              color: selectedProduct && selectedProduct[index] ? 'rgb(255 152 0)' : 'rgb(255 152 0)'
                            }} 
                            onClick={() => handleAddClick(index, product.titre, product.prix, product.price_promo, product.images, product.deliveryTime)}
                          >
                            {selectedProduct && selectedProduct[index] ? 'Enlever du panier ?' : 'Sélectionner la proposition'}
                          </button>
                        </p>
                      )}
                    </div>
                  )
                ))}
              </>
            )}
            {selectedProduct && Object.keys(selectedProduct).length > 0 && (
              <div className="fixed-footer">
                <Panier 
                  selectedProduct={selectedProduct} 
                  isAlreadyInCart={isAlreadyInCart} 
                  setButtonText={setButtonText} 
                  buttonText={buttonText} 
                  onCartUpdate={() => setButtonText('Mettre à jour mon panier')}
                />
                <div className="fixed-button-container">
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {confirmOpen && (
        <Modal isOpen={confirmOpen} onClose={handleConfirmClose}>
          <ModalOverlay />
          <ModalContent bg="bisque">
            <ModalHeader>Confirmation de suppression</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              Êtes-vous sûr de vouloir supprimer cet article du panier ?
            </ModalBody>
            <ModalFooter>
              <Button bg="red" color="white" onClick={handleConfirmRemove}>
                Oui
              </Button>
              <Button variant="ghost" onClick={handleConfirmClose}>
                Non
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
};

export default ProductCard;
