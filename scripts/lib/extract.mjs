/**
 * Listing extraction that runs inside the rendered page.
 *
 * Every board here renders its listings client-side into different markup, so
 * rather than four bespoke selector sets this keys on the one thing they all
 * share: a card states a room count, and the link to the listing lives on or
 * near that card. Anchoring on content instead of class names also survives
 * the CSS-module hashes these boards ship (`title___2JZH2`), which change
 * between deploys.
 *
 * Exported as a plain function so it can be unit-tested against fixture DOMs
 * and passed to page.evaluate() unchanged.
 */
export function extractListings({ minRooms, maxRooms, requireCity }) {
  const ROOMS = /(\d+(?:\.\d)?)\s*חדרים/;
  const PRICE = /([\d,]{6,})\s*(?:₪|ש"ח|שח)|₪\s*([\d,]{6,})/;
  const SQM = /(\d{2,4})\s*מ["״']?ר/;
  const FLOOR = /קומה[:\s]*(\d{1,2})/;

  const num = (v) => {
    if (v == null) return undefined;
    const n = Number.parseFloat(String(v).replace(/[^\d.]/g, ''));
    return Number.isFinite(n) ? n : undefined;
  };

  /** A filter chip or heading states rooms but is not a listing. */
  const isControl = (el) => {
    if (el.closest('label,button,select,option,h1,h2,nav,header,form')) return true;
    const cls = `${el.className ?? ''}`.toLowerCase();
    return /filter|chip|tag|breadcrumb|facet/.test(cls);
  };

  const listings = [];
  const seenHref = new Set();

  for (const el of document.querySelectorAll('div,li,article,section,td,p,span')) {
    const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
    const roomsMatch = text.match(ROOMS);
    if (!roomsMatch || text.length > 600) continue;
    // Keep the innermost element that still states the room count.
    if ([...el.children].some((c) => ROOMS.test(c.textContent ?? ''))) continue;
    if (isControl(el)) continue;

    const rooms = num(roomsMatch[1]);
    if (rooms == null || rooms < minRooms || rooms > maxRooms) continue;

    // Climb until an ancestor carries both the listing link and enough detail
    // to be worth showing. Six levels covers every card layout seen so far.
    let node = el;
    let card = null;
    let anchor = null;
    for (let depth = 0; depth < 6 && node; depth++) {
      if (node.matches?.('a[href]')) {
        anchor = card = node;
        break;
      }
      const inner = node.querySelector?.('a[href]');
      if (inner) {
        anchor = inner;
        card = node;
        break;
      }
      // When the link is an ancestor, that ancestor is the card - the element
      // we started from holds only a fragment, without the price or the city.
      const outer = node.closest?.('a[href]');
      if (outer) {
        anchor = card = outer;
        break;
      }
      node = node.parentElement;
    }
    if (!anchor) continue;

    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) continue;

    const cardText = ((card ?? el).textContent ?? '').replace(/\s+/g, ' ').trim();
    // Boards whose URL is not already city-scoped return the whole country.
    if (requireCity && !cardText.includes(requireCity)) continue;

    const absolute = new URL(href, location.href).toString();
    if (seenHref.has(absolute)) continue;
    seenHref.add(absolute);

    const priceMatch = cardText.match(PRICE);

    // A real listing either quotes a price or links to a numbered ad page.
    // Navigation and hero links satisfy neither, which is how a board's own
    // "/search/homes/buy" link was being reported as a property.
    const hasAdId = /\d{4,}/.test(new URL(absolute).search + new URL(absolute).pathname);
    if (!priceMatch && !hasAdId) continue;

    listings.push({
      rooms,
      price: num(priceMatch?.[1] ?? priceMatch?.[2]),
      sqm: num(cardText.match(SQM)?.[1]),
      floor: cardText.match(FLOOR)?.[1],
      url: absolute,
      text: cardText.slice(0, 200),
    });
  }
  return listings;
}
