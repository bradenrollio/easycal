'use client';

import { ConnectScreen } from '@/components/ConnectScreen';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const [locationId, setLocationId] = useState<string | null>(null);

  useEffect(() => {
    // Try to get location ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlLocationId = urlParams.get('locationId');
    
    if (urlLocationId && urlLocationId !== 'temp_location') {
      setLocationId(urlLocationId);
    }
  }, []);

  // Always show Connect to Enrollio screen as the default
  return <ConnectScreen locationId={locationId || undefined} />;
}