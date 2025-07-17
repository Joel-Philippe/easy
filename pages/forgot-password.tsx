"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Box, Flex, FormControl, Input, Button, Alert, AlertIcon, Heading, Link as ChakraLink } from '@chakra-ui/react';
import CustomMenuItem from '@/components/CustomMenuItem';
import NextLink from 'next/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const { resetPassword } = useAuth();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await resetPassword(email);
      setMessage(`Un email de réinitialisation a été envoyé à ${email}`);
      setError(null);
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du mot de passe', error);
      setError('Erreur lors de la réinitialisation du mot de passe');
      setMessage(null);
    }
  };

  return (
    <>
      <CustomMenuItem />
      <Flex minHeight="50vh" top="0" align="center" justify="center" bg="white" px={4}>
        <Box width={{ base: 'full', md: 'md' }} p={8} borderWidth={0} borderRadius={8} bg="white">
          <Heading as="h1" size="lg" mb={6} textAlign="center" color={'black'}>
            Réinitialiser le mot de passe
          </Heading>
          <form onSubmit={handleResetPassword}>
            <FormControl id="email" isRequired mb={6}>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{
                  '::placeholder': {
                    fontSize: '16px',
                    fontStyle: 'italic',
                    fontWeight: '200',
                    lineHeight: '19.36px',
                    textAlign: 'left',
                    color: 'black'
                  },
                  '&:focus': {
                    borderColor: 'bisque',
                    boxShadow: '0 0 0 1px bisque',
                  },
                }}
              />
            </FormControl>
            {message && (
              <Alert status="success" mb={10}>
                <AlertIcon />
                {message}
              </Alert>
            )}
            {error && (
              <Alert status="error" mb={10}>
                <AlertIcon />
                {error}
              </Alert>
            )}
            <Button 
              type="submit" 
              color="black" 
              bg="white" 
              colorScheme="teal" 
              width="full" 
              mb={10}
              _hover={{ color:'white', bg: 'black' }}
            >
              Réinitialiser
            </Button>

          </form>
          {message && (
            <NextLink href="/login" passHref legacyBehavior>
              <ChakraLink colorScheme="teal" variant="link" display="block" textAlign="center" mt={4}>
                Retour à la connexion
              </ChakraLink>
            </NextLink>
          )}
              <Flex justifyContent="space-between">
            <NextLink href="/login" passHref legacyBehavior>
              <ChakraLink colorScheme="teal" variant="link">
                Se connecter
              </ChakraLink>
            </NextLink>
          </Flex>
        </Box>
      </Flex>
    </>
  );
}
