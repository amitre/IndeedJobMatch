import 'server-only';
import type { StorageProvider } from './storage-interface';
import type { SessionData } from '@/types/session';
import type { FeedbackEntry } from '@/types/feedback';

export class VercelKVProvider implements StorageProvider {
  private async kv() {
    const { kv } = await import('@vercel/kv');
    return kv;
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    const kv = await this.kv();
    return kv.get<SessionData>(`session:${sessionId}`);
  }

  async saveSession(session: SessionData): Promise<void> {
    const kv = await this.kv();
    await kv.set(`session:${session.sessionId}`, session, { ex: 604800 });
  }

  async getFeedback(sessionId: string): Promise<FeedbackEntry[]> {
    const kv = await this.kv();
    const entries = await kv.lrange<FeedbackEntry>(`feedback:${sessionId}`, 0, -1);
    return entries ?? [];
  }

  async saveFeedback(entry: FeedbackEntry): Promise<void> {
    const kv = await this.kv();
    await kv.rpush(`feedback:${entry.sessionId}`, entry);
  }
}
