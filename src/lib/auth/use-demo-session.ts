'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DEMO_STORAGE_KEY,
  demoUsers,
  type DemoRole,
  type DemoUser
} from './demo-shared';
import { setDemoRoleCookie, clearDemoRoleCookie } from './demo-actions';

interface UseDemoSession {
  user: DemoUser | null;
  hydrated: boolean;
  signInAs: (role: DemoRole, destination: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Hook con shape similar a useSession() de NextAuth pero respaldado por
// localStorage + una cookie escrita via server action. `hydrated` evita
// el flash de "no autenticado" antes del primer effect.
export function useDemoSession(): UseDemoSession {
  const router = useRouter();
  const [user, setUser] = useState<DemoUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DemoUser;
        if (parsed && parsed.isDemo === true && (parsed.role === 'parent' || parsed.role === 'student')) {
          setUser(parsed);
        }
      }
    } catch {
      // localStorage corrupto o no disponible — ignoramos
    }
    setHydrated(true);
  }, []);

  const signInAs = useCallback(
    async (role: DemoRole, destination: string) => {
      const u = demoUsers[role];
      try {
        window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(u));
      } catch {
        // sin localStorage seguimos con cookie — esta es la fuente de verdad server-side
      }
      setUser(u);
      await setDemoRoleCookie(role);
      router.push(destination);
      router.refresh();
    },
    [router]
  );

  const signOut = useCallback(async () => {
    try {
      window.localStorage.removeItem(DEMO_STORAGE_KEY);
    } catch {
      /* noop */
    }
    setUser(null);
    await clearDemoRoleCookie();
    router.refresh();
  }, [router]);

  return { user, hydrated, signInAs, signOut };
}
