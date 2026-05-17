'use server';

import { cookies } from 'next/headers';
import { DEMO_COOKIE_NAME, type DemoRole } from './demo-shared';

// Server actions invocables desde el cliente — escriben/borran la cookie
// que el server-side guard (requireParent) lee para validar la sesion demo.
// No usamos httpOnly a proposito: para que el cleanup desde JS sea consistente
// con localStorage si algun dia hace falta. Sigue siendo solo para dev.

export async function setDemoRoleCookie(role: DemoRole) {
  cookies().set(DEMO_COOKIE_NAME, role, {
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax'
  });
}

export async function clearDemoRoleCookie() {
  cookies().delete(DEMO_COOKIE_NAME);
}
