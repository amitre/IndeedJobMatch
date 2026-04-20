import 'server-only';

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const pdfParse = (await import('pdf-parse')).default;
  const data = await pdfParse(buffer);
  return data.text.trim();
}

export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return result.value.trim();
}

export async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return extractTextFromDocx(buffer);
  }
  return extractTextFromPDF(buffer);
}
