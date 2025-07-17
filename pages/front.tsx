"use client";
import React, { useEffect, useState, useContext, useRef } from 'react';
import { FaNewspaper, FaRegListAlt, FaCheck, FaSearch } from 'react-icons/fa';
import { Button, Box, Text, useDisclosure, Input, InputGroup, InputLeftElement } from '@chakra-ui/react';
import Image from 'next/image';
import { InfoIcon } from '@chakra-ui/icons';
import ReadMore from '../components/ReadMore';
import Countdown from '../components/Countdown';
import Modal from '../components/Modal';
import ImageSlider from '../components/ImageSlider';
import { DonutChart } from '../components/average';
import StockProgressBar from '../components/StockProgressBar';
import { calculateDonutPercentage } from '../components/calculateDonutPercentage';
import Link from 'next/link';
import LoadingSpinner from "../components/LoadingSpinner";
import { GlobalCartContext } from '../components/GlobalCartContext';
import CustomMenuItem from '../components/CustomMenuItem';
import UpdateCardModal from '../components/UpdateCardModal';
import GlobalPrice from '../components/globalprice';
import { useAuth } from '@/contexts/AuthContext';
import SpecialRequestModal from '@/components/SpecialRequestPopup';
import '../app/video-banner.css';
import AnimatedBanner from '@/components/AnimatedBanner';
import '../app/globals.css';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from '@/components/firebaseConfig';
import ProductDetailsModal from "../components/ProductDetailsModal";
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import RatingStars from '@/components/RatingStars';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { PlusCircle } from "lucide-react";
import SearchBar from "../components/SearchBar";
import FilterButtons from "../components/FilterButtons";
import NoSearchResults from "../components/NoSearchResults";
import { Grid3X3, Sparkles } from 'lucide-react';
import ModernSlider from "../components/ImageSlider";

interface Card {
  _id: string;
  categorie: string;
  categorieImage: string;
  categorieBackgroundColor: string;
  affiche: string;
  nouveau: boolean;
  title: string;
  subtitle?: string;
  description: string;
  images: string[];
  stock: number;
  stock_reduc: number;
  price: string;
  price_promo: string;
  time: Date;
  point_important_un: string;
  point_important_deux: string;
  point_important_trois: string;
  point_important_quatre: string;
  img_point_important_un: string;
  img_point_important_deux: string;
  img_point_important_trois: string;
  img_point_important_quatre: string;
  prenom_du_proposant: string;
  photo_du_proposant: string;
  origine: string;
  caracteristiques: { titre: string, caracteristiques: { nom: string, valeur: string }[] }[];
  produits_derives: { titre: string, description: string, prix: string, images: string[] }[];
  reviews?: any[];
  deliveryTime?: string;
}

export default function Front() {
  const [cards, setCards] = useState<Card[]>([]);
  const [expiredCards, setExpiredCards] = useState<Set<string>>(new Set());
  const [specialRequests, setSpecialRequests] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [formCard, setFormCard] = useState<Card | null>(null);
  const [imageValues, setImageValues] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [selectedButton, setSelectedButton] = useState('');
  const [clickedButton, setClickedButton] = useState<string | null>(null);
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [carouselImages, setCarouselImages] = useState<string[]>([]);
  const { user } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const categoryIconsRef = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const categoryMenuRef = useRef<HTMLDivElement | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Card | null>(null);
  const [buttonText, setButtonText] = useState('Ajouter au panier');
  const { globalCart, setGlobalCart } = useContext(GlobalCartContext);
  const [videoEnded, setVideoEnded] = useState(false);
  const [videoFading, setVideoFading] = useState(false);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const router = useRouter();
  const [userVotes, setUserVotes] = useState<{ [cardId: string]: number }>({});
  const [products, setProducts] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  
  // 🔍 Nouvel état pour la recherche
  const [searchTerm, setSearchTerm] = useState('');
  // État pour le filtre actif
  const [activeFilter, setActiveFilter] = useState<'all' | 'new'>('all');
  // État pour la catégorie actuellement visible
  const [visibleCategory, setVisibleCategory] = useState<string | null>(null);

  // État pour refléter cartInfo (initialisé depuis localStorage côté client)
  const [cartInfo, setCartInfo] = useState<Array<{
    title: string;
    images: string[];
    price: number;
    pricePromo?: number;
    count: number;
  }>>([]);

  const handleVideoEnd = () => {
    if (window.innerWidth > 768) {
      setVideoEnded(true);
    }
  };

  const fetchProducts = async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    const querySnapshot = await getDocs(collection(db, 'cards'));
    const products = await Promise.all(
      querySnapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        const reviews = data.reviews || [];

        const userHasRated = currentUser
          ? reviews.some((r: any) => r.userId === currentUser.uid)
          : false;

        const averageRating = data.stars || 0;

        return {
          id: docSnap.id,
          ...data,
          averageRating,
          userHasRated,
        };
      })
    );

    setProducts(products);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchUserVotes = async () => {
      if (!user) return;

      try {
        const q = query(
          collection(db, "votes"),
          where("userId", "==", user.uid)
        );

        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const userVote = snapshot.docs[0].data().vote;
          setSelectedRating(userVote);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du vote :", error);
      }
    };

    fetchUserVotes();
  }, [user]);

  // Real-time listener for cards
  useEffect(() => {
    setLoading(true);
    const cardsCol = collection(db, 'cards');
    const unsubscribe = onSnapshot(
      cardsCol,
      snapshot => {
        const data = snapshot.docs.map(doc => ({ _id: doc.id, ...(doc.data() as object) } as Card));
        setCards(data);
        setLoading(false);
      },
      err => {
        console.error('Listener cards error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const hasUserRated = (reviews: any[] = []) => {
    if (!currentUser) return false;
    return reviews?.some((r) => r.userId === currentUser.uid);
  };

  const calculateAverageRating = (reviews: any[] = []) => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    return total / reviews.length;
  };

  // Accès à localStorage uniquement côté client
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log("✅ Panier global mis à jour :", JSON.parse(localStorage.getItem('globalCart') || '{}'));
      console.log("✅ Contenu de cartInfo :", JSON.parse(localStorage.getItem('cartInfo') || '[]'));
    }
  }, []);

  const handleAddToCart = (card: Card) => {
    if (!user) {
      router.push('/signup');
      return;
    }

    const totalStock   = Number(card.stock);
    const usedStock    = Number(card.stock_reduc);
    const available    = totalStock - usedStock;
    const currentCount = globalCart[card.title]?.count || 0;
    const now          = new Date();

    // Vérifier expiration
    if (card.time && new Date(card.time) < now) {
      console.warn(`❌ Produit expiré: ${card.title}`);
      return;
    }
    // Vérifier stock dispo
    if (available <= 0) {
      console.warn(`❌ Stock épuisé: ${card.title}`);
      return;
    }
    // Vérifier quantité max atteinte
    if (currentCount >= available) {
      console.warn(`🚫 Quantité max (${available}) atteinte pour ${card.title}`);
      return;
    }

    // Ajout au panier
    setGlobalCart(prevCart => {
      const newCart = { ...prevCart };
      if (newCart[card.title]) {
        newCart[card.title].count += 1;
      } else {
        newCart[card.title] = {
          count:       1,
          price:       Number(card.price),
          price_promo: Number(card.price_promo),
          images:      card.images,
          deliveryTime: card.deliveryTime,
          expiryDate:   card.time,
          _id:          card._id,
        };
      }
      localStorage.setItem('globalCart', JSON.stringify(newCart));
      return newCart;
    });

    setAddedItems(prev => {
      const copy = new Set(prev);
      copy.add(card._id);
      return copy;
    });

    setButtonText("Ajouté au panier ✔");
  };

  useEffect(() => {
    const now = new Date();
    const expiredSet = new Set<string>();

    cards.forEach(card => {
      if (new Date(card.time) < now) {
        expiredSet.add(card._id);
      }
    });

    setExpiredCards(expiredSet);
  }, [cards]);

  const handleAddClick = (
    id: string,
    title: string,
    price: string,
    price_promo: string,
    images: string[],
    deliveryTime: string,
    expiryDate: string
  ) => {
    setGlobalCart(prevCart => {
      const newCart = { ...prevCart };
      const now = new Date();

      if (expiryDate && new Date(expiryDate) < now) {
        console.warn(`❌ Expiré: ${title}`);
        return prevCart;
      }

      if (newCart[title]) {
        newCart[title].count += 1;
      } else {
        newCart[title] = {
          count:       1,
          price:       Number(price),
          price_promo: Number(price_promo),
          images,
          deliveryTime,
          expiryDate,
          _id: id,
        };
      }

      localStorage.setItem('globalCart', JSON.stringify(newCart));

      // Mise à jour de cartInfo avec la nouvelle structure
      const updatedCartInfo = Object.entries(newCart).map(([title, item]) => ({
        title,
        images: item.images,
        price: item.price,
        pricePromo: item.price_promo > 0 ? item.price_promo : undefined,
        count: item.count,
      }));

      localStorage.setItem('cartInfo', JSON.stringify(updatedCartInfo));
      setCartInfo(updatedCartInfo);

      return newCart;
    });

    setButtonText("Ajouté au panier ✔");
  };

  const handleRemoveClick = (title: string) => {
    setGlobalCart(prevCart => {
      const newCart = { ...prevCart };
      delete newCart[title];

      if (typeof window !== "undefined") {
        localStorage.setItem('globalCart', JSON.stringify(newCart));
      }

      // Mise à jour correcte de cartInfo - filtrer par titre
      const updatedCartInfo = Object.entries(newCart).map(([title, item]) => ({
        title,
        images: item.images,
        price: item.price,
        pricePromo: item.price_promo > 0 ? item.price_promo : undefined,
        count: item.count,
      }));

      if (typeof window !== "undefined") {
        localStorage.setItem('cartInfo', JSON.stringify(updatedCartInfo));
      }
      setCartInfo(updatedCartInfo);

      return newCart;
    });
  };

  const handleIncreaseClick = (title: string) => {
    setGlobalCart(prevCart => {
      const newCart = { ...prevCart };
      if (newCart[title]) {
        newCart[title].count += 1;
      }
      if (typeof window !== "undefined") {
        localStorage.setItem('globalCart', JSON.stringify(newCart));
      }

      // Mise à jour correcte de cartInfo
      const updatedCartInfo = Object.entries(newCart).map(([title, item]) => ({
        title,
        images: item.images,
        price: item.price,
        pricePromo: item.price_promo > 0 ? item.price_promo : undefined,
        count: item.count,
      }));

      if (typeof window !== "undefined") {
        localStorage.setItem('cartInfo', JSON.stringify(updatedCartInfo));
      }
      setCartInfo(updatedCartInfo);

      return newCart;
    });
  };

  const handleDecreaseClick = (title: string) => {
    setGlobalCart(prevCart => {
      const newCart = { ...prevCart };

      if (newCart[title]?.count > 1) {
        newCart[title].count -= 1;
      } else {
        delete newCart[title];
      }

      if (typeof window !== "undefined") {
        localStorage.setItem('globalCart', JSON.stringify(newCart));
      }

      // Mise à jour correcte de cartInfo
      const updatedCartInfo = Object.entries(newCart).map(([title, item]) => ({
        title,
        images: item.images,
        price: item.price,
        pricePromo: item.price_promo > 0 ? item.price_promo : undefined,
        count: item.count,
      }));

      if (typeof window !== "undefined") {
        localStorage.setItem('cartInfo', JSON.stringify(updatedCartInfo));
      }
      setCartInfo(updatedCartInfo);

      return newCart;
    });
  };

  // Utilisation d'un useEffect pour afficher les logs localStorage côté client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log("✅ Panier global mis à jour :", JSON.parse(localStorage.getItem('globalCart') || '{}'));
      console.log("✅ Contenu de cartInfo :", JSON.parse(localStorage.getItem('cartInfo') || '[]'));
    }
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      const response = await fetch('/api/cards');
      const data = await response.json();
      return data;
    }

    fetchProducts().then(data => {
      setCards(data.data);
      setLoading(false);
    }).catch(error => {
      console.error('Error:', error);
      setError('An error occurred while fetching product data.');
      setLoading(false);
    });
  }, []);

  // 📊 Calcul des cards filtrées avec recherche
  const filteredCards = selectedCategory 
    ? cards.filter(card => card.categorie === selectedCategory) 
    : cards;
    
  const searchFilteredCards = searchTerm 
    ? filteredCards.filter(card => 
        card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (card.subtitle && card.subtitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
        card.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : filteredCards;
    
  const finalFilteredCards = (showNew ? searchFilteredCards.filter(card => card.nouveau) : searchFilteredCards)
    .filter(card => !expiredCards.has(card._id));

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px', // Ajustement pour tenir compte du header sticky
      threshold: 0.3 // Seuil plus bas pour une détection plus sensible
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      let mostVisibleCategory = null;
      let maxIntersectionRatio = 0;
      
      entries.forEach(entry => {
        const cardCategory = entry.target.getAttribute('data-category');
        if (!cardCategory) return;
        
        // Trouver la catégorie la plus visible
        if (entry.isIntersecting && entry.intersectionRatio > maxIntersectionRatio) {
          maxIntersectionRatio = entry.intersectionRatio;
          mostVisibleCategory = cardCategory;
        }
      });
      
      // Mettre à jour la catégorie visible
      if (mostVisibleCategory && mostVisibleCategory !== visibleCategory) {
        setVisibleCategory(mostVisibleCategory);
      }
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    // Observer uniquement les cartes actuellement filtrées
    const currentFilteredCards = finalFilteredCards;
    const cardElements = cardsRef.current.filter((_, index) => 
      index < currentFilteredCards.length
    );
    
    cardElements.forEach(card => {
      if (card) observer.observe(card);
    });

    return () => {
      observer.disconnect();
    };
  }, [finalFilteredCards, visibleCategory]); // Dépendances mises à jour
  
  // Effet séparé pour gérer l'affichage visuel des icônes de catégorie
  useEffect(() => {
    // Réinitialiser tous les icônes
    Object.values(categoryIconsRef.current).forEach(iconElement => {
      if (iconElement) {
        iconElement.classList.remove('zoomed-category-icon', 'highlight-background');
        iconElement.style.backgroundColor = '';
      }
    });
    
    // Mettre en surbrillance la catégorie visible
    if (visibleCategory) {
      const iconElement = categoryIconsRef.current[visibleCategory];
      if (iconElement) {
        iconElement.classList.add('zoomed-category-icon', 'highlight-background');
        const categoryCard = cards.find(card => card.categorie === visibleCategory);
        if (categoryCard) {
          iconElement.style.backgroundColor = categoryCard.categorieBackgroundColor || '';
        }
        
        // Scroll automatique vers l'icône
        if (categoryMenuRef.current) {
          const iconRect = iconElement.getBoundingClientRect();
          const menuRect = categoryMenuRef.current.getBoundingClientRect();
          
          // Vérifier si l'icône est visible dans le menu
          if (iconRect.left < menuRect.left || iconRect.right > menuRect.right) {
            const scrollLeft = iconElement.offsetLeft - categoryMenuRef.current.clientWidth / 2 + iconElement.clientWidth / 2;
            categoryMenuRef.current.scrollTo({
              left: scrollLeft,
              behavior: 'smooth'
            });
          }
        }
      }
    }
  }, [visibleCategory, cards]);
  
  // Effet pour réinitialiser l'observer quand les filtres changent
  useEffect(() => {
    // Réinitialiser la catégorie visible quand on change de filtre
    if (selectedCategory || showNew || searchTerm) {
      setVisibleCategory(null);
    }
  }, [selectedCategory, showNew, searchTerm]);
  
  // Ancien useEffect modifié pour ne plus gérer l'intersection observer
  useEffect(() => {
    // Cet effet est maintenant vide car la logique a été déplacée ci-dessus
    // On le garde pour éviter les erreurs de référence
  }, []);

  const openCarousel = (images: string[]) => {
    setCarouselImages(images);
    setIsCarouselOpen(true);
  };

  const closeCarousel = () => {
    setIsCarouselOpen(false);
  };

  const showForm = (card: Card) => {
    setSelectedCard(card);
    setIsFormVisible(true);
  };

  const hideForm = () => {
    setIsFormVisible(false);
  };

  const updateCard = async (updatedCard: Card) => {
    if (!updatedCard) {
      console.error('updatedCard.id is undefined');
      return;
    }
    try {
      const response = await fetch(`/api/cards/${updatedCard._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCard),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const cardsResponse = await fetch('/api/cards');
      if (!cardsResponse.ok) {
        throw new Error(`HTTP error! status: ${cardsResponse.status}`);
      }
      const data = await cardsResponse.json();
      if (Array.isArray(data.data)) {
        setCards(data.data);
      } else {
        throw new Error("Data is not an array");
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      hideForm();
    }
  };

  useEffect(() => {
    setFormCard(selectedCard);
  }, [selectedCard]);

  // CORRECTION: Fonction handleCountdownEnd corrigée
  const handleCountdownEnd = (cardId: string) => {
    // Trouver le titre du produit à partir de l'ID
    const cardToExpire = cards.find(card => card._id === cardId);
    if (!cardToExpire) return;

    const title = cardToExpire.title;

    // Supprimer du panier global
    setGlobalCart(prevCart => {
      const newCart = { ...prevCart };
      delete newCart[title];
      if (typeof window !== 'undefined') {
        localStorage.setItem('globalCart', JSON.stringify(newCart));
      }
      return newCart;
    });

    // Ajouter à la liste des produits expirés
    setExpiredCards(prev => new Set(prev).add(cardId));

    // Mise à jour correcte de cartInfo - reconstruire à partir du nouveau panier
    const updatedCart = { ...globalCart };
    delete updatedCart[title];
    
    const updatedCartInfo = Object.entries(updatedCart).map(([title, item]) => ({
      title,
      images: item.images,
      price: item.price,
      pricePromo: item.price_promo > 0 ? item.price_promo : undefined,
      count: item.count,
    }));

    localStorage.setItem('cartInfo', JSON.stringify(updatedCartInfo));
    setCartInfo(updatedCartInfo);

    console.log(`🗑️ Produit expiré automatiquement supprimé : ${title}`);
  };

  const handleRequestButtonClick = (card: Card) => {
    if (!user || !user.email) {
      window.location.href = '/login';
    } else {
      setCurrentCard(card);
      onOpen();
    }
  };

  // 🔍 Fonction pour gérer la recherche
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  // 🔍 Fonction pour effacer la recherche
  const clearSearch = () => {
    setSearchTerm('');
  };

  // Fonction pour afficher tous les articles
  const handleShowAll = () => {
    setShowNew(false);
    setSelectedCategory(null);
    setSelectedButton('Tout');
    setClickedButton(null);
    setActiveFilter('all');
    // Ne pas recharger la page
  };

  // Fonction pour afficher les nouveaux articles
  const handleShowNew = () => {
    setShowNew(true);
    setSelectedCategory(null);
    setSelectedButton('Nouveau');
    setClickedButton(null);
    setActiveFilter('new');
  };

  const allProductsWithDerives = (card: Card) => {
    const mainProduct = { title: card.title, price: card.price, price_promo: card.price_promo, images: card.images };
    const derivedProducts = card.produits_derives
      .filter(produit => produit.titre)
      .map(produit => ({
        title: produit.titre,
        price: produit.prix,
        images: produit.images,
      }));
    return [mainProduct, ...derivedProducts];
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <CustomMenuItem />
      <div
        className={`video_animate video_animate-wrapper video_animate-wrapper ${videoEnded ? 'collapsed' : ''}`}
      >
        <AnimatedBanner onEnd={handleVideoEnd} />
      </div>
      
      <div className="menu-items">
        <div className='overlap-group-container' ref={categoryMenuRef}>
          <div className='overlap-group'>
            <p className='categories'>
              <button
                className={`button-text ${selectedButton === 'Tout' ? 'selected' : ''}`}
                onClick={() => {
                  setShowNew(false);
                  setSelectedCategory(null);
                  setSelectedButton('Tout');
                  setClickedButton(null);
                  setActiveFilter('all');
                }}
              >
                <FaRegListAlt size="2em" />
                Tout
              </button>
            </p>
            <p className='categories'>
              <button
                className={`button-text ${selectedButton === 'Nouveau' ? 'selected' : ''}`}
                onClick={() => {
                  setShowNew(true);
                  setSelectedCategory(null);
                  setSelectedButton('Nouveau');
                  setClickedButton(null);
                  setActiveFilter('new');
                }}
              >
                <FaNewspaper size="2em" />
                Nouveau
              </button>
            </p>

            <div className='special_categories'>
              <p className='categories2'>
                {[...new Set(cards.map(card => card.categorie))].map(category => {
                  const card = cards.find(card => card.categorie === category);
                  return (
                    <button
                      className={`categorie_button ${(selectedButton === category || clickedButton === category) ? 'selected' : ''}`}
                      key={card ? card._id : category}
                      onClick={() => {
                        setSelectedCategory(category);
                        setShowNew(false);
                        setSelectedButton(category);
                        setClickedButton(category);
                        setActiveFilter('all');
                        setVisibleCategory(category); // Mettre à jour immédiatement
                      }}
                      onMouseEnter={() => {
                        setSelectedButton(category);
                      }}
                      onMouseLeave={() => {
                        setSelectedButton('');
                      }}
                      style={{ 
                        backgroundColor: (selectedButton === category || clickedButton === category || visibleCategory === category) 
                          ? card?.categorieBackgroundColor 
                          : '' 
                      }}
                      ref={(el) => (categoryIconsRef.current[category] = el)}
                    >
                      {card && card.categorieImage && (
                        <img
                          src={card.categorieImage}
                          alt={category}
                          style={{
                            marginRight: '10px',
                            height: '90%',
                            width: '90%',
                            objectFit: 'contain',
                            borderRadius: '10%',
                          }}
                        />
                      )}
                      <span className="categorie-text" style={{ color: card ? card.categorieBackgroundColor : '' }}>
                        {category}
                      </span>
                    </button>
                  );
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Barre de recherche avec boutons de filtrage */}
      <div className="search-filter-container-left">
        <SearchBar
          onSearch={handleSearch}
          resultsCount={finalFilteredCards.length}
          showResultsCount={searchTerm.length > 0}
          className="search-component"
        />
        
        <FilterButtons
          onShowAll={handleShowAll}
          onShowNew={handleShowNew}
          activeFilter={activeFilter}
          className="filter-component"
        />
      </div>
      
      <div className={`page-content ${isPopupOpen ? 'slide-left' : ''}`}>
        {/* 🔍 Affichage des résultats de recherche */}
        {searchTerm && finalFilteredCards.length === 0 && (
          <NoSearchResults 
            searchTerm={searchTerm}
            onClearSearch={clearSearch}
          />
        )}
        
        <div className="cards-container">
          {finalFilteredCards.map((card, index) => {
            const isSelected = !!globalCart[card.title]?.count;
            const isExpired = expiredCards.has(card._id);
            const totalStock = Number(card.stock);
            const usedStock = Number(card.stock_reduc);
            const isOutOfStock = totalStock > 0 && usedStock >= totalStock;
            const available = totalStock - usedStock;
            const currentCount = globalCart[card.title]?.count || 0;
            const isMaxReached = currentCount >= available;

            return (
              <a className="card-link" style={{ textDecoration: "none", color: "inherit" }} key={card._id}>
                <div data-category={card.categorie} ref={(el) => (cardsRef.current[index] = el)}>
                  <div className="card overlap-group-1">
                    {/* Badge "Nouveau" pour les articles avec card.nouveau === true */}
                    {card.nouveau && (
                      <div className="nouveau-badge">
                        <Sparkles className="nouveau-icon" />
                        Nouveau
                      </div>
                    )}
                    
                    <div className="header_card overlap-group-2">
                      <div className="picture_card-container">
                        <ModernSlider 
                          className="picture_card" 
                          images={card.images} 
                          title={card.title.trim().toLowerCase()}
                          onImageClick={() => {
                            setSelectedProduct(card);
                            setIsPopupOpen(true);
                          }}
                        />
                      </div>
                    </div>

                    <div className={`flex-row ${isExpired ? 'expired' : ''}`}>
                      <div className="title_card vtt-cool-style valign-text-middle">
                        <div className="title_card_1 vtt-cool-style valign-text-middle">
                          <RatingStars
                            productId={card._id}
                            averageRating={calculateAverageRating(card.reviews)}
                            userHasRated={hasUserRated(card.reviews)}
                            onVote={() => fetchProducts()}
                          />
                        </div>
                      </div>

                      <div
                        className="title_card vtt-cool-style valign-text-middle"
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          setSelectedProduct(card);
                          setIsPopupOpen(true);
                        }}
                      >
                        {card.subtitle && (
                          <div className="title_card_subtitle vtt-cool-style valign-text-middle">
                            {card.subtitle}
                          </div>
                        )}

                        <div className={`time_card ${isExpired ? 'expired' : ''}`}>
                          <Countdown endDate={new Date(card.time)} onExpired={() => handleCountdownEnd(card._id)} />
                          <div className="rectangle-14">
                            <StockProgressBar stock={card.stock} stock_reduc={card.stock_reduc} />
                          </div>
                        </div>
                      </div>

                      <button
                        className={`add-to-cart-button ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleAddToCart(card)}
                        disabled={isExpired || isOutOfStock || isMaxReached || isSelected}
                        style={isSelected ? { cursor: 'not-allowed' } : {}}
                      >
                        {globalCart[card.title]?.count > 0 && (
                          <FaCheck style={{ marginRight: '8px', color: 'green'}} />
                        )}
                        <div className="price_content">
                          {Number(card.price_promo) > 0 ? (
                            <>
                              <div className="price_card price valign-text-middle inter-normal-white-20px">
                                <span className="double-strikethrough">{card.price}€</span>
                              </div>
                              <div className="price_card price valign-text-middle inter-normal-white-20px">
                                <span>{card.price_promo}€</span>
                              </div>
                            </>
                          ) : (
                            <div className="price_card price valign-text-middle inter-normal-white-20px">
                              <span>{card.price}€</span>
                            </div>
                          )}
                        </div>
                        {isExpired
                          ? 'Offre expirée ❌'
                          : isOutOfStock
                            ? 'Stock épuisé ❌'
                            : isMaxReached && !isSelected
                              ? `Quantité max (${available}) atteinte`
                              : isSelected
                                ? 'Sélectionnée'
                                : 'Ajouter au panier'}
                      </button>
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {isFormVisible && formCard && (
          <UpdateCardModal
            formCard={formCard}
            hideForm={hideForm}
            handleInputChange={() => {}}
            handleAddImageProduitDerive={() => {}}
            handleRemoveProduitDerive={() => {}}
            handleAddProduitDerive={() => {}}
            handleAddCaracteristique={() => {}}
            handleRemoveCaracteristique={() => {}}
            handleImageChange={() => {}}
            updateCard={updateCard}
            setFormCard={setFormCard}
          />
        )}
        
        {isCarouselOpen && (
          <div className="fullscreen-overlay" onClick={closeCarousel}>
            <div className="fullscreen-carousel">
              {carouselImages.map((image, index) => (
                <div key={index} className="fullscreen-carousel-item">
                  <img
                    src={image}
                    alt={`Slide ${index + 1}`}
                    className="fullscreen-carousel-image"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <SpecialRequestModal 
          isOpen={isOpen} 
          onClose={onClose} 
          currentCard={currentCard} 
          allProducts={currentCard ? allProductsWithDerives(currentCard) : []} 
        />
        <ProductDetailsModal 
          isOpen={isPopupOpen} 
          onClose={() => setIsPopupOpen(false)} 
          product={selectedProduct} 
        />
      </div>
      
      <GlobalPrice isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <style jsx>{`
        .search-filter-container-left {
          padding: 8px 16px;
          background: #f8ede9;
          position: sticky;
          top: 109px;
          z-index: 2;
          border-bottom: 1px solid rgba(255, 128, 177, 0.1);
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: flex-start;
          overflow-x: hidden;
          width: 100%;
        }

        .search-component {
          flex: 0 1 auto;
          max-width: 300px;
        }

        .filter-component {
          flex-shrink: 0;
        }

        .nouveau-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: linear-gradient(135deg, #ff9644, #ff80b1);
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 4px;
          z-index: 3;
          box-shadow: 0 4px 15px rgba(255, 150, 68, 0.4);
          animation: pulse 2s infinite;
        }

        .nouveau-icon {
          width: 14px;
          height: 14px;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .search-filter-container-left {
            padding: 6px 12px;
            top: 80px;
            gap: 6px;
          }

          .search-component {
            max-width: 250px;
          }
        }

        @media (max-width: 480px) {
          .search-filter-container-left {
            padding: 4px 8px;
            gap: 4px;
          }

          .search-component {
            max-width: 200px;
          }
        }
      `}</style>
    </div>
  );
}