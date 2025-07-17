// TotalContext.tsx
import React from 'react';

export const TotalContext = React.createContext({
  total: 0,
  setTotal: (value: number) => {},
});