'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isAdminPage = pathname?.startsWith('/admin');

  if (isAuthPage || isAdminPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col w-full">
      <Header />
      <main className="flex-grow pt-20 w-full">{children}</main>
      <Footer />
    </div>
  );
}

