'use client';

import Link from 'next/link';
import { Upload, Trash2 } from 'lucide-react';
import { TopBar } from '@/components/TopBar';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <TopBar />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-brand-navy mb-2">
              Easily set up and manage your class calendars
            </h2>
            <p className="text-muted-foreground">
              Create trial and make-up class calendars in minutes. Import from a spreadsheet or update existing ones—all in one place.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 max-w-6xl">
            {/* Import Calendars Card */}
            <Link
              href="/import"
              className="group block p-6 bg-white rounded-2xl card-shadow border border-border hover:card-shadow-lg transition-all duration-200 focus-ring"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-brand-yellow/10 rounded-lg flex items-center justify-center group-hover:bg-brand-yellow/20 transition-colors">
                    <Upload className="w-6 h-6 text-brand-yellow" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-brand-navy mb-2">
                    Import Calendars
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Upload a simple CSV to quickly create multiple class calendars at once.
                  </p>
                  <div className="text-sm text-brand-yellow font-medium">
                    Get started →
                  </div>
                </div>
              </div>
            </Link>

            {/* Manage Calendars Card */}
            <Link
              href="/calendars"
              className="group block p-6 bg-white rounded-2xl card-shadow border border-border hover:card-shadow-lg transition-all duration-200 focus-ring"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center group-hover:bg-red-100 transition-colors">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-brand-navy mb-2">
                    Manage Calendars
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    View, edit, or remove your existing calendars anytime.
                  </p>
                  <div className="text-sm text-red-600 font-medium">
                    Manage now →
                  </div>
                </div>
              </div>
            </Link>

            {/* Settings Card */}
            <Link
              href="/settings"
              className="group block p-6 bg-white rounded-2xl card-shadow border border-border hover:card-shadow-lg transition-all duration-200 focus-ring"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-brand-navy mb-2">
                    Settings
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Set your studio's colors, button text, and default options so every calendar matches your brand.
                  </p>
                  <div className="text-sm text-blue-600 font-medium">
                    Configure →
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="mt-12 grid gap-4 md:grid-cols-3 max-w-4xl">
            <div className="bg-white rounded-lg p-4 card-shadow border border-border">
              <div className="text-2xl font-bold text-brand-navy">0</div>
              <div className="text-sm text-muted-foreground">Live Calendars</div>
            </div>
            <div className="bg-white rounded-lg p-4 card-shadow border border-border">
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-sm text-muted-foreground">Created Today</div>
            </div>
            <div className="bg-white rounded-lg p-4 card-shadow border border-border">
              <div className="text-2xl font-bold text-blue-600">0</div>
              <div className="text-sm text-muted-foreground">Imports in Progress</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
