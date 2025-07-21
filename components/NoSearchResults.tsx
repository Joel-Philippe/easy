import React from 'react';

interface NoSearchResultsProps {
  searchTerm: string;
  onClearSearch: () => void;
  className?: string;
}

const NoSearchResults: React.FC<NoSearchResultsProps> = ({
  searchTerm,
  onClearSearch,
  className = ""
}) => {
  return (
    <div className={`no-results ${className}`}>
      <div className="no-results-content">
        <div className="no-results-icon-container">
          <div className="search-icon-large">🔍</div>
          <div className="floating-particles">
            <span className="particle particle-1">✨</span>
            <span className="particle particle-2">💫</span>
            <span className="particle particle-3">⭐</span>
            <span className="particle particle-4">🌟</span>
          </div>
        </div>
        
        <h3 className="no-results-title">Aucun résultat trouvé</h3>
        <p className="no-results-description">
          Aucun article ne correspond à votre recherche 
          <span className="search-term">"{searchTerm}"</span>
        </p>
        
        <div className="suggestions">
          <h4>Suggestions :</h4>
          <ul>
            <li>Vérifiez l'orthographe de votre recherche</li>
            <li>Essayez des mots-clés plus généraux</li>
            <li>Utilisez des synonymes</li>
          </ul>
        </div>

        <button className="reset-search-button" onClick={onClearSearch}>
          <span className="button-icon">🔄</span>
          Effacer la recherche
        </button>
      </div>

      <style jsx>{`
        .no-results {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
          margin: 40px auto;
          max-width: 600px;
          background: linear-gradient(135deg, rgba(255, 128, 177, 0.05) 0%, rgba(255, 150, 68, 0.05) 100%);
          border-radius: 24px;
          border: 2px solid rgba(255, 128, 177, 0.1);
          box-shadow: 
            0 20px 60px rgba(255, 128, 177, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(20px);
          position: relative;
          overflow: hidden;
          animation: slideInScale 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .no-results::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent 30%, rgba(255, 128, 177, 0.05) 50%, transparent 70%);
          animation: shimmer 4s ease-in-out infinite;
          pointer-events: none;
        }

        .no-results-content {
          position: relative;
          z-index: 2;
          text-align: center;
          width: 100%;
        }

        .no-results-icon-container {
          position: relative;
          margin-bottom: 32px;
          display: inline-block;
        }

        .search-icon-large {
          font-size: 80px;
          animation: floatBounce 3s ease-in-out infinite;
          filter: drop-shadow(0 8px 16px rgba(255, 128, 177, 0.3));
          display: inline-block;
        }

        .floating-particles {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }

        .particle {
          position: absolute;
          font-size: 20px;
          animation: floatParticle 4s ease-in-out infinite;
          opacity: 0.7;
        }

        .particle-1 {
          top: 10%;
          left: 20%;
          animation-delay: 0s;
        }

        .particle-2 {
          top: 20%;
          right: 15%;
          animation-delay: 1s;
        }

        .particle-3 {
          bottom: 25%;
          left: 10%;
          animation-delay: 2s;
        }

        .particle-4 {
          bottom: 15%;
          right: 20%;
          animation-delay: 3s;
        }

        .no-results-title {
          font-size: 32px;
          font-weight: 700;
          background: linear-gradient(135deg, #ff80b1, #ff9644);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 16px;
          animation: titleGlow 2s ease-in-out infinite alternate;
        }

        .no-results-description {
          color: #4a5568;
          margin-bottom: 32px;
          font-size: 18px;
          line-height: 1.6;
          font-weight: 500;
        }

        .search-term {
          background: linear-gradient(135deg, #ff80b1, #ff9644);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 700;
          padding: 0 4px;
          position: relative;
        }

        .search-term::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(135deg, #ff80b1, #ff9644);
          border-radius: 1px;
          animation: underlineGlow 2s ease-in-out infinite;
        }

        .suggestions {
          background: rgba(255, 255, 255, 0.8);
          padding: 24px;
          border-radius: 16px;
          margin-bottom: 32px;
          border: 1px solid rgba(255, 128, 177, 0.2);
          box-shadow: 0 8px 32px rgba(255, 128, 177, 0.1);
          animation: fadeInUp 0.8s ease-out 0.3s both;
        }

        .suggestions h4 {
          color: #2d3748;
          margin-bottom: 16px;
          font-size: 18px;
          font-weight: 600;
          background: linear-gradient(135deg, #ff80b1, #ff9644);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .suggestions ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .suggestions li {
          padding: 8px 0;
          color: #4a5568;
          font-weight: 500;
          position: relative;
          padding-left: 24px;
          transition: all 0.3s ease;
        }

        .suggestions li::before {
          content: '💡';
          position: absolute;
          left: 0;
          top: 8px;
          animation: bounce 2s infinite;
          animation-delay: calc(var(--i) * 0.2s);
        }

        .suggestions li:nth-child(1) { --i: 0; }
        .suggestions li:nth-child(2) { --i: 1; }
        .suggestions li:nth-child(3) { --i: 2; }

        .suggestions li:hover {
          color: #2d3748;
          transform: translateX(4px);
        }

        .reset-search-button {
          background: linear-gradient(135deg, #ff80b1, #ff9644);
          color: white;
          border: none;
          padding: 16px 32px;
          border-radius: 50px;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          display: inline-flex;
          align-items: center;
          gap: 12px;
          box-shadow: 
            0 8px 32px rgba(255, 128, 177, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
          animation: fadeInUp 0.8s ease-out 0.5s both;
        }

        .reset-search-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.5s ease;
        }

        .reset-search-button:hover::before {
          left: 100%;
        }

        .reset-search-button:hover {
          transform: translateY(-3px) scale(1.05);
          box-shadow: 
            0 12px 40px rgba(255, 128, 177, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
          background: linear-gradient(135deg, #ff9644, #ff80b1);
        }

        .reset-search-button:active {
          transform: translateY(-1px) scale(1.02);
        }

        .button-icon {
          font-size: 18px;
          animation: rotate 2s linear infinite;
        }

        .reset-search-button:hover .button-icon {
          animation-duration: 0.5s;
        }

        /* Animations */
        @keyframes slideInScale {
          0% {
            opacity: 0;
            transform: translateY(30px) scale(0.9);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes floatBounce {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-10px) rotate(5deg);
          }
          50% {
            transform: translateY(-5px) rotate(0deg);
          }
          75% {
            transform: translateY(-15px) rotate(-5deg);
          }
        }

        @keyframes floatParticle {
          0%, 100% {
            transform: translateY(0px) translateX(0px) rotate(0deg);
            opacity: 0.7;
          }
          25% {
            transform: translateY(-20px) translateX(10px) rotate(90deg);
            opacity: 1;
          }
          50% {
            transform: translateY(-10px) translateX(-5px) rotate(180deg);
            opacity: 0.8;
          }
          75% {
            transform: translateY(-25px) translateX(15px) rotate(270deg);
            opacity: 0.9;
          }
        }

        @keyframes titleGlow {
          0% {
            filter: drop-shadow(0 0 10px rgba(255, 128, 177, 0.3));
          }
          100% {
            filter: drop-shadow(0 0 20px rgba(255, 150, 68, 0.4));
          }
        }

        @keyframes underlineGlow {
          0%, 100% {
            opacity: 0.7;
            transform: scaleX(1);
          }
          50% {
            opacity: 1;
            transform: scaleX(1.1);
          }
        }

        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translateY(0);
          }
          40%, 43% {
            transform: translateY(-4px);
          }
          70% {
            transform: translateY(-2px);
          }
          90% {
            transform: translateY(-1px);
          }
        }

        @keyframes rotate {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .no-results {
            padding: 60px 16px;
            margin: 20px auto;
            border-radius: 20px;
          }
          
          .search-icon-large {
            font-size: 60px;
          }
          
          .no-results-title {
            font-size: 24px;
          }

          .no-results-description {
            font-size: 16px;
          }

          .suggestions {
            padding: 20px;
          }

          .reset-search-button {
            padding: 14px 28px;
            font-size: 14px;
          }

          .particle {
            font-size: 16px;
          }
        }

        @media (max-width: 480px) {
          .no-results {
            padding: 40px 12px;
          }

          .search-icon-large {
            font-size: 50px;
          }

          .no-results-title {
            font-size: 20px;
          }

          .no-results-description {
            font-size: 14px;
          }

          .suggestions {
            padding: 16px;
          }

          .suggestions h4 {
            font-size: 16px;
          }

          .reset-search-button {
            padding: 12px 24px;
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
};

export default NoSearchResults;
