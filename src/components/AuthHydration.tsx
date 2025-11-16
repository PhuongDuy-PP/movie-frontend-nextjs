'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';

export function AuthHydration({ children }: { children: React.ReactNode }) {
  const { isHydrated, hydrate } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) {
      hydrate();
    }
  }, [isHydrated, hydrate]);

  return <>{children}</>;
}




