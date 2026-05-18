import { NextRequest } from 'next/server';
import { getOpenAI, TUTOR_MODEL } from '@/lib/openai';
import { buildSylvieSystemPrompt } from '@/lib/tutor/prompts/sylvie-system';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface IncomingMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface TutorRequest {
  locale: 'es' | 'en';
  messages: IncomingMessage[];
  studentFirstName?: string;
  gradeLevel?: number;
  // Contexto curricular (puede llegar como lessonTitle o legacy `topic`).
  lessonTitle?: string;
  topic?: string;
  subject?: string;
  // Senales de sesion (opcional — Sylvie las usa para personalizar).
  currentExercise?: number;
  totalExercises?: number;
  consecutiveErrors?: number;
  msSinceLastAttempt?: number;
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'OPENAI_API_KEY missing on server' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }

  let body: TutorRequest;
  try {
    body = (await req.json()) as TutorRequest;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'content-type': 'application/json' }
    });
  }

  const locale = body.locale === 'en' ? 'en' : 'es';
  const userMessages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];

  const system = buildSylvieSystemPrompt({
    locale,
    studentFirstName: body.studentFirstName,
    gradeLevel: body.gradeLevel,
    lessonTitle: body.lessonTitle ?? body.topic,
    subject: body.subject,
    currentExercise: body.currentExercise,
    totalExercises: body.totalExercises,
    consecutiveErrors: body.consecutiveErrors,
    msSinceLastAttempt: body.msSinceLastAttempt
  });

  const client = getOpenAI();

  const completion = await client.chat.completions.create({
    model: TUTOR_MODEL,
    temperature: 0.6,
    stream: true,
    messages: [
      { role: 'system', content: system },
      ...userMessages.map((m) => ({ role: m.role, content: m.content }))
    ]
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of completion) {
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) controller.enqueue(encoder.encode(delta));
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    }
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff'
    }
  });
}
