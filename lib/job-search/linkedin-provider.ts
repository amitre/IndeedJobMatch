import type { Job, JobSearchParams, JobSearchResult } from '@/types/job';
import type { JobSearchProvider } from './provider-interface';

export class LinkedInProvider implements JobSearchProvider {
  readonly name = 'linkedin';

  async search(params: JobSearchParams): Promise<JobSearchResult> {
    const apiKey = process.env.RAPIDAPI_KEY;
    const host = process.env.LINKEDIN_HOST ?? 'linkedin-job-search-api.p.rapidapi.com';
    if (!apiKey) throw new Error('RAPIDAPI_KEY not set');

    const location = params.location ?? '';
    const searchText = `${params.query} ${location}`.toLowerCase();
    const isIsrael = searchText.includes('israel') || searchText.includes('tel aviv') || searchText.includes('תל אביב');

    const url = new URL(`https://${host}/active-jb-7d`);
    url.searchParams.set('title_filter', `"${params.query}"`);
    url.searchParams.set('location_filter', isIsrael ? '"Israel"' : `"${location}"`);
    if (params.remoteOnly) url.searchParams.set('work_type', 'Remote');
    url.searchParams.set('limit', String(params.maxResults ?? 12));

    console.log('[LinkedIn] url:', url.toString());

    const res = await fetch(url.toString(), {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': host,
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`LinkedIn API error: ${res.status} | ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    const items: Record<string, unknown>[] = Array.isArray(data) ? data : (data.data ?? data.jobs ?? []);

    const jobs: Job[] = items.slice(0, params.maxResults ?? 12).map((r) => ({
      id: String(r.id ?? r.job_id ?? Math.random()),
      title: String(r.title ?? r.job_title ?? ''),
      company: String(r.company ?? r.company_name ?? r.employer ?? ''),
      location: String(r.location ?? r.job_location ?? r.city ?? ''),
      remote: String(r.work_type ?? r.remote ?? '').toLowerCase().includes('remote'),
      jobType: 'full-time',
      salary: undefined,
      description: String(r.description ?? r.job_description ?? r.details ?? ''),
      snippet: String(r.description ?? r.job_description ?? '').slice(0, 200),
      url: String(r.url ?? r.job_url ?? r.apply_url ?? r.linkedin_url ?? ''),
      postedAt: String(r.posted_at ?? r.date_posted ?? r.created_at ?? ''),
      source: 'linkedin' as const,
    }));

    return { jobs, totalFound: items.length, provider: this.name };
  }
}
