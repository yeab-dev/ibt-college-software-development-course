# Day 49: Frontend capstone build

Week 10. No Addis Eats today: the whole day goes to the capstone, and nothing
new is expected. The point is that two modules' worth of topics are present
and working together in one deployed application, and that the application is
not changed after tonight.

The capstone is **Hakim**, which books clinic appointments in Addis Ababa. It
lives in its own repository and is not copied here:

- Code: [github.com/yeab-dev/hakim](https://github.com/yeab-dev/hakim), local
  clone at `/home/yeab/hakim`
- Live URL: <https://hakim-five-brown.vercel.app>
- State at the end of Day 49: commit
  [`5af058b`](https://github.com/yeab-dev/hakim/tree/5af058b83268d5ce22ce6a5b0dec816166bb5948)
  (27 Oct 2026)

## Today's sequence, and where each step landed

| # | Step | Where in Hakim |
| --- | --- | --- |
| 1 | Triage into Must, Should and Could; move the Coulds into FUTURE.md | [FUTURE.md](https://github.com/yeab-dev/hakim/blob/5af058b/FUTURE.md): "Cut on purpose", "Started, not finished", "Next" |
| 2 | Fix what's broken; main flow end to end on the deployed URL | README, "Verified on the live URL (2026-10-24)"; the Vercel fixes in commits `45c9cc6`, `71028d7`, `c3b4c55` (sessions and bookings shared through Upstash Redis) |
| 3 | Three attacks, plus an id changed in a private URL | [AUTH.md](https://github.com/yeab-dev/hakim/blob/5af058b/AUTH.md), "The three attacks — performed" |
| 4 | A brand-new account, every empty state fixed | Not recorded in Hakim yet (see "Still open" below) |
| 5 | Lighthouse, keyboard pass, a real phone; numbers recorded | [PERF.md](https://github.com/yeab-dev/hakim/blob/5af058b/PERF.md) (local production build); 44 px touch targets in commit `6baf0ab` |
| 6 | README, AUTH, DATA, PERF, FUTURE | All five are in the repository root, plus STRATEGY.md and BOUNDARY.md from Week 8 |
| 7 | Rehearse the eight minutes aloud, then stop changing the app | [PRESENTATION.md](https://github.com/yeab-dev/hakim/blob/5af058b/PRESENTATION.md) is the script; rehearsing it is yours |

## How the rubric maps onto Hakim

| Criterion | Weight | Evidence |
| --- | --- | --- |
| Functionality and completeness | 25% | Browse, filter, clinic page, book, my appointments, cancel, live queue position, reception check-in |
| Architecture and code quality | 20% | STRATEGY.md (rendering per route), BOUNDARY.md (server or client per file) |
| Authentication and data handling | 20% | AUTH.md, DATA.md |
| Performance, accessibility, metadata | 15% | PERF.md; `opengraph-image.js`, `sitemap.js`, `robots.js` |
| Deployment and documentation | 10% | Live URL in the README; the seven documents |
| Presentation and walkthrough | 10% | PRESENTATION.md |

## Still open, by Hakim's own account

These come from Hakim's FUTURE.md and README. They are capstone work, so they're
left for you to do or to cut:

- [ ] Sign up a brand-new account on the live URL, use the app through it, and
      record what each empty screen shows
- [ ] Lighthouse on the live URL, mobile and throttled, to replace the local
      numbers in PERF.md
- [ ] A full keyboard-only pass by hand, with the mouse out of reach
- [ ] Week 10's topics are not in Hakim yet: a chart or a table with sorting
      and paging (Day 46), a map and live status over server-sent events
      (Day 47). Either add one or name the cut in the presentation's last
      minute
- [ ] First Load JS on `/clinics` is 151.8 kB against a 120 kB budget (React DOM
      and the Next.js runtime are 116 kB of it). Already explained in PERF.md
