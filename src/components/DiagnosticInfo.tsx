import React, { useState, useEffect } from 'react';

interface DiagnosticInfoProps {
  isVisible: boolean;
  onClose: () => void;
}

const DiagnosticInfo: React.FC<DiagnosticInfoProps> = ({ isVisible, onClose }) => {
  const [apiStatus, setApiStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [apiError, setApiError] = useState<string>('');
  const [envInfo, setEnvInfo] = useState<any>({});

  useEffect(() => {
    if (isVisible) {
      // Check environment variables
      setEnvInfo({
        NODE_ENV: import.meta.env.NODE_ENV,
        VITE_API_URL: import.meta.env.VITE_API_URL,
        MODE: import.meta.env.MODE,
        BASE_URL: import.meta.env.BASE_URL,
        DEV: import.meta.env.DEV,
        PROD: import.meta.env.PROD,
      });

      // Test API connection
      testApiConnection();
    }
  }, [isVisible]);

  const testApiConnection = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        setApiStatus('success');
      } else {
        setApiStatus('error');
        setApiError(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      setApiStatus('error');
      setApiError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Diagnostic Information</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {/* Environment Variables */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Environment Variables</h3>
              <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                {Object.entries(envInfo).map(([key, value]) => (
                  <div key={key} className="mb-1">
                    <span className="text-blue-600">{key}:</span> {String(value) || 'undefined'}
                  </div>
                ))}
              </div>
            </div>

            {/* API Status */}
            <div>
              <h3 className="text-lg font-semibold mb-2">API Connection Status</h3>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  apiStatus === 'checking' ? 'bg-yellow-400' :
                  apiStatus === 'success' ? 'bg-green-400' : 'bg-red-400'
                }`}></div>
                <span className="capitalize">{apiStatus}</span>
                {apiStatus === 'checking' && <span className="text-sm text-gray-500">Testing connection...</span>}
              </div>
              {apiError && (
                <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                  {apiError}
                </div>
              )}
            </div>

            {/* Browser Information */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Browser Information</h3>
              <div className="bg-gray-100 p-3 rounded text-sm">
                <div>User Agent: {navigator.userAgent}</div>
                <div>Platform: {navigator.platform}</div>
                <div>Language: {navigator.language}</div>
                <div>Online: {navigator.onLine ? 'Yes' : 'No'}</div>
              </div>
            </div>

            {/* Console Logs */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Recent Console Errors</h3>
              <div className="bg-gray-100 p-3 rounded text-sm font-mono max-h-32 overflow-y-auto">
                <div className="text-gray-500">Console errors will appear here...</div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={testApiConnection}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retest API
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticInfo; 