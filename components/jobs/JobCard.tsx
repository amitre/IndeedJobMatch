'use client';
import { useState } from 'react';
import type { JobWithMatch } from '@/types/matching';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MatchScore } from './MatchScore';
import { GapList } from './GapList';
import { StrengthList } from './StrengthList';
import { FeedbackModal } from './FeedbackModal';

interface Props {
  job: JobWithMatch;
  onDismissed: (jobId: string) => void;
}

function formatSalary(job: JobWithMatch) {
  if (!job.salary) return null;
  const fmt = (n: number) =>
    job.salary!.period === 'hourly'
      ? `$${n}/hr`
      : `$${(n / 1000).toFixed(0)}k`;
  if (job.salary.min && job.salary.max) return `${fmt(job.salary.min)} – ${fmt(job.salary.max)}`;
  if (job.salary.min) return `From ${fmt(job.salary.min)}`;
  if (job.salary.max) return `Up to ${fmt(job.salary.max)}`;
  return null;
}

function daysAgo(iso?: string) {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

export function JobCard({ job, onDismissed }: Props) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (dismissed) return null;

  const salary = formatSalary(job);
  const posted = daysAgo(job.postedAt);

  return (
    <>
      <Card className="p-5 space-y-4 transition-opacity">
        <div className="flex items-start gap-4">
          <MatchScore match={job.match} />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold text-gray-900 text-base leading-tight">{job.title}</h2>
                <p className="text-sm text-gray-600 mt-0.5">{job.company}</p>
              </div>
              <Button
                variant="ghost"
                className="text-xs text-gray-400 hover:text-red-500 shrink-0"
                onClick={() => setShowFeedback(true)}
              >
                Not relevant
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-xs text-gray-500">{job.location}</span>
              {job.remote && <Badge color="green">Remote</Badge>}
              {job.jobType && <Badge color="gray">{job.jobType}</Badge>}
              {salary && <Badge color="purple">{salary}</Badge>}
              {posted && <span className="text-xs text-gray-400">{posted}</span>}
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-600 italic">{job.match.summary}</p>

        <div className="grid grid-cols-2 gap-4">
          <StrengthList strengths={job.match.strengths} />
          <GapList gaps={job.match.gaps} />
        </div>

        {expanded && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Job Description</p>
            <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
              {job.description.slice(0, 1500)}
              {job.description.length > 1500 ? '…' : ''}
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
          <Button
            variant="ghost"
            className="text-xs"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Hide description' : 'Show description'}
          </Button>
          <div className="flex-1" />
          <a href={job.url} target="_blank" rel="noopener noreferrer">
            <Button variant="primary" className="text-sm">
              Apply →
            </Button>
          </a>
        </div>
      </Card>

      {showFeedback && (
        <FeedbackModal
          jobId={job.id}
          jobTitle={job.title}
          company={job.company}
          onClose={() => setShowFeedback(false)}
          onDismissed={() => {
            setShowFeedback(false);
            setDismissed(true);
            onDismissed(job.id);
          }}
        />
      )}
    </>
  );
}
