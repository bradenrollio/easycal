'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, MapPin } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/button';

interface Location {
  id: string;
  name: string;
  timeZone: string;
  isEnabled: boolean;
}

interface LocationSwitcherProps {
  locations: Location[];
  selectedLocationId?: string;
  onLocationChange: (locationId: string) => void;
  isLoading?: boolean;
}

export function LocationSwitcher({
  locations,
  selectedLocationId,
  onLocationChange,
  isLoading = false,
}: LocationSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedLocation = locations.find(loc => loc.id === selectedLocationId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.location-switcher')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (locations.length === 0) {
    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span>No locations available</span>
      </div>
    );
  }

  if (locations.length === 1) {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <MapPin className="h-4 w-4 text-brand-navy" />
        <span className="font-medium">{locations[0].name}</span>
      </div>
    );
  }

  return (
    <div className="relative location-switcher">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center space-x-2"
      >
        <MapPin className="h-4 w-4" />
        <span className="max-w-32 truncate">
          {selectedLocation?.name || 'Select Location'}
        </span>
        <ChevronDown className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-border rounded-lg shadow-lg z-50">
          <div className="py-1 max-h-60 overflow-y-auto">
            {locations
              .filter(loc => loc.isEnabled)
              .map((location) => (
                <button
                  key={location.id}
                  onClick={() => {
                    onLocationChange(location.id);
                    setIsOpen(false);
                  }}
                  className={clsx(
                    'w-full px-4 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none',
                    selectedLocationId === location.id && 'bg-brand-yellow/10 text-brand-navy font-medium'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{location.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {location.timeZone}
                      </div>
                    </div>
                    {selectedLocationId === location.id && (
                      <div className="w-2 h-2 bg-brand-yellow rounded-full"></div>
                    )}
                  </div>
                </button>
              ))}
          </div>

          {locations.some(loc => !loc.isEnabled) && (
            <>
              <div className="border-t border-border"></div>
              <div className="px-4 py-2 text-xs text-muted-foreground bg-muted/50">
                Disabled locations:
              </div>
              {locations
                .filter(loc => !loc.isEnabled)
                .map((location) => (
                  <button
                    key={location.id}
                    disabled
                    className="w-full px-4 py-2 text-left text-muted-foreground cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div>{location.name}</div>
                        <div className="text-xs">{location.timeZone}</div>
                      </div>
                      <div className="text-xs">Disabled</div>
                    </div>
                  </button>
                ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
