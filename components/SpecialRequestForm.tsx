import React, { useState } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Button,
  HStack,
  Text,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';

const SpecialRequestForm = ({ onSubmit, selectedItems, requestId }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    postalCode: '',
    contactNumber: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, requestId });  // Inclure requestId lors de la soumission
  };

  return (
    <form onSubmit={handleSubmit}>
      <HStack spacing={4}>
        <FormControl id="firstName" isRequired>
          <FormLabel>Prénom</FormLabel>
          <Input
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
          />
        </FormControl>
        <FormControl id="lastName" isRequired>
          <FormLabel>Nom</FormLabel>
          <Input
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
          />
        </FormControl>
      </HStack>
      <FormControl id="address" isRequired mt={4}>
        <FormLabel>Adresse</FormLabel>
        <Input
          name="address"
          value={formData.address}
          onChange={handleChange}
        />
      </FormControl>
      <HStack spacing={4} mt={4}>
        <FormControl id="postalCode" isRequired>
          <FormLabel>Code postal</FormLabel>
          <Input
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
          />
        </FormControl>
        <FormControl id="contactNumber" isRequired>
          <FormLabel>Contact</FormLabel>
          <Input
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleChange}
          />
        </FormControl>
      </HStack>

      <Accordion allowToggle mt={4}>
        <AccordionItem>
          <AccordionButton>
            <Box flex="1" textAlign="left">
              Détails de la demande spéciale
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <Box as="ul" mb={2}>
              {selectedItems.map((product, index) => (
                <Box as="li" key={index} mb={2}>
                  <Text fontWeight="bold">{product.title}</Text>
                  {product.count && (
                    <Text>Quantité : {product.count}</Text>
                  )}
                  <Text>Prix : {product.price}€</Text>
                </Box>
              ))}
            </Box>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>

      <Button mt={4} colorScheme="blue" type="submit" width="full">
        Valider la demande spéciale
      </Button>
    </form>
  );
};

export default SpecialRequestForm;
