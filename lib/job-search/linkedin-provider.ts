import type { Job, JobSearchParams, JobSearchResult } from '@/types/job';
import type { JobSearchProvider } from './provider-interface';

export class LinkedInProvider implements JobSearchProvider {
  readonly name = 'linkedin';

  async search(params: JobSearchParams): Promise<JobSearchResult> {
    const apiKey = process.env.RAPIDAPI_KEY;
    const host = process.env.LINKEDIN_HOST ?? 'jobs-api14.p.rapidapi.com';
    if (!apiKey) throw new Error('RAPIDAPI_KEY not set');

    const location = params.location ?? '';
    const searchText = `${params.query} ${location}`.toLowerCase();
    const isIsrael = searchText.includes('israel') || searchText.includes('tel aviv') || searchText.includes('תל אביב');

    const url = new URL(`https://${host}/list`);
    url.searchParams.set('query', params.query);
    url.searchParams.set('location', isIsrael ? 'Tel Aviv, Israel' : location);
    url.searchParams.set('distance', '1.0');
    url.searchParams.set('language', 'en_GB');
    url.searchParams.set('remoteOnly', params.remoteOnly ? 'true' : 'false');
    url.searchParams.set('datePosted', 'month');
    url.searchParams.set('employmentTypes', 'fulltime');
    url.searchParams.set('index', '0');

    console.log('[JobsAPI14] url:', url.toString());

    const res = await fetch(url.toString(), {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': host,
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Jobs API14 error: ${res.status} | ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    // Jobs API14 returns { jobs: [...] }
    const items: Record<string, unknown>[] = Array.isArray(data)
      ? data
      : Array.isArray(data.jobs)
      ? data.jobs
      : [];

    const jobs: Job[] = items.slice(0, params.maxResults ?? 12).map((r) => {
      // jobProviders is an array of { jobProvider: string, url: string }
      const providers = Array.isArray(r.jobProviders) ? (r.jobProviders as Record<string, string>[]) : [];
      const applyUrl = providers[0]?.url ?? String(r.url ?? r.job_url ?? '');

      const salaryRaw = String(r.salaryRange ?? r.salary ?? '');

      return {
        id: String(r.id ?? r.job_id ?? applyUrl ?? Math.random()),
        title: String(r.title ?? r.job_title ?? ''),
        company: String(r.company ?? r.company_name ?? r.employer ?? ''),
        location: String(r.location ?? r.job_location ?? r.city ?? ''),
        remote:
          String(r.remote ?? r.work_type ?? r.employmentType ?? '').toLowerCase().includes('remote') ||
          String(r.location ?? '').toLowerCase().includes('remote'),
        jobType: String(r.employmentType ?? r.jobType ?? 'full-time'),
        salary: salaryRaw ? parseSalaryRange(salaryRaw) : undefined,
        description: String(r.description ?? r.job_description ?? r.details ?? ''),
        snippet: String(r.description ?? r.job_description ?? '').slice(0, 200),
        url: applyUrl,
        postedAt: String(r.datePosted ?? r.posted_at ?? r.date_posted ?? r.created_at ?? ''),
        source: 'linkedin' as const,
      };
    });

    return { jobs, totalFound: items.length, provider: this.name };
  }
}

function parseSalaryRange(raw: string): Job['salary'] {
  // e.g. "$80,000-$120,000" or "$80K - $100K" or "80000-120000"
  const nums = raw.replace(/[^\d\-–]/g, ' ').trim().split(/[\s\-–]+/).filter(Boolean).map(Number).filter(n => n > 0);
  if (nums.length === 0) return undefined;
  const isHourly = raw.toLowerCase().includes('hour') || raw.toLowerCase().includes('/h');
  return {
    min: nums[0],
    max: nums[1],
    currency: raw.includes('₪') ? 'ILS' : 'USD',
    period: isHourly ? 'hourly' : 'annual',
  };
}
