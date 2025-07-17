import React, { useState } from "react";
import { useSwipeable } from "react-swipeable";

interface ModernSliderProps {
  images: string[];
  title: string;
  onImageClick?: () => void; // Nouvelle prop pour gérer le clic sur l'image
}

const ModernSlider: React.FC<ModernSliderProps> = ({ images, title, onImageClick }) => {
  const [index, setIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const next = () => setIndex((i) => (i + 1) % images.length);
  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);

  const handlers = useSwipeable({
    onSwipedLeft: () => next(),
    onSwipedRight: () => prev(),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
  });

  // Fonction pour gérer le clic sur l'image
  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onImageClick) {
      onImageClick(); // Ouvre les détails du produit
    } else {
      setIsFullscreen(true); // Fallback vers le mode plein écran si pas de callback
    }
  };

  // Fonction pour ouvrir le mode plein écran (via double-clic ou bouton séparé)
  const handleFullscreenOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFullscreen(true);
  };

  return (
    <>
      <div className="slider-wrapper" {...handlers}>
        <div className="slider-glass">
          <div className="image-container">
            <img
              src={images[index]}
              alt={`Image ${index}`}
              className="slider-image"
              onClick={handleImageClick}
            />
            
            {/* Bouton pour ouvrir en plein écran */}
            <button 
              className="fullscreen-button"
              onClick={handleFullscreenOpen}
              title="Voir en plein écran"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
              </svg>
            </button>


          </div>

          <div className="slider-title">{title}</div>
        </div>

        <div className="dots">
          {images.map((_, i) => (
            <span
              key={i}
              className={`dot ${i === index ? "active" : ""}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </div>

      {isFullscreen && (
        <div
          className="fullscreen-overlay"
          {...handlers}
          onClick={() => setIsFullscreen(false)}
        >
          <img
            src={images[index]}
            alt={`Fullscreen ${index}`}
            className="fullscreen-image"
          />
          <button
            className="nav-button left"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
          >
            ‹
          </button>
          <button
            className="nav-button right"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
          >
            ›
          </button>
          <button
            className="close-button"
            onClick={() => setIsFullscreen(false)}
          >
            ✕
          </button>
        </div>
      )}

      <style jsx>{`
        .slider-wrapper {
          width: 100%;
          height: 27vh;
          max-height: 250px;
          min-height: 180px;
          margin: auto;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .slider-glass {
          position: relative;
          width: 95%;
          max-width: 700px;
          margin-top: 10px;
          border-radius: 6px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(12px);
          background: rgba(255, 255, 255, 0.15);
        }

        .image-container {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .slider-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          cursor: pointer;
          border-radius: 12px 12px 0px 0px;
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .slider-image:hover {
          transform: scale(1.02);
          filter: brightness(1.1);
        }

        .fullscreen-button {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px;
          cursor: pointer;
          opacity: 0;
          transition: all 0.3s ease;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .image-container:hover .fullscreen-button {
          opacity: 1;
        }

        .fullscreen-button:hover {
          background: rgba(0, 0, 0, 0.8);
          transform: scale(1.1);
        }

        .click-indicator {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 12px 16px;
          border-radius: 25px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          opacity: 0;
          transition: all 0.3s ease;
          pointer-events: none;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .image-container:hover .click-indicator {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1.05);
        }

        .click-indicator svg {
          animation: pulse 2s infinite;
        }

        .slider-title {
          position: absolute;
          font-family: 'allroundgothic';
          top: 80%;
          right: 30px;
          font-size: 0.9rem;
          color: rgb(0, 0, 0);
          background-color: white;
          font-weight: 500;
          padding: 3px 8px;
          border-radius: 6px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .slider-title:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .dots {
          margin-top: 6px;
          display: flex;
          justify-content: center;
          gap: 6px;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #F57C00;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .dot:hover {
          transform: scale(1.2);
          background: #E65100;
        }

        .dot.active {
          background: #333;
          transform: scale(1.1);
        }

        .fullscreen-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          backdrop-filter: blur(20px);
        }

        .fullscreen-image {
          max-width: 90vw;
          max-height: 90vh;
          object-fit: contain;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .nav-button {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 50%;
          width: 48px;
          height: 48px;
          font-size: 1.8rem;
          color: #333;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .nav-button:hover {
          background: white;
          transform: translateY(-50%) scale(1.1);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        .nav-button.left {
          left: 20px;
        }

        .nav-button.right {
          right: 20px;
        }

        .close-button {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          font-size: 1.2rem;
          color: #333;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .close-button:hover {
          background: white;
          transform: scale(1.1);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.05);
          }
        }

        @media (max-width: 480px) {
          .slider-wrapper {
            height: 28vh;
          }

          .slider-title {
            font-size: 0.7rem;
            right: 10px;
          }

          .nav-button {
            width: 36px;
            height: 36px;
            font-size: 1.4rem;
          }

          .close-button {
            width: 32px;
            height: 32px;
            font-size: 1rem;
          }

          .fullscreen-button {
            padding: 6px;
          }

          .click-indicator {
            padding: 8px 12px;
            font-size: 12px;
          }

          .nav-button.left {
            left: 10px;
          }

          .nav-button.right {
            right: 10px;
          }

          .close-button {
            top: 10px;
            right: 10px;
          }
        }
      `}</style>
    </>
  );
};

export default ModernSlider;