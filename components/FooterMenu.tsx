import React from 'react';
import styles from '../app/FooterMenu.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons';

interface FooterMenuProps {
  openModal: (modalType: string) => void;
  openPayment: () => void;  // ✅ Renommé pour ouvrir directement le paiement
  cartCount: number;
}

const FooterMenu: React.FC<FooterMenuProps> = ({ openModal, openPayment, cartCount }) => {
  return (
    <div className={styles.footerContainer}>
      <div className={styles.menuButtons}>
        <button className={styles.menuButton} onClick={() => openModal('displayName')}>Pseudo</button>
        <button className={styles.menuButton} onClick={() => openModal('profilePhoto')}>Photo de Profil</button>
        <button className={styles.menuButton} onClick={() => openModal('specialRequests')}>Demandes Spéciales</button>
        <button className={styles.menuButton} onClick={() => openModal('purchases')}>Achats</button>
        <button className={styles.menuButton} onClick={() => openModal('messages')}>Messages</button>
        <button className={styles.menuButton} onClick={() => openModal('changePassword')}>Mot de Passe</button>
        
        {/* ✅ Bouton qui ouvre directement le processus de paiement */}
        <button 
          className={`${styles.cartButton} ${cartCount > 0 ? styles.active : ''}`} 
          onClick={cartCount > 0 ? openPayment : undefined}
          disabled={cartCount === 0}
        >
          <FontAwesomeIcon icon={faShoppingCart} className={styles.cartIcon} />
          🔒 Paiement
          {cartCount > 0 && <span className={styles.cartCount}>{cartCount}</span>}
        </button>
      </div>
    </div>
  );
};

export default FooterMenu;