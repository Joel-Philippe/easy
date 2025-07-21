// types.ts

export interface Card {
  _id: string;
  categorie: string;
  categorieImage: string;
  categorieBackgroundColor: string;
  affiche: string;
  nouveau: boolean;
  title: string;
  subtitle: string;
  description: string;
  images: string[];
  stock: number;
  stock_reduc: number;
  price: number;
  price_promo?: number;
  time: Date;
  deliveryTime: string;
  point_important_un: string;
  point_important_deux: string;
  point_important_trois: string;
  point_important_quatre: string;
  img_point_important_un: string;
  img_point_important_deux: string;
  img_point_important_trois: string;
  img_point_important_quatre: string;
  prenom_du_proposant: string;
  photo_du_proposant: string;
  origine: string;
  caracteristiques: {
    titre: string;
    caracteristiques: { nom: string; valeur: string }[];
  }[];
  produits_derives: {
    titre: string;
    description: string;
    price: number;
    price_promo?: number;
    images: string[];
    deliveryTime: string;
  }[];
}
