export interface Skill {
  name: string;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience?: number;
}

export interface WorkExperience {
  company: string;
  title: string;
  startDate: string;
  endDate: string | null;
  description: string;
  technologies: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  graduationYear?: number;
}

export interface ParsedCV {
  rawText: string;
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  skills: Skill[];
  workExperience: WorkExperience[];
  education: Education[];
  certifications: string[];
  languages: string[];
  totalYearsExperience: number;
}
