import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/components/firebaseConfig';
import { Package, Plus, Trash2, Save, RefreshCw, AlertCircle, Check, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Catégories prédéfinies avec leurs couleurs et images
const CATEGORIES = [
  // Mode
  { name: 'Mode Femme', color: '#f472b6', image: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
  { name: 'Mode Homme', color: '#60a5fa', image: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
  { name: 'Chaussures', color: '#a78bfa', image: 'https://images.pexels.com/photos/267320/pexels-photo-267320.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
  { name: 'Accessoires', color: '#fbbf24', image: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
  { name: 'Bijoux', color: '#f59e0b', image: 'https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
  { name: 'Montres', color: '#6366f1', image: 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
  
  // Maison & Déco
  { name: 'Maison', color: '#34d399', image: 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
  { name: 'Cuisine', color: '#fb923c', image: 'https://images.pexels.com/photos/1080696/pexels-photo-1080696.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
  { name: 'Jardin', color: '#4ade80', image: 'https://images.pexels.com/photos/1105019/pexels-photo-1105019.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
  { name: 'Meubles', color: '#a3e635', image: 'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
  { name: 'Décoration', color: '#2dd4bf', image: 'https://images.pexels.com/photos/1090638/pexels-photo-1090638.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
  
  // Beauté & Santé
  { name: 'Beauté', color: '#f87171', image: 'https://images.pexels.com/photos/2113855/pexels-photo-2113855.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
  { name: 'Parfums', color: '#fb7185', image: 'https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
  { name: 'Soins', color: '#fdba74', image: 'https://images.pexels.com/photos/3685530/pexels-photo-3685530.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
  { name: 'Bien-être', color: '#c4b5fd', image: 'https://images.pexels.com/photos/3757942/pexels-photo-3757942.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
  
  // Tech & Loisirs
  { name: 'Électronique', color: '#3b82f6', image: 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
  { name: 'Informatique', color: '#0ea5e9', image: 'https://images.pexels.com/photos/1229861/pexels-photo-1229861.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
  { name: 'Audio', color: '#2563eb', image: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
  { name: 'Jeux Vidéo', color: '#4f46e5', image: 'https://images.pexels.com/photos/275033/pexels-photo-275033.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
  
  // Sports & Loisirs
  { name: 'Sport', color: '#10b981', image: 'https://images.pexels.com/photos/3775566/pexels-photo-3775566.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
  { name: 'Fitness', color: '#22c55e', image: 'https://images.pexels.com/photos/4498151/pexels-photo-4498151.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
  { name: 'Camping', color: '#84cc16', image: 'https://images.pexels.com/photos/6271625/pexels-photo-6271625.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
  { name: 'Vélos', color: '#65a30d', image: 'https://images.pexels.com/photos/276517/pexels-photo-276517.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
  
  // Enfants & Culture
  { name: 'Enfants', color: '#ec4899', image: 'https://images.pexels.com/photos/3662667/pexels-photo-3662667.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
  { name: 'Jouets', color: '#d946ef', image: 'https://images.pexels.com/photos/163036/mario-luigi-yoschi-figures-163036.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
  { name: 'Livres', color: '#8b5cf6', image: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
  { name: 'Musique', color: '#7c3aed', image: 'https://images.pexels.com/photos/1626481/pexels-photo-1626481.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
  { name: 'Art', color: '#e879f9', image: 'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
];

// Vendeurs prédéfinis
const SELLERS = [
  { name: 'Marie', photo: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', origin: 'Atelier parisien' },
  { name: 'Thomas', photo: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', origin: 'Artisan lyonnais' },
  { name: 'Sophie', photo: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', origin: 'Créatrice bordelaise' },
  { name: 'Lucas', photo: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', origin: 'Fabricant marseillais' },
];

// Produits prédéfinis par catégorie
const PRODUCT_TEMPLATES = {
  'Mode Femme': [
    {
      title: 'Robe d\'été fleurie',
      subtitle: 'Collection Été 2025',
      description: 'Magnifique robe d\'été à motifs floraux, parfaite pour les journées ensoleillées. Tissu léger et confortable, coupe flatteuse pour toutes les morphologies.',
      price: '49.99',
      images: [
        'https://images.pexels.com/photos/972995/pexels-photo-972995.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/972995/pexels-photo-972995.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
    {
      title: 'Blouse en soie',
      subtitle: 'Élégance au quotidien',
      description: 'Blouse en soie de qualité supérieure, idéale pour le bureau ou les sorties. Coupe élégante et matière premium pour un confort optimal.',
      price: '79.99',
      images: [
        'https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
    {
      title: 'Jean slim taille haute',
      subtitle: 'Coupe parfaite',
      description: 'Jean slim à taille haute qui sublime votre silhouette. Denim stretch confortable pour une liberté de mouvement optimale.',
      price: '59.99',
      images: [
        'https://images.pexels.com/photos/1346187/pexels-photo-1346187.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/1346187/pexels-photo-1346187.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
  ],
  'Mode Homme': [
    {
      title: 'Chemise en lin',
      subtitle: 'Confort estival',
      description: 'Chemise en lin naturel, parfaite pour les journées chaudes. Coupe décontractée et tissu respirant pour un confort optimal.',
      price: '69.99',
      images: [
        'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
    {
      title: 'Pantalon chino',
      subtitle: 'Style urbain',
      description: 'Pantalon chino en coton de qualité supérieure. Coupe moderne et confortable, parfait pour un look casual chic.',
      price: '49.99',
      images: [
        'https://images.pexels.com/photos/1300550/pexels-photo-1300550.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/1300550/pexels-photo-1300550.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
    {
      title: 'Veste en cuir',
      subtitle: 'Allure intemporelle',
      description: 'Veste en cuir véritable de qualité premium. Coupe ajustée et finitions soignées pour un style à la fois rebelle et élégant.',
      price: '199.99',
      images: [
        'https://images.pexels.com/photos/1124468/pexels-photo-1124468.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/1124468/pexels-photo-1124468.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
  ],
  'Chaussures': [
    {
      title: 'Baskets tendance',
      subtitle: 'Confort urbain',
      description: 'Baskets au design contemporain alliant style et confort. Parfaites pour un look casual chic au quotidien.',
      price: '89.99',
      images: [
        'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
    {
      title: 'Escarpins élégants',
      subtitle: 'Soirées chic',
      description: 'Escarpins élégants à talon moyen, parfaits pour les soirées et occasions spéciales. Confort assuré même après plusieurs heures.',
      price: '79.99',
      images: [
        'https://images.pexels.com/photos/336372/pexels-photo-336372.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/336372/pexels-photo-336372.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
  ],
  'Accessoires': [
    {
      title: 'Robe d\'été fleurie',
      subtitle: 'Collection Été 2025',
      description: 'Magnifique robe d\'été à motifs floraux, parfaite pour les journées ensoleillées. Tissu léger et confortable, coupe flatteuse pour toutes les morphologies.',
      price: '49.99',
      images: [
        'https://images.pexels.com/photos/972995/pexels-photo-972995.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/972995/pexels-photo-972995.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
    {
      title: 'Blouse en soie',
      subtitle: 'Élégance au quotidien',
      description: 'Blouse en soie de qualité supérieure, idéale pour le bureau ou les sorties. Coupe élégante et matière premium pour un confort optimal.',
      price: '79.99',
      images: [
        'https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
    {
      title: 'Jean slim taille haute',
      subtitle: 'Coupe parfaite',
      description: 'Jean slim à taille haute qui sublime votre silhouette. Denim stretch confortable pour une liberté de mouvement optimale.',
      price: '59.99',
      images: [
        'https://images.pexels.com/photos/1346187/pexels-photo-1346187.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/1346187/pexels-photo-1346187.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
  ],
  'Montres': [
    {
      title: 'Montre automatique',
      subtitle: 'Mouvement suisse',
      description: 'Montre automatique avec mouvement suisse visible. Boîtier en acier inoxydable et bracelet en cuir véritable.',
      price: '299.99',
      images: [
        'https://images.pexels.com/photos/9978722/pexels-photo-9978722.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/9978722/pexels-photo-9978722.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
    {
      title: 'Montre connectée',
      subtitle: 'Suivi fitness',
      description: 'Montre connectée avec suivi d\'activité, mesure du rythme cardiaque et notifications. Autonomie de 7 jours.',
      price: '149.99',
      images: [
        'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
    {
      title: 'Veste en cuir',
      subtitle: 'Allure intemporelle',
      description: 'Veste en cuir véritable de qualité premium. Coupe ajustée et finitions soignées pour un style à la fois rebelle et élégant.',
      price: '199.99',
      images: [
        'https://images.pexels.com/photos/1124468/pexels-photo-1124468.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/1124468/pexels-photo-1124468.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
  ],
  'Accessoires': [
    {
      title: 'Sac à main en cuir',
      subtitle: 'Élégance quotidienne',
      description: 'Sac à main en cuir véritable avec finitions de qualité. Design élégant et pratique avec plusieurs compartiments.',
      price: '129.99',
      images: [
        'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
    {
      title: 'Montre minimaliste',
      subtitle: 'Précision suisse',
      description: 'Montre au design épuré avec mouvement suisse. Bracelet en cuir véritable et cadran minimaliste pour un style intemporel.',
      price: '149.99',
      images: [
        'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
  ],
  'Maison': [
    {
      title: 'Lampe de table design',
      subtitle: 'Éclairage d\'ambiance',
      description: 'Lampe de table au design contemporain. Éclairage doux et chaleureux pour créer une ambiance cosy dans votre intérieur.',
      price: '79.99',
      images: [
        'https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
    {
      title: 'Coussin décoratif',
      subtitle: 'Touche de couleur',
      description: 'Coussin décoratif en tissu premium. Motifs élégants et rembourrage confortable pour sublimer votre canapé ou votre lit.',
      price: '39.99',
      images: [
        'https://images.pexels.com/photos/1248583/pexels-photo-1248583.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/1248583/pexels-photo-1248583.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
    {
      title: 'Vase en céramique',
      subtitle: 'Artisanat local',
      description: 'Vase en céramique fait main par des artisans locaux. Pièce unique qui apportera une touche d\'authenticité à votre intérieur.',
      price: '59.99',
      images: [
        'https://images.pexels.com/photos/5824901/pexels-photo-5824901.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/5824901/pexels-photo-5824901.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
  ],
  'Cuisine': [
    {
      title: 'Robot de cuisine',
      subtitle: 'Chef à domicile',
      description: 'Robot de cuisine multifonction pour préparer facilement tous vos plats. Puissant et polyvalent avec de nombreux accessoires inclus.',
      price: '249.99',
      images: [
        'https://images.pexels.com/photos/4112598/pexels-photo-4112598.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/4112598/pexels-photo-4112598.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
    {
      title: 'Set de couteaux professionnels',
      subtitle: 'Précision de coupe',
      description: 'Ensemble de couteaux de cuisine professionnels en acier inoxydable. Lames tranchantes et manches ergonomiques pour une utilisation confortable.',
      price: '129.99',
      images: [
        'https://images.pexels.com/photos/3626622/pexels-photo-3626622.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/3626622/pexels-photo-3626622.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
  ],
  'Jardin': [
    {
      title: 'Salon de jardin',
      subtitle: 'Détente extérieure',
      description: 'Salon de jardin en résine tressée résistante aux intempéries. Comprend une table basse et des fauteuils confortables avec coussins.',
      price: '399.99',
      images: [
        'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
    {
      title: 'Outils de jardinage',
      subtitle: 'Kit complet',
      description: 'Ensemble d\'outils de jardinage de qualité professionnelle. Comprend tout le nécessaire pour entretenir votre jardin.',
      price: '79.99',
      images: [
        'https://images.pexels.com/photos/1301856/pexels-photo-1301856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/1301856/pexels-photo-1301856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
  ],
  'Meubles': [
    {
      title: 'Canapé d\'angle',
      subtitle: 'Confort moderne',
      description: 'Canapé d\'angle spacieux et confortable avec revêtement en tissu de qualité. Design contemporain qui s\'adapte à tous les intérieurs.',
      price: '899.99',
      images: [
        'https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
    {
      title: 'Table à manger extensible',
      subtitle: 'Convivialité familiale',
      description: 'Table à manger extensible en bois massif. Parfaite pour les repas en famille ou entre amis, elle s\'adapte à toutes les occasions.',
      price: '499.99',
      images: [
        'https://images.pexels.com/photos/1080696/pexels-photo-1080696.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/1080696/pexels-photo-1080696.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
  ],
  'Décoration': [
    {
      title: 'Miroir design',
      subtitle: 'Élégance murale',
      description: 'Miroir mural au design contemporain avec cadre en métal doré. Apporte luminosité et impression d\'espace à votre intérieur.',
      price: '149.99',
      images: [
        'https://images.pexels.com/photos/1528975/pexels-photo-1528975.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/1528975/pexels-photo-1528975.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
    {
      title: 'Tapis scandinave',
      subtitle: 'Chaleur nordique',
      description: 'Tapis d\'inspiration scandinave en laine naturelle. Motifs géométriques et texture douce pour un intérieur chaleureux.',
      price: '199.99',
      images: [
        'https://images.pexels.com/photos/6707628/pexels-photo-6707628.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/6707628/pexels-photo-6707628.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
  ],
  'Beauté': [
    {
      title: 'Sérum visage anti-âge',
      subtitle: 'Formule enrichie',
      description: 'Sérum visage concentré aux actifs anti-âge. Formule enrichie en acide hyaluronique et vitamines pour une peau plus ferme et éclatante.',
      price: '69.99',
      images: [
        'https://images.pexels.com/photos/3685530/pexels-photo-3685530.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/3685530/pexels-photo-3685530.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
    {
      title: 'Palette de maquillage',
      subtitle: 'Teintes naturelles',
      description: 'Palette de maquillage complète avec des teintes naturelles. Fards à paupières, blush et highlighter pour un look parfait.',
      price: '49.99',
      images: [
        'https://images.pexels.com/photos/2113855/pexels-photo-2113855.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/2113855/pexels-photo-2113855.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
    {
      title: 'Parfum unisexe',
      subtitle: 'Notes boisées',
      description: 'Parfum unisexe aux notes boisées et épicées. Fragrance élégante et persistante pour une présence remarquée.',
      price: '89.99',
      images: [
        'https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
  ],
  'Parfums': [
    {
      title: 'Eau de parfum florale',
      subtitle: 'Notes délicates',
      description: 'Eau de parfum aux notes florales délicates. Une fragrance élégante et raffinée pour toutes les occasions.',
      price: '89.99',
      images: [
        'https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
    {
      title: 'Parfum oriental boisé',
      subtitle: 'Intensité sensuelle',
      description: 'Parfum aux notes orientales et boisées. Une fragrance intense et sensuelle qui laisse une empreinte mémorable.',
      price: '119.99',
      images: [
        'https://images.pexels.com/photos/755992/pexels-photo-755992.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/755992/pexels-photo-755992.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
  ],
  'Soins': [
    {
      title: 'Crème hydratante',
      subtitle: 'Hydratation intense',
      description: 'Crème hydratante enrichie en acide hyaluronique et vitamines. Texture légère et non grasse pour une peau parfaitement hydratée.',
      price: '39.99',
      images: [
        'https://images.pexels.com/photos/3685523/pexels-photo-3685523.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/3685523/pexels-photo-3685523.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
    {
      title: 'Huile de soin visage',
      subtitle: 'Nutrition naturelle',
      description: 'Huile de soin visage 100% naturelle aux huiles précieuses. Nourrit intensément la peau et restaure son éclat naturel.',
      price: '49.99',
      images: [
        'https://images.pexels.com/photos/4465124/pexels-photo-4465124.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/4465124/pexels-photo-4465124.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
  ],
  'Bien-être': [
    {
      title: 'Diffuseur d\'huiles essentielles',
      subtitle: 'Ambiance zen',
      description: 'Diffuseur d\'huiles essentielles avec lumière d\'ambiance. Crée une atmosphère relaxante et apaisante dans votre intérieur.',
      price: '59.99',
      images: [
        'https://images.pexels.com/photos/4046718/pexels-photo-4046718.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/4046718/pexels-photo-4046718.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
    {
      title: 'Set de yoga premium',
      subtitle: 'Pratique zen',
      description: 'Ensemble complet pour la pratique du yoga comprenant tapis, blocs et sangle. Matériaux écologiques et durables.',
      price: '89.99',
      images: [
        'https://images.pexels.com/photos/4056535/pexels-photo-4056535.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/4056535/pexels-photo-4056535.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
  ],
  'Électronique': [
    {
      title: 'Écouteurs sans fil',
      subtitle: 'Son immersif',
      description: 'Écouteurs sans fil avec réduction de bruit active. Profitez d\'une expérience sonore exceptionnelle avec une autonomie de 24 heures.',
      price: '129.99',
      images: [
        'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
    {
      title: 'Montre connectée',
      subtitle: 'Suivi fitness avancé',
      description: 'Montre connectée avec suivi d\'activité, mesure du rythme cardiaque et notifications. Étanche jusqu\'à 50m et autonomie de 7 jours.',
      price: '199.99',
      images: [
        'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
  ],
  'Informatique': [
    {
      title: 'Ordinateur portable ultrabook',
      subtitle: 'Performance nomade',
      description: 'Ordinateur portable ultraléger avec processeur haute performance. Idéal pour le travail et les loisirs en déplacement.',
      price: '999.99',
      images: [
        'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
    {
      title: 'Souris ergonomique',
      subtitle: 'Confort de travail',
      description: 'Souris ergonomique conçue pour réduire la fatigue et prévenir les douleurs. Design innovant et capteur haute précision.',
      price: '49.99',
      images: [
        'https://images.pexels.com/photos/3944394/pexels-photo-3944394.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/3944394/pexels-photo-3944394.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
  ],
  'Audio': [
    {
      title: 'Enceinte Bluetooth portable',
      subtitle: 'Son immersif',
      description: 'Enceinte Bluetooth portable avec son stéréo puissant. Résistante à l\'eau et autonomie de 20 heures pour vous accompagner partout.',
      price: '129.99',
      images: [
        'https://images.pexels.com/photos/1279107/pexels-photo-1279107.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/1279107/pexels-photo-1279107.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
    {
      title: 'Casque audio premium',
      subtitle: 'Immersion sonore',
      description: 'Casque audio haut de gamme avec réduction de bruit active. Son cristallin et confort exceptionnel pour une expérience d\'écoute optimale.',
      price: '249.99',
      images: [
        'https://images.pexels.com/photos/577769/pexels-photo-577769.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/577769/pexels-photo-577769.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
  ],
  'Jeux Vidéo': [
    {
      title: 'Console de jeux dernière génération',
      subtitle: 'Gaming immersif',
      description: 'Console de jeux dernière génération avec graphismes 4K et performances exceptionnelles. Inclut une manette sans fil et un jeu populaire.',
      price: '499.99',
      images: [
        'https://images.pexels.com/photos/275033/pexels-photo-275033.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/275033/pexels-photo-275033.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
    {
      title: 'Manette pro gaming',
      subtitle: 'Précision extrême',
      description: 'Manette professionnelle pour gamers exigeants. Boutons programmables et grip ergonomique pour des sessions de jeu confortables.',
      price: '89.99',
      images: [
        'https://images.pexels.com/photos/4225230/pexels-photo-4225230.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/4225230/pexels-photo-4225230.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
  ],
  'Sport': [
    {
      title: 'Tapis de yoga premium',
      subtitle: 'Confort et adhérence',
      description: 'Tapis de yoga antidérapant en matériaux écologiques. Parfait pour tous types de yoga et de fitness, avec sangle de transport incluse.',
      price: '49.99',
      images: [
        'https://images.pexels.com/photos/4056535/pexels-photo-4056535.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/4056535/pexels-photo-4056535.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
    {
      title: 'Chaussures de running',
      subtitle: 'Performance maximale',
      description: 'Chaussures de course légères avec amorti réactif. Conçues pour les coureurs de tous niveaux, offrant confort et stabilité.',
      price: '119.99',
      images: [
        'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
  ],
  'Fitness': [
    {
      title: 'Kettlebell ajustable',
      subtitle: 'Entraînement polyvalent',
      description: 'Kettlebell avec poids ajustable pour un entraînement complet. Idéal pour le renforcement musculaire et le cardio à domicile.',
      price: '79.99',
      images: [
        'https://images.pexels.com/photos/4498604/pexels-photo-4498604.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/4498604/pexels-photo-4498604.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
    {
      title: 'Bandes de résistance',
      subtitle: 'Musculation progressive',
      description: 'Set de bandes de résistance de différentes intensités. Parfait pour la musculation, la rééducation ou le stretching.',
      price: '29.99',
      images: [
        'https://images.pexels.com/photos/4498151/pexels-photo-4498151.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/4498151/pexels-photo-4498151.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
  ],
  'Camping': [
    {
      title: 'Tente 4 personnes',
      subtitle: 'Aventures en plein air',
      description: 'Tente spacieuse pour 4 personnes, facile à monter et résistante aux intempéries. Parfaite pour les escapades en famille ou entre amis.',
      price: '199.99',
      images: [
        'https://images.pexels.com/photos/6271625/pexels-photo-6271625.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/6271625/pexels-photo-6271625.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
    {
      title: 'Sac de couchage ultraléger',
      subtitle: 'Nuits confortables',
      description: 'Sac de couchage ultraléger et compact, adapté aux températures de 0°C à 15°C. Idéal pour le camping et la randonnée.',
      price: '89.99',
      images: [
        'https://images.pexels.com/photos/6271651/pexels-photo-6271651.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/6271651/pexels-photo-6271651.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
  ],
  'Vélos': [
    {
      title: 'Vélo électrique urbain',
      subtitle: 'Mobilité écologique',
      description: 'Vélo électrique conçu pour les déplacements urbains. Batterie longue durée et assistance au pédalage pour des trajets sans effort.',
      price: '1299.99',
      images: [
        'https://images.pexels.com/photos/1149601/pexels-photo-1149601.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/1149601/pexels-photo-1149601.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
    {
      title: 'VTT tout-terrain',
      subtitle: 'Aventures nature',
      description: 'VTT robuste pour les sentiers et terrains accidentés. Suspension avant, freins à disque et transmission de qualité pour des performances optimales.',
      price: '799.99',
      images: [
        'https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
  ],
  'Enfants': [
    {
      title: 'Jeu éducatif en bois',
      subtitle: 'Apprentissage ludique',
      description: 'Jeu éducatif en bois naturel pour développer la motricité fine et la logique. Adapté aux enfants de 3 à 6 ans.',
      price: '34.99',
      images: [
        'https://images.pexels.com/photos/3933022/pexels-photo-3933022.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/3933022/pexels-photo-3933022.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
    {
      title: 'Peluche interactive',
      subtitle: 'Compagnon doux',
      description: 'Peluche interactive qui réagit au toucher et à la voix. Matériaux doux et hypoallergéniques, parfaite pour les câlins.',
      price: '29.99',
      images: [
        'https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/1767434/pexels-photo-1767434.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
  ],
  'Jouets': [
    {
      title: 'Robot interactif',
      subtitle: 'Technologie ludique',
      description: 'Robot interactif programmable qui réagit à la voix et aux mouvements. Parfait pour initier les enfants à la robotique de façon ludique.',
      price: '79.99',
      images: [
        'https://images.pexels.com/photos/2599244/pexels-photo-2599244.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/2599244/pexels-photo-2599244.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
    {
      title: 'Jeu de construction créatif',
      subtitle: 'Imagination sans limites',
      description: 'Jeu de construction avec plus de 500 pièces colorées. Stimule la créativité et développe la motricité fine des enfants.',
      price: '39.99',
      images: [
        'https://images.pexels.com/photos/163036/mario-luigi-yoschi-figures-163036.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/163036/mario-luigi-yoschi-figures-163036.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
  ],
  'Bijoux': [
    {
      title: 'Collier en argent',
      subtitle: 'Élégance intemporelle',
      description: 'Collier en argent 925 avec pendentif délicat. Parfait pour toutes les occasions, du quotidien aux événements spéciaux.',
      price: '79.99',
      images: [
        'https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
    {
      title: 'Bracelet en or',
      subtitle: 'Finesse et brillance',
      description: 'Bracelet en or 18 carats avec design minimaliste. Ajustable et confortable pour un port quotidien.',
      price: '149.99',
      images: [
        'https://images.pexels.com/photos/9428319/pexels-photo-9428319.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/9428319/pexels-photo-9428319.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
  ],
  'Livres': [
    {
      title: 'Roman bestseller',
      subtitle: 'Aventure captivante',
      description: 'Roman captivant qui vous transportera dans un monde d\'aventures et d\'émotions. Par un auteur primé, ce livre est un incontournable de l\'année.',
      price: '24.99',
      images: [
        'https://images.pexels.com/photos/1907785/pexels-photo-1907785.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/1907785/pexels-photo-1907785.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
    {
      title: 'Guide de développement personnel',
      subtitle: 'Transformation positive',
      description: 'Guide pratique pour améliorer votre vie quotidienne et atteindre vos objectifs. Inclut des exercices et des conseils applicables immédiatement.',
      price: '19.99',
      images: [
        'https://images.pexels.com/photos/4238488/pexels-photo-4238488.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/4238488/pexels-photo-4238488.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
  ],
  'Musique': [
    {
      title: 'Guitare acoustique',
      subtitle: 'Sonorité chaleureuse',
      description: 'Guitare acoustique avec table d\'harmonie en épicéa massif. Son chaleureux et équilibré, idéale pour les débutants comme pour les musiciens confirmés.',
      price: '299.99',
      images: [
        'https://images.pexels.com/photos/1010519/pexels-photo-1010519.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/1010519/pexels-photo-1010519.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
    {
      title: 'Piano numérique',
      subtitle: 'Toucher authentique',
      description: 'Piano numérique avec 88 touches à toucher lourd. Son authentique et nombreuses fonctionnalités pour l\'apprentissage et la composition.',
      price: '649.99',
      images: [
        'https://images.pexels.com/photos/164743/pexels-photo-164743.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/164743/pexels-photo-164743.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
  ],
  'Art': [
    {
      title: 'Set de peinture acrylique',
      subtitle: 'Créativité colorée',
      description: 'Set complet de peinture acrylique avec 24 couleurs vibrantes, pinceaux et palette. Idéal pour les artistes débutants et confirmés.',
      price: '49.99',
      images: [
        'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
    {
      title: 'Chevalet professionnel',
      subtitle: 'Support d\'artiste',
      description: 'Chevalet en bois massif réglable en hauteur et inclinaison. Stable et robuste pour accueillir toiles et panneaux de différentes tailles.',
      price: '129.99',
      images: [
        'https://images.pexels.com/photos/102127/pexels-photo-102127.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        'https://images.pexels.com/photos/102127/pexels-photo-102127.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      ],
    },
  ],
};

// Fonction pour générer une date d'expiration aléatoire (entre maintenant et 30 jours)
const getRandomExpiryDate = () => {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(now.getDate() + Math.floor(Math.random() * 30) + 1);
  return futureDate.toISOString(); // Retourne une string au format ISO
};

// Génère un produit aléatoire basé sur une catégorie
const generateRandomProduct = (category: string) => {
  const templates = PRODUCT_TEMPLATES[category];
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  const seller = SELLERS[Math.floor(Math.random() * SELLERS.length)];
  const stock = Math.floor(Math.random() * 100) + 10;
  const stockReduc = Math.floor(Math.random() * (stock / 2));
  
  // 30% de chance d'avoir un prix promo
  const hasPromo = Math.random() < 0.3;
  const pricePromo = hasPromo 
    ? (parseFloat(template.price) * (0.7 + Math.random() * 0.2)).toFixed(2) 
    : '';
  
  // Trouver la catégorie correspondante
  const categoryObj = CATEGORIES.find(cat => cat.name === category);
  
  return {
    categorie: category,
    categorieImage: categoryObj?.image || '',
    categorieBackgroundColor: categoryObj?.color || '#667eea',
    affiche: template.images[0],
    nouveau: Math.random() < 0.3, // 30% de chance d'être marqué comme nouveau
    title: template.title,
    subtitle: template.subtitle,
    description: template.description,
    images: template.images,
    stock: stock,
    stock_reduc: stockReduc,
    price: template.price,
    price_promo: pricePromo,
    time: getRandomExpiryDate(), // Maintenant retourne une string
    deliveryTime: '2-3 jours ouvrés',
    point_important_un: 'Qualité premium',
    point_important_deux: 'Fabrication éthique',
    point_important_trois: 'Livraison rapide',
    point_important_quatre: 'Garantie satisfaction',
    img_point_important_un: 'https://img.icons8.com/fluency/48/null/star.png',
    img_point_important_deux: 'https://img.icons8.com/fluency/48/null/handshake.png',
    img_point_important_trois: 'https://img.icons8.com/fluency/48/null/in-transit.png',
    img_point_important_quatre: 'https://img.icons8.com/fluency/48/null/guarantee.png',
    prenom_du_proposant: seller.name,
    photo_du_proposant: seller.photo,
    origine: seller.origin,
    caracteristiques: [
      {
        titre: 'Caractéristiques',
        caracteristiques: [
          { nom: 'Matière', valeur: 'Premium' },
          { nom: 'Origine', valeur: 'France' },
          { nom: 'Entretien', valeur: 'Facile' }
        ]
      }
    ],
    produits_derives: [
      {
        titre: `${template.title} - Édition spéciale`,
        description: `Version édition limitée de notre ${template.title.toLowerCase()}`,
        prix: (parseFloat(template.price) * 1.2).toFixed(2),
        price_promo: '',
        images: [template.images[0]],
        deliveryTime: '3-5 jours ouvrés'
      }
    ]
  };
};

const BulkProductGenerator = () => {
  const { user } = useAuth();
  const [count, setCount] = useState(5);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showAuthWarning, setShowAuthWarning] = useState(false);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleGenerate = async () => {
    if (selectedCategories.length === 0) {
      setError('Veuillez sélectionner au moins une catégorie');
      return;
    }
    
    if (count <= 0 || count > 50) {
      setError('Le nombre d\'articles doit être entre 1 et 50');
      return;
    }
    
    // Vérifier si l'utilisateur est connecté
    if (!user) {
      setShowAuthWarning(true);
      setError('Vous devez être connecté pour générer des articles');
      return;
    }
    
    setError('');
    setIsGenerating(true);
    setGeneratedCount(0);
    setSuccess(false);
    
    try {
      for (let i = 0; i < count; i++) {
        // Sélectionner une catégorie aléatoire parmi celles choisies
        const category = selectedCategories[Math.floor(Math.random() * selectedCategories.length)];
        
        // Générer un produit aléatoire
        const product = generateRandomProduct(category);
        
        // Ajouter à Firebase
        await addDoc(collection(db, 'cards'), {
          ...product,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        // Mettre à jour le compteur
        setGeneratedCount(prev => prev + 1);
      }
      
      setSuccess(true);
    } catch (err) {
      console.error('Erreur lors de la génération des produits:', err);
      setError('Une erreur est survenue lors de la génération des produits');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bulk-generator-container">
      <div className="generator-header">
        <div className="header-icon">
          <Package className="icon" />
        </div>
        <div className="header-content">
          <h1 className="header-title">Générateur d'articles en masse</h1>
          <p className="header-description">
            Créez rapidement plusieurs articles de test pour votre boutique
          </p>
        </div>
      </div>
      
      <div className="generator-content">
        <div className="settings-card">
          <h2 className="settings-title">Configuration</h2>
          
          <div className="form-group">
            <label className="form-label">Nombre d'articles à générer</label>
            <div className="number-input-group">
              <button 
                className="number-btn"
                onClick={() => setCount(prev => Math.max(1, prev - 1))}
                disabled={isGenerating}
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max="50"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                className="number-input"
                disabled={isGenerating}
              />
              <button 
                className="number-btn"
                onClick={() => setCount(prev => Math.min(50, prev + 1))}
                disabled={isGenerating}
              >
                +
              </button>
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Catégories à inclure</label>
            <div className="categories-grid">
              {CATEGORIES.map(category => (
                <div 
                  key={category.name}
                  className={`category-card ${selectedCategories.includes(category.name) ? 'selected' : ''}`}
                  onClick={() => handleCategoryToggle(category.name)}
                  style={{
                    borderColor: selectedCategories.includes(category.name) ? category.color : undefined,
                    boxShadow: selectedCategories.includes(category.name) ? `0 0 0 1px ${category.color}` : undefined
                  }}
                >
                  <div 
                    className="category-color" 
                    style={{ backgroundColor: category.color }}
                  />
                  <div className="category-image">
                    <img src={category.image} alt={category.name} />
                  </div>
                  <div className="category-name">{category.name}</div>
                  <div className="category-check">
                    {selectedCategories.includes(category.name) && <Check className="check-icon" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {error && (
            <div className={`error-message ${showAuthWarning ? 'auth-warning' : ''}`}>
              {showAuthWarning ? <Info className="warning-icon" /> : <AlertCircle className="error-icon" />}
              <div>
                {error}
                {showAuthWarning && (
                  <p className="warning-note">
                    Connectez-vous en tant qu'administrateur pour générer des articles.
                    <br />
                    Pour le moment, vous pouvez explorer l'interface sans générer d'articles.
                  </p>
                )}
              </div>
            </div>
          )}
          
          <button 
            className="generate-btn"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="spin-icon" />
                Génération en cours...
              </>
            ) : (
              <>
                <Plus className="btn-icon" />
                Générer {count} article{count > 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
        
        {(isGenerating || success) && (
          <div className="results-card">
            <h2 className="results-title">
              {isGenerating ? 'Génération en cours...' : 'Génération terminée'}
            </h2>
            
            <div className="progress-container">
              <div 
                className="progress-bar"
                style={{ width: `${(generatedCount / count) * 100}%` }}
              />
            </div>
            
            <div className="progress-text">
              {generatedCount} sur {count} articles générés
            </div>
            
            {success && (
              <div className="success-message">
                <Check className="success-icon" />
                {count} article{count > 1 ? 's' : ''} généré{count > 1 ? 's' : ''} avec succès !
              </div>
            )}
          </div>
        )}
      </div>
      
      <style jsx>{`
        .bulk-generator-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 24px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .generator-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .header-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .icon {
          width: 24px;
          height: 24px;
        }
        
        .header-title {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
        }
        
        .header-description {
          color: #64748b;
          margin: 0;
          font-size: 14px;
        }
        
        .generator-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        
        .settings-card {
          background: white;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .settings-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 20px 0;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-label {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          display: block;
          margin-bottom: 8px;
        }
        
        .number-input-group {
          display: flex;
          align-items: center;
          width: fit-content;
        }
        
        .number-btn {
          width: 36px;
          height: 36px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .number-btn:first-child {
          border-radius: 8px 0 0 8px;
        }
        
        .number-btn:last-child {
          border-radius: 0 8px 8px 0;
        }
        
        .number-btn:hover:not(:disabled) {
          background: #e2e8f0;
        }
        
        .number-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .number-input {
          width: 60px;
          height: 36px;
          border: 1px solid #e2e8f0;
          border-left: none;
          border-right: none;
          text-align: center;
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }
        
        .number-input:focus {
          outline: none;
        }
        
        .categories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
          gap: 16px;
        }
        
        .category-card {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }
        
        .category-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .category-card.selected {
          transform: scale(1.02);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
        }
        
        .category-color {
          height: 4px;
          width: 100%;
        }
        
        .category-image {
          height: 80px;
          overflow: hidden;
        }
        
        .category-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .category-name {
          padding: 12px;
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          text-align: center;
        }
        
        .category-check {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .check-icon {
          width: 14px;
          height: 14px;
          color: #10b981;
        }
        
        .error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 12px;
          font-size: 14px;
          margin-bottom: 20px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        
        .error-message.auth-warning {
          background: #eff6ff;
          border-color: #bfdbfe;
        }
        
        .error-icon, .warning-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          margin-top: 3px;
        }
        
        .warning-icon {
          color: #3b82f6;
        }
        
        .warning-note {
          margin-top: 8px;
          font-size: 12px;
          color: #3b82f6;
          line-height: 1.4;
        }
        
        .generate-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 12px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .generate-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        
        .generate-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .btn-icon, .spin-icon {
          width: 18px;
          height: 18px;
        }
        
        .spin-icon {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .results-card {
          background: white;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .results-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 20px 0;
        }
        
        .progress-container {
          width: 100%;
          height: 8px;
          background: #f1f5f9;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 12px;
        }
        
        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #667eea, #764ba2);
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        
        .progress-text {
          font-size: 14px;
          color: #64748b;
          text-align: center;
          margin-bottom: 16px;
        }
        
        .success-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          color: #16a34a;
          font-size: 14px;
        }
        
        .success-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }
        
        @media (max-width: 640px) {
          .bulk-generator-container {
            padding: 16px;
          }
          
          .categories-grid {
            grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
          }
          
          .category-image {
            height: 50px;
          }
          
          .category-name {
            padding: 8px;
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
};

export default BulkProductGenerator;