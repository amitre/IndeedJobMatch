'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CVDropzone } from '@/components/cv/CVDropzone';
import { CVPreview } from '@/components/cv/CVPreview';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import type { ParsedCV } from '@/types/cv';

export default function HomePage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [cv, setCv] = useState<ParsedCV | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ACCEPTED = new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]);

  const handleFile = async (f: File) => {
    if (!ACCEPTED.has(f.type)) {
      setError('נתמכים קבצי PDF ו-Word (.docx) בלבד.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('הקובץ חייב להיות עד 10 MB.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.append('cv', f);
      const res = await fetch('/api/cv/parse', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Parse failed');
      setCv(data.cv as ParsedCV);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה לא ידועה');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (cv) sessionStorage.setItem('cv', JSON.stringify(cv));
    router.push('/questions');
  };

  const handleSkip = () => {
    router.push('/questions');
  };

  if (cv) {
    return (
      <div className="max-w-2xl mx-auto">
        <CVPreview cv={cv} onConfirm={handleConfirm} onReset={() => setCv(null)} />
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <span className="text-2xl font-bold text-gray-900 tracking-tight">Jobify</span>
        <nav className="flex items-center gap-8 text-sm text-gray-600">
          <a href="#" className="hover:text-gray-900">מי אנחנו</a>
          <a href="#" className="hover:text-gray-900">מעסיקים מובילים</a>
          <a href="#" className="flex items-center gap-1 hover:text-gray-900">
            פרסום משרה
            <span className="bg-orange-400 text-white text-xs px-1.5 py-0.5 rounded font-medium">חינם</span>
          </a>
          <a href="#" className="hover:text-gray-900">צרו קשר</a>
        </nav>
        <div className="flex items-center gap-1 text-sm text-gray-500 cursor-pointer">
          <span>עברית</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-8">
        <div className="max-w-5xl w-full flex items-center gap-16">
          {/* Text side (RTL: right) */}
          <div className="flex-1 text-right">
            <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-4">
              התעייכתם מלעבוד בלחפש<br />
              עבודה? אנחנו מבינים<br />
              אתכם
            </h1>
            <p className="text-gray-500 text-base mb-8 leading-relaxed">
              מעלים או יוצרים קו"ח ומקבלים משרות בול בפוני מתוך מאגר<br />
              המשרות הגדול בישראל. בלי ניחושים, בלי גלילות אינסופיות,<br />
              ועם סיכוי אמיתי להתקבל. השירות חינם וללא הגבלה.
            </p>

            {error && <div className="mb-4"><ErrorBanner message={error} /></div>}

            <div className="flex items-center gap-3 justify-end">
              {/* Skip button */}
              <button
                onClick={handleSkip}
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                המשך ללא קו"ח
              </button>

              {/* Upload button */}
              <button
                onClick={() => inputRef.current?.click()}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
              >
                {loading ? (
                  <>
                    <Spinner className="w-4 h-4" />
                    מנתח קו"ח...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    יש לי קו"ח
                    <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded font-medium">מומלץ</span>
                  </>
                )}
              </button>

              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>
          </div>

          {/* Image side (RTL: left) */}
          <div className="flex-shrink-0 w-80 h-96 bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center">
            <svg className="w-24 h-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
      </main>

      {/* Logos bar */}
      <footer className="bg-white border-t border-gray-100 py-6 px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-12 opacity-60">
          {['הג\'וינט', 'משרד העבודה', 'Israel Innovation Authority', 'שירות התעסוקה', 'הביטוח הלאומי', 'אתר הכשמה', 'Azrieli'].map((name) => (
            <span key={name} className="text-sm text-gray-500 font-medium">{name}</span>
          ))}
        </div>
      </footer>
    </div>
  );
}
