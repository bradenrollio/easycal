import Link from 'next/link';
import { Upload, Trash2 } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-brand-navy mb-2">
          Move fast with bulk calendar actions
        </h2>
        <p className="text-muted-foreground">
          Import multiple calendars from a CSV or manage existing ones in bulk.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-4xl">
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
                Upload a CSV, map fields, and create calendars in seconds.
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
                View, search, and bulk delete existing calendars.
              </p>
              <div className="text-sm text-red-600 font-medium">
                Manage now →
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="mt-12 grid gap-4 md:grid-cols-3 max-w-4xl">
        <div className="bg-white rounded-lg p-4 card-shadow border border-border">
          <div className="text-2xl font-bold text-brand-navy">0</div>
          <div className="text-sm text-muted-foreground">Active Calendars</div>
        </div>
        <div className="bg-white rounded-lg p-4 card-shadow border border-border">
          <div className="text-2xl font-bold text-green-600">0</div>
          <div className="text-sm text-muted-foreground">Created Today</div>
        </div>
        <div className="bg-white rounded-lg p-4 card-shadow border border-border">
          <div className="text-2xl font-bold text-blue-600">0</div>
          <div className="text-sm text-muted-foreground">Pending Jobs</div>
        </div>
      </div>
    </div>
  );
}
