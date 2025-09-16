'use client';

import { ConnectScreen } from '@/components/ConnectScreen';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [locationId, setLocationId] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Try to get location ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlLocationId = urlParams.get('locationId');

    console.log('🔍 Page loaded with URL params:', window.location.search);
    console.log('🔍 Extracted locationId:', urlLocationId);

    if (urlLocationId && urlLocationId !== 'temp_location') {
      console.log('✅ Valid locationId found:', urlLocationId);
      setLocationId(urlLocationId);
      // Check if this location is already authenticated
      checkAuthentication(urlLocationId);
    } else {
      console.log('❌ No valid locationId in URL');
      setIsChecking(false);
    }
  }, []);

  const checkAuthentication = async (locId: string) => {
    try {
      console.log('🔐 Starting authentication check for locationId:', locId);
      console.log('📍 Making request to:', `/api/test-auth?locationId=${locId}`);

      const response = await fetch(`/api/test-auth?locationId=${locId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Auth check response data:', JSON.stringify(data, null, 2));

        if (data.tokenFound) {
          // Token exists, redirect to dashboard
          console.log('🚀 Authenticated! Redirecting to dashboard...');
          console.log('🚀 Redirect URL:', `/dashboard?locationId=${locId}`);
          router.push(`/dashboard?locationId=${locId}`);
          return;
        } else {
          console.log('⚠️ Response OK but no token found in data');
          console.log('⚠️ Full response:', data);
        }
      } else {
        const errorText = await response.text();
        console.log('❌ Auth check failed with status:', response.status);
        console.log('❌ Error response body:', errorText);
      }
    } catch (error) {
      console.error('💥 Exception during authentication check:', error);
      console.error('💥 Error details:', {
        message: error.message,
        stack: error.stack,
      });
    }

    // If we get here, not authenticated
    console.log('🔓 Not authenticated - showing installation page');
    setIsChecking(false);
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-yellow mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show Connect to Enrollio screen if not authenticated
  return (
    <div>
      <ConnectScreen locationId={locationId || undefined} />

      {/* Debug section - only show in development */}
      {process.env.NODE_ENV === 'development' && locationId && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-md">
          <h3 className="font-bold mb-2">🔧 Debug Panel</h3>
          <p className="text-sm mb-2">LocationId: <code className="bg-gray-800 px-1 rounded">{locationId}</code></p>
          <button
            onClick={() => checkAuthentication(locationId)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm mr-2"
          >
            Test Auth Check
          </button>
          <button
            onClick={() => window.open(`/api/test-auth?locationId=${locationId}`, '_blank')}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
          >
            Open API Endpoint
          </button>
        </div>
      )}
    </div>
  );
}