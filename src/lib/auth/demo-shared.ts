// Tipos/constantes compartidos del demo mode. Sin 'use server' ni 'server-only'
// para que puedan importarse desde client + server sin restricciones.
//
// El demo mode existe SOLO para iterar UI sin Google OAuth ni DB. NO usar en
// produccion: la sesion vive en cookie sin firmar + localStorage del cliente,
// trivialmente falsificable.

export const DEMO_COOKIE_NAME = 'midsea_demo_role';
export const DEMO_STORAGE_KEY = 'midsea_demo_user';

export type DemoRole = 'parent' | 'student';

export interface DemoUser {
  role: DemoRole;
  name: string;
  email: string;
  image: string | null;
  isDemo: true;
}

export const demoUsers: Record<DemoRole, DemoUser> = {
  parent: {
    role: 'parent',
    name: 'Demo Parent',
    email: 'demo@midsea.app',
    image: null,
    isDemo: true
  },
  student: {
    role: 'student',
    name: 'Demo Student',
    email: 'demo@midsea.app',
    image: null,
    isDemo: true
  }
};

export function isDemoRole(value: unknown): value is DemoRole {
  return value === 'parent' || value === 'student';
}
