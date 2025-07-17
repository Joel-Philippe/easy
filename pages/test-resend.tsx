// 🧪 Page de test pour diagnostiquer Resend
import React, { useState } from 'react';

const TestResendPage: React.FC = () => {
  const [testEmail, setTestEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTest = async () => {
    if (!testEmail) {
      alert('Veuillez entrer un email');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-resend-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: testEmail }),
      });
      
      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        alert('✅ Email envoyé ! Vérifiez votre boîte email (et les spams)');
      } else {
        alert('❌ Erreur: ' + data.error);
      }
    } catch (error) {
      setResult({ 
        success: false, 
        error: 'Erreur lors du test: ' + (error as Error).message 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '50px auto', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '30px',
        borderRadius: '12px',
        textAlign: 'center',
        marginBottom: '30px'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '28px' }}>
          🧪 Test Direct Resend
        </h1>
        <p style={{ margin: 0, opacity: 0.9 }}>
          Diagnostiquez votre configuration email
        </p>
      </div>

      <div style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: 'bold',
            color: '#374151'
          }}>
            📧 Votre email de test :
          </label>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="votre-email@example.com"
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <button
          onClick={handleTest}
          disabled={isLoading || !testEmail}
          style={{
            width: '100%',
            background: isLoading ? '#9ca3af' : '#10b981',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s ease'
          }}
        >
          {isLoading ? '📤 Envoi en cours...' : '🚀 Tester Resend'}
        </button>

        {result && (
          <div style={{
            marginTop: '20px',
            padding: '16px',
            borderRadius: '8px',
            background: result.success ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${result.success ? '#bbf7d0' : '#fecaca'}`
          }}>
            <h3 style={{ 
              margin: '0 0 10px 0',
              color: result.success ? '#166534' : '#991b1b'
            }}>
              {result.success ? '✅ Succès' : '❌ Erreur'}
            </h3>
            <pre style={{ 
              background: 'rgba(0,0,0,0.05)', 
              padding: '10px', 
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px',
              margin: 0
            }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div style={{
        background: '#fffbeb',
        border: '1px solid #fbbf24',
        borderRadius: '12px',
        padding: '20px',
        marginTop: '20px'
      }}>
        <h3 style={{ color: '#92400e', marginBottom: '10px' }}>
          📋 Instructions
        </h3>
        <ol style={{ color: '#78350f', lineHeight: '1.6' }}>
          <li>Entrez votre email de test</li>
          <li>Cliquez sur "Tester Resend"</li>
          <li>Vérifiez votre boîte email (et les spams !)</li>
          <li>Si ça marche ici mais pas dans les commandes, le problème est ailleurs</li>
        </ol>
      </div>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          onClick={() => window.history.back()}
          style={{
            background: '#6b7280',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          ← Retour
        </button>
      </div>
    </div>
  );
};

export default TestResendPage;