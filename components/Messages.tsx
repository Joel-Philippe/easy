import React, { useEffect, useState } from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';
import { db } from '@/components/firebaseConfig';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';

const Messages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const fetchMessages = async () => {
      const q = query(collection(db, 'messages'), where('receiverEmail', '==', user.email));
      const querySnapshot = await getDocs(q);
      setMessages(querySnapshot.docs.map(doc => doc.data()));
    };
    fetchMessages();
  }, [user]);

  return (
    <Box>
      <VStack color={'#5c2222'} spacing={4} align="stretch">
        {messages.length > 0 ? messages.map((message, index) => (
          <Box key={index} borderWidth="1px" borderRadius="lg" overflow="hidden" p={4}>
            <Text><b>De:</b> {message.senderDisplayName}</Text>
            <Text><b>Message:</b> {message.message}</Text>
            <Text><b>Date:</b> {new Date(message.timestamp).toLocaleString()}</Text>
          </Box>
        )) : (
          <Text>Aucun message trouvé.</Text>
        )}
      </VStack>
    </Box>
  );
};

export default Messages;
