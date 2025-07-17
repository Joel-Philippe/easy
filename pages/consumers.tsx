"use client";

import React, { useEffect, useState } from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';
import CustomMenuItem from '@/components/CustomMenuItem';
import Confetti from 'react-confetti';

const ConsumersPage = () => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Afficher les confettis lorsque la page est chargée
    setShowConfetti(true);
    
    // Arrêter les confettis après 5 secondes
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <CustomMenuItem />
      <Box textAlign={"center"} p={8} bg="white" minHeight="100vh">
        {showConfetti && <Confetti />}
        <Heading textColor={"black"} as="h1" size="xl" mb={6}>
         
        </Heading>
      </Box>
    </>
  );
};

export default ConsumersPage;
