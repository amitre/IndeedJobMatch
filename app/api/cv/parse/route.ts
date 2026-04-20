export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import { extractText } from '@/lib/cv-parser/pdf-extractor';
import { structureCVWithClaude } from '@/lib/cv-parser/claude-structurer';
import { createEmptySession, createSessionCookie, saveSession } from '@/lib/session/session-manager';

const ACCEPTED_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('cv');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!ACCEPTED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Only PDF and Word (.docx) files are supported' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 10 MB' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const rawText = await extractText(buffer, file.type);

    if (rawText.length < 50) {
      return NextResponse.json({ error: 'Could not extract text from the file. Please try a different format.' }, { status: 422 });
    }

    const cv = await structureCVWithClaude(rawText);

    const sessionId = crypto.randomUUID();
    const session = createEmptySession(sessionId);
    session.cv = cv;
    await saveSession(session);
    await createSessionCookie(sessionId);

    return NextResponse.json({ sessionId, cv });
  } catch (e) {
    console.error('[CV parse]', e);
    return NextResponse.json({ error: 'Failed to parse CV. Please try again.' }, { status: 500 });
  }
}
