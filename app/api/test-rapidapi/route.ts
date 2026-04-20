import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.RAPIDAPI_KEY;
  const host = process.env.RAPIDAPI_HOST ?? 'jsearch.p.rapidapi.com';
  if (!apiKey) return NextResponse.json({ error: 'RAPIDAPI_KEY not set' });

  const queries = [
    { query: 'product manager Tel Aviv', country: 'il' },
    { query: 'product manager Israel', country: 'il' },
    { query: 'product manager Tel Aviv Israel', country: 'us' },
    { query: 'product manager', country: 'il' },
  ];

  const results = await Promise.all(queries.map(async ({ query, country }) => {
    const url = `https://${host}/search?query=${encodeURIComponent(query)}&num_pages=1&page=1&country=${country}`;
    const res = await fetch(url, {
      headers: { 'X-RapidAPI-Key': apiKey, 'X-RapidAPI-Host': host },
    });
    const data = await res.json();
    return { query, country, status: res.status, count: data.data?.length ?? 0, first: data.data?.[0]?.job_title };
  }));

  return NextResponse.json(results);
}
