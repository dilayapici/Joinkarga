# HackMeridian starting point and event-progress record

**Status: incomplete — team confirmation required.** This document separates the observed collaboration history from actual work during the event. It does not establish when the event began. Do not backdate evidence or infer the event window from local file timestamps.

## Event and submission details

| Field | Team-confirmed value |
| --- | --- |
| Event start / prior-work cutoff, including timezone | **TEAM TO CONFIRM** |
| Submission deadline, including timezone | **TEAM TO CONFIRM** |
| Selected track and actual brief | **TEAM TO CONFIRM** |
| Team members and roles | **TEAM TO CONFIRM** |
| Source repository URL | [https://github.com/dilayapici/Joinkarga](https://github.com/dilayapici/Joinkarga) — push/access verification pending |
| Starting commit/tag or equivalent baseline evidence | **TEAM TO ADD** |
| 2–4 minute YouTube/Vimeo video URL | **TEAM TO ADD** |
| Final pitch-deck file | [HTML draft](KARGA-PITCH-DECK.html) — complete marked fields before submission |

## Starting point: before the event

The owner supplied the Karga idea and product requirements. When Codex first inspected the supplied workspace, it was empty. No existing Next.js files or official logo were available there. This is a workspace observation, not a declaration that there was no pre-event project.

**TEAM TO COMPLETE:** Describe every relevant pre-event contribution, including prototypes, source code, designs, regional-activation work, assets, users and traction outside this folder. State which features below existed at the actual cutoff. If there was no prior implementation, explicitly confirm that statement rather than assuming it from the empty folder.

## Observed development areas — classify against the cutoff

All areas below are implemented in the current codebase. Their event classification is still unknown. Source-file presence establishes implementation location, not event timing or live success.

| Development area | Source evidence | Pre-event starting behavior | New work delivered during HackMeridian | Actual date/time, author and commit/demo evidence |
| --- | --- | --- | --- | --- |
| Initial sustainability UI, eco-actions and leaderboard | [page](../app/page.tsx), [actions](../lib/domain.ts), [schema](../scripts/schema.sql) | **TEAM TO CONFIRM** | **TEAM TO CONFIRM** | **TEAM TO ADD** |
| Email/password accounts and persistent sessions | [account UI](../app/components/account-panel.tsx), [server](../lib/server.ts), [crypto](../lib/security.ts) | **TEAM TO CONFIRM** | **TEAM TO CONFIRM** | **TEAM TO ADD** |
| Background Testnet-wallet activation and earned reward claims | [wallet jobs](../lib/wallets.ts), [payments](../app/api/karga/route.ts), [reconciliation](../lib/reconcile-reward.ts) | **TEAM TO CONFIRM** | **TEAM TO CONFIRM** | **TEAM TO ADD** |
| Journey-first calculator and automatic flight estimates | [calculator](../app/components/journey-calculator.tsx), [flight model](../lib/flight.ts), [route API](../app/api/journey/route.ts) | **TEAM TO CONFIRM** | **TEAM TO CONFIRM** | **TEAM TO ADD** |
| English-only carbon passport and visual breakdown | [passport](../app/components/carbon-passport.tsx), [passport styles](../app/components/carbon-passport.css) | **TEAM TO CONFIRM** | **TEAM TO CONFIRM** | **TEAM TO ADD** |
| Organizer dashboard, QR verification, participant search and payment monitoring | [dashboard](../app/admin/page.tsx), [admin API](../app/api/admin/route.ts) | **TEAM TO CONFIRM** | **TEAM TO CONFIRM** | **TEAM TO ADD** |
| Local origin handling, dashboard query corrections and diagnostic helpers | [origin policy](../lib/request-origin.ts), [admin API](../app/api/admin/route.ts), [diagnostic](../scripts/admin-diagnostic.mjs) | **TEAM TO CONFIRM** | **TEAM TO CONFIRM** | **TEAM TO ADD** |
| Guided UX, sign-in draft preservation and one-time local organizer handoff | [page](../app/page.tsx), [draft handling](../lib/journey-draft.ts), [handoff policy](../lib/admin-handoff.ts), [CLI](../scripts/open-admin.mjs) | **TEAM TO CONFIRM** | **TEAM TO CONFIRM** | **TEAM TO ADD** |
| Tests, integrity disclosures, demo-script draft and HTML deck | [tests](../lib), [README](../README.md), [script](DEMO-SCRIPT.md), [deck](KARGA-PITCH-DECK.html) | **TEAM TO CONFIRM** | **TEAM TO CONFIRM** | **TEAM TO ADD** |

## Event milestone evidence

Add one row for each actual event milestone. Include a before/after example and evidence a judge can inspect. A commit created now records the current snapshot; it does not retroactively prove earlier event progress.

| Actual date/time + timezone | Before | Delivered during the event | Human contributor(s) | Meaningful AI assistance | Verifiable evidence |
| --- | --- | --- | --- | --- | --- |
| **TEAM TO ADD** | | | | | |

## AI attribution to retain

OpenAI Codex meaningfully generated/revised application code, APIs, database schema, Stellar/authentication helpers, CSS artwork and visualizations, tests, CLI tools and documentation, including the submission artifacts. The owner supplied the idea, requirements and iterative direction. Add other tools and external contributions if used. Do not attribute unobserved work to Claude simply because a Claude prompt was prepared.

## Matching statement for README and demo

Replace the bracketed fields with verified facts:

> Before HackMeridian, Karga already had [confirmed starting point, including work elsewhere]. During HackMeridian, we delivered [specific new work]. The before/after evidence is [commits, screenshots or other evidence]. We used OpenAI Codex meaningfully for [actual contributions], under the team's direction and review. [Disclose any additional tools or assets.]

Do not record that statement with unfinished fields, and do not call an unconfirmed feature event work.
