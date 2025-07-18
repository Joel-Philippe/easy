'use client';

import React, { useState } from 'react';
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
import Front from '../pages/front'; // ⚠️ à adapter selon si c’est une page ou un composant
import './Cards.css';

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
  const { globalCart } = useGlobalCart();
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
    globalCart && typeof globalCart === 'object'
      ? Object.values(globalCart).reduce((sum, item) => sum + (item?.count || 0), 0)
      : 0;

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
              {{
                displayName: 'Modifier le Pseudo',
                profilePhoto: 'Modifier la Photo de Profil',
                specialRequests: 'Demandes Spéciales',
                purchases: 'Achats',
                messages: 'Messages',
                changePassword: 'Mot de Passe',
              }[activeModal]}
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
