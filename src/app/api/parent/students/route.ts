import { NextRequest } from 'next/server';
import type { Locale } from '@prisma/client';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { hashPin, isValidPin } from '@/lib/auth/student-pin';
import { isAvatarKey } from '@/lib/auth/avatars';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ErrorCode =
  | 'unauthorized'
  | 'invalid_json'
  | 'name_required'
  | 'birth_date_required'
  | 'grade_invalid'
  | 'pin_invalid'
  | 'avatar_required'
  | 'generic';

function err(status: number, code: ErrorCode): Response {
  return new Response(JSON.stringify({ error: code }), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

interface CreateStudentBody {
  name?: string;
  birthDate?: string;
  gradeLevel?: number | string;
  pin?: string;
  avatarKey?: string;
  preferredLocale?: Locale;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.parentId || !session.user.familyId) {
    return err(401, 'unauthorized');
  }

  let body: CreateStudentBody;
  try {
    body = (await req.json()) as CreateStudentBody;
  } catch {
    return err(400, 'invalid_json');
  }

  const name = body.name?.toString().trim() ?? '';
  const birthDateStr = body.birthDate?.toString().trim() ?? '';
  const gradeLevel = Number(body.gradeLevel);
  const pin = body.pin?.toString().trim() ?? '';
  const avatarKey = body.avatarKey?.toString().trim() ?? '';
  const preferredLocale: Locale = body.preferredLocale === 'en' ? 'en' : 'es';

  if (!name) return err(400, 'name_required');
  if (!birthDateStr) return err(400, 'birth_date_required');
  const birthDate = new Date(birthDateStr);
  if (Number.isNaN(birthDate.getTime())) return err(400, 'birth_date_required');
  if (!Number.isInteger(gradeLevel) || gradeLevel < 0 || gradeLevel > 12) {
    return err(400, 'grade_invalid');
  }
  if (!isValidPin(pin)) return err(400, 'pin_invalid');
  if (!isAvatarKey(avatarKey)) return err(400, 'avatar_required');

  try {
    const student = await prisma.student.create({
      data: {
        displayName: name,
        birthDate,
        gradeLevel,
        preferredLocale,
        pinHash: await hashPin(pin),
        avatarKey,
        familyId: session.user.familyId
      },
      select: { id: true, displayName: true, avatarKey: true }
    });
    return new Response(JSON.stringify({ ok: true, student }), {
      status: 201,
      headers: { 'content-type': 'application/json' }
    });
  } catch (e) {
    console.error('[/api/parent/students] error:', e);
    return err(500, 'generic');
  }
}
