import { Box, Text, Avatar } from '@chakra-ui/react';
import { useAuth } from '@/contexts/AuthContext';

const MenuProfil = () => {
  const { user } = useAuth();

  return (
    <Box p={4} color="white" borderRadius="md">
      {user ? (
        <Box display="flex" flexDirection="column" alignItems="center">
          <Avatar src={user.photoURL} name={user.displayName} size="xl" mb={2} />
          <Text color="rgb(191 0 255)" fontSize="lg" fontWeight="bold">{user.displayName}</Text>
        </Box>
      ) : (
        <Text>Non connecté</Text>
      )}
    </Box>
  );
};

export default MenuProfil;
