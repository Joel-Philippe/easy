// 🧪 Test manuel pour créer la collection mail
import { addDoc, collection } from 'firebase/firestore';
import { db } from './src/components/firebaseConfig.js';

async function testEmailCreation() {
  console.log('🧪 Test de création d\'email...');
  
  try {
    // Test simple d'ajout à la collection mail
    const emailData = {
      to: ['airpolan@gmail.com'],
      from: 'philipff@gmail.com',
      subject: '🧪 Test d\'email - Exercide',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #667eea;">🧪 Test d'email réussi !</h1>
          <p>Si vous recevez cet email, la configuration Firebase fonctionne.</p>
          <p><strong>Date du test :</strong> ${new Date().toLocaleString('fr-FR')}</p>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Cet email a été envoyé depuis Exercide - Test manuel
          </p>
        </div>
      `
    };

    console.log('📧 Données email à envoyer:', emailData);

    // Ajouter à la collection mail
    const emailRef = await addDoc(collection(db, 'mail'), emailData);
    
    console.log('✅ Email ajouté à la collection mail avec ID:', emailRef.id);
    console.log('🔍 Vérifiez maintenant Firebase Console → Firestore → Collection "mail"');
    console.log('📧 Vérifiez aussi votre boîte email dans quelques minutes');
    
    return { success: true, emailId: emailRef.id };

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    return { success: false, error: error.message };
  }
}

// Lancer le test
testEmailCreation();