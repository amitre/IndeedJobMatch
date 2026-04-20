'use client';
import type { ParsedCV } from '@/types/cv';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface Props {
  cv: ParsedCV;
  onConfirm: () => void;
  onReset: () => void;
}

export function CVPreview({ cv, onConfirm, onReset }: Props) {
  return (
    <Card className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{cv.name}</h2>
        <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
          {cv.email && <span>{cv.email}</span>}
          {cv.phone && <span>{cv.phone}</span>}
          {cv.location && <span>{cv.location}</span>}
        </div>
      </div>

      {cv.summary && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-1">Summary</h3>
          <p className="text-sm text-gray-600">{cv.summary}</p>
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Skills <span className="text-gray-400">({cv.skills.length})</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {cv.skills.slice(0, 20).map((s) => (
            <Badge key={s.name} color="blue">{s.name}</Badge>
          ))}
          {cv.skills.length > 20 && (
            <Badge color="gray">+{cv.skills.length - 20} more</Badge>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Work Experience <span className="text-gray-400">({cv.workExperience.length} roles)</span>
        </h3>
        <div className="space-y-2">
          {cv.workExperience.slice(0, 3).map((w, i) => (
            <div key={i} className="text-sm">
              <span className="font-medium text-gray-800">{w.title}</span>
              <span className="text-gray-500"> at {w.company}</span>
              <span className="text-gray-400 text-xs ml-2">
                {w.startDate} – {w.endDate ?? 'Present'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {cv.education.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Education</h3>
          {cv.education.map((e, i) => (
            <div key={i} className="text-sm text-gray-600">
              {e.degree} in {e.field} — {e.institution}
              {e.graduationYear && <span className="text-gray-400 ml-2">{e.graduationYear}</span>}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <p className="text-sm text-gray-500">
          {cv.totalYearsExperience} year{cv.totalYearsExperience !== 1 ? 's' : ''} of experience detected
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onReset}>Re-upload</Button>
          <Button onClick={onConfirm}>Looks good, continue →</Button>
        </div>
      </div>
    </Card>
  );
}
