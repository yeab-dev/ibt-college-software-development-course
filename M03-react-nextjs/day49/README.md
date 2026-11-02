# Day 49: Hakim, the capstone build

**Hakim** books clinic appointments in Addis Ababa. It is the Module 3
capstone: started on Day 35 as a Vite + React scaffold, moved to Next.js on
Days 36–40, and given accounts, live data, a measured performance pass and
metadata on Days 41–45. Day 49 is the last build day; the version below is the
one presented on [Day 50](../day50/README.md).

- **Live:** <https://hakim-five-brown.vercel.app>
- **Code:** [github.com/yeab-dev/hakim](https://github.com/yeab-dev/hakim), its
  own repository (local clone at `/home/yeab/hakim`). It is not copied here.
- **Version at the end of Day 49:** commit
  [`5af058b`](https://github.com/yeab-dev/hakim/tree/5af058b83268d5ce22ce6a5b0dec816166bb5948)

## The problem, and who it's for

Seeing a specialist in Addis usually starts with a queue: clinics hand out a
limited number of cards each morning, so a patient, or a son or daughter
booking for a parent, arrives before dawn without knowing whether the doctor
they want is even in. Hakim shows which doctors have free time this week and
lets you book a slot from a phone.

One user: **the patient**, or the family member booking for them. They know
roughly what kind of doctor they need and which part of the city they can get
to, and they're usually on a phone with a slow connection.

## What it does

- Browse clinics by specialty and area. The filters are in the URL, so a
  search can be shared.
- Open a clinic to see its doctors and each doctor's open slots for the next
  seven days.
- Book a slot through a validated form (patient name, Ethiopian mobile number,
  reason, whether it's for someone else) and get a booking reference at once.
- See your bookings, open one, and cancel it. On the day, the booking shows
  how many patients are ahead of you and updates by itself when reception
  checks you in.
- Search clinics and doctors by name as you type (debounced).
- Export your appointments as CSV.
- A **reception** account per clinic sees that clinic's bookings for today and
  marks patients as arrived.

Out of scope on purpose: managing doctors and schedules, payments, SMS
reminders, ratings and reviews.

## Screens

| Path | Screen | Who |
| --- | --- | --- |
| `/` | Home: the specialties, each linking to its clinics | Everyone |
| `/clinics` | Clinics matching `?specialty=` and `?area=` | Everyone |
| `/clinics/:clinicId` | One clinic, its doctors and their slots | Everyone |
| `/book/:slotId` | Confirm the slot and enter the patient's details | Signed in |
| `/appointments` | My bookings, upcoming first, past ones paged | The owner |
| `/appointments/:appointmentId` | One booking, live queue position, cancel | The owner |
| `/reception` | Today's bookings at the staff member's clinic | Reception staff |
| `/login`, `/signup` | Sign in, create an account | Everyone |
| `*` | Not found | Everyone |

## How it's built

- **Next.js 16 (App Router) and React 19.** Server Components read data
  directly; client components are kept to the pieces that need state (the
  slot picker, search, the live queue status, forms). Mutations go through
  Server Actions.
- **Rendering per route:** specialties and areas are static, clinic pages are
  ISR with `revalidate = 60` plus `revalidatePath` after every booking or
  cancel, and private pages render per request.
  [STRATEGY.md](https://github.com/yeab-dev/hakim/blob/5af058b/STRATEGY.md)
  has the table, and
  [BOUNDARY.md](https://github.com/yeab-dev/hakim/blob/5af058b/BOUNDARY.md)
  says why each file is server or client.
- **Data:** SWR on the client for search and the live queue status, seeded
  with server data (`fallbackData`) so nothing spins on arrival. The queue
  polls every 10 s only while a booking can still change.
  [DATA.md](https://github.com/yeab-dev/hakim/blob/5af058b/DATA.md) lists every
  query.
- **Storage:** Upstash Redis on Vercel, shared by every server instance
  (`GET /api/health` reports `{"store":"redis"}`). Locally, with no Redis
  variables, the same code falls back to JSON files in `.data/`.
- **Accounts:** mobile number and password, hashed with scrypt; five failed
  sign-ins lock the number for 15 minutes. The session cookie is `HttpOnly`,
  `Secure` and `SameSite=Lax`, and sign-out deletes the session on the
  server.
- **Protection in three layers:** `proxy.js` redirects a visitor with no
  session to `/login?next=…`; each private page checks the session itself;
  every action checks it again, along with ownership or the reception role.
  `?next=` goes through `safeReturnPath()`, so sign-in can't be used as an
  open redirect. [AUTH.md](https://github.com/yeab-dev/hakim/blob/5af058b/AUTH.md)
  has every route and action, layer by layer.
- **Metadata:** a title and description per route, `opengraph-image` for the
  site and for each clinic, `sitemap.js` and `robots.js`.

## Verified on the live URL

From Hakim's README, run with headless Chromium against the deployment on
24 October 2026:

| Check | Result |
| --- | --- |
| Sign in, then three more page loads, ×8 | 8/8 sessions kept |
| Book a slot end to end | Booked `HK-Q52S2` |
| Cancel your own booking | 200; shows *Cancelled* |
| Attack 1: cancel while signed out | 401 |
| Attack 2: Abebe cancels Tsion's booking | 403 *You can only cancel your own bookings* |
| Attack 2b: Tsion's booking id in the URL | 404 |
| Attack 3: `/login?next=https://example.com` | Stays on the site |
| A brand-new account | Signs up; *My appointments* shows the empty state |
| Private window, `/appointments` | Redirected to sign-in |
| Canonical, `og:image`, sitemap, robots | Absolute URLs on the live domain |

## Performance

Measured on a production build with Lighthouse, mobile, median of three
([PERF.md](https://github.com/yeab-dev/hakim/blob/5af058b/PERF.md)):

| Measure | Target | Before | After |
| --- | --- | --- | --- |
| LCP, `/` (throttled) | under 2.5 s | 1.27 s | **0.67 s** |
| LCP, `/clinics` (throttled) | under 2.5 s | 1.59 s | **0.71 s** |
| CLS | under 0.1 | 0.026 | **0.000** |
| Lighthouse performance | 90+ | 98–100 | **99–100** |
| First Load JS, `/clinics` | under 120 kB | 150.4 kB | 151.8 kB (missed: React DOM and the Next.js runtime are 116 kB of it) |

## Run it locally

```bash
cd /home/yeab/hakim
npm install
npm run build
npm run start -- -p 3350
```

Demo accounts (seeded in `data/accounts.json`, passwords stored only as
scrypt hashes):

| Account | Mobile | Password | Role |
| --- | --- | --- | --- |
| Abebe Kebede | `0911 234 567` | `abebe-demo-2026` | patient, with a booking today |
| Tsion Haile | `0922 765 432` | `tsion-demo-2026` | patient, owns `HK-2PB6Y` |
| Hirut Bekele | `0930 111 222` | `selam-reception-2026` | reception, Selam Family Clinic |

## What's cut or unfinished

From [FUTURE.md](https://github.com/yeab-dev/hakim/blob/5af058b/FUTURE.md):

- A reception week dashboard (chart and sortable, paged table, Day 46) was
  started on the `wip/day46-dashboard` branch and not finished.
- No map or server-sent events yet (Day 47): the queue status polls every
  10 s instead.
- Lighthouse hasn't been re-run on the live URL; PERF.md's numbers are from a
  local production build.
- Upstash stores each collection whole, so two simultaneous writes could lose
  one. A real database with transactions is the next step.
