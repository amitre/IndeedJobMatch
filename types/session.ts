import type { ParsedCV } from './cv';
import type { UserPreferences, OnboardingQuestion } from './preferences';

export interface SessionData {
  sessionId: string;
  createdAt: string;
  cv?: ParsedCV;
  preferences?: UserPreferences;
  questions?: OnboardingQuestion[];
  feedbackIds: string[];
  dismissedJobIds: string[];
}
