import { NextResponse } from 'next/server';
import { generateQuestionsWithClaude } from '@/lib/questions/claude-question-gen';
import { getSession, saveSession } from '@/lib/session/session-manager';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.cv) {
      return NextResponse.json({ error: 'No active session or CV not uploaded' }, { status: 401 });
    }

    if (session.questions) {
      return NextResponse.json({ questions: session.questions });
    }

    const questions = await generateQuestionsWithClaude(session.cv);
    session.questions = questions;
    await saveSession(session);

    return NextResponse.json({ questions });
  } catch (e) {
    console.error('[Questions]', e);
    return NextResponse.json({ error: 'Failed to generate questions.' }, { status: 500 });
  }
}
