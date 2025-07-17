import React, { ReactNode, MouseEventHandler } from 'react';
import { Button } from "@chakra-ui/react";

interface ModalProps {
    onClose: () => void;
    children: ReactNode;
    onMouseDown?: MouseEventHandler;
}

const Modal: React.FC<ModalProps> = ({ onClose, children, onMouseDown }) => {
    return (
<div style={{
    position: 'fixed', // Position fixe par rapport à la fenêtre
    top: '50%', // Centré verticalement
    left: '50%', // Centré horizontalement
    height: '100%', // Hauteur automatique
    width: '100%', // Largeur automatique
    transform: 'translate(-50%, -50%)', // Déplace le centre de l'élément à sa position
    backgroundColor: 'white', // Fond blanc
    padding: '0.5em', // Un peu d'espace autour du contenu
    zIndex: 1000, // S'assurer qu'il apparaît au-dessus des autres éléments
    overflow: 'auto', // Permet le défilement lorsque le contenu dépasse les limites
    maxHeight: '100vh', // Limite la hauteur à la hauteur de la fenêtre de visualisation
    maxWidth: '100vw', // Limite la largeur à la largeur de la fenêtre de visualisation
}} onMouseDown={onMouseDown}>
    {children}
    <Button
      type="submit"
      colorScheme="teal" // changez ceci pour le schéma de couleurs que vous voulez
      variant="solid" // changez ceci pour le style de bouton que vous voulez
    >
      Close
    </Button>
</div>
    );
};

export default Modal;