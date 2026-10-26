# HackMeridian submission readiness review

Based on the rules supplied by the project owner in this conversation. This is an internal readiness assessment, not an eligibility ruling or an official judging score. The supplied rules did not include the Genesis theme, detailed Scale ecosystem requirements, submission deadline, or full linked terms/privacy policy. Those remain unassessed.

## Outcome

The current code is a plausible sustainability MVP, but the submission is not ready. The strongest opportunity is the journey-first user flow plus an organizer-verified reward paid through Stellar. The main gaps are operational proof (database, Testnet and deployment), an evidenced event-progress timeline, a repository link, the demo video and finalization of the HTML pitch-deck draft.

Do not present a passing build, a generated transaction, or a mocked screen as proof of a successful live registration, verified action or payment.

## Eligibility and conduct

| Requirement from supplied rules | Status | Evidence needed from team |
| --- | --- | --- |
| Registered HackMeridian participant | Unknown | Confirm every team member is registered. |
| In person in Lisbon | Unknown | Confirm attendance; location cannot be established from project code or device timezone. |
| Team size 1–5 | Unknown | List members and roles; solo submission is allowed. |
| Age/guardian requirements | Unknown | Confirm each member meets the applicable requirement. The supplied wording includes an under-18 guardian exception and also describes the event as 18+; under-18 eligibility should be clarified with organizers. |
| Respectful, harassment-free, alcohol-free participation | Team responsibility | Follow the supplied conduct rules; software inspection cannot establish behavior. |
| Full terms, conduct and privacy policy | Not reviewed | Obtain and read the actual linked policies; URLs/content were not supplied. |

No guardian letter or other message has been sent on the team's behalf. If the under-18 exception applies, the supplied rules specify a guardian letter to stef@growwithguava.com with subject “Guardian Permission and Contact Information”, and restrictions on overnight stays.

## Integrity and required deliverables

| Requirement | Current evidence | Remaining action |
| --- | --- | --- |
| Disclose prior work | README now describes the observed workspace baseline and the code already present at this review. | Confirm the actual hackathon start/cutoff and identify which features existed before it. Include earlier Karga work outside this folder, if any. |
| Show event progress | Implementation exists locally; no published repository URL or event-baseline commit is confirmed. | Create a repository and record real milestones, commits, timestamps, before/after screenshots and demo evidence. Do not backdate history. |
| Attribute meaningful AI work | README contains an explicit Codex attribution. | Review and retain attribution in the final submission and deck; add any other tools used by the team. |
| Repository link | Owner supplied [https://github.com/dilayapici/Joinkarga](https://github.com/dilayapici/Joinkarga); source push/access unverified. | Publish source and setup instructions with secrets excluded; submit its URL. |
| 2–4 minute demo video | No video supplied. | Record the working flow, upload to YouTube or Vimeo, and submit a link judges can access. |
| Pitch deck | [Self-contained HTML draft](KARGA-PITCH-DECK.html) now exists. | Complete its team/timeline/link fields, review it, and verify the final file is at most 20 MiB. |
| Live website | No verified deployment URL found. | Strongly recommended for the demo; a website URL is not explicitly listed as mandatory in the supplied rules. |

## Rubric assessment

The weights below match the supplied rubric and total 100%. No numerical score is assigned because important runtime evidence and track-specific definitions are missing.

| Criterion | Weight | Evidence in Karga | Gap / strongest next action |
| --- | --- | --- | --- |
| Genesis thematic / Scale ecosystem alignment | 20% | Sustainability journey estimates and Stellar Testnet wallet creation/rewards are implemented in code. | Obtain the actual theme/ecosystem criteria. Demonstrate a confirmed earned reward. Do not assume sustainability automatically satisfies the Genesis theme. |
| Technical execution | 15% | Next.js, PostgreSQL schema, scrypt password hashing, session tokens, encrypted wallet seeds, QR verification, durable signed transaction jobs and unit tests. | Configure PostgreSQL and a funded Testnet treasury; run signup → restart/relogin → route save → verification → payout; capture explorer proof. Test replay and concurrent claims against the real database. |
| User value & problem | 20% | Journey origin/destination, automatic flight estimates and transport mode and a reward flow provide a concrete participant experience. | Interview a few participants and organizers. Establish why rewards change behavior and who funds them. Distinguish self-reported journey data from organizer verification. |
| Hackathon progress | 10% | Local features can be shown; no reliable event baseline/timeline was supplied. | Highest integrity risk: document what existed before the event and the exact new work completed during it. |
| Innovation | 15% | Low-friction wallet onboarding plus private route data and organizer verification form a coherent combination. | Gamified carbon calculators alone are familiar. Explain the distinctive behavior-change mechanism with a concrete user example and prototype evidence, without claiming unresearched uniqueness. |
| Market & ecosystem potential | 10% | Organizers and sponsors are a plausible customer/funder hypothesis. Stellar handles a payment rather than storing points. | Validate a pilot partner, payout budget, sponsor incentive and a path beyond Testnet. No users, revenue or partnerships are verified. |
| Product design & UX | 10% | Responsive nature-inspired English-only UI, guided signup/journey/actions/reward flow, carbon passport, QR fallback and payment-status UI. | Browser/mobile QA is unverified. No official logo asset was supplied. Ground-route distance estimation, user recovery and email verification are absent. |

## Runtime evidence and limitations

- The owner reported successful Neon schema setup. Live signup, browser/admin handoff and data persistence have not been independently demonstrated by this execution environment. Testnet reward confirmation still needs actual evidence.
- Local preview attempts were blocked by this execution environment's `listen EPERM`; Vercel API access failed DNS resolution. These are environment restrictions, not evidence that the UI works or fails in an ordinary browser.
- Ground-mode coefficients are illustrative; flight factors are sourced but applied to a simplified city-center model. These are not a certified carbon assessment. An estimated footprint is not verified emissions reduction, carbon credit issuance or an offset.
- Flight city names resolve to an automatic approximate direct distance. The manual kilometer field was removed; unsupported ground-route estimates remain pending. Only the latest journey is saved, not a full trip history.
- QR verification is an organizer attestation of an action, not cryptographic proof of travel. The three actions are once per account. Extra accounts and shared organizer credentials remain abuse limitations.
- Testnet XLM has no monetary value. Wallet activation funds 2 Testnet XLM; the separate earned reward pays 1 Testnet XLM after 100 verified points. Only show a confirmation when Horizon reports success.
- Wallets are custodial demo wallets: encrypted seeds stay on the server. There is no participant withdrawal flow, email ownership verification or password recovery.
- Signed pending payments can block the single treasury queue; terminal failures/Testnet resets require reconciliation. This should be disclosed if asked about production readiness.

## Priority before submission

1. Confirm eligibility, selected track, actual thematic/ecosystem requirements and the prior-work cutoff. Fill in the README's disclosure fields and progress log with factual evidence.
2. Connect PostgreSQL, run `npm run db:setup`, configure the Testnet treasury and server secrets, and deploy.
3. Demonstrate one complete real flow. Confirm a duplicate QR cannot add points and a repeated payout cannot pay twice. Verify persistence across logout/login or a server restart.
4. Get a small number of real user/organizer interviews or observations. Label their sample size honestly; do not fabricate traction or measured carbon savings.
5. Publish the repository, record a 2–4 minute video and finish a deck in an accepted format under 20 MiB. Check every submitted link from a signed-out browser.

## Suggested 3-minute demo

| Time | Show |
| --- | --- |
| 0:00–0:25 | The problem: travelers cannot easily connect their transport choices to a visible impact and verified reward. Introduce Karga's user and sponsor/organizer hypothesis. |
| 0:25–0:45 | State the prior-work baseline and specific new work delivered during HackMeridian. Mention meaningful AI assistance. |
| 0:45–1:20 | Sign up; show the private origin → destination journey, mode, automatically estimated flight distance and footprint. Explain the city-center approximation and pending ground-mode estimates. |
| 1:20–1:55 | Organizer verifies completed actions; show points and leaderboard updating. Demonstrate a duplicate verification being rejected. |
| 1:55–2:35 | Show the earned Testnet reward confirmation and open its transaction in the explorer. Repeat the claim and show that no second payout occurs. Do not substitute the welcome wallet transaction for an earned reward. |
| 2:35–3:00 | Explain why Stellar is used for rewards, name current limitations, and state the next pilot/validation step. |

Use a pre-created participant with disclosed, actually verified actions if onboarding or network confirmation is slow. Clearly label any cuts and distinguish live interactions from recorded proof. Do not claim a live payout if it was not confirmed.

## Suggested deck content

1. Karga, user problem and target user.
2. Journey-first experience: from/to → estimate → verified action → earned reward.
3. Working demonstration and concise architecture (private PostgreSQL data; Stellar Testnet payments).
4. Prior-work baseline, actual HackMeridian delta, team roles and AI attribution.
5. Actual validation, organizer/sponsor hypothesis and pilot plan.
6. Relevant track alignment, present limitations and next steps.

Only add user counts, savings, revenue, partnerships or market-size numbers when the team has supporting evidence.

## Submission artifact update

The README now includes a required-deliverables table, explicit baseline/event-delta confirmation fields and expanded AI attribution. The [progress record](HACKATHON-PROGRESS.md) links current implementation areas to source evidence without claiming unconfirmed event timing. A [submission checklist](SUBMISSION-CHECKLIST.md), [3½-minute demo-script draft](DEMO-SCRIPT.md) and [HTML pitch-deck draft](KARGA-PITCH-DECK.html) are included. The uploaded video, verified repository contents/access and confirmed event-progress statement are still outstanding. This documentation is not a claim that the submission has met all requirements.
