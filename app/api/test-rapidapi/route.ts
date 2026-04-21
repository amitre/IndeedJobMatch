import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return NextResponse.json({ error: 'RAPIDAPI_KEY not set' });

  const host = 'jobs-api14.p.rapidapi.com';

  // Try the search endpoint with Tel Aviv
  const url = `https://${host}/list?query=Product%20Manager&location=Tel%20Aviv%2C%20Israel&distance=1.0&language=en_GB&remoteOnly=false&datePosted=month&employmentTypes=fulltime&index=0`;

  const res = await fetch(url, {
    headers: { 'X-RapidAPI-Key': apiKey, 'X-RapidAPI-Host': host },
  });

  const data = await res.json();
  const items = Array.isArray(data) ? data : (data.jobs ?? data.data ?? data.results ?? []);
  return NextResponse.json({
    status: res.status,
    count: items.length,
    top_keys: data ? Object.keys(data) : [],
    sample: items.slice(0, 2),
  });
}
