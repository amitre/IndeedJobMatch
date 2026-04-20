import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.RAPIDAPI_KEY;
  const host = process.env.RAPIDAPI_HOST ?? 'jsearch.p.rapidapi.com';

  if (!apiKey) return NextResponse.json({ error: 'RAPIDAPI_KEY not set' });

  const url = `https://${host}/search?query=product+manager+in+Tel+Aviv&num_pages=1&page=1&country=il`;

  const res = await fetch(url, {
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': host,
    },
  });

  const body = await res.text();
  return NextResponse.json({
    status: res.status,
    host,
    key_prefix: apiKey.slice(0, 12),
    body: body.slice(0, 500),
  });
}
