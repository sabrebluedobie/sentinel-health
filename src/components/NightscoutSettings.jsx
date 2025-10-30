// src/components/NightscoutSettings.jsx
import { useState, useEffect } from 'react';
import { useNightscout } from '../hooks/useNightscout';

export default function NightscoutSettings() {
  const { 
    loading, 
    error, 
    getConnection, 
    saveConnection, 
    testConnection 
  } = useNightscout();

  const [formData, setFormData] = useState({
    nightscout_url: '',
    api_secret: ''
  });
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Check for existing connection on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    const result = await getConnection();
    if (result.ok && result.connected) {
      setIsConnected(true);
      setConnectionStatus({
        type: 'success',
        message: `Connected to ${result.connection?.nightscout_url || 'Nightscout'}`
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setConnectionStatus(null);
    setTestResult(null);

    if (!formData.nightscout_url || !formData.api_secret) {
      setConnectionStatus({
        type: 'error',
        message: 'Please fill in both fields'
      });
      return;
    }

    const result = await saveConnection(formData);
    
    if (result.ok) {
      setIsConnected(true);
      setConnectionStatus({
        type: 'success',
        message: 'Nightscout connection saved successfully!'
      });
      // Clear the API secret from form for security
      setFormData(prev => ({ ...prev, api_secret: '' }));
    } else {
      setConnectionStatus({
        type: 'error',
        message: result.error || 'Failed to save connection'
      });
    }
  };

  const handleTest = async () => {
    setTestResult(null);
    const result = await testConnection();
    
    if (result.ok) {
      setTestResult({
        type: 'success',
        message: `✓ Connected to Nightscout v${result.version || 'unknown'}`
      });
    } else {
      setTestResult({
        type: 'error',
        message: result.error || 'Connection test failed'
      });
    }
  };

  return (
    <div className="nightscout-settings">
      <h2>Nightscout Integration</h2>
      
      {isConnected && (
        <div className="alert alert-success">
          <p>✓ Nightscout is connected</p>
          <button 
            onClick={handleTest} 
            disabled={loading}
            className="btn-secondary"
          >
            Test Connection
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="nightscout-form">
        <div className="form-group">
          <label htmlFor="nightscout_url">
            Nightscout URL
            <span className="help-text">
              (e.g., https://your-site.herokuapp.com or https://your-site.vercel.app)
            </span>
          </label>
          <input
            type="url"
            id="nightscout_url"
            value={formData.nightscout_url}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              nightscout_url: e.target.value 
            }))}
            placeholder="https://your-nightscout-site.com"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="api_secret">
            API Secret
            <span className="help-text">
              (Your Nightscout API secret - found in your Nightscout settings)
            </span>
          </label>
          <input
            type="password"
            id="api_secret"
            value={formData.api_secret}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              api_secret: e.target.value 
            }))}
            placeholder="Enter your API secret"
            disabled={loading}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Connecting...' : isConnected ? 'Update Connection' : 'Connect Nightscout'}
        </button>
      </form>

      {connectionStatus && (
        <div className={`alert alert-${connectionStatus.type}`}>
          {connectionStatus.message}
        </div>
      )}

      {testResult && (
        <div className={`alert alert-${testResult.type}`}>
          {testResult.message}
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <style jsx>{`
        .nightscout-settings {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }

        h2 {
          margin-bottom: 20px;
        }

        .nightscout-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        label {
          font-weight: 600;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .help-text {
          font-size: 0.85rem;
          font-weight: normal;
          color: #666;
        }

        input {
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 1rem;
        }

        input:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }

        button {
          padding: 12px 24px;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #0056b3;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
          margin-top: 10px;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #545b62;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .alert {
          padding: 12px;
          border-radius: 4px;
          margin-top: 16px;
        }

        .alert-success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .alert-error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
      `}</style>
    </div>
  );
}