'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { OnboardingQuestion } from '@/types/preferences';
import type { ParsedCV } from '@/types/cv';
import { QuestionForm } from '@/components/questions/QuestionForm';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorBanner } from '@/components/ui/ErrorBanner';

export default function QuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<OnboardingQuestion[] | null>(null);
  const [firstName, setFirstName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cvRaw = sessionStorage.getItem('cv');
    if (!cvRaw) { router.replace('/'); return; }

    let cv: ParsedCV;
    try { cv = JSON.parse(cvRaw); } catch { router.replace('/'); return; }

    setFirstName(cv.name.split(' ')[0]);

    fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cv }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setQuestions(data.questions as OnboardingQuestion[]);
      })
      .catch((e: Error) => setError(e.message));
  }, [router]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white text-xs">✓</span>
          <span className="text-green-600 font-medium">Upload CV</span>
          <span className="mx-2 text-gray-300">→</span>
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">2</span>
          <span className="text-blue-600 font-medium">Preferences</span>
          <span className="mx-2 text-gray-300">→</span>
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-500 text-xs font-bold">3</span>
          <span>Jobs</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Tell us what you&apos;re looking for</h1>
        {firstName && (
          <p className="text-gray-500 mt-2">
            Hi {firstName}! Answer a few questions so we can find jobs that fit your goals.
          </p>
        )}
      </div>

      {error && <ErrorBanner message={error} />}

      {!questions && !error && (
        <div className="flex flex-col items-center py-16 gap-4">
          <Spinner size="lg" />
          <p className="text-gray-500">Generating personalized questions…</p>
        </div>
      )}

      {questions && <QuestionForm questions={questions} />}
    </div>
  );
}
