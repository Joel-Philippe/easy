// 🔍 Composant de diagnostic pour les emails
import React, { useState } from 'react';

const EmailDebugComponent: React.FC = () => {
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
    <div style={{ 
      maxWidth: '800px', 
      margin: '20px auto', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <h1>🔍 Diagnostic Email Resend</h1>
        <p>Outil de diagnostic pour résoudre les problèmes d'envoi d'emails</p>
      </div>

      {/* Section Diagnostic */}
      <div style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2>1. 🔍 Diagnostic de la configuration</h2>
        <button
          onClick={handleDiagnostic}
          disabled={isLoading}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            marginBottom: '15px'
          }}
        >
          {isLoading ? 'Diagnostic en cours...' : '🔍 Lancer le diagnostic'}
        </button>

        {diagnostics && (
          <div style={{
            background: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            padding: '15px',
            fontSize: '14px'
          }}>
            <h3>📋 Résultats du diagnostic :</h3>
            <pre style={{ 
              background: '#f1f3f4', 
              padding: '10px', 
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px'
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
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2>2. 📧 Test d'envoi d'email</h2>
        <div style={{ marginBottom: '15px' }}>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="votre-email@example.com"
            style={{
              width: '300px',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              marginRight: '10px'
            }}
          />
          <button
            onClick={handleTestEmail}
            disabled={isLoading || !testEmail}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            {isLoading ? 'Envoi...' : '📧 Envoyer test'}
          </button>
        </div>

        {result && (
          <div style={{
            background: result.success ? '#d1fae5' : '#fef2f2',
            border: `1px solid ${result.success ? '#a7f3d0' : '#fecaca'}`,
            borderRadius: '8px',
            padding: '15px',
            fontSize: '14px'
          }}>
            <h3>{result.success ? '✅ Succès' : '❌ Erreur'}</h3>
            <pre style={{ 
              background: 'rgba(0,0,0,0.05)', 
              padding: '10px', 
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={{
        background: '#fffbeb',
        border: '1px solid #fbbf24',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <h2>📋 Instructions de dépannage</h2>
        <ol style={{ lineHeight: '1.6' }}>
          <li><strong>Vérifiez votre fichier .env.local :</strong>
            <pre style={{ background: '#f3f4f6', padding: '8px', borderRadius: '4px', fontSize: '12px' }}>
RESEND_API_KEY=re_votre_cle_api_resend
            </pre>
          </li>
          <li><strong>Redémarrez votre serveur</strong> après avoir modifié .env.local</li>
          <li><strong>Vérifiez les logs</strong> dans la console du navigateur et du serveur</li>
          <li><strong>Testez d'abord</strong> avec le diagnostic, puis avec l'envoi d'email</li>
        </ol>
      </div>
    </div>
  );
};

export default EmailDebugComponent;
