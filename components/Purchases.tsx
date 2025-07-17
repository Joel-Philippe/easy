import React, { useEffect, useState } from 'react';
import { Box, Text, Flex, Spinner, Image } from '@chakra-ui/react';
import { db } from '@/components/firebaseConfig';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';

const Purchases = () => {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchPurchases = async () => {
      try {
        const q = query(collection(db, 'orders'), where('customer_email', '==', user.email));
        const querySnapshot = await getDocs(q);
        const fetchedOrders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPurchases(fetchedOrders);
      } catch (error) {
        console.error("Erreur de récupération des achats :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, [user]);

  if (loading) return <Spinner size="xl" color="purple.500" />;

  return (
    <Box p={2}>
      <Flex wrap="wrap" justifyContent="center" gap={4}>
        {purchases.length > 0 ? purchases.map((purchase, index) => {
          const total = purchase.items?.reduce((sum, item) => {
            const price = parseFloat(item.price_promo || item.price || 0);
            return sum + item.count * price;
          }, 0).toFixed(2);

          return (
            <Box
              key={index}
              borderWidth="1px"
              borderRadius="lg"
              overflow="hidden"
              p={4}
              width="350px"
              bg="#f6eee2"
            >
              <Text fontWeight="bold" mb={2}>
                🗓️ Date d'achat :{" "}
                {purchase.createdAt?.seconds
                  ? new Date(purchase.createdAt.seconds * 1000).toLocaleString()
                  : "Non disponible"}
              </Text>

              <Text color={'#43271d'} fontWeight="bold" mt={2}>🛍️ Détails de la commande :</Text>
              {purchase.items?.map((product, idx) => {
                const price = parseFloat(product.price || 0);
                const promo = product.price_promo ? parseFloat(product.price_promo) : null;

                return (
                  <Box key={idx} mt={1} borderTop="1px solid #eee" >
                    {/* Image produit */}
                    {product.images && Array.isArray(product.images) && product.images.length > 0 && (
                      <Box
                        width="100px"
                        height="100px"
                        borderRadius="md"
                        overflow="hidden"
                        bg="#f4f4f4"
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                      >
                        <Image
                          src={product.images[0]}
                          alt={product.title}
                          width="100%"
                          height="100%"
                          objectFit="contain"
                        />
                      </Box>

                    )}

                    <Text><b>{product.title}</b></Text>
                    <Text>
                      Quantité : {product.count} × {price.toFixed(2)}€
                      {promo !== null && (
                        <span style={{ color: "green", marginLeft: "8px" }}>
                          Promo: {promo.toFixed(2)}€
                        </span>
                      )}
                    </Text>
                  </Box>
                );
              })}

              <Text fontWeight="bold" mt={1}>💳 Total payé : {total}€</Text>

              {purchase.deliveryInfo && (
                <Text fontSize="sm" mt={2}>
                  📦 Livré à : {purchase.deliveryInfo.firstName} {purchase.deliveryInfo.lastName}, {purchase.deliveryInfo.address}, {purchase.deliveryInfo.postalCode}
                </Text>
              )}

              <Text color="green" fontWeight="bold" mt={2}>✅ Payé</Text>
            </Box>
          );
        }) : (
          <Text>Aucun achat trouvé.</Text>
        )}
      </Flex>
    </Box>
  );
};

export default Purchases;
