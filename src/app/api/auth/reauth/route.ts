import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import { prisma } from '@/lib/prisma';
import { verifySecret } from '@/lib/auth/password';
import { reauthRequestSchema } from '@/lib/schemas/student';

/**
 * POST /api/auth/reauth — Epic 03 §2.5.
 *
 * Re-verifica la contraseña del Parent autenticado antes de mostrar el
 * Stripe Payment Element. Mitiga session hijacking ("dejaste la laptop
 * abierta y alguien te agrega un estudiante") sin pedir 2FA.
 *
 * Importante: NO modifica la sesión ni emite token nuevo. El cliente
 * usa el `{ ok: true }` como flag UI para abrir el Step B del modal.
 * Si querés "pinear" el resultado por N minutos, agregá un nonce en
 * cookie HTTP-only (futuro hardening — punt v2).
 *
 * Rate-limit 3-fails/15min queda como pendiente Epic 04 (requiere
 * campos lastReauthFailedAt + reauthFailedCount en Parent).
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function jsonError(status: number, code: string) {
  return Response.json({ error: code }, { status });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.parentId) return jsonError(401, 'unauthorized');

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return jsonError(400, 'invalid_json');
  }
  const parsed = reauthRequestSchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, 'invalid_body');

  const parent = await prisma.parent.findUnique({
    where: { id: session.user.parentId },
    select: { passwordHash: true }
  });
  if (!parent?.passwordHash) {
    // OAuth-only accounts (Google) no tienen passwordHash. UX punt:
    // los mandamos a setear password antes de poder cobrar.
    return jsonError(409, 'no_password_set');
  }

  const ok = await verifySecret(parsed.data.password, parent.passwordHash);
  if (!ok) return jsonError(401, 'invalid_password');

  return Response.json({ ok: true });
}
