# Gedera daily listings scan

Scans Israeli real-estate boards each morning for **5–6 room apartments and
houses for sale in Gedera** and emails the results.

- `gedera-scan.mjs` — the scraper and HTML digest renderer (zero dependencies).
- `../.github/workflows/gedera-daily.yml` — runs it daily and sends the email.

## Setup

The workflow sends mail over Gmail SMTP. Add three repository secrets under
**Settings → Secrets and variables → Actions**:

| Secret | Value |
| --- | --- |
| `MAIL_USERNAME` | The Gmail address that sends the mail |
| `MAIL_PASSWORD` | A Gmail [app password](https://myaccount.google.com/apppasswords) — *not* the account password |
| `MAIL_TO` | Where the digest is delivered |

App passwords require 2-Step Verification to be enabled on the sending account.

Then trigger the workflow once by hand (**Actions → Gedera daily listings →
Run workflow**) to confirm the mail arrives before relying on the schedule.

## Running locally

```bash
node scripts/gedera-scan.mjs --dry        # print the HTML digest, leave state untouched
node scripts/gedera-scan.mjs --dry --md   # same, as a markdown table
node scripts/gedera-scan.mjs         # write gedera-report.html + .gedera-state.json
```

Exit code `20` means the scan succeeded but matched no listings — the workflow
treats that as a normal outcome, not a failure.

## How it works

Every row links to the listing's own page. A listing whose URL cannot be
resolved is dropped rather than shown as a dead-end row, and the number
dropped is reported in the digest — so a silent extractor regression shows up
instead of quietly shrinking the results. Links are validated and absolutised,
so a malformed or non-http value can never render as a broken link.

Both boards are queried in parallel and failures are isolated, so a broken
source degrades the digest instead of killing the run; the failing source is
named in the email. `.gedera-state.json` records the ids sent previously, which
is what lets the digest tag genuinely new listings with a *חדש* badge. The
workflow commits that file back to the branch after each run.

Filters live at the top of `gedera-scan.mjs`: `GEDERA` holds Yad2's location
ids and `MIN_ROOMS` / `MAX_ROOMS` set the room range.

## Maintenance

These boards are scraped, not consumed through a supported API, so payload
changes are expected over time. Listings are located by shape — any object
carrying both a room count and a price — rather than by a fixed path, so
moderate reshuffling is tolerated. If a source starts reporting `0 listings`
while the site clearly has matches, its response format has changed and the
extractor for that source needs updating.
