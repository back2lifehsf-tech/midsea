'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import type { ReactNode } from 'react';

/**
 * Wrap children con el SessionProvider de NextAuth. Montar en el layout raiz
 * o en sub-arbol donde se necesite useSession().
 *
 * Uso:
 *   <SessionProvider><App /></SessionProvider>
 */
export function SessionProvider({
  children,
  session
}: {
  children: ReactNode;
  session?: Session | null;
}) {
  return <NextAuthSessionProvider session={session}>{children}</NextAuthSessionProvider>;
}
