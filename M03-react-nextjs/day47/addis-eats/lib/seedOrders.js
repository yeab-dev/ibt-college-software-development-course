import { addDays, dayKey, startOfDay } from "./addisDay";
import { AREAS } from "./validate";

// Day 46. A month of order history, so the dashboard has something to chart.
//
// Until today .data/orders.json started empty: the only orders were the ones
// placed while testing. A chart of three orders says nothing about shape, and
// a pager over three rows has nothing to page. So when the store is read for
// the first time and there is no file, lib/orders.js writes this instead —
// the same way lib/jsonStore.js copies the accounts seed.
//
// Deterministic: a seeded random generator (mulberry32, seed 46), so every
// fresh clone gets the same 425 orders with the same ids, totals and
// neighbourhoods. Only the dates move: they are counted back from the day the
// store is created, so "the last 30 days" is always full. Delete .data/ to
// start again from today.
//
//   - the 30 complete days before today; nothing today (the kitchen board
//     starts the day empty, and today's orders are the ones people place)
//   - 10–20 orders a day, busier on Friday and Saturday, rising slowly over
//     the month, at lunch and dinner time
//   - Bole the busiest neighbourhood and Piassa the quietest, so the bars
//     differ by enough to read
//   - priced from data/menu.json exactly as createOrder prices them
//   - about one in twenty-five cancelled
//
// Who placed them: the two demo customers have a history of their own —
// Almaz is a regular (about one order in nine, enough for three pages of
// /orders), Bereket orders now and then — and everything else belongs to
// seeded customers with no account. Their numbers start 0900, which no real
// TeleBirr number does; they exist only so the revenue adds up to a business.
//
// Pure: no file, no clock of its own, no React. lib/orders.js passes it the
// menu and the time.

const SEED = 46;
const DAYS = 30;
const FIRST_ID = 1001;

const DEMO_CUSTOMERS = [
  { userId: "usr_almaz", name: "Almaz Bekele", phone: "0911223344", area: "Bole", share: 0.11 },
  { userId: "usr_bereket", name: "Bereket Haile", phone: "0922334455", area: "Kazanchis", share: 0.03 },
];

const SEEDED_NAMES = [
  "Abebe Girma", "Hana Tadesse", "Dawit Mekonnen", "Meron Alemu", "Yonas Desta",
  "Tsion Wolde", "Samuel Kebede", "Liya Mulugeta", "Elias Tesfaye", "Rahel Getachew",
  "Natnael Assefa", "Bethlehem Yirga", "Kidus Haile", "Mahlet Abera", "Robel Fikre",
  "Selamawit Taye", "Henok Bekele", "Saron Lemma", "Fitsum Negash", "Eden Hailu",
  "Mikias Tilahun", "Hiwot Demissie", "Amanuel Zewdu", "Feven Asfaw",
];

// How often each neighbourhood orders: Bole, Kazanchis, Megenagna, Piassa.
const AREA_WEIGHTS = [0.36, 0.22, 0.26, 0.16];

// mulberry32: a tiny, well-known 32-bit generator. Same seed, same sequence.
function generator(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedOrders({ menu, now = Date.now() }) {
  const random = generator(SEED);
  const between = (min, max) => min + Math.floor(random() * (max - min + 1));
  const pick = (list) => list[Math.floor(random() * list.length)];
  function weighted(list, weights) {
    let r = random();
    for (let i = 0; i < list.length; i += 1) {
      r -= weights[i];
      if (r < 0) return list[i];
    }
    return list.at(-1);
  }

  const seededCustomers = SEEDED_NAMES.map((name, i) => ({
    userId: `usr_seed_${String(i + 1).padStart(2, "0")}`,
    name,
    phone: `0900${String(i + 1).padStart(6, "0")}`,
    area: weighted(AREAS, AREA_WEIGHTS),
  }));

  const today = dayKey(now);
  const orders = [];

  for (let back = DAYS; back >= 1; back -= 1) {
    const day = addDays(today, -back);
    const midnight = startOfDay(day).getTime();
    // A weekly rhythm: two busy evenings and a fairly busy third day in every
    // seven. Counted from the start of the range, not from the calendar's
    // real weekdays, so the history is the same whichever day it is seeded
    // on — same ids, same totals, on every clone.
    const rhythm = back % 7;
    const busy = rhythm === 1 || rhythm === 2 ? 4 : rhythm === 3 ? 2 : 0;
    const growth = Math.floor((DAYS - back) / 6); // 0 → 4 over the month
    const count = 9 + busy + growth + between(0, 4);

    for (let n = 0; n < count; n += 1) {
      const meal = random();
      const hour = meal < 0.5 ? between(11, 13) : meal < 0.9 ? between(18, 20) : between(8, 21);
      const placedAt = midnight + (hour * 60 + between(0, 59)) * 60 * 1000 + between(0, 59) * 1000;

      // A demo customer, or one of the seeded ones. A regular mostly orders
      // to the same place; one time in five, somewhere else.
      const r = random();
      const demo = r < DEMO_CUSTOMERS[0].share
        ? DEMO_CUSTOMERS[0]
        : r < DEMO_CUSTOMERS[0].share + DEMO_CUSTOMERS[1].share
          ? DEMO_CUSTOMERS[1]
          : null;
      const customer = demo ?? pick(seededCustomers);
      const area = random() < 0.8 ? customer.area : weighted(AREAS, AREA_WEIGHTS);

      // One to three different dishes, mostly one of each.
      const lines = [];
      const dishes = between(1, 3);
      while (lines.length < dishes) {
        const dish = pick(menu);
        if (lines.some((l) => l.id === dish.id)) continue;
        const quantity = random() < 0.7 ? 1 : between(2, 3);
        lines.push({ id: dish.id, slug: dish.slug, name: dish.name, price: dish.price, quantity });
      }

      const cancelled = random() < 0.04;
      orders.push({
        userId: customer.userId,
        status: cancelled ? "cancelled" : "placed",
        name: customer.name,
        phone: customer.phone,
        area,
        notes: "",
        lines,
        total: lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
        currency: "ETB",
        placedAt: new Date(placedAt).toISOString(),
        ...(cancelled && { cancelledAt: new Date(placedAt + 60 * 1000).toISOString() }),
      });
    }
  }

  // Oldest first, as the store keeps them, and numbered in that order: the
  // next real order is the last seeded id plus one (createOrder).
  orders.sort((a, b) => a.placedAt.localeCompare(b.placedAt));
  return orders.map((order, i) => ({ id: String(FIRST_ID + i), ...order }));
}
