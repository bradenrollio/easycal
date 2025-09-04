'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Settings as SettingsIcon, Shield, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TopBar } from '@/components/TopBar';
import { BrandConfigComponent } from '@/components/BrandConfig';

interface DefaultSettings {
  availabilityTimezone: string;
  slotDurationMinutes: number;
  minNoticeMinutes: number;
  bookingWindowDays: number;
  isActive: boolean;
}

const defaultSettings: DefaultSettings = {
  availabilityTimezone: 'America/New_York',
  slotDurationMinutes: 30,
  minNoticeMinutes: 60,
  bookingWindowDays: 30,
  isActive: true,
};

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<DefaultSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'brand' | 'defaults' | 'security'>('brand');

  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Settings saved:', settings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'brand', label: 'Brand Config', icon: Palette },
    { id: 'defaults', label: 'Defaults', icon: SettingsIcon },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-background">
      <TopBar 
        showBackButton={true}
        onBack={() => router.push('/')}
      />
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-brand-navy mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Configure brand colors, default calendar settings, and security preferences.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-muted/30 p-1 rounded-lg mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-brand-navy shadow-sm'
                    : 'text-muted-foreground hover:text-brand-navy hover:bg-white/50'
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
          {/* Brand Config Tab */}
          {activeTab === 'brand' && (
            <div>
              <h2 className="text-lg font-semibold text-brand-navy mb-4">Brand Configuration</h2>
              <p className="text-muted-foreground mb-6">
                Configure default colors and button text that will be applied to all calendars. Individual CSV rows can override these settings.
              </p>
              <BrandConfigComponent 
                locationId="loc1" // TODO: Get from actual GHL context
                onSave={(config) => console.log('Brand config saved:', config)}
              />
            </div>
          )}

          {/* Defaults Tab */}
          {activeTab === 'defaults' && (
            <div>
              <h2 className="text-lg font-semibold text-brand-navy mb-4">Default Calendar Settings</h2>
              <p className="text-muted-foreground mb-6">
                Set default values for new calendars. These can be overridden in individual CSV rows.
              </p>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Timezone
                  </label>
                  <select
                    value={settings.availabilityTimezone}
                    onChange={(e) => setSettings(prev => ({ ...prev, availabilityTimezone: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-brand-yellow focus:border-transparent"
                  >
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="America/Phoenix">Arizona Time</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Slot Duration (minutes)
                  </label>
                  <select
                    value={settings.slotDurationMinutes}
                    onChange={(e) => setSettings(prev => ({ ...prev, slotDurationMinutes: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-brand-yellow focus:border-transparent"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Notice (days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={settings.minNoticeMinutes / (24 * 60)}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      minNoticeMinutes: parseInt(e.target.value) * 24 * 60 
                    }))}
                    className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-brand-yellow focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Booking Window (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={settings.bookingWindowDays}
                    onChange={(e) => setSettings(prev => ({ ...prev, bookingWindowDays: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-brand-yellow focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div>
              <h2 className="text-lg font-semibold text-brand-navy mb-4">Security & Privacy</h2>
              <p className="text-muted-foreground mb-6">
                Manage security settings and data privacy options.
              </p>

              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 text-green-600 mr-2" />
                    <h3 className="font-medium text-green-800">OAuth Connection Active</h3>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Your GoHighLevel account is securely connected with the required calendar permissions.
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-brand-navy">Data Handling</h4>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>• All data is processed securely and not stored beyond the current session</p>
                    <p>• OAuth tokens are encrypted and stored securely</p>
                    <p>• CSV data is processed in memory and not permanently stored</p>
                    <p>• All calendar operations are performed directly through GoHighLevel's API</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-brand-navy">Permissions</h4>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>• <strong>calendars.readonly</strong>: View existing calendars</p>
                    <p>• <strong>calendars.write</strong>: Create and update calendars</p>
                    <p>• <strong>calendars/groups.write</strong>: Create and manage calendar groups</p>
                    <p>• <strong>calendars/events.readonly</strong>: View calendar events</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button onClick={handleSaveSettings} isLoading={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}