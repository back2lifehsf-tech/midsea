import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { hashSecret } from '@/lib/auth/password';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SignupRequest {
  email?: string;
  name?: string;
  password?: string;
  locale?: string;
}

interface ErrorBody {
  error: ErrorCode;
}
type ErrorCode =
  | 'invalid_json'
  | 'email_required'
  | 'email_invalid'
  | 'name_required'
  | 'password_too_short'
  | 'email_taken'
  | 'generic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function err(status: number, code: ErrorCode): Response {
  const body: ErrorBody = { error: code };
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

export async function POST(req: NextRequest) {
  let body: SignupRequest;
  try {
    body = (await req.json()) as SignupRequest;
  } catch {
    return err(400, 'invalid_json');
  }

  const email = body.email?.toString().trim().toLowerCase() ?? '';
  const name = body.name?.toString().trim() ?? '';
  const password = body.password?.toString() ?? '';
  const locale = body.locale === 'en' ? 'en' : 'es';

  if (!email) return err(400, 'email_required');
  if (!EMAIL_RE.test(email)) return err(400, 'email_invalid');
  if (!name) return err(400, 'name_required');
  if (password.length < 8) return err(400, 'password_too_short');

  const passwordHash = await hashSecret(password);
  const familyName = `Familia de ${name}`;

  try {
    await prisma.family.create({
      data: {
        name: familyName,
        locale,
        parents: {
          create: { email, name, passwordHash }
        }
      }
    });
  } catch (e) {
    // Unique-constraint violation en email → ya existe cuenta.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return err(409, 'email_taken');
    }
    console.error('[/api/auth/signup] error:', e);
    return err(500, 'generic');
  }

  // 201: el cliente ahora llama signIn('parent-credentials', { email, password })
  // para obtener la sesion JWT. No firmamos aqui (server actions + NextAuth
  // signIn() en client-side es el patron canonico en NextAuth v4).
  return new Response(JSON.stringify({ ok: true, email }), {
    status: 201,
    headers: { 'content-type': 'application/json' }
  });
}
