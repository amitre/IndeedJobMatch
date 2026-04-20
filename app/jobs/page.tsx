'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { JobWithMatch } from '@/types/matching';
import type { UserPreferences } from '@/types/preferences';
import { JobCard } from '@/components/jobs/JobCard';
import { JobFilters } from '@/components/jobs/JobFilters';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorBanner } from '@/components/ui/ErrorBanner';

type SortKey = 'score' | 'date';

interface SearchData {
  jobs: JobWithMatch[];
  totalFound: number;
  provider: string;
}

export default function JobsPage() {
  const router = useRouter();
  const [data, setData] = useState<SearchData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>('score');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = sessionStorage.getItem('jobs');
    if (!stored) { router.replace('/'); return; }
    try {
      setData(JSON.parse(stored) as SearchData);
    } catch {
      router.replace('/');
    }
  }, [router]);

  const refresh = useCallback(async () => {
    const prefsRaw = sessionStorage.getItem('preferences');
    if (!prefsRaw) return;
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: prefsRaw,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Refresh failed');
      sessionStorage.setItem('jobs', JSON.stringify(json));
      setData(json as SearchData);
      setDismissed(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleDismissed = (jobId: string) => {
    setDismissed((prev) => new Set([...prev, jobId]));
  };

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Spinner size="lg" />
        <p className="text-gray-500">Loading your job matches…</p>
      </div>
    );
  }

  let jobs = data.jobs.filter((j) => !dismissed.has(j.id));
  if (remoteOnly) jobs = jobs.filter((j) => j.remote);
  if (sort === 'date') {
    jobs = [...jobs].sort((a, b) =>
      (b.postedAt ?? '').localeCompare(a.postedAt ?? '')
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white text-xs">✓</span>
          <span className="text-green-600 font-medium">Upload CV</span>
          <span className="mx-2 text-gray-300">→</span>
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white text-xs">✓</span>
          <span className="text-green-600 font-medium">Preferences</span>
          <span className="mx-2 text-gray-300">→</span>
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">3</span>
          <span className="text-blue-600 font-medium">Jobs</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Your job matches</h1>
        <p className="text-gray-500 mt-1">
          Sorted by AI match score. Dismiss jobs to improve future results.
        </p>
      </div>

      {error && <ErrorBanner message={error} />}

      <JobFilters
        sort={sort}
        onSort={setSort}
        remoteOnly={remoteOnly}
        onRemoteOnly={setRemoteOnly}
        count={jobs.length}
        total={data.totalFound}
        provider={data.provider}
        onRefresh={refresh}
        refreshing={refreshing}
      />

      {jobs.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg font-medium">No jobs to show</p>
          <p className="text-sm mt-1">Try adjusting your filters or refreshing the search.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onDismissed={handleDismissed} />
          ))}
        </div>
      )}
    </div>
  );
}
