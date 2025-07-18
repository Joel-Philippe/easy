import React from 'react';
import AddCard from '..//AddCard';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import AdminMenu from '@/components/AdminMenu';

const AddProductPage = () => {
  const { user } = useAuth();
  const router = useRouter();

  // Vérifier si l'utilisateur est connecté et est administrateur
  React.useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      // Vérifier si l'utilisateur est admin (à adapter selon votre logique)
      const adminEmail = process.env.NEXT_PUBLIC_FIREBASE_ADMIN_EMAIL;
      if (user.email !== adminEmail) {
        router.push('/');
      }
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Vérification des droits d'accès...</p>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <AdminMenu />
      
      <div className="admin-content">
        <AddCard />
      </div>
      
      <style jsx>{`
        .admin-layout {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }
        
        .admin-content {
          flex: 1;
          margin-left: 280px;
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
        
        @media (max-width: 768px) {
          .admin-content {
            margin-left: 0;
            padding: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default AddProductPage;