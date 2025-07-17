// 📧 Service d'email Firebase - VERSION CORRIGÉE
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/components/firebaseConfig';

// Interface pour les données d'email de commande
interface OrderEmailData {
  customerName: string;
  customerEmail: string;
  orderDate: string;
  items: Array<{
    title: string;
    count: number;
    price: number;
    total: number;
  }>;
  totalPaid: number;
  deliveryInfo: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    phone: string;
    email?: string;
    notes?: string;
  };
  sessionId: string;
}

export const sendOrderConfirmationEmail = async (orderData: OrderEmailData) => {
  try {
    console.log('📧 Envoi de l\'email de confirmation...', orderData);

    // 🎨 Email HTML intégré (sans template externe)
    const emailHTML = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmation de commande - Exercide</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background-color: #f8f9fa;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
        }
        .header h1 { 
            font-size: 28px; 
            margin-bottom: 10px; 
        }
        .content { 
            padding: 30px 20px; 
        }
        .order-info {
            background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }
        .order-item { 
            background: #f8f9fa;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px; 
            margin-bottom: 10px;
        }
        .item-title {
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 5px;
        }
        .item-details {
            color: #718096;
            font-size: 14px;
        }
        .total-section { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 12px;
            margin: 30px 0;
            text-align: center;
        }
        .total-amount { 
            font-size: 32px; 
            font-weight: 900; 
        }
        .footer { 
            background: #f8f9fa;
            text-align: center; 
            padding: 30px 20px; 
            border-top: 1px solid #e2e8f0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Merci pour votre commande !</h1>
            <p>Votre commande a été confirmée avec succès</p>
        </div>
        
        <div class="content">
            <div class="order-info">
                <h2>📋 Détails de votre commande</h2>
                <p><strong>Client :</strong> ${orderData.customerName}</p>
                <p><strong>Email :</strong> ${orderData.customerEmail}</p>
                <p><strong>Date :</strong> ${orderData.orderDate}</p>
                <p><strong>Numéro :</strong> #${orderData.sessionId.slice(-8)}</p>
            </div>
            
            <h3>🛍️ Articles commandés</h3>
            ${orderData.items.map(item => `
                <div class="order-item">
                    <div class="item-title">${item.title}</div>
                    <div class="item-details">
                        Quantité : ${item.count} × ${item.price}€ = ${item.total.toFixed(2)}€
                    </div>
                </div>
            `).join('')}
            
            <h3>🚚 Livraison</h3>
            <div class="order-info">
                <p><strong>${orderData.deliveryInfo.firstName} ${orderData.deliveryInfo.lastName}</strong></p>
                <p>${orderData.deliveryInfo.address}</p>
                <p>${orderData.deliveryInfo.postalCode} ${orderData.deliveryInfo.city}</p>
                <p>${orderData.deliveryInfo.country}</p>
                <p>📞 ${orderData.deliveryInfo.phone}</p>
            </div>
            
            <div class="total-section">
                <div class="total-amount">${orderData.totalPaid.toFixed(2)}€</div>
                <div>Total payé</div>
            </div>
        </div>
        
        <div class="footer">
            <h3>Merci de votre confiance ! 💜</h3>
            <p>📧 support@exercide.com | 📞 +33 1 23 45 67 89</p>
        </div>
    </div>
</body>
</html>`;

    // 📮 Structure correcte pour Firebase Extensions
    const emailData = {
      to: [orderData.customerEmail],
      from: 'philippejoel.wolff@gmail.com', // ✅ Utiliser directement votre Gmail
      replyTo: 'philippejoel.wolff@gmail.com',
      subject: `🎉 Confirmation de votre commande #${orderData.sessionId.slice(-8)}`,
      html: emailHTML // ✅ HTML intégré au lieu d'un template externe
    };

    console.log('📧 Données email à envoyer:', {
      to: emailData.to,
      from: emailData.from,
      subject: emailData.subject
    });

    // 📮 Ajouter l'email à la collection Firebase
    const emailRef = await addDoc(collection(db, 'mail'), emailData);
    
    console.log('✅ Email ajouté à la queue d\'envoi Firebase:', emailRef.id);
    console.log('📧 Destinataire:', orderData.customerEmail);
    console.log('💰 Montant:', orderData.totalPaid, '€');
    
    return { success: true, emailId: emailRef.id };

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
  }
};

// 📧 Fonction de test simplifiée
export const sendTestEmail = async (testEmail: string) => {
  try {
    console.log('🧪 Envoi d\'un email de test vers:', testEmail);

    const emailData = {
      to: [testEmail],
      from: 'philipff@gmail.com',
      subject: '🧪 Test d\'envoi d\'email - Exercide',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: white; border-radius: 12px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px;">
            <h1>🧪 Test d'email réussi !</h1>
          </div>
          <p>Si vous recevez cet email, la configuration Firebase Extensions fonctionne parfaitement.</p>
          <p><strong>Date du test :</strong> ${new Date().toLocaleString('fr-FR')}</p>
          <p><strong>Envoyé depuis :</strong> Exercide - Plateforme E-commerce Sécurisée</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px; text-align: center;">
            Cet email a été envoyé via Firebase Extensions
          </p>
        </div>
      `
    };

    const emailRef = await addDoc(collection(db, 'mail'), emailData);
    console.log('✅ Email de test ajouté à la queue:', emailRef.id);
    return { success: true, emailId: emailRef.id };

  } catch (error) {
    console.error('❌ Erreur email de test:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
  }
};