export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromDocx } from '@/lib/cv-parser/pdf-extractor';
import { structureCVFromPDF, structureCVWithClaude } from '@/lib/cv-parser/claude-structurer';
import { createEmptySession, createSessionCookie, saveSession } from '@/lib/session/session-manager';

const PDF_TYPE = 'application/pdf';
const DOCX_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const ACCEPTED_TYPES = new Set([PDF_TYPE, DOCX_TYPE]);

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

    let cv;
    if (file.type === PDF_TYPE) {
      cv = await structureCVFromPDF(buffer);
    } else {
      const rawText = await extractTextFromDocx(buffer);
      if (rawText.length < 50) {
        return NextResponse.json({ error: 'Could not extract text from the file. Please try a different format.' }, { status: 422 });
      }
      cv = await structureCVWithClaude(rawText);
    }

    const sessionId = crypto.randomUUID();
    const session = createEmptySession(sessionId);
    session.cv = cv;
    await saveSession(session);
    await createSessionCookie(sessionId);

    return NextResponse.json({ sessionId, cv });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[CV parse]', e);
    return NextResponse.json({ error: `Parse failed: ${msg}` }, { status: 500 });
  }
}
