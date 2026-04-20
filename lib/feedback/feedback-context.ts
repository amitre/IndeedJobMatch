import 'server-only';
import { getStorageProvider } from '@/lib/storage/storage-factory';
import { FEEDBACK_REASON_LABELS } from '@/types/feedback';
import type { FeedbackReason } from '@/types/feedback';

export async function buildFeedbackContext(sessionId: string): Promise<string> {
  const entries = await getStorageProvider().getFeedback(sessionId);
  if (entries.length === 0) return '';

  const reasonCounts = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.reason] = (acc[e.reason] ?? 0) + 1;
    return acc;
  }, {});

  const lines = Object.entries(reasonCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([reason, count]) => {
      const label = FEEDBACK_REASON_LABELS[reason as FeedbackReason] ?? reason;
      return `- ${label} (${count} time${count > 1 ? 's' : ''})`;
    });

  const notes = entries
    .filter((e) => e.customNote)
    .map((e) => e.customNote)
    .join('; ');

  return (
    `The user has previously dismissed jobs for these reasons:\n${lines.join('\n')}` +
    (notes ? `\nAdditional notes: ${notes}` : '') +
    '\n\nPenalize this job\'s score if it shares these characteristics and call them out in the gaps.'
  );
}
