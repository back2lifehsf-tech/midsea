import 'server-only';
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';

/**
 * NextAuth v4 — Google OAuth + JWT sessions.
 *
 * Autoridad de identidad: Prisma.Parent. En el primer sign-in creamos
 * Family + Parent en una transaccion implicita (nested create). El JWT
 * carga parentId/familyId en cada sesion para que los Server Components
 * eviten un round-trip extra a la DB.
 *
 * Schema-wise NO tocamos Prisma — usamos el email de Google como clave.
 * googleSub viaja en el token solo como referencia (no es el lookup key
 * en v1; si Google rota el email, escalaria a un campo googleSub @unique).
 *
 * Requiere en .env.local:
 *   DATABASE_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
 *   NEXTAUTH_SECRET, NEXTAUTH_URL
 */

const googleClientId = process.env.GOOGLE_CLIENT_ID ?? '';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ?? '';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
        }
      }
    })
  ],
  pages: {
    error: '/api/auth/error'
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'google') return false;
      if (!user.email) return false;

      const existing = await prisma.parent.findUnique({
        where: { email: user.email },
        select: { id: true }
      });
      if (existing) return true;

      // Primer sign-in: crear Family + Parent. El nombre de Family es editable
      // luego en /parent/settings; por default usamos el del padre.
      // Locale: 'es' por convencion (Midsea es-first per PRD seccion 3.1).
      const familyName = user.name ? `Familia de ${user.name}` : `Familia`;
      await prisma.family.create({
        data: {
          name: familyName,
          locale: 'es',
          parents: {
            create: {
              email: user.email,
              name: user.name ?? user.email
            }
          }
        }
      });
      return true;
    },

    async jwt({ token, account, profile, user }) {
      // Initial sign-in: account+user solo estan presentes la primera vez.
      // Buscamos el Parent por email (ya garantizado por signIn) y cacheamos
      // parentId/familyId en el token para todas las sesiones siguientes.
      if (account?.provider === 'google' && user?.email) {
        const parent = await prisma.parent.findUnique({
          where: { email: user.email },
          select: { id: true, familyId: true }
        });
        if (parent) {
          token.parentId = parent.id;
          token.familyId = parent.familyId;
        }
        if (profile && 'sub' in profile) {
          token.googleSub = String(profile.sub);
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        if (typeof token.parentId === 'string') session.user.parentId = token.parentId;
        if (typeof token.familyId === 'string') session.user.familyId = token.familyId;
        if (typeof token.googleSub === 'string') session.user.googleSub = token.googleSub;
      }
      return session;
    }
  }
};

export function isAuthConfigured(): boolean {
  return Boolean(googleClientId && googleClientSecret && process.env.NEXTAUTH_SECRET);
}
