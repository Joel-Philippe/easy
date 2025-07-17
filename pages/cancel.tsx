import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Text, Button, VStack, Alert, AlertIcon, Spinner } from '@chakra-ui/react';
import Link from 'next/link';

export default function CancelPage() {
  const router = useRouter();
  const { session_id } = router.query;
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCancellation = async () => {
      if (!session_id) return;

      try {
        // Appeler l'API pour libérer le stock
        const response = await fetch('/api/release-stock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId: session_id }),
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la libération du stock');
        }

        console.log('✅ Stock libéré avec succès');
      } catch (err: any) {
        console.error('❌ Erreur:', err);
        setError(err.message);
      } finally {
        setIsProcessing(false);
      }
    };

    if (session_id) {
      handleCancellation();
    }
  }, [session_id]);

  if (isProcessing) {
    return (
      <Box 
        minH="100vh" 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
        bg="gray.50"
      >
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Traitement de l'annulation...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box 
      minH="100vh" 
      display="flex" 
      alignItems="center" 
      justifyContent="center"
      bg="gray.50"
      p={4}
    >
      <Box 
        maxW="md" 
        w="full" 
        bg="white" 
        p={8} 
        borderRadius="lg" 
        boxShadow="lg"
        textAlign="center"
      >
        <VStack spacing={6}>
          {error ? (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          ) : (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              Votre commande a été annulée
            </Alert>
          )}

          <VStack spacing={3}>
            <Text fontSize="xl" fontWeight="bold" color="gray.700">
              Paiement annulé
            </Text>
            <Text color="gray.600" textAlign="center">
              {error 
                ? "Une erreur s'est produite lors de l'annulation. Veuillez contacter le support si nécessaire."
                : "Votre paiement a été annulé et les produits ont été remis en stock. Vous pouvez continuer vos achats."
              }
            </Text>
          </VStack>

          <VStack spacing={3} w="full">
            <Link href="/" passHref>
              <Button colorScheme="blue" size="lg" w="full">
                Retourner à la boutique
              </Button>
            </Link>
            
            <Link href="/panier" passHref>
              <Button variant="outline" size="lg" w="full">
                Voir mon panier
              </Button>
            </Link>
          </VStack>
        </VStack>
      </Box>
    </Box>
  );
}