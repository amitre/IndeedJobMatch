import { NextRequest, NextResponse } from 'next/server';
import { generateQuestionsWithClaude } from '@/lib/questions/claude-question-gen';
import { getSession, saveSession } from '@/lib/session/session-manager';
import type { ParsedCV } from '@/types/cv';

export async function POST(req: NextRequest) {
  try {
    const { cv } = (await req.json()) as { cv: ParsedCV };
    if (!cv) {
      return NextResponse.json({ error: 'CV data required' }, { status: 400 });
    }

    const session = await getSession();
    if (session?.questions) {
      return NextResponse.json({ questions: session.questions });
    }

    const questions = await generateQuestionsWithClaude(cv);

    if (session) {
      session.questions = questions;
      await saveSession(session).catch(() => {});
    }

    console.log('[Questions] generated IDs:', questions.map((q) => `${q.id}(${q.type})`).join(', '));
    return NextResponse.json({ questions });
  } catch (e) {
    console.error('[Questions]', e);
    return NextResponse.json({ error: 'Failed to generate questions.' }, { status: 500 });
  }
}
