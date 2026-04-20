import { clsx } from 'clsx';
import type { MatchGap } from '@/types/matching';

const severityColors: Record<MatchGap['severity'], string> = {
  critical: 'text-red-600',
  moderate: 'text-yellow-600',
  minor: 'text-gray-500',
};

export function GapList({ gaps }: { gaps: MatchGap[] }) {
  if (gaps.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Gaps</p>
      <ul className="space-y-1">
        {gaps.map((gap, i) => (
          <li key={i} className={clsx('text-xs flex items-start gap-1.5', severityColors[gap.severity])}>
            <span className="mt-0.5 shrink-0">●</span>
            {gap.description}
          </li>
        ))}
      </ul>
    </div>
  );
}
