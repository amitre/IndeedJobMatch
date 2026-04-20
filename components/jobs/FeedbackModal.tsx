'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FEEDBACK_REASON_LABELS } from '@/types/feedback';
import type { FeedbackReason } from '@/types/feedback';

interface Props {
  jobId: string;
  jobTitle: string;
  company: string;
  onClose: () => void;
  onDismissed: () => void;
}

const REASONS = Object.entries(FEEDBACK_REASON_LABELS) as [FeedbackReason, string][];

export function FeedbackModal({ jobId, jobTitle, company, onClose, onDismissed }: Props) {
  const [reason, setReason] = useState<FeedbackReason | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!reason) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, jobTitle, company, reason, customNote: note || undefined }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Failed to save feedback');
      }
      onDismissed();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Not relevant?</h3>
          <p className="text-sm text-gray-500 mt-1">
            Tell us why <strong>{jobTitle}</strong> at <strong>{company}</strong> isn&apos;t a fit.
            We&apos;ll use this to improve your matches.
          </p>
        </div>

        <div className="space-y-2">
          {REASONS.map(([value, label]) => (
            <label key={value} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
              <input
                type="radio"
                name="reason"
                value={value}
                checked={reason === value}
                onChange={() => setReason(value)}
                className="text-blue-600"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Additional note (optional)</label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            placeholder="e.g. No startups, prefer established companies"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-1">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            variant="danger"
            onClick={submit}
            loading={loading}
            disabled={!reason}
            className="flex-1"
          >
            Dismiss job
          </Button>
        </div>
      </div>
    </div>
  );
}
