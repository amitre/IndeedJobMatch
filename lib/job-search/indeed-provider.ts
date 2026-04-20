import type { Job, JobSearchParams, JobSearchResult } from '@/types/job';
import type { JobSearchProvider } from './provider-interface';

export class IndeedProvider implements JobSearchProvider {
  readonly name = 'indeed';

  async search(params: JobSearchParams): Promise<JobSearchResult> {
    const publisherId = process.env.INDEED_PUBLISHER_ID;
    if (!publisherId) throw new Error('INDEED_PUBLISHER_ID not set');

    const base = process.env.INDEED_API_BASE ?? 'https://api.indeed.com/ads/apisearch';
    const url = new URL(base);
    url.searchParams.set('publisher', publisherId);
    url.searchParams.set('q', params.query);
    url.searchParams.set('l', params.location ?? '');
    url.searchParams.set('sort', 'relevance');
    url.searchParams.set('radius', '25');
    url.searchParams.set('limit', String(params.maxResults ?? 10));
    url.searchParams.set('format', 'json');
    url.searchParams.set('v', '2');

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Indeed API error: ${res.status}`);

    const data = await res.json();
    const jobs: Job[] = (data.results ?? []).map((r: Record<string, unknown>) => ({
      id: r.jobkey as string,
      title: r.jobtitle as string,
      company: r.company as string,
      location: `${r.city}, ${r.state}`,
      remote: false,
      jobType: r.jobtype as string | undefined,
      description: r.snippet as string,
      snippet: r.snippet as string,
      url: r.url as string,
      postedAt: r.date as string,
      source: 'indeed' as const,
    }));

    return { jobs, totalFound: data.totalResults ?? jobs.length, provider: this.name };
  }
}
