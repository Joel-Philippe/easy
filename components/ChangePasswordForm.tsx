import React from 'react';
import { Box, Text, Button, useToast } from '@chakra-ui/react';
import { useAuth } from '@/contexts/AuthContext';

const ChangePasswordForm = () => {
  const { user, resetPassword } = useAuth();
  const toast = useToast();

  const handlePasswordReset = async () => {
    if (!user || !user.email) return;

    try {
      await resetPassword(user.email);
      toast({
        title: 'Email de réinitialisation envoyé.',
        description: `Un email a été envoyé à ${user.email} pour réinitialiser votre mot de passe.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast({
          title: 'Erreur',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Erreur inconnue',
          description: 'Une erreur est survenue lors de la réinitialisation du mot de passe.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  return (
    <Box>
      <Text mb={4}>
        Cliquez ci-dessous pour réinitialiser votre mot de passe. Un email sera envoyé à {user?.email}.
      </Text>
      <Button onClick={handlePasswordReset} background={'#e15600'} colorScheme="teal" width="full">
        Réinitialiser le mot de passe
      </Button>
    </Box>
  );
};

export default ChangePasswordForm;
