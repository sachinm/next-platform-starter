'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/AuthProvider';
import TopNavigation from '../../components/TopNavigation';

export default function DashboardLayout({ children }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/signin');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen text-white">
      {/* Top Navigation */}
      <TopNavigation />

      {/* Main Content */}
      <div className="flex">
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}