import NextAuth from 'next-auth';
import { authOptions } from '../options';

// NextAuth depende de APIs de Node (crypto) y maneja sesiones — nunca debe
// renderizarse estaticamente. `force-dynamic` evita que Next intente "collect
// page data" sobre este handler en build time, que es la causa tipica del
// fallo "Failed to collect page data for /api/auth/[...nextauth]" en Vercel.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
