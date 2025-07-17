// components/Card.js

import React from 'react';
import { Box, Image, Text, Heading, Button } from '@chakra-ui/react';
import NextLink from 'next/link';

const Card = ({ card }) => {
  return (
    <Box borderWidth="1px" borderRadius="lg" overflow="hidden" bg="white" p={4}>
      <Image src={card.images[0]} alt={card.title} />
      <Box p={4}>
        <Heading as="h2" size="md" mb={2}>{card.title}</Heading>
        <Text>Prix: {card.price}€</Text>
        <Text>Prix promo: {card.price_promo}€</Text>
        <NextLink href={`/${card._id}`} passHref>
          <Button as="a" mt={2} colorScheme="teal">
            Voir plus
          </Button>
        </NextLink>
      </Box>
    </Box>
  );
};

export default Card;
