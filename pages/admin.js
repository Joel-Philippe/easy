'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { collection, getDocs, updateDoc, doc, onSnapshot, serverTimestamp, addDoc, deleteDoc } from 'firebase/firestore';
import SlickSlider from "react-slick";
import { db } from '@/components/firebaseConfig';
import AddCard from '@/pages/AddCard';
import UpdateCardModal from '../components/UpdateCardModal';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FiLogOut, 
  FiPlus, 
  FiX, 
  FiEdit, 
  FiClipboard, 
  FiUsers, 
  FiShoppingBag, 
  FiTrendingUp,
  FiSettings,
  FiEye,
  FiTrash2,
  FiFilter,
  FiSearch,
  FiRefreshCw
} from 'react-icons/fi';

const AdminPage = () => {
  const [cards, setCards] = useState([]);
  const [specialRequests, setSpecialRequests] = useState([]);
  const [showSpecialRequests, setShowSpecialRequests] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAdminCheck, setLoadingAdminCheck] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showUpdateCard, setShowUpdateCard] = useState(false);
  const { logout, user } = useAuth();
  const router = useRouter();

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 6000,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 60000,
  };

  // Vérification admin
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (user) {
        const adminEmail = process.env.NEXT_PUBLIC_FIREBASE_ADMIN_EMAIL;
        if (user.email === adminEmail) {
          setIsAdmin(true);
        } else {
          router.push('/');
        }
      } else {
        router.push('/');
      }
      setLoadingAdminCheck(false);
    };
    checkAdminAccess();
  }, [user, router]);

  // Charger les cartes avec Firebase
  useEffect(() => {
    if (!isAdmin) return;
    
    setIsLoading(true);
    const cardsCol = collection(db, 'cards');
    
    // Utiliser onSnapshot pour les mises à jour en temps réel
    const unsubscribe = onSnapshot(
      cardsCol,
      (snapshot) => {
        const cardsData = snapshot.docs.map(doc => ({ 
          _id: doc.id, 
          ...doc.data() 
        }));
        setCards(cardsData);
        setIsLoading(false);
      },
      (err) => {
        console.error('Erreur lors du chargement des cartes:', err);
        setError(err.message);
        setIsLoading(false);
      }
    );
    
    // Nettoyer l'abonnement
    return () => unsubscribe();
  }, [isAdmin]);

  // Charger les demandes spéciales
  useEffect(() => {
    if (!isAdmin) return;
    const fetchSpecialRequests = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'specialRequests'));
        const requests = [];
        querySnapshot.forEach((doc) => {
          requests.push({ id: doc.id, ...doc.data() });
        });
        setSpecialRequests(requests);
      } catch (error) {
        setError("Erreur lors de la récupération des demandes spéciales.");
      }
    };
    fetchSpecialRequests();
  }, [isAdmin]);

  const handleLogout = async () => {
    try {
      await logout();
      setShowLogoutModal(false);
      router.push('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const handleUpdateCardClick = (card) => {
    setSelectedCard(card);
    setShowUpdateCard(true);
  };

  const handleInputChange = (event, index, field) => {
    const { name, value } = event.target;
    setSelectedCard(prevCard => {
      let updatedCard = { ...prevCard };

      if (name === 'images' && typeof index === 'number') {
        const newImages = [...updatedCard.images];
        newImages[index] = value;
        updatedCard.images = newImages;
      } else if (name === 'produits_derives' && typeof index === 'number' && field) {
        const newProduitsDerives = [...updatedCard.produits_derives];
        newProduitsDerives[index] = { ...newProduitsDerives[index], [field]: value };
        updatedCard.produits_derives = newProduitsDerives;
      } else {
        updatedCard[name] = value;
      }
      return updatedCard;
    });
  };

  const handleImageChange = (produitIndex, imageIndex, event) => {
    if (selectedCard && selectedCard.produits_derives) {
      const newProduitsDerives = [...selectedCard.produits_derives];
      if (newProduitsDerives[produitIndex] && Array.isArray(newProduitsDerives[produitIndex].images)) {
        newProduitsDerives[produitIndex].images[imageIndex] = event.target.value;
        setSelectedCard({ ...selectedCard, produits_derives: newProduitsDerives });
      }
    }
  };

  const handleAddImageProduitDerive = (index) => {
    setSelectedCard(prevCard => {
      if (prevCard) {
        const newProduitsDerives = prevCard.produits_derives.map((produitDerive, i) =>
          i === index
            ? { ...produitDerive, images: [...produitDerive.images, ''] }
            : produitDerive
        );
        return {
          ...prevCard,
          produits_derives: newProduitsDerives
        };
      }
      return prevCard;
    });
  };

  const handleAddProduitDerive = () => {
    setSelectedCard(prevCard => {
      if (prevCard) {
        const newProduitsDerives = [...prevCard.produits_derives, { titre: '', description: '', prix: '', images: [''] }];
        return {
          ...prevCard,
          produits_derives: newProduitsDerives
        };
      }
      return prevCard;
    });
  };

  const handleRemoveProduitDerive = (index) => {
    setSelectedCard(prevCard => {
      if (prevCard) {
        const newProduitsDerives = prevCard.produits_derives.filter((_, i) => i !== index);
        return {
          ...prevCard,
          produits_derives: newProduitsDerives
        };
      }
      return prevCard;
    });
  };

  const handleAddCaracteristique = (index) => {
    setSelectedCard(prevCard => {
      if (prevCard) {
        const newCaracteristiques = prevCard.caracteristiques.map((caracteristique, i) =>
          i === index
            ? { ...caracteristique, caracteristiques: [...caracteristique.caracteristiques, { nom: '', valeur: '' }] }
            : caracteristique
        );
        return {
          ...prevCard,
          caracteristiques: newCaracteristiques
        };
      }
      return prevCard;
    });
  };

  const handleRemoveCaracteristique = (index) => {
    setSelectedCard(prevCard => {
      if (prevCard) {
        const newCaracteristiques = prevCard.caracteristiques.filter((_, i) => i !== index);
        return {
          ...prevCard,
          caracteristiques: newCaracteristiques
        };
      }
      return prevCard;
    });
  };

  const handleAddTableauCaracteristiques = () => {
    setSelectedCard(prevCard => {
      if (prevCard) {
        const newCaracteristiques = [...prevCard.caracteristiques, { titre: '', caracteristiques: [{ nom: '', valeur: '' }] }];
        return {
          ...prevCard,
          caracteristiques: newCaracteristiques
        };
      }
      return prevCard;
    });
  };

  // Mise à jour directe dans Firebase
  const updateCard = async (updatedCard) => {
    if (!updatedCard) {
      console.error('updatedCard._id is undefined');
      return;
    }
    try {
      // Mettre à jour directement dans Firebase
      const cardRef = doc(db, 'cards', updatedCard._id);
      await updateDoc(cardRef, {
        ...updatedCard,
        updatedAt: serverTimestamp()
      });

      console.log("✅ Carte mise à jour avec l'ID :", updatedCard._id);
      alert('✅ Article mis à jour avec succès !');
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour :', error);
      setError('Erreur lors de la mise à jour de l\'article');
      alert('❌ Erreur lors de la mise à jour');
    } finally {
      setShowUpdateCard(false);
    }
  };

  // Supprimer une carte
  const deleteCard = async (cardId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      return;
    }
    
    try {
      const cardRef = doc(db, 'cards', cardId);
      await deleteDoc(cardRef);
      console.log("✅ Carte supprimée avec l'ID :", cardId);
      alert('✅ Article supprimé avec succès !');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression :', error);
      alert('❌ Erreur lors de la suppression');
    }
  };

  const handleValidateRequest = async (request) => {
    try {
      const requestRef = doc(db, 'specialRequests', request.id);
      await updateDoc(requestRef, { status: 'accepted' });

      await fetch('/api/sendEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: request.senderEmail,
          subject: 'Votre demande spéciale a été acceptée',
          message: `Votre demande spéciale pour ${request.selectedProducts.map(p => p.title).join(', ')} a été acceptée.`,
        }),
      });

      setSpecialRequests((prevRequests) =>
        prevRequests.map((r) => (r.id === request.id ? { ...r, status: 'accepted' } : r))
      );
      alert('Demande validée et email envoyé avec succès !');
    } catch (error) {
      console.error('Erreur lors de la validation de la demande spéciale :', error);
    }
  };

  // Filtrer les cartes
  const filteredCards = cards.filter(card => {
    const matchesSearch = card.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || card.categorie === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Obtenir les catégories uniques
  const categories = [...new Set(cards.map(card => card.categorie).filter(Boolean))];

  if (loadingAdminCheck) {
    return (
      <div className="modern-admin-loading">
        <div className="loading-spinner"></div>
        <p>Vérification des droits administratifs...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <div className="modern-admin-container">
        {/* Header */}
        <header className="modern-admin-header">
          <div className="admin-header-content">
            <div className="admin-header-left">
              <div className="admin-logo">
                <div className="logo-icon">
                  <FiSettings />
                </div>
                <div className="logo-text">
                  <h1>Administration</h1>
                  <p>Tableau de bord</p>
                </div>
              </div>
            </div>
            
            <div className="admin-header-right">
              <div className="admin-user-info">
                <div className="user-avatar">
                  <img src={user?.photoURL || 'https://via.placeholder.com/40'} alt="Admin" />
                </div>
                <div className="user-details">
                  <span className="user-name">{user?.displayName || 'Administrateur'}</span>
                  <span className="user-role">Admin</span>
                </div>
              </div>
              
              <button 
                className="logout-button"
                onClick={() => setShowLogoutModal(true)}
              >
                <FiLogOut />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="admin-stats">
          <div className="stat-card">
            <div className="stat-icon products">
              <FiShoppingBag />
            </div>
            <div className="stat-content">
              <h3>{cards.length}</h3>
              <p>Produits</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon requests">
              <FiClipboard />
            </div>
            <div className="stat-content">
              <h3>{specialRequests.length}</h3>
              <p>Demandes</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon categories">
              <FiFilter />
            </div>
            <div className="stat-content">
              <h3>{categories.length}</h3>
              <p>Catégories</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon growth">
              <FiTrendingUp />
            </div>
            <div className="stat-content">
              <h3>+12%</h3>
              <p>Croissance</p>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="admin-action-bar">
          <div className="action-bar-left">
            <button 
              className={`tab-button ${!showSpecialRequests ? 'active' : ''}`}
              onClick={() => setShowSpecialRequests(false)}
            >
              <FiShoppingBag />
              <span>Produits</span>
            </button>
            
            <button 
              className={`tab-button ${showSpecialRequests ? 'active' : ''}`}
              onClick={() => setShowSpecialRequests(true)}
            >
              <FiClipboard />
              <span>Demandes spéciales</span>
            </button>
          </div>
          
          <div className="action-bar-right">
            <button 
              className="action-button primary"
              onClick={() => setShowAddCard(true)}
            >
              <FiPlus />
              <span>Ajouter un produit</span>
            </button>
            
            <button 
              className="action-button secondary"
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => setIsLoading(false), 1000);
              }}
            >
              <FiRefreshCw />
              <span>Actualiser</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="admin-content">
          {showSpecialRequests ? (
            <div className="special-requests-section">
              <div className="section-header">
                <h2>Demandes spéciales</h2>
                <p>Gérez les demandes clients</p>
              </div>
              
              {isLoading ? (
                <div className="loading-grid">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="loading-card"></div>
                  ))}
                </div>
              ) : specialRequests.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <FiClipboard />
                  </div>
                  <h3>Aucune demande spéciale</h3>
                  <p>Les nouvelles demandes apparaîtront ici</p>
                </div>
              ) : (
                <div className="requests-grid">
                  {specialRequests.map((request) => (
                    <div key={request.id} className="request-card">
                      <div className="request-header">
                        <div className="request-status">
                          <span className={`status-badge ${request.status || 'pending'}`}>
                            {request.status === 'accepted' ? 'Acceptée' : 'En attente'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="request-content">
                        <div className="request-user">
                          <img src={request.senderPhoto || 'https://via.placeholder.com/40'} alt="User" />
                          <div>
                            <h4>{request.senderDisplayName}</h4>
                            <p>{request.senderEmail}</p>
                          </div>
                        </div>
                        
                        <div className="request-seller">
                          <img src={request.sellerPhoto || 'https://via.placeholder.com/32'} alt="Seller" />
                          <span>Vendeur: {request.sellerName}</span>
                        </div>
                        
                        <div className="request-products">
                          <h5>Produits demandés:</h5>
                          <p>{request.selectedProducts.map((p) => p.title).join(', ')}</p>
                        </div>
                      </div>
                      
                      {request.status !== 'accepted' && (
                        <div className="request-actions">
                          <button 
                            className="validate-button"
                            onClick={() => handleValidateRequest(request)}
                          >
                            Valider la demande
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="products-section">
              <div className="section-header">
                <h2>Gestion des produits</h2>
                <p>Gérez votre catalogue de produits</p>
              </div>
              
              {/* Filters */}
              <div className="filters-bar">
                <div className="search-box">
                  <FiSearch />
                  <input
                    type="text"
                    placeholder="Rechercher un produit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="category-filter"
                >
                  <option value="all">Toutes les catégories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              {/* Products Grid */}
              <div className="products-grid">
                {filteredCards.map((card, index) => (
                  <div key={card._id || index} className="product-card">
                    <div className="product-image">
                      {card.images && card.images.length > 0 && (
                        <SlickSlider {...sliderSettings}>
                          {card.images.map((image, idx) => (
                            <div key={idx} className="slider-item">
                              <img src={image} alt={`Image ${idx + 1}`} />
                            </div>
                          ))}
                        </SlickSlider>
                      )}
                      
                      <div className="product-overlay">
                        <button 
                          className="overlay-button view"
                          title="Voir les détails"
                        >
                          <FiEye />
                        </button>
                        <button 
                          className="overlay-button edit"
                          onClick={() => handleUpdateCardClick(card)}
                          title="Modifier"
                        >
                          <FiEdit />
                        </button>
                        <button 
                          className="overlay-button delete"
                          title="Supprimer"
                          onClick={() => deleteCard(card._id)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                    
                    <div className="product-content">
                      <div className="product-header">
                        <h3>{card.title}</h3>
                        {card.price && (
                          <span className="product-price">{card.price} €</span>
                        )}
                      </div>
                      
                      <div className="product-seller">
                        <img src={card.photo_du_proposant || 'https://via.placeholder.com/24'} alt="Seller" />
                        <span>{card.prenom_du_proposant || 'Vendeur inconnu'}</span>
                      </div>
                      
                      <div className="product-meta">
                        <span className="product-category">{card.categorie}</span>
                        <span className="product-stock">Stock: {card.stock || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        {showLogoutModal && (
          <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Confirmation de déconnexion</h3>
                <button onClick={() => setShowLogoutModal(false)}>
                  <FiX />
                </button>
              </div>
              <div className="modal-body">
                <p>Êtes-vous sûr de vouloir vous déconnecter ?</p>
              </div>
              <div className="modal-actions">
                <button 
                  className="button secondary"
                  onClick={() => setShowLogoutModal(false)}
                >
                  Annuler
                </button>
                <button 
                  className="button danger"
                  onClick={handleLogout}
                >
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        )}

        {showAddCard && (
          <div className="modal-overlay" onClick={() => setShowAddCard(false)}>
            <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Ajouter un produit</h3>
                <button onClick={() => setShowAddCard(false)}>
                  <FiX />
                </button>
              </div>
              <div className="modal-body">
                <AddCard isOpen={showAddCard} onClose={() => setShowAddCard(false)} />
              </div>
            </div>
          </div>
        )}

        {showUpdateCard && (
          <div className="modal-overlay" onClick={() => setShowUpdateCard(false)}>
            <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Modifier le produit</h3>
              </div>
              <div className="modal-body">
                <UpdateCardModal
                  formCard={selectedCard}
                  hideForm={() => setShowUpdateCard(false)}
                  handleInputChange={handleInputChange}
                  handleImageChange={handleImageChange}
                  handleAddImageProduitDerive={handleAddImageProduitDerive}
                  handleRemoveProduitDerive={handleRemoveProduitDerive}
                  handleAddProduitDerive={handleAddProduitDerive}
                  handleAddCaracteristique={handleAddCaracteristique}
                  handleRemoveCaracteristique={handleRemoveCaracteristique}
                  handleAddTableauCaracteristiques={handleAddTableauCaracteristiques}
                  updateCard={updateCard}
                  setFormCard={setSelectedCard}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .modern-admin-container {
          min-height: 100vh;
          background: -webkit-linear-gradient(315deg, #f9ede9 0%, #dbb5b5 100%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .modern-admin-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Header */
        .modern-admin-header {
          background: white;
          border-bottom: 1px solid #e2e8f0;
          padding: 0 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .admin-header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 80px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .admin-header-left {
          display: flex;
          align-items: center;
        }

        .admin-logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 20px;
        }

        .logo-text h1 {
          font-size: 24px;
          font-weight: 700;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .logo-text p {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        .admin-header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .admin-user-info {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 16px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .user-avatar img {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
        }

        .user-details {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-weight: 600;
          font-size: 14px;
          color: #1e293b;
        }

        .user-role {
          font-size: 12px;
          color: #64748b;
        }

        .logout-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .logout-button:hover {
          background: #dc2626;
          transform: translateY(-1px);
        }

        /* Stats */
        .admin-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: white;
        }

        .stat-icon.products {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        }

        .stat-icon.requests {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }

        .stat-icon.categories {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        .stat-icon.growth {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        }

        .stat-content h3 {
          font-size: 32px;
          font-weight: 700;
          margin: 0;
          color: #1e293b;
        }

        .stat-content p {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        /* Action Bar */
        .admin-action-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .action-bar-left {
          display: flex;
          gap: 8px;
        }

        .tab-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
          color: #64748b;
        }

        .tab-button.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
        }

        .tab-button:hover:not(.active) {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .action-bar-right {
          display: flex;
          gap: 12px;
        }

        .action-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-button.primary {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }

        .action-button.primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }

        .action-button.secondary {
          background: white;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }

        .action-button.secondary:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        /* Content */
        .admin-content {
          padding: 0 24px 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .section-header {
          margin-bottom: 24px;
        }

        .section-header h2 {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: #1e293b;
        }

        .section-header p {
          color: #64748b;
          margin: 0;
        }

        /* Filters */
        .filters-bar {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          align-items: center;
        }

        .search-box {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .search-box svg {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          font-size: 18px;
        }

        .search-box input {
          width: 100%;
          padding: 12px 12px 12px 44px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .search-box input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .category-filter {
          padding: 12px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          font-size: 14px;
          cursor: pointer;
          min-width: 200px;
        }

        /* Products Grid */
        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }

        .product-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          transition: all 0.3s ease;
        }

        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
        }

        .product-image {
          position: relative;
          height: 200px;
          overflow: hidden;
        }

        .slider-item img {
          width: 100%;
          height: 200px;
          object-fit: cover;
        }

        .product-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          opacity: 0;
          transition: all 0.3s ease;
        }

        .product-card:hover .product-overlay {
          opacity: 1;
        }

        .overlay-button {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 18px;
        }

        .overlay-button.view {
          background: #3b82f6;
          color: white;
        }

        .overlay-button.edit {
          background: #f59e0b;
          color: white;
        }

        .overlay-button.delete {
          background: #ef4444;
          color: white;
        }

        .overlay-button:hover {
          transform: scale(1.1);
        }

        .product-content {
          padding: 20px;
        }

        .product-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 12px;
        }

        .product-header h3 {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
          color: #1e293b;
          line-height: 1.4;
        }

        .product-price {
          font-size: 18px;
          font-weight: 700;
          color: #10b981;
        }

        .product-seller {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .product-seller img {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          object-fit: cover;
        }

        .product-seller span {
          font-size: 14px;
          color: #64748b;
        }

        .product-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .product-category {
          background: #e0e7ff;
          color: #3730a3;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
        }

        .product-stock {
          font-size: 12px;
          color: #64748b;
        }

        /* Requests Grid */
        .requests-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 24px;
        }

        .request-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          transition: all 0.3s ease;
        }

        .request-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .request-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .status-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-badge.pending {
          background: #fef3c7;
          color: #92400e;
        }

        .status-badge.accepted {
          background: #d1fae5;
          color: #065f46;
        }

        .request-content {
          margin-bottom: 20px;
        }

        .request-user {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .request-user img {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
        }

        .request-user h4 {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
          color: #1e293b;
        }

        .request-user p {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        .request-seller {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .request-seller img {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }

        .request-seller span {
          font-size: 14px;
          color: #64748b;
        }

        .request-products h5 {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: #1e293b;
        }

        .request-products p {
          font-size: 14px;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
        }

        .validate-button {
          width: 100%;
          padding: 12px 20px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .validate-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }

        /* Empty State */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
          text-align: center;
        }

        .empty-icon {
          width: 80px;
          height: 80px;
          background: #f1f5f9;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          color: #64748b;
          margin-bottom: 24px;
        }

        .empty-state h3 {
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: #1e293b;
        }

        .empty-state p {
          color: #64748b;
          margin: 0;
        }

        /* Loading Grid */
        .loading-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }

        .loading-card {
          background: white;
          border-radius: 16px;
          height: 300px;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* Modals */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
          width: 100%;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .modal-content.large {
          max-width: 80%;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-header h3 {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
          color: #1e293b;
        }

        .modal-header button {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background: #f1f5f9;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .modal-header button:hover {
          background: #e2e8f0;
        }

        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          padding: 24px;
          border-top: 1px solid #e2e8f0;
        }

        .button {
          padding: 12px 20px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .button.secondary {
          background: #f1f5f9;
          color: #64748b;
        }

        .button.secondary:hover {
          background: #e2e8f0;
        }

        .button.danger {
          background: #ef4444;
          color: white;
        }

        .button.danger:hover {
          background: #dc2626;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .admin-header-content {
            flex-direction: column;
            height: auto;
            padding: 16px 0;
            gap: 16px;
          }

          .admin-stats {
            grid-template-columns: 1fr;
            padding: 16px;
          }

          .admin-action-bar {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
            padding: 0 16px 16px;
          }

          .action-bar-left,
          .action-bar-right {
            justify-content: center;
          }

          .admin-content {
            padding: 0 16px 16px;
          }

          .filters-bar {
            flex-direction: column;
            align-items: stretch;
          }

          .search-box {
            max-width: none;
          }

          .products-grid,
          .requests-grid {
            grid-template-columns: 1fr;
          }

          .modal-content {
            margin: 20px;
            max-height: calc(100vh - 40px);
          }
        }
      `}</style>
    </>
  );
};

export default AdminPage;