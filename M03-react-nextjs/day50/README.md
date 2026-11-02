# Day 50: Frontend capstone, final project submission

Module 3: Frontend, React & Next.js. The capstone is **Hakim**, a
clinic-booking app for Addis Ababa ([Day 49](../day49/README.md) describes the
project in full). It is submitted on Moodle, then presented and defended in
class from its deployed URL. The submitted version is the one presented.

## Required submission

### GitHub repository URL

<https://github.com/yeab-dev/hakim>, the complete source code (Next.js 16,
React 19). Public, branch `main`.

### Deployed application URL

<https://hakim-five-brown.vercel.app>, on Vercel, deployed from `main` on every
push. Data lives in Upstash Redis, shared by every instance;
[`/api/health`](https://hakim-five-brown.vercel.app/api/health) reports
`{"ok":true,"store":"redis"}`.

### Project documentation

The five files, all in the repository root:

| File | What the assignment asks for | What Hakim's covers |
| --- | --- | --- |
| [README.md](https://github.com/yeab-dev/hakim/blob/main/README.md) | Project overview, features, technologies, setup instructions, deployed URL | The brief (problem, user, features, screens), route map, component tree and state placement, how to run it, the environment variable, demo accounts, endpoints, build output, the live URL and the checks run on it |
| [DATA.md](https://github.com/yeab-dev/hakim/blob/main/DATA.md) | Data fetching, caching and revalidation strategies | Every query: server or client, its cache key, and its refresh rule (static, ISR with `revalidate = 60`, `revalidatePath` after writes, SWR polling only while a booking can change, debounced search), and what the network tab shows |
| [AUTH.md](https://github.com/yeab-dev/hakim/blob/main/AUTH.md) | Authentication, authorisation and data security | Accounts and sessions (scrypt, lockout, cookie flags), who may see what, each protected route and action layer by layer, the three attacks performed with their results, the course's six common mistakes audited |
| [PERF.md](https://github.com/yeab-dev/hakim/blob/main/PERF.md) | Performance measurements, optimisations, before-and-after results | The budget with before and after (LCP on `/` 1.27 s → 0.67 s, CLS 0.026 → 0, Lighthouse 99–100), the cause of each change, and the missed First Load JS target explained |
| [FUTURE.md](https://github.com/yeab-dev/hakim/blob/main/FUTURE.md) | Known limitations, unfinished features, planned improvements | What was cut on purpose, the unfinished reception dashboard, what comes next, known issues |

### Peer code review (REVIEW.md)

Required: **your written review of your assigned peer's project**, with three
specific strengths and three questions about the implementation.

[REVIEW.md](https://github.com/yeab-dev/hakim/blob/main/REVIEW.md) in Hakim
currently holds a review *of Hakim*, committed by fitsum, with three strengths
and three weaknesses. That is feedback received, not the review to submit. The
review of the peer's project (three strengths, three questions) goes in
REVIEW.md before submitting.

## Before submitting

- [x] The deployed application is reachable: `/`, `/clinics`, a clinic page,
      `/login` and `/api/health` answer 200; `/appointments` signed out
      redirects to `/login?next=%2Fappointments` (checked 2 Nov 2026)
- [x] The main user flow works on the deployed URL: sign in, book a slot,
      cancel it, and a brand-new account's empty state, all verified on
      24 Oct 2026 (Hakim's README, "Verified on the live URL")
- [x] The repository and its documentation are public
- [x] The submission is the version presented: `main` at
      [`5af058b`](https://github.com/yeab-dev/hakim/tree/5af058b83268d5ce22ce6a5b0dec816166bb5948),
      which Vercel deploys from `main` (confirm in the Vercel dashboard that
      this commit's deployment is the live one)
- [ ] REVIEW.md holds the review of the assigned peer's project
- [ ] Ready to explain the technical decisions and demonstrate the security
      checks (below)

## In-class presentation

Eight minutes, from the deployed URL. The assignment asks for five things:

| Required | In Hakim |
| --- | --- |
| Demonstrate the application using its deployed URL | Filter clinics by specialty and area, open Selam Family Clinic, book a slot, see the booking reference and queue position, cancel it |
| Explain one important technical decision | What runs on the server and what in the browser: clinic pages are ISR (`revalidate = 60`) and refreshed with `revalidatePath` after every booking, while only the slot picker, search and live queue status are client components (STRATEGY.md, BOUNDARY.md) |
| Demonstrate the required security checks | The three attacks from AUTH.md, live: cancelling while signed out (401), Abebe cancelling Tsion's `HK-2PB6Y` (403, and 404 for her id in the URL), and `/login?next=https://example.com` staying on the site |
| Discuss the performance results | PERF.md: LCP on `/` from 1.27 s to 0.67 s and on `/clinics` from 1.59 s to 0.71 s, CLS from 0.026 to 0, Lighthouse 99–100; First Load JS missed its 120 kB target at 151.8 kB, because React DOM and the Next.js runtime alone are 116 kB |
| Identify what to improve next | From FUTURE.md: finish the reception week dashboard, replace 10-second polling with server-sent events, re-run Lighthouse on the live URL, and move from Redis collections to a database with transactions |

Demo accounts for the live demo:

| Account | Mobile | Password | Used for |
| --- | --- | --- | --- |
| Abebe Kebede | `0911 234 567` | `abebe-demo-2026` | The main flow, and the attacker in attack 2 |
| Tsion Haile | `0922 765 432` | `tsion-demo-2026` | Owns `HK-2PB6Y` |
| Hirut Bekele | `0930 111 222` | `selam-reception-2026` | Reception: checking a patient in |

The module assessment also takes place in class.
