// 🔍 API pour diagnostiquer les webhooks Stripe - Version simplifiée
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log('🔍 === DIAGNOSTIC WEBHOOK ===');
    
    // Vérifier les variables d'environnement
    const resendKey = process.env.RESEND_API_KEY;
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const nodeEnv = process.env.NODE_ENV;
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv,
        isServer: typeof window === 'undefined'
      },
      stripe: {
        hasSecretKey: !!stripeSecret,
        secretKeyFormat: stripeSecret?.startsWith('sk_') || false,
        hasWebhookSecret: !!webhookSecret,
        webhookSecretFormat: webhookSecret?.startsWith('whsec_') || false
      },
      email: {
        hasResendKey: !!resendKey,
        keyFormat: resendKey?.startsWith('re_') || false,
        isServer: typeof window === 'undefined',
        environment: nodeEnv
      },
      recommendations: []
    };

    // Générer des recommandations
    if (!diagnostics.email.hasResendKey) {
      diagnostics.recommendations.push('❌ Ajouter RESEND_API_KEY dans .env.local');
    }
    if (!diagnostics.email.keyFormat) {
      diagnostics.recommendations.push('❌ Vérifier le format de RESEND_API_KEY (doit commencer par "re_")');
    }
    if (!diagnostics.stripe.hasSecretKey) {
      diagnostics.recommendations.push('❌ Ajouter STRIPE_SECRET_KEY dans .env.local');
    }
    if (!diagnostics.stripe.hasWebhookSecret) {
      diagnostics.recommendations.push('❌ Ajouter STRIPE_WEBHOOK_SECRET dans .env.local');
    }
    if (diagnostics.recommendations.length === 0) {
      diagnostics.recommendations.push('✅ Configuration semble correcte');
    }

    console.log('📋 Diagnostic complet:', diagnostics);

    res.status(200).json(diagnostics);

  } catch (error) {
    console.error('❌ Erreur diagnostic:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}