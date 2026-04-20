'use client';
import type { OnboardingQuestion, OnboardingAnswer } from '@/types/preferences';

interface Props {
  question: OnboardingQuestion;
  value: OnboardingAnswer['value'] | undefined;
  onChange: (value: OnboardingAnswer['value']) => void;
}

export function QuestionField({ question, value, onChange }: Props) {
  const base = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  if (question.type === 'text') {
    return (
      <input
        type="text"
        className={base}
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your answer…"
      />
    );
  }

  if (question.type === 'select') {
    return (
      <select
        className={base}
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select an option</option>
        {question.options?.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }

  if (question.type === 'radio') {
    return (
      <div className="space-y-2">
        {question.options?.map((opt) => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={question.id}
              value={opt}
              checked={value === opt}
              onChange={() => onChange(opt)}
              className="text-blue-600"
            />
            <span className="text-sm text-gray-700">{opt}</span>
          </label>
        ))}
      </div>
    );
  }

  if (question.type === 'multiselect') {
    const selected = (value as string[]) ?? [];
    const toggle = (opt: string) => {
      const next = selected.includes(opt)
        ? selected.filter((s) => s !== opt)
        : [...selected, opt];
      onChange(next);
    };
    return (
      <div className="space-y-2">
        {question.options?.map((opt) => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => toggle(opt)}
              className="rounded text-blue-600"
            />
            <span className="text-sm text-gray-700">{opt}</span>
          </label>
        ))}
      </div>
    );
  }

  if (question.type === 'range') {
    const min = question.rangeMin ?? 0;
    const max = question.rangeMax ?? 100;
    const step = question.rangeStep ?? 1;
    const current = (value as number) ?? min;
    return (
      <div className="space-y-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={current}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>{min.toLocaleString()}{question.unit ? ` ${question.unit}` : ''}</span>
          <span className="font-medium text-blue-600">
            {current.toLocaleString()}{question.unit ? ` ${question.unit}` : ''}
          </span>
          <span>{max.toLocaleString()}{question.unit ? ` ${question.unit}` : ''}</span>
        </div>
      </div>
    );
  }

  return null;
}
