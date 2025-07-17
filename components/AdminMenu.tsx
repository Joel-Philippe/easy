import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  Package, 
  Database, 
  Users, 
  Settings, 
  LogOut, 
  Home,
  BarChart2,
  ShoppingBag,
  Plus,
  List,
  Layers
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const AdminMenu = () => {
  const { logout } = useAuth();
  const router = useRouter();
  
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const menuItems = [
    { icon: Home, label: 'Accueil', href: '/' },
    { icon: BarChart2, label: 'Tableau de bord', href: '/admin' },
    { icon: Package, label: 'Produits', href: '/admin/products' },
    { icon: Plus, label: 'Ajouter un produit', href: '/admin/add-product' },
    { icon: Layers, label: 'Générateur en masse', href: '/bulk-generator' },
    { icon: ShoppingBag, label: 'Commandes', href: '/admin/orders' },
    { icon: Users, label: 'Utilisateurs', href: '/admin/users' },
    { icon: Settings, label: 'Paramètres', href: '/admin/settings' },
  ];

  return (
    <div className="admin-menu">
      <div className="menu-header">
        <div className="logo">
          <Package className="logo-icon" />
          <span className="logo-text">Admin</span>
        </div>
      </div>
      
      <nav className="menu-nav">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = router.pathname === item.href;
          
          return (
            <Link href={item.href} key={index}>
              <div className={`menu-item ${isActive ? 'active' : ''}`}>
                <Icon className="menu-icon" />
                <span className="menu-label">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
      
      <div className="menu-footer">
        <button className="logout-button" onClick={handleLogout}>
          <LogOut className="logout-icon" />
          <span>Déconnexion</span>
        </button>
      </div>
      
      <style jsx>{`
        .admin-menu {
          width: 280px;
          height: 100vh;
          background: white;
          border-right: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          left: 0;
        }
        
        .menu-header {
          padding: 24px;
          border-bottom: 1px solid #f1f5f9;
        }
        
        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .logo-icon {
          width: 24px;
          height: 24px;
          color: #667eea;
        }
        
        .logo-text {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
        }
        
        .menu-nav {
          flex: 1;
          padding: 16px 0;
          overflow-y: auto;
        }
        
        .menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 24px;
          color: #64748b;
          font-weight: 500;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        
        .menu-item:hover {
          background: #f8fafc;
          color: #1e293b;
        }
        
        .menu-item.active {
          background: #f1f5f9;
          color: #667eea;
          border-left: 3px solid #667eea;
        }
        
        .menu-icon {
          width: 20px;
          height: 20px;
        }
        
        .menu-label {
          font-size: 14px;
        }
        
        .menu-footer {
          padding: 24px;
          border-top: 1px solid #f1f5f9;
        }
        
        .logout-button {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #dc2626;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .logout-button:hover {
          background: #fee2e2;
        }
        
        .logout-icon {
          width: 18px;
          height: 18px;
        }
        
        @media (max-width: 768px) {
          .admin-menu {
            width: 100%;
            height: auto;
            position: relative;
            border-right: none;
            border-bottom: 1px solid #e2e8f0;
          }
          
          .menu-nav {
            display: flex;
            flex-wrap: wrap;
            padding: 8px;
          }
          
          .menu-item {
            flex-direction: column;
            padding: 12px;
            text-align: center;
            flex: 1;
            min-width: 80px;
          }
          
          .menu-item.active {
            border-left: none;
            border-bottom: 3px solid #667eea;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminMenu;