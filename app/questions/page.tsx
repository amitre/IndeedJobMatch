import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session/session-manager';
import { generateQuestionsWithClaude } from '@/lib/questions/claude-question-gen';
import { saveSession } from '@/lib/session/session-manager';
import { QuestionForm } from '@/components/questions/QuestionForm';

export default async function QuestionsPage() {
  const session = await getSession();
  if (!session?.cv) redirect('/');

  let questions = session.questions;
  if (!questions) {
    questions = await generateQuestionsWithClaude(session.cv);
    session.questions = questions;
    await saveSession(session);
  }

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
        <p className="text-gray-500 mt-2">
          Hi {session.cv.name.split(' ')[0]}! Answer a few questions so we can find jobs that fit your goals.
        </p>
      </div>

      <QuestionForm questions={questions} />
    </div>
  );
}
