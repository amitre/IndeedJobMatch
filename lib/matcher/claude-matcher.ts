import 'server-only';
import { z } from 'zod';
import { getAnthropicClient, MODEL } from '@/lib/anthropic';
import type { Job } from '@/types/job';
import type { ParsedCV } from '@/types/cv';
import type { MatchResult } from '@/types/matching';

const MatchResultSchema = z.object({
  score: z.number().min(0).max(100),
  label: z.enum(['Excellent', 'Good', 'Fair', 'Low']),
  gaps: z.array(
    z.object({
      category: z.enum(['skill', 'experience', 'education', 'other']),
      description: z.string(),
      severity: z.enum(['critical', 'moderate', 'minor']),
    })
  ),
  strengths: z.array(
    z.object({
      category: z.enum(['skill', 'experience', 'education', 'other']),
      description: z.string(),
    })
  ),
  summary: z.string(),
});

export async function matchJobWithClaude(
  job: Job,
  cv: ParsedCV,
  feedbackContext: string
): Promise<MatchResult> {
  const client = getAnthropicClient();

  const jobText = `Job Title: ${job.title}
Company: ${job.company}
Location: ${job.location}${job.remote ? ' (Remote)' : ''}
Type: ${job.jobType ?? 'not specified'}
${job.salary ? `Salary: ${job.salary.min ?? '?'}–${job.salary.max ?? '?'} ${job.salary.currency}/${job.salary.period}` : ''}

Description:
${job.description.slice(0, 2500)}`;

  const cvText = cv.rawText.slice(0, 3000);

  const systemPrompt = feedbackContext
    ? `You are a job matching expert. Score 85–100 for strong alignment, 65–84 for good fit with minor gaps, 40–64 for moderate fit, 0–39 for poor fit.\n\n${feedbackContext}`
    : 'You are a job matching expert. Score 85–100 for strong alignment, 65–84 for good fit with minor gaps, 40–64 for moderate fit, 0–39 for poor fit.';

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 800,
    system: systemPrompt,
    tools: [
      {
        name: 'submit_match_result',
        description: 'Submit the match analysis between the candidate and the job.',
        input_schema: {
          type: 'object' as const,
          properties: {
            score: { type: 'number', minimum: 0, maximum: 100 },
            label: { type: 'string', enum: ['Excellent', 'Good', 'Fair', 'Low'] },
            gaps: {
              type: 'array',
              maxItems: 4,
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string', enum: ['skill', 'experience', 'education', 'other'] },
                  description: { type: 'string' },
                  severity: { type: 'string', enum: ['critical', 'moderate', 'minor'] },
                },
                required: ['category', 'description', 'severity'],
              },
            },
            strengths: {
              type: 'array',
              maxItems: 4,
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string', enum: ['skill', 'experience', 'education', 'other'] },
                  description: { type: 'string' },
                },
                required: ['category', 'description'],
              },
            },
            summary: { type: 'string', description: '1-2 sentence verdict' },
          },
          required: ['score', 'label', 'gaps', 'strengths', 'summary'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'submit_match_result' },
    messages: [
      {
        role: 'user',
        content: `Analyze how well this candidate matches the job.\n\n## Job\n${jobText}\n\n## Candidate CV\n${cvText}`,
      },
    ],
  });

  const toolUse = response.content.find((b) => b.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error(`Claude did not return match result for job ${job.id}`);
  }

  const parsed = MatchResultSchema.parse(toolUse.input);
  return { ...parsed, jobId: job.id };
}
