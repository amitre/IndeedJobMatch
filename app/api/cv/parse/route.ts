export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPDF } from '@/lib/cv-parser/pdf-extractor';
import { structureCVWithClaude } from '@/lib/cv-parser/claude-structurer';
import { createEmptySession, createSessionCookie, saveSession } from '@/lib/session/session-manager';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('cv');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 10 MB' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const rawText = await extractTextFromPDF(buffer);

    if (rawText.length < 50) {
      return NextResponse.json({ error: 'Could not extract text from PDF. Please try a text-based PDF.' }, { status: 422 });
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
