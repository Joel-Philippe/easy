import React, { useState } from 'react';
import { Box, FormControl, FormLabel, Input, Button, useToast } from '@chakra-ui/react';
import { useAuth } from '@/contexts/AuthContext';

const DisplayNameForm = () => {
  const { user, updateDisplayName } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const toast = useToast();

  const handleDisplayNameUpdate = async () => {
    await updateDisplayName(displayName);
    toast({
      title: 'Pseudo mis à jour',
      description: 'Votre pseudo a été mis à jour avec succès.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box>
      <FormControl id="displayName" mb={4}>
        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </FormControl>
      <Button onClick={handleDisplayNameUpdate} background={'#e15600'} colorScheme="teal" width="full">
        Mettre à jour le pseudo
      </Button>
    </Box>
  );
};

export default DisplayNameForm;
