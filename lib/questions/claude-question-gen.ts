import 'server-only';
import { z } from 'zod';
import { getAnthropicClient, MODEL } from '@/lib/anthropic';
import type { ParsedCV } from '@/types/cv';
import type { OnboardingQuestion } from '@/types/preferences';

const QuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  type: z.enum(['text', 'select', 'multiselect', 'range', 'radio']),
  options: z.array(z.string()).optional(),
  rangeMin: z.number().optional(),
  rangeMax: z.number().optional(),
  rangeStep: z.number().optional(),
  unit: z.string().optional(),
  required: z.boolean(),
});

export async function generateQuestionsWithClaude(cv: ParsedCV): Promise<OnboardingQuestion[]> {
  const client = getAnthropicClient();

  const cvSummary = `
Name: ${cv.name}
Location: ${cv.location ?? 'not specified'}
Total experience: ${cv.totalYearsExperience} years
Top skills: ${cv.skills.slice(0, 10).map((s) => s.name).join(', ')}
Most recent role: ${cv.workExperience[0]?.title ?? 'unknown'} at ${cv.workExperience[0]?.company ?? 'unknown'}
Education: ${cv.education.map((e) => `${e.degree} in ${e.field}`).join(', ')}
  `.trim();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    tools: [
      {
        name: 'submit_questions',
        description: 'Submit 4-5 onboarding questions to understand the candidate\'s job preferences.',
        input_schema: {
          type: 'object' as const,
          properties: {
            questions: {
              type: 'array',
              minItems: 4,
              maxItems: 5,
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  text: { type: 'string' },
                  type: { type: 'string', enum: ['text', 'select', 'multiselect', 'range', 'radio'] },
                  options: { type: 'array', items: { type: 'string' } },
                  rangeMin: { type: 'number' },
                  rangeMax: { type: 'number' },
                  rangeStep: { type: 'number' },
                  unit: { type: 'string' },
                  required: { type: 'boolean' },
                },
                required: ['id', 'text', 'type', 'required'],
              },
            },
          },
          required: ['questions'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'submit_questions' },
    messages: [
      {
        role: 'user',
        content: `Based on this candidate profile, generate 4-5 targeted onboarding questions to understand their job search preferences. Always include: desired job title(s), location preferences, remote/hybrid/onsite preference, salary range, and job type. Make questions specific to their background.\n\nCandidate profile:\n${cvSummary}`,
      },
    ],
  });

  const toolUse = response.content.find((b) => b.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Claude did not return questions');
  }

  const input = toolUse.input as { questions: unknown[] };
  return input.questions.map((q) => QuestionSchema.parse(q));
}
