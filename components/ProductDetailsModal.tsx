import React, { useState, useEffect, useContext } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box,
  Text,
  Grid,
  GridItem,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import ProductImageSlider from "./ProductImageSlider";
import { GlobalCartContext } from "../components/GlobalCartContext";
import CommentSection from '../components/CommentSection';
import ProductCard from "../components/popup";
import "../app/ProductDetailsModal.css";
import "@/app/style.css";
import { useGlobalCart } from "@/components/GlobalCartContext";

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Card | null;
}
const MotionBox = motion(Box); 
const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ isOpen, onClose, product }) => {
    const [selectedProduct, setSelectedProduct] = useState({});
    const [globalCartCount, setGlobalCartCount] = useState(0);
    const globalCartContext = useContext(GlobalCartContext);
    const { globalCart, setGlobalCart } = useGlobalCart();
    const MotionModalContent = motion(ModalContent);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      if (isOpen) {
        document.body.classList.add("no-scroll"); // Désactive le scroll quand la modale est ouverte
      } else {
        document.body.classList.remove("no-scroll"); // Réactive le scroll quand la modale se ferme
      }
    
      return () => document.body.classList.remove("no-scroll"); // Nettoyage au démontage
    }, [isOpen]);
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            setTimeout(() => setIsVisible(false), 300); // Attendre que l'animation se termine
        }
    }, [isOpen]);
    

    if (!globalCartContext) {
      throw new Error("GlobalCartContext must be used within a GlobalCartProvider");
    }

    if (!product) return null;

    // ✅ Ajout de la gestion de l'expiration
    const isExpired = product?.expiryDate ? new Date(product.expiryDate) < new Date() : false;
if (!product || (!product.price && !product.price_promo)) {
  return null;
}

if (!globalCartContext) {
  throw new Error("GlobalCartContext must be used within a GlobalCartProvider");
}

    return (
<AnimatePresence mode="wait">
  {isOpen && (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl" motionPreset="none">
      {/* Overlay cliquable pour fermer */}
      <ModalOverlay
        bg="none"
        onClick={onClose}
        style={{ pointerEvents: "none" }}
      />


      {/* Contenu avec animation entrée/sortie */}
      <MotionBox
  initial={{ x: "100%", opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  exit={{ x: "100%", opacity: 0 }}
  transition={{ duration: 0.5 }}
  onClick={(e) => e.stopPropagation()}
  style={{
    position: "fixed",
    top: 0,
    right: 0,
    height: "100vh",
    maxWidth: "470px",
    width: "100%",
    background: "#f9ede9",
    overflowY: "auto",
    zIndex: 10000,
    boxShadow: "-2px 0 8px rgba(255, 255, 255, 0.1)"
        }}

      >
          


          <ModalBody style={{ overflowY: "auto", paddingBottom: "20px" }}>
            
            <div className="description-du">
              <Box className="modal-header-bar">
              <Text fontWeight="bold" mb={3} className="title-product">
            {product.title}
                  </Text>
                              
            <ModalCloseButton className="modal-close-btn" />
            </Box>
               Contenu de la modale
               <div className="modal-close-slider">    
              <ProductImageSlider images={product.images} />
              </div>
            {product.price && (
               <p  className="points-importants-title">Prix actuel: {product.price_promo}€</p>
            )}
           
            {product.price && (
              <p className="points-importants-title">Prix de base: {product.price}€</p>
            )}
            
            
              <Grid className="points-importants-grid">
                {product.point_important_un && (
                  <GridItem className="point-important-item">
                    {product.img_point_important_un && (
                      <img
                        src={product.img_point_important_un}
                        alt="Point important 1"
                        className="point-important-image"
                      />
                    )}
                    <Text className="point-important-text">{product.point_important_un}</Text>
                  </GridItem>
                )}

                {product.point_important_deux && (
                  <GridItem className="point-important-item">
                    {product.img_point_important_deux && (
                      <img
                        src={product.img_point_important_deux}
                        alt="Point important 2"
                        className="point-important-image"
                      />
                    )}
                    <Text className="point-important-text">{product.point_important_deux}</Text>
                  </GridItem>
                )}

                {product.point_important_trois && (
                  <GridItem className="point-important-item">
                    {product.img_point_important_trois && (
                      <img
                        src={product.img_point_important_trois}
                        alt="Point important 3"
                        className="point-important-image"
                      />
                    )}
                    <Text className="point-important-text">{product.point_important_trois}</Text>
                  </GridItem>
                )}

                {product.point_important_quatre && (
                  <GridItem className="point-important-item">
                    {product.img_point_important_quatre && (
                      <img
                        src={product.img_point_important_quatre}
                        alt="Point important 4"
                        className="point-important-image"
                      />
                    )}
                    <Text className="point-important-text">{product.point_important_quatre}</Text>
                  </GridItem>
                )}
              </Grid>
            </div>
              <div className="overlap">
                <div className="text-wrapper-50">
                  Offre proposée par
                  <span className="prenom_du_proposant">
                    {product?.prenom_du_proposant}
                  </span>
                  <img
                    className="ellipse"
                    src={product?.photo_du_proposant}
                    alt="Photo du proposant"
                  />
                </div>
                <p className="ipsum-dolor-sit-amet-2">{product?.origine}</p>
                
              </div>
            <p className="ipsum-dolor-sit-amet-2">{product.description}</p>
      
            {product?.caracteristiques?.length > 0 && (
              <Box className="rectangle-35">
                {product.caracteristiques.map((tableau, index) =>
                  tableau.titre || tableau.caracteristiques.some(c => c.nom || c.valeur) ? (
                    <Box key={index} borderRadius="md" mb={4} className="caracteristiques-table">
                      {tableau.titre && <Text className="table-title">{tableau.titre}</Text>}
                      <Grid templateColumns="repeat(auto-fill, minmax(120px))" className="caracteristiques-grid">
                        {tableau.caracteristiques.map((caracteristique, index) =>
                          caracteristique.nom || caracteristique.valeur ? (
                            <GridItem key={index} className="caracteristique-item">
                              {caracteristique.nom && <Text className="caracteristique-nom">{caracteristique.nom}</Text>}
                              {caracteristique.valeur && <Text className="caracteristique-valeur">{caracteristique.valeur}</Text>}
                            </GridItem>
                          ) : null
                        )}
                      </Grid>
                    </Box>
                  ) : null
                )}
              </Box>
            )}
            <p className="ipsum-dolor-sit-amet-2">
              {/* Section Commentaires */}
              <Box mt={8} borderTop="1px solid #ccc" pt={4}>
                <Text fontSize="xm" fontWeight="bold" mb={2}>
                  Avis et commentaires
                </Text>
                {product?._id && <CommentSection productId={product._id} />}
              </Box>
            </p>
          </ModalBody>
          </MotionBox>
        </Modal>
      )}
    </AnimatePresence>
  );
};
export default ProductDetailsModal;
