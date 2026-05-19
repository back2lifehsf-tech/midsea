import { describe, it, expect, vi, beforeEach } from 'vitest';

const { findUnique, findMany } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  findMany: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    student: { findUnique },
    tutorMessage: { findMany }
  }
}));

import { loadStudentTutorContext, HISTORY_LIMIT } from './StudentContextEngine';

describe('StudentContextEngine.loadStudentTutorContext', () => {
  beforeEach(() => {
    findUnique.mockReset();
    findMany.mockReset();
  });

  it('throws when student does not exist', async () => {
    findUnique.mockResolvedValue(null);
    await expect(loadStudentTutorContext('ghost')).rejects.toThrow(/not found/i);
  });

  it('returns student summary in the expected shape', async () => {
    findUnique.mockResolvedValue({
      id: 's1',
      displayName: 'Sofía',
      gradeLevel: 3,
      preferredLocale: 'es'
    });
    findMany.mockResolvedValue([]);

    const ctx = await loadStudentTutorContext('s1');
    expect(ctx.student).toEqual({
      id: 's1',
      displayName: 'Sofía',
      gradeLevel: 3,
      locale: 'es'
    });
    expect(ctx.recentMessages).toEqual([]);
  });

  it('returns messages in cronological order (oldest first)', async () => {
    findUnique.mockResolvedValue({
      id: 's1',
      displayName: 'Mateo',
      gradeLevel: 5,
      preferredLocale: 'en'
    });
    // Prisma devuelve desc (más recientes primero). El engine debe invertir.
    const newest = new Date('2026-05-19T12:00:00Z');
    const middle = new Date('2026-05-18T12:00:00Z');
    const oldest = new Date('2026-05-17T12:00:00Z');
    findMany.mockResolvedValue([
      { id: '3', role: 'assistant', content: 'C', createdAt: newest },
      { id: '2', role: 'user', content: 'B', createdAt: middle },
      { id: '1', role: 'assistant', content: 'A', createdAt: oldest }
    ]);

    const ctx = await loadStudentTutorContext('s1');
    expect(ctx.recentMessages.map((m) => m.content)).toEqual(['A', 'B', 'C']);
    expect(ctx.recentMessages[0].createdAt).toEqual(oldest);
    expect(ctx.recentMessages[2].createdAt).toEqual(newest);
  });

  it('queries Prisma capped at HISTORY_LIMIT (no unbounded scans)', async () => {
    findUnique.mockResolvedValue({
      id: 's1',
      displayName: 'X',
      gradeLevel: 1,
      preferredLocale: 'es'
    });
    findMany.mockResolvedValue([]);

    await loadStudentTutorContext('s1');
    expect(findMany).toHaveBeenCalledTimes(1);
    const args = findMany.mock.calls[0][0];
    expect(args.take).toBe(HISTORY_LIMIT);
    expect(args.orderBy).toEqual({ createdAt: 'desc' });
    expect(args.where).toEqual({ session: { studentId: 's1' } });
  });
});
