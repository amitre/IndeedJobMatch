'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { OnboardingQuestion, OnboardingAnswer, UserPreferences } from '@/types/preferences';
import { QuestionField } from './QuestionField';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';

interface Props {
  questions: OnboardingQuestion[];
}

export function QuestionForm({ questions }: Props) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, OnboardingAnswer['value']>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setAnswer = (id: string, value: OnboardingAnswer['value']) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const buildPreferences = (): UserPreferences => {
    const rawAnswers: OnboardingAnswer[] = Object.entries(answers).map(([questionId, value]) => ({
      questionId,
      value,
    }));

    const get = (id: string) => answers[id];

    // Match by question ID keywords so Claude-generated IDs like "preferred_city" still work
    const findAnswer = (...keywords: string[]) => {
      const direct = keywords.map(get).find((v) => v !== undefined);
      if (direct !== undefined) return direct;
      const key = Object.keys(answers).find((k) => keywords.some((kw) => k.toLowerCase().includes(kw)));
      return key ? answers[key] : undefined;
    };

    // Also match by question text for maximum robustness
    const findByText = (...keywords: string[]) => {
      const q = questions.find((q) => keywords.some((kw) => q.text.toLowerCase().includes(kw)));
      return q ? answers[q.id] : undefined;
    };

    const locationVal = findAnswer('location', 'city', 'region', 'where') ?? findByText('location', 'city', 'where', 'work');
    const locations = typeof locationVal === 'string'
      ? [locationVal]
      : Array.isArray(locationVal) ? locationVal : [];

    const titleVal = findAnswer('job_title', 'title', 'role', 'position') ?? findByText('title', 'role', 'position', 'job');
    const titles = typeof titleVal === 'string'
      ? [titleVal]
      : Array.isArray(titleVal) ? titleVal : [];

    const remoteVal = String(findAnswer('remote', 'work_type', 'work_mode', 'hybrid') ?? findByText('remote', 'hybrid', 'onsite', 'office') ?? 'any').toLowerCase();
    const remoteMap: Record<string, UserPreferences['remotePreference']> = {
      remote: 'remote', hybrid: 'hybrid', onsite: 'onsite', 'on-site': 'onsite', any: 'any',
    };

    const salaryVal = findAnswer('salary', 'compensation', 'pay') ?? findByText('salary', 'compensation', 'pay', 'expect');
    const salaryMin = typeof salaryVal === 'number' ? salaryVal : undefined;

    const jobTypeVal = String(findAnswer('job_type', 'employment_type', 'contract') ?? findByText('employment', 'contract', 'full-time', 'part-time') ?? 'any').toLowerCase();
    const jobTypeMap: Record<string, UserPreferences['jobType']> = {
      'full-time': 'full-time', 'full time': 'full-time', part: 'part-time', contract: 'contract', internship: 'internship', any: 'any',
    };

    return {
      desiredJobTitles: titles,
      preferredLocations: locations,
      remotePreference: remoteMap[remoteVal] ?? 'any',
      salaryMin,
      salaryCurrency: 'USD',
      jobType: Object.entries(jobTypeMap).find(([k]) => jobTypeVal.includes(k))?.[1] ?? 'any',
      experienceLevelTarget: 'any',
      rawAnswers,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing = questions.filter((q) => q.required && !answers[q.id]);
    if (missing.length > 0) {
      setError(`Please answer: ${missing.map((q) => q.text).join(', ')}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const preferences = buildPreferences();
      const cvRaw = sessionStorage.getItem('cv');
      const cv = cvRaw ? JSON.parse(cvRaw) : undefined;
      const res = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences, cv }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Search failed');
      sessionStorage.setItem('jobs', JSON.stringify(data));
      sessionStorage.setItem('preferences', JSON.stringify(preferences));
      router.push('/jobs');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {questions.map((q) => (
        <div key={q.id}>
          <label className="block text-sm font-medium text-gray-800 mb-2">
            {q.text}
            {q.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <QuestionField
            question={q}
            value={answers[q.id]}
            onChange={(v) => setAnswer(q.id, v)}
          />
        </div>
      ))}

      {error && <ErrorBanner message={error} />}

      <Button type="submit" loading={loading} className="w-full py-3">
        {loading ? 'Searching and analyzing jobs…' : 'Find matching jobs →'}
      </Button>
    </form>
  );
}
