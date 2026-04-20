import 'server-only';
import { z } from 'zod';
import { getAnthropicClient, MODEL } from '@/lib/anthropic';
import type { ParsedCV } from '@/types/cv';

const SkillSchema = z.object({
  name: z.string(),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  yearsOfExperience: z.number().optional(),
});

const WorkExperienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  description: z.string(),
  technologies: z.array(z.string()),
});

const EducationSchema = z.object({
  institution: z.string(),
  degree: z.string(),
  field: z.string(),
  graduationYear: z.number().optional(),
});

const ParsedCVSchema = z.object({
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  summary: z.string().optional(),
  skills: z.array(SkillSchema),
  workExperience: z.array(WorkExperienceSchema),
  education: z.array(EducationSchema),
  certifications: z.array(z.string()),
  languages: z.array(z.string()),
  totalYearsExperience: z.number(),
});

export async function structureCVWithClaude(rawText: string): Promise<ParsedCV> {
  const client = getAnthropicClient();
  const truncated = rawText.slice(0, 6000);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    tools: [
      {
        name: 'submit_parsed_cv',
        description: 'Submit the structured CV data extracted from the resume text.',
        input_schema: {
          type: 'object' as const,
          properties: {
            name: { type: 'string', description: 'Full name of the candidate' },
            email: { type: 'string' },
            phone: { type: 'string' },
            location: { type: 'string', description: 'City, Country or similar' },
            summary: { type: 'string', description: 'Professional summary or objective' },
            skills: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
                  yearsOfExperience: { type: 'number' },
                },
                required: ['name'],
              },
            },
            workExperience: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  company: { type: 'string' },
                  title: { type: 'string' },
                  startDate: { type: 'string' },
                  endDate: { type: 'string', nullable: true },
                  description: { type: 'string' },
                  technologies: { type: 'array', items: { type: 'string' } },
                },
                required: ['company', 'title', 'startDate', 'endDate', 'description', 'technologies'],
              },
            },
            education: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  institution: { type: 'string' },
                  degree: { type: 'string' },
                  field: { type: 'string' },
                  graduationYear: { type: 'number' },
                },
                required: ['institution', 'degree', 'field'],
              },
            },
            certifications: { type: 'array', items: { type: 'string' } },
            languages: { type: 'array', items: { type: 'string' } },
            totalYearsExperience: { type: 'number', description: 'Total years of professional experience' },
          },
          required: ['name', 'skills', 'workExperience', 'education', 'certifications', 'languages', 'totalYearsExperience'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'submit_parsed_cv' },
    messages: [
      {
        role: 'user',
        content: `Extract and structure all information from this resume/CV:\n\n${truncated}`,
      },
    ],
  });

  const toolUse = response.content.find((block) => block.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Claude did not return a tool call for CV parsing');
  }

  const parsed = ParsedCVSchema.parse(toolUse.input);
  return { ...parsed, rawText };
}
