// src/components/settings/DexcomSettings.jsx
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { dexcomService } from '@/services/dexcomService';

const DexcomSettings = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      setIsLoading(true);
      const status = await dexcomService.checkConnection();
      setIsConnected(status.connected);
      setLastSync(status.lastSync);
      setError(null);
    } catch (err) {
      console.error('Error checking Dexcom connection:', err);
      setError('Failed to check connection status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await dexcomService.initiateAuth();
    } catch (err) {
      console.error('Error connecting to Dexcom:', err);
      setError('Failed to connect to Dexcom. Please try again.');
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect Dexcom? Your glucose data will no longer sync automatically.')) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await dexcomService.disconnect();
      setIsConnected(false);
      setLastSync(null);
      setSyncStatus('Disconnected successfully');
    } catch (err) {
      console.error('Error disconnecting from Dexcom:', err);
      setError('Failed to disconnect. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSyncStatus('Syncing...');
      
      const result = await dexcomService.syncGlucoseData();
      
      if (result.success) {
        setSyncStatus(`Synced ${result.recordsAdded} glucose readings`);
        setLastSync(new Date());
      } else {
        setError('Sync completed with errors');
      }
    } catch (err) {
      console.error('Error syncing Dexcom data:', err);
      setError('Failed to sync data. Please try again.');
      setSyncStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !isConnected) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Dexcom Clarity
              {isConnected ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-gray-400" />
              )}
            </CardTitle>
            <CardDescription>
              Connect your Dexcom account to automatically import glucose data
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {syncStatus && (
          <Alert>
            <AlertDescription>{syncStatus}</AlertDescription>
          </Alert>
        )}

        {isConnected ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <div className="flex items-center gap-2 text-green-800 font-medium mb-2">
                <CheckCircle2 className="h-5 w-5" />
                Connected to Dexcom
              </div>
              {lastSync && (
                <p className="text-sm text-green-700">
                  Last synced: {new Date(lastSync).toLocaleString()}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleSync}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  'Sync Now'
                )}
              </Button>
              <Button
                onClick={handleDisconnect}
                variant="outline"
                disabled={isLoading}
                className="flex-1"
              >
                Disconnect
              </Button>
            </div>

            <div className="text-sm text-gray-600 space-y-2">
              <p>
                • Glucose data automatically syncs every 3 hours
              </p>
              <p>
                • Recent readings appear in your health metrics
              </p>
              <p>
                • Glucose levels are associated with nearby migraine logs
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
              <p className="text-sm text-gray-700 mb-3">
                Connect your Dexcom account to automatically import your continuous glucose monitoring data into Sentrya.
              </p>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>View glucose trends alongside migraine patterns</li>
                <li>Identify correlations between glucose levels and migraines</li>
                <li>Automatic syncing every 3 hours</li>
                <li>Secure OAuth 2.0 connection</li>
              </ul>
            </div>

            <Button
              onClick={handleConnect}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  Connect Dexcom Account
                  <ExternalLink className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              You'll be redirected to Dexcom to authorize access
            </p>
          </div>
        )}

        <div className="pt-4 border-t">
          <a
            href="https://www.dexcom.com/clarity"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            Learn more about Dexcom Clarity
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
};

export default DexcomSettings;