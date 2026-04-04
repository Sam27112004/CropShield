'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import OfflineBanner from '@/components/OfflineBanner';
import { useAuth } from '@/context/AuthContext';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-deep">
      <div className="glass rounded-2xl border border-primary/10 px-6 py-5 text-sm text-foreground-muted">
        Loading authentication...
      </div>
    </div>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!user && pathname !== '/login') {
      router.replace('/login');
      return;
    }

    if (user && pathname === '/login') {
      router.replace(user.role === 'farmer' ? '/farmer/requests' : '/');
      return;
    }

    if (user?.role === 'farmer' && !pathname.startsWith('/farmer')) {
      router.replace('/farmer/requests');
    }
  }, [isLoading, pathname, router, user]);

  if (isLoading) return <LoadingScreen />;

  if (!user && pathname !== '/login') return <LoadingScreen />;

  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-background-deep">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 lg:ml-[316px]">
        <Header />
        <main className="flex-1 px-4 pt-20 pb-8 md:px-6 lg:px-10 lg:pt-[116px]">
          <OfflineBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
