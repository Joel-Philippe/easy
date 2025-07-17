import React, { useState } from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '../theme';

const EmailDebugPage: React.FC = () => {
  const [testEmail, setTestEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [diagnostics, setDiagnostics] = useState<any>(null);

  const handleDiagnostic = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/debug-webhook');
      const data = await response.json();
      setDiagnostics(data);
    } catch (error) {
      setDiagnostics({ error: 'Erreur lors du diagnostic' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      alert('Veuillez entrer un email');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: testEmail }),
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: 'Erreur lors du test' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChakraProvider theme={theme}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '20px auto', 
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
        minHeight: '100vh',
        backgroundColor: '#f7fafc'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '30px',
          borderRadius: '16px',
          marginBottom: '30px',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}>
          <h1 style={{ fontSize: '36px', marginBottom: '10px' }}>
            🔍 Diagnostic Email Resend
          </h1>
          <p style={{ fontSize: '18px', opacity: 0.9 }}>
            Diagnostiquez et résolvez les problèmes d'envoi d'emails
          </p>
        </div>

        {/* Section Diagnostic */}
        <div style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#2d3748' }}>
            1. 🔍 Diagnostic de la configuration
          </h2>
          <button
            onClick={handleDiagnostic}
            disabled={isLoading}
            style={{
              background: isLoading ? '#a0aec0' : 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '12px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginBottom: '20px',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(66, 153, 225, 0.3)'
            }}
          >
            {isLoading ? '🔍 Diagnostic en cours...' : '🔍 Lancer le diagnostic'}
          </button>

          {diagnostics && (
            <div style={{
              background: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '12px',
              padding: '20px',
              fontSize: '14px'
            }}>
              <h3 style={{ marginBottom: '15px', color: '#495057' }}>📋 Résultats du diagnostic :</h3>
              <pre style={{ 
                background: '#f1f3f4', 
                padding: '15px', 
                borderRadius: '8px',
                overflow: 'auto',
                fontSize: '12px',
                lineHeight: '1.4'
              }}>
                {JSON.stringify(diagnostics, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Section Test Email */}
        <div style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#2d3748' }}>
            2. 📧 Test d'envoi d'email
          </h2>
          <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="votre-email@example.com"
              style={{
                flex: '1',
                minWidth: '300px',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '16px',
                transition: 'border-color 0.2s ease',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4299e1'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
            <button
              onClick={handleTestEmail}
              disabled={isLoading || !testEmail}
              style={{
                background: isLoading || !testEmail ? '#a0aec0' : 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                cursor: isLoading || !testEmail ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(72, 187, 120, 0.3)'
              }}
            >
              {isLoading ? '📧 Envoi...' : '📧 Envoyer test'}
            </button>
          </div>

          {result && (
            <div style={{
              background: result.success ? '#f0fff4' : '#fef2f2',
              border: `2px solid ${result.success ? '#9ae6b4' : '#fecaca'}`,
              borderRadius: '12px',
              padding: '20px',
              fontSize: '14px'
            }}>
              <h3 style={{ 
                marginBottom: '15px', 
                color: result.success ? '#22543d' : '#742a2a',
                fontSize: '18px'
              }}>
                {result.success ? '✅ Succès' : '❌ Erreur'}
              </h3>
              <pre style={{ 
                background: 'rgba(0,0,0,0.05)', 
                padding: '15px', 
                borderRadius: '8px',
                overflow: 'auto',
                fontSize: '12px',
                lineHeight: '1.4'
              }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div style={{
          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
          border: '2px solid #f59e0b',
          borderRadius: '16px',
          padding: '30px'
        }}>
          <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#92400e' }}>
            📋 Instructions de dépannage
          </h2>
          <ol style={{ lineHeight: '1.8', color: '#78350f' }}>
            <li style={{ marginBottom: '10px' }}>
              <strong>Vérifiez votre fichier .env.local :</strong>
              <pre style={{ 
                background: '#f3f4f6', 
                padding: '10px', 
                borderRadius: '6px', 
                fontSize: '14px',
                margin: '8px 0',
                fontFamily: 'monospace'
              }}>
RESEND_API_KEY=re_votre_cle_api_resend
              </pre>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <strong>Redémarrez votre serveur</strong> après avoir modifié .env.local
            </li>
            <li style={{ marginBottom: '10px' }}>
              <strong>Vérifiez les logs</strong> dans la console du navigateur et du serveur
            </li>
            <li>
              <strong>Testez d'abord</strong> avec le diagnostic, puis avec l'envoi d'email
            </li>
          </ol>
        </div>

        {/* Bouton retour */}
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button
            onClick={() => window.history.back()}
            style={{
              background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
          >
            ← Retour à l'application
          </button>
        </div>
      </div>
    </ChakraProvider>
  );
};

export default EmailDebugPage;