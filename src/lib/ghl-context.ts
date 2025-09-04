// GHL Context - Get location context from parent GHL interface
export interface GHLContext {
  locationId: string;
  userId?: string;
  companyId?: string;
  timezone?: string;
  [key: string]: any;
}

export function getGHLContext(): Promise<GHLContext | null> {
  return new Promise((resolve) => {
    // Check if we're in an iframe (GHL context)
    const isInIframe = window !== window.parent;
    
    if (!isInIframe) {
      console.log('Not in iframe - standalone mode');
      resolve(null);
      return;
    }

    // Listen for GHL context message
    const handleMessage = (event: MessageEvent) => {
      // Ensure message is from GHL domain
      if (!event.origin.includes('gohighlevel.com') && !event.origin.includes('leadconnectorhq.com')) {
        return;
      }

      console.log('Received message from GHL:', event.data);

      if (event.data && event.data.type === 'ghl-context') {
        window.removeEventListener('message', handleMessage);
        resolve(event.data.context);
      } else if (event.data && event.data.locationId) {
        // Sometimes the context is sent directly
        window.removeEventListener('message', handleMessage);
        resolve(event.data);
      }
    };

    window.addEventListener('message', handleMessage);

    // Request context from parent
    try {
      window.parent.postMessage({ type: 'request-context' }, '*');
    } catch (error) {
      console.warn('Could not request context from parent:', error);
    }

    // Timeout after 3 seconds
    setTimeout(() => {
      window.removeEventListener('message', handleMessage);
      resolve(null);
    }, 3000);
  });
}

// Alternative: Parse location from URL hash or search params that GHL might set
export function parseGHLLocationFromURL(): string | null {
  // Check URL hash
  const hash = window.location.hash;
  if (hash) {
    const hashParams = new URLSearchParams(hash.substring(1));
    const locationId = hashParams.get('locationId') || hashParams.get('location_id');
    if (locationId) {
      return locationId;
    }
  }

  // Check search params
  const searchParams = new URLSearchParams(window.location.search);
  const locationId = searchParams.get('locationId') || 
                    searchParams.get('location_id') ||
                    searchParams.get('companyId') ||
                    searchParams.get('company_id');
  
  if (locationId) {
    return locationId;
  }

  // Check if we're in a GHL iframe and parse location from parent URL
  try {
    if (window !== window.parent && window.parent.location) {
      const parentUrl = window.parent.location.href;
      console.log('Parent URL:', parentUrl);
      
      // Parse GHL URL pattern: /v2/location/LOCATION_ID/custom-page-link/PAGE_ID
      const locationMatch = parentUrl.match(/\/v2\/location\/([^\/]+)\/custom-page-link/);
      if (locationMatch) {
        const ghlLocationId = locationMatch[1];
        console.log('Extracted location ID from GHL URL pattern:', ghlLocationId);
        return ghlLocationId;
      }
    }
  } catch (error) {
    // This will fail due to cross-origin restrictions, but worth trying
    console.log('Cannot access parent URL due to cross-origin restrictions');
  }
  
  return null;
}

// Get location ID from GHL iframe context using postMessage
export function getGHLLocationFromIframe(): Promise<string | null> {
  return new Promise((resolve) => {
    // Check if we're in an iframe
    const isInIframe = window !== window.parent;
    
    if (!isInIframe) {
      console.log('Not in iframe, cannot get GHL context');
      resolve(null);
      return;
    }

    console.log('In iframe - attempting to get location from GHL parent');
    let resolved = false;

    const handleMessage = (event: MessageEvent) => {
      if (resolved) return;
      
      console.log('Received message from GHL parent:', {
        origin: event.origin,
        data: event.data,
        type: typeof event.data
      });
      
      // Check for location ID in various message formats
      if (event.data) {
        const locationId = event.data.locationId || 
                          event.data.location_id || 
                          event.data.companyId ||
                          event.data.company_id ||
                          event.data.location ||
                          event.data.company;
        
        if (locationId && typeof locationId === 'string' && locationId.length > 5) {
          resolved = true;
          window.removeEventListener('message', handleMessage);
          console.log('Location ID extracted from GHL iframe:', locationId);
          resolve(locationId);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Try multiple methods to request context from GHL
    try {
      // Method 1: Standard context request
      window.parent.postMessage({ 
        type: 'request-location-context',
        source: 'easycal-app'
      }, '*');
      
      // Method 2: Alternative format
      setTimeout(() => {
        if (!resolved) {
          window.parent.postMessage({ 
            action: 'getLocationId',
            app: 'easycal'
          }, '*');
        }
      }, 500);
      
      // Method 3: Try to get from window.location if GHL passes it
      setTimeout(() => {
        if (!resolved) {
          // Check if GHL passes location in URL hash or search params
          const urlLocation = parseGHLLocationFromURL();
          if (urlLocation && urlLocation !== 'temp_location') {
            resolved = true;
            window.removeEventListener('message', handleMessage);
            console.log('Location ID from URL within iframe:', urlLocation);
            resolve(urlLocation);
          }
        }
      }, 1000);
      
    } catch (error) {
      console.warn('Could not send message to GHL parent:', error);
    }

    // Timeout after 3 seconds
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        window.removeEventListener('message', handleMessage);
        console.log('Timeout waiting for GHL location context');
        resolve(null);
      }
    }, 3000);
  });
}

// Get location ID using all available methods
export async function getLocationId(): Promise<string | null> {
  console.log('Starting location ID detection...');
  
  // 1. Try URL parameters first
  const urlLocationId = parseGHLLocationFromURL();
  if (urlLocationId && urlLocationId !== 'temp_location') {
    console.log('Location ID from URL:', urlLocationId);
    return urlLocationId;
  }

  // 2. Try to get from GHL iframe context
  const iframeLocationId = await getGHLLocationFromIframe();
  if (iframeLocationId) {
    console.log('Location ID from iframe:', iframeLocationId);
    return iframeLocationId;
  }

  // 3. Try to get from GHL context (alternative method)
  const ghlContext = await getGHLContext();
  if (ghlContext && ghlContext.locationId) {
    console.log('Location ID from GHL context:', ghlContext.locationId);
    return ghlContext.locationId;
  }

  // 4. Try to detect from stored tokens
  try {
    const response = await fetch('/api/detect-location');
    if (response.ok) {
      const data = await response.json();
      if (data.locationId) {
        console.log('Location ID detected from tokens:', data.locationId);
        return data.locationId;
      }
    }
  } catch (error) {
    console.error('Error detecting location from tokens:', error);
  }

  console.warn('No location ID found using any method');
  return null;
}
