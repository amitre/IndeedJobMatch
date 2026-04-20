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

    const locationVal = get('location') ?? get('preferred_location') ?? get('locations');
    const locations = typeof locationVal === 'string'
      ? [locationVal]
      : Array.isArray(locationVal) ? locationVal : [];

    const titleVal = get('job_title') ?? get('desired_role') ?? get('job_titles');
    const titles = typeof titleVal === 'string'
      ? [titleVal]
      : Array.isArray(titleVal) ? titleVal : [];

    const remoteVal = String(get('remote') ?? get('remote_preference') ?? get('work_type') ?? 'any').toLowerCase();
    const remoteMap: Record<string, UserPreferences['remotePreference']> = {
      remote: 'remote', hybrid: 'hybrid', onsite: 'onsite', 'on-site': 'onsite', any: 'any',
    };

    const salaryVal = get('salary') ?? get('salary_min') ?? get('minimum_salary');
    const salaryMin = typeof salaryVal === 'number' ? salaryVal : undefined;

    const jobTypeVal = String(get('job_type') ?? get('employment_type') ?? 'any').toLowerCase();
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
      const res = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
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
