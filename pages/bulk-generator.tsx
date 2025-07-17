import React from 'react';
import BulkProductGenerator from '@/components/BulkProductGenerator';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';

const BulkGeneratorPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();

  // Suppression de la vérification d'authentification pour permettre l'accès à tous

  return (
    <div className="bulk-generator-page">
      <BulkProductGenerator />
      
      <style jsx>{`
        .bulk-generator-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 20px;
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(102, 126, 234, 0.3);
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default BulkGeneratorPage;