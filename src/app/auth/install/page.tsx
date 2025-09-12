'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function AuthInstallContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const initiateOAuth = async () => {
      try {
        const installType = searchParams.get('type') || 'location';
        const locationId = searchParams.get('locationId');
        
        // Generate state for CSRF protection with locationId if provided
        const stateData = {
          random: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
          locationId: locationId || null
        };
        const state = btoa(JSON.stringify(stateData));
        
        // Store state in localStorage for verification
        localStorage.setItem('oauth_state', state);
        
        // Build scopes - include all required scopes
        const scopes = [
          'calendars.readonly',
          'calendars.write',
          'oauth.readonly',
          'oauth.write',
          'calendars/groups.write',
          'calendars/groups.readonly',
          'calendars/events.readonly',
          'calendars/events.write',
          'locations.readonly',
          'locations/customFields.write',
          'locations/customFields.readonly'
        ];

        // Build OAuth URL
        const clientId = process.env.NEXT_PUBLIC_GHL_CLIENT_ID || '68b96169e165955a7edc20b3-mf58ywbo';
        const redirectUri = process.env.NEXT_PUBLIC_GHL_OAUTH_REDIRECT_URL || 
          (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/auth/callback'
            : 'https://easycal.enrollio.ai/auth/callback');
        
        // Use whitelabel marketplace URL to bypass login screen
        const baseUrl = 'https://marketplace.enrollio.com/oauth/chooselocation';
        const params = new URLSearchParams({
          response_type: 'code',
          client_id: clientId,
          redirect_uri: redirectUri,
          scope: scopes.join(' '),
          state: state,
          version_id: '68b96169e165955a7edc20b3',
        });

        const authUrl = `${baseUrl}?${params.toString()}`;
        console.log('Redirecting to:', authUrl);
        
        // Redirect to OAuth authorization
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
        <h1 className="text-2xl font-bold mb-4">Authorizing Application...</h1>
        <p className="text-gray-600">Please wait while we set up your account access.</p>
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
