// pages/success.tsx
import { Box, Heading, Text, Button, Image, VStack } from "@chakra-ui/react";
import Link from "next/link";
import { CheckCircleIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";

// Motion wrapper juste pour le titre
const MotionHeading = motion(Heading);

const SuccessPage = () => {
  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-br, #fefcea, #f1daff)"
      display="flex"
      justifyContent="center"
      alignItems="center"
      p={6}
    >
      <Box
        bg="white"
        p={8}
        borderRadius="2xl"
        boxShadow="xl"
        maxW="500px"
        textAlign="center"
      >
        <CheckCircleIcon boxSize={12} color="green.400" mb={4} />

        {/* 🎯 Animation uniquement sur le titre */}
        <MotionHeading
          size="lg"
          mb={4}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          Merci pour votre achat ! 🎉
        </MotionHeading>

        <Text fontSize="md" color="gray.600">
          Votre commande a bien été enregistrée. Un email de confirmation vous a été envoyé.
        </Text>

        <VStack spacing={4} mt={2}>
          <Link href="/">
            <Button variant="outline" width="100%">
              Retour à l'accueil
            </Button>
          </Link>
        </VStack>
      </Box>
    </Box>
  );
};

export default SuccessPage;
