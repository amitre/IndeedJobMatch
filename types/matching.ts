export interface MatchGap {
  category: 'skill' | 'experience' | 'education' | 'other';
  description: string;
  severity: 'critical' | 'moderate' | 'minor';
}

export interface MatchStrength {
  category: 'skill' | 'experience' | 'education' | 'other';
  description: string;
}

export interface MatchResult {
  jobId: string;
  score: number;
  label: 'Excellent' | 'Good' | 'Fair' | 'Low';
  gaps: MatchGap[];
  strengths: MatchStrength[];
  summary: string;
}

export type JobWithMatch = import('./job').Job & { match: MatchResult };
