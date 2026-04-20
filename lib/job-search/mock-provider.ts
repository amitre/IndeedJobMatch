import type { Job, JobSearchParams, JobSearchResult } from '@/types/job';
import type { JobSearchProvider } from './provider-interface';

const MOCK_JOBS: Job[] = [
  {
    id: 'mock-1',
    title: 'Senior Software Engineer',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    remote: true,
    jobType: 'full-time',
    salary: { min: 150000, max: 200000, currency: 'USD', period: 'annual' },
    description: `We are looking for a Senior Software Engineer to join our growing team. You will design and implement scalable backend services using Node.js and TypeScript. Experience with React, PostgreSQL, and AWS is required. You'll work closely with product managers and designers to deliver high-quality features.\n\nRequirements:\n- 5+ years of software engineering experience\n- Strong proficiency in TypeScript/JavaScript\n- Experience with React and Node.js\n- Familiarity with cloud platforms (AWS, GCP)\n- Experience with SQL and NoSQL databases\n- Strong communication skills`,
    snippet: 'Design and build scalable backend services. 5+ years experience required.',
    url: 'https://example.com/jobs/mock-1',
    postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'mock',
  },
  {
    id: 'mock-2',
    title: 'Full Stack Developer',
    company: 'StartupXYZ',
    location: 'New York, NY',
    remote: false,
    jobType: 'full-time',
    salary: { min: 120000, max: 160000, currency: 'USD', period: 'annual' },
    description: `Join our fast-growing startup as a Full Stack Developer. You'll own features end-to-end from database to UI. We use React, Next.js, Python (FastAPI), and PostgreSQL.\n\nRequirements:\n- 3+ years full-stack development\n- React/Next.js proficiency\n- Python backend experience\n- PostgreSQL knowledge\n- Startup mindset and ability to work autonomously`,
    snippet: 'Own features end-to-end in a fast-growing startup environment.',
    url: 'https://example.com/jobs/mock-2',
    postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'mock',
  },
  {
    id: 'mock-3',
    title: 'Machine Learning Engineer',
    company: 'AI Innovations Ltd.',
    location: 'Austin, TX',
    remote: true,
    jobType: 'full-time',
    salary: { min: 160000, max: 220000, currency: 'USD', period: 'annual' },
    description: `We're looking for an ML Engineer to help us build and deploy production ML systems. You'll work on NLP, recommendation systems, and predictive models.\n\nRequirements:\n- MS or PhD in Computer Science, Statistics, or related field\n- 3+ years ML engineering experience\n- Python, PyTorch/TensorFlow\n- Experience with MLOps and model deployment\n- Strong math foundation (linear algebra, statistics)\n- Experience with large language models is a plus`,
    snippet: 'Build production ML systems including NLP and recommendation engines.',
    url: 'https://example.com/jobs/mock-3',
    postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'mock',
  },
  {
    id: 'mock-4',
    title: 'DevOps Engineer',
    company: 'CloudOps Co.',
    location: 'Remote',
    remote: true,
    jobType: 'full-time',
    salary: { min: 130000, max: 170000, currency: 'USD', period: 'annual' },
    description: `DevOps Engineer to manage our cloud infrastructure and CI/CD pipelines. You'll work with Kubernetes, Terraform, and AWS.\n\nRequirements:\n- 4+ years DevOps/SRE experience\n- Kubernetes and Docker expertise\n- Terraform and infrastructure-as-code\n- AWS or GCP certifications preferred\n- Experience with monitoring (Prometheus, Grafana)\n- Strong scripting skills (Bash, Python)`,
    snippet: 'Manage cloud infrastructure and CI/CD pipelines using Kubernetes and AWS.',
    url: 'https://example.com/jobs/mock-4',
    postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'mock',
  },
  {
    id: 'mock-5',
    title: 'Frontend Engineer',
    company: 'DesignFirst Agency',
    location: 'Los Angeles, CA',
    remote: false,
    jobType: 'full-time',
    salary: { min: 100000, max: 140000, currency: 'USD', period: 'annual' },
    description: `Frontend Engineer to craft exceptional user experiences. You'll work closely with designers and backend engineers to build beautiful, performant React applications.\n\nRequirements:\n- 3+ years React development\n- TypeScript proficiency\n- CSS/Tailwind expertise\n- Performance optimization experience\n- Eye for design detail\n- Experience with testing (Jest, Cypress)`,
    snippet: 'Build beautiful, performant React applications with a design-focused team.',
    url: 'https://example.com/jobs/mock-5',
    postedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'mock',
  },
  {
    id: 'mock-6',
    title: 'Backend Engineer (Go)',
    company: 'FinTech Solutions',
    location: 'Chicago, IL',
    remote: true,
    jobType: 'full-time',
    salary: { min: 140000, max: 190000, currency: 'USD', period: 'annual' },
    description: `Backend Engineer to build high-performance financial services in Go. You'll work on payment processing, fraud detection, and real-time data pipelines.\n\nRequirements:\n- 4+ years backend development\n- Go proficiency\n- Experience with high-throughput systems\n- PostgreSQL and Redis\n- Kafka or similar message queues\n- Financial domain knowledge preferred`,
    snippet: 'Build high-performance financial services in Go.',
    url: 'https://example.com/jobs/mock-6',
    postedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'mock',
  },
  {
    id: 'mock-7',
    title: 'Data Engineer',
    company: 'Analytics Corp',
    location: 'Seattle, WA',
    remote: true,
    jobType: 'full-time',
    salary: { min: 125000, max: 165000, currency: 'USD', period: 'annual' },
    description: `Data Engineer to build and maintain our data infrastructure. You'll design ETL pipelines, manage data warehouses, and enable our analytics team.\n\nRequirements:\n- 3+ years data engineering\n- Python and SQL\n- Spark or Databricks\n- Snowflake or BigQuery\n- Airflow or similar orchestration\n- Experience with dbt is a plus`,
    snippet: 'Design ETL pipelines and manage data warehouses for a leading analytics firm.',
    url: 'https://example.com/jobs/mock-7',
    postedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'mock',
  },
  {
    id: 'mock-8',
    title: 'Software Engineer II',
    company: 'MegaCorp Technologies',
    location: 'Boston, MA',
    remote: false,
    jobType: 'full-time',
    salary: { min: 110000, max: 150000, currency: 'USD', period: 'annual' },
    description: `Software Engineer II to join our platform team. You'll contribute to our core services, mentor junior engineers, and participate in architecture decisions.\n\nRequirements:\n- 3–5 years software engineering\n- Java or Kotlin\n- Spring Boot\n- Microservices architecture\n- Experience with distributed systems\n- Team player with good communication`,
    snippet: 'Build core platform services and mentor junior engineers at a Fortune 500.',
    url: 'https://example.com/jobs/mock-8',
    postedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'mock',
  },
  {
    id: 'mock-9',
    title: 'Staff Engineer',
    company: 'Scale-Up Inc.',
    location: 'Denver, CO',
    remote: true,
    jobType: 'full-time',
    salary: { min: 200000, max: 260000, currency: 'USD', period: 'annual' },
    description: `Staff Engineer to drive technical strategy across multiple teams. You'll set architectural standards, lead complex projects, and mentor senior engineers.\n\nRequirements:\n- 10+ years software engineering\n- Track record of leading large-scale system design\n- Strong communication with executives and stakeholders\n- Experience scaling systems to millions of users\n- Breadth across backend, infrastructure, and data`,
    snippet: 'Drive technical strategy and architecture across multiple teams.',
    url: 'https://example.com/jobs/mock-9',
    postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'mock',
  },
  {
    id: 'mock-10',
    title: 'Product Engineer',
    company: 'Consumer App Co.',
    location: 'Miami, FL',
    remote: true,
    jobType: 'full-time',
    salary: { min: 115000, max: 155000, currency: 'USD', period: 'annual' },
    description: `Product Engineer who loves shipping features users love. You'll work across the stack (React Native + Node.js) and own features from idea to production.\n\nRequirements:\n- 3+ years product engineering\n- React Native or Flutter\n- Node.js backend\n- Strong product intuition\n- Experience with A/B testing and analytics\n- Passion for consumer products`,
    snippet: 'Ship user-loved features across React Native and Node.js in a consumer app.',
    url: 'https://example.com/jobs/mock-10',
    postedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'mock',
  },
  {
    id: 'mock-11',
    title: 'Security Engineer',
    company: 'CyberSafe Ltd.',
    location: 'Washington, DC',
    remote: false,
    jobType: 'full-time',
    salary: { min: 145000, max: 195000, currency: 'USD', period: 'annual' },
    description: `Security Engineer to protect our systems and customer data. You'll conduct security assessments, implement controls, and respond to incidents.\n\nRequirements:\n- 4+ years security engineering\n- AppSec and cloud security\n- SAST/DAST tooling\n- Penetration testing experience\n- Security certifications (CISSP, CEH) preferred\n- Incident response experience`,
    snippet: 'Protect systems and customer data through security assessments and controls.',
    url: 'https://example.com/jobs/mock-11',
    postedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'mock',
  },
  {
    id: 'mock-12',
    title: 'Platform Engineer',
    company: 'Infrastructure First',
    location: 'Remote',
    remote: true,
    jobType: 'contract',
    salary: { min: 90, max: 130, currency: 'USD', period: 'hourly' },
    description: `Platform Engineer (contract) to help us modernize our infrastructure. You'll migrate legacy systems to Kubernetes and implement GitOps workflows.\n\nRequirements:\n- Kubernetes expert\n- Helm and ArgoCD\n- GitOps experience\n- Terraform\n- 5+ years infrastructure experience\n- Available for 6-month contract`,
    snippet: 'Modernize infrastructure and implement GitOps workflows on a 6-month contract.',
    url: 'https://example.com/jobs/mock-12',
    postedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'mock',
  },
];

export class MockProvider implements JobSearchProvider {
  readonly name = 'mock';

  async search(params: JobSearchParams): Promise<JobSearchResult> {
    const query = params.query.toLowerCase();
    const keywords = query.split(/\s+/);

    let filtered = MOCK_JOBS.filter((job) => {
      if (params.remoteOnly && !job.remote) return false;
      if (params.jobType && params.jobType !== 'any' && job.jobType !== params.jobType) return false;
      return true;
    });

    // Score relevance by keyword overlap
    const scored = filtered.map((job) => {
      const text = `${job.title} ${job.description}`.toLowerCase();
      const matches = keywords.filter((kw) => text.includes(kw)).length;
      return { job, matches };
    });

    scored.sort((a, b) => b.matches - a.matches);

    const max = params.maxResults ?? 10;
    const jobs = scored.slice(0, max).map((s) => s.job);

    return { jobs, totalFound: filtered.length, provider: this.name };
  }
}
