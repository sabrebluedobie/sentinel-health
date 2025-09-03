import React, { useState } from 'react';
import { AlertCircle, CheckCircle, XCircle, Wrench } from 'lucide-react';

const TroubleshootingButton = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults(null);

    const checks = [];

    // Check 1: Environment Variables
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    checks.push({
      name: "Environment Variables",
      status: hasSupabaseUrl && hasSupabaseKey ? "pass" : "fail",
      message: hasSupabaseUrl && hasSupabaseKey 
        ? "Supabase environment variables are set" 
        : "Missing Supabase environment variables"
    });

    // Check 2: Supabase Connection
    try {
      // This would be your actual supabase client
      // const { data, error } = await supabase.from('your_table').select('count').limit(1);
      
      // Simulating for demo
      const connectionTest = true; // Replace with actual test
      
      checks.push({
        name: "Supabase Connection",
        status: connectionTest ? "pass" : "fail",
        message: connectionTest ? "Successfully connected to Supabase" : "Failed to connect to Supabase"
      });
    } catch (error) {
      checks.push({
        name: "Supabase Connection",
        status: "fail",
        message: `Connection error: ${error.message}`
      });
    }

    // Check 3: Authentication
    try {
      // const { data: { user } } = await supabase.auth.getUser();
      
      const authTest = true; // Replace with actual auth check
      checks.push({
        name: "Authentication",
        status: authTest ? "pass" : "warning",
        message: authTest ? "User authentication working" : "No authenticated user"
      });
    } catch (error) {
      checks.push({
        name: "Authentication",
        status: "fail",
        message: `Auth error: ${error.message}`
      });
    }

    // Check 4: Network Status
    const networkTest = navigator.onLine;
    checks.push({
      name: "Network Connection",
      status: networkTest ? "pass" : "fail",
      message: networkTest ? "Network connection active" : "No network connection"
    });

    // Simulate some async time
    await new Promise(resolve => setTimeout(resolve, 1500));

    setResults(checks);
    setIsRunning(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pass':
        return 'border-green-200 bg-green-50';
      case 'fail':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">App Diagnostics</h2>
        <p className="text-gray-600 text-sm">
          Run diagnostics to check your app's health
        </p>
      </div>

      <button
        onClick={runDiagnostics}
        disabled={isRunning}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
          isRunning
            ? 'bg-blue-100 text-blue-600 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
        }`}
      >
        <Wrench className={`w-5 h-5 ${isRunning ? 'animate-spin' : ''}`} />
        {isRunning ? 'Running Diagnostics...' : 'Run Diagnostics'}
      </button>

      {results && (
        <div className="mt-6 space-y-3">
          <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
            Results
          </h3>
          {results.map((check, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${getStatusColor(check.status)}`}
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(check.status)}
                <div className="flex-1">
                  <div className="font-medium text-gray-800 text-sm">
                    {check.name}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {check.message}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {results.some(r => r.status === 'fail') && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 text-sm mb-2">
                Quick Fixes:
              </h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Check your Vercel environment variables</li>
                <li>• Verify Supabase URL and API keys</li>
                <li>• Review Row Level Security policies</li>
                <li>• Check browser console for errors</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TroubleshootingButton;