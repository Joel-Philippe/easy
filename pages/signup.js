"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Box,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Button,
  Alert,
  AlertIcon,
  Heading,
  Link as ChakraLink,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  Text,
} from '@chakra-ui/react';
import CustomMenuItem from '@/components/CustomMenuItem';
import NextLink from 'next/link';
import Confetti from 'react-confetti';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();
  const { signup } = useAuth();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      await signup(email, password, displayName, photoFile);
      setLoading(false);
      setShowForm(false);
      onOpen();
      setTimeout(() => {
        onClose();
        router.push('/consumers');
      }, 3000);
    } catch (error) {
      setLoading(false);
      if (error.code === 'auth/email-already-in-use') {
        setError(`L'adresse email ${email} est déjà utilisée pour un autre compte.`);
      } else if (error.code === 'auth/invalid-email') {
        setError("L'adresse email n'est pas valide.");
      } else if (error.code === 'auth/weak-password') {
        setError("Le mot de passe est trop faible.");
      } else {
        setError('Erreur lors de la création du compte. Veuillez réessayer.');
      }
    }
  };

  return (
    <>
      <CustomMenuItem />
      {loading ? (
        <Flex minHeight="50vh" align="center" justify="center" bg="#f6eee2" px={4}>
          <Text>Bienvenue !</Text>
          <Text>Votre compte a été créé avec succès.</Text>
          <Confetti />
        </Flex>
      ) : showForm ? (
        <Flex minHeight="50vh" align="center" justify="center" bg="#f6eee2" px={4}>
          <Box width={{ base: 'full', md: 'md' }} p={8} borderWidth={0} borderRadius={8} bg="#f6eee2">
            <Heading as="h1" size="lg" mb={6} textAlign="center" color="black">
              Inscription
            </Heading>
            <form onSubmit={handleSignup}>
              <FormControl id="email" isRequired mb={4}>
                <FormLabel>Email</FormLabel>
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
              <FormControl id="password" isRequired mb={4}>
                <FormLabel>Mot de passe</FormLabel>
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
              <FormControl id="confirm-password" isRequired mb={4}>
                <FormLabel>Confirmer le mot de passe</FormLabel>
                <Input
                  type="password"
                  placeholder="Confirmer le mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
              <FormControl id="display-name" mb={4}>
                <FormLabel>Pseudo</FormLabel>
                <Input
                  type="text"
                  placeholder="Pseudo"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
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
              <FormControl id="profile-photo" mb={4}>
                <FormLabel>Photo de profil</FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files[0])}
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
              {error && (
                <Alert status="error" mb={4}>
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
                M'inscrire
              </Button>
            </form>
            <Flex justifyContent="space-between">
              <NextLink href="/login" passHref legacyBehavior>
                <ChakraLink colorScheme="teal" variant="link">
                  Se connecter
                </ChakraLink>
              </NextLink>
            </Flex>
          </Box>
        </Flex>
      ) : (
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Bienvenue !</ModalHeader>
            <ModalBody>
              <Text>Votre compte a été créé avec succès.</Text>
              <Confetti />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}
