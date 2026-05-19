import 'server-only';
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { verifySecret } from '@/lib/auth/password';

/**
 * NextAuth v4 — JWT sessions con dos providers:
 *
 *   1. Google OAuth (legacy / opcional)
 *      Padres pueden firmar con Google. signIn callback crea Family+Parent
 *      en el primer login si no existe.
 *
 *   2. Credentials (parent) — Epic 01 §3a
 *      Padres con email + password (bcrypt). Lookup directo a Prisma.Parent.
 *      El signup vive en /[locale]/signup; aquí solo validamos credenciales.
 *
 * Strategy: JWT (no DB sessions). El token carga parentId + familyId + role
 * para que Server Components eviten round-trips. Schema-wise se requiere
 * `Parent.passwordHash` (nullable; los users de Google no lo tienen).
 *
 * Requiere en .env:
 *   DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (solo si Google flow está activo)
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
    }),
    CredentialsProvider({
      id: 'parent-credentials',
      name: 'Parent credentials',
      credentials: {
        email: { label: 'email', type: 'email' },
        password: { label: 'password', type: 'password' }
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim().toLowerCase() ?? '';
        const password = credentials?.password?.toString() ?? '';
        if (!email || !password) return null;

        const parent = await prisma.parent.findUnique({
          where: { email },
          select: { id: true, email: true, name: true, passwordHash: true, familyId: true }
        });
        if (!parent || !parent.passwordHash) return null;

        const ok = await verifySecret(password, parent.passwordHash);
        if (!ok) return null;

        // Lo que devolvemos llega al jwt callback como `user`. Adjuntamos
        // parentId/familyId/role como extras (tipados en next-auth.d.ts).
        return {
          id: parent.id,
          email: parent.email,
          name: parent.name,
          parentId: parent.id,
          familyId: parent.familyId,
          role: 'PARENT' as const
        };
      }
    })
  ],
  pages: {
    error: '/api/auth/error'
  },
  callbacks: {
    async signIn({ user, account }) {
      // Credentials: el authorize ya validó. Permitimos.
      if (account?.provider === 'parent-credentials') return true;

      // Google OAuth: auto-crear Family+Parent en el primer sign-in.
      if (account?.provider === 'google') {
        if (!user.email) return false;
        const existing = await prisma.parent.findUnique({
          where: { email: user.email },
          select: { id: true }
        });
        if (existing) return true;
        const familyName = user.name ? `Familia de ${user.name}` : `Familia`;
        await prisma.family.create({
          data: {
            name: familyName,
            locale: 'es',
            parents: {
              create: { email: user.email, name: user.name ?? user.email }
            }
          }
        });
        return true;
      }

      return false;
    },

    async jwt({ token, account, profile, user }) {
      // Initial sign-in: account+user están presentes. Cacheamos identidad.
      if (account?.provider === 'parent-credentials' && user) {
        // user vino del authorize() — los extras ya están tipados.
        const u = user as { id: string; parentId?: string; familyId?: string; role?: 'PARENT' };
        token.parentId = u.parentId ?? u.id;
        if (u.familyId) token.familyId = u.familyId;
        token.role = 'PARENT';
        return token;
      }

      if (account?.provider === 'google' && user?.email) {
        const parent = await prisma.parent.findUnique({
          where: { email: user.email },
          select: { id: true, familyId: true }
        });
        if (parent) {
          token.parentId = parent.id;
          token.familyId = parent.familyId;
          token.role = 'PARENT';
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
        if (token.role === 'PARENT' || token.role === 'STUDENT') session.user.role = token.role;
      }
      return session;
    }
  }
};

export function isAuthConfigured(): boolean {
  return Boolean(googleClientId && googleClientSecret && process.env.NEXTAUTH_SECRET);
}
