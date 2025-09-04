'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function AuthInstallContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const initiateOAuth = async () => {
      try {
        const installType = searchParams.get('type') || 'location';
        
        // Generate state for CSRF protection
        const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        
        // Store state in localStorage for verification
        localStorage.setItem('oauth_state', state);
        
        // Build scopes
        const scopes = [
          'calendars.readonly',
          'calendars.write',
          'calendars/groups.write',
          'calendars/groups.readonly',
          'calendars/events.readonly',
          'calendars/events.write'
        ];

        if (installType === 'agency') {
          scopes.push('oauth.readonly', 'oauth.write');
        }

        // Build OAuth URL
        const baseUrl = 'https://services.leadconnectorhq.com/oauth/clients/68b96169e165955a7edc20b3/authentication/oauth2/authorize';
        const params = new URLSearchParams({
          response_type: 'code',
          client_id: '68b96169e165955a7edc20b3-mf58ywbo',
          redirect_uri: 'https://easycal.enrollio.ai/auth/callback',
          scope: scopes.join(' '),
          state: state,
        });

        const authUrl = `${baseUrl}?${params.toString()}`;
        console.log('Redirecting to:', authUrl);
        
        // Redirect to GoHighLevel OAuth
        window.location.href = authUrl;
      } catch (error) {
        console.error('OAuth error:', error);
      }
    };

    initiateOAuth();
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting to GoHighLevel...</h1>
        <p className="text-gray-600">Please wait while we redirect you to authorize the application.</p>
      </div>
    </div>
  );
}

export default function AuthInstallPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    }>
      <AuthInstallContent />
    </Suspense>
  );
}
