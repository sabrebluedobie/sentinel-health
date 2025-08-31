// src/components/NightscoutSignin.jsx
import React, { useState } from 'react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';

export default function NightscoutSignin() {
  const [formData, setFormData] = useState({
    url: '',
    token: '',
    api_secret: ''
  });
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  
  const user = useUser();
  const supabase = useSupabaseClient();

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('');
    
    try {
      if (!user) {
        setStatus('Please sign in first');
        setIsLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        setStatus('No valid session found');
        setIsLoading(false);
        return;
      }
      
      const response = await fetch('/api/nightscout/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.ok) {
        setStatus('Saved ✓');
        // Optionally test the connection immediately after saving
        setTimeout(() => testConnection(), 500);
      } else {
        setStatus(`Error: ${result.error}`);
      }
    } catch (error) {
      setStatus('Failed to save connection');
      console.error('Save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    if (!formData.url) {
      setStatus('URL required for testing');
      return;
    }
    
    setIsLoading(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/nightscout/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.ok) {
        setStatus('Connection tested ✓');
        setTestResult(result.latest);
      } else {
        setStatus(`Test failed: ${result.error}`);
        setTestResult(null);
      }
    } catch (error) {
      setStatus('Test connection failed');
      setTestResult(null);
      console.error('Test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const syncData = async () => {
    if (!user) {
      setStatus('Please sign in first');
      return;
    }

    setIsLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const response = await fetch('/api/nightscout/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sinceDays: 7 }) // Sync last 7 days
      });
      
      const result = await response.json();
      
      if (result.ok) {
        setStatus(`Synced ${result.inserted} readings ✓`);
      } else {
        setStatus(`Sync failed: ${result.error}`);
      }
    } catch (error) {
      setStatus('Sync failed');
      console.error('Sync error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="nightscout-signin">
      <h2>Connect to Nightscout</h2>
      
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium mb-1">
            Nightscout URL *
          </label>
          <input
            id="url"
            type="url"
            placeholder="https://yoursite.herokuapp.com"
            value={formData.url}
            onChange={(e) => setFormData({...formData, url: e.target.value})}
            required
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label htmlFor="token" className="block text-sm font-medium mb-1">
            Token (optional)
          </label>
          <input
            id="token"
            type="text"
            placeholder="Your Nightscout token"
            value={formData.token}
            onChange={(e) => setFormData({...formData, token: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label htmlFor="api_secret" className="block text-sm font-medium mb-1">
            API Secret (optional)
          </label>
          <input
            id="api_secret"
            type="password"
            placeholder="Your Nightscout API secret"
            value={formData.api_secret}
            onChange={(e) => setFormData({...formData, api_secret: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-2">
          <button 
            type="submit" 
            disabled={isLoading || !formData.url}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Save Connection'}
          </button>
          
          <button 
            type="button" 
            onClick={testConnection} 
            disabled={isLoading || !formData.url}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Test Connection
          </button>
          
          <button 
            type="button" 
            onClick={syncData} 
            disabled={isLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Sync Data
          </button>
        </div>
      </form>
      
      {status && (
        <div className={`mt-4 p-3 rounded ${
          status.includes('✓') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {status}
        </div>
      )}
      
      {testResult && (
        <div className="mt-4 p-3 bg-blue-100 text-blue-800 rounded">
          <h4 className="font-semibold">Latest Reading:</h4>
          <p>Value: {testResult.sgv} mg/dL</p>
          <p>Direction: {testResult.direction}</p>
          <p>Time: {new Date(testResult.date).toLocaleString()}</p>
        </div>
      )}
      
      <div className="mt-6 text-sm text-gray-600">
        <p><strong>Note:</strong> You need either a token OR an API secret to connect to Nightscout.</p>
        <p>• Token: Found in Nightscout settings under "API Secret"</p>
        <p>• API Secret: Your original Nightscout password/secret</p>
      </div>
    </div>
  );
}