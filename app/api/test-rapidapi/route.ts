import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return NextResponse.json({ error: 'RAPIDAPI_KEY not set' });

  const host = process.env.LINKEDIN_HOST ?? 'linkedin-job-search-api.p.rapidapi.com';
  const url = `https://${host}/active-jb-7d?title_filter="Product Manager"&location_filter="Israel"&limit=5`;

  const res = await fetch(url, {
    headers: { 'X-RapidAPI-Key': apiKey, 'X-RapidAPI-Host': host },
  });

  const data = await res.json();
  const items = Array.isArray(data) ? data : (data.data ?? data.jobs ?? []);
  return NextResponse.json({
    status: res.status,
    count: items.length,
    sample: items.slice(0, 2).map((r: Record<string, unknown>) => ({
      title: r.title ?? r.job_title,
      company: r.company ?? r.company_name,
      location: r.location ?? r.job_location,
    })),
    raw_keys: items[0] ? Object.keys(items[0]) : [],
  });
}
