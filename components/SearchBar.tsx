import React, { useState, useEffect } from 'react';
import { 
  InputGroup, 
  InputLeftElement, 
  Input 
} from '@chakra-ui/react';
import { FaSearch } from 'react-icons/fa';
import { X } from 'lucide-react';

interface SearchBarProps {
  onSearch: (searchTerm: string) => void;
  placeholder?: string;
  className?: string;
  resultsCount?: number;
  showResultsCount?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = "Rechercher un article...",
  className = "",
  resultsCount = 0,
  showResultsCount = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Fonction pour gérer la recherche
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  // Fonction pour effacer la recherche
  const clearSearch = () => {
    setSearchTerm('');
    onSearch('');
  };

  // Gérer la touche Escape pour effacer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchTerm) {
        clearSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchTerm]);

  return (
    <div className={`search-bar-container ${className}`}>
      <div className="search-wrapper">
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <FaSearch color="#f87e12" />
          </InputLeftElement>
          <Input
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleSearch}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className={`search-input ${isSearchFocused ? 'focused' : ''}`}
            borderColor="#f87e12"
            _hover={{ borderColor: "#f87e12" }}

            _focus={{ 
              borderColor: "white", 
              boxShadow: "#f87e12",
              bg: "#f87e2",
              borderRadius: "30px",
            }}
          />
          {searchTerm && (
            <button 
              className="clear-search-button" 
              onClick={clearSearch}
              aria-label="Effacer la recherche"
            >
              <X size={16} />
            </button>
          )}
        </InputGroup>
        

      </div>

      <style jsx>{`
        .search-bar-container {
          padding: 5px 24px;
          background: #f8ede9;
          position: sticky;
          top: 95px;
          z-index: 2;
          transition: all 0.3s ease;
        }

        .search-wrapper {
          max-width: 800px;
          margin: 0 auto;
          
          position: relative;
        }

        .search-input {
          padding-right: 40px !important;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
        }

        .search-input.focused {
        border-radius: 30px;
          background: white !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.15) !important;
        }

        .clear-search-button {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          z-index: 2;
        }

        .clear-search-button:hover {
          color: #64748b;
          background: #f1f5f9;
        }

        .search-results-count {
          margin-top: 8px;
          font-size: 14px;
          color: #64748b;
          text-align: right;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: translateY(10px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .search-bar-container {
            padding: 12px 16px;
            top: 80px;
          }
        }
      `}</style>
    </div>
  );
};

export default SearchBar;