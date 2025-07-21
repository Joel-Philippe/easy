'use client';

import React, { useContext, useState, useEffect } from 'react';
import { GlobalCartContext } from './GlobalCartContext';
import { onSnapshot } from 'firebase/firestore';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure,
  useToast,
  Button,
  IconButton,
  Box,
  Flex,
  Badge,
  HStack,
  Text,
  Icon,
  Image,
  Tooltip
} from "@chakra-ui/react";
import { FaShoppingCart } from 'react-icons/fa';
import { CloseIcon, DeleteIcon, AddIcon, MinusIcon } from '@chakra-ui/icons';
import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/components/firebaseConfig';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '@/contexts/AuthContext';
import ModernPaymentModal from './ModernPaymentModal';
import '../app/style.css';
import "../app/GlobalCart.css";

interface GlobalPriceProps {
  isOpen: boolean;
  onClose: () => void;
}
interface CartItem {
  _id: string;
  count: number;
  price: number;
  price_promo?: number; // 👈 important : facultatif
  images: string[];
  deliveryTime: string;
  expiryDate: Date;
}


type GlobalCartItem = {
  count: number;
  price: number;
  price_promo: number;
  images: string[];
  deliveryTime?: string;
  expiryDate?: Date | string;
  _id: string;
};

type GlobalCartType = {
  [title: string]: GlobalCartItem;
};



type StockStatusType = {
  [title: string]: number;
};
type DeliveryInfo = {
  name: string;
  address: string;
  postalCode: string;
  city: string;
  phone?: string;
};

const GlobalPrice: React.FC<GlobalPriceProps> = ({ isOpen, onClose: closeParent }) => {
  const [cartInfo, setCartInfo] = useState<any[]>([]);
  const { onClose: modalOnClose } = useDisclosure();
  const [productToRemove, setProductToRemove] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [buttonText, setButtonText] = useState('Mon panier est à jour');
  const { user } = useAuth();
  const [stockStatus, setStockStatus] = useState<Record<string, number>>({});
  const toast = useToast();
  const [badItems, setBadItems] = useState<string[]>([]);
  const [previouslyBoughtTitles, setPreviouslyBoughtTitles] = useState<string[]>([]);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [stockVerificationErrors, setStockVerificationErrors] = useState<{
    unavailableItems: string[];
    insufficientStockItems: { title: string; requested: number; available: number }[];
  }>({ unavailableItems: [], insufficientStockItems: [] });
  
const cartContext = useContext(GlobalCartContext);

if (!cartContext) {
  throw new Error('GlobalCartContext is undefined');
}

const [globalCart, setGlobalCart] = useState<GlobalCartType>(() => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('globalCart');
    return stored ? JSON.parse(stored) : {};
  }
  return {};
});

const cartCount = Object.values(globalCart).reduce((sum, item) => sum + item.count, 0);

const cleanupDeletedProducts = async () => {
  const currentCart: GlobalCartType = { ...globalCart };
  let hasDeletedProducts = false;
  const deletedProducts: string[] = [];

  // Vérifier chaque produit du panier
  for (const [title, item] of Object.entries(currentCart)) {
    if (!item._id) continue;

    try {
      const productRef = doc(db, 'cards', item._id);
      const productSnap = await getDoc(productRef);

      // Si le produit n'existe plus dans la base de données
      if (!productSnap.exists()) {
        delete currentCart[title];
        deletedProducts.push(title);
        hasDeletedProducts = true;
        console.log(`🗑️ Produit supprimé du panier (n'existe plus) : ${title}`);
      }
    } catch (error) {
      console.error(`Erreur lors de la vérification du produit ${title}:`, error);
      delete currentCart[title];
      deletedProducts.push(title);
      hasDeletedProducts = true;
    }
  }

  // Si des produits ont été supprimés, mettre à jour le panier
  if (hasDeletedProducts) {
    setGlobalCart(currentCart);
    localStorage.setItem('globalCart', JSON.stringify(currentCart));

    // Nettoyer cartInfo également
    let cartInfo = JSON.parse(localStorage.getItem('cartInfo') || '[]');
    cartInfo = cartInfo
      .map((cart: any) => {
        const updatedTitles = cart.titles.filter((t: string) => !deletedProducts.includes(t));
        const updatedImages = cart.images.filter((_: any, index: number) => !deletedProducts.includes(cart.titles[index]));
        const updatedPrices = cart.prices.filter((_: any, index: number) => !deletedProducts.includes(cart.titles[index]));
        const updatedPricePromos = cart.price_promos.filter((_: any, index: number) => !deletedProducts.includes(cart.titles[index]));
        const updatedDeliveryDates = cart.deliveryDates.filter((_: any, index: number) => !deletedProducts.includes(cart.titles[index]));

        return {
          ...cart,
          titles: updatedTitles,
          images: updatedImages,
          prices: updatedPrices,
          price_promos: updatedPricePromos,
          deliveryDates: updatedDeliveryDates,
        };
      })
      .filter((cart: any) => cart.titles.length > 0);

    localStorage.setItem('cartInfo', JSON.stringify(cartInfo));

    // Afficher une notification à l'utilisateur
    if (deletedProducts.length > 0) {
      toast({
        title: "Produits supprimés du panier",
        description: `Les produits suivants ne sont plus disponibles et ont été retirés : ${deletedProducts.join(', ')}`,
        status: "warning",
        duration: 6000,
        isClosable: true,
        position: "top",
      });
    }
  }

  return hasDeletedProducts;
};

  // Vérifier périodiquement les produits supprimés
  useEffect(() => {
    const checkDeletedProducts = async () => {
      if (Object.keys(globalCart).length > 0) {
        await cleanupDeletedProducts();
      }
    };

    // Vérification initiale
    checkDeletedProducts();

    // Vérification périodique toutes les 2 minutes
    const interval = setInterval(checkDeletedProducts, 120000);

    return () => clearInterval(interval);
  }, [globalCart]);

  // Real-time stock updates
  useEffect(() => {
    if (!db) return;
    
    const unsub = onSnapshot(collection(db, 'cards'), snap => {
      const status: Record<string, number> = {};
      const existingProducts = new Set();
      
      snap.docs.forEach(docSnap => {
        const data = docSnap.data();
        const title = data.title;
        status[title] = Number(data.stock) - Number(data.stock_reduc);
        existingProducts.add(title);
      });
      
      setStockStatus(status);

      // Vérifier si des produits du panier n'existent plus
      const cartProducts = Object.keys(globalCart);
      const missingProducts = cartProducts.filter(title => !existingProducts.has(title));
      
      if (missingProducts.length > 0) {
        // Supprimer les produits manquants du panier
        const updatedCart = { ...globalCart };
        missingProducts.forEach(title => {
          delete updatedCart[title];
        });
        
        setGlobalCart(updatedCart);
        localStorage.setItem('globalCart', JSON.stringify(updatedCart));
        
        toast({
          title: "Produits supprimés",
          description: `Ces produits ne sont plus disponibles : ${missingProducts.join(', ')}`,
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
      }
    });
    return () => unsub();
  }, [globalCart]);

useEffect(() => {
  const fetchStock = async () => {
    if (!db) return;

    const status: Record<string, number> = {};

    await Promise.all(
      Object.entries(globalCart).map(async ([title, item]) => {
        if (!item._id) return;

        try {
          const snap = await getDoc(doc(db, 'cards', item._id));
          if (snap.exists()) {
            const data = snap.data();
            status[title] = Number(data.stock) - Number(data.stock_reduc);
          } else {
            // Le produit n'existe plus, le supprimer du panier
            setGlobalCart(prev => {
              const next = { ...prev };
              delete next[title];
              localStorage.setItem('globalCart', JSON.stringify(next));
              return next;
            });

            toast({
              title: "Produit supprimé",
              description: `"${title}" n'est plus disponible et a été retiré du panier.`,
              status: "warning",
              duration: 4000,
              isClosable: true,
            });
          }
        } catch (error) {
          console.error(`Erreur lors de la vérification du produit ${title}:`, error);
        }
      })
    );

    setStockStatus(status);
  };

  if (Object.keys(globalCart).length > 0) {
    fetchStock();
  }
}, [globalCart]);


  // Adjust cart if stockStatus drops below current count
useEffect(() => {
  Object.entries(stockStatus).forEach(([title, available]) => {
    const currentCount = globalCart[title]?.count || 0;

    if (available < currentCount) {
      setGlobalCart(prev => {
        const next = { ...prev };
        if (next[title]) {            // <-- vérifie que l'item existe
          next[title] = {              // évite la mutation directe
            ...next[title],
            count: available,
          };
        }
        return next;
      });

      toast({
        title: "Quantité ajustée",
        description: `"${title}" réduit à ${available} (stock réel).`,
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
    }
  });
}, [stockStatus]);


  // determine if any item is out of stock
  const outOfStockItems = Object.entries(stockStatus)
    .filter(([, available]) => available <= 0)
    .map(([title]) => title);

  useEffect(() => {
    const fetchPreviousPurchases = async () => {
      if (!user?.email || !db) return;
      try {
        const q = query(
          collection(db, 'orders'),
          where('customer_email', '==', user.email)
        );
        const snap = await getDocs(q);
        const titles = new Set<string>();
        snap.forEach(d => {
          const order = d.data();
          order.items?.forEach((item: any) => titles.add(item.title));
        });
        setPreviouslyBoughtTitles(Array.from(titles));
      } catch (err) {
        console.error("Erreur chargement achats :", err);
      }
    };
    fetchPreviousPurchases();
  }, [user]);

  // 🔄 Écoute en temps réel des changements de stock pour les articles dans le panier
  useEffect(() => {
    if (!db) return;
    
    const unsubscribes = Object.entries(globalCart).map(([title, item]) => {
      if (!item._id) return () => {};
      
      const ref = doc(db, 'cards', item._id);
      return onSnapshot(ref, snap => {
        if (snap.exists()) {
          const data = snap.data();
          setStockStatus(prev => ({
            ...prev,
            [title]: Number(data.stock) - Number(data.stock_reduc)
          }));
        } else {
          // Le document n'existe plus, supprimer du panier
          setGlobalCart(prev => {
            const next = { ...prev };
            delete next[title];
            localStorage.setItem('globalCart', JSON.stringify(next));
            return next;
          });
          
          toast({
            title: "Produit supprimé",
            description: `"${title}" a été supprimé du site et retiré de votre panier.`,
            status: "info",
            duration: 5000,
            isClosable: true,
          });
        }
      }, error => {
        console.error(`Erreur listener pour ${title}:`, error);
        // En cas d'erreur persistante, supprimer le produit du panier
        setGlobalCart(prev => {
          const next = { ...prev };
          delete next[title];
          localStorage.setItem('globalCart', JSON.stringify(next));
          return next;
        });
      });
    });
    
    return () => unsubscribes.forEach(unsub => unsub());
  }, [globalCart]);

useEffect(() => {
  const interval = setInterval(() => {
    const now = new Date();
    const updatedCart = { ...globalCart };
    let changed = false;

    for (const [title, item] of Object.entries(globalCart)) {
      if (item.expiryDate && new Date(item.expiryDate) < now) {
        delete updatedCart[title];
        changed = true;
        console.log(`🗑️ Supprimé automatiquement (expiration) : ${title}`);
      }
    }

    if (changed) {
      setGlobalCart(updatedCart);
      localStorage.setItem('globalCart', JSON.stringify(updatedCart));

      // Définition du type pour cartInfo
      type CartInfoItem = {
        titles: string[];
        images: string[];
        prices: number[];
        price_promos: number[];
        deliveryDates: string[];
      };

      let cartInfo: CartInfoItem[] = JSON.parse(localStorage.getItem('cartInfo') || '[]');

      cartInfo = cartInfo
        .map(cart => {
          const newTitles = cart.titles.filter(t => updatedCart[t]);
          return {
            ...cart,
            titles: newTitles,
            images: cart.images.filter((_, i) => updatedCart[cart.titles[i]]),
            prices: cart.prices.filter((_, i) => updatedCart[cart.titles[i]]),
            price_promos: cart.price_promos.filter((_, i) => updatedCart[cart.titles[i]]),
            deliveryDates: cart.deliveryDates.filter((_, i) => updatedCart[cart.titles[i]]),
          };
        })
        .filter(cart => cart.titles.length > 0);

      localStorage.setItem('cartInfo', JSON.stringify(cartInfo));

      toast({
        title: "Produit expiré supprimé",
        description: "Des produits ont été automatiquement retirés.",
        status: "warning",
        duration: 4000,
        isClosable: true,
        position: "top",
      });
    }
  }, 60000); // toutes les 60s

  return () => clearInterval(interval);
}, [globalCart]);

  
  useEffect(() => {
    const info = Object.entries(globalCart).map(([title, item]) => {
      const promo = Number(item.price_promo);
      return {
        title,
        images: item.images,
        price: item.price,
        // n'inclut pricePromo que si valeur > 0
        ...(promo > 0 && { pricePromo: promo }),
        count: item.count,
      };
    });
    setCartInfo(info);
    localStorage.setItem('cartInfo', JSON.stringify(info));
  }, [globalCart]);

  // Animation d'ouverture/fermeture du panier
  useEffect(() => {
    setIsAnimating(true);
    if (!isOpen) {
      setIsClosing(true);
    }
    const timer = setTimeout(() => {
      setIsAnimating(false);
      setIsClosing(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Charger le panier depuis le localStorage au démarrage
useEffect(() => {
  if (typeof window === 'undefined') return; // Sécurité côté serveur

  const storedCart = JSON.parse(localStorage.getItem('globalCart') || '{}') as GlobalCartType;
  setGlobalCart(storedCart);

  const repeated = Object.keys(storedCart).filter(title =>
    previouslyBoughtTitles.includes(title)
  );

  if (repeated.length > 0) {
    // Logique pour les articles déjà achetés
  }
}, [setGlobalCart, previouslyBoughtTitles]);


  // 🔧 CORRECTION: Gestion du scroll sans bloquer les interactions
  useEffect(() => {
    if (isOpen) {
      // Empêcher le scroll du body mais permettre les interactions
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '15px'; // Compenser la scrollbar
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  // Ouvre automatiquement le panier à l'initialisation de la page
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCartOpen(true);
    }, 300); // délai pour laisser le temps au rendu initial

    return () => clearTimeout(timer);
  }, []);

  // Diminuer la quantité ou supprimer l'article si count === 1
const handleDecrease = (title: string) => {
  const newCart = { ...globalCart };
  if (newCart[title]?.count > 1) {
    newCart[title].count = (newCart[title].count || 1) - 1;
    setGlobalCart(newCart);
    localStorage.setItem('globalCart', JSON.stringify(newCart));
  } else {
    handleRemove(title);
  }
  setButtonText('Mettre à jour mon panier');
};


  // Augmenter la quantité de l'article
  const handleIncrease = async (title: string) => {
    const newCart = { ...globalCart };
    const item = newCart[title];
  
    if (!item || !item._id) {
      toast({
        title: "Erreur",
        description: `Impossible d'ajouter plus d'exemplaires de ${title}`,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      return;
    }
  
    try {
      if (!db) {
        // Mode démo - simuler une vérification de stock
        const currentCount = item.count || 0;
        item.count = currentCount + 1;
        newCart[title] = item;
        setGlobalCart(newCart);
        localStorage.setItem("globalCart", JSON.stringify(newCart));
        setButtonText('Mon panier est à jour');
        return;
      }
      
      const productRef = doc(db, "cards", item._id);
      const productSnap = await getDoc(productRef);
  
      if (!productSnap.exists()) {
        // Le produit n'existe plus, le supprimer du panier
        handleRemove(title);
        toast({
          title: "Produit supprimé",
          description: `${title} n'existe plus dans la boutique et a été retiré du panier.`,
          status: "warning",
          duration: 4000,
          isClosable: true,
        });
        return;
      }
  
      const productData = productSnap.data();
      const stock = parseInt(productData.stock || "0");
      const stockReduc = parseInt(productData.stock_reduc || "0");
      const stockRestant = stock - stockReduc;
  
      const currentCount = item.count || 0;
  
      if (currentCount + 1 > stockRestant) {
        toast({
          title: "⛔ Stock limité !",
          description: (
            <Box>
              <Text fontWeight="bold" mb={1}>
                Il ne reste que <Text as="span" color="orange.400">{stockRestant}</Text> exemplaire(s)
              </Text>
              <Text color="gray.600">
                pour <Text as="span" fontStyle="italic" fontWeight="semibold">{title}</Text>.
              </Text>
            </Box>
          ),
          status: "warning",
          duration: 6000,
          isClosable: true,
          position: "top",
          variant: "subtle",
        });
        return;
      }
  
      // ✅ Ajouter l'article si la quantité est OK
      item.count = currentCount + 1;
      newCart[title] = item;
      setGlobalCart(newCart);
      localStorage.setItem("globalCart", JSON.stringify(newCart));
      setButtonText('Mon panier est à jour');
  
    } catch (err) {
      console.error("Erreur de vérification du stock :", err);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la vérification du stock.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const handleRemove = (title: string) => {
    setGlobalCart(prev => {
      const next = { ...prev };
      delete next[title];
      localStorage.setItem('globalCart', JSON.stringify(next));
      return next;
    });
    // Nettoyer aussi badItems
    setBadItems(badItems => badItems.filter(t => t !== title));
  };

  // 🛒 Fonction pour mettre à jour la quantité depuis la modal de paiement
  const handleUpdateQuantityFromModal = (title: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemove(title);
      return;
    }

    const availableStock = stockStatus[title] || 0;
    if (newQuantity > availableStock) {
      toast({
        title: "Stock insuffisant",
        description: `Seulement ${availableStock} disponible(s) pour "${title}".`,
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    setGlobalCart(prev => {
      const next = { ...prev };
      if (next[title]) {
        next[title].count = newQuantity;
      }
      localStorage.setItem('globalCart', JSON.stringify(next));
      return next;
    });
  };

  // Enregistrer le panier dans Firebase (par exemple après validation)
  const saveCartToFirebase = async (deliveryInfo: DeliveryInfo) => {
    if (!user || !db) return;
    try {
      const cartData = {
        userEmail: user.email,
        displayName: user.displayName,
        deliveryInfo, // Enregistrer les informations de livraison
        cart: Object.entries(globalCart).map(([title, item]) => ({
          title,
          count: item.count,
          price: item.price,
          price_promo: item.price_promo || '',
          deliveryDate: item.deliveryTime || 'N/A',
        })),
        onStockError: handleStockError,
        totalPrice: total.toFixed(2),
        timestamp: new Date().toISOString(),
      };
      await addDoc(collection(db, 'userCarts'), cartData);
      setButtonText('Panier enregistré avec succès');
      
      toast({
        position: "top-right",
        duration: 5000,
        isClosable: true,
        render: () => (
          <Box color="black" p={3} bg="#c7a5ff" borderRadius="md" boxShadow="md">
            <strong>Succès</strong> - Votre panier a été enregistré avec succès.
          </Box>
        ),
      });
    } catch (error) {
      console.error('Error saving cart to Firebase:', error);
      setButtonText('Erreur lors de l\'enregistrement');
      
      toast({
        position: "top-right",
        duration: 5000,
        isClosable: true,
        render: () => (
          <Box color="black" p={3} bg="#c7a5ff" borderRadius="md" boxShadow="md">
            <strong>Erreur</strong> - Une erreur est survenue lors de l'enregistrement du panier.
          </Box>
        ),
      });
    }
  };

  const handleTakeCart = () => {
    // Vérifier si l'utilisateur est connecté
    if (!user) {
      toast({ 
        title: 'Veuillez vous connecter pour continuer', 
        status: 'warning',
        duration: 4000,
        isClosable: true
      });
      return;
    }
  
    // Vérifier les articles en rupture de stock
    const outOfStock = Object.entries(stockStatus)
      .filter(([, available]) => available <= 0)
      .map(([title]) => title);
  
    if (outOfStock.length) {
      setBadItems(outOfStock);
      toast({
        title: 'Stock épuisé',
        description: `Veuillez retirer du panier: ${outOfStock.join(', ')}`,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
      return;
    }
  
    setBadItems([]);
    
    // Ouvrir la modal de paiement moderne
    setShowPaymentModal(true);
  };

  // 🔒 Fonction appelée en cas d'erreur de stock depuis la modal de paiement
  const handleStockError = (errorDetails: any) => {
    console.log("🚨 Erreur de stock reçue dans GlobalPrice:", errorDetails);
    
    if (errorDetails?.details) {
      setStockVerificationErrors(errorDetails.details);
      
      // Supprimer automatiquement les articles indisponibles du panier
      if (errorDetails.details.unavailableItems?.length > 0) {
        const updatedCart = { ...globalCart };
        errorDetails.details.unavailableItems.forEach((title: string) => {
          delete updatedCart[title];
        });
        setGlobalCart(updatedCart);
        localStorage.setItem('globalCart', JSON.stringify(updatedCart));
        
        toast({
          title: "Produits supprimés",
          description: `Ces produits ne sont plus disponibles : ${errorDetails.details.unavailableItems.join(', ')}`,
          status: "warning",
          duration: 6000,
          isClosable: true,
        });
      }
      
      // Ajuster les quantités pour les articles avec stock insuffisant
      if (errorDetails.details.insufficientStockItems?.length > 0) {
        const updatedCart = { ...globalCart };
        errorDetails.details.insufficientStockItems.forEach((item: any) => {
          if (updatedCart[item.title] && item.available > 0) {
            updatedCart[item.title].count = item.available;
          } else if (updatedCart[item.title] && item.available === 0) {
            delete updatedCart[item.title];
          }
        });
        setGlobalCart(updatedCart);
        localStorage.setItem('globalCart', JSON.stringify(updatedCart));
        
        toast({
          title: "Quantités ajustées",
          description: "Les quantités ont été automatiquement ajustées selon le stock disponible.",
          status: "warning",
          duration: 6000,
          isClosable: true,
        });
      }
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setGlobalCart({});
    localStorage.setItem('globalCart', JSON.stringify({}));
    localStorage.setItem('cartInfo', JSON.stringify([]));
    
    toast({
      title: "Paiement réussi !",
      description: "Votre commande a été confirmée. Vous recevrez un email de confirmation.",
      status: "success",
      duration: 6000,
      isClosable: true,
      position: "top",
    });
    
    handleCloseClick();
  };

  // Animation d'apparition
  const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  `;

  const CartIcon = styled(IconButton)`
    animation: ${isAnimating && !isClosing ? `${fadeIn} 0.5s ease` : 'none'};
    color: black;
  `;

const total = Object.values(globalCart).reduce(
  (sum, item) => sum + item.count * Number(item.price_promo || item.price),
  0
) || 0;


  // 🔧 CORRECTION: Fonction onClose qui ne bloque pas les interactions
  const onClose = (e?: React.MouseEvent) => {
    // Seulement fermer si on clique directement sur l'overlay (pas sur le panel)
    if (e && e.target === e.currentTarget) {
      if (window.innerWidth < 1000) {
        setIsCartOpen(false);
      }
    }
  };

  const handleCloseClick = () => {
    setIsCartOpen(false);
    closeParent(); // Appeler si besoin
  };

  useEffect(() => {
    if (isOpen) {
      setIsCartOpen(true);
    }
  }, [isOpen]);

  // Calculer les articles avec des erreurs de stock
  const allBadItems = [
    ...stockVerificationErrors.unavailableItems,
    ...stockVerificationErrors.insufficientStockItems.map(item => item.title),
    ...badItems
  ];

  if (!isOpen) return null;

  return (
    <div className="cart-overlay-transparent">
      {isOpen && (
        <div 
          className="cart-overlay-transparent" 
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 999,
            pointerEvents: 'none', // 🔧 CORRECTION: Permettre les clics à travers l'overlay
          }}
        >
          <div 
            className="cart-panel-interactive" 
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              right: 0,
              bottom: 0,
              height: '85vh',
              width: '100vw',
              maxWidth: '440px',
              background: '#f8ede9',
              display: 'flex',
              flexDirection: 'column',
              transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              borderRadius: '16px 0 0 16px',
              overflow: 'hidden',
              pointerEvents: 'auto', // 🔧 CORRECTION: Permettre les interactions sur le panel
              zIndex: 1000,
            }}
          >
            {/* Header compact */}
            <div className="compact-cart-header">
              <div className="compact-header-content">
                <div className="compact-cart-icon-container">
                  <div className="compact-cart-icon">
                    <FaShoppingCart size="20" />
                    {cartCount > 0 && (
                      <div className="compact-cart-badge">
                        {cartCount}
                      </div>
                    )}
                  </div>
                  <div className="compact-cart-title">
                    <p>{cartCount} article{cartCount > 1 ? 's' : ''} • {total.toFixed(2)}€</p>
                  </div>
                </div>
                
                <button className="compact-cart-close" onClick={handleCloseClick}>
                  <CloseIcon />
                </button>
              </div>

              {/* Barre de progression compacte */}
              <div className="compact-shipping-progress">
                <div className="compact-shipping-info">
                  <span className="compact-shipping-label">
                    🚚 Livraison gratuite à 100€
                  </span>
                  {total >= 100 ? (
                    <span className="compact-shipping-achieved">
                    </span>
                  ) : (
                    <span>Plus que {(100 - total).toFixed(2)}€</span>
                  )}
                </div>
                <div className="compact-progress-bar">
                  <div 
                    className="compact-progress-fill"
                    style={{ width: `${Math.min(100, (total / 100) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Contenu scrollable compact */}
            <div className="compact-cart-content">
              {/* Messages d'alerte pour les erreurs de stock */}
              {(stockVerificationErrors.unavailableItems.length > 0 || stockVerificationErrors.insufficientStockItems.length > 0) && (
                <div className="compact-cart-alert stock-error">
                  <div className="compact-alert-icon">🔒</div>
                  <div>
                    <h4>Vérification de stock effectuée</h4>
                    {stockVerificationErrors.unavailableItems.length > 0 && (
                      <p>❌ Supprimés: {stockVerificationErrors.unavailableItems.join(', ')}</p>
                    )}
                    {stockVerificationErrors.insufficientStockItems.length > 0 && (
                      <p>⚠️ Quantités ajustées automatiquement</p>
                    )}
                  </div>
                </div>
              )}

              {/* Message articles épuisés */}
              {allBadItems.length > 0 && (
                <div className="compact-cart-alert">
                  <div className="compact-alert-icon">⚠️</div>
                  <div>
                    <h4>Articles épuisés</h4>
                    <p>{allBadItems.join(', ')} - Veuillez les retirer pour continuer.</p>
                  </div>
                </div>
              )}

              {!user && (
                <div className="compact-cart-alert info">
                  <div className="compact-alert-icon">ℹ️</div>
                  <div>
                    <h4>Connexion requise</h4>
                    <p>Connectez-vous pour finaliser votre commande.</p>
                  </div>
                </div>
              )}

              {/* Articles */}
              {cartInfo.length > 0 ? (
                <div className="compact-cart-items">
                  {cartInfo.map(({ title, images, price, pricePromo, count }) => (
                    <div key={title} className="compact-cart-item">
                      {/* Badge promo compact */}
                      {pricePromo > 0 && (
                        <div className="compact-promo-badge">
                          -{Math.round(((price - pricePromo) / price) * 100)}%
                        </div>
                      )}

                      <div className="compact-item-content">
                        <div className="compact-item-image">
                          <img
                            src={images?.[0] || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=500&fit=crop'}
                            alt={title}
                            className="compact-item-img"
                          />
                          <div className="compact-status-indicator green" />
                        </div>

                        <div className="compact-item-details">
                          <div className="compact-item-header">
                            <h4 className="compact-item-title">{title}</h4>
                            <button
                              className="compact-item-remove"
                              onClick={() => handleRemove(title)}
                            >
                              <DeleteIcon />
                            </button>
                          </div>

                          <div className="compact-item-pricing">
                            <div className="compact-price-row">
                              <span className="compact-item-price">
                                {pricePromo > 0 ? `${pricePromo}€` : `${price}€`}
                              </span>
                              {pricePromo > 0 && (
                                <span className="compact-item-original-price">
                                  {price}€
                                </span>
                              )}
                            </div>
                            {pricePromo > 0 && (
                              <p className="compact-item-savings">
                                Économie: {((price - pricePromo) * count).toFixed(2)}€
                              </p>
                            )}
                          </div>

                          <div className="compact-item-controls">
                            <div className="compact-quantity-controls">
                              <button
                                className="compact-quantity-button"
                                onClick={() => handleDecrease(title)}
                              >
                                <MinusIcon />
                              </button>
                              <div className="compact-quantity-display">{count}</div>
                              <button
                                className="compact-quantity-button"
                                onClick={() => handleIncrease(title)}
                              >
                                <AddIcon />
                              </button>
                            </div>

                            <button className="compact-favorite-button">
                              ❤️ Favoris
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="compact-cart-empty">
                  <div className="compact-empty-icon">
                    🛒
                  </div>
                  <h3>Panier vide</h3>
                  <p>Découvrez nos produits exclusifs</p>
                  <button className="compact-empty-button" onClick={handleCloseClick}>
                    ✨ Découvrir
                  </button>
                </div>
              )}
            </div>

            {/* Footer compact */}
            {cartInfo.length > 0 && (
              <div className="compact-cart-footer">
                <div className="compact-cart-summary">
                  <div className="compact-summary-row total">
                    <span>Total</span>
                    <span className="compact-total-price">
                      {(total + (total >= 100 ? 0 : 4.99)).toFixed(2)}€
                    </span>
                  </div>
                </div>

                <div className="compact-cart-actions">
                  <button
                    className="compact-checkout-button"
                    onClick={handleTakeCart}
                    disabled={allBadItems.length > 0 || isProcessingPayment || cartInfo.length === 0}
                  >
                    {isProcessingPayment ? (
                      <>
                        <div className="compact-spinner" />
                        Traitement...
                      </>
                    ) : (
                      <>
                        🔒 Finaliser ma commande
                      </>
                    )}
                  </button>
                  
                  <button className="compact-continue-button" onClick={handleCloseClick}>
                    Continuer mes achats
                  </button>
                </div>

                {/* Garanties compactes */}
                <div className="compact-trust-indicators">
                  <div className="compact-trust-item">
                    <div className="compact-trust-icon security">🔒</div>
                    <p className="compact-trust-text">Stock vérifié</p>
                  </div>
                  <div className="compact-trust-item">
                    <div className="compact-trust-icon shipping">🚚</div>
                    <p className="compact-trust-text">Livraison rapide</p>
                  </div>
                  <div className="compact-trust-item">
                    <div className="compact-trust-icon returns">↩️</div>
                    <p className="compact-trust-text">Retours gratuits</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Modal de paiement moderne avec contrôles de quantité */}
      <ModernPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        cartItems={Object.entries(globalCart).map(([title, item]) => ({
          title,
          ...item
        }))}
        total={total}
        user={user}
        onPaymentSuccess={handlePaymentSuccess}
        onStockError={handleStockError}
        onUpdateQuantity={handleUpdateQuantityFromModal}
        onRemoveItem={handleRemove}
        stockStatus={stockStatus}
      />

      <style jsx>{`
        .compact-cart-header {
          background: #f8ede9;
          color: white;
          padding: 16px;
          position: relative;
          overflow: hidden;
        }

        .compact-cart-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }

        .compact-header-content {
          position: relative;
          z-index: 2;
          color: #FF9800;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .compact-cart-icon-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .compact-cart-icon {
          position: relative;
          width: 36px;
          height: 36px;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .compact-cart-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          background: #ff6b35;
          color: white;
          border-radius: 50%;
          min-width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: bold;
          animation: pulse 2s infinite;
        }

        .compact-cart-title h3 {
          font-size: 16px;
          font-weight: bold;
          margin: 0 0 2px 0;
          font-family: 'Playfair Display', serif;
        }

        .compact-cart-title p {
          font-size: 12px;
          opacity: 0.9;
          margin: 0;
        }

        .compact-cart-close {
          background: #e63199;
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .compact-cart-close:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
        }

        .compact-shipping-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 6px;
          margin-bottom: 6px;
        }

        .compact-shipping-label {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .compact-progress-bar {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
          overflow: hidden;
        }

        .compact-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #fbbf24, #f59e0b);
          border-radius: 3px;
          transition: width 0.5s ease;
          position: relative;
          overflow: hidden;
        }

        .compact-progress-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          animation: shimmer 2s infinite;
        }

        .compact-cart-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .compact-cart-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          padding: 20px;
        }

        .compact-empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
          animation: float 3s ease-in-out infinite;
        }

        .compact-cart-empty h3 {
          font-size: 18px;
          font-weight: bold;
          color: #1f2937;
          margin: 0 0 8px 0;
          font-family: 'Playfair Display', serif;
        }

        .compact-cart-empty p {
          color: #6b7280;
          margin: 0 0 16px 0;
          font-size: 14px;
        }

        .compact-empty-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 14px;
        }

        .compact-empty-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        .compact-cart-alert {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 12px;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 12px;
        }

        .compact-cart-alert.info {
          background: #eff6ff;
          border-color: #bfdbfe;
        }

        .compact-cart-alert.stock-error {
          background: #f0f9ff;
          border-color: #0ea5e9;
        }

        .compact-alert-icon {
          flex-shrink: 0;
          margin-top: 1px;
        }

        .compact-cart-alert h4 {
          font-weight: 600;
          color: #dc2626;
          margin: 0 0 2px 0;
          font-size: 12px;
        }

        .compact-cart-alert.info h4 {
          color: #2563eb;
        }

        .compact-cart-alert.stock-error h4 {
          color: #0ea5e9;
        }

        .compact-cart-alert p {
          color: #7f1d1d;
          margin: 0;
          font-size: 11px;
          line-height: 1.3;
        }

        .compact-cart-alert.info p {
          color: #1e40af;
        }

        .compact-cart-alert.stock-error p {
          color: #0c4a6e;
        }

        .compact-cart-items {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .compact-cart-item {
          background: #f8ede9;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 12px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .compact-cart-item:hover {
          box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
          transform: translateY(-1px);
        }

        .compact-promo-badge {
          position: absolute;
          top: 2px;
          right: -6px;
          background: #dc2626;
          color: white;
          font-size: 10px;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 10px;
          z-index: 1;
          animation: bounce 2s infinite;
        }

        .compact-item-content {
          display: flex;
          gap: 12px;
        }

        .compact-item-image {
          position: relative;
          flex-shrink: 0;
        }

        .compact-item-img {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 8px;
          transition: transform 0.3s ease;
        }

        .compact-item-img:hover {
          transform: scale(1.05);
        }

        .compact-status-indicator {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: 1px solid white;
        }

        .compact-status-indicator.green {
          background: #10b981;
        }

        .compact-status-indicator.orange {
          background: #f59e0b;
        }

        .compact-status-indicator.red {
          background: #ef4444;
        }

        .compact-item-details {
          flex: 1;
          min-width: 0;
        }

        .compact-item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 6px;
        }

        .compact-item-title {
          font-weight: 600;
          color: #1f2937;
          margin: 0;
          font-size: 13px;
          line-height: 1.3;
          padding-right: 8px;
        }

        .compact-item-remove {
          background: none;
          border: none;
          color: #ef4444;
          cursor: pointer;
          padding: 2px;
          border-radius: 50%;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .compact-item-remove:hover {
          background: #fef2f2;
          transform: scale(1.1);
        }

        .compact-item-pricing {
          margin-bottom: 8px;
        }

        .compact-price-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 2px;
        }

        .compact-item-price {
          font-size: 14px;
          font-weight: bold;
          color: #7c3aed;
        }

        .compact-item-original-price {
          font-size: 12px;
          color: #9ca3af;
          text-decoration: line-through;
        }

        .compact-item-savings {
          font-size: 10px;
          color: #059669;
          font-weight: 500;
          margin: 0;
        }

        .compact-item-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .compact-quantity-controls {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .compact-quantity-button {
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 10px;
        }

        .compact-quantity-button:hover:not(:disabled) {
          border-color: #7c3aed;
          background: #f3f4f6;
        }

        .compact-quantity-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .compact-quantity-display {
          width: 32px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: #1f2937;
          font-size: 12px;
        }

        .compact-favorite-button {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 10px;
          display: flex;
          align-items: center;
          gap: 2px;
          transition: all 0.2s ease;
        }

        .compact-favorite-button:hover {
          color: #7c3aed;
          background: #f3f4f6;
        }

        .compact-cart-footer {
          background:rgb(249, 240, 237);
          border-top: 1px solid #e5e7eb;
          padding: 16px;
          padding-top: 0;
        }

        .compact-cart-summary {
          margin-bottom: 12px;
        }

        .compact-summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
          font-size: 12px;
        }

        .compact-summary-row.total {
          font-size: 16px;
          font-weight: bold;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #e5e7eb;
        }

        .compact-total-price {
          background: linear-gradient(135deg, #7c3aed, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-size: 18px;
          font-weight: bold;
        }

        .compact-free-shipping {
          color: #059669;
          font-weight: 600;
        }

        .compact-cart-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .compact-checkout-button {
          background: linear-gradient(135deg, #FF9800 0%, #f91bf8 100%);
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          position: relative;
          overflow: hidden;
        }

        .compact-checkout-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 15px rgba(124, 58, 237, 0.4);
        }

        .compact-checkout-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .compact-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .compact-continue-button {
          background: white;
          color: #374151;
          border: 1px solid #d1d5db;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 13px;
        }

        .compact-continue-button:hover {
          border-color: #7c3aed;
          background: #f9fafb;
        }

        .compact-trust-indicators {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #f3f4f6;
        }

        .compact-trust-item {
          text-align: center;
        }

        .compact-trust-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 4px;
          font-size: 12px;
        }

        .compact-trust-icon.security {
          background: #d1fae5;
        }

        .compact-trust-icon.shipping {
          background: #dbeafe;
        }

        .compact-trust-icon.returns {
          background: #e0e7ff;
        }

        .compact-trust-text {
          font-size: 10px;
          color: #6b7280;
          margin: 0;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% { transform: translateY(0); }
          40%, 43% { transform: translateY(-6px); }
          70% { transform: translateY(-3px); }
          90% { transform: translateY(-1px); }
        }

        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .cart-panel-interactive {
            max-width: 100vw !important;
            border-radius: 0 !important;
          }
          
          .compact-cart-header {
            padding: 14px;
          }
          
          .compact-cart-content {
            padding: 14px;
          }
          
          .compact-cart-footer {
            padding: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default GlobalPrice;
