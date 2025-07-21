import React, { createContext, useContext, useState, ReactNode } from 'react';

// Définition du type de chaque item du panier
type CartItem = {
  count: number;
  name: string;
  price: number;
  stock?: number;
  stock_reduc?: number;
  id?: string;
};

// Type du contexte
type GlobalCartContextType = {
  globalCart: Record<string, CartItem>;
  setGlobalCart: React.Dispatch<React.SetStateAction<Record<string, CartItem>>>;
};

// Création du contexte avec un type par défaut undefined
export const GlobalCartContext = createContext<GlobalCartContextType | undefined>(undefined);

// Fournisseur du contexte avec typage des props
export const GlobalCartProvider = ({ children }: { children: ReactNode }) => {
  const [globalCart, setGlobalCart] = useState<Record<string, CartItem>>({});

  return (
    <GlobalCartContext.Provider value={{ globalCart, setGlobalCart }}>
      {children}
    </GlobalCartContext.Provider>
  );
};

// Hook personnalisé
export const useGlobalCart = (): GlobalCartContextType => {
  const context = useContext(GlobalCartContext);
  if (!context) {
    throw new Error('useGlobalCart must be used within a GlobalCartProvider');
  }
  return context;
};
