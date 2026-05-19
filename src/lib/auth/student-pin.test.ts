import { describe, it, expect } from 'vitest';
import { isValidPin, hashPin, verifyPin, PIN_LENGTH } from './student-pin';

describe('student PIN rules', () => {
  it('isValidPin accepts exactly 4 digits', () => {
    expect(isValidPin('1234')).toBe(true);
    expect(isValidPin('0000')).toBe(true);
    expect(isValidPin('9999')).toBe(true);
  });

  it('isValidPin rejects non-4-digit input', () => {
    expect(isValidPin('123')).toBe(false);
    expect(isValidPin('12345')).toBe(false);
    expect(isValidPin('')).toBe(false);
    expect(isValidPin('12a4')).toBe(false);
    expect(isValidPin('   1234')).toBe(false);
    expect(isValidPin('1 2 3 4')).toBe(false);
  });

  it('PIN_LENGTH is exposed as 4', () => {
    expect(PIN_LENGTH).toBe(4);
  });

  it('hashPin throws on invalid format', async () => {
    await expect(hashPin('123')).rejects.toThrow();
    await expect(hashPin('abcd')).rejects.toThrow();
  });

  it('verifyPin accepts the matching PIN against a fresh hash', async () => {
    const hash = await hashPin('1234');
    expect(await verifyPin('1234', hash)).toBe(true);
  });

  it('verifyPin rejects wrong PIN, malformed PIN, and missing hash', async () => {
    const hash = await hashPin('1234');
    expect(await verifyPin('0000', hash)).toBe(false);
    expect(await verifyPin('abc1', hash)).toBe(false);
    expect(await verifyPin('1234', null)).toBe(false);
    expect(await verifyPin('1234', undefined)).toBe(false);
    expect(await verifyPin('1234', '')).toBe(false);
  });
});
