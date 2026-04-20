export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { getSession, saveSession } from '@/lib/session/session-manager';
import { getJobSearchProvider } from '@/lib/job-search/provider-interface';
import { matchJobWithClaude } from '@/lib/matcher/claude-matcher';
import { buildFeedbackContext } from '@/lib/feedback/feedback-context';
import type { UserPreferences } from '@/types/preferences';
import type { ParsedCV } from '@/types/cv';
import type { JobWithMatch } from '@/types/matching';

export async function POST(req: NextRequest) {
  try {
    const { preferences, cv: bodyCV } = (await req.json()) as { preferences: UserPreferences; cv?: ParsedCV };

    const session = await getSession();
    const cv = session?.cv ?? bodyCV;
    if (!cv) {
      return NextResponse.json({ error: 'No CV data found. Please upload your CV again.' }, { status: 401 });
    }

    if (session) {
      session.preferences = preferences;
      await saveSession(session).catch(() => {});
    }

    const feedbackContext = session ? await buildFeedbackContext(session.sessionId) : '';

    const searchQuery = [
      ...(preferences.desiredJobTitles.length ? preferences.desiredJobTitles : [cv.workExperience[0]?.title ?? '']),
      ...cv.skills.slice(0, 3).map((s) => s.name),
    ]
      .filter(Boolean)
      .join(' ');

    const provider = getJobSearchProvider();
    const searchResult = await provider.search({
      query: searchQuery,
      location: preferences.preferredLocations[0],
      remoteOnly: preferences.remotePreference === 'remote',
      jobType: preferences.jobType !== 'any' ? preferences.jobType : undefined,
      maxResults: 12,
    });

    const dismissedIds = new Set(session?.dismissedJobIds ?? []);
    const jobs = searchResult.jobs.filter((j) => !dismissedIds.has(j.id));

    const matchedJobs: JobWithMatch[] = await Promise.all(
      jobs.map(async (job) => {
        const match = await matchJobWithClaude(job, cv, feedbackContext);
        return { ...job, match };
      })
    );

    matchedJobs.sort((a, b) => b.match.score - a.match.score);

    return NextResponse.json({
      jobs: matchedJobs,
      totalFound: searchResult.totalFound,
      provider: searchResult.provider,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[Jobs search]', msg, e);
    return NextResponse.json({ error: `Job search failed: ${msg}` }, { status: 500 });
  }
}
