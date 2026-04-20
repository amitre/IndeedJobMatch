import { NextRequest, NextResponse } from 'next/server';
import { getSession, saveSession } from '@/lib/session/session-manager';
import { getStorageProvider } from '@/lib/storage/storage-factory';
import type { FeedbackEntry, FeedbackReason } from '@/types/feedback';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No active session' }, { status: 401 });
    }

    const { jobId, jobTitle, company, reason, customNote } = await req.json() as {
      jobId: string;
      jobTitle: string;
      company: string;
      reason: FeedbackReason;
      customNote?: string;
    };

    const entry: FeedbackEntry = {
      id: crypto.randomUUID(),
      sessionId: session.sessionId,
      jobId,
      jobTitle,
      company,
      reason,
      customNote,
      createdAt: new Date().toISOString(),
    };

    await getStorageProvider().saveFeedback(entry);

    session.feedbackIds = [...(session.feedbackIds ?? []), entry.id];
    session.dismissedJobIds = [...(session.dismissedJobIds ?? []), jobId];
    await saveSession(session);

    return NextResponse.json({ feedbackId: entry.id });
  } catch (e) {
    console.error('[Feedback]', e);
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
}
