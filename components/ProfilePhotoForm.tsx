import React, { useState } from 'react';
import { Box, FormControl, FormLabel, Input, Button, useToast } from '@chakra-ui/react';
import { useAuth } from '@/contexts/AuthContext';

const ProfilePhotoForm = () => {
  const { updateProfilePhoto } = useAuth();
  const [photoFile, setPhotoFile] = useState(null);
  const toast = useToast();

  const handleProfilePhotoUpdate = async () => {
    if (photoFile) {
      await updateProfilePhoto(photoFile);
      toast({
        title: 'Photo de profil mise à jour',
        description: 'Votre photo de profil a été mise à jour avec succès.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <FormControl id="photo" mb={4}>
        <Input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} />
      </FormControl>
      <Button onClick={handleProfilePhotoUpdate}background={'#e15600'} colorScheme="teal" width="full">
        Mettre à jour la photo de profil
      </Button>
    </Box>
  );
};

export default ProfilePhotoForm;
