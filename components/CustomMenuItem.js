'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FiPower } from 'react-icons/fi';
import Link from 'next/link'; // Assurez-vous qu'il n'y ait qu'un seul import de Link
import {
  Box,
  chakra, // Utilisez correctement chakra ici
  Flex,
  IconButton,
  useDisclosure,
  Button,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  VStack,
  Collapse,
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { useAuth } from '@/contexts/AuthContext';
import ProgressBar from '@/components/ProgressBar';
import Image from 'next/image'; // Importez correctement le composant Image de Next.js
import IllustrationCarousel from "@/components/IllustrationCarousel";
import '../app/globals.css'; // Import de votre fichier global de style

const CustomMenuItem = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { user, logout } = useAuth();
  const { isOpen: isLogoutAlertOpen, onOpen: onLogoutAlertOpen, onClose: onLogoutAlertClose } = useDisclosure();
  const cancelRef = useRef();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      onLogoutAlertClose();
      window.location.href = '/login';
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <Box bg="#ff80b1" width="100%">
      <ProgressBar />
      <Flex
        alignItems="center"
        justifyContent="space-between"
        wrap="wrap"
        paddingLeft="0px"
        paddingRight="0px"
        padding= "14px"
        color="#635e6e"
        fontSize="large"
        fontWeight="900"
        width="95%"
        borderRadius={'10'}
        margin="auto"
      >
         <Box marginLeft="0" display="flex" alignItems="center">
         
          <Link href="/" passHref>
          <IllustrationCarousel />
          </Link>
        </Box>

        <Box zIndex="1000" flex="1" display={{ base: 'none', md: 'block' }}></Box>

        <Box zIndex="1000"  display={{ base: 'none', md: 'flex' }} fontWeight={'700'} alignItems="center" justifyContent="flex-end" marginRight="0">
          <Flex direction="row" align="center">
            {user ? (
              <Flex alignItems="center" gap="1rem">
                <Box fontSize="sm" color="rgb(65 202 1)" fontWeight="500">
                  {user.displayName}
                  
                </Box>
                <Box fontSize="sm" color="rgb(81, 255, 0)" fontWeight="500">
                  <Avatar
                      name={user?.displayName}
                      src={user?.photoURL}
                      size="sm"
                      bg="rgb(251 0 255)"
                      color="white"
                  />
                </Box>

                <Link href="/account" passHref legacyBehavior>
                  <Button
                   as="a" 
                   fontFamily={'allroundgothic'}
                   fontSize="sm"  
                   background={"rgb(121 85 72 / 95%)"}
                   color="white"
                   size="sm"
                   boxShadow={"10px 5px #0000005c"}>
                   Mon compte
                  </Button>
                </Link>

                <Button
                  onClick={onLogoutAlertOpen}
                  size="sm"
                  colorScheme="red"
                  leftIcon={<FiPower />}
                  variant="solid"
                  boxShadow={"10px 5px #0000005c"}
                >
                  Déco...
                </Button>
              </Flex>
            ) : (
              <Link href="/login" passHref legacyBehavior>
                <chakra.a
                fontFamily={'allroundgothic'}
                  backgroundColor="#795548"
                  borderRadius="10px"
                  color="white"
                  zIndex="999"
                  padding="0.5rem"
                  marginLeft="1.5rem"
                  _hover={{
                    borderRadius: 'md',
                    color: 'white',
                    background: '#635e6e',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  Connexion
                </chakra.a>
              </Link>
            )}
          </Flex>
        </Box>

        <Box zIndex="1000"  display={{ base: 'block', md: 'none' }} marginRight="1rem">
          <IconButton
            icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
            variant="outline"
            aria-label="Menu"
            onClick={toggleMenu}
          />
        </Box>
      </Flex>

      <Collapse in={isOpen} animateOpacity>
        <Box
          pb={4}
          display={{ md: 'none' }}
          pl="6%"
          width="90%"
          borderRadius="20px"
          margin="auto"
        >
          <VStack align="start" spacing={4} ml="2rem">
            <Flex align="center" gap="0.5rem">
              <Avatar name={user?.name} src={user?.photoURL} size="sm" bg="blue.500" color="#206361" />
              <Box fontSize="sm" color="rgb(65 202 1)" fontWeight="500">
                {user?.displayName}
              </Box>
            </Flex>

            <Link href="/account" passHref legacyBehavior>
              <chakra.a colorScheme="gray.600" fontSize="sm" fontWeight="bold" color="gray.600" _hover={{ textDecoration: 'underline' }}>
                Mon Compte
              </chakra.a>
            </Link>

              <Button
                onClick={onLogoutAlertOpen}
                size="sm"
                colorScheme="red"
                leftIcon={<FiPower />}
                variant="solid"
              >
                Déco...
              </Button>
          </VStack>

        </Box>
      </Collapse>

      <AlertDialog isOpen={isLogoutAlertOpen} leastDestructiveRef={cancelRef} onClose={onLogoutAlertClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Confirmation de déconnexion
            </AlertDialogHeader>
            <AlertDialogBody>Déconnecter ?</AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onLogoutAlertClose}>
                Annuler
              </Button>
              <Button colorScheme="blue" onClick={handleLogout} ml={3}>
                Se déconnecter
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default CustomMenuItem;
