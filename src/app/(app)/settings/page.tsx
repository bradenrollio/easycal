'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Settings as SettingsIcon, Palette } from 'lucide-react';
import { TopBar } from '@/components/TopBar';
import { BrandConfigComponent } from '@/components/BrandConfig';
import { CalendarDefaultsComponent } from '@/components/CalendarDefaults';

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'brand' | 'defaults'>('brand');

  // Get location ID from URL params
  const locationId = searchParams.get('locationId') || '';

  const tabs = [
    { id: 'brand', label: 'Brand Config', icon: Palette },
    { id: 'defaults', label: 'Defaults', icon: SettingsIcon },
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
            Configure brand colors and default calendar settings.
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
                locationId={locationId}
                onSave={(config) => console.log('Brand config saved:', config)}
              />
            </div>
          )}

          {/* Defaults Tab */}
          {activeTab === 'defaults' && (
            <CalendarDefaultsComponent 
              locationId={locationId}
              onSave={(defaults) => console.log('Defaults saved:', defaults)}
            />
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-yellow"></div>
    </div>}>
      <SettingsContent />
    </Suspense>
  );
}