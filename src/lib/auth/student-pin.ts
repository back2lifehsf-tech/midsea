import 'server-only';
import { hashSecret, verifySecret } from './password';

/**
 * Reglas de PIN de estudiante. Epic 01 §3b.
 *
 * Formato: exactamente 4 dígitos. Sin letras, sin símbolos.
 * El padre lo asigna al crear el perfil; el niño lo recuerda visualmente
 * (avatar + 4 botones de teclado numérico).
 *
 * Hash: bcryptjs vía `password.ts`. El espacio de 10^4 PINs es pequeño,
 * por lo que en v2 conviene agregar rate-limit y posiblemente lock-out
 * por estudiante (campos `pinAttemptsCount` + `pinLockedUntil`). Por ahora
 * el riesgo es local (un padre comparte device con sus hijos).
 */

export const PIN_LENGTH = 4;
const PIN_RE = /^\d{4}$/;

export function isValidPin(value: string): boolean {
  return PIN_RE.test(value);
}

export async function hashPin(pin: string): Promise<string> {
  if (!isValidPin(pin)) {
    throw new Error('Invalid PIN format (expected 4 digits)');
  }
  return hashSecret(pin);
}

export async function verifyPin(pin: string, hash: string | null | undefined): Promise<boolean> {
  if (!hash) return false;
  if (!isValidPin(pin)) return false;
  return verifySecret(pin, hash);
}
