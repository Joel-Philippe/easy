// components/DeliveryForm.tsx
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

interface DeliveryFormProps {
  onSubmit: (data: any) => void;
  selectedItems: Array<{
    title: string;
    count: number;
    price: number | string;
    price_promo?: number | string;
    deliveryTime?: string;
  }>;
  requestId?: string;
}

const DeliveryForm: React.FC<DeliveryFormProps> = ({ onSubmit, selectedItems, requestId }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    postalCode: '',
    contactNumber: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, requestId }); // Inclure requestId si nécessaire
  };

  return (
    <form onSubmit={handleSubmit}>
      <HStack spacing={4}>
        <FormControl id="firstName" isRequired>
          <FormLabel>Prénom</FormLabel>
          <Input name="firstName" value={formData.firstName} onChange={handleChange} />
        </FormControl>
        <FormControl id="lastName" isRequired>
          <FormLabel>Nom</FormLabel>
          <Input name="lastName" value={formData.lastName} onChange={handleChange} />
        </FormControl>
      </HStack>
      <FormControl id="address" isRequired mt={4}>
        <FormLabel>Adresse</FormLabel>
        <Input name="address" value={formData.address} onChange={handleChange} />
      </FormControl>
      <HStack spacing={4} mt={4}>
        <FormControl id="postalCode" isRequired>
          <FormLabel>Code postal</FormLabel>
          <Input name="postalCode" value={formData.postalCode} onChange={handleChange} />
        </FormControl>
        <FormControl id="contactNumber" isRequired>
          <FormLabel>Contact</FormLabel>
          <Input name="contactNumber" value={formData.contactNumber} onChange={handleChange} />
        </FormControl>
      </HStack>

      <Accordion allowToggle mt={4}>
        <AccordionItem>
          <AccordionButton>
            <Box flex="1" textAlign="left">Liste de commande</Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <Box as="ul" mb={2}>
              {selectedItems.map((product, index) => (
                <Box as="li" key={index} mb={2}>
                  <Text fontWeight="bold">{product.title}</Text>
                  {product.count && <Text>Quantité : {product.count}</Text>}
                  <Text>Prix : {product.price}€</Text>
                  {product.price_promo && (
                    <Text>
                      Prix Promo :{' '}
                      <span style={{ color: 'green' }}>{product.price_promo}€</span>
                      <span style={{ color: 'red', textDecoration: 'line-through', marginLeft: '10px' }}>
                        {product.price}€
                      </span>
                    </Text>
                  )}
                  {product.deliveryTime && <Text>Temps de livraison : {product.deliveryTime || 'Non défini'}</Text>}
                </Box>
              ))}
            </Box>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>

      <Button mt={4} colorScheme="blue" type="submit" width="full">
        Valider
      </Button>
    </form>
  );
};

export default DeliveryForm;
