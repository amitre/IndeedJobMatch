import type { JobSearchParams, JobSearchResult } from '@/types/job';

export interface JobSearchProvider {
  readonly name: string;
  search(params: JobSearchParams): Promise<JobSearchResult>;
}

export function getJobSearchProvider(): JobSearchProvider {
  const provider = process.env.JOB_PROVIDER ?? 'mock';
  switch (provider) {
    case 'linkedin': {
      const { LinkedInProvider } = require('./linkedin-provider');
      return new LinkedInProvider();
    }
    case 'indeed': {
      const { IndeedProvider } = require('./indeed-provider');
      return new IndeedProvider();
    }
    case 'rapidapi': {
      const { RapidAPIProvider } = require('./rapidapi-provider');
      return new RapidAPIProvider();
    }
    case 'mock':
    default: {
      const { MockProvider } = require('./mock-provider');
      return new MockProvider();
    }
  }
}
