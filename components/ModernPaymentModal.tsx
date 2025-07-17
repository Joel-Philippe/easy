'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Lock, 
  Shield, 
  CheckCircle, 
  X, 
  User, 
  MapPin, 
  Phone, 
  Mail,
  ArrowRight,
  Sparkles,
  Package,
  Truck,
  Star,
  AlertTriangle,
  RefreshCw,
  Plus,
  Minus,
  Trash2
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import '../app/globals.css';
import '../app/GlobalCart.css';

// Initialiser Stripe avec la clé publique
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: any[];
  total: number;
  user: any;
  onPaymentSuccess: () => void;
  onStockError?: (errorDetails: any) => void;
  onUpdateQuantity?: (title: string, newQuantity: number) => void;
  onRemoveItem?: (title: string) => void;
  stockStatus?: Record<string, number>;
}

interface DeliveryInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  notes: string;
}

const PaymentForm = ({ 
  cartItems, 
  total, 
  user, 
  onPaymentSuccess, 
  onClose,
  deliveryInfo,
  setDeliveryInfo,
  onStockError,
  onUpdateQuantity,
  onRemoveItem,
  stockStatus = {}
}: any) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [saveCard, setSaveCard] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [stockCheckInProgress, setStockCheckInProgress] = useState(false);
  const [animatingItems, setAnimatingItems] = useState<Set<string>>(new Set());

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1f2937',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
        fontSmoothing: 'antialiased',
        '::placeholder': {
          color: '#9ca3af',
        },
        iconColor: '#6b7280',
      },
      invalid: {
        color: '#ef4444',
        iconColor: '#ef4444',
      },
    },
    hidePostalCode: true,
  };

  const validateDeliveryInfo = () => {
    const errors: Record<string, string> = {};
    
    if (!deliveryInfo.firstName.trim()) errors.firstName = 'Le prénom est requis';
    if (!deliveryInfo.lastName.trim()) errors.lastName = 'Le nom est requis';
    if (!deliveryInfo.email.trim()) errors.email = 'L\'email est requis';
    if (!deliveryInfo.phone.trim()) errors.phone = 'Le téléphone est requis';
    if (!deliveryInfo.address.trim()) errors.address = 'L\'adresse est requise';
    if (!deliveryInfo.city.trim()) errors.city = 'La ville est requise';
    if (!deliveryInfo.postalCode.trim()) errors.postalCode = 'Le code postal est requis';
    if (!deliveryInfo.country.trim()) errors.country = 'Le pays est requis';

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (deliveryInfo.email && !emailRegex.test(deliveryInfo.email)) {
      errors.email = 'Format d\'email invalide';
    }

    // Validation téléphone
    const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
    if (deliveryInfo.phone && !phoneRegex.test(deliveryInfo.phone)) {
      errors.phone = 'Format de téléphone invalide';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDeliverySubmit = () => {
    if (validateDeliveryInfo()) {
      setCurrentStep(2);
    }
  };

  // 🔒 Fonction pour vérifier le panier avant le paiement
  const verifyCartBeforePayment = () => {
    // Vérifier que le panier n'est pas vide
    if (!cartItems || cartItems.length === 0) {
      throw new Error('🛒 Votre panier est vide. Veuillez ajouter des articles avant de procéder au paiement.');
    }

    // Vérifier que le total est supérieur au minimum Stripe (0.50€)
    if (total < 0.5) {
      throw new Error('💰 Le montant minimum pour un paiement est de 0,50€. Veuillez ajouter des articles à votre panier.');
    }

    // Vérifier que tous les articles ont un ID valide
    const invalidItems = cartItems.filter(item => !item._id || !item.title || !item.count || item.count <= 0);
    if (invalidItems.length > 0) {
      throw new Error('❌ Certains articles de votre panier sont invalides. Veuillez actualiser la page et réessayer.');
    }

    return true;
  };

  // 🛒 Gestion des quantités dans la modal
  const handleQuantityChange = (title: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromModal(title);
      return;
    }

    const availableStock = stockStatus[title] || 0;
    if (newQuantity > availableStock) {
      setPaymentError(`Stock insuffisant pour "${title}". Seulement ${availableStock} disponible(s).`);
      return;
    }

    setAnimatingItems(prev => new Set([...prev, title]));
    
    if (onUpdateQuantity) {
      onUpdateQuantity(title, newQuantity);
    }

    setTimeout(() => {
      setAnimatingItems(prev => {
        const next = new Set(prev);
        next.delete(title);
        return next;
      });
    }, 300);

    // Effacer les erreurs précédentes
    setPaymentError('');
  };

  const handleRemoveFromModal = (title: string) => {
    setAnimatingItems(prev => new Set([...prev, title]));
    
    setTimeout(() => {
      if (onRemoveItem) {
        onRemoveItem(title);
      }
    }, 300);
  };

  const getItemStatus = (item: any) => {
    const availableStock = stockStatus[item.title] || 0;
    const isExpired = item.expiryDate ? new Date(item.expiryDate) < new Date() : false;
    
    if (isExpired) return { type: 'expired', message: 'Produit expiré', color: 'red' };
    if (availableStock <= 0) return { type: 'outOfStock', message: 'Rupture de stock', color: 'red' };
    if (item.count > availableStock) return { type: 'limitedStock', message: `Seulement ${availableStock} disponible(s)`, color: 'orange' };
    if (availableStock <= 3) return { type: 'lowStock', message: `Plus que ${availableStock} en stock`, color: 'orange' };
    
    return { type: 'available', message: 'Disponible', color: 'green' };
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) return;
    
    setIsProcessing(true);
    setStockCheckInProgress(true);
    setPaymentError('');

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Élément de carte non trouvé');

      console.log("🔒 Vérification préliminaire du panier...");
      
      // 🔒 ÉTAPE 0: Vérification préliminaire du panier
      verifyCartBeforePayment();

      console.log("🔒 Préparation du paiement SANS réservation de stock...");

      // 1️⃣ Préparation des lignes Stripe
      const stripeItems = cartItems.map(item => ({
        price_data: {
          currency: 'eur',
          product_data: { name: item.title },
          unit_amount: Math.round((item.price_promo || item.price) * 100),
        },
        quantity: item.count,
      }));

      // Vérifier que les montants sont valides
      const totalAmount = stripeItems.reduce((sum, item) => sum + (item.price_data.unit_amount * item.quantity), 0);
      if (totalAmount < 50) { // 50 centimes = 0.50€
        throw new Error('💰 Le montant total est trop faible pour effectuer un paiement. Minimum requis : 0,50€');
      }

      // 2️⃣ Construction des metadataItems pour le webhook
      const metadataItems = cartItems.map(item => ({
        id: item._id,
        title: item.title,
        count: item.count,
        price: item.price,
        price_promo: item.price_promo,
      }));

      console.log("📦 Envoi de la requête à l'API SANS réservation de stock...");
      console.log("💰 Montant total à traiter:", totalAmount, "centimes");

      // 3️⃣ Créer le PaymentIntent SANS réservation de stock
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          items: stripeItems,
          metadataItems,
          deliveryInfo,
          saveCard,
          useCheckout: false, // Mode PaymentIntent pour paiement intégré
          payment_method_types: ['card'],
          // 🚨 PARAMÈTRE CRITIQUE : Ne pas réserver le stock
          skipStockReservation: true,
          // 🚨 PARAMÈTRE CRITIQUE : Ne pas mettre à jour le stock
          skipStockUpdate: true,
          // 🚨 Le stock sera mis à jour uniquement par le webhook après paiement réussi
          updateStockOnlyAfterPayment: true
        }),
      });

      console.log("📡 Statut de la réponse:", response.status);
      
      const responseData = await response.json();
      console.log("📋 Réponse reçue:", responseData);

      setStockCheckInProgress(false);

      if (!response.ok) {
        // 🚨 Gérer les erreurs de stock
        if (responseData.code === 'INSUFFICIENT_STOCK') {
          console.log("🚨 Erreur de stock détectée:", responseData);
          
          // Propager l'erreur vers le composant parent pour mise à jour du panier
          if (onStockError) {
            onStockError(responseData);
          }
          
          // Afficher l'erreur de stock de manière lisible
          const errorLines = responseData.error.split('\n').filter(line => line.trim());
          const formattedError = `🔒 Vérification de stock effectuée :\n\n${errorLines.join('\n')}\n\n✅ Votre panier a été automatiquement mis à jour.`;
          
          throw new Error(formattedError);
        }

        // Gérer les autres erreurs
        if (responseData.code === 'NO_ITEMS') {
          throw new Error('🛒 Aucun article à traiter. Veuillez ajouter des produits à votre panier.');
        }

        throw new Error(responseData.error || 'Erreur lors de la création du paiement');
      }

      // 4️⃣ Vérifier que client_secret est présent
      const { client_secret } = responseData;
      if (!client_secret) {
        console.error("❌ Réponse complète:", responseData);
        throw new Error('Le serveur n\'a pas retourné de client_secret. Vérifiez la configuration Stripe.');
      }

      console.log("🔑 Client secret reçu, confirmation du paiement...");
      console.log("🔒 IMPORTANT: Le stock sera mis à jour uniquement après confirmation du paiement par Stripe");

      // 5️⃣ Confirmer le paiement avec Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${deliveryInfo.firstName} ${deliveryInfo.lastName}`,
            email: deliveryInfo.email,
            phone: deliveryInfo.phone,
            address: {
              line1: deliveryInfo.address,
              city: deliveryInfo.city,
              postal_code: deliveryInfo.postalCode,
              country: deliveryInfo.country,
            },
          },
        },
        setup_future_usage: saveCard ? 'off_session' : undefined,
      });

      if (error) {
        console.error("❌ Erreur de paiement Stripe:", error);
        console.log("🔒 IMPORTANT: Aucun stock n'a été modifié car le paiement a échoué");
        
        if (error.type === 'card_error' || error.type === 'validation_error') {
          setPaymentError(error.message || 'Erreur de carte');
        } else {
          setPaymentError('Une erreur est survenue lors du paiement');
        }
      } else if (paymentIntent.status === 'succeeded') {
        console.log("✅ Paiement réussi!");
        console.log("🔒 Le stock sera maintenant mis à jour par le webhook Stripe");
        onPaymentSuccess();
      }
    } catch (error: any) {
      console.error("❌ Erreur lors du traitement:", error);
      console.log("🔒 IMPORTANT: Aucun stock n'a été modifié car une erreur s'est produite");
      
      // Gestion détaillée des erreurs
      if (error.message?.includes('Stock insuffisant') || error.message?.includes('indisponibles') || error.message?.includes('Vérification de stock')) {
        setPaymentError(error.message);
      } else if (error.message?.includes('panier est vide')) {
        setPaymentError('🛒 Votre panier est vide. Veuillez ajouter des articles avant de procéder au paiement.');
        setTimeout(() => onClose(), 3000);
      } else if (error.message?.includes('montant minimum') || error.message?.includes('montant total est trop faible')) {
        setPaymentError('💰 Le montant de votre commande est insuffisant pour effectuer un paiement (minimum 0,50€). Veuillez ajouter des articles à votre panier.');
        setTimeout(() => onClose(), 3000);
      } else if (error.message?.includes('client_secret')) {
        setPaymentError('Erreur de configuration du paiement. Contactez le support.');
      } else {
        setPaymentError(error.message || 'Erreur lors du traitement du paiement');
      }
    } finally {
      setIsProcessing(false);
      setStockCheckInProgress(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  // Vérifier si le panier est valide pour le paiement
  const isCartValid = cartItems && cartItems.length > 0 && total >= 0.5;

  return (
    <div className="payment-form-container">
      {/* Progress Steps */}
      <div className="payment-progress">
        <div className="progress-steps">
          <div className={`progress-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-circle">
              {currentStep > 1 ? <CheckCircle className="h-4 w-4" /> : '1'}
            </div>
            <span className="step-label">Livraison</span>
          </div>
          
          <div className="progress-line" />
          
          <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>
            <div className="step-circle">
              {currentStep > 2 ? <CheckCircle className="h-4 w-4" /> : '2'}
            </div>
            <span className="step-label">Paiement</span>
          </div>
        </div>
      </div>

      {/* Alerte panier invalide */}
      {!isCartValid && (
        <div className="cart-invalid-alert">
          <div className="alert-content">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <div>
              <h4 className="font-semibold text-orange-800">⚠️ Panier vide ou stock épuisé </h4>
              <p className="text-sm text-orange-600 mt-1">
                {cartItems.length === 0 
                  ? "Votre panier est vide. Ajoutez des articles pour continuer."
                  : `Le montant minimum pour un paiement est de 0,50€. Total actuel : ${formatPrice(total)}`
                }
              </p>
              <button 
                onClick={onClose}
                className="mt-2 text-sm text-orange-700 underline hover:text-orange-800"
              >
                Retourner au panier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Delivery Information */}
      {currentStep === 1 && isCartValid && (
        <div className="delivery-step">
          <div className="step-header">
            <div className="step-icon">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="step-title">Informations de livraison</h2>
              <p className="step-description">Où souhaitez-vous recevoir votre commande ?</p>
            </div>
          </div>

          <form className="delivery-form" onSubmit={(e) => { e.preventDefault(); handleDeliverySubmit(); }}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  <User className="label-icon" />
                  Prénom *
                </label>
                <input
                  type="text"
                  className={`form-input ${validationErrors.firstName ? 'error' : ''}`}
                  value={deliveryInfo.firstName}
                  onChange={(e) => setDeliveryInfo({ ...deliveryInfo, firstName: e.target.value })}
                  placeholder="Votre prénom"
                />
                {validationErrors.firstName && (
                  <span className="error-message">{validationErrors.firstName}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <User className="label-icon" />
                  Nom *
                </label>
                <input
                  type="text"
                  className={`form-input ${validationErrors.lastName ? 'error' : ''}`}
                  value={deliveryInfo.lastName}
                  onChange={(e) => setDeliveryInfo({ ...deliveryInfo, lastName: e.target.value })}
                  placeholder="Votre nom"
                />
                {validationErrors.lastName && (
                  <span className="error-message">{validationErrors.lastName}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Mail className="label-icon" />
                  Email *
                </label>
                <input
                  type="email"
                  className={`form-input ${validationErrors.email ? 'error' : ''}`}
                  value={deliveryInfo.email}
                  onChange={(e) => setDeliveryInfo({ ...deliveryInfo, email: e.target.value })}
                  placeholder="votre@email.com"
                />
                {validationErrors.email && (
                  <span className="error-message">{validationErrors.email}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Phone className="label-icon" />
                  Téléphone *
                </label>
                <input
                  type="tel"
                  className={`form-input ${validationErrors.phone ? 'error' : ''}`}
                  value={deliveryInfo.phone}
                  onChange={(e) => setDeliveryInfo({ ...deliveryInfo, phone: e.target.value })}
                  placeholder="+33 6 12 34 56 78"
                />
                {validationErrors.phone && (
                  <span className="error-message">{validationErrors.phone}</span>
                )}
              </div>

              <div className="form-group full-width">
                <label className="form-label">
                  <MapPin className="label-icon" />
                  Adresse *
                </label>
                <input
                  type="text"
                  className={`form-input ${validationErrors.address ? 'error' : ''}`}
                  value={deliveryInfo.address}
                  onChange={(e) => setDeliveryInfo({ ...deliveryInfo, address: e.target.value })}
                  placeholder="123 Rue de la Paix"
                />
                {validationErrors.address && (
                  <span className="error-message">{validationErrors.address}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Ville *</label>
                <input
                  type="text"
                  className={`form-input ${validationErrors.city ? 'error' : ''}`}
                  value={deliveryInfo.city}
                  onChange={(e) => setDeliveryInfo({ ...deliveryInfo, city: e.target.value })}
                  placeholder="Paris"
                />
                {validationErrors.city && (
                  <span className="error-message">{validationErrors.city}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Code postal *</label>
                <input
                  type="text"
                  className={`form-input ${validationErrors.postalCode ? 'error' : ''}`}
                  value={deliveryInfo.postalCode}
                  onChange={(e) => setDeliveryInfo({ ...deliveryInfo, postalCode: e.target.value })}
                  placeholder="75001"
                />
                {validationErrors.postalCode && (
                  <span className="error-message">{validationErrors.postalCode}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Pays *</label>
                <select
                  className={`form-select ${validationErrors.country ? 'error' : ''}`}
                  value={deliveryInfo.country}
                  onChange={(e) => setDeliveryInfo({ ...deliveryInfo, country: e.target.value })}
                >
                  <option value="">Sélectionner un pays</option>
                  <option value="FR">France</option>
                  <option value="BE">Belgique</option>
                  <option value="CH">Suisse</option>
                  <option value="LU">Luxembourg</option>
                  <option value="MC">Monaco</option>
                </select>
                {validationErrors.country && (
                  <span className="error-message">{validationErrors.country}</span>
                )}
              </div>

              <div className="form-group full-width">
                <label className="form-label">Instructions de livraison (optionnel)</label>
                <textarea
                  className="form-textarea"
                  value={deliveryInfo.notes}
                  onChange={(e) => setDeliveryInfo({ ...deliveryInfo, notes: e.target.value })}
                  placeholder="Code d'accès, étage, instructions spéciales..."
                  rows={3}
                />
              </div>
            </div>

            <button type="submit" className="continue-button">
              Continuer vers le paiement
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* Step 2: Payment */}
      {currentStep === 2 && isCartValid && (
        <div className="payment-step">
          <div className="step-header">
            <div className="step-icon">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <h2 className="step-title">Informations de paiement</h2>
              <p className="step-description">🔒 Stock mis à jour uniquement après paiement réussi</p>
            </div>
          </div>

          <form onSubmit={handlePayment} className="payment-form">
            {/* Security Badge */}
            <div className="security-badge">
              <Shield className="h-5 w-5" />
              <span>🔒 Stock mis à jour uniquement après confirmation du paiement</span>
            </div>

            {/* Stock Check Progress */}
            {stockCheckInProgress && (
              <div className="stock-check-progress">
                <div className="progress-content">
                  <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
                  <div>
                    <h4 className="font-semibold text-blue-800">🔍 Préparation du paiement...</h4>
                    <p className="text-sm text-blue-600 mt-1">
                      Le stock sera vérifié et mis à jour uniquement après confirmation du paiement.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Card Input */}
            <div className="card-input-section">
              <label className="form-label">
                <CreditCard className="label-icon" />
                Informations de carte
              </label>
              
              <div className="card-element-container">
                <CardElement options={cardElementOptions} />
              </div>
              
              <div className="card-brands">
                <img src="https://js.stripe.com/v3/fingerprinted/img/visa-729c05c240c4bdb47b03ac81d9945bfe.svg" alt="Visa" />
                <img src="https://js.stripe.com/v3/fingerprinted/img/mastercard-4d8844094130711885b5e41b28c9848f.svg" alt="Mastercard" />
                <img src="https://js.stripe.com/v3/fingerprinted/img/amex-a49b82f46c5cd6a96a6e418a6ca1717c.svg" alt="American Express" />
              </div>
            </div>

            {/* Save Card Option */}
            <div className="save-card-option">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={saveCard}
                  onChange={(e) => setSaveCard(e.target.checked)}
                  className="checkbox-input"
                />
                <span className="checkbox-custom"></span>
                <span className="checkbox-text">
                  Enregistrer cette carte pour mes prochains achats
                </span>
              </label>
              <div className="save-card-benefits">
                <div className="benefit-item">
                  <CheckCircle className="h-4 w-4" />
                  <span>Paiement express</span>
                </div>
                <div className="benefit-item">
                  <Lock className="h-4 w-4" />
                  <span>Stockage sécurisé</span>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {paymentError && (
              <div className="error-alert">
                <div className="error-content">
                  <strong>⚠️ Information importante</strong>
                  <div className="error-details">
                    {paymentError.split('\n').map((line, index) => (
                      <div key={index} className="error-line">
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="payment-actions">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="back-button"
                disabled={isProcessing}
              >
                Retour
              </button>
              
              <button
                type="submit"
                disabled={!stripe || isProcessing || !isCartValid}
                className="pay-button"
              >
                {isProcessing ? (
                  <>
                    <div className="spinner" />
                    {stockCheckInProgress ? '🔍 Préparation...' : '🔒 Traitement du paiement...'}
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    🔒 Payer {formatPrice(total)}
                  </>
                )}
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="trust-indicators">
              <div className="trust-item">
                <Shield className="h-4 w-4" />
                <span>Stock protégé</span>
              </div>
              <div className="trust-item">
                <CheckCircle className="h-4 w-4" />
                <span>Chiffrement SSL</span>
              </div>
              <div className="trust-item">
                <Star className="h-4 w-4" />
                <span>Paiement sécurisé</span>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const ModernPaymentModal = ({ 
  isOpen, 
  onClose, 
  cartItems, 
  total, 
  user, 
  onPaymentSuccess, 
  onStockError,
  onUpdateQuantity,
  onRemoveItem,
  stockStatus = {}
}: PaymentModalProps) => {
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    firstName: user?.displayName?.split(' ')[0] || '',
    lastName: user?.displayName?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'FR',
    notes: '',
  });

  const [animatingItems, setAnimatingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const handleQuantityUpdate = (title: string, newQuantity: number) => {
    if (onUpdateQuantity) {
      onUpdateQuantity(title, newQuantity);
    }
  };

  const handleItemRemove = (title: string) => {
    if (onRemoveItem) {
      onRemoveItem(title);
    }
  };

  const getItemStatus = (item: any) => {
    const availableStock = stockStatus[item.title] || 0;
    const isExpired = item.expiryDate ? new Date(item.expiryDate) < new Date() : false;
    
    if (isExpired) return { type: 'expired', message: 'Produit expiré', color: 'red' };
    if (availableStock <= 0) return { type: 'outOfStock', message: 'Rupture de stock', color: 'red' };
    if (item.count > availableStock) return { type: 'limitedStock', message: `Seulement ${availableStock} disponible(s)`, color: 'orange' };
    if (availableStock <= 3) return { type: 'lowStock', message: `Plus que ${availableStock} en stock`, color: 'orange' };
    
    return { type: 'available', message: 'Disponible', color: 'green' };
  };

  if (!isOpen) return null;

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal-container">
        {/* Header */}
        <div className="payment-modal-header">
          <div className="header-content">
            <div className="header-left">
              <div className="payment-icon">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h1 className="modal-title">🔒 Paiement Sécurisé</h1>
                <p className="modal-subtitle">Stock mis à jour après paiement</p>
              </div>
            </div>
            
            <button className="close-button" onClick={onClose}>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="payment-modal-content">
          <div className="payment-layout">
            {/* Left: Payment Form */}
            <div className="payment-section">
              <Elements stripe={stripePromise}>
                <PaymentForm
                  cartItems={cartItems}
                  total={total}
                  user={user}
                  onPaymentSuccess={onPaymentSuccess}
                  onClose={onClose}
                  deliveryInfo={deliveryInfo}
                  setDeliveryInfo={setDeliveryInfo}
                  onStockError={onStockError}
                  onUpdateQuantity={handleQuantityUpdate}
                  onRemoveItem={handleItemRemove}
                  stockStatus={stockStatus}
                />
              </Elements>
            </div>

            {/* Right: Order Summary with Quantity Controls */}
            <div className="summary-section">
              <div className="summary-card">
                <h3 className="summary-title">
                  <Package className="h-5 w-5" />
                  Récapitulatif de commande
                </h3>

                <div className="summary-items">
                  {cartItems.map((item, index) => {
                    const status = getItemStatus(item);
                    const isAnimating = animatingItems.has(item.title);
                    const hasPromo = item.price_promo && item.price_promo < item.price;
                    const savings = hasPromo ? (item.price - item.price_promo) * item.count : 0;
                    
                    return (
                      <div 
                        key={index} 
                        className={`summary-item ${isAnimating ? 'animating' : ''} ${
                          status.type === 'expired' || status.type === 'outOfStock' 
                            ? 'item-error' 
                            : ''
                        }`}
                      >
                        {/* Badge promo */}
                        {hasPromo && (
                          <div className="item-promo-badge">
                            -{Math.round(((item.price - item.price_promo) / item.price) * 100)}%
                          </div>
                        )}

                        <div className="item-image">
                          <img 
                            src={item.images?.[0] || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=500&fit=crop'} 
                            alt={item.title} 
                          />
                          
                          {/* Indicateur de statut */}
                          <div className="item-status-indicator">
                            <div className={`status-dot ${status.color}`} />
                          </div>
                        </div>
                        
                        <div className="item-details">
                          <div className="item-header">
                            <h4 className="item-title">{item.title}</h4>
                            <button
                              className="item-remove-btn"
                              onClick={() => handleItemRemove(item.title)}
                              title="Supprimer l'article"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Prix et économies */}
                          <div className="item-pricing">
                            <div className="price-row">
                              <span className="current-price">
                                {formatPrice(item.price_promo || item.price)}
                              </span>
                              {hasPromo && (
                                <span className="original-price">
                                  {formatPrice(item.price)}
                                </span>
                              )}
                            </div>
                            {savings > 0 && (
                              <p className="savings-text">
                                Économie: {formatPrice(savings)}
                              </p>
                            )}
                          </div>

                          {/* Statut */}
                          <div className={`item-status ${status.color}`}>
                            <span className="status-message">{status.message}</span>
                          </div>

                          {/* Contrôles de quantité */}
                          <div className="quantity-controls">
                            <button
                              className="quantity-btn"
                              onClick={() => handleQuantityUpdate(item.title, item.count - 1)}
                              disabled={
                                status.type === 'expired' || 
                                status.type === 'outOfStock' ||
                                item.count <= 1
                              }
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            
                            <div className="quantity-display">
                              {item.count}
                            </div>
                            
                            <button
                              className="quantity-btn"
                              onClick={() => handleQuantityUpdate(item.title, item.count + 1)}
                              disabled={
                                status.type === 'expired' || 
                                status.type === 'outOfStock' ||
                                item.count >= (stockStatus[item.title] || 0)
                              }
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="item-total">
                            Total: {formatPrice((item.price_promo || item.price) * item.count)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="summary-totals">
                  <div className="total-row">
                    <span>Sous-total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <div className="total-row">
                    <span>Livraison</span>
                    <span className={total >= 100 ? 'free-shipping' : ''}>
                      {total >= 100 ? 'Gratuite' : formatPrice(4.99)}
                    </span>
                  </div>
                  <div className="total-row final">
                    <span>Total</span>
                    <span className="final-price">
                      {formatPrice(total + (total >= 100 ? 0 : 4.99))}
                    </span>
                  </div>
                </div>

                {/* Benefits */}
                <div className="order-benefits">
                  <div className="benefit-item">
                    <CheckCircle className="h-4 w-4" />
                    <span>Stock protégé jusqu'au paiement</span>
                  </div>
                  <div className="benefit-item">
                    <Shield className="h-4 w-4" />
                    <span>Garantie satisfait ou remboursé</span>
                  </div>
                  <div className="benefit-item">
                    <Truck className="h-4 w-4" />
                    <span>Retours gratuits sous 30 jours</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .payment-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.3s ease;
        }

        .payment-modal-container {
          width: 100%;
          max-width: 1200px;
          max-height: 100vh;
          background: white;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.09);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }



        .header-content {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 20px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .payment-icon {
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .modal-title {
          font-weight: 700;
          margin: 0 0 4px 0;
          font-family: 'Playfair Display', serif;
        }

        .modal-subtitle {
          opacity: 0.9;
          margin: 0;
          font-size: 14px;
        }

        .close-button {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .close-button:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
        }

        .payment-modal-content {
          flex: 1;
          overflow-y: auto;
          background: #f8ede9;
        }

        .payment-layout {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 24px;
          padding: 24px;
          min-height: 100%;
        }

        .payment-section {
          background: #f8ede9;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid #e2e8f0;
          height: fit-content;
        }

        .summary-section {
          height: fit-content;
        }

        .summary-card {
          background: rgb(251, 233, 226);
          border-radius: 16px;
          padding: 24px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .summary-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 20px 0;
          padding-bottom: 16px;
          border-bottom: 1px solid #e2e8f0;
          background: linear-gradient(135deg, #7c3aed, #ec4899);
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: bold;
        }

        .summary-items {
          margin-bottom: 20px;
          max-height: 500px;
          overflow-y: auto;
        }

        .summary-item {
          position: relative;
          display: flex;
          gap: 12px;
          padding: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          margin-bottom: 12px;
          background: linear-gradient(to right, #e63199 0%, #fec20b 100%);
          transition: all 0.3s ease;
        }

        .summary-item:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-1px);
        }

        .summary-item.animating {
          transform: scale(0.95);
          opacity: 0.7;
        }

        .summary-item.item-error {
          border-color: #fecaca;
          background: #fef2f2;
        }

        .item-promo-badge {
          position: absolute;
          top: -6px;
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

        .item-image {
          position: relative;
          width: 80px;
          height: 80px;
          border-radius: 8px;
          overflow: hidden;
          background: #f1f5f9;
          flex-shrink: 0;
        }

        .item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .item-image:hover img {
          transform: scale(1.05);
        }

        .item-status-indicator {
          position: absolute;
          top: 4px;
          right: 4px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: 1px solid white;
        }

        .status-dot.green {
          background: #10b981;
        }

        .status-dot.orange {
          background: #f59e0b;
        }

        .status-dot.red {
          background: #ef4444;
        }

        .item-details {
          flex: 1;
          min-width: 0;
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .item-title {
          font-size: 14px;
          font-weight: 600;
          color:rgb(255, 255, 255);
          margin: 0;
          line-height: 1.3;
          padding-right: 8px;
        }

        .item-remove-btn {
          background: none;
          border: none;
          color: #ef4444;
          cursor: pointer;
          padding: 2px;
          border-radius: 4px;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .item-remove-btn:hover {
          background: #fef2f2;
          transform: scale(1.1);
        }

        .item-pricing {
          margin-bottom: 8px;
        }

        .price-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 2px;
        }

        .current-price {
          font-size: 14px;
          font-weight: bold;
          color:rgb(255, 255, 255);
        }

        .original-price {
          font-size: 12px;
          color:rgb(210, 211, 214);
          text-decoration: line-through;
        }

        .savings-text {
          font-size: 10px;
          color:rgb(255, 255, 255);
          font-weight: 500;
          margin: 0;
        }

        .item-status {
          margin-bottom: 8px;
        }

        .status-message {
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 500;
        }

        .item-status.green .status-message {
          background: #d1fae5;
          color:rgb(71 146 42);
        }

        .item-status.orange .status-message {
          background: #fef3c7;
          color: #92400e;
        }

        .item-status.red .status-message {
          background: #fecaca;
          color: #991b1b;
        }

        .quantity-controls {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 8px;
        }

        .quantity-btn {
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

        .quantity-btn:hover:not(:disabled) {
          border-color: #7c3aed;
          background: #f3f4f6;
        }

        .quantity-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .quantity-display {
          width: 32px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color:rgb(255, 255, 255);
          font-size: 12px;
        }

        .item-total {
          font-size: 12px;
          font-weight: 600;
          color:rgb(255, 255, 255);
        }

        .summary-totals {
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
          margin-bottom: 20px;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .total-row.final {
          font-size: 18px;
          font-weight: 700;
          padding-top: 12px;
          border-top: 1px solid #e2e8f0;
          margin-top: 12px;
          background: no-repeat;
          margin-bottom: 0;
        }

        .final-price {
          background: linear-gradient(135deg, #7c3aed, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .free-shipping {
          color: #10b981;
          font-weight: 600;
        }

        .order-benefits {
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
        }

        .benefit-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 12px;
          color: #64748b;
        }

        .benefit-item:last-child {
          margin-bottom: 0;
        }

        /* Payment Form Styles */
        .payment-progress {
          margin-bottom: 32px;
        }

        .progress-steps {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }

        .progress-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .step-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .progress-step.active .step-circle {
          background: #7c3aed;
          color: white;
        }

        .progress-step.completed .step-circle {
          background: #10b981;
          color: white;
        }

        .step-label {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
        }

        .progress-step.active .step-label {
          color: #7c3aed;
        }

        .progress-line {
          width: 60px;
          height: 2px;
          background: #e2e8f0;
        }

        .cart-invalid-alert {
          background: #fef3cd;
          border: 1px solid #f59e0b;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .alert-content {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .step-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        .step-icon {
          width: 48px;
          height: 48px;
          background: #7c3aed;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .step-title {
          font-size: 20px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .step-description {
          color: #64748b;
          margin: 0;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
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
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          color: #374151;
          font-size: 14px;
        }

        .label-icon {
          width: 16px;
          height: 16px;
          color: #7c3aed;
        }

        .form-input, .form-select, .form-textarea {
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          color: #FFC107;
          transition: all 0.2s ease;
        }

        .form-input:focus, .form-select:focus, .form-textarea:focus {
          outline: none;
          border-color: #7c3aed;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
        }

        .form-input.error, .form-select.error {
          border-color: #ef4444;
        }

        .error-message {
          color: #ef4444;
          font-size: 12px;
        }

        .continue-button {
          background:rgb(227, 213, 252);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
          width: 100%;
        }

        .continue-button:hover {
          background:rgb(203, 198, 210);
        }

        .security-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f0f9ff;
          border: 1px solid #0ea5e9;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          font-size: 14px;
          color: #0c4a6e;
        }

        .stock-check-progress {
          background: #eff6ff;
          border: 1px solid #3b82f6;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .progress-content {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .card-input-section {
          margin-bottom: 24px;
        }

        .card-element-container {
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 16px;
          margin: 12px 0;
          background: white;
        }

        .card-brands {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }

        .card-brands img {
          height: 24px;
          opacity: 0.6;
        }

        .save-card-option {
          margin-bottom: 24px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          margin-bottom: 12px;
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
          background: #7c3aed;
          border-color: #7c3aed;
        }

        .checkbox-input:checked + .checkbox-custom::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: 12px;
          font-weight: bold;
        }

        .checkbox-text {
          font-size: 14px;
          color: #374151;
        }

        .save-card-benefits {
          display: flex;
          gap: 16px;
          margin-left: 32px;
        }

        .benefit-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #64748b;
        }

        .error-alert {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .error-content {
          color: #dc2626;
        }

        .error-details {
          margin-top: 8px;
        }

        .error-line {
          margin-bottom: 4px;
          font-size: 14px;
          line-height: 1.4;
        }

        .payment-actions {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }

        .back-button {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .back-button:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .back-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pay-button {
          background: #10b981;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
          flex: 1;
        }

        .pay-button:hover:not(:disabled) {
          background: #059669;
        }

        .pay-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .trust-indicators {
          display: flex;
          justify-content: center;
          gap: 24px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
        }

        .trust-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #64748b;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(50px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% { transform: translateY(0); }
          40%, 43% { transform: translateY(-6px); }
          70% { transform: translateY(-3px); }
          90% { transform: translateY(-1px); }
        }

        @media (max-width: 1024px) {
          .payment-layout {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .summary-section {
            order: -1;
          }
        }

        @media (max-width: 768px) {
          .payment-modal-overlay {
            padding: 0;
          }

          .payment-modal-container {
            max-height: 100vh;
            border-radius: 0;
          }

          .payment-modal-header {
            padding: 16px;
          }

          .payment-layout {
            padding: 16px;
          }

          .payment-section,
          .summary-card {
            padding: 16px;
          }
          
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default ModernPaymentModal;