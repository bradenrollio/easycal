'use client';

import { useState } from 'react';
import { Save, RefreshCw, MapPin, Settings as SettingsIcon, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Location {
  id: string;
  name: string;
  timeZone: string;
  isEnabled: boolean;
  hasToken: boolean;
  lastSync?: string;
}

interface DefaultSettings {
  availabilityTimezone: string;
  slotDurationMinutes: number;
  minNoticeMinutes: number;
  bookingWindowDays: number;
  isActive: boolean;
}

// Mock data
const mockLocations: Location[] = [
  {
    id: 'loc1',
    name: 'Main Office',
    timeZone: 'America/New_York',
    isEnabled: true,
    hasToken: true,
    lastSync: '2024-01-15T10:00:00Z',
  },
  {
    id: 'loc2',
    name: 'Branch Office',
    timeZone: 'America/Los_Angeles',
    isEnabled: true,
    hasToken: true,
    lastSync: '2024-01-14T14:30:00Z',
  },
  {
    id: 'loc3',
    name: 'Remote Office',
    timeZone: 'America/Chicago',
    isEnabled: false,
    hasToken: false,
  },
];

const defaultSettings: DefaultSettings = {
  availabilityTimezone: 'America/New_York',
  slotDurationMinutes: 30,
  minNoticeMinutes: 60,
  bookingWindowDays: 30,
  isActive: true,
};

export default function SettingsPage() {
  const [locations, setLocations] = useState<Location[]>(mockLocations);
  const [settings, setSettings] = useState<DefaultSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'locations' | 'defaults' | 'security'>('locations');

  const handleLocationToggle = (locationId: string, isEnabled: boolean) => {
    setLocations(prev =>
      prev.map(loc =>
        loc.id === locationId ? { ...loc, isEnabled } : loc
      )
    );
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);

    try {
      // In a real app, this would save to your backend
      console.log('Saving settings:', { locations, settings });

      await new Promise(resolve => setTimeout(resolve, 1000));

      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReconnectLocation = async (locationId: string) => {
    try {
      // In a real app, this would trigger OAuth flow for the specific location
      console.log('Reconnecting location:', locationId);

      alert('Redirecting to authorization...');
      // window.location.href = `/auth/install?location=${locationId}`;
    } catch (error) {
      console.error('Failed to reconnect location:', error);
      alert('Failed to reconnect location. Please try again.');
    }
  };

  const tabs = [
    { id: 'locations', label: 'Locations', icon: MapPin },
    { id: 'defaults', label: 'Defaults', icon: SettingsIcon },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-brand-navy mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your locations, default settings, and security preferences.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-brand-navy shadow-sm'
                    : 'text-muted-foreground hover:text-brand-navy'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg border border-border p-6">
          {/* Locations Tab */}
          {activeTab === 'locations' && (
            <div>
              <h2 className="text-lg font-semibold text-brand-navy mb-4">Connected Locations</h2>
              <p className="text-muted-foreground mb-6">
                Manage which locations are enabled for calendar operations and their connection status.
              </p>

              <div className="space-y-4">
                {locations.map((location) => (
                  <div key={location.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-brand-yellow/10 rounded-lg flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-brand-yellow" />
                      </div>

                      <div>
                        <h3 className="font-medium text-brand-navy">{location.name}</h3>
                        <p className="text-sm text-muted-foreground">{location.timeZone}</p>
                        {location.lastSync && (
                          <p className="text-xs text-muted-foreground">
                            Last sync: {new Date(location.lastSync).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${
                          location.hasToken ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <span className="text-sm text-muted-foreground">
                          {location.hasToken ? 'Connected' : 'Disconnected'}
                        </span>
                      </div>

                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={location.isEnabled}
                          onChange={(e) => handleLocationToggle(location.id, e.target.checked)}
                          className="rounded border-border text-brand-yellow focus:ring-brand-yellow"
                        />
                        <span className="text-sm">Enabled</span>
                      </label>

                      {!location.hasToken && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReconnectLocation(location.id)}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Reconnect
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Disabling a location will prevent calendar operations for that location.
                  Reconnecting requires going through the OAuth flow again.
                </p>
              </div>
            </div>
          )}

          {/* Defaults Tab */}
          {activeTab === 'defaults' && (
            <div>
              <h2 className="text-lg font-semibold text-brand-navy mb-4">Default Calendar Settings</h2>
              <p className="text-muted-foreground mb-6">
                Set default values for calendar properties when they're not specified in your CSV.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-brand-navy mb-2">
                    Default Timezone
                  </label>
                  <select
                    value={settings.availabilityTimezone}
                    onChange={(e) => setSettings(prev => ({ ...prev, availabilityTimezone: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  >
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-navy mb-2">
                    Slot Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="480"
                    step="15"
                    value={settings.slotDurationMinutes}
                    onChange={(e) => setSettings(prev => ({ ...prev, slotDurationMinutes: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-navy mb-2">
                    Minimum Notice (minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1440"
                    step="15"
                    value={settings.minNoticeMinutes}
                    onChange={(e) => setSettings(prev => ({ ...prev, minNoticeMinutes: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-navy mb-2">
                    Booking Window (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={settings.bookingWindowDays}
                    onChange={(e) => setSettings(prev => ({ ...prev, bookingWindowDays: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.isActive}
                      onChange={(e) => setSettings(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded border-border text-brand-yellow focus:ring-brand-yellow"
                    />
                    <span className="text-sm font-medium text-brand-navy">
                      Calendars are active by default
                    </span>
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    New calendars will be active and available for bookings unless specified otherwise.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div>
              <h2 className="text-lg font-semibold text-brand-navy mb-4">Security Settings</h2>
              <p className="text-muted-foreground mb-6">
                Manage security preferences and connection settings.
              </p>

              <div className="space-y-6">
                <div className="p-4 border border-border rounded-lg">
                  <h3 className="font-medium text-brand-navy mb-2">API Tokens</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your OAuth tokens are encrypted and stored securely. You can regenerate them if needed.
                  </p>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate Tokens
                  </Button>
                </div>

                <div className="p-4 border border-border rounded-lg">
                  <h3 className="font-medium text-brand-navy mb-2">Session Management</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Manage your current session and authentication status.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Current session expires in 24 hours</span>
                    <Button variant="outline" size="sm">
                      Extend Session
                    </Button>
                  </div>
                </div>

                <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                  <h3 className="font-medium text-red-800 mb-2">Danger Zone</h3>
                  <p className="text-sm text-red-600 mb-4">
                    These actions are irreversible. Please proceed with caution.
                  </p>
                  <div className="flex space-x-3">
                    <Button variant="destructive" size="sm">
                      Disconnect All Locations
                    </Button>
                    <Button variant="destructive" size="sm">
                      Reset All Settings
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end mt-6">
          <Button onClick={handleSaveSettings} isLoading={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
