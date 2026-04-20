import type { Job, JobSearchParams, JobSearchResult } from '@/types/job';
import type { JobSearchProvider } from './provider-interface';

export class RapidAPIProvider implements JobSearchProvider {
  readonly name = 'rapidapi';

  async search(params: JobSearchParams): Promise<JobSearchResult> {
    const apiKey = process.env.RAPIDAPI_KEY;
    const host = process.env.RAPIDAPI_HOST ?? 'jsearch27.p.rapidapi.com';
    if (!apiKey) throw new Error('RAPIDAPI_KEY not set');

    const url = new URL(`https://${host}/search`);
    url.searchParams.set('query', params.query + (params.location ? ` in ${params.location}` : ''));
    url.searchParams.set('num_pages', '1');
    url.searchParams.set('page', '1');
    if (params.remoteOnly) url.searchParams.set('remote_jobs_only', 'true');

    const searchText = `${params.query} ${params.location ?? ''}`.toLowerCase();
    const isIsrael = searchText.includes('israel') || searchText.includes('tel aviv') || searchText.includes('תל אביב');
    if (isIsrael) {
      url.searchParams.set('country', 'il');
      // Override query to include Israel explicitly so the API ranks Israeli results first
      url.searchParams.set('query', `${params.query} Israel`);
    }

    console.log('[RapidAPI] query:', url.searchParams.get('query'), '| country:', url.searchParams.get('country') ?? 'default', '| location param:', params.location);

    const res = await fetch(url.toString(), {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': host,
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`RapidAPI JSearch error: ${res.status} | host: ${host} | key_prefix: ${apiKey.slice(0, 8)} | body: ${body.slice(0, 200)}`);
    }
    const data = await res.json();

    const jobs: Job[] = (data.data ?? []).slice(0, params.maxResults ?? 10).map((r: Record<string, unknown>) => ({
      id: r.job_id as string,
      title: r.job_title as string,
      company: r.employer_name as string,
      location: r.job_city ? `${r.job_city}, ${r.job_country}` : (r.job_country as string ?? 'Unknown'),
      remote: r.job_is_remote as boolean ?? false,
      jobType: r.job_employment_type as string | undefined,
      salary: r.job_min_salary ? {
        min: r.job_min_salary as number,
        max: r.job_max_salary as number | undefined,
        currency: r.job_salary_currency as string ?? 'USD',
        period: (r.job_salary_period as string ?? 'ANNUAL').toLowerCase().includes('hour') ? 'hourly' : 'annual',
      } : undefined,
      description: r.job_description as string,
      snippet: (r.job_description as string)?.slice(0, 200),
      url: r.job_apply_link as string,
      postedAt: r.job_posted_at_datetime_utc as string | undefined,
      source: 'rapidapi' as const,
    }));

    return { jobs, totalFound: data.estimated_num_results ?? jobs.length, provider: this.name };
  }
}
