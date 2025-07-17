"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Box,
  Flex,
  FormControl,
  Input,
  Button,
  Alert,
  AlertIcon,
  Heading,
  Checkbox,
  Link as ChakraLink
} from '@chakra-ui/react';
import CustomMenuItem from '@/components/CustomMenuItem';
import NextLink from 'next/link';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(username, password, rememberMe);
      if (username === 'philippejoel.wolff@gmail.com') {
        router.push('/admin'); // Redirige vers la page d'administration
      } else {
        router.push('/consumers'); // Redirige vers la page des consommateurs
      }
    } catch (error) {
      setError('Identifiant ou mot de passe erroné');
    }
  };

  return (
    <>
      <CustomMenuItem />
      <Flex
        minHeight="100vh" 
        align="center" 
        justify="center" 
        bg="#f6eee2" 
        px={4}
        backgroundSize="cover" // Pour que l'image couvre tout l'écran
        backgroundPosition="center" // Centrer l'image
        backgroundRepeat="no-repeat" // Pas de répétition
        >
        <Box width={{ base: 'full', md: 'md' }} p={8} borderWidth={0} borderRadius={8} bg="#f6eee2" opacity={0.9}>
          <Heading as="h1" size="lg" mb={6} textAlign="center" color={'black'}>
            Connexion
          </Heading>
          <form onSubmit={handleLogin}>
            <FormControl id="username" isRequired mb={4}>
              <Input
                type="text"
                placeholder="Identifiant"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
            <FormControl id="password" isRequired mb={4}>
              <Input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            <FormControl display="flex" alignItems="center" mb={4} fontWeight="600">
              <Checkbox isChecked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}>
                Se souvenir de moi
              </Checkbox>
            </FormControl>
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
                Me connecter
              </Button>
          </form>
          <Flex fontSize={"13px"} justifyContent="space-between">
            <NextLink href="/signup" passHref legacyBehavior>
              <ChakraLink colorScheme="teal" variant="link">
                Créer un compte
              </ChakraLink>
            </NextLink>
            <NextLink href="/forgot-password" passHref legacyBehavior>
              <ChakraLink colorScheme="teal" variant="link">
                Mot de passe oublié ?
              </ChakraLink>
            </NextLink>
          </Flex>
        </Box>
      </Flex>
    </>
  );
}
