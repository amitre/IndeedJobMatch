#!/usr/bin/env node
/**
 * Renders each reachable board in a real browser and reports how its listings
 * are structured once JavaScript has run. Plain HTTP returns no listings from
 * any of these boards, so the extractors have to be written against the
 * rendered DOM - this reports what that DOM actually looks like.
 *
 *   node scripts/render-probe.mjs
 */

import { chromium } from 'playwright';

const BOARDS = [
  ['ad.co.il', 'https://www.ad.co.il/nadlansale?sp3=256'],
  ['komo.co.il', 'https://www.komo.co.il/code/nadlan/apartments-for-sale.asp?cityName=%D7%92%D7%93%D7%A8%D7%94&fromRooms=5'],
  ['onmap', 'https://www.onmap.co.il/homes/buy/gedera/rooms_5'],
  ['nadlanmaster', 'https://www.nadlanmaster.co.il/%D7%92%D7%93%D7%A8%D7%94/'],
  ['anglo-saxon', 'https://www.anglo-saxon.co.il/'],
];

/**
 * Runs inside the page. Finds the smallest elements that state a room count -
 * those are the listing cards - and reports each one's shape plus the link it
 * sits in, which is what an extractor needs to key on.
 */
function describeListings() {
  const ROOMS = /(\d+(?:\.\d)?)\s*חדרים/;
  const out = [];
  for (const el of document.querySelectorAll('*')) {
    const text = el.textContent ?? '';
    if (!ROOMS.test(text) || text.length > 400) continue;
    // Keep only the innermost element still holding the whole card.
    if ([...el.children].some((c) => ROOMS.test(c.textContent ?? ''))) continue;

    const anchor = el.closest('a') ?? el.querySelector('a') ?? el.parentElement?.closest('a');
    out.push({
      tag: el.tagName.toLowerCase(),
      cls: (el.className || '').toString().slice(0, 80),
      href: anchor?.getAttribute('href') ?? null,
      text: text.replace(/\s+/g, ' ').trim().slice(0, 180),
    });
    if (out.length >= 6) break;
  }
  return { total: document.querySelectorAll('a').length, cards: out };
}

const browser = await chromium.launch();

for (const [name, url] of BOARDS) {
  console.error(`\n===== ${name} =====`);
  const page = await browser.newPage({
    locale: 'he-IL',
    viewport: { width: 1400, height: 1000 },
  });
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    // These boards fetch listings after first paint; give the XHR time to land.
    await page.waitForLoadState('networkidle', { timeout: 25000 }).catch(() => {});
    await page.waitForTimeout(3000);

    const title = await page.title();
    const { total, cards } = await page.evaluate(describeListings);
    console.error(`  title: ${title}`);
    console.error(`  anchors on page: ${total}, listing-ish elements: ${cards.length}`);
    for (const [i, c] of cards.entries()) {
      console.error(`  [${i}] <${c.tag} class="${c.cls}"> href=${c.href}`);
      console.error(`      ${c.text}`);
    }
    if (!cards.length) {
      console.error('  no room counts in the rendered DOM either');
      console.error(`  body sample: ${(await page.evaluate(() => document.body.innerText))
        .replace(/\s+/g, ' ').slice(0, 300)}`);
    }
  } catch (err) {
    console.error(`  FAILED: ${err.message.split('\n')[0]}`);
  } finally {
    await page.close();
  }
}

await browser.close();
