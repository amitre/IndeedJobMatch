import type { MatchStrength } from '@/types/matching';

export function StrengthList({ strengths }: { strengths: MatchStrength[] }) {
  if (strengths.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Strengths</p>
      <ul className="space-y-1">
        {strengths.map((s, i) => (
          <li key={i} className="text-xs flex items-start gap-1.5 text-green-700">
            <span className="mt-0.5 shrink-0">●</span>
            {s.description}
          </li>
        ))}
      </ul>
    </div>
  );
}
