import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/Toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Enrollio - Bulk Calendar Management",
  description: "Brand-aware bulk calendar management for your business",
  keywords: ["calendar", "management", "bulk", "scheduling", "business"],
  authors: [{ name: "Enrollio Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-16x16.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Detect if we're in an iframe and add data attributes
              if (window.parent !== window) {
                document.documentElement.setAttribute('data-iframe', 'true');
                document.body?.setAttribute('data-iframe', 'true');
                
                // Force CSS to load in iframe
                document.addEventListener('DOMContentLoaded', function() {
                  // Add inline critical styles for iframe
                  const style = document.createElement('style');
                  style.textContent = \`
                    body { 
                      font-family: 'Inter', system-ui, sans-serif !important;
                      margin: 0 !important;
                      padding: 0 !important;
                    }
                    .bg-sidebar-dark { background-color: #000000 !important; }
                    .bg-brand-yellow { background-color: #ffc300 !important; }
                    .text-brand-navy { color: #000814 !important; }
                    .text-white { color: #ffffff !important; }
                    .border { border-width: 1px !important; }
                    .rounded-lg { border-radius: 0.5rem !important; }
                    .p-4 { padding: 1rem !important; }
                    .p-6 { padding: 1.5rem !important; }
                    .mb-4 { margin-bottom: 1rem !important; }
                    .mb-6 { margin-bottom: 1.5rem !important; }
                    .flex { display: flex !important; }
                    .hidden { display: none !important; }
                    .md\\:flex { display: flex !important; }
                    .w-64 { width: 16rem !important; }
                    .min-h-screen { min-height: 100vh !important; }
                  \`;
                  document.head.appendChild(style);
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased bg-white min-h-screen`}
      >
        <ErrorBoundary>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
