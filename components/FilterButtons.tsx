import React from 'react';
import { Grid3X3, Sparkles } from 'lucide-react';

interface FilterButtonsProps {
  onShowAll: () => void;
  onShowNew: () => void;
  activeFilter: 'all' | 'new';
  className?: string;
}

const FilterButtons: React.FC<FilterButtonsProps> = ({
  onShowAll,
  onShowNew,
  activeFilter,
  className = ""
}) => {
  return (
    <div className={`filter-buttons-container ${className}`}>
      <div className="filter-buttons-wrapper">
        <button
          className={`filter-button ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={onShowAll}
          title="Afficher tous les articles"
        >
          <Grid3X3 className="button-icon" />
          <span className="button-text">Tous</span>
        </button>
        
        <button
          className={`filter-button ${activeFilter === 'new' ? 'active' : ''}`}
          onClick={onShowNew}
          title="Afficher les nouveaux articles"
        >
          <Sparkles className="button-icon" />
          <span className="button-text">Nouveaux</span>
        </button>
      </div>

      <style jsx>{`
        .filter-buttons-container {
          padding: 8px 12px;
          background: transparent;
          display: flex;
          align-items: center;
        }

        .filter-buttons-wrapper {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .filter-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 128, 177, 0.2);
          border-radius: 20px;
          color: #666;
          font-weight: 500;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          position: relative;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          min-width: auto;
          white-space: nowrap;
        }

        .filter-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 128, 177, 0.1), transparent);
          transition: left 0.3s ease;
        }

        .filter-button:hover::before {
          left: 100%;
        }

        .filter-button:hover {
          transform: translateY(-1px) scale(1.02);
          box-shadow: 0 4px 12px rgba(255, 128, 177, 0.2);
          border-color: rgba(255, 128, 177, 0.3);
          background: rgba(255, 255, 255, 1);
        }

        .filter-button.active {
          background: linear-gradient(135deg, #ff80b1, #ff9644);
          color: white;
          border-color: transparent;
          transform: translateY(-1px) scale(1.02);
          box-shadow: 0 4px 12px rgba(255, 128, 177, 0.4);
          font-weight: 600;
        }

        .filter-button.active .button-icon {
          color: white;
          transform: scale(1.05);
        }

        .button-icon {
          width: 14px;
          height: 14px;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }

        .button-text {
          font-weight: inherit;
          transition: all 0.3s ease;
          font-size: 12px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .filter-buttons-container {
            padding: 6px 8px;
          }

          .filter-button {
            padding: 5px 10px;
            font-size: 11px;
            gap: 4px;
          }

          .button-icon {
            width: 12px;
            height: 12px;
          }

          .button-text {
            font-size: 11px;
          }
        }

        @media (max-width: 480px) {
          .filter-buttons-container {
            padding: 4px 6px;
          }

          .filter-button {
            padding: 4px 8px;
            font-size: 10px;
          }

          .button-text {
            display: none;
          }

          .button-icon {
            width: 16px;
            height: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default FilterButtons;