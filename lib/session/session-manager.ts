import 'server-only';
import { cookies } from 'next/headers';
import { getStorageProvider } from '@/lib/storage/storage-factory';
import type { SessionData } from '@/types/session';

const COOKIE_NAME = 'sid';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function getSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

export async function createSessionCookie(sessionId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

export async function getSession(): Promise<SessionData | null> {
  const sessionId = await getSessionId();
  if (!sessionId) return null;
  return getStorageProvider().getSession(sessionId);
}

export async function saveSession(session: SessionData): Promise<void> {
  return getStorageProvider().saveSession(session);
}

export function createEmptySession(sessionId: string): SessionData {
  return {
    sessionId,
    createdAt: new Date().toISOString(),
    feedbackIds: [],
    dismissedJobIds: [],
  };
}
