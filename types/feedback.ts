export type FeedbackReason =
  | 'wrong_location'
  | 'salary_too_low'
  | 'overqualified'
  | 'underqualified'
  | 'wrong_industry'
  | 'not_interested_in_company'
  | 'other';

export const FEEDBACK_REASON_LABELS: Record<FeedbackReason, string> = {
  wrong_location: 'Wrong location',
  salary_too_low: 'Salary too low',
  overqualified: 'Overqualified',
  underqualified: 'Underqualified',
  wrong_industry: 'Wrong industry',
  not_interested_in_company: 'Not interested in company',
  other: 'Other reason',
};

export interface FeedbackEntry {
  id: string;
  sessionId: string;
  jobId: string;
  jobTitle: string;
  company: string;
  reason: FeedbackReason;
  customNote?: string;
  createdAt: string;
}
