// 🧪 API de test pour diagnostiquer l'envoi d'emails - Version simplifiée
import type { NextApiRequest, NextApiResponse } from "next";

// 🔧 Fonction de diagnostic intégrée
const diagnoseEmailConfig = () => {
  console.log('🔍 === DIAGNOSTIC CONFIGURATION EMAIL ===');
  
  const resendKey = process.env.RESEND_API_KEY;
  const nodeEnv = process.env.NODE_ENV;
  
  console.log('📋 Variables d\'environnement:');
  console.log('- RESEND_API_KEY:', resendKey ? `✅ Présente (${resendKey.substring(0, 8)}...)` : '❌ Manquante');
  console.log('- NODE_ENV:', nodeEnv);
  
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

// 📧 Fonction d'envoi d'email de test intégrée
const sendTestEmail = async (testEmail: string) => {
  try {
    console.log('📧 === DÉBUT ENVOI EMAIL DE TEST ===');
    
    // Diagnostic de la configuration
    const config = diagnoseEmailConfig();
    if (!config.hasResendKey) {
      throw new Error('❌ RESEND_API_KEY manquante dans les variables d\'environnement');
    }
    if (!config.keyFormat) {
      throw new Error('❌ Format de clé API Resend invalide');
    }

    console.log('✅ Configuration validée');

    // Import dynamique de Resend
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    console.log('✅ Instance Resend créée');

    // Template HTML simple
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Email Resend</title>
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
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 Test Email Resend</h1>
        <p>Email de test envoyé avec succès !</p>
    </div>
    
    <div class="content">
        <h2>✅ Configuration Resend fonctionnelle</h2>
        <p><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
        <p><strong>Destinataire :</strong> ${testEmail}</p>
        <p>Si vous recevez cet email, votre configuration Resend fonctionne parfaitement !</p>
    </div>
</body>
</html>`;

    // Préparer l'email
    const emailPayload = {
      from: 'Test Exercide <onboarding@resend.dev>',
      to: [testEmail],
      subject: '🧪 Test Email Resend - Configuration OK',
      html: htmlTemplate,
      text: `
Test Email Resend

✅ Configuration Resend fonctionnelle !

Date: ${new Date().toLocaleDateString('fr-FR')}
Destinataire: ${testEmail}

Si vous recevez cet email, votre configuration Resend fonctionne parfaitement !
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
    console.error('📝 Message:', error instanceof Error ? error.message : 'Erreur inconnue');
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      provider: 'resend'
    };
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log('🧪 === API TEST EMAIL DÉMARRÉE ===');
    
    // Diagnostic de la configuration
    const config = diagnoseEmailConfig();
    console.log('📋 Configuration:', config);

    if (!config.hasResendKey || !config.keyFormat) {
      return res.status(500).json({
        success: false,
        error: 'Configuration Resend invalide',
        details: !config.hasResendKey ? 'RESEND_API_KEY manquante' : 'Format de clé invalide',
        config
      });
    }

    // Récupérer l'email de test
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email requis pour le test'
      });
    }

    console.log('📧 Envoi email de test vers:', email);

    // Envoyer l'email de test
    const result = await sendTestEmail(email);
    
    console.log('📋 Résultat final:', result);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Email de test envoyé avec succès !',
        messageId: result.messageId,
        config
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        config
      });
    }

  } catch (error) {
    console.error('❌ Erreur API test email:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}