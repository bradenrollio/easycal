'use client';

import { useState } from 'react';

export default function DebugPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAPI = async (locationId: string) => {
    setLoading(true);
    try {
      console.log('Testing API with location ID:', locationId);
      
      const response = await fetch(`/api/calendars?locationId=${locationId}`);
      const data = await response.json();
      
      setResult({
        status: response.status,
        data: data,
        locationId: locationId
      });
      
      console.log('API Response:', data);
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error',
        locationId: locationId
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Debug Calendar API</h1>
      
      <div className="space-y-4">
        <button
          onClick={() => testAPI('EnUqtThIwW8pdTLOvuO7')}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Test with EnUqtThIwW8pdTLOvuO7
        </button>
        
        <button
          onClick={() => testAPI('temp_1756999441908')}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Test with temp_1756999441908
        </button>
      </div>
      
      {loading && (
        <div className="mt-4">Loading...</div>
      )}
      
      {result && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h2 className="font-bold mb-2">Result:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
