'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Minus, Trash2, ShoppingBag, Heart, AlertCircle, 
  CheckCircle, Clock, Package, Star, Gift, Sparkles, CreditCard,
  Truck, Shield, ArrowRight
} from 'lucide-react';
import Image from 'next/image';
import { loadStripe } from '@stripe/stripe-js';
import DeliveryForm from './DeliveryForm';
import { useAuth } from '@/contexts/AuthContext';
import ModernPaymentModal from './ModernPaymentModal';
import '../app/GlobalCart.css';
import '../app/globals.css';
interface CartItem {
  _id: string;
  title: string;
  images: string[];
  price: number;
  price_promo?: number;
  count: number;
  deliveryTime?: string;
  expiryDate?: string;
  stock?: number;
  stock_reduc?: number;
}

interface ModernGlobalPriceProps {
  isOpen: boolean;
  onClose: () => void;
  globalCart: Record<string, CartItem>;
  setGlobalCart: (cart: Record<string, CartItem>) => void;
  stockStatus: Record<string, number>;
  user: any;
  onCheckout: () => void;
  isProcessingPayment: boolean;
  badItems?: string[];
}

export const ModernGlobalPrice = ({
  isOpen,
  onClose,
  globalCart,
  setGlobalCart,
  stockStatus,
  user,
  onCheckout,
  isProcessingPayment,
  badItems = []
}: ModernGlobalPriceProps) => {
  const [animatingItems, setAnimatingItems] = useState<Set<string>>(new Set());
  const [isClosing, setIsClosing] = useState(false);
  const [previouslyBoughtTitles, setPreviouslyBoughtTitles] = useState<string[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [stockVerificationErrors, setStockVerificationErrors] = useState<{
    unavailableItems: string[];
    insufficientStockItems: { title: string; requested: number; available: number }[];
  }>({ unavailableItems: [], insufficientStockItems: [] });

  const cartItems = Object.entries(globalCart);
  const cartCount = Object.values(globalCart).reduce((sum, item) => sum + item.count, 0);
  const total = Object.values(globalCart).reduce(
    (sum, item) => sum + item.count * (item.price_promo || item.price),
    0
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const handleUpdateQuantity = (title: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(title);
      return;
    }

    const availableStock = stockStatus[title] || 0;
    if (newQuantity > availableStock) {
      toast.error(`Stock insuffisant. Seulement ${availableStock} disponible(s).`);
      return;
    }

    setAnimatingItems(prev => new Set([...prev, title]));
    
    const newCart = { ...globalCart };
    newCart[title].count = newQuantity;
    setGlobalCart(newCart);
    localStorage.setItem('globalCart', JSON.stringify(newCart));

    setTimeout(() => {
      setAnimatingItems(prev => {
        const next = new Set(prev);
        next.delete(title);
        return next;
      });
    }, 300);
  };

  const handleRemoveItem = (title: string) => {
    setAnimatingItems(prev => new Set([...prev, title]));
    
    setTimeout(() => {
      const newCart = { ...globalCart };
      delete newCart[title];
      setGlobalCart(newCart);
      localStorage.setItem('globalCart', JSON.stringify(newCart));
      
      toast.success('Article retiré du panier');
    }, 300);
  };

  const getItemStatus = (item: CartItem) => {
    const availableStock = stockStatus[item.title] || 0;
    const isExpired = item.expiryDate ? new Date(item.expiryDate) < new Date() : false;
    const isBadItem = badItems.includes(item.title);
    
    if (isExpired) return { type: 'expired', message: 'Produit expiré', color: 'red' };
    if (isBadItem || availableStock <= 0) return { type: 'outOfStock', message: 'Rupture de stock', color: 'red' };
    if (item.count > availableStock) return { type: 'limitedStock', message: `Seulement ${availableStock} disponible(s)`, color: 'orange' };
    if (availableStock <= 3) return { type: 'lowStock', message: `Plus que ${availableStock} en stock`, color: 'orange' };
    
    return { type: 'available', message: 'Disponible', color: 'green' };
  };

  const outOfStockItems = cartItems.filter(([title, item]) => {
    const status = getItemStatus(item);
    return status.type === 'expired' || status.type === 'outOfStock';
  });

  const canCheckout = outOfStockItems.length === 0 && cartItems.length > 0 && user;
  const freeShippingThreshold = 100;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - total);
  const progressPercentage = Math.min(100, (total / freeShippingThreshold) * 100);

  // 🔒 Fonction de checkout avec vérification de stock en temps réel
  const handleCheckout = () => {
    setStockVerificationErrors({ unavailableItems: [], insufficientStockItems: [] });
  
    // Ouvrir la modal de paiement moderne
    setShowPaymentModal(true);
  };

  // 🔒 Fonction appelée en cas d'erreur de stock depuis la modal de paiement
  const handleStockError = (errorDetails: any) => {
    console.log("🚨 Erreur de stock reçue:", errorDetails);
    
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
        
        toast.error(`Produits supprimés du panier : ${errorDetails.details.unavailableItems.join(', ')}`);
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
        
        toast.warning("Quantités ajustées selon le stock disponible");
      }
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setGlobalCart({});
    localStorage.setItem('globalCart', JSON.stringify({}));
    localStorage.setItem('cartInfo', JSON.stringify([]));
    
    toast.success("Paiement réussi ! Votre commande a été confirmée. Vous recevrez un email de confirmation.", {
      duration: 6000,
    });
    
    onClose();
  };

  // 🔒 Fonction pour nettoyer les erreurs de stock après correction
  const clearStockErrors = () => {
    setStockVerificationErrors({ unavailableItems: [], insufficientStockItems: [] });
  };

  // 🔒 Nettoyer les erreurs quand le panier change
  useEffect(() => {
    if (stockVerificationErrors.unavailableItems.length > 0 || stockVerificationErrors.insufficientStockItems.length > 0) {
      // Vérifier si les erreurs sont encore valides
      const stillUnavailable = stockVerificationErrors.unavailableItems.filter(title => globalCart[title]);
      const stillInsufficient = stockVerificationErrors.insufficientStockItems.filter(item => {
        const cartItem = globalCart[item.title];
        return cartItem && cartItem.count > item.available;
      });
      
      if (stillUnavailable.length === 0 && stillInsufficient.length === 0) {
        clearStockErrors();
      }
    }
  }, [globalCart, stockVerificationErrors]);

  // Calculer les articles avec des erreurs de stock
  const allBadItems = [
    ...stockVerificationErrors.unavailableItems,
    ...stockVerificationErrors.insufficientStockItems.map(item => item.title),
    ...badItems
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-all duration-300 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleClose}
      />

      {/* Cart Panel */}
      <div 
        className={`fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col transition-all duration-300 ${
          isClosing ? 'translate-x-full' : 'translate-x-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header avec gradient */}
        <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white p-6">
          <div className="absolute inset-0 bg-black/10" />
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                {cartCount > 0 && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
                    {cartCount}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold font-playfair">Mon Panier LUXE</h2>
                <p className="text-white/80 text-sm">
                  {cartCount} article{cartCount > 1 ? 's' : ''} • {formatPrice(total)}
                </p>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleClose}
              className="text-white hover:bg-white/20 rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Barre de progression livraison gratuite */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1">
                <Truck className="h-4 w-4" />
                Livraison gratuite à {formatPrice(freeShippingThreshold)}
              </span>
              {remainingForFreeShipping > 0 ? (
                <span>Plus que {formatPrice(remainingForFreeShipping)}</span>
              ) : (
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Livraison gratuite !
                </span>
              )}
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-500 relative overflow-hidden"
                style={{ width: `${progressPercentage}%` }}
              >
                <div className="absolute inset-0 bg-white/30 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-6">
                <ShoppingBag className="h-16 w-16 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2 font-playfair">Votre panier est vide</h3>
              <p className="text-gray-500 mb-6 max-w-sm">
                Découvrez notre collection exclusive de produits de luxe sélectionnés avec soin.
              </p>
              <Button className="btn-primary" onClick={handleClose}>
                <Sparkles className="h-4 w-4 mr-2" />
                Découvrir la collection
              </Button>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Messages d'alerte pour les erreurs de stock */}
              {(stockVerificationErrors.unavailableItems.length > 0 || stockVerificationErrors.insufficientStockItems.length > 0) && (
                <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-red-800">🔒 Problème de stock détecté</h4>
                      {stockVerificationErrors.unavailableItems.length > 0 && (
                        <p className="text-sm text-red-600 mt-1">
                          <strong>❌ Produits indisponibles :</strong> {stockVerificationErrors.unavailableItems.join(', ')}
                        </p>
                      )}
                      {stockVerificationErrors.insufficientStockItems.length > 0 && (
                        <div className="text-sm text-red-600 mt-1">
                          <strong>⚠️ Stock insuffisant :</strong>
                          <ul className="list-disc list-inside mt-1">
                            {stockVerificationErrors.insufficientStockItems.map((item, index) => (
                              <li key={index}>
                                {item.title}: {item.requested} demandé(s), {item.available} disponible(s)
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <p className="text-xs text-red-500 mt-2">
                        ✅ Les quantités ont été automatiquement ajustées.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages d'alerte existants */}
              {allBadItems.length > 0 && (
                <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-red-800">Articles épuisés</h4>
                      <p className="text-sm text-red-600 mt-1">
                        {allBadItems.join(', ')} - Veuillez les retirer pour continuer.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!user && (
                <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-blue-800">Connexion requise</h4>
                      <p className="text-sm text-blue-600 mt-1">
                        Connectez-vous pour bénéficier de tous nos avantages et finaliser votre commande.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Articles du panier */}
              <div className="space-y-4">
                {cartItems.map(([title, item]) => {
                  const status = getItemStatus(item);
                  const isAnimating = animatingItems.has(title);
                  const hasPromo = item.price_promo && item.price_promo < item.price;
                  const savings = hasPromo ? (item.price - item.price_promo) * item.count : 0;
                  
                  return (
                    <div
                      key={title}
                      className={`relative bg-white rounded-2xl border border-gray-200 p-4 transition-all duration-300 hover:shadow-lg ${
                        isAnimating ? 'scale-95 opacity-50' : 'scale-100 opacity-100'
                      } ${
                        status.type === 'expired' || status.type === 'outOfStock' 
                          ? 'border-red-200 bg-red-50' 
                          : 'hover:border-purple-200'
                      }`}
                    >
                      {/* Badge promo */}
                      {hasPromo && (
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                          -{Math.round(((item.price - item.price_promo) / item.price) * 100)}%
                        </div>
                      )}

                      <div className="flex gap-4">
                        {/* Image avec overlay */}
                        <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 group">
                          <Image
                            src={item.images?.[0] || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=500&fit=crop'}
                            alt={item.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          
                          {/* Overlay avec statut */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          
                          {/* Indicateur de statut */}
                          <div className="absolute top-2 right-2">
                            <div className={`w-3 h-3 rounded-full border-2 border-white ${
                              status.color === 'green' ? 'bg-green-500' :
                              status.color === 'orange' ? 'bg-orange-500' :
                              'bg-red-500'
                            }`} />
                          </div>
                        </div>

                        {/* Contenu */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-gray-900 line-clamp-2 pr-2">
                              {item.title}
                            </h3>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full flex-shrink-0"
                              onClick={() => handleRemoveItem(title)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Prix et économies */}
                          <div className="space-y-1 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-purple-600">
                                {formatPrice(item.price_promo || item.price)}
                              </span>
                              {hasPromo && (
                                <span className="text-sm text-gray-500 line-through">
                                  {formatPrice(item.price)}
                                </span>
                              )}
                            </div>
                            {savings > 0 && (
                              <p className="text-xs text-green-600 font-medium">
                                Vous économisez {formatPrice(savings)}
                              </p>
                            )}
                          </div>

                          {/* Statut et livraison */}
                          <div className="flex items-center gap-4 mb-3 text-xs">
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                              status.color === 'green' ? 'bg-green-100 text-green-700' :
                              status.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {status.type === 'available' && <CheckCircle className="h-3 w-3" />}
                              {(status.type === 'lowStock' || status.type === 'limitedStock') && <AlertCircle className="h-3 w-3" />}
                              {(status.type === 'outOfStock' || status.type === 'expired') && <AlertCircle className="h-3 w-3" />}
                              <span className="font-medium">{status.message}</span>
                            </div>
                            
                            {item.deliveryTime && (
                              <div className="flex items-center gap-1 text-gray-500">
                                <Clock className="h-3 w-3" />
                                <span>{item.deliveryTime}</span>
                              </div>
                            )}
                          </div>

                          {/* Contrôles de quantité */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-full border-gray-300 hover:border-purple-400 hover:bg-purple-50"
                                onClick={() => handleUpdateQuantity(title, item.count - 1)}
                                disabled={status.type === 'expired' || status.type === 'outOfStock'}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              
                              <div className="w-12 h-8 flex items-center justify-center font-semibold text-gray-900">
                                {item.count}
                              </div>
                              
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-full border-gray-300 hover:border-purple-400 hover:bg-purple-50"
                                onClick={() => handleUpdateQuantity(title, item.count + 1)}
                                disabled={
                                  status.type === 'expired' || 
                                  status.type === 'outOfStock' ||
                                  item.count >= (stockStatus[title] || 0)
                                }
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>

                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full"
                            >
                              <Heart className="h-4 w-4 mr-1" />
                              Favoris
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Suggestions */}
              <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 rounded-2xl p-6 border border-purple-100">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold text-gray-900">Vous pourriez aussi aimer</h4>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {[
                    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=100&h=100&fit=crop',
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
                    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=100&h=100&fit=crop'
                  ].map((src, i) => (
                    <div key={i} className="flex-shrink-0 w-16 h-16 bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                      <Image src={src} alt={`Suggestion ${i + 1}`} width={64} height={64} className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer avec résumé et actions */}
        {cartItems.length > 0 && (
          <div className="bg-white border-t border-gray-200 p-6 space-y-4">
            {/* Résumé détaillé */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Sous-total ({cartCount} article{cartCount > 1 ? 's' : ''})</span>
                <span>{formatPrice(total)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1">
                  <Truck className="h-4 w-4" />
                  Livraison
                </span>
                <span className={total >= freeShippingThreshold ? 'text-green-600 font-medium' : ''}>
                  {total >= freeShippingThreshold ? 'Gratuite' : formatPrice(4.99)}
                </span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">Total</span>
                <div className="text-right">
                  <div className="text-2xl font-bold gradient-text">
                    {formatPrice(total + (total >= freeShippingThreshold ? 0 : 4.99))}
                  </div>
                  {total >= freeShippingThreshold && (
                    <div className="text-xs text-green-600">Livraison gratuite incluse</div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions principales */}
            <div className="space-y-3">
              <Button
                onClick={handleCheckout}
                disabled={!canCheckout || isProcessingPayment || allBadItems.length > 0}
                className="w-full btn-primary text-lg py-6 rounded-xl"
                size="lg"
              >
                {isProcessingPayment ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Traitement en cours...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    🔒 Finaliser ma commande
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full rounded-xl border-gray-300 hover:border-purple-400 hover:bg-purple-50" 
                onClick={handleClose}
              >
                Continuer mes achats
              </Button>
            </div>

            {/* Garanties et confiance */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1">
                  <Shield className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-xs text-gray-600">Stock vérifié</div>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1">
                  <Truck className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-xs text-gray-600">Livraison rapide</div>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-1">
                  <Gift className="h-4 w-4 text-purple-600" />
                </div>
                <div className="text-xs text-gray-600">Retours gratuits</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de paiement moderne */}
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
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        stockStatus={stockStatus}
      />
    </>
  );
};
