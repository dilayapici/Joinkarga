# Karga

An English-language event sustainability app built with Next.js, PostgreSQL, organizer QR verification, email/password participant accounts, and real Stellar **Testnet** transactions. Points stay in PostgreSQL. No NFTs or collectible tokens.

## HackMeridian submission

**Submission status: draft — event baseline and required links still need team confirmation.** Existing code is allowed under the supplied rules, but prior work must be disclosed. Do not submit this draft as a completed event-progress declaration.

### Required links and files

| Required item | Current artifact or link | Status |
| --- | --- | --- |
| Source repository URL | [dilayapici/Joinkarga](https://github.com/dilayapici/Joinkarga) | Destination supplied by the owner; source push and judge access are not yet verified. |
| Demo video URL | **TEAM TO ADD: YouTube or Vimeo URL** | Record a 2–4 minute video. A recording outline is available in [the demo script](docs/DEMO-SCRIPT.md); the script is not a video submission. |
| Pitch deck file | [Karga pitch deck — HTML draft](docs/KARGA-PITCH-DECK.html) | An actual self-contained HTML deck is included. Complete its marked team/timeline/link fields before submission. Allowed formats: PDF, PPTX, PPT or HTML, up to 20 MiB. |
| Optional live app | **NOT YET VERIFIED: deployed URL** | Do not describe localhost as a publicly accessible deployed app. |

### Prior work and starting point

Karga's concept and product requirements were supplied by the project owner. At the first inspection of this supplied workspace, the directory was empty: no existing Next.js source or official Karga logo was available there. **This observation does not establish that Karga had no earlier work elsewhere, or that the code was created during HackMeridian.** The owner must include any earlier prototype, design, code, regional-activation work, users or traction that applies.

The actual HackMeridian start/cutoff, starting commit and classification of individual features as pre-event or event work have not been supplied. The following must be completed by the team before submission:

- Actual event start / prior-work cutoff, with timezone: **TEAM TO CONFIRM**.
- What existed before that cutoff, including work outside this checkout: **TEAM TO CONFIRM**.
- Starting repository commit/tag, screenshots or other baseline evidence: **TEAM TO ADD**.
- New features/fixes delivered during HackMeridian, with evidence: **TEAM TO CONFIRM** in [the progress record](docs/HACKATHON-PROGRESS.md).

### Implementation record and event progress

The documented development sequence in this collaboration is: initial sustainability MVP → email accounts and background Testnet-wallet jobs → journey-first inputs and automatic flight estimates → carbon passport and English-only UI → organizer dashboard and login/query fixes → participant UX refinement and local single-use organizer sign-in. This is a collaboration sequence, **not a verified event timeline**. Features cannot be labeled as new HackMeridian work until the team confirms when they were delivered relative to the cutoff.

The progress record links these areas to actual source files and asks the team to classify the baseline, event delta and evidence. Record real commits, screenshots, test output or transaction links. Do not backdate commits, infer event work from filesystem timestamps, or describe a template as proof of event progress. Use the same confirmed before/after account in both the README and demo.

### AI attribution

**Tool used: OpenAI Codex.** Codex meaningfully generated and revised the Next.js/React application, API routes, PostgreSQL schema, Stellar integration and retry logic, authentication/security helpers, responsive CSS and code-native artwork/visualizations, carbon passport, tests, CLI setup/diagnostic helpers, README and submission documents, demo-script draft, and HTML pitch-deck draft. The project owner supplied the concept, requirements and iterative feedback. Human review and validation remain necessary.

No AI-generated raster images or official logo were supplied in this checkout; the app uses a temporary typographic Karga wordmark and code-native visuals. Add any other AI tools, imported assets, templates or prior code the team used outside this conversation. The same material AI assistance should be acknowledged in the submission, demo and deck. Under the supplied rules, attribution is required; separate permission to use AI is not requested.

### Evidence and current limits

The most recent recorded development run passed **35 automated tests, TypeScript checking and the production build**. This is not proof of a working live signup, camera scan, browser handoff or on-chain payout. The owner reported successful Neon schema setup; this execution environment could not independently verify the live database or payment flow. The owner supplied the Joinkarga repository URL; its uploaded contents and judge access have not been verified here. No public deployment or demo-video URL has been verified. Carbon figures are estimates, and Testnet XLM has no monetary value.

Before submitting, complete [the integrity checklist](docs/SUBMISSION-CHECKLIST.md), [progress record](docs/HACKATHON-PROGRESS.md), [demo script](docs/DEMO-SCRIPT.md) and marked fields in the deck. Keep prior-work and AI disclosures consistent across all artifacts.

## Start locally

```sh
npm install
cp .env.example .env.local
```

Configure `.env.local` locally; never paste secret values into chat or commit the file:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL owner connection string, preferably pooled with TLS (Neon, Supabase, or another provider). |
| `ORGANIZER_PASSWORD` | Random password of at least 16 characters for action verification. |
| `STELLAR_SECRET_KEY` | Secret seed of a funded **Testnet-only** treasury. Never use a Mainnet seed. |
| `WALLET_ENCRYPTION_KEY` | 32 cryptographically random bytes encoded as 64 hex characters. Encrypts participant wallet seeds at rest. Back it up and keep it stable. |
| `CRON_SECRET` | Random secret of at least 32 characters protecting background retries. |

Create and fund the treasury using [Stellar Laboratory](https://lab.stellar.org/) and Testnet Friendbot. Never prefix any of these variables with `NEXT_PUBLIC_`.

Generate encryption and cron secrets privately with Node's `crypto.randomBytes`. Do not log, share, or commit them. Changing the encryption key without migrating stored seeds makes existing custodial wallets inaccessible.

```sh
npm run db:setup
npm run dev
```

Open **http://localhost:3000**. Node.js 20.9+ is required. `db:setup` is an idempotent schema migration, including upgrades from the previous anonymous-participant version. It does not delete existing points or participants. Use a database owner/backend role with RLS bypass. Public and Supabase API-role access is revoked.

Without `DATABASE_URL`, the page explicitly shows preview mode, and signup is unavailable. There is no fake local signup or fabricated transaction. A real database is necessary for persistent participants and unique email accounts. If the database is available but Stellar settings are missing, registration still succeeds and wallet activation waits for configuration.

## Participant flow

1. Choose **Create my account** or use **Sign in** in the header. Enter a display name, email and password (at least 10 characters).
2. Signup saves a unique, normalized email account and a durable wallet job in one PostgreSQL transaction. Passwords use salted scrypt hashes. Email addresses are private and never shown on the leaderboard.
3. An HttpOnly, Secure-in-production, SameSite session cookie signs in the participant. Only hashed session tokens are stored; sessions expire after 30 days. Returning participants can sign in on another device. Sign out revokes the current session.
4. After the signup response, Next.js `after()` processes the wallet job in the background. A dedicated participant keypair is generated on the server; its secret is AES-256-GCM encrypted in the database. The Testnet treasury submits a `createAccount` operation that funds the wallet with **2 Testnet XLM**. No email, display name, or other personal information goes on-chain.
5. The dashboard polls for activation and shows the public wallet address, pending/confirmed state and explorer link. It does not claim success until Horizon confirms success. The participant can safely retry activation.
6. Complete eco actions and show the QR to an organizer. The organizer witnesses the action and scans the code (manual entry is supported). The database allows each action and its points once per participant.
7. At 100 verified points, claim **1 Testnet XLM** directly to the participant's Karga wallet without pasting an address. An optional existing Testnet wallet can be used instead. The three actions total 105 points.

Testnet XLM has no monetary value. Wallet activation is a network account-creation transaction, separate from earned eco rewards. Karga manages these demo wallets; there is currently no wallet withdrawal UI, password recovery, or email ownership verification. Registration identifies accounts by email/password but does not assert that the email address was verified. Add verified email, recovery, and stronger anti-abuse controls before a public launch with valuable rewards.

## Background recovery and duplicate prevention

The wallet queue is persisted in `wallet_jobs`. Signup/login kicks off processing with Next.js `after()`. While a signed-in participant's wallet is pending, dashboard polling also schedules due jobs. The activation button requests a safe retry. `vercel.json` provides a daily scheduled retry compatible with Vercel Hobby scheduling. For faster unattended recovery, configure a more frequent scheduler on a suitable Vercel plan.

The scheduled endpoint is `GET /api/cron/wallets`, requiring `Authorization: Bearer <CRON_SECRET>`. Vercel automatically sends this header when `CRON_SECRET` is configured. Missing/invalid authorization receives 401. It processes a small ordered batch; already-signed pending jobs are processed before new jobs. Configure more frequent scheduling for larger events.

Wallets and rewards share a PostgreSQL advisory lock for treasury sequence allocation. Signed transaction XDR, destination and hash are committed **before** submission. Pending signed transactions block new allocations until reconciled. Retries submit the exact same XDR, so ambiguous network responses cannot produce a second payment or a second wallet. Unique participant, email, wallet and transaction constraints provide further protection. Never delete a pending job to retry it, reset the Testnet treasury independently, or use the treasury for outside transactions while jobs are pending.

A permanently failed signed transaction (for example after a Testnet reset or external treasury sequence changes) requires organizer reconciliation; the system deliberately does not generate a replacement automatically. Keep the treasury funded and exclusive to Karga. This single-treasury queue favors duplicate prevention over payout throughput.

Authentication attempts use persistent 15-minute database limits by email and Vercel-provided client IP, with a shared local-development IP bucket. Organizer verification is password protected and rate limited. API mutations check request origin. Neither seeds, password hashes, signed XDR, nor session hashes are returned to the browser. Database/network provider errors are sanitized.

## Deploy to Vercel

1. Push the project to Git and import it as a Next.js project in Vercel.
2. Set all five environment variables in Vercel. Use separate databases and Testnet treasuries for preview deployments.
3. Run `npm run db:setup` from a trusted local environment against the target database. Schema changes are intentionally separate from the build.
4. Deploy with the default Next.js settings and `npm run build`.
5. Test signup → wallet confirmation → sign out/in → QR verification → leaderboard → reward confirmation on HTTPS.

The app uses HTTPS camera access on deployed sites. Localhost cameras also work. If unavailable, use the manual QR code field.

## Development checks

```sh
npm test
npx tsc --noEmit
npm run build
```

Tests cover calculator math, reward thresholds, salted password verification and wallet encryption/tamper detection, and signed Testnet wallet-creation transaction serialization/retries. Database integration, concurrent job recovery, camera scanning, actual Testnet transactions and deployed cron execution require configured external services and end-to-end verification.

This is a single-event MVP with three once-per-participant actions. Carbon coefficients are illustrative demo assumptions, disclosed in the calculator, and not a certified inventory. The original supplied workspace contained no logo; the UI uses a temporary Karga wordmark.

## Journey-based carbon calculation

The calculator starts with **From** and **To**, transport mode, and an optional return trip. No event selection or manual kilometer field is required. Flights estimate distance automatically from city names; ground routes may be saved with a pending footprint until their distance can be resolved. Cups and bottles are optional extras, defaulting to zero.

The signed-in participant's latest route, mode, one-way distance, return-trip flag, consumables and computed total are persisted in `footprints` and restored on login/reload. The estimate shows separate transport and consumable emissions. Return trips double transport distance only. Route information is returned only to its owner, is absent from the public leaderboard, and is never included in Stellar transactions. Legacy estimates are preserved with nullable route fields.

Run `npm run db:setup` again to add the route columns before using the updated API. Database-backed route saving still needs `DATABASE_URL`. Automated checks cover route validation, explicit distance, and return-trip accounting.

### Simplified travel form

The travel dropdown now includes **Plane / Uçak** and no longer asks participants to enter one-way kilometers. Routes can be saved with no distance. Until automated distance estimation and a documented aviation factor are integrated, unavailable transport emissions and total footprints are shown as pending (`—`), never as zero. Cups/bottles remain a separate subtotal. Previously saved ground journeys with known distances retain their estimates; editing their endpoints or travel mode clears the old distance. Run `npm run db:setup` to allow unknown totals to be saved as SQL NULL.

### Automatic flight estimates

Selecting Plane now resolves the departure and arrival cities automatically after typing stops (600 ms debounce), then estimates direct city-center great-circle distance with the haversine formula. No kilometer field, account, database, or API key is needed for the preview. Approximate city-center coordinates for Istanbul and Lisbon (including İstanbul/Lisboa aliases) are bundled for a reliable offline demo. Other city names use [Open-Meteo geocoding / GeoNames](https://open-meteo.com/en/docs/geocoding-api) with a timeout and cached lookup. The UI shows the resolved cities/countries; add a country qualifier to disambiguate names. Unknown places and provider failures show an error instead of a fabricated result. Entered location queries may be sent to that provider; routes remain absent from the leaderboard and blockchain.

Flight factors come from the [NZ Ministry for the Environment Measuring Emissions Catalogue 2026, Table 7.29](https://measuringemissionsguide.environment.govt.nz/7_travel.html#international-air-travel), using DESNZ 2025 data: average passenger, 0.12786 kg CO₂e/passenger-km for one-way distances below 3,700 km and 0.15282 at/above that threshold. The factors already include the distance uplift and radiative-forcing assumptions, so these are not multiplied again. Classification uses the one-way distance; the return checkbox doubles travel emissions, not consumables. This simplified city-center direct-flight approximation is not an airport itinerary, cabin-specific calculation, certified inventory, or measured reduction. Domestic and connecting flights are not modeled separately.

The browser cancels stale requests when endpoints/mode change. Saving a Plane journey resolves its route again on the server instead of trusting client-submitted kilometers. The existing route columns suffice; no new migration is needed beyond the previously documented schema. Automatic distance for ground transport remains unimplemented. Earlier documentation describing flight estimates as pending/manual reflects the earlier implementation and is superseded by this section.

## Connect Neon from your Mac without sharing credentials

If the installed Neon integration is not available to the current chat, create/open a Karga project in the Neon console. Click Connect and copy the PostgreSQL URL or Neon’s complete `psql` command to your clipboard. In your Mac's Terminal run:

```sh
cd /Users/dilayapici/karga
npm run db:connect
```

The helper prompts you to copy the URL after starting, reads the macOS clipboard without putting credentials in shell history, enforces TLS, and applies `scripts/schema.sql`, and checks that participant/session/wallet-job rows can be inserted and joined. The test transaction is rolled back, leaving no fake participant or on-chain wallet. Only after those checks pass is `DATABASE_URL` written to git-ignored `.env.local` with owner-only permissions, preserving other settings. Existing Neon infrastructure is required; the helper does not create a Neon project or use a plugin login as a database credential.

Restart `npm run dev` and verify signup in the browser. The storage check is not an end-to-end HTTP/cookie signup test, and it does not verify Stellar activation. Do not paste the connection string into chat. Clipboard contents may remain in your clipboard manager until you clear them.

## Carbon passport

Open **Carbon passport** from the sidebar/mobile navigation, the Overview shortcut, or the calculator. The English-only experience includes a personal passport cover, schematic origin-to-destination journey, estimated footprint, interactive emissions breakdown, verified-action stamps, and earned reward progress. It uses existing participant, journey, verification and reward data; no extra database migration is needed. Routes are shown as a schematic, not an actual geographic map. The passport summarizes the latest journey, not lifetime travel or a certified carbon inventory.

Without a journey, use **Preview a journey** to calculate an Istanbul → Lisbon example using the existing flight resolver. The example is a draft and creates no points, saved journey, or transaction. Missing transport estimates stay pending; unknown totals do not turn into zero or a misleading complete breakdown. Stamps and points use organizer-verified database records, and a received reward is shown only when its stored transaction is confirmed.

**Save as PDF** opens the browser print dialog with passport-specific print styles. A saved PDF can include the holder name and route, disclosed before export. There is no public passport URL, new token, NFT, or on-chain personal data. The language switch and Turkish UI translations have been removed; names and geographic place names remain user-provided.

## One-command Stellar Testnet setup

Once Neon is connected, run `npm run wallet:setup` in your Mac's Terminal. It validates the database, generates missing Testnet treasury/encryption/cron credentials privately in `.env.local` (owner-only permissions), and funds a new treasury through [Stellar Friendbot](https://github.com/stellar/friendbot). Only its public address is sent to Friendbot. Existing keys and the database URL are preserved, and keys are saved before any funding request, so retries reuse the same account. It refuses to replace a missing encryption key when encrypted participant wallets already exist.

After it reports a confirmed funded treasury, restart the dev server, sign in, and click **Retry activation**. Pending wallets are also picked up by polling/background processing. This setup does not award points or fabricate participant wallet confirmations. Testnet XLM has no monetary value. Network errors require rerunning the command; it does not print credentials. Wallets now show a waiting-for-setup state when the Testnet secret or encryption configuration is missing, instead of an indefinite activation spinner.

## Organizer admin dashboard

Open **/admin** or choose **Admin dashboard** from the participant sidebar/Organizer space. The English-only responsive dashboard includes:

- Overview metrics, seven-day UTC signup chart, journey mode/estimated-emissions chart, verification queue and service-configuration status.
- Server-side participant name/email search with 20-row pagination and private account details: verified points, action count, journey-recorded status, latest footprint estimate and public wallet address.
- Camera QR scanning, manual verification-code entry and pending-action cards. Each verification requires an explicit witnessed-action attestation. An atomic `verified_at is null` update prevents awarding points twice.
- Wallet activation and earned-payment monitoring, explorer links, pending-job retry, and reconciliation of **existing** reward claims. It cannot create claims on a participant's behalf. Reconciliation checks the stored Testnet transaction hash and only resends the identical signed XDR when Horizon reports it missing; failed or uncertain lookup responses do not trigger a replacement payment.

If no organizer password is configured, run `npm run admin:setup` in your Mac's Terminal. It creates a random password only when one is missing, saves it privately in `.env.local`, and copies it to your clipboard without printing it. Existing passwords/settings are preserved. Restart Karga and paste the password at `/admin`. Save it in your password manager. The same password works in the original Organizer space. On other systems, set a random `ORGANIZER_PASSWORD` of at least 16 characters privately in the environment.

Organizer authentication uses an HttpOnly, SameSite=Strict cookie (Secure in production), HMAC-authenticated with a dedicated admin purpose, expiring after four hours. Changing `ORGANIZER_PASSWORD` invalidates existing admin cookies. Sign-out clears the browser cookie. Every dashboard read/mutation is authorized server-side; a normal participant session grants no admin access. Login attempts are limited through PostgreSQL, mutations require matching Origin, and responses are private/no-store. The MVP uses one shared organizer password rather than individual staff roles.

The admin API selects explicit safe fields. It does not return seeds, encrypted secrets, signed XDR, password hashes or session tokens. Exact From/To location labels remain absent from admin responses; mode analytics are aggregated. Authorized organizers can view participant emails, account activity and latest estimated footprint, so access should be limited to event staff. The participant passport remains a private record; the dashboard adds no public route sharing.

Activity lists are capped at the latest 50 requests/jobs, pending first. Overview counts reflect the whole database; participant search has independent pagination. Refresh is manual or every 20 seconds while authenticated. Wallet retry queues a background job; it is not a payment confirmation. Stellar setup is needed for new wallet activations, and cron configuration only reports whether the secret is present, not proof that the deployed scheduler ran. No additional database migration is required beyond the existing schema.

Validation includes admin-session expiry/tampering/secret-rotation tests and reward replay/outage/tamper tests. Live database queries, camera access, mobile/browser layout, organizer login/cookies and actual Testnet reconciliation still require integration checks in a network-enabled running environment.

### Diagnose and open the admin dashboard

Keep the dev server running in one Terminal window. In a second Terminal run `npm run admin:open`. The command loads the same development environment precedence as Next.js, finds Karga on local ports 3000–3005, tests the configured organizer password against the live API, checks the issued session and authenticated dashboard query response, then requests a development-only, single-use browser handoff and opens the correct URL. When a handoff is available, no password paste is needed; unsupported server versions fall back to the checked password/clipboard flow. It only sends credentials to loopback URLs constructed by the helper; it never prints passwords, cookies or dashboard personal data. It does not reset the password, bypass authentication or clear login-attempt limits.

The command distinguishes a missing server, server configuration that needs restarting, password mismatch, rate limiting, unavailable database, missing session cookie and failed dashboard data queries. Share only its diagnostic code/message if asking for help. Its HTTP sign-in consumes one normal login attempt. Tests use simulated server responses; a live browser/network check is still required.

### Localhost origin handling

Next.js normalizes loopback request URLs such as `127.0.0.1` to `localhost`. The admin diagnostic now sends requests to `localhost` consistently. All mutation endpoints share an origin check that recognizes loopback aliases only in development while still requiring the same protocol and port. Production origin matching stays exact. Regression tests reproduce NextRequest normalization and reject cross-site, different-port, malformed and opaque origins. Admin diagnostics now distinguish HTTP 403 origin rejection from password rejection and include a safe status code for unexpected failures.

Dashboard read failures now report only a safe query label and allowlisted database error code (for example, missing-table `42P01` or missing-column `42703`), not raw provider messages, SQL text, credentials or participant data. The `admin:open` command includes those labels/codes in its diagnostic output. Run `npm run db:setup` to apply the current schema while preserving existing rows. Schema setup is transactional; failures roll back the schema update and print a sanitized error code.

The registration-history query uses explicit quoted `AS "day"` / `AS "count"` output aliases and positional grouping. PostgreSQL requires `AS` for `day` as a column label; the earlier bare alias produced SQLSTATE `42601`. This fix changes only the dashboard query, requires no schema migration, and preserves participant records. Confirm it against the running database with `npm run admin:open`.

## UX refinement: participant flow and local organizer sign-in

The English-only participant experience now guides users through account → journey → verified actions → reward, with a contextual next action and explicit progress. The overview explains 0 KP, pending QR approval and the distinction between a saved journey and a draft. Signing in preserves an entered journey without overwriting the participant's saved route; it requires an explicit Save action afterward. Account creation now commits the participant, wallet job and initial session together. A failed dashboard refresh after a successful mutation does not tell the participant that their account or action failed.

Account forms retain input on error, offer password visibility, show clear service-availability states and allow a connection retry. Modals trap keyboard focus, support Escape, and restore focus when closed. The calculator keeps automatic flight estimates and no kilometer field, shows matched cities and retryable errors, and puts assumptions behind an expandable explanation. Ground-mode estimates remain pending when distance is unavailable. Optional cups/bottles remain separate. The rewards screen distinguishes an account, a pending wallet, an earned claim and an on-chain confirmation. It keeps existing-wallet entry optional and explains Testnet value and safe claim retries. Rechecking an existing reward uses the persisted destination rather than requiring the participant to reenter it.

Verified-action/leaderboard data continues refreshing after wallet activation (and on focus), so a different device's organizer approval can appear without manually reloading. This does not auto-verify anything. Both organizer verification paths require explicit witnessed-action attestation. No new points, offsets, carbon credits, NFT assets or fabricated activity were introduced. The existing passport, charts, private route handling and PDF export are retained. Responsive typography, spacing, navigation, action states, wallet states and loading/error messages were refined.

### One-time local browser sign-in

After `npm run admin:open` verifies the configured password, session and dashboard data, it can request a two-minute single-use browser handoff. The existing authenticated organizer session is required to issue it. Only a purpose-bound HMAC digest is stored, in the existing private `auth_attempts` table. Exchange atomically deletes the unexpired record before issuing a standard organizer cookie. Password rotation invalidates outstanding handoffs. The code is passed in the URL fragment, never printed, and removed from browser history before exchange; it is not placed in server query/access logs. Do not share sign-in links.

Handoff issue/exchange endpoints require matching loopback origins in **development only**, and are unavailable in production. They do not bypass the organizer-password check, change credentials, clear login limits, or permit ordinary participants to access admin data. Production and unsupported local-server versions retain the normal password flow. No migration beyond the existing schema is required. `admin:setup` is still needed once if no organizer password exists.

Validation: unit checks cover next-action thresholds, preserving a journey through sign-in, local-only handoff authorization and hashed token storage, and diagnostic handling; existing origin/session/reward replay/crypto/calculator tests remain. Live Neon access returns ENOTFOUND from this execution environment. Browser-control tools are unavailable here, so mobile layout, keyboard behavior, actual browser handoff/replay/expiry, camera scanning, signup cookies and Testnet payment confirmation still need end-to-end checks on the running app. No deployment was performed.
