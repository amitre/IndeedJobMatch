import * as XLSX from 'xlsx';
import type { JobWithMatch } from '@/types/matching';

function salaryLabel(job: JobWithMatch): string {
  if (!job.salary) return '';
  const { min, max, currency, period } = job.salary;
  const fmt = (n: number) => n.toLocaleString();
  const range = min && max ? `${fmt(min)}–${fmt(max)}` : min ? `${fmt(min)}+` : max ? `up to ${fmt(max)}` : '';
  return range ? `${range} ${currency} / ${period}` : '';
}

export function exportJobsToExcel(jobs: JobWithMatch[], filename = 'job-matches.xlsx') {
  const rows = jobs.map((job) => ({
    'Title': job.title,
    'Company': job.company,
    'Location': job.location,
    'Remote': job.remote ? 'Yes' : 'No',
    'Job Type': job.jobType ?? '',
    'Salary': salaryLabel(job),
    'Match Score': job.match.score,
    'Match Label': job.match.label,
    'Summary': job.match.summary,
    'Strengths': job.match.strengths.map((s) => s.description).join('; '),
    'Gaps': job.match.gaps.map((g) => `[${g.severity}] ${g.description}`).join('; '),
    'Posted': job.postedAt ?? '',
    'URL': job.url,
    'Source': job.source,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  // Column widths
  ws['!cols'] = [
    { wch: 40 }, // Title
    { wch: 30 }, // Company
    { wch: 25 }, // Location
    { wch: 8 },  // Remote
    { wch: 14 }, // Job Type
    { wch: 25 }, // Salary
    { wch: 12 }, // Match Score
    { wch: 12 }, // Match Label
    { wch: 60 }, // Summary
    { wch: 60 }, // Strengths
    { wch: 60 }, // Gaps
    { wch: 20 }, // Posted
    { wch: 50 }, // URL
    { wch: 12 }, // Source
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Job Matches');
  XLSX.writeFile(wb, filename);
}
