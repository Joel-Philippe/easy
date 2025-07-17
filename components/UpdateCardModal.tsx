'use client';

import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Plus, 
  Trash2, 
  Upload, 
  Eye, 
  EyeOff, 
  Package, 
  Tag, 
  User, 
  Image as ImageIcon,
  Star,
  Clock,
  Euro,
  FileText,
  Settings,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  AlertCircle,
  Info
} from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/components/firebaseConfig';

interface Card {
  _id: string;
  categorie: string;
  categorieImage: string;
  categorieBackgroundColor: string;
  affiche: boolean;
  images: string[];
  title: string;
  subtitle: string;
  description: string;
  stock: number;
  stock_reduc: number;
  price: number;
  price_promo?: number;
  time?: string;
  deliveryTime: string;
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
  produits_derives: Array<{
    titre: string;
    description: string;
    prix: string;
    price_promo?: string;
    deliveryTime?: string;
    images: string[];
  }>;
  caracteristiques: Array<{
    titre: string;
    caracteristiques: Array<{
      nom: string;
      valeur: string;
    }>;
  }>;
  nouveau: boolean;
}

interface UpdateCardModalProps {
  formCard: Card | null;
  hideForm: () => void;
  handleInputChange: (event: any, index?: number, field?: string, caracteristiqueIndex?: number) => void;
  handleImageChange: (produitIndex: number, imageIndex: number, event: any) => void;
  handleAddImageProduitDerive: (index: number) => void;
  handleRemoveProduitDerive: (index: number) => void;
  handleAddProduitDerive: () => void;
  handleAddCaracteristique: (index: number) => void;
  handleRemoveCaracteristique: (index: number) => void;
  handleAddTableauCaracteristiques: () => void;
  updateCard: (card: Card) => void;
  setFormCard: (card: Card) => void;
}

const UpdateCardModal = ({
  formCard,
  hideForm,
  handleInputChange,
  handleImageChange,
  handleAddImageProduitDerive,
  handleRemoveProduitDerive,
  handleAddProduitDerive,
  handleAddCaracteristique,
  handleRemoveCaracteristique,
  handleAddTableauCaracteristiques,
  updateCard,
  setFormCard
}: UpdateCardModalProps) => {
  const [images, setImages] = useState<string[]>([]);
  const [caracteristiquesTableaux, setCaracteristiquesTableaux] = useState<any[]>([]);
  const [produitsDerives, setProduitsDerives] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState('basic');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [previewMode, setPreviewMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (formCard) {
      setImages(formCard.images || Array(6).fill(''));
      setCaracteristiquesTableaux(formCard.caracteristiques || [{ titre: '', caracteristiques: [{ nom: '', valeur: '' }] }]);
      setProduitsDerives(formCard.produits_derives || [{ titre: '', description: '', prix: '', price_promo: '', images: [''], deliveryTime: '' }]);
    }
  }, [formCard]);

  const handleInputChangeLocal = (field: keyof Card, value: any) => {
    if (formCard) {
      setFormCard({ ...formCard, [field]: value });
      // Clear validation error when user starts typing
      if (validationErrors[field]) {
        setValidationErrors(prev => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formCard?.title?.trim()) errors.title = 'Le titre est requis';
    if (!formCard?.description?.trim()) errors.description = 'La description est requise';
    if (!formCard?.price || formCard.price <= 0) errors.price = 'Le prix est requis';
    if (!formCard?.categorie?.trim()) errors.categorie = 'La catégorie est requise';
    if (formCard && formCard.stock < 0) errors.stock = 'Le stock ne peut pas être négatif';
    if (formCard && formCard.stock_reduc < 0) errors.stock_reduc = 'Le stock réduit ne peut pas être négatif';
    if (formCard && formCard.stock_reduc > formCard.stock) errors.stock_reduc = 'Le stock réduit ne peut pas être supérieur au stock total';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddProduitDeriveLocal = () => {
    setProduitsDerives([
      ...produitsDerives,
      { titre: '', description: '', prix: '', price_promo: '', images: [''], deliveryTime: '' }
    ]);
  };

  const handleRemoveProduitDeriveLocal = (index: number) => {
    setProduitsDerives(produitsDerives.filter((_, i) => i !== index));
  };

  const handleAddCaracteristiqueLocal = (tableauIndex: number) => {
    const newCaracteristiquesTableaux = [...caracteristiquesTableaux];
    newCaracteristiquesTableaux[tableauIndex].caracteristiques.push({ nom: '', valeur: '' });
    setCaracteristiquesTableaux(newCaracteristiquesTableaux);
  };

  const handleRemoveCaracteristiqueLocal = (tableauIndex: number, caracIndex: number) => {
    const newCaracteristiquesTableaux = [...caracteristiquesTableaux];
    newCaracteristiquesTableaux[tableauIndex].caracteristiques.splice(caracIndex, 1);
    setCaracteristiquesTableaux(newCaracteristiquesTableaux);
  };

  const handleAddTableauCaracteristiquesLocal = () => {
    setCaracteristiquesTableaux([...caracteristiquesTableaux, { titre: '', caracteristiques: [{ nom: '', valeur: '' }] }]);
  };

  const handleRemoveTableauCaracteristiques = (index: number) => {
    setCaracteristiquesTableaux(caracteristiquesTableaux.filter((_, i) => i !== index));
  };

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!formCard || !validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Préparer les données pour Firebase
      const cardData = { 
        ...formCard, 
        produits_derives: produitsDerives, 
        caracteristiques: caracteristiquesTableaux,
        images: images.filter(image => image.trim()),
        updatedAt: serverTimestamp()
      };
      
      // Mettre à jour dans Firebase
      const cardRef = doc(db, 'cards', formCard._id);
      await updateDoc(cardRef, cardData);
      
      console.log("✅ Carte mise à jour avec l'ID :", formCard._id);
      
      // Notification de succès
      alert('✅ Article mis à jour avec succès !');
      
      hideForm();
    } catch (err) {
      console.error('❌ Erreur lors de la mise à jour :', err);
      alert('❌ Erreur lors de la mise à jour de l\'article');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sections = [
    { id: 'basic', title: 'Informations de base', icon: FileText },
    { id: 'category', title: 'Catégorie & Affichage', icon: Tag },
    { id: 'pricing', title: 'Prix & Stock', icon: Euro },
    { id: 'images', title: 'Images', icon: ImageIcon },
    { id: 'seller', title: 'Vendeur', icon: User },
    { id: 'features', title: 'Points importants', icon: Star },
    { id: 'specs', title: 'Caractéristiques', icon: Settings },
    { id: 'derived', title: 'Produits dérivés', icon: Package },
  ];

  const getCompletionPercentage = () => {
    if (!formCard) return 0;
    const requiredFields = ['title', 'description', 'price', 'categorie'];
    const completed = requiredFields.filter(field => formCard[field as keyof Card] && String(formCard[field as keyof Card]).trim()).length;
    return Math.round((completed / requiredFields.length) * 100);
  };

  if (!formCard) return null;

  return (
    <div className="modern-add-card-container">
      {/* Header */}
      <div className="modern-form-header">
        <div className="header-content">
          <div className="header-left">
            <div className="form-icon">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <h1 className="form-title">
                Modifier l'article
              </h1>
              <p className="form-subtitle">
                Modifiez les informations de votre article
              </p>
            </div>
          </div>
          
          <div className="header-right">
            <div className="completion-indicator">
              <div className="completion-circle">
                <svg className="completion-svg" viewBox="0 0 36 36">
                  <path
                    className="completion-bg"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="completion-progress"
                    strokeDasharray={`${getCompletionPercentage()}, 100`}
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="completion-text">{getCompletionPercentage()}%</div>
              </div>
              <span className="completion-label">Complété</span>
            </div>
            
            <button
              className="preview-toggle"
              onClick={() => setPreviewMode(!previewMode)}
            >
              {previewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {previewMode ? 'Édition' : 'Aperçu'}
            </button>

            <button
              className="close-button"
              onClick={hideForm}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${getCompletionPercentage()}%` }}
          />
        </div>
      </div>

      <div className="modern-form-layout">
        {/* Sidebar Navigation */}
        <div className="form-sidebar">
          <div className="sidebar-content">
            <h3 className="sidebar-title">Sections</h3>
            <nav className="sidebar-nav">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                const hasErrors = Object.keys(validationErrors).some(key => {
                  // Check if this section has validation errors
                  if (section.id === 'basic') return ['title', 'description'].includes(key);
                  if (section.id === 'category') return ['categorie'].includes(key);
                  if (section.id === 'pricing') return ['price', 'stock', 'stock_reduc'].includes(key);
                  return false;
                });
                
                return (
                  <button
                    key={section.id}
                    className={`nav-item ${isActive ? 'active' : ''} ${hasErrors ? 'error' : ''}`}
                    onClick={() => setActiveSection(section.id)}
                  >
                    <Icon className="nav-icon" />
                    <span className="nav-text">{section.title}</span>
                    {hasErrors && <AlertCircle className="error-icon" />}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="form-content">
          <div className="content-wrapper">
            {/* Basic Information */}
            {activeSection === 'basic' && (
              <div className="form-section">
                <div className="section-header">
                  <FileText className="section-icon" />
                  <h2 className="section-title">Informations de base</h2>
                  <p className="section-description">Les informations essentielles de votre article</p>
                </div>
                
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label className="form-label required">
                      Titre de l'article
                    </label>
                    <input
                      type="text"
                      className={`form-input ${validationErrors.title ? 'error' : ''}`}
                      placeholder="Ex: Robe élégante en soie..."
                      value={formCard.title || ''}
                      onChange={(e) => handleInputChangeLocal('title', e.target.value)}
                    />
                    {validationErrors.title && (
                      <span className="error-message">{validationErrors.title}</span>
                    )}
                  </div>
                  
                  <div className="form-group full-width">
                    <label className="form-label">
                      Sous-titre
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Collection Automne 2025"
                      value={formCard.subtitle || ''}
                      onChange={(e) => handleInputChangeLocal('subtitle', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group full-width">
                    <label className="form-label required">
                      Description
                    </label>
                    <textarea
                      className={`form-textarea ${validationErrors.description ? 'error' : ''}`}
                      placeholder="Décrivez votre article en détail..."
                      rows={4}
                      value={formCard.description || ''}
                      onChange={(e) => handleInputChangeLocal('description', e.target.value)}
                    />
                    {validationErrors.description && (
                      <span className="error-message">{validationErrors.description}</span>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      Temps de livraison
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: 2-3 jours"
                      value={formCard.deliveryTime || ''}
                      onChange={(e) => handleInputChangeLocal('deliveryTime', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      Date d'expiration
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={formCard.time ? new Date(Date.parse(formCard.time)).toISOString().substring(0, 10) : ''}
                      onChange={(e) => handleInputChangeLocal('time', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Category & Display */}
            {activeSection === 'category' && (
              <div className="form-section">
                <div className="section-header">
                  <Tag className="section-icon" />
                  <h2 className="section-title">Catégorie & Affichage</h2>
                  <p className="section-description">Organisez et mettez en valeur votre article</p>
                </div>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label required">
                      Catégorie
                    </label>
                    <select
                      className={`form-select ${validationErrors.categorie ? 'error' : ''}`}
                      value={formCard.categorie || ''}
                      onChange={(e) => handleInputChangeLocal('categorie', e.target.value)}
                    >
                      <option value="">Sélectionner une catégorie</option>
                      <option value="Mode Femme">Mode Femme</option>
                      <option value="Mode Homme">Mode Homme</option>
                      <option value="Accessoires">Accessoires</option>
                      <option value="Maison">Maison</option>
                      <option value="Beauté">Beauté</option>
                    </select>
                    {validationErrors.categorie && (
                      <span className="error-message">{validationErrors.categorie}</span>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      Image de catégorie
                    </label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="URL de l'image de catégorie"
                      value={formCard.categorieImage || ''}
                      onChange={(e) => handleInputChangeLocal('categorieImage', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      Couleur d'arrière-plan
                    </label>
                    <div className="color-input-group">
                      <input
                        type="color"
                        className="color-picker"
                        value={formCard.categorieBackgroundColor || '#ffffff'}
                        onChange={(e) => handleInputChangeLocal('categorieBackgroundColor', e.target.value)}
                      />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="#ffffff"
                        value={formCard.categorieBackgroundColor || ''}
                        onChange={(e) => handleInputChangeLocal('categorieBackgroundColor', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="form-group full-width">
                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          className="checkbox-input"
                          checked={formCard.nouveau || false}
                          onChange={(e) => handleInputChangeLocal('nouveau', e.target.checked)}
                        />
                        <span className="checkbox-custom"></span>
                        <span className="checkbox-text">Marquer comme nouveau</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pricing & Stock */}
            {activeSection === 'pricing' && (
              <div className="form-section">
                <div className="section-header">
                  <Euro className="section-icon" />
                  <h2 className="section-title">Prix & Stock</h2>
                  <p className="section-description">Définissez les prix et gérez votre inventaire</p>
                </div>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label required">
                      Prix (€)
                    </label>
                    <div className="price-input-group">
                      <Euro className="price-icon" />
                      <input
                        type="number"
                        step="0.01"
                        className={`form-input price-input ${validationErrors.price ? 'error' : ''}`}
                        placeholder="0.00"
                        value={formCard.price || ''}
                        onChange={(e) => handleInputChangeLocal('price', Number(e.target.value))}
                      />
                    </div>
                    {validationErrors.price && (
                      <span className="error-message">{validationErrors.price}</span>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      Prix promotionnel (€)
                    </label>
                    <div className="price-input-group">
                      <Euro className="price-icon" />
                      <input
                        type="number"
                        step="0.01"
                        className="form-input price-input"
                        placeholder="0.00"
                        value={formCard.price_promo || ''}
                        onChange={(e) => handleInputChangeLocal('price_promo', Number(e.target.value))}
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      Stock total
                    </label>
                    <input
                      type="number"
                      min="0"
                      className={`form-input ${validationErrors.stock ? 'error' : ''}`}
                      placeholder="0"
                      value={formCard.stock || ''}
                      onChange={(e) => handleInputChangeLocal('stock', Number(e.target.value))}
                    />
                    {validationErrors.stock && (
                      <span className="error-message">{validationErrors.stock}</span>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      Stock vendu
                    </label>
                    <input
                      type="number"
                      min="0"
                      className={`form-input ${validationErrors.stock_reduc ? 'error' : ''}`}
                      placeholder="0"
                      value={formCard.stock_reduc || ''}
                      onChange={(e) => handleInputChangeLocal('stock_reduc', Number(e.target.value))}
                    />
                    {validationErrors.stock_reduc && (
                      <span className="error-message">{validationErrors.stock_reduc}</span>
                    )}
                  </div>
                  
                  {formCard.stock > 0 && (
                    <div className="form-group full-width">
                      <div className="stock-indicator">
                        <div className="stock-bar">
                          <div 
                            className="stock-fill"
                            style={{ 
                              width: `${Math.min(100, (formCard.stock_reduc / formCard.stock) * 100)}%` 
                            }}
                          />
                        </div>
                        <span className="stock-text">
                          {formCard.stock - formCard.stock_reduc} restant(s) sur {formCard.stock}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Images */}
            {activeSection === 'images' && (
              <div className="form-section">
                <div className="section-header">
                  <ImageIcon className="section-icon" />
                  <h2 className="section-title">Images</h2>
                  <p className="section-description">Ajoutez des images pour présenter votre article</p>
                </div>
                
                <div className="images-grid">
                  {images.map((image, index) => (
                    <div key={index} className="image-upload-card">
                      <div className="image-preview">
                        {image ? (
                          <img src={image} alt={`Aperçu ${index + 1}`} className="preview-img" />
                        ) : (
                          <div className="empty-preview">
                            <Upload className="upload-icon" />
                            <span>Image {index + 1}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="image-input-group">
                        <input
                          type="url"
                          className="form-input"
                          placeholder={`URL de l'image ${index + 1}`}
                          value={image}
                          onChange={(e) => {
                            const newImages = [...images];
                            newImages[index] = e.target.value;
                            setImages(newImages);
                          }}
                        />
                        {image && (
                          <button
                            type="button"
                            className="clear-image-btn"
                            onClick={() => {
                              const newImages = [...images];
                              newImages[index] = '';
                              setImages(newImages);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <button
                  type="button"
                  className="add-image-btn"
                  onClick={() => setImages([...images, ''])}
                >
                  <Plus className="h-4 w-4" />
                  Ajouter une image
                </button>
              </div>
            )}

            {/* Seller Information */}
            {activeSection === 'seller' && (
              <div className="form-section">
                <div className="section-header">
                  <User className="section-icon" />
                  <h2 className="section-title">Informations vendeur</h2>
                  <p className="section-description">Détails sur le vendeur de l'article</p>
                </div>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      Prénom du vendeur
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Marie"
                      value={formCard.prenom_du_proposant || ''}
                      onChange={(e) => handleInputChangeLocal('prenom_du_proposant', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      Photo du vendeur
                    </label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="URL de la photo"
                      value={formCard.photo_du_proposant || ''}
                      onChange={(e) => handleInputChangeLocal('photo_du_proposant', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group full-width">
                    <label className="form-label">
                      Origine
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Atelier parisien"
                      value={formCard.origine || ''}
                      onChange={(e) => handleInputChangeLocal('origine', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Important Features */}
            {activeSection === 'features' && (
              <div className="form-section">
                <div className="section-header">
                  <Star className="section-icon" />
                  <h2 className="section-title">Points importants</h2>
                  <p className="section-description">Mettez en avant les caractéristiques clés</p>
                </div>
                
                <div className="features-grid">
                  {[1, 2, 3, 4].map((num) => (
                    <div key={num} className="feature-card">
                      <div className="feature-header">
                        <Star className="feature-icon" />
                        <h4>Point important {num}</h4>
                      </div>
                      
                      <div className="feature-content">
                        <div className="form-group">
                          <label className="form-label">
                            Texte
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder={`Point important ${num}`}
                            value={formCard[`point_important_${num === 1 ? 'un' : num === 2 ? 'deux' : num === 3 ? 'trois' : 'quatre'}` as keyof Card] as string || ''}
                            onChange={(e) => handleInputChangeLocal(
                              `point_important_${num === 1 ? 'un' : num === 2 ? 'deux' : num === 3 ? 'trois' : 'quatre'}` as keyof Card, 
                              e.target.value
                            )}
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">
                            Icône/Image
                          </label>
                          <input
                            type="url"
                            className="form-input"
                            placeholder="URL de l'icône"
                            value={formCard[`img_point_important_${num === 1 ? 'un' : num === 2 ? 'deux' : num === 3 ? 'trois' : 'quatre'}` as keyof Card] as string || ''}
                            onChange={(e) => handleInputChangeLocal(
                              `img_point_important_${num === 1 ? 'un' : num === 2 ? 'deux' : num === 3 ? 'trois' : 'quatre'}` as keyof Card, 
                              e.target.value
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Specifications */}
            {activeSection === 'specs' && (
              <div className="form-section">
                <div className="section-header">
                  <Settings className="section-icon" />
                  <h2 className="section-title">Caractéristiques</h2>
                  <p className="section-description">Détails techniques et spécifications</p>
                </div>
                
                <div className="specs-container">
                  {caracteristiquesTableaux.map((tableau, tableauIndex) => (
                    <div key={tableauIndex} className="spec-table-card">
                      <div className="spec-table-header">
                        <input
                          type="text"
                          className="form-input table-title-input"
                          placeholder="Titre du tableau"
                          value={tableau.titre || ''}
                          onChange={(e) => {
                            const newCaracteristiquesTableaux = [...caracteristiquesTableaux];
                            newCaracteristiquesTableaux[tableauIndex].titre = e.target.value;
                            setCaracteristiquesTableaux(newCaracteristiquesTableaux);
                          }}
                        />
                        
                        <button
                          type="button"
                          className="remove-table-btn"
                          onClick={() => handleRemoveTableauCaracteristiques(tableauIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="spec-items">
                        {tableau.caracteristiques?.map((caracteristique: any, caracIndex: number) => (
                          <div key={caracIndex} className="spec-item">
                            <input
                              type="text"
                              className="form-input spec-name"
                              placeholder="Nom"
                              value={caracteristique.nom || ''}
                              onChange={(e) => {
                                const newCaracteristiquesTableaux = [...caracteristiquesTableaux];
                                newCaracteristiquesTableaux[tableauIndex].caracteristiques[caracIndex].nom = e.target.value;
                                setCaracteristiquesTableaux(newCaracteristiquesTableaux);
                              }}
                            />
                            
                            <input
                              type="text"
                              className="form-input spec-value"
                              placeholder="Valeur"
                              value={caracteristique.valeur || ''}
                              onChange={(e) => {
                                const newCaracteristiquesTableaux = [...caracteristiquesTableaux];
                                newCaracteristiquesTableaux[tableauIndex].caracteristiques[caracIndex].valeur = e.target.value;
                                setCaracteristiquesTableaux(newCaracteristiquesTableaux);
                              }}
                            />
                            
                            <button
                              type="button"
                              className="remove-spec-btn"
                              onClick={() => handleRemoveCaracteristiqueLocal(tableauIndex, caracIndex)}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      <button
                        type="button"
                        className="add-spec-btn"
                        onClick={() => handleAddCaracteristiqueLocal(tableauIndex)}
                      >
                        <Plus className="h-4 w-4" />
                        Ajouter une caractéristique
                      </button>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    className="add-table-btn"
                    onClick={handleAddTableauCaracteristiquesLocal}
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter un tableau
                  </button>
                </div>
              </div>
            )}

            {/* Derived Products */}
            {activeSection === 'derived' && (
              <div className="form-section">
                <div className="section-header">
                  <Package className="section-icon" />
                  <h2 className="section-title">Produits dérivés</h2>
                  <p className="section-description">Articles complémentaires ou variantes</p>
                </div>
                
                <div className="derived-products">
                  {produitsDerives.map((produit, index) => (
                    <div key={index} className="derived-product-card">
                      <div className="derived-header">
                        <h4>Produit dérivé {index + 1}</h4>
                        <button
                          type="button"
                          className="remove-derived-btn"
                          onClick={() => handleRemoveProduitDeriveLocal(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="derived-content">
                        <div className="form-grid">
                          <div className="form-group">
                            <label className="form-label">Titre</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Titre du produit"
                              value={produit.titre || ''}
                              onChange={(e) => {
                                const newProduitsDerives = [...produitsDerives];
                                newProduitsDerives[index].titre = e.target.value;
                                setProduitsDerives(newProduitsDerives);
                              }}
                            />
                          </div>
                          
                          <div className="form-group">
                            <label className="form-label">Prix</label>
                            <input
                              type="number"
                              step="0.01"
                              className="form-input"
                              placeholder="0.00"
                              value={produit.prix || ''}
                              onChange={(e) => {
                                const newProduitsDerives = [...produitsDerives];
                                newProduitsDerives[index].prix = e.target.value;
                                setProduitsDerives(newProduitsDerives);
                              }}
                            />
                          </div>
                          
                          <div className="form-group">
                            <label className="form-label">Prix promo</label>
                            <input
                              type="number"
                              step="0.01"
                              className="form-input"
                              placeholder="0.00"
                              value={produit.price_promo || ''}
                              onChange={(e) => {
                                const newProduitsDerives = [...produitsDerives];
                                newProduitsDerives[index].price_promo = e.target.value;
                                setProduitsDerives(newProduitsDerives);
                              }}
                            />
                          </div>
                          
                          <div className="form-group">
                            <label className="form-label">Livraison</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Ex: 2-3 jours"
                              value={produit.deliveryTime || ''}
                              onChange={(e) => {
                                const newProduitsDerives = [...produitsDerives];
                                newProduitsDerives[index].deliveryTime = e.target.value;
                                setProduitsDerives(newProduitsDerives);
                              }}
                            />
                          </div>
                          
                          <div className="form-group full-width">
                            <label className="form-label">Description</label>
                            <textarea
                              className="form-textarea"
                              placeholder="Description du produit"
                              rows={3}
                              value={produit.description || ''}
                              onChange={(e) => {
                                const newProduitsDerives = [...produitsDerives];
                                newProduitsDerives[index].description = e.target.value;
                                setProduitsDerives(newProduitsDerives);
                              }}
                            />
                          </div>
                        </div>
                        
                        <div className="derived-images">
                          <label className="form-label">Images</label>
                          {produit.images?.map((image: string, imageIndex: number) => (
                            <div key={imageIndex} className="derived-image-input">
                              <input
                                type="url"
                                className="form-input"
                                placeholder={`URL image ${imageIndex + 1}`}
                                value={image || ''}
                                onChange={(e) => {
                                  const newProduitsDerives = [...produitsDerives];
                                  newProduitsDerives[index].images[imageIndex] = e.target.value;
                                  setProduitsDerives(newProduitsDerives);
                                }}
                              />
                              <button
                                type="button"
                                className="remove-image-btn"
                                onClick={() => {
                                  const newProduitsDerives = [...produitsDerives];
                                  newProduitsDerives[index].images.splice(imageIndex, 1);
                                  setProduitsDerives(newProduitsDerives);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                          
                          <button
                            type="button"
                            className="add-derived-image-btn"
                            onClick={() => {
                              const newProduitsDerives = [...produitsDerives];
                              newProduitsDerives[index].images.push('');
                              setProduitsDerives(newProduitsDerives);
                            }}
                          >
                            <Plus className="h-4 w-4" />
                            Ajouter une image
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    className="add-derived-btn"
                    onClick={handleAddProduitDeriveLocal}
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter un produit dérivé
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="form-footer">
        <div className="footer-content">
          <div className="footer-left">
            {Object.keys(validationErrors).length > 0 && (
              <div className="validation-summary">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-red-600">
                  {Object.keys(validationErrors).length} erreur(s) à corriger
                </span>
              </div>
            )}
          </div>
          
          <div className="footer-right">
            <button
              type="button"
              className="cancel-btn"
              onClick={hideForm}
              disabled={isSubmitting}
            >
              Annuler
            </button>
            
            <button
              type="button"
              className="submit-btn"
              onClick={handleSubmit}
              disabled={isSubmitting || Object.keys(validationErrors).length > 0}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner" />
                  Mise à jour...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Mettre à jour l'article
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .modern-add-card-container {
          position: fixed;
          inset: 0;
          z-index: 50;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(8px);
          display: flex;
          flex-direction: column;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .modern-form-header {
          background: white;
          border-bottom: 1px solid #e2e8f0;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .header-content {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .form-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .form-title {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 4px 0;
          color: #1e293b;
        }

        .form-subtitle {
          color: #64748b;
          margin: 0;
          font-size: 14px;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .completion-indicator {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .completion-circle {
          position: relative;
          width: 48px;
          height: 48px;
        }

        .completion-svg {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }

        .completion-bg {
          fill: none;
          stroke: #e2e8f0;
          stroke-width: 2;
        }

        .completion-progress {
          fill: none;
          stroke: #667eea;
          stroke-width: 2;
          stroke-linecap: round;
          transition: stroke-dasharray 0.3s ease;
        }

        .completion-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 12px;
          font-weight: 600;
          color: #667eea;
        }

        .completion-label {
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }

        .preview-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          color: #475569;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .preview-toggle:hover {
          background: #e2e8f0;
          border-color: #cbd5e1;
        }

        .close-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .close-button:hover {
          background: #e2e8f0;
          border-color: #cbd5e1;
        }

        .progress-bar {
          width: 100%;
          height: 4px;
          background: #e2e8f0;
          border-radius: 2px;
          overflow: hidden;
          margin-top: 16px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea, #764ba2);
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .modern-form-layout {
          flex: 1;
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 24px;
          padding: 24px;
          overflow: hidden;
        }

        .form-sidebar {
          background: white;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          height: fit-content;
          max-height: calc(100vh - 200px);
          overflow-y: auto;
        }

        .sidebar-content {
          padding: 24px;
        }

        .sidebar-title {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 16px 0;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 8px;
          border: none;
          background: none;
          color: #64748b;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          width: 100%;
          position: relative;
        }

        .nav-item:hover {
          background: #f1f5f9;
          color: #475569;
        }

        .nav-item.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .nav-item.error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .nav-item.error.active {
          background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
          color: white;
        }

        .nav-icon {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }

        .nav-text {
          flex: 1;
          font-size: 14px;
        }

        .error-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        .form-content {
          background: white;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .content-wrapper {
          flex: 1;
          padding: 32px;
          overflow-y: auto;
          max-height: calc(100vh - 200px);
        }

        .form-section {
          width: 100%;
        }

        .section-header {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 32px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f1f5f9;
        }

        .section-icon {
          width: 24px;
          height: 24px;
          color: #667eea;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .section-title {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .section-description {
          color: #64748b;
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-label {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .form-label.required::after {
          content: '*';
          color: #ef4444;
          font-weight: bold;
        }

        .form-input,
        .form-textarea,
        .form-select {
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s ease;
          background: white;
        }

        .form-input:focus,
        .form-textarea:focus,
        .form-select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-input.error,
        .form-textarea.error,
        .form-select.error {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }

        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }

        .error-message {
          color: #ef4444;
          font-size: 12px;
          font-weight: 500;
        }

        .color-input-group {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .color-picker {
          width: 48px;
          height: 48px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          cursor: pointer;
          background: none;
        }

        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .checkbox-input {
          display: none;
        }

        .checkbox-custom {
          width: 20px;
          height: 20px;
          border: 2px solid #d1d5db;
          border-radius: 4px;
          position: relative;
          transition: all 0.2s ease;
        }

        .checkbox-input:checked + .checkbox-custom {
          background: #667eea;
          border-color: #667eea;
        }

        .checkbox-input:checked + .checkbox-custom::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 6px;
          width: 4px;
          height: 8px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }

        .price-input-group {
          position: relative;
        }

        .price-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          color: #9ca3af;
        }

        .price-input {
          padding-left: 40px;
        }

        .stock-indicator {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
        }

        .stock-bar {
          width: 100%;
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .stock-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981, #059669);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .stock-text {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
        }

        .images-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .image-upload-card {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          background: white;
        }

        .image-preview {
          height: 150px;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .preview-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .empty-preview {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: #9ca3af;
        }

        .upload-icon {
          width: 24px;
          height: 24px;
        }

        .image-input-group {
          padding: 12px;
          display: flex;
          gap: 8px;
        }

        .clear-image-btn {
          padding: 8px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          color: #dc2626;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .clear-image-btn:hover {
          background: #fee2e2;
        }

        .add-image-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: #f1f5f9;
          border: 1px dashed #cbd5e1;
          border-radius: 8px;
          color: #475569;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .add-image-btn:hover {
          background: #e2e8f0;
          border-color: #94a3b8;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .feature-card {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
          background: #fafbfc;
        }

        .feature-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .feature-icon {
          width: 16px;
          height: 16px;
          color: #f59e0b;
        }

        .feature-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .specs-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .spec-table-card {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          background: #fafbfc;
        }

        .spec-table-header {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .table-title-input {
          flex: 1;
          font-weight: 600;
        }

        .remove-table-btn {
          padding: 8px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          color: #dc2626;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .remove-table-btn:hover {
          background: #fee2e2;
        }

        .spec-items {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .spec-item {
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          gap: 8px;
          align-items: center;
        }

        .spec-name,
        .spec-value {
          padding: 8px 12px;
          font-size: 13px;
        }

        .remove-spec-btn {
          padding: 6px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 4px;
          color: #dc2626;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .remove-spec-btn:hover {
          background: #fee2e2;
        }

        .add-spec-btn,
        .add-table-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: white;
          border: 1px dashed #cbd5e1;
          border-radius: 8px;
          color: #475569;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .add-spec-btn:hover,
        .add-table-btn:hover {
          background: #f8fafc;
          border-color: #94a3b8;
        }

        .derived-products {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .derived-product-card {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          background: #fafbfc;
        }

        .derived-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .derived-header h4 {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .remove-derived-btn {
          padding: 8px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          color: #dc2626;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .remove-derived-btn:hover {
          background: #fee2e2;
        }

        .derived-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .derived-images {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .derived-image-input {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .remove-image-btn {
          padding: 6px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 4px;
          color: #dc2626;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .remove-image-btn:hover {
          background: #fee2e2;
        }

        .add-derived-image-btn,
        .add-derived-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: white;
          border: 1px dashed #cbd5e1;
          border-radius: 8px;
          color: #475569;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 8px;
        }

        .add-derived-image-btn:hover,
        .add-derived-btn:hover {
          background: #f8fafc;
          border-color: #94a3b8;
        }

        .form-footer {
          background: white;
          border-top: 1px solid #e2e8f0;
          padding: 24px;
          box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.1);
        }

        .footer-content {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .footer-left {
          display: flex;
          align-items: center;
        }

        .validation-summary {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .footer-right {
          display: flex;
          gap: 12px;
        }

        .cancel-btn {
          padding: 12px 24px;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          color: #374151;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cancel-btn:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .cancel-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .submit-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 1024px) {
          .modern-form-layout {
            grid-template-columns: 1fr;
            gap: 16px;
            padding: 16px;
          }

          .form-sidebar {
            position: static;
          }

          .sidebar-nav {
            flex-direction: row;
            overflow-x: auto;
            gap: 8px;
            padding-bottom: 8px;
          }

          .nav-item {
            white-space: nowrap;
            flex-shrink: 0;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .images-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .header-content {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }

          .header-right {
            width: 100%;
            justify-content: space-between;
          }

          .content-wrapper {
            padding: 20px;
          }

          .images-grid {
            grid-template-columns: 1fr;
          }

          .footer-content {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .footer-right {
            justify-content: stretch;
          }

          .cancel-btn,
          .submit-btn {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default UpdateCardModal;