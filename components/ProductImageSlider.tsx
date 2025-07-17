import React, { useState, useEffect, useRef } from 'react';
import Img from 'react-cool-img';
import { useSwipeable } from 'react-swipeable';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from '@chakra-ui/icons';

interface ImageSliderProps {
  images: string[];
  className?: string;
  onClose?: () => void;
}

interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

const ProductImageSlider: React.FC<ImageSliderProps> = ({ images, className, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [preloadedImages, setPreloadedImages] = useState<Set<number>>(new Set([0]));
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions[]>([]);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculer les dimensions optimales pour le conteneur
  const calculateOptimalDimensions = (dimensions: ImageDimensions[]) => {
    if (dimensions.length === 0) return { width: 400, height: 300 };
    
    const currentDim = dimensions[currentIndex];
    if (!currentDim) return { width: 400, height: 300 };

    const maxWidth = containerRef.current?.parentElement?.clientWidth || 800;
    const maxHeight = Math.min(600, window.innerHeight * 0.6);
    
    // Calculer les dimensions en respectant l'aspect ratio
    let width = Math.min(maxWidth, currentDim.width);
    let height = width / currentDim.aspectRatio;
    
    if (height > maxHeight) {
      height = maxHeight;
      width = height * currentDim.aspectRatio;
    }
    
    return { width: Math.round(width), height: Math.round(height) };
  };

  // Charger les dimensions des images
  const loadImageDimensions = (src: string): Promise<ImageDimensions> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          aspectRatio: img.naturalWidth / img.naturalHeight
        });
      };
      img.onerror = () => {
        resolve({ width: 400, height: 300, aspectRatio: 4/3 });
      };
      img.src = src;
    });
  };

  // Initialiser les dimensions des images
  useEffect(() => {
    const loadAllDimensions = async () => {
      const dimensions = await Promise.all(
        images.map(src => loadImageDimensions(src))
      );
      setImageDimensions(dimensions);
    };
    
    if (images.length > 0) {
      loadAllDimensions();
    }
  }, [images]);

  // Mettre à jour les dimensions du conteneur quand l'image change
  useEffect(() => {
    if (imageDimensions.length > 0) {
      const newDimensions = calculateOptimalDimensions(imageDimensions);
      setContainerDimensions(newDimensions);
    }
  }, [currentIndex, imageDimensions]);

  const handlePrev = (event?: React.MouseEvent | React.KeyboardEvent) => {
    if (event) event.stopPropagation();
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
    
    setPreloadedImages(prev => new Set([...prev, newIndex]));
    setTimeout(() => setIsTransitioning(false), 600);
  };

  const handleNext = (event?: React.MouseEvent | React.KeyboardEvent) => {
    if (event) event.stopPropagation();
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    const newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
    
    setPreloadedImages(prev => new Set([...prev, newIndex]));
    setTimeout(() => setIsTransitioning(false), 600);
  };

  const handleImageClick = () => {
    setIsFullScreen(true);
  };

  const closeFullScreen = () => {
    setIsFullScreen(false);
    onClose?.();
  };

  const handleOutsideClick = (event: React.MouseEvent) => {
    if ((event.target as Element).classList.contains('fullscreen-overlay')) {
      closeFullScreen();
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleNext(),
    onSwipedRight: () => handlePrev(),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isFullScreen) {
        if (event.key === 'ArrowLeft') handlePrev(event);
        else if (event.key === 'ArrowRight') handleNext(event);
        else if (event.key === 'Escape') closeFullScreen();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  // Préchargement intelligent
  useEffect(() => {
    const preloadAdjacent = () => {
      const prevIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
      const nextIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
      setPreloadedImages(prev => new Set([...prev, prevIndex, nextIndex]));
    };
    
    const timer = setTimeout(preloadAdjacent, 100);
    return () => clearTimeout(timer);
  }, [currentIndex, images.length]);

  if (!images || images.length === 0) {
    return (
      <div className="slider-container empty-state">
        <div className="empty-content">
          <div className="empty-icon">📷</div>
          <p>Aucune image disponible</p>
        </div>
      </div>
    );
  }

  const currentAspectRatio = imageDimensions[currentIndex]?.aspectRatio || 4/3;
  const isLandscape = currentAspectRatio > 1;
  const isPortrait = currentAspectRatio < 1;
  const isSquare = Math.abs(currentAspectRatio - 1) < 0.1;

  return (
    <>
      <div 
        ref={containerRef}
        className={`slider-container ${className || ''} ${isLandscape ? 'landscape' : ''} ${isPortrait ? 'portrait' : ''} ${isSquare ? 'square' : ''}`} 
        {...swipeHandlers}
        style={{
          '--container-width': `${containerDimensions.width}px`,
          '--container-height': `${containerDimensions.height}px`,
          '--aspect-ratio': currentAspectRatio,
        } as React.CSSProperties}
      >
        <div className="slider" onClick={handleImageClick}>
          {/* Images avec adaptation dynamique */}
          {images.map((image, index) => (
            <div
              className={`slide ${index === currentIndex ? 'active' : ''} ${
                index < currentIndex ? 'prev' : index > currentIndex ? 'next' : ''
              }`}
              key={index}
              style={{
                transform: `translateX(${(index - currentIndex) * 100}%) scale(${
                  index === currentIndex ? 1 : 0.95
                })`,
                zIndex: index === currentIndex ? 2 : 1,
              }}
            >
              <div className="slide-inner">
                <Img 
                  src={image} 
                  alt={`Slide ${index + 1}`} 
                  className="slide-image"
                  loading={preloadedImages.has(index) ? 'eager' : 'lazy'}
                />
                
                <div className="slide-overlay">
                  <div className="shine-effect"></div>
                  <div className="zoom-indicator">
                    <div className="zoom-icon">🔍</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Navigation adaptative */}
          {images.length > 1 && (
            <>
              <button
                className="nav-button left"
                onClick={handlePrev}
                disabled={isTransitioning}
                aria-label="Image précédente"
              >
                <ChevronLeftIcon boxSize={isPortrait ? 5 : 6} />
                <div className="button-ripple"></div>
              </button>
              
              <button
                className="nav-button right"
                onClick={handleNext}
                disabled={isTransitioning}
                aria-label="Image suivante"
              >
                <ChevronRightIcon boxSize={isPortrait ? 5 : 6} />
                <div className="button-ripple"></div>
              </button>
            </>
          )}
          
          {/* Indicateurs adaptatifs */}
          {images.length > 1 && (
            <div className="pagination-indicators">
              {images.map((_, index) => (
                <button
                  key={index}
                  className={`indicator ${index === currentIndex ? 'active' : ''}`}
                  onClick={() => {
                    if (!isTransitioning) {
                      setIsTransitioning(true);
                      setCurrentIndex(index);
                      setTimeout(() => setIsTransitioning(false), 600);
                    }
                  }}
                  aria-label={`Aller à l'image ${index + 1}`}
                >
                  <div className="indicator-progress"></div>
                </button>
              ))}
            </div>
          )}

          {/* Informations sur l'image */}
          <div className="image-info">
            <div className="image-meta">
              <span className="image-number">{currentIndex + 1}/{images.length}</span>
              {imageDimensions[currentIndex] && (
                <span className="image-dimensions">
                  {imageDimensions[currentIndex].width} × {imageDimensions[currentIndex].height}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Miniatures adaptatives */}
        {images.length > 1 && (
          <div className="thumbnails-container">
            <div className="thumbnails-track">
              {images.map((image, index) => {
                const thumbAspectRatio = imageDimensions[index]?.aspectRatio || 1;
                return (
                  <button
                    key={index}
                    className={`thumbnail ${index === currentIndex ? 'active' : ''}`}
                    onClick={() => {
                      if (!isTransitioning) {
                        setIsTransitioning(true);
                        setCurrentIndex(index);
                        setTimeout(() => setIsTransitioning(false), 600);
                      }
                    }}
                    style={{
                      '--thumb-aspect-ratio': thumbAspectRatio,
                    } as React.CSSProperties}
                  >
                    <Img src={image} alt={`Miniature ${index + 1}`} className="thumbnail-image" />
                    <div className="thumbnail-overlay"></div>
                    <div className="thumbnail-border"></div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Mode plein écran adaptatif */}
      {isFullScreen && (
        <div className="fullscreen-overlay" onClick={handleOutsideClick} {...swipeHandlers}>
          <div className="fullscreen-backdrop"></div>
          
          <button className="close-fullscreen" onClick={closeFullScreen}>
            <CloseIcon boxSize={5} color="white" />
            <div className="close-ripple"></div>
          </button>

          {images.length > 1 && (
            <>
              <button 
                className="nav-button left fullscreen-nav" 
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              >
                <ChevronLeftIcon boxSize={8} />
              </button>
              
              <button 
                className="nav-button right fullscreen-nav" 
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
              >
                <ChevronRightIcon boxSize={8} />
              </button>
            </>
          )}

          <div className="fullscreen-carousel">
            <div 
              className="fullscreen-image"
              style={{
                '--fullscreen-aspect-ratio': currentAspectRatio,
              } as React.CSSProperties}
            >
              <Img 
                src={images[currentIndex]} 
                alt={`Image ${currentIndex + 1} en plein écran`} 
                className="slide-image fullscreen-img" 
              />
            </div>
          </div>
          
          {/* Compteur et informations en plein écran */}
          <div className="fullscreen-info">
            <div className="image-counter">
              <span className="counter-current">{currentIndex + 1}</span>
              <span className="counter-separator">/</span>
              <span className="counter-total">{images.length}</span>
            </div>
            {imageDimensions[currentIndex] && (
              <div className="fullscreen-meta">
                <span>{imageDimensions[currentIndex].width} × {imageDimensions[currentIndex].height}</span>
                <span>Ratio: {currentAspectRatio.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .slider-container {
          position: relative;
          width: 100%;
          max-width: var(--container-width, 800px);
          margin: 0 auto;
          border-radius: 24px;
          overflow: hidden;
          background: linear-gradient(135deg,#FF9800 0%,#f91bf8 100%);
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.1),
            0 0 0 1px rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .slider-container.landscape {
          --nav-size: 56px;
          --thumb-size: 80px;
          --indicator-size: 40px;
        }

        .slider-container.portrait {
          --nav-size: 48px;
          --thumb-size: 60px;
          --indicator-size: 32px;
        }

        .slider-container.square {
          --nav-size: 52px;
          --thumb-size: 70px;
          --indicator-size: 36px;
        }

        .slider-container.empty-state {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .empty-content {
          text-align: center;
          color: #64748b;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .slider {
          position: relative;
          width: 100%;
          min-height: 230px;
          overflow: hidden;
          border-radius: 24px;
          cursor: pointer;
          transition: height 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .slide {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          transform-origin: center center;
        }

        .slide.active {
          z-index: 2;
        }

        .slide.prev {
          transform: translateX(-100%) scale(0.95) !important;
          opacity: 0.7;
        }

        .slide.next {
          transform: translateX(100%) scale(0.95) !important;
          opacity: 0.7;
        }

        .slide-inner {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          border-radius: 24px;
        }

        .slide-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .slider:hover .slide.active .slide-image {
          transform: scale(1.05);
        }

        .slide-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            135deg,
            rgba(0, 0, 0, 0) 0%,
            rgba(0, 0, 0, 0.1) 50%,
            rgba(0, 0, 0, 0.3) 100%
          );
          opacity: 0;
          transition: opacity 0.4s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
        }

        .slide:hover .slide-overlay {
          opacity: 1;
        }

        .shine-effect {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 70%
          );
          transform: translateX(-100%) translateY(-100%) rotate(45deg);
          transition: transform 0.6s ease;
        }

        .slide:hover .shine-effect {
          transform: translateX(100%) translateY(100%) rotate(45deg);
        }

        .zoom-indicator {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 50px;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #333;
          font-size: 14px;
          font-weight: 500;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          transform: translateY(20px) scale(0.9);
          transition: all 0.3s ease;
        }

        .slide:hover .zoom-indicator {
          transform: translateY(0) scale(1);
        }

        .zoom-icon {
          font-size: 16px;
        }

        .nav-button {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #333;
          width: var(--nav-size, 56px);
          height: var(--nav-size, 56px);
          border-radius: 50%;
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.1),
            0 0 0 1px rgba(255, 255, 255, 0.1);
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          opacity: 0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .nav-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .slider:hover .nav-button:not(:disabled) {
          opacity: 1;
        }

        .nav-button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 1);
          transform: translateY(-50%) scale(1.1);
          box-shadow: 
            0 12px 40px rgba(0, 0, 0, 0.15),
            0 0 0 1px rgba(255, 255, 255, 0.2);
        }

        .nav-button.left {
          left: 20px;
        }

        .nav-button.right {
          right: 20px;
        }

        .button-ripple {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(102, 126, 234, 0.3);
          transform: translate(-50%, -50%);
          transition: all 0.3s ease;
        }

        .nav-button:active .button-ripple {
          width: 100px;
          height: 100px;
        }

        .pagination-indicators {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 12px;
          z-index: 10;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 8px 16px;
          border-radius: 25px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .indicator {
          position: relative;
          width: var(--indicator-size, 40px);
          height: 6px;
          border-radius: 3px;
          border: none;
          background: rgba(255, 255, 255, 0.3);
          cursor: pointer;
          transition: all 0.4s ease;
          overflow: hidden;
        }

        .indicator.active {
          background: rgba(255, 255, 255, 0.9);
        }

        .indicator-progress {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 0;
          background: linear-gradient(90deg,rgb(255, 0, 128),rgb(255, 98, 0));
          border-radius: 3px;
          transition: width 0.4s ease;
        }

        .indicator.active .indicator-progress {
          width: 100%;
        }

        .image-info {
          position: absolute;
          top: 20px;
          left: 20px;
          z-index: 10;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 8px 16px;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .slider:hover .image-info {
          opacity: 1;
        }

        .image-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
          color: white;
          font-size: 12px;
          font-weight: 500;
        }

        .image-number {
          color: rgb(255, 0, 128);
          font-weight: 700;
        }

        .image-dimensions {
          opacity: 0.8;
        }

        .thumbnails-container {
          padding: 16px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
        }

        .thumbnails-track {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding: 4px;
        }

        .thumbnails-track::-webkit-scrollbar {
          display: none;
        }

        .thumbnail {
          position: relative;
          width: var(--thumb-size, 70px);
          height: calc(var(--thumb-size, 70px) / var(--thumb-aspect-ratio, 1));
          min-height: 50px;
          max-height: 90px;
          border-radius: 12px;
          overflow: hidden;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          flex-shrink: 0;
          background: none;
        }

        .thumbnail.active {
          border-color: rgba(255, 255, 255, 0.8);
          transform: scale(1.1);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        .thumbnail:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
        }

        .thumbnail-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .thumbnail:hover .thumbnail-image {
          transform: scale(1.1);
        }

        .thumbnail-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.2);
          opacity: 1;
          transition: opacity 0.3s ease;
        }

        .thumbnail.active .thumbnail-overlay,
        .thumbnail:hover .thumbnail-overlay {
          opacity: 0;
        }

        .thumbnail-border {
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          border-radius: 14px;
          background: linear-gradient(45deg, #e05601,rgb(231, 62, 0));
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: -1;
        }

        .thumbnail.active .thumbnail-border {
          opacity: 1;
        }

        /* Mode plein écran */
        .fullscreen-overlay {
          position: fixed;
          top: 30px;
          left: 0;
          width: 100vw;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          padding: 20px;
          box-sizing: border-box;
          animation: fadeIn 0.4s ease;
        }

        .fullscreen-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: #f9ede9;
          backdrop-filter: blur(20px);
        }

        .fullscreen-carousel {
          position: relative;
          width: 90%;
          height: 90%;
          max-width: 1200px;
          max-height: 800px;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1;
        }

        .fullscreen-image {
          position: relative;
          max-width: calc(100vh * var(--fullscreen-aspect-ratio, 1.33));
          max-height: calc(100vw / var(--fullscreen-aspect-ratio, 1.33));
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 
            0 25px 50px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.1);
          animation: scaleIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .fullscreen-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .close-fullscreen {
          position: absolute;
          top: 30px;
          right: 30px;
          z-index: 10001;
          background: #9E9E9E;
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          transition: all 0.3s ease;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .close-fullscreen:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.1);
        }

        .close-ripple {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transform: translate(-50%, -50%);
          transition: all 0.3s ease;
        }

        .close-fullscreen:active .close-ripple {
          width: 80px;
          height: 80px;
        }

        .fullscreen-nav {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: midnightblue;
          width: 64px;
          height: 64px;
          opacity: 1;
        }

        .fullscreen-nav:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-50%) scale(1.1);
        }

        .fullscreen-info {
          position: absolute;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .image-counter {
          background: rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(15px);
          color: white;
          padding: 12px 24px;
          border-radius: 30px;
          font-size: 16px;
          font-weight: 500;
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .counter-current {
          color: rgb(255, 0, 128);
          font-weight: 700;
        }

        .counter-separator {
          opacity: 0.6;
        }

        .counter-total {
          opacity: 0.8;
        }

        .fullscreen-meta {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          display: flex;
          gap: 16px;
          opacity: 0.8;
        }

        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.9);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .slider-container {
            --nav-size: 48px;
            --thumb-size: 60px;
            --indicator-size: 32px;
          }

          .nav-button.left {
            left: 12px;
          }

          .nav-button.right {
            right: 12px;
          }

          .thumbnails-container {
            padding: 12px;
          }

          .fullscreen-nav {
            width: 30px;
            height: 30px;
          }

          .close-fullscreen {
            top: 20px;
            right: 20px;
            width: 48px;
            height: 48px;
          }

          .image-counter {
            padding: 10px 20px;
            font-size: 14px;
          }

          .fullscreen-meta {
            font-size: 11px;
            gap: 12px;
          }
        }

        @media (max-width: 480px) {
          .slider-container {
            border-radius: 16px;
            --nav-size: 40px;
            --thumb-size: 50px;
            --indicator-size: 28px;
          }

          .slider {
            border-radius: 16px;
          }

          .fullscreen-overlay {
            padding: 10px;
            top: 50px;
          }

          .fullscreen-carousel {
            width: 95%;
            height: 95%;
          }

          .pagination-indicators {
            bottom: 12px;
            gap: 8px;
            padding: 6px 12px;
          }

          .image-info {
            top: 12px;
            left: 12px;
            padding: 6px 12px;
          }

          .image-meta {
            font-size: 11px;
          }
        }
      `}</style>
    </>
  );
};

export default ProductImageSlider;