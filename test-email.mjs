// 🧪 Script de test pour vérifier l'envoi d'email
import { sendTestEmail } from './src/utils/emailService.js';

async function testEmailSystem() {
  console.log('🧪 Test du système d\'email...');
  
  try {
    const result = await sendTestEmail('philipff@gmail.com');
    
    if (result.success) {
      console.log('✅ Email de test envoyé avec succès !');
      console.log('📧 ID de l\'email:', result.emailId);
      console.log('🔍 Vérifiez votre boîte mail et la console Firebase');
    } else {
      console.error('❌ Erreur lors de l\'envoi:', result.error);
    }
  } catch (error) {
    console.error('❌ Erreur du test:', error);
  }
}

// Lancer le test
testEmailSystem();