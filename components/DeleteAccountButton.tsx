import React, { useState, useRef } from 'react';
import {
  Button, useToast, AlertDialog, AlertDialogBody, AlertDialogFooter,
  AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, Input, FormControl, FormLabel
} from '@chakra-ui/react';
import { useAuth } from '@/contexts/AuthContext';

const DeleteAccountButton = () => {
  const { deleteUserAccount, reauthenticateUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null); // ✅ Typage correct pour le ref du bouton
  const toast = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await reauthenticateUser(password);
      await deleteUserAccount();
      toast({
        title: 'Compte supprimé.',
        description: "Votre compte a été supprimé avec succès.",
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error: unknown) {
      const message = error instanceof Error
        ? error.message
        : "La suppression du compte a échoué.";
      toast({
        title: 'Erreur',
        description: message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
      setPassword('');
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        Supprimer compte
      </Button>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef} // ✅ Accepte RefObject<HTMLButtonElement>
        onClose={() => setIsOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Supprimer le compte
            </AlertDialogHeader>

            <AlertDialogBody>
              <FormControl>
                <FormLabel>Mot de passe</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Confirmez votre mot de passe"
                />
              </FormControl>
              <br />
              Êtes-vous sûr ? Cette action est irréversible et supprimera toutes vos données.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsOpen(false)}>
                Annuler
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDelete}
                ml={3}
                isLoading={isDeleting}
                isDisabled={!password}
              >
                Supprimer
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default DeleteAccountButton;
