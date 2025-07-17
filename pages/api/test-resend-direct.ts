// 🧪 API de test direct pour Resend - Diagnostic complet
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log('🧪 === TEST DIRECT RESEND ===');
    
    // 1️⃣ Vérifier les variables d'environnement
    const resendKey = process.env.RESEND_API_KEY;
    console.log('🔑 RESEND_API_KEY présente:', !!resendKey);
    console.log('🔑 Format clé:', resendKey?.startsWith('re_') ? 'Valide' : 'Invalide');
    
    if (!resendKey) {
      return res.status(500).json({
        success: false,
        error: '❌ RESEND_API_KEY manquante dans .env.local'
      });
    }

    if (!resendKey.startsWith('re_')) {
      return res.status(500).json({
        success: false,
        error: '❌ Format de clé API Resend invalide (doit commencer par "re_")'
      });
    }

    // 2️⃣ Test direct avec l'API Resend
    console.log('📧 Test direct avec l\'API Resend...');
    
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email requis pour le test'
      });
    }

    // 3️⃣ Appel direct à l'API Resend
    const emailPayload = {
      from: 'Test Exercide <onboarding@resend.dev>',
      to: [email],
      subject: '🧪 Test Direct Resend - Diagnostic',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center;">
            <h1>🧪 Test Direct Resend</h1>
            <p>Si vous recevez cet email, Resend fonctionne parfaitement !</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <h2>✅ Configuration validée</h2>
            <p><strong>Date :</strong> ${new Date().toLocaleString('fr-FR')}</p>
            <p><strong>Destinataire :</strong> ${email}</p>
            <p><strong>API :</strong> Resend</p>
            <p><strong>Domaine :</strong> onboarding@resend.dev (test)</p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #666;">
            <p>🎉 Votre configuration Resend est opérationnelle !</p>
          </div>
        </div>
      `,
      text: `
Test Direct Resend

✅ Configuration validée !

Date: ${new Date().toLocaleString('fr-FR')}
Destinataire: ${email}
API: Resend
Domaine: onboarding@resend.dev (test)

🎉 Votre configuration Resend est opérationnelle !
      `
    };

    console.log('📤 Envoi vers:', email);
    console.log('📤 From:', emailPayload.from);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    console.log('📡 Statut réponse Resend:', response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Erreur Resend API:', errorData);
      
      return res.status(500).json({
        success: false,
        error: `Erreur Resend API (${response.status}): ${errorData}`,
        details: {
          status: response.status,
          response: errorData
        }
      });
    }

    const result = await response.json();
    console.log('✅ Résultat Resend:', result);

    return res.status(200).json({
      success: true,
      message: '✅ Email envoyé avec succès !',
      messageId: result.id,
      result: result,
      config: {
        hasApiKey: true,
        keyFormat: 'valid',
        environment: process.env.NODE_ENV
      }
    });

  } catch (error) {
    console.error('❌ Erreur test direct:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}