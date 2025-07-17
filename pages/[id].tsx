'use client';

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Box, Grid, GridItem, Text } from "@chakra-ui/react";
import { useRouter } from 'next/router';
import { FaTimes } from 'react-icons/fa';
import "@/app/style.css";
import ProductImageSlider from '@/components/ProductImageSlider'; 
import CustomMenuItem from '../components/CustomMenuItem';
import "react-responsive-carousel/lib/styles/carousel.min.css";
import LoadingSpinner from '@/components/LoadingSpinner'; 
import GlobalPrice from '../components/globalprice';
import CommentSection from '../components/CommentSection';

// Firebase
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "@/components/firebaseConfig";

const Page_Product = () => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productTime, setProductTime] = useState(null);
  const [currentProduitDeriveIndex, setCurrentProduitDeriveIndex] = useState(0);
  const [isImageSliderOpen, setIsImageSliderOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [expandedImage, setExpandedImage] = useState(null);
  const modalRef = useRef(null);

  const router = useRouter();
  const { id: productId } = router.query;

  const fetchProduct = useCallback(async () => {
    if (!productId) return;

    try {
      const db = getFirestore(app);
      const docRef = doc(db, "cards", productId as string);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setProduct({
          ...data,
          stock: Number(data.stock),
          stock_reduc: Number(data.stock_reduc),
          _id: productId
        });
        setProductTime(new Date(data.time));
      } else {
        setError("Produit introuvable");
      }
    } catch (error) {
      console.error("Erreur Firebase:", error);
      setError("Erreur lors de la récupération du produit.");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleOutsideClick = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      setIsInfoOpen(false);
    }
  };

  useEffect(() => {
    if (isInfoOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    } else {
      document.removeEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isInfoOpen]);

  const handleImageClick = (image) => {
    if (expandedImage === image) {
      setExpandedImage(null);
      document.body.classList.remove('no-scroll');
    } else {
      setExpandedImage(image);
      document.body.classList.add('no-scroll');
    }
  };

  useEffect(() => {
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [expandedImage]);

  const firstFiveImages = product?.images?.slice(0, 5);
  const isExpired = productTime && new Date() > productTime;

  if (loading) return <LoadingSpinner />;
  if (error) return <div style={{ padding: "2rem", color: "red" }}>{error}</div>;

  return (
    <div className="article-double">
      <CustomMenuItem />
      <div className="div">
        <div className="card_hero">
          {product && (
            <>
              <img
                src={product.images[0]}
                alt="Product Main"
                style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', borderRadius: '20px' }}
                onClick={() => setIsImageSliderOpen(true)}
              />
              {isImageSliderOpen && (
                <ProductImageSlider
                  images={product.images}
                  onClose={() => setIsImageSliderOpen(false)}
                />
              )}
            </>
          )}
        </div>
        <p className="p">{product?.title}</p>

        {/* Prix promo sans panier */}
        <div className="prix">
          <div className="overlap-4">
            <div className="text-wrapper-18">{product?.price_promo}€</div>
          </div>
        </div>

        <div className="description-du">
          <div className="overlap">
            <div className="text-wrapper-50">
              De la part de <span className="prenom_du_proposant">{product?.prenom_du_proposant}</span>
              <img className="ellipse" src={product?.photo_du_proposant} alt="Photo du proposant" />
            </div>
            <p className="ipsum-dolor-sit-amet-2">{product?.origine}</p>
          </div>
        </div>

        <div className="plus-d-infos">
          <div className="overlap-2">
            <div className="text-wrapper-50">À propos de l'offre</div>
            <p className="ipsum-dolor-sit-amet-2">{product?.description}</p>
            <div className="text-wrapper-13">{product?.info_optionnel}</div>
          </div>
          {product?.caracteristiques?.length > 0 && (
            <Box className="rectangle-35">
              {product.caracteristiques.map((tableau, index) => (
                tableau.titre || tableau.caracteristiques.some(c => c.nom || c.valeur) ? (
                  <Box key={index} borderRadius="md" mb={4} className="caracteristiques-table">
                    {tableau.titre && <Text className="table-title">{tableau.titre}</Text>}
                    <Grid templateColumns="repeat(auto-fill, minmax(150px, 1fr))" gap={4} className="caracteristiques-grid">
                      {tableau.caracteristiques.map((caracteristique, i) => (
                        caracteristique.nom || caracteristique.valeur ? (
                          <GridItem key={i} className="caracteristique-item">
                            {caracteristique.nom && <Text className="caracteristique-nom">{caracteristique.nom}</Text>}
                            {caracteristique.valeur && <Text className="caracteristique-valeur">{caracteristique.valeur}</Text>}
                          </GridItem>
                        ) : null
                      ))}
                    </Grid>
                  </Box>
                ) : null
              ))}
            </Box>
          )}
        </div>

        {firstFiveImages && (
          <div className="description-du">
            <div className="images-en-vrac">
              {firstFiveImages.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Carousel Image ${index + 1}`}
                  className={`image-varie-${index + 1} ${expandedImage === image ? 'expanded' : ''}`}
                  onClick={() => handleImageClick(image)}
                />
              ))}
            </div>
          </div>
        )}

        <CommentSection productId={productId} />
        <div className="overlap-5">
          <div className="text-wrapper-19">{product?.localisation_gps}</div>
        </div>
      </div>

      {expandedImage && (
        <div className="expanded-image-overlay" onClick={() => handleImageClick(null)}>
          <img src={expandedImage} alt="Expanded" />
        </div>
      )}

      {isInfoOpen && (
        <div className="info-modal-overlay" onClick={handleOutsideClick}>
          <div className="info-modal" ref={modalRef} onClick={(e) => e.stopPropagation()}>
            <div className="info-modal-header">
              <h2>{product.produits_derives[currentProduitDeriveIndex].titre}</h2>
              <FaTimes onClick={() => setIsInfoOpen(false)} style={{ cursor: 'pointer' }} />
            </div>
            <div className="info-modal-content">
              {product.produits_derives[currentProduitDeriveIndex].description}
            </div>
          </div>
        </div>
      )}

      <GlobalPrice />
    </div>
  );
};

export default Page_Product;
