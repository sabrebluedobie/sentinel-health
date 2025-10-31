// src/pages/DexcomCallback.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { dexcomService } from '@/services/dexcomService';

const DexcomCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setStatus('error');
      setError('Authorization was denied or cancelled');
      setTimeout(() => navigate('/settings'), 3000);
      return;
    }

    if (!code || !state) {
      setStatus('error');
      setError('Invalid callback parameters');
      setTimeout(() => navigate('/settings'), 3000);
      return;
    }

    try {
      await dexcomService.handleCallback(code, state);
      setStatus('success');
      setTimeout(() => navigate('/settings'), 2000);
    } catch (err) {
      console.error('Error handling Dexcom callback:', err);
      setStatus('error');
      setError(err.message || 'Failed to connect to Dexcom');
      setTimeout(() => navigate('/settings'), 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {status === 'processing' && (
          <div className="text-center">
            <Loader2 className="h-16 w-16 animate-spin text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Connecting to Dexcom
            </h2>
            <p className="text-gray-600">
              Please wait while we complete the connection...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Successfully Connected!
            </h2>
            <p className="text-gray-600">
              Your Dexcom account has been connected. Redirecting...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Connection Failed
            </h2>
            <p className="text-gray-600 mb-4">
              {error}
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to settings...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DexcomCallback;