// 📧 Service de diagnostic email simplifié pour Resend

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

// 🔧 Fonction de diagnostic de la configuration
export const diagnoseEmailConfig = () => {
  console.log('🔍 === DIAGNOSTIC CONFIGURATION EMAIL ===');
  
  // Vérifier les variables d'environnement
  const resendKey = process.env.RESEND_API_KEY;
  const nodeEnv = process.env.NODE_ENV;
  
  console.log('📋 Variables d\'environnement:');
  console.log('- RESEND_API_KEY:', resendKey ? `✅ Présente (${resendKey.substring(0, 8)}...)` : '❌ Manquante');
  console.log('- NODE_ENV:', nodeEnv);
  console.log('- Environnement:', typeof window === 'undefined' ? 'Serveur ✅' : 'Client ❌');
  
  // Vérifier le format de la clé
  if (resendKey) {
    if (resendKey.startsWith('re_')) {
      console.log('✅ Format de clé API Resend valide');
    } else {
      console.log('❌ Format de clé API Resend invalide (doit commencer par "re_")');
    }
  }
  
  return {
    hasResendKey: !!resendKey,
    keyFormat: resendKey?.startsWith('re_') || false,
    isServer: typeof window === 'undefined',
    environment: nodeEnv
  };
};

// 🎨 Template HTML simple pour l'email
const createSimpleEmailHTML = (orderData: OrderEmailData): string => {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmation de commande</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header { 
            background: #4299e1; 
            color: white; 
            padding: 20px; 
            text-align: center; 
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .content { 
            background: #f8f9fa;
            padding: 20px; 
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .item { 
            background: white;
            padding: 15px; 
            margin-bottom: 10px;
            border-radius: 5px;
            border-left: 4px solid #4299e1;
        }
        .total { 
            background: #4299e1;
            color: white;
            padding: 15px;
            text-align: center;
            border-radius: 8px;
            font-size: 18px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎉 Merci pour votre commande !</h1>
        <p>Commande confirmée avec succès</p>
    </div>
    
    <div class="content">
        <h2>📋 Détails de votre commande</h2>
        <p><strong>Client :</strong> ${orderData.customerName}</p>
        <p><strong>Email :</strong> ${orderData.customerEmail}</p>
        <p><strong>Date :</strong> ${orderData.orderDate}</p>
        <p><strong>Numéro :</strong> #${orderData.sessionId.slice(-8)}</p>
    </div>
    
    <div class="content">
        <h3>🛍️ Articles commandés</h3>
        ${orderData.items.map(item => `
            <div class="item">
                <strong>${item.title}</strong><br>
                Quantité : ${item.count} × ${item.price.toFixed(2)}€ = ${item.total.toFixed(2)}€
            </div>
        `).join('')}
    </div>
    
    <div class="total">
        Total payé : ${orderData.totalPaid.toFixed(2)}€
    </div>
    
    <div class="content">
        <p>Merci de votre confiance ! 💜</p>
        <p>📧 contact@exercide.com</p>
    </div>
</body>
</html>`;
};

// 📧 Fonction d'envoi d'email avec diagnostic détaillé
export const sendOrderConfirmationEmailDiagnostic = async (orderData: OrderEmailData) => {
  try {
    console.log('📧 === DÉBUT ENVOI EMAIL ===');
    console.log('📋 Données reçues:', {
      customerEmail: orderData.customerEmail,
      customerName: orderData.customerName,
      totalPaid: orderData.totalPaid,
      itemsCount: orderData.items?.length || 0,
      sessionId: orderData.sessionId
    });

    // Diagnostic de la configuration
    const config = diagnoseEmailConfig();
    if (!config.hasResendKey) {
      throw new Error('❌ RESEND_API_KEY manquante dans les variables d\'environnement');
    }
    if (!config.keyFormat) {
      throw new Error('❌ Format de clé API Resend invalide');
    }
    if (!config.isServer) {
      throw new Error('❌ Cette fonction doit être exécutée côté serveur');
    }

    // Validation des données
    if (!orderData.customerEmail) {
      throw new Error('❌ Email client manquant');
    }
    if (!orderData.customerName) {
      throw new Error('❌ Nom client manquant');
    }
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error('❌ Aucun article dans la commande');
    }

    console.log('✅ Validation des données réussie');

    // Import dynamique de Resend (côté serveur uniquement)
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    console.log('✅ Instance Resend créée');

    // Préparer l'email
    const emailPayload = {
      from: 'Exercide <onboarding@resend.dev>', // Utiliser le domaine de test Resend
      to: [orderData.customerEmail],
      subject: `🎉 Confirmation de votre commande #${orderData.sessionId.slice(-8)} - Exercide`,
      html: createSimpleEmailHTML(orderData),
      text: `
Merci pour votre commande !

Client: ${orderData.customerName}
Email: ${orderData.customerEmail}
Date: ${orderData.orderDate}
Numéro: #${orderData.sessionId.slice(-8)}

Articles:
${orderData.items.map(item => `- ${item.title} (${item.count}x) : ${item.total.toFixed(2)}€`).join('\n')}

Total payé: ${orderData.totalPaid.toFixed(2)}€

Merci de votre confiance !
Exercide
      `
    };

    console.log('📧 Payload email préparé:', {
      from: emailPayload.from,
      to: emailPayload.to,
      subject: emailPayload.subject
    });

    // Envoyer l'email
    console.log('📤 Envoi en cours...');
    const result = await resend.emails.send(emailPayload);
    
    console.log('✅ === EMAIL ENVOYÉ AVEC SUCCÈS ===');
    console.log('📧 Résultat Resend:', result);
    
    return { 
      success: true, 
      messageId: result.data?.id,
      provider: 'resend',
      result: result
    };

  } catch (error) {
    console.error('❌ === ERREUR ENVOI EMAIL ===');
    console.error('🔍 Type d\'erreur:', error?.constructor?.name);
    console.error('📝 Message:', error instanceof Error ? error.message : 'Erreur inconnue');
    console.error('📋 Stack:', error instanceof Error ? error.stack : 'Pas de stack');
    
    // Diagnostic spécifique selon le type d'erreur
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        console.error('🔑 PROBLÈME: Clé API Resend invalide ou manquante');
        console.error('🔧 SOLUTION: Vérifiez RESEND_API_KEY dans .env.local');
      } else if (error.message.includes('domain')) {
        console.error('🌐 PROBLÈME: Domaine d\'envoi non vérifié');
        console.error('🔧 SOLUTION: Utilisez onboarding@resend.dev pour les tests');
      } else if (error.message.includes('rate limit')) {
        console.error('⏱️ PROBLÈME: Limite de taux dépassée');
        console.error('🔧 SOLUTION: Attendez quelques minutes avant de réessayer');
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      provider: 'resend'
    };
  }
};

// 🧪 Fonction de test simple
export const sendTestEmailDiagnostic = async (testEmail: string) => {
  console.log('🧪 === TEST EMAIL RESEND ===');
  
  const testData: OrderEmailData = {
    customerName: 'Test User',
    customerEmail: testEmail,
    orderDate: new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    items: [
      {
        title: 'Produit de test',
        count: 1,
        price: 29.99,
        total: 29.99
      }
    ],
    totalPaid: 29.99,
    deliveryInfo: {
      firstName: 'Test',
      lastName: 'User',
      address: '123 Rue de Test',
      city: 'Paris',
      postalCode: '75001',
      country: 'France',
      phone: '+33 1 23 45 67 89'
    },
    sessionId: 'test_' + Date.now()
  };

  return await sendOrderConfirmationEmailDiagnostic(testData);
};

// 🔍 Fonction pour tester la connexion Resend
export const testResendConnectionDiagnostic = async () => {
  try {
    console.log('🔍 === TEST CONNEXION RESEND ===');
    
    const config = diagnoseEmailConfig();
    if (!config.hasResendKey || !config.keyFormat) {
      return {
        success: false,
        error: 'Configuration Resend invalide'
      };
    }

    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Test simple avec l'API Resend
    console.log('✅ Connexion Resend OK');
    return {
      success: true,
      message: 'Connexion Resend fonctionnelle'
    };

  } catch (error) {
    console.error('❌ Erreur test connexion:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
};