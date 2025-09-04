'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        
        if (!code || !state) {
          setError('Missing authorization code or state');
          setStatus('error');
          return;
        }

        // Verify state (basic check)
        const storedState = localStorage.getItem('oauth_state');
        if (state !== storedState) {
          setError('Invalid state parameter');
          setStatus('error');
          return;
        }

        // Clean up stored state
        localStorage.removeItem('oauth_state');

        // For now, just show success - in a real implementation, 
        // we'd exchange the code for tokens on the server side
        console.log('Authorization code received:', code);
        setStatus('success');

        // Redirect to main app after a brief delay
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);

      } catch (error) {
        console.error('Callback error:', error);
        setError('An error occurred during authorization');
        setStatus('error');
      }
    };

    handleCallback();
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center max-w-md">
        {status === 'processing' && (
          <>
            <h1 className="text-2xl font-bold mb-4">Processing Authorization...</h1>
            <p className="text-gray-600">Please wait while we complete the authorization process.</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <h1 className="text-2xl font-bold text-green-600 mb-4">Authorization Successful!</h1>
            <p className="text-gray-600 mb-4">You have successfully connected your GoHighLevel account.</p>
            <p className="text-sm text-gray-500">Redirecting to the main application...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <h1 className="text-2xl font-bold text-red-600 mb-4">Authorization Failed</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <a 
              href="/auth/install" 
              className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Try Again
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
