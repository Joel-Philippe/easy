import React, { createContext, useContext, useState } from 'react';

// Création du contexte
export const GlobalCartContext = createContext(null);

// Fournisseur du contexte
export const GlobalCartProvider = ({ children }) => {
  const [globalCart, setGlobalCart] = useState({});

  return (
    <GlobalCartContext.Provider value={{ globalCart, setGlobalCart }}>
      {children}
    </GlobalCartContext.Provider>
  );
};

// ✅ Hook personnalisé pour utiliser le contexte
export const useGlobalCart = () => {
  const context = useContext(GlobalCartContext);
  if (!context) {
    throw new Error("useGlobalCart must be used within a GlobalCartProvider");
  }
  return context;
};
