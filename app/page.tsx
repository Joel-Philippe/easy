'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faCamera,
  faClipboardList,
  faShoppingCart,
  faEnvelope,
  faKey,
} from '@fortawesome/free-solid-svg-icons';
import styles from './Home.module.css';

import DisplayNameForm from '@/components/DisplayNameForm';
import ProfilePhotoForm from '@/components/ProfilePhotoForm';
import SpecialRequests from '@/components/SpecialRequests';
import Purchases from '@/components/Purchases';
import Messages from '@/components/Messages';
import ChangePasswordForm from '@/components/ChangePasswordForm';

import { useAuth } from '@/contexts/AuthContext';
import { CheckboxProvider } from '@/contexts/CheckboxContext';
import { GlobalCartProvider, useGlobalCart } from '@/components/GlobalCartContext';

import GlobalPrice from '@/components/globalprice';
import Front from '../pages/front';
import './Cards.css';

import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/components/firebaseConfig';

// Déclare un type pour les items du panier
type CartItem = {
  count: number;
  name: string;
  price: number;
  stock?: number;
  stock_reduc?: number;
  id?: string;
};

export default function Home() {
  const authResult = useAuth();
  const user = authResult?.user || null;

  return (
    <CheckboxProvider>
      <GlobalCartProvider>
        <InnerHome user={user} />
      </GlobalCartProvider>
    </CheckboxProvider>
  );
}

interface InnerHomeProps {
  user: any;
}

function InnerHome({ user }: InnerHomeProps) {
  const { globalCart, setGlobalCart } = useGlobalCart();

  const typedGlobalCart: Record<string, CartItem> = globalCart || {};

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const openModal = (modalType: string) => setActiveModal(modalType);
  const closeModal = () => setActiveModal(null);
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const renderModalContent = () => {
    switch (activeModal) {
      case 'displayName':
        return <DisplayNameForm />;
      case 'profilePhoto':
        return <ProfilePhotoForm />;
      case 'specialRequests':
        return <SpecialRequests />;
      case 'purchases':
        return <Purchases />;
      case 'messages':
        return <Messages />;
      case 'changePassword':
        return <ChangePasswordForm />;
      default:
        return null;
    }
  };

  const cartCount =
    Object.values(typedGlobalCart).reduce((sum, item) => sum + (item.count || 0), 0) || 0;

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'cards'), (snapshot) => {
      const latestProducts: Record<string, any> = {};
      snapshot.forEach((doc) => {
        latestProducts[doc.id] = { ...doc.data(), id: doc.id };
      });

      if (globalCart) {
        const updatedCart: Record<string, any> = {};
        let cartChanged = false;

        Object.entries(globalCart).forEach(([cartId, cartItem]) => {
          const latestProduct = latestProducts[cartId];
          const item = cartItem as CartItem; // ✅ typage explicite ici

          if (
            latestProduct &&
            item.name === latestProduct.name &&
            item.price === latestProduct.price &&
            latestProduct.stock > latestProduct.stock_reduc
          ) {
            updatedCart[cartId] = { ...latestProduct, count: item.count };
          } else {
            cartChanged = true;
          }
        });

        if (cartChanged) {
          setGlobalCart(updatedCart);
        }
      }
    });

    return () => unsubscribe();
  }, [globalCart, setGlobalCart]);

  return (
    <>
      <Front />

      {user && (
        <div className={styles.footerContainer}>
          <div className={styles.menuButtons}>
            <button
              onClick={openCart}
              className={`${styles.cartButton} ${cartCount > 0 ? styles.activeCart : ''}`}
            >
              <FontAwesomeIcon icon={faShoppingCart} className={styles.icon} /> Panier
              {cartCount > 0 && <span className={styles.cartCount}>{cartCount}</span>}
            </button>
          </div>
        </div>
      )}

      <GlobalPrice isOpen={isCartOpen} onClose={closeCart} />

      {activeModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              {({
                displayName: 'Modifier le Pseudo',
                profilePhoto: 'Modifier la Photo de Profil',
                specialRequests: 'Demandes Spéciales',
                purchases: 'Achats',
                messages: 'Messages',
                changePassword: 'Mot de Passe',
              } as any)[activeModal]}
              <button className={styles.modalCloseButton} onClick={closeModal}>
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>{renderModalContent()}</div>
          </div>
        </div>
      )}
    </>
  );
}
