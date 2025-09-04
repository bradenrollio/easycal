'use client';

import { useState, useEffect } from 'react';
import { Save, Palette, Type, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandConfig } from '@/types/brand';
import { validateColor, validateButtonText, validateTimezone } from '@/lib/validators';

interface BrandConfigProps {
  locationId: string;
  onSave?: (config: BrandConfig) => void;
}

export function BrandConfigComponent({ locationId, onSave }: BrandConfigProps) {
  const [config, setConfig] = useState<Partial<BrandConfig>>({
    locationId,
    primaryColorHex: '#FFC300',
    backgroundColorHex: '#FFFFFF',
    defaultButtonText: 'Book Now',
    timezone: 'America/New_York'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load brand config on mount
  useEffect(() => {
    loadBrandConfig();
  }, [locationId]);

  const loadBrandConfig = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/brand-config?locationId=${locationId}`);
      
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Error loading brand config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!validateColor(config.primaryColorHex || '')) {
      newErrors.primaryColorHex = 'Must be a valid hex color (#RRGGBB)';
    }

    if (!validateColor(config.backgroundColorHex || '')) {
      newErrors.backgroundColorHex = 'Must be a valid hex color (#RRGGBB)';
    }

    if (!validateButtonText(config.defaultButtonText || '')) {
      newErrors.defaultButtonText = 'Must be 3-30 characters';
    }

    if (config.timezone && !validateTimezone(config.timezone)) {
      newErrors.timezone = 'Invalid timezone format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      
      const response = await fetch('/api/brand-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        const savedConfig = await response.json();
        setConfig(savedConfig);
        onSave?.(savedConfig);
      } else {
        const errorData = await response.json();
        console.error('Save failed:', errorData);
      }
    } catch (error) {
      console.error('Error saving brand config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof BrandConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Palette className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">Brand Configuration</h3>
            <p className="text-sm text-blue-700 mt-1">
              Set default colors and button text for all calendars. Individual CSV rows can override these settings.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Primary Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Color
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="color"
              value={config.primaryColorHex}
              onChange={(e) => handleInputChange('primaryColorHex', e.target.value)}
              className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={config.primaryColorHex}
              onChange={(e) => handleInputChange('primaryColorHex', e.target.value)}
              placeholder="#FFC300"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-yellow focus:border-transparent"
            />
          </div>
          {errors.primaryColorHex && (
            <p className="text-sm text-red-600 mt-1 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.primaryColorHex}
            </p>
          )}
        </div>

        {/* Background Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Background Color
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="color"
              value={config.backgroundColorHex}
              onChange={(e) => handleInputChange('backgroundColorHex', e.target.value)}
              className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={config.backgroundColorHex}
              onChange={(e) => handleInputChange('backgroundColorHex', e.target.value)}
              placeholder="#FFFFFF"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-yellow focus:border-transparent"
            />
          </div>
          {errors.backgroundColorHex && (
            <p className="text-sm text-red-600 mt-1 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.backgroundColorHex}
            </p>
          )}
        </div>

        {/* Default Button Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Button Text
          </label>
          <div className="relative">
            <Type className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={config.defaultButtonText}
              onChange={(e) => handleInputChange('defaultButtonText', e.target.value)}
              placeholder="Book Now"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-yellow focus:border-transparent"
            />
          </div>
          {errors.defaultButtonText && (
            <p className="text-sm text-red-600 mt-1 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.defaultButtonText}
            </p>
          )}
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Timezone
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={config.timezone}
              onChange={(e) => handleInputChange('timezone', e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-yellow focus:border-transparent"
            >
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="America/Phoenix">Arizona Time</option>
              <option value="Europe/London">London Time</option>
              <option value="Europe/Paris">Paris Time</option>
              <option value="Asia/Tokyo">Tokyo Time</option>
              <option value="Australia/Sydney">Sydney Time</option>
            </select>
          </div>
          {errors.timezone && (
            <p className="text-sm text-red-600 mt-1 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.timezone}
            </p>
          )}
        </div>

        {/* Logo URL (optional) */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Logo URL (Optional)
          </label>
          <input
            type="url"
            value={config.logoUrl || ''}
            onChange={(e) => handleInputChange('logoUrl', e.target.value)}
            placeholder="https://example.com/logo.png"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-yellow focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Used for landing pages and email templates (not applied to GoHighLevel calendars)
          </p>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Preview</h4>
        <div className="flex items-center space-x-4">
          <div
            className="px-4 py-2 rounded-md text-white font-medium"
            style={{
              backgroundColor: config.primaryColorHex,
              color: config.backgroundColorHex === '#FFFFFF' ? '#000000' : config.backgroundColorHex
            }}
          >
            {config.defaultButtonText}
          </div>
          <div className="text-sm text-gray-600">
            Primary: {config.primaryColorHex} | Background: {config.backgroundColorHex}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          isLoading={isSaving}
          disabled={Object.keys(errors).length > 0}
        >
          <Save className="w-4 h-4 mr-2" />
          Save Brand Config
        </Button>
      </div>
    </div>
  );
}
