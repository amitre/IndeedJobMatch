export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  jobType?: string;
  salary?: {
    min?: number;
    max?: number;
    currency: string;
    period: 'hourly' | 'annual';
  };
  description: string;
  snippet?: string;
  url: string;
  postedAt?: string;
  source: 'indeed' | 'rapidapi' | 'mock' | 'linkedin';
}

export interface JobSearchParams {
  query: string;
  location?: string;
  remoteOnly?: boolean;
  jobType?: string;
  salaryMin?: number;
  maxResults?: number;
}

export interface JobSearchResult {
  jobs: Job[];
  totalFound: number;
  provider: string;
}
