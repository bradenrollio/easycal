import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Enrollio - Bulk Calendar Management",
  description: "Brand-aware bulk calendar management for your business",
  keywords: ["calendar", "management", "bulk", "scheduling", "business"],
  authors: [{ name: "Enrollio Team" }],
  viewport: "width=device-width, initial-scale=1",
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
              }
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased bg-white min-h-screen`}
      >
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
