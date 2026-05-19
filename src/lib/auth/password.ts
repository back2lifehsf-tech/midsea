import 'server-only';
import bcrypt from 'bcryptjs';

/**
 * Hashing primitivo de password/PIN. Epic 01 §4 — bcryptjs.
 *
 * SALT_ROUNDS = 10 (default seguro de la industria; 12+ es mejor pero
 * empuja la latencia de login a 200-400ms; mantenemos 10 para v1).
 *
 * Las reglas de dominio (longitud mínima, complejidad, validación de PIN)
 * viven en sus respectivos módulos (`student-pin.ts`, validación de signup);
 * aquí solo se exponen primitivas.
 */

const SALT_ROUNDS = 10;

export async function hashSecret(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifySecret(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
