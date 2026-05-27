/**
 * GET /[locale]/device/link/[token] — Mejora 11 (Device Pairing).
 *
 * Route Handler (NO es una page). El estudiante abre este link en su
 * tablet/PC. Valida el token, setea la cookie midsea_device_family con el
 * familyId (1 año, httpOnly) y redirige a /[locale]/student-login.
 *
 * No requiere autenticación — es el primer punto de contacto del dispositivo.
 *
 * Flujo de error → /student-login/invalid-link?reason=expired|not_found
 */
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEVICE_FAMILY_COOKIE = 'midsea_device_family';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 año

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string; locale: string } }
) {
  const { token, locale } = params;

  const record = await prisma.deviceLinkToken.findUnique({
    where: { token },
    include: { family: true }
  });

  // Token no encontrado
  if (!record) {
    return NextResponse.redirect(
      new URL(`/${locale}/student-login/invalid-link?reason=not_found`, request.url)
    );
  }

  // Token expirado (más de 7 días)
  if (record.expiresAt < new Date()) {
    return NextResponse.redirect(
      new URL(`/${locale}/student-login/invalid-link?reason=expired`, request.url)
    );
  }

  // Marcar como usado la primera vez (auditoría; el token sigue siendo válido)
  if (!record.usedAt) {
    await prisma.deviceLinkToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() }
    });
  }

  // Setear cookie de familia y redirigir al selector de estudiante
  const response = NextResponse.redirect(
    new URL(`/${locale}/student-login`, request.url)
  );
  response.cookies.set(DEVICE_FAMILY_COOKIE, record.familyId, {
    maxAge: COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  });
  return response;
}
