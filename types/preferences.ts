export type QuestionType = 'text' | 'select' | 'multiselect' | 'range' | 'radio';

export interface OnboardingQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  rangeMin?: number;
  rangeMax?: number;
  rangeStep?: number;
  unit?: string;
  required: boolean;
}

export interface OnboardingAnswer {
  questionId: string;
  value: string | string[] | number;
}

export interface UserPreferences {
  desiredJobTitles: string[];
  preferredLocations: string[];
  remotePreference: 'remote' | 'hybrid' | 'onsite' | 'any';
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship' | 'any';
  industries?: string[];
  experienceLevelTarget: 'entry' | 'mid' | 'senior' | 'lead' | 'any';
  rawAnswers: OnboardingAnswer[];
}
