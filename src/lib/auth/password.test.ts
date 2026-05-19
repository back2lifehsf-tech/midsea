import { describe, it, expect } from 'vitest';
import { hashSecret, verifySecret } from './password';

describe('password primitives', () => {
  it('hashSecret produces a non-empty string distinct from the input', async () => {
    const plain = 'demo1234';
    const hash = await hashSecret(plain);
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(20);
    expect(hash).not.toBe(plain);
  });

  it('verifySecret returns true for the matching plaintext', async () => {
    const hash = await hashSecret('correct horse battery staple');
    expect(await verifySecret('correct horse battery staple', hash)).toBe(true);
  });

  it('verifySecret returns false for a mismatching plaintext', async () => {
    const hash = await hashSecret('actual');
    expect(await verifySecret('different', hash)).toBe(false);
    expect(await verifySecret('', hash)).toBe(false);
  });

  it('hashSecret produces distinct hashes for the same plaintext (salted)', async () => {
    const plain = 'demo1234';
    const a = await hashSecret(plain);
    const b = await hashSecret(plain);
    expect(a).not.toBe(b);
    // Pero ambos siguen verificando.
    expect(await verifySecret(plain, a)).toBe(true);
    expect(await verifySecret(plain, b)).toBe(true);
  });
});
