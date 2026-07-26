#!/usr/bin/env node
/**
 * Aggregates 5-6 room apartments and houses for sale in Gedera from the
 * listing boards that are reachable, into one daily digest.
 *
 * Every board renders its listings client-side, so pages are loaded in
 * Chromium rather than fetched. See scripts/lib/extract.mjs for how listings
 * are located once rendered, and scripts/README.md for which boards are
 * covered and why the big two are not.
 *
 *   node scripts/gedera-scan.mjs            # write gedera-report.html
 *   node scripts/gedera-scan.mjs --dry      # print instead, leave state alone
 *   node scripts/gedera-scan.mjs --dry --md # print as a markdown table
 *
 * Exit codes: 0 = listings found, 20 = none found.
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

import { extractListings } from './lib/extract.mjs';

const MIN_ROOMS = 5;
const MAX_ROOMS = 6;
const CITY = 'גדרה';

const STATE_FILE = path.resolve('.gedera-state.json');
const REPORT_FILE = path.resolve('gedera-report.html');

/**
 * `requireCity` is set for boards whose URL cannot be scoped to Gedera, so
 * their nationwide results are filtered by the card's own text instead.
 */
const BOARDS = [
  {
    name: 'Komo',
    url: 'https://www.komo.co.il/code/nadlan/apartments-for-sale.asp?cityName=%D7%92%D7%93%D7%A8%D7%94&fromRooms=5',
  },
  {
    name: 'Ad',
    url: 'https://www.ad.co.il/nadlansale?sp3=256',
  },
  {
    name: 'OnMap',
    url: 'https://www.onmap.co.il/homes/buy/gedera/rooms_5',
  },
  {
    name: 'AngloSaxon',
    url: 'https://www.anglo-saxon.co.il/properties/?city=%D7%92%D7%93%D7%A8%D7%94',
    requireCity: CITY,
  },
];

const shekels = (n) =>
  typeof n === 'number' && n > 0 ? `₪${n.toLocaleString('en-US')}` : '—';

/* ------------------------------------------------------------------ scrape */

/** Lazy boards only load their cards as the list is scrolled. */
async function scrollThrough(page) {
  for (let i = 0; i < 6; i++) {
    await page.mouse.wheel(0, 2500);
    await page.waitForTimeout(700);
  }
}

/**
 * One slow response should not cost a day's digest, and these boards are
 * routinely slow, so a board gets a second attempt with a longer budget
 * before it is reported as failed.
 */
async function scanBoard(browser, board, attempt = 1) {
  try {
    return await scanBoardOnce(browser, board, attempt === 1 ? 45000 : 75000);
  } catch (err) {
    if (attempt >= 2) throw err;
    console.error(`${board.name}: attempt ${attempt} failed (${err.message.split('\n')[0]}), retrying`);
    return scanBoard(browser, board, attempt + 1);
  }
}

async function scanBoardOnce(browser, board, timeout) {
  const page = await browser.newPage({
    locale: 'he-IL',
    viewport: { width: 1400, height: 1000 },
  });
  try {
    await page.goto(board.url, { waitUntil: 'domcontentloaded', timeout });
    await page.waitForLoadState('networkidle', { timeout: 25000 }).catch(() => {});
    await page.waitForTimeout(2500);
    await scrollThrough(page);

    const raw = await page.evaluate(extractListings, {
      minRooms: MIN_ROOMS,
      maxRooms: MAX_ROOMS,
      requireCity: board.requireCity ?? null,
    });

    return raw.map((l) => ({ ...l, source: board.name, id: `${board.name}:${l.url}` }));
  } finally {
    await page.close();
  }
}

/* ------------------------------------------------------------- aggregation */

function dedupe(listings) {
  const byUrl = new Map();
  for (const listing of listings) {
    if (!byUrl.has(listing.url)) byUrl.set(listing.url, listing);
  }
  return [...byUrl.values()];
}

async function loadSeen() {
  try {
    return new Set(JSON.parse(await readFile(STATE_FILE, 'utf8')).seen ?? []);
  } catch {
    return new Set();
  }
}

/* --------------------------------------------------------------- rendering */

function describe(l) {
  // The card text is the only title these boards give us; trim it to the part
  // that reads as a description rather than a wall of badges.
  return l.text?.split(/\s{2,}|\|/)[0]?.slice(0, 90) || `${l.rooms} חדרים`;
}

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
  lines.push(
    '| | נכס | חדרים | מ"ר | קומה | מחיר | מקור |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  );
  for (const l of listings) {
    lines.push(
      `| ${l.isNew ? '🆕' : ''} | [${describe(l).replace(/\|/g, '/')}](${l.url}) | ${l.rooms} | ${
        l.sqm ?? '—'
      } | ${l.floor ?? '—'} | ${shekels(l.price)} | ${l.source} |`,
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

function renderHtml({ listings, errors, generatedAt }) {
  const rows = listings
    .map((l) => {
      const facts = [
        `${l.rooms} חדרים`,
        l.sqm ? `${l.sqm} מ"ר` : null,
        l.floor ? `קומה ${l.floor}` : null,
        l.source,
      ].filter(Boolean);
      return `
      <tr${l.isNew ? ' style="background:#f0fdf4"' : ''}>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb">
          ${l.isNew ? '<span style="background:#16a34a;color:#fff;border-radius:4px;padding:1px 6px;font-size:11px">חדש</span> ' : ''}
          <a href="${escapeHtml(l.url)}" style="color:#1d4ed8;text-decoration:none"><strong>${escapeHtml(describe(l))}</strong></a><br>
          <span style="color:#6b7280;font-size:13px">${escapeHtml(facts.join(' | '))}</span>
        </td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;white-space:nowrap"><strong>${shekels(l.price)}</strong></td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb"><a href="${escapeHtml(l.url)}">למודעה ↗</a></td>
      </tr>`;
    })
    .join('');

  return `<!doctype html>
<html dir="rtl" lang="he"><meta charset="utf-8">
<body style="font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;background:#f9fafb;padding:16px">
  <div style="max-width:760px;margin:0 auto;background:#fff;border-radius:10px;padding:20px">
    <h2 style="margin:0 0 4px">דירות ובתים למכירה בגדרה — ${MIN_ROOMS}-${MAX_ROOMS} חדרים</h2>
    <p style="color:#6b7280;margin:0 0 16px">
      ${listings.length} נכסים · ${listings.filter((l) => l.isNew).length} חדשים מאז הסריקה הקודמת · ${escapeHtml(generatedAt)}
    </p>
    ${
      errors.length
        ? `<p style="color:#b45309;font-size:13px">מקורות שנכשלו: ${escapeHtml(
            errors.map((e) => `${e.name} (${e.message})`).join(', '),
          )}</p>`
        : ''
    }
    ${
      listings.length
        ? `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>`
        : '<p>לא נמצאו נכסים תואמים בסריקה הנוכחית.</p>'
    }
  </div>
</body></html>`;
}

/* -------------------------------------------------------------------- main */

async function main() {
  const dryRun = process.argv.includes('--dry');
  const browser = await chromium.launch();
  const errors = [];
  let collected = [];

  try {
    for (const board of BOARDS) {
      try {
        const found = await scanBoard(browser, board);
        console.error(`${board.name}: ${found.length} listings`);
        collected = collected.concat(found);
      } catch (err) {
        const message = String(err.message).split('\n')[0].slice(0, 120);
        console.error(`${board.name}: FAILED - ${message}`);
        errors.push({ name: board.name, message });
      }
    }
  } finally {
    await browser.close();
  }

  const listings = dedupe(collected).sort(
    (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity),
  );

  const seen = await loadSeen();
  for (const listing of listings) listing.isNew = !seen.has(listing.id);

  const view = {
    listings,
    errors,
    generatedAt: new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' }),
  };
  const newCount = listings.filter((l) => l.isNew).length;
  console.error(`total: ${listings.length} matching, ${newCount} new`);

  if (dryRun) {
    console.log(process.argv.includes('--md') ? renderMarkdown(view) : renderHtml(view));
    return listings.length ? 0 : 20;
  }

  // Also to the log, so a run is fully readable from its own output.
  console.error(`\n${renderMarkdown(view)}\n`);

  await writeFile(REPORT_FILE, renderHtml(view), 'utf8');
  await writeFile(
    STATE_FILE,
    `${JSON.stringify({ updatedAt: new Date().toISOString(), seen: listings.map((l) => l.id) }, null, 2)}\n`,
    'utf8',
  );
  if (process.env.GITHUB_STEP_SUMMARY) {
    await writeFile(process.env.GITHUB_STEP_SUMMARY, `${renderMarkdown(view)}\n`, { flag: 'a' });
  }
  if (process.env.GITHUB_OUTPUT) {
    await writeFile(process.env.GITHUB_OUTPUT, `total=${listings.length}\nnew=${newCount}\n`, {
      flag: 'a',
    });
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
