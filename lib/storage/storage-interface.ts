import type { SessionData } from '@/types/session';
import type { FeedbackEntry } from '@/types/feedback';

export interface StorageProvider {
  getSession(sessionId: string): Promise<SessionData | null>;
  saveSession(session: SessionData): Promise<void>;
  getFeedback(sessionId: string): Promise<FeedbackEntry[]>;
  saveFeedback(entry: FeedbackEntry): Promise<void>;
}
