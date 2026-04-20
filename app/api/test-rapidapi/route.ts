import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return NextResponse.json({ error: 'RAPIDAPI_KEY not set' });

  // Try both providers with Israeli queries
  const tests = [
    { host: 'jsearch27.p.rapidapi.com', query: 'product manager Tel Aviv', country: 'il' },
    { host: 'jsearch27.p.rapidapi.com', query: 'product manager Israel', country: 'il' },
    { host: 'jobs-api14.p.rapidapi.com', query: 'product manager Tel Aviv', location: 'Tel Aviv, Israel' },
  ];

  const results = await Promise.all(tests.map(async ({ host, query, country, location }) => {
    const url = new URL(`https://${host}/search`);
    url.searchParams.set('query', query);
    url.searchParams.set('num_pages', '1');
    url.searchParams.set('page', '1');
    if (country) url.searchParams.set('country', country);
    if (location) url.searchParams.set('location', location);

    const res = await fetch(url.toString(), {
      headers: { 'X-RapidAPI-Key': apiKey, 'X-RapidAPI-Host': host },
    });
    const data = await res.json();
    return { host, query, status: res.status, count: data.data?.length ?? 0, error: data.message };
  }));

  return NextResponse.json(results);
}
