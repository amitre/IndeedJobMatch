import { clsx } from 'clsx';
import type { MatchResult } from '@/types/matching';

const labelColors: Record<MatchResult['label'], string> = {
  Excellent: 'text-match-excellent',
  Good: 'text-match-good',
  Fair: 'text-match-fair',
  Low: 'text-match-low',
};

const ringColors: Record<MatchResult['label'], string> = {
  Excellent: 'stroke-match-excellent',
  Good: 'stroke-match-good',
  Fair: 'stroke-match-fair',
  Low: 'stroke-match-low',
};

export function MatchScore({ match }: { match: MatchResult }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (match.score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={radius} stroke="#e5e7eb" strokeWidth="8" fill="none" />
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={clsx('transition-all duration-500', ringColors[match.label])}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={clsx('text-lg font-bold', labelColors[match.label])}>
            {match.score}%
          </span>
        </div>
      </div>
      <span className={clsx('text-xs font-semibold', labelColors[match.label])}>
        {match.label}
      </span>
    </div>
  );
}
