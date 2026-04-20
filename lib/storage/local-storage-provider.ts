import 'server-only';
import fs from 'fs';
import path from 'path';
import type { StorageProvider } from './storage-interface';
import type { SessionData } from '@/types/session';
import type { FeedbackEntry } from '@/types/feedback';

const DATA_DIR = process.env.VERCEL ? '/tmp/data' : path.join(process.cwd(), 'data');
const SESSIONS_DIR = path.join(DATA_DIR, 'sessions');
const FEEDBACK_FILE = path.join(DATA_DIR, 'feedback.json');

function ensureDirs() {
  if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });
  if (!fs.existsSync(FEEDBACK_FILE)) fs.writeFileSync(FEEDBACK_FILE, '[]');
}

export class LocalStorageProvider implements StorageProvider {
  async getSession(sessionId: string): Promise<SessionData | null> {
    ensureDirs();
    const file = path.join(SESSIONS_DIR, `${sessionId}.json`);
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as SessionData;
  }

  async saveSession(session: SessionData): Promise<void> {
    ensureDirs();
    const file = path.join(SESSIONS_DIR, `${session.sessionId}.json`);
    fs.writeFileSync(file, JSON.stringify(session, null, 2));
  }

  async getFeedback(sessionId: string): Promise<FeedbackEntry[]> {
    ensureDirs();
    const all: FeedbackEntry[] = JSON.parse(fs.readFileSync(FEEDBACK_FILE, 'utf-8'));
    return all.filter((e) => e.sessionId === sessionId);
  }

  async saveFeedback(entry: FeedbackEntry): Promise<void> {
    ensureDirs();
    const all: FeedbackEntry[] = JSON.parse(fs.readFileSync(FEEDBACK_FILE, 'utf-8'));
    all.push(entry);
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(all, null, 2));
  }
}
