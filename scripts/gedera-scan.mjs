#!/usr/bin/env node
/**
 * Scans Israeli real-estate boards for 5-6 room apartments and houses for sale
 * in Gedera, then renders an HTML digest for the daily email.
 *
 * Zero dependencies - runs on plain Node 18+ (global fetch).
 *
 *   node scripts/gedera-scan.mjs                  # writes gedera-report.html
 *   node scripts/gedera-scan.mjs --dry            # print to stdout, don't touch state
 *
 * Exit codes: 0 = listings found, 20 = no listings found (all sources empty).
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

/** Yad2's numeric id for Gedera (city=2550, area=52, topArea=41). */
const GEDERA = { topArea: 41, area: 52, city: 2550 };
const MIN_ROOMS = 5;
const MAX_ROOMS = 6;

const STATE_FILE = path.resolve('.gedera-state.json');
const REPORT_FILE = path.resolve('gedera-report.html');

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8',
};

/* ------------------------------------------------------------------ utils */

const shekels = (n) =>
  typeof n === 'number' && n > 0 ? `₪${n.toLocaleString('en-US')}` : '—';

/** First bytes of a response, for diagnosing a block page in the run log. */
const snippet = (body) => body.replace(/\s+/g, ' ').trim().slice(0, 140);

/**
 * Fetches and logs what actually came back. These boards answer bot traffic
 * with a 200 and an HTML interstitial, so the status code alone hides the
 * failure - the content type and first bytes are what identify it.
 */
async function fetchLogged(url, extraHeaders = {}) {
  const res = await fetch(url, { headers: { ...BROWSER_HEADERS, ...extraHeaders } });
  const body = await res.text();
  const type = res.headers.get('content-type')?.split(';')[0] ?? 'unknown';
  console.error(`  GET ${url}\n    -> ${res.status} ${type} ${body.length}B :: ${snippet(body)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return { body, type };
}

async function getJson(url, extraHeaders = {}) {
  const { body, type } = await fetchLogged(url, { Accept: 'application/json', ...extraHeaders });
  try {
    return JSON.parse(body);
  } catch {
    throw new Error(`expected JSON, got ${type} (${snippet(body)})`);
  }
}

async function getText(url) {
  const { body } = await fetchLogged(url, { Accept: 'text/html' });
  return body;
}

/**
 * Walks an arbitrary JSON tree and yields every object that looks like a
 * property listing. The boards reshape their payloads without warning, so we
 * detect listings by their fields rather than by a hard-coded path.
 */
function* findListingObjects(node, seen = new Set()) {
  if (!node || typeof node !== 'object') return;
  if (seen.has(node)) return;
  seen.add(node);

  if (Array.isArray(node)) {
    for (const item of node) yield* findListingObjects(item, seen);
    return;
  }

  const hasRooms = pick(node, ['rooms', 'Rooms', 'room', 'roomsCount', 'rooms_count']) != null;
  const hasPrice = pick(node, ['price', 'Price', 'priceValue']) != null;
  if (hasRooms && hasPrice) yield node;

  for (const value of Object.values(node)) yield* findListingObjects(value, seen);
}

/** First defined value among the candidate keys, searched one level deep. */
function pick(obj, keys) {
  for (const key of keys) {
    if (obj?.[key] != null && obj[key] !== '') return obj[key];
  }
  for (const key of keys) {
    for (const value of Object.values(obj ?? {})) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        if (value[key] != null && value[key] !== '') return value[key];
      }
    }
  }
  return undefined;
}

/**
 * Yad2 wraps display strings as `{ text: "הרצל" }` in newer payloads and emits
 * them bare in older ones, so unwrap before anything reaches the template.
 */
function toText(value) {
  if (value == null) return undefined;
  if (typeof value === 'string') return value.trim() || undefined;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    const inner = value.text ?? value.name ?? value.title ?? value.value ?? value.number;
    if (inner != null && typeof inner !== 'object') return String(inner).trim() || undefined;
  }
  return undefined;
}

/**
 * Absolutises a link and rejects anything that is not a real http(s) target,
 * so a malformed value can never reach the digest as a dead link.
 */
function toUrl(value, base) {
  const raw = toText(value);
  if (!raw) return undefined;
  try {
    const url = new URL(raw, base);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

/** "2,950,000 ₪" / "₪2950000" / 2950000 -> 2950000 */
function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string') return undefined;
  const digits = value.replace(/[^\d.]/g, '');
  if (!digits) return undefined;
  const n = Number.parseFloat(digits);
  return Number.isFinite(n) ? n : undefined;
}

/* ---------------------------------------------------------------- sources */

/**
 * Yad2 is the dominant board for Israeli listings, so it is the primary
 * source. The public gateway serves the same JSON the website consumes.
 */
async function scanYad2() {
  const params = new URLSearchParams({
    topArea: String(GEDERA.topArea),
    area: String(GEDERA.area),
    city: String(GEDERA.city),
    minRooms: String(MIN_ROOMS),
    maxRooms: String(MAX_ROOMS),
    forceLdLoad: 'true',
  });
  const json = await getJson(
    `https://gw.yad2.co.il/realestate-feed/forsale?${params}`,
    { Origin: 'https://www.yad2.co.il', Referer: 'https://www.yad2.co.il/realestate/forsale' },
  );

  const listings = [];
  for (const raw of findListingObjects(json)) {
    const rooms = toNumber(pick(raw, ['rooms', 'roomsCount', 'rooms_count']));
    const price = toNumber(pick(raw, ['price', 'priceValue']));
    if (rooms == null) continue;

    // Prefer a link the payload states outright; otherwise build the item URL
    // from the ad token. `token` is the canonical one - `id` is a fallback
    // because it is sometimes an internal key that does not resolve.
    const token = toText(pick(raw, ['token', 'linkToken', 'orderId', 'adNumber', 'id']));
    const url =
      toUrl(pick(raw, ['link', 'url', 'href', 'itemUrl']), 'https://www.yad2.co.il') ??
      (token ? `https://www.yad2.co.il/realestate/item/${encodeURIComponent(token)}` : undefined);

    // Newer payloads group location under `address`; older ones inline it.
    const addr = raw.address && typeof raw.address === 'object' ? raw.address : {};
    const street = toText(addr.street) ?? toText(pick(raw, ['street', 'streetName']));
    const houseNumber =
      toText(addr.house) ?? toText(pick(raw, ['houseNumber', 'house_number']));

    listings.push({
      source: 'Yad2',
      id: token ? `yad2:${token}` : undefined,
      rooms,
      price,
      address: [street, houseNumber].filter(Boolean).join(' ').trim() || undefined,
      neighborhood:
        toText(addr.neighborhood) ?? toText(pick(raw, ['neighborhood', 'neighborhoodName'])),
      sqm: toNumber(pick(raw, ['square_meters', 'squareMeters', 'squareMeter', 'size', 'builtArea'])),
      floor: toText(pick(raw, ['floor', 'onFloor', 'floorNumber'])),
      type: toText(pick(raw, ['propertyTypeText', 'property_type', 'categoryText', 'property'])),
      url,
      image: toText(pick(raw, ['coverImage', 'cover_image', 'image', 'mainImage'])),
    });
  }
  return listings;
}

/**
 * Homeless publishes a plain server-rendered board, which survives payload
 * churn better than the SPA sources and is a useful cross-check on Yad2.
 */
async function scanHomeless() {
  // inumber1=313 -> Gedera & surroundings; inumber4 9 = 5 rooms, 11 = 6 rooms.
  const settled = await Promise.allSettled(
    ['9', '11'].map((rooms) =>
      getText(`https://www.homeless.co.il/sale/inumber1=313$$inumber4=${rooms}`),
    ),
  );
  const pages = settled.filter((r) => r.status === 'fulfilled').map((r) => r.value);
  // Swallowing these would report an outage as "0 listings", hiding the cause.
  if (!pages.length) {
    throw new Error(settled.map((r) => r.reason?.message ?? r.reason).join('; '));
  }

  const listings = [];
  let rowsSeen = 0;
  for (const html of pages) {
    // Each result row links to /nadlan/<id> and carries price + rooms nearby.
    const rowRe = /<a[^>]+href="(\/(?:nadlan|sale)\/[^"]+)"[^>]*>([\s\S]{0,600}?)<\/a>/g;
    for (const [, href, chunk] of html.matchAll(rowRe)) {
      rowsSeen++;
      const text = chunk.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const rooms = toNumber(text.match(/(\d+(?:\.\d)?)\s*חדרים/)?.[1]);
      const price = toNumber(text.match(/([\d,]{6,})\s*(?:₪|ש"ח)/)?.[1]);
      if (rooms == null || rooms < MIN_ROOMS || rooms > MAX_ROOMS) continue;

      listings.push({
        source: 'Homeless',
        id: `homeless:${href}`,
        rooms,
        price,
        address: text.slice(0, 80) || undefined,
        sqm: toNumber(text.match(/(\d{2,4})\s*מ"ר/)?.[1]),
        url: toUrl(href, 'https://www.homeless.co.il'),
      });
    }
  }
  // Rows matched but none kept means the row markup moved, not an empty board.
  console.error(`  Homeless: ${rowsSeen} anchor rows scanned, ${listings.length} kept`);
  return listings;
}

const SOURCES = [
  { name: 'Yad2', run: scanYad2 },
  { name: 'Homeless', run: scanHomeless },
];

/* ------------------------------------------------------------ aggregation */

function dedupe(listings) {
  const byKey = new Map();
  for (const listing of listings) {
    // Fall back to a content key so a listing missing an id still collapses.
    const key =
      listing.id ??
      `${listing.source}:${listing.rooms}:${listing.price ?? '?'}:${listing.address ?? '?'}`;
    if (!byKey.has(key)) byKey.set(key, { ...listing, id: key });
  }
  return [...byKey.values()];
}

async function loadSeen() {
  try {
    const parsed = JSON.parse(await readFile(STATE_FILE, 'utf8'));
    return new Set(parsed.seen ?? []);
  } catch {
    return new Set();
  }
}

/* -------------------------------------------------------------- rendering */

function renderHtml({ listings, errors, generatedAt }) {
  const fresh = listings.filter((l) => l.isNew);
  const rows = listings
    .map((l) => {
      const title = [l.type, l.address, l.neighborhood].filter(Boolean).join(' · ') || 'נכס';
      const facts = [
        `${l.rooms} חדרים`,
        l.sqm ? `${l.sqm} מ"ר` : null,
        l.floor != null && l.floor !== '' ? `קומה ${l.floor}` : null,
        l.source,
      ].filter(Boolean);
      return `
      <tr${l.isNew ? ' style="background:#f0fdf4"' : ''}>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb">
          ${l.isNew ? '<span style="background:#16a34a;color:#fff;border-radius:4px;padding:1px 6px;font-size:11px">חדש</span> ' : ''}
          <a href="${escapeHtml(l.url)}" style="color:#1d4ed8;text-decoration:none"><strong>${escapeHtml(title)}</strong></a><br>
          <span style="color:#6b7280;font-size:13px">${escapeHtml(facts.join(' | '))}</span>
        </td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;white-space:nowrap"><strong>${shekels(l.price)}</strong></td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb">
          <a href="${escapeHtml(l.url)}">למודעה ↗</a>
        </td>
      </tr>`;
    })
    .join('');

  const errorBlock = errors.length
    ? `<p style="color:#b45309;font-size:13px">מקורות שנכשלו: ${escapeHtml(
        errors.map((e) => `${e.name} (${e.message})`).join(', '),
      )}</p>`
    : '';

  return `<!doctype html>
<html dir="rtl" lang="he"><meta charset="utf-8">
<body style="font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;background:#f9fafb;padding:16px">
  <div style="max-width:720px;margin:0 auto;background:#fff;border-radius:10px;padding:20px">
    <h2 style="margin:0 0 4px">דירות ובתים למכירה בגדרה — ${MIN_ROOMS}-${MAX_ROOMS} חדרים</h2>
    <p style="color:#6b7280;margin:0 0 16px">
      ${listings.length} נכסים · ${fresh.length} חדשים מאז הסריקה הקודמת · ${escapeHtml(generatedAt)}
    </p>
    ${errorBlock}
    ${
      listings.length
        ? `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>`
        : '<p>לא נמצאו נכסים תואמים בסריקה הנוכחית.</p>'
    }
    <p style="color:#9ca3af;font-size:12px;margin-top:20px">
      נסרק אוטומטית מ-Yad2 ו-Homeless. המחירים והפרטים כפי שפורסמו במקור.
    </p>
  </div>
</body></html>`;
}

/** Markdown table for the Actions job summary, so a run is readable without email. */
function renderMarkdown({ listings, errors, generatedAt }) {
  const lines = [
    `## דירות ובתים למכירה בגדרה — ${MIN_ROOMS}-${MAX_ROOMS} חדרים`,
    '',
    `${listings.length} נכסים · ${listings.filter((l) => l.isNew).length} חדשים · ${generatedAt}`,
    '',
  ];
  if (errors.length) {
    lines.push(`> מקורות שנכשלו: ${errors.map((e) => `${e.name} (${e.message})`).join(', ')}`, '');
  }
  if (!listings.length) {
    lines.push('_לא נמצאו נכסים תואמים._');
    return lines.join('\n');
  }
  lines.push('| | נכס | חדרים | מ"ר | קומה | מחיר | מקור |', '| --- | --- | --- | --- | --- | --- | --- |');
  for (const l of listings) {
    const name = [l.type, l.address, l.neighborhood].filter(Boolean).join(' · ') || 'נכס';
    // Pipes in a scraped title would break out of the table cell.
    const label = name.replace(/\|/g, '/');
    lines.push(
      `| ${l.isNew ? '🆕' : ''} | [${label}](${l.url}) | ${l.rooms} | ${l.sqm ?? '—'} | ${
        l.floor ?? '—'
      } | ${shekels(l.price)} | ${l.source} |`,
    );
  }
  return lines.join('\n');
}

function escapeHtml(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
}

/* ------------------------------------------------------------------- main */

async function main() {
  const dryRun = process.argv.includes('--dry');

  const results = await Promise.allSettled(SOURCES.map((s) => s.run()));
  const errors = [];
  let collected = [];

  results.forEach((result, i) => {
    const { name } = SOURCES[i];
    if (result.status === 'fulfilled') {
      console.error(`${name}: ${result.value.length} listings`);
      collected = collected.concat(result.value);
    } else {
      console.error(`${name}: FAILED - ${result.reason?.message ?? result.reason}`);
      errors.push({ name, message: String(result.reason?.message ?? result.reason).slice(0, 120) });
    }
  });

  const inRange = dedupe(collected).filter(
    (l) => l.rooms >= MIN_ROOMS && l.rooms <= MAX_ROOMS,
  );

  // Every entry must link to its own listing page, so anything we could not
  // resolve a URL for is dropped rather than shown as a dead-end row.
  const listings = inRange
    .filter((l) => l.url)
    .sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));

  const unlinked = inRange.length - listings.length;
  if (unlinked > 0) {
    console.error(`dropped ${unlinked} listing(s) with no resolvable link`);
    errors.push({ name: 'ללא קישור', message: `${unlinked} מודעות הושמטו` });
  }

  const seen = await loadSeen();
  for (const listing of listings) listing.isNew = !seen.has(listing.id);

  const view = {
    listings,
    errors,
    generatedAt: new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' }),
  };
  const html = renderHtml(view);
  const markdown = renderMarkdown(view);

  const newCount = listings.filter((l) => l.isNew).length;
  console.error(`total: ${listings.length} matching, ${newCount} new`);

  if (dryRun) {
    console.log(process.argv.includes('--md') ? markdown : html);
    return listings.length ? 0 : 20;
  }

  await writeFile(REPORT_FILE, html, 'utf8');
  // Renders in the Actions run page, so the digest is readable without email.
  if (process.env.GITHUB_STEP_SUMMARY) {
    await writeFile(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`, { flag: 'a' });
  }
  await writeFile(
    STATE_FILE,
    `${JSON.stringify({ updatedAt: new Date().toISOString(), seen: listings.map((l) => l.id) }, null, 2)}\n`,
    'utf8',
  );

  // Surfaced to the workflow so the email subject can mention the new count.
  if (process.env.GITHUB_OUTPUT) {
    await writeFile(
      process.env.GITHUB_OUTPUT,
      `total=${listings.length}\nnew=${newCount}\n`,
      { flag: 'a' },
    );
  }
  return listings.length ? 0 : 20;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
