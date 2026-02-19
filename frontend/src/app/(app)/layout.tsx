'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { hasPermission } from '@/lib/rbac';
import { Sidebar } from '@/components/Sidebar';
import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, token, initialize, isInitialized } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isInitialized && !token && typeof window !== 'undefined') {
      router.push('/login');
    }
  }, [token, isInitialized, router]);

  // Check route permissions
  useEffect(() => {
    if (user && pathname) {
      const hasAccess = hasPermission(user.role, pathname);
      if (!hasAccess) {
        router.push('/dashboard');
      }
    }
  }, [user, pathname, router]);

  // Wait for initialization before rendering
  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user || !token) {
    return null;
  }

  // If user doesn't have access to current route
  if (!hasPermission(user.role, pathname)) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
            <Card className="max-w-md">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                <p className="text-muted-foreground mb-4">
                  You don't have permission to access this page.
                </p>
                <Button onClick={() => router.push('/dashboard')}>
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-14 items-center justify-between border-b bg-background px-6 shrink-0">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <Search size={16} className="text-muted-foreground" />
            <Input placeholder="Search students, staff..." className="h-8 border-0 bg-muted focus-visible:ring-0 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
            </Button>
          </div>
        </header>
        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
