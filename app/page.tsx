'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CVDropzone } from '@/components/cv/CVDropzone';
import { CVPreview } from '@/components/cv/CVPreview';
import type { ParsedCV } from '@/types/cv';

export default function HomePage() {
  const router = useRouter();
  const [cv, setCv] = useState<ParsedCV | null>(null);

  const handleConfirm = () => {
    if (cv) {
      sessionStorage.setItem('cv', JSON.stringify(cv));
    }
    router.push('/questions');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">1</span>
          <span className="text-blue-600 font-medium">Upload CV</span>
          <span className="mx-2 text-gray-300">→</span>
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-500 text-xs font-bold">2</span>
          <span>Preferences</span>
          <span className="mx-2 text-gray-300">→</span>
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-500 text-xs font-bold">3</span>
          <span>Jobs</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Find your perfect job match</h1>
        <p className="text-gray-500 mt-2">
          Upload your CV and we&apos;ll find jobs that match your skills and experience using AI.
        </p>
      </div>

      {cv ? (
        <CVPreview cv={cv} onConfirm={handleConfirm} onReset={() => setCv(null)} />
      ) : (
        <CVDropzone onParsed={setCv} />
      )}
    </div>
  );
}
