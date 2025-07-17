// CheckboxContext.js
import React, { createContext, useContext, useState } from 'react';

const CheckboxContext = createContext();

export const CheckboxProvider = ({ children }) => {
  const [selectedItems, setSelectedItems] = useState({
    purchases: [],
    messages: [],
  });

  const toggleItemSelection = (item, category) => {
    setSelectedItems((prevState) => {
      const updatedCategory = prevState[category].some(
        (i) => i.title === item.title && i.deliveryDate === item.deliveryDate
      )
        ? prevState[category].filter(
            (i) => i.title !== item.title || i.deliveryDate !== item.deliveryDate
          )
        : [...prevState[category], item];

      return {
        ...prevState,
        [category]: updatedCategory,
      };
    });
  };

  return (
    <CheckboxContext.Provider value={{ selectedItems, toggleItemSelection }}>
      {children}
    </CheckboxContext.Provider>
  );
};

export const useCheckbox = () => useContext(CheckboxContext);
