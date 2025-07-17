import React, { useReducer, createContext } from 'react';

interface Product {
  title: string;
  price: string;
}

interface State {
  selectedProduct: { [key: string]: Product };
  quantity: { [key: string]: number };
}

interface CartContextProps {
  state: State;
  dispatch: React.Dispatch<Action>;
}

type Action =
  | { type: 'SET_SELECTED_PRODUCT'; payload: { [key: string]: Product } }
  | { type: 'SET_QUANTITY'; payload: { [key: string]: number } };

const initialState: State = {
  selectedProduct: {},
  quantity: {},
};

export const CartContext = createContext<CartContextProps>({ state: initialState, dispatch: () => undefined });

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_SELECTED_PRODUCT':
      return { ...state, selectedProduct: action.payload };
    case 'SET_QUANTITY':
      return { ...state, quantity: action.payload };
    default:
      return state;
  }
};

export const CartProvider: React.FC = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
};