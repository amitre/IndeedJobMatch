import 'server-only';

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // Dynamic import to avoid bundling issues with pdf-parse
  const pdfParse = (await import('pdf-parse')).default;
  const data = await pdfParse(buffer);
  return data.text.trim();
}
