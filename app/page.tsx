'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faCamera, faClipboardList, faShoppingCart, faEnvelope, faKey } from '@fortawesome/free-solid-svg-icons';
import styles from './Home.module.css';
import DisplayNameForm from '@/components/DisplayNameForm';
import ProfilePhotoForm from '@/components/ProfilePhotoForm';
import SpecialRequests from '@/components/SpecialRequests';
import Purchases from '@/components/Purchases';
import Messages from '@/components/Messages';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import { useAuth } from '@/contexts/AuthContext';
import FooterMenu from '@/components/FooterMenu';
import Header from '@/components/Header';
import Front from '../pages/front';
import { CheckboxProvider } from '@/contexts/CheckboxContext';
import { GlobalCartProvider, useGlobalCart } from "@/components/GlobalCartContext";
import GlobalPrice from '@/components/globalprice'; // ✅ Ajout du panier global

import './Cards.css';

export default function Home() {
  const { user } = useAuth();

  return (
    <CheckboxProvider>
      <GlobalCartProvider>
        <InnerHome user={user} />
      </GlobalCartProvider>
    </CheckboxProvider>
  );
}

// ✅ Déplace `useGlobalCart()` ici pour éviter l'erreur
function InnerHome({ user }) {
  const { globalCart } = useGlobalCart();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false); // ✅ État pour afficher la modale du panier

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

  // ✅ Calcule le nombre d'articles dans le panier
  const cartCount = Object.values(globalCart).reduce((sum, item) => sum + item.count, 0);

  return (
    <>
      <Front />

      {user && (
        <div className={styles.footerContainer}>
          <div className={styles.menuButtons}>
            {/* ✅ Ajout du bouton Panier Global */}
            <button 
              onClick={() => setIsCartOpen(true)} 
              className={`${styles.cartButton} ${cartCount > 0 ? styles.activeCart : ''}`} // ✅ Ajout d'une classe dynamique
            >
              <FontAwesomeIcon icon={faShoppingCart} className={styles.icon} /> Panier
              {cartCount > 0 && <span className={styles.cartCount}>{cartCount}</span>}
            </button>
          </div>
        </div>
      )}

      {/* ✅ Affichage du panier global sous forme de modale */}
      <GlobalPrice isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* ✅ Affichage des autres modales si une est active */}
      {activeModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              {activeModal === 'displayName'
                ? 'Modifier le Pseudo'
                : activeModal === 'profilePhoto'
                ? 'Modifier la Photo de Profil'
                : activeModal === 'specialRequests'
                ? 'Demandes Spéciales'
                : activeModal === 'purchases'
                ? 'Achats'
                : activeModal === 'messages'
                ? 'Messages'
                : activeModal === 'changePassword'
                ? 'Mot de Passe'
                : ''}
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
