'use client';
import { ChakraProvider } from '@chakra-ui/react';
import { AuthProvider } from '@/contexts/AuthContext';
import { CheckboxProvider } from '@/contexts/CheckboxContext'; // Assurez-vous que le chemin est correct

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          <CheckboxProvider>
            <ChakraProvider>
              {children}
            </ChakraProvider>
          </CheckboxProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
