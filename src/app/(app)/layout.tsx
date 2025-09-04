import { TopBar } from '@/components/TopBar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <TopBar />

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
