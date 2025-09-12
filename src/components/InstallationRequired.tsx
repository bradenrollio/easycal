'use client';

import React, { useState } from 'react';
import { Shield, Calendar, CheckCircle, Phone, Mail, Loader2 } from 'lucide-react';

interface InstallationRequiredProps {
  locationId?: string;
}

export function InstallationRequired({ locationId }: InstallationRequiredProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInstallRequest = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Send request to webhook
      const response = await fetch('https://hook.us1.make.com/9iy0frn8fpyk4u7nwkqxt59klwv1ky3h', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locationId: locationId || 'not_provided',
          locationName: locationId ? `Location ${locationId}` : 'Unknown Location',
          timestamp: new Date().toISOString(),
          source: 'easycal_installation_request'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send installation request');
      }

      setRequestSent(true);
    } catch (err) {
      console.error('Error sending installation request:', err);
      setError('Failed to send request. Please try again or contact support directly.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg mb-4">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Installation Required
          </h1>
          <p className="text-gray-600">
            EasyCal needs to be connected to your Enrollio account to manage calendars
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            {/* Enrollio Branding */}
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Connect with Enrollio
              </h2>
              <p className="text-gray-600">
                Authorize EasyCal to access your Enrollio account and start managing calendars efficiently
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4 mb-8">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-900">Bulk Calendar Management</h3>
                  <p className="text-sm text-gray-600">Import and manage multiple calendars at once</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-900">Smart Scheduling</h3>
                  <p className="text-sm text-gray-600">Set availability and booking rules in bulk</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-900">Custom Branding</h3>
                  <p className="text-sm text-gray-600">Apply your brand colors across all calendars</p>
                </div>
              </div>
            </div>

            {/* Installation Request Section */}
            {!requestSent ? (
              <>
                {/* Install Button */}
                <button
                  type="button"
                  onClick={handleInstallRequest}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sending Request...
                    </span>
                  ) : (
                    'Request Installation'
                  )}
                </button>

                {/* Error Message */}
                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Info Message */}
                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600 text-center">
                    Click the button above to request installation assistance from Enrollio support
                  </p>
                </div>
              </>
            ) : (
              /* Success Message */
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Installation Request Sent Successfully
                    </h3>
                    <p className="text-gray-700">
                      Your installation request has been sent to Enrollio support.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Location ID Display */}
            {locationId && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <span>Location ID:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">
                    {locationId}
                  </code>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4">
            <div className="flex items-center justify-center text-xs text-gray-500">
              <Shield className="w-3 h-3 mr-1" />
              <span>Secure OAuth 2.0 Authorization</span>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            EasyCal is an official Enrollio integration for advanced calendar management
          </p>
        </div>
      </div>
    </div>
  );
}