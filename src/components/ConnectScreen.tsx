'use client';

import React from 'react';
import { Calendar, Shield } from 'lucide-react';

interface ConnectScreenProps {
  locationId?: string;
}

export function ConnectScreen({ locationId }: ConnectScreenProps) {
  const handleConnect = () => {
    // Generate random state for CSRF protection
    const stateData = {
      random: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      locationId: locationId || null
    };
    const state = btoa(JSON.stringify(stateData));
    
    // Store state in localStorage for verification
    localStorage.setItem('oauth_state', state);
    
    // Redirect directly to marketplace OAuth URL with state parameter
    window.location.href = `https://marketplace.leadconnectorhq.com/oauth/chooselocation?response_type=code&state=${state}&redirect_uri=https%3A%2F%2Feasycal.enrollio.ai%2Fauth%2Fcallback&client_id=68b96169e165955a7edc20b3-mf58ywbo&scope=calendars.readonly+calendars.write+oauth.readonly+oauth.write+calendars%2Fgroups.write+calendars%2Fgroups.readonly+calendars%2Fevents.readonly+calendars%2Fevents.write+locations.readonly+locations%2FcustomFields.write+locations%2FcustomFields.readonly&version_id=68b96169e165955a7edc20b3`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-10 h-10 text-yellow-500" />
              <span className="text-4xl font-bold">
                <span className="text-gray-800">EASY</span>
                <span className="text-yellow-500">CAL</span>
              </span>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Welcome to EasyCal
          </h1>
          
          {locationId && (
            <p className="text-gray-600 text-sm">
              Connect your Enrollio account for location:
              <br />
              <code className="bg-gray-100 px-2 py-1 rounded mt-1 inline-block text-xs">
                {locationId}
              </code>
            </p>
          )}
        </div>

        {/* Features Card */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            What you&apos;ll be able to do:
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-blue-700 font-medium">Import calendars from CSV files</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-blue-700 font-medium">Bulk manage and delete calendars</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-blue-700 font-medium">Configure default settings for all calendars</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-blue-700 font-medium">Sync directly with your Enrollio CRM</p>
              </div>
            </div>
          </div>
        </div>

        {/* Connect Button */}
        <button
          onClick={handleConnect}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg flex items-center justify-center gap-3 transition-colors duration-200 shadow-lg hover:shadow-xl"
        >
          <Shield className="w-5 h-5" />
          <span className="text-lg">Connect with Enrollio</span>
        </button>

        {/* Terms */}
        <p className="text-center text-xs text-gray-500 mt-6">
          By connecting, you agree to our{' '}
          <a href="#" className="text-blue-600 hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-blue-600 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}