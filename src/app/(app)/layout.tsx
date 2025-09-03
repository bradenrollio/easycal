'use client';

import { TopBar } from '@/components/TopBar';
import { LocationSwitcher } from '@/components/LocationSwitcher';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // For now, we'll use mock data. In a real app, this would come from your database/API
  const locations = [
    { id: 'loc1', name: 'Main Office', timeZone: 'America/New_York', isEnabled: true },
    { id: 'loc2', name: 'Branch Office', timeZone: 'America/Los_Angeles', isEnabled: true },
    { id: 'loc3', name: 'Remote Office', timeZone: 'America/Chicago', isEnabled: false },
  ];

  const handleLocationChange = (locationId: string) => {
    console.log('Location changed to:', locationId);
    // In a real app, this would update the user's selected location
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar>
        <LocationSwitcher
          locations={locations}
          selectedLocationId="loc1"
          onLocationChange={handleLocationChange}
        />
      </TopBar>

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
