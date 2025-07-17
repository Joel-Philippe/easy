
import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { AuthProvider } from '@/contexts/AuthContext';
import { GlobalCartProvider } from '@/components/GlobalCartContext';
import theme from '../theme';
import '../app/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <GlobalCartProvider>
          <Component {...pageProps} />
        </GlobalCartProvider>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default MyApp;
