/**
 * POST /api/device/generate-link — Mejora 11 (Device Pairing).
 *
 * Genera un DeviceLinkToken para la familia del padre autenticado.
 * El token expira en 7 días. El link resultante, al abrirse en cualquier
 * dispositivo, setea la cookie midsea_device_family y redirige a /student-login.
 *
 * Requiere sesión de padre (JWT con parentId). No disponible para demo.
 *
 * Response: { linkUrl: string, expiresAt: string }
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/options';
import { prisma } from '@/lib/prisma';

function jsonError(status: number, code: string) {
  return NextResponse.json({ error: code }, { status });
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.parentId) return jsonError(401, 'unauthorized');
  const parentId = session.user.parentId;

  // Resolver familyId del padre
  const parent = await prisma.parent.findUnique({
    where: { id: parentId },
    select: { familyId: true, family: { select: { locale: true } } }
  });
  if (!parent) return jsonError(404, 'parent_not_found');

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const record = await prisma.deviceLinkToken.create({
    data: {
      familyId: parent.familyId,
      expiresAt
    }
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.midsea.com';
  const locale = parent.family?.locale ?? 'es';
  const linkUrl = `${baseUrl}/${locale}/device/link/${record.token}`;

  return NextResponse.json({ linkUrl, expiresAt: record.expiresAt.toISOString() });
}
