#!/usr/bin/env node
/**
 * Probes candidate real-estate boards and reports which are reachable from
 * this network, so extractors are only written for sources that actually
 * answer. Writes a markdown verdict table to the Actions job summary.
 *
 *   node scripts/probe-sources.mjs
 */

import { writeFile } from 'node:fs/promises';

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8',
  Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
};

/** Gedera on each board. Queries aim at for-sale listings, 5+ rooms where the board supports it. */
const CANDIDATES = [
  ['ad.co.il', 'https://www.ad.co.il/nadlansale?sp3=256'],
  ['komo.co.il', 'https://www.komo.co.il/code/nadlan/apartments-for-sale.asp?cityName=%D7%92%D7%93%D7%A8%D7%94&fromRooms=5'],
  ['winwin.co.il', 'https://www.winwin.co.il/RealEstate/ForSale?cityId=2550'],
  ['yad1.co.il', 'https://www.yad1.co.il/'],
  ['madlan (page)', 'https://www.madlan.co.il/for-sale/%D7%92%D7%93%D7%A8%D7%94-%D7%99%D7%A9%D7%A8%D7%90%D7%9C'],
  ['madlan (api)', 'https://www.madlan.co.il/api/search?q=%D7%92%D7%93%D7%A8%D7%94'],
  ['onmap (page)', 'https://www.onmap.co.il/homes/buy/gedera/rooms_5'],
  ['onmap (api)', 'https://api.onmap.co.il/api/v1/assets?dealType=sale&city=gedera'],
  ['homeless (mobile)', 'https://m.homeless.co.il/sale?inumber1=313&inumber4=9'],
  ['yad2 (website)', 'https://www.yad2.co.il/realestate/forsale?city=2550&minRooms=5&maxRooms=6'],
  ['nadlanmaster', 'https://www.nadlanmaster.co.il/%D7%92%D7%93%D7%A8%D7%94/'],
  ['remax.co.il', 'https://www.remax.co.il/for-sale/gedera'],
  ['anglo-saxon', 'https://www.anglo-saxon.co.il/'],
  ['nadlan.gov.il', 'https://www.nadlan.gov.il/'],
];

/** Signatures of the interstitials these boards serve to automated traffic. */
const BLOCK_MARKERS = [
  'just a moment',
  'captcha',
  'bot manager',
  'access denied',
  'attention required',
  'cf-browser-verification',
  'enable javascript and cookies',
  'perimeterx',
  'px-captcha',
  'incapsula',
  'not in allowlist',
];

const clean = (s) => s.replace(/\s+/g, ' ').trim();

function classify(status, type, body) {
  // Match the marker in the <title> only. A page that merely loads reCAPTCHA
  // for its contact form is a normal page, and matching anywhere in the body
  // wrongly condemned it.
  const title = (body.match(/<title[^>]*>([\s\S]{0,200}?)<\/title>/i)?.[1] ?? '').toLowerCase();
  const marker = BLOCK_MARKERS.find((m) => title.includes(m));
  if (marker) return { verdict: '🚫 blocked', note: `anti-bot: ${marker}` };
  if (body.slice(0, 300).toLowerCase().includes('not in allowlist')) {
    return { verdict: '🚫 blocked', note: 'egress allowlist' };
  }
  if (status >= 400) return { verdict: '🚫 error', note: `HTTP ${status}` };
  if (body.length < 1000) return { verdict: '⚠️ thin', note: `only ${body.length}B` };
  // A usable board page mentions rooms or prices in Hebrew.
  const looksReal = /חדרים|₪|מ"ר|למכירה/.test(body);
  return looksReal
    ? { verdict: '✅ usable', note: `${type}, ${body.length}B` }
    : { verdict: '⚠️ no listings markup', note: `${type}, ${body.length}B` };
}

async function probe([name, url]) {
  const started = Date.now();
  try {
    // Without this a single unresponsive host stalls the whole probe.
    const res = await fetch(url, {
      headers: HEADERS,
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });
    const body = await res.text();
    const type = res.headers.get('content-type')?.split(';')[0] ?? '?';
    const { verdict, note } = classify(res.status, type, body);
    return { name, url, status: res.status, verdict, note, ms: Date.now() - started,
             snippet: clean(body.slice(0, 160)), body };
  } catch (err) {
    return { name, url, status: '-', verdict: '🚫 failed', note: clean(String(err.message)).slice(0, 80),
             ms: Date.now() - started, snippet: '' };
  }
}

const results = [];
// Sequential, to stay well inside anything that would look like a burst.
for (const candidate of CANDIDATES) {
  const result = await probe(candidate);
  results.push(result);
  console.error(`${result.verdict.padEnd(12)} ${result.name.padEnd(20)} ${result.status} ${result.note}`);
  if (result.snippet) console.error(`             :: ${result.snippet.slice(0, 120)}`);
}

const usable = results.filter((r) => r.verdict.startsWith('✅'));

/**
 * For each usable board, report how its listings are carried: an embedded
 * state blob is far more stable to read than scraped markup, so knowing which
 * exists decides how the extractor should be written.
 */
for (const r of usable) {
  console.error(`\n===== structure: ${r.name} =====`);
  for (const [label, re] of [
    ['__NEXT_DATA__', /<script[^>]+id="__NEXT_DATA__"[^>]*>([\s\S]{0,400})/],
    ['__NUXT__', /window\.__NUXT__\s*=\s*([\s\S]{0,300})/],
    ['INITIAL_STATE', /window\.__INITIAL_STATE__\s*=\s*([\s\S]{0,300})/],
    ['JSON-LD', /<script[^>]+application\/ld\+json[^>]*>([\s\S]{0,400})/],
  ]) {
    const hit = r.body.match(re);
    if (hit) console.error(`  ${label}: ${clean(hit[1]).slice(0, 260)}`);
  }
  // Markup immediately around a room count is what an HTML extractor keys on.
  const contexts = [...r.body.matchAll(/.{260}חדרים/g)].slice(0, 3);
  contexts.forEach((c, i) => console.error(`  ctx${i}: ${clean(c[0]).slice(0, 300)}`));
  if (!contexts.length) console.error('  (no "חדרים" in markup - listings likely loaded via XHR)');
}

const table = [
  '## Source reachability probe',
  '',
  `${usable.length} of ${results.length} candidates usable from this runner.`,
  '',
  '| Source | Status | Verdict | Detail |',
  '| --- | --- | --- | --- |',
  ...results.map((r) => `| ${r.name} | ${r.status} | ${r.verdict} | ${r.note.replace(/\|/g, '/')} |`),
].join('\n');

console.log(table);
if (process.env.GITHUB_STEP_SUMMARY) {
  await writeFile(process.env.GITHUB_STEP_SUMMARY, `${table}\n`, { flag: 'a' });
}
