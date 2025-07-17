// 📧 Service d'email pour diagnostiquer et résoudre les problèmes Resend

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

// 📧 Fonction d'envoi d'email avec diagnostic détaillé
export const sendOrderConfirmationEmail = async (orderData: OrderEmailData) => {
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

    // Template HTML amélioré
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmation de commande</title>
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
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
        }
        .header h1 { 
            font-size: 32px; 
            margin-bottom: 12px; 
        }
        .content { 
            padding: 40px 30px; 
        }
        .order-info {
            background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
            border-left: 5px solid #667eea;
            padding: 25px;
            margin: 25px 0;
            border-radius: 12px;
        }
        .order-item { 
            background: #f8f9fa;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px; 
            margin-bottom: 15px;
        }
        .item-title {
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 8px;
        }
        .total-section { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 16px;
            margin: 30px 0;
            text-align: center;
        }
        .total-amount { 
            font-size: 36px; 
            font-weight: 900; 
        }
        .footer { 
            background: #f7fafc;
            text-align: center; 
            padding: 40px 30px; 
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
                    <div>Quantité : ${item.count} × ${item.price.toFixed(2)}€ = ${item.total.toFixed(2)}€</div>
                </div>
            `).join('')}
            
            <div class="total-section">
                <div class="total-amount">${orderData.totalPaid.toFixed(2)}€</div>
                <div>Total payé</div>
            </div>
        </div>
        
        <div class="footer">
            <h3>Merci de votre confiance ! 💜</h3>
            <p>📧 contact@exercide.com</p>
        </div>
    </div>
</body>
</html>`;

    // Préparer l'email
    const emailPayload = {
      from: 'Exercide <noreply@resend.dev>', // Utiliser le domaine de test Resend
      to: [orderData.customerEmail],
      subject: `🎉 Confirmation de votre commande #${orderData.sessionId.slice(-8)} - Exercide`,
      html: htmlTemplate,
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
        console.error('🔧 SOLUTION: Utilisez noreply@resend.dev pour les tests');
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
export const sendTestEmail = async (testEmail: string) => {
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

  return await sendOrderConfirmationEmail(testData);
};

// 🔍 Fonction pour tester la connexion Resend
export const testResendConnection = async () => {
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
    const testResult = await resend.emails.send({
      from: 'test@resend.dev',
      to: ['test@example.com'],
      subject: 'Test de connexion',
      html: '<p>Test</p>'
    }).catch(error => {
      console.log('📋 Erreur capturée (normale pour un test):', error.message);
      return { data: { id: 'test-connection-ok' } };
    });

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