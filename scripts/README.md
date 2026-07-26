# Gedera daily listings

Aggregates **5–6 room apartments and houses for sale in Gedera** from several
listing boards into one daily digest, with a direct link to every property.

- `gedera-scan.mjs` — drives the boards and renders the digest.
- `lib/extract.mjs` — locates listings in a rendered page.
- `probe-sources.mjs` / `render-probe.mjs` — diagnostics for adding a board.
- `../.github/workflows/gedera-daily.yml` — runs it daily at 08:07 Israel time.

## Reading a run

Each run publishes the digest three ways, so no setup is needed to read it:
the **job summary** on the run page, the **`gedera-report` artifact**, and the
**run log**. Email is sent only if the mail secrets below exist.

## Delivery: Telegram (simplest)

Two secrets, no 2FA or app password:

1. Message [@BotFather](https://t.me/BotFather) on Telegram, send `/newbot`,
   follow the prompts, and copy the token it gives you.
2. Send your new bot any message (a bot cannot start a chat with you), then
   open `https://api.telegram.org/bot<TOKEN>/getUpdates` and copy
   `result[0].message.chat.id`.

Add them under **Settings → Secrets and variables → Actions**:

| Secret | Value |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | The token from BotFather |
| `TELEGRAM_CHAT_ID` | Your chat id |

Messages are sent only when there is something new, and are split across
several messages rather than truncated if the digest exceeds Telegram's 4096
character limit.

**Delivery happens before listings are recorded as sent.** If Telegram fails,
the state file is left unchanged and the job fails loudly, so the listings are
still new on the next run rather than silently lost.

## Optional: email delivery

Add these repository secrets under **Settings → Secrets and variables →
Actions**. Without them the email step is skipped and everything else still
works.

| Secret | Value |
| --- | --- |
| `MAIL_USERNAME` | The Gmail address that sends the mail |
| `MAIL_PASSWORD` | A Gmail [app password](https://myaccount.google.com/apppasswords) — *not* the account password |
| `MAIL_TO` | Where the digest is delivered |

## Running locally

```bash
npm ci && npx playwright install chromium
node scripts/gedera-scan.mjs --dry --md   # print the digest as a table
node scripts/gedera-scan.mjs              # write report + state
```

Exit code `20` means the scan succeeded but matched no listings.

## Sources

Every board renders its listings client-side, so pages are driven in Chromium
rather than fetched — plain HTTP returns no listings from any of them.

| Board | Status |
| --- | --- |
| `komo.co.il` | Working — the current source of results |
| `ad.co.il` | Reachable, returns nothing; listings not triggered by scrolling yet |
| `onmap.co.il` | Reachable, returns nothing; same |
| `anglo-saxon.co.il` | Reachable; the Gedera search URL is unverified |

**Not covered:** Yad2, Madlan and Homeless answer this runner with an anti-bot
challenge (Radware Bot Manager and Cloudflare) because the requests come from
a datacenter IP. Getting past that needs residential proxies or CAPTCHA
solving, which this project does not do. The same code run from a home IP
would reach them. Facebook groups are also out: reading them requires an
authenticated account, and the Graph API has not exposed group posts since
2020.

Adding a board is one entry in `BOARDS`. Use `probe-sources.mjs` to check that
a candidate answers at all, then `render-probe.mjs` to see how it structures
listings once rendered.

## How extraction works

Extraction keys on content rather than CSS selectors: a card is the innermost
element stating a room count, and the listing link is the nearest anchor found
by climbing from it. This works unchanged across boards and survives the
hashed CSS-module class names they ship (`title___2JZH2`), which change between
deploys.

Guards worth knowing, each added after it went wrong in a live run:

- Filter chips, headings and nav also state room counts, so they are excluded
  and a listing must additionally quote a price or link to a numbered ad page.
- Every row must resolve to its own listing URL; anything else is dropped and
  counted, so a regression is visible rather than a silently shorter digest.
- A board gets a second attempt with a longer timeout before being reported as
  failed — one slow response used to cost the entire digest.
- A failing board is named in the digest instead of reading as "no listings".
