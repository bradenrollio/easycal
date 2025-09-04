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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PNG, JPEG, JPG, or GIF image');
      return;
    }

    // Validate file size (2.5MB)
    if (file.size > 2.5 * 1024 * 1024) {
      alert('Image must be smaller than 2.5MB');
      return;
    }

    // Create preview URL and store file
    const imageUrl = URL.createObjectURL(file);
    setConfig(prev => ({ ...prev, coverImageUrl: imageUrl }));
    
    // TODO: In production, upload to storage and get permanent URL
    console.log('Image selected:', file);
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

        {/* Calendar Cover Image Upload */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Calendar Cover Image (Optional)
          </label>
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
            onClick={() => document.getElementById('cover-image-input')?.click()}
          >
            {config.coverImageUrl ? (
              <div className="space-y-2">
                <img 
                  src={config.coverImageUrl} 
                  alt="Calendar cover" 
                  className="mx-auto h-32 w-32 object-cover rounded-lg border"
                />
                <div>
                  <button
                    type="button"
                    className="text-brand-yellow hover:text-brand-yellow/80 font-medium"
                  >
                    Change image
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div>
                  <button
                    type="button"
                    className="text-brand-yellow hover:text-brand-yellow/80 font-medium"
                  >
                    Click to upload
                  </button>
                  <span className="text-gray-500"> or drag and drop</span>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPEG, JPG or GIF (max. dimensions 180×180px | max. size 2.5mb)
                </p>
                <p className="text-xs text-gray-400">
                  The uploaded image will be visible within the Group View for Neo template and won't appear on the individual calendar link
                </p>
              </div>
            )}
          </div>
          <input
            id="cover-image-input"
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/gif"
            onChange={handleImageUpload}
            className="hidden"
          />
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

    </div>
  );
}
