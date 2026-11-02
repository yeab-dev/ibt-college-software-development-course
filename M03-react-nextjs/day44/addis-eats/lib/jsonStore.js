import "server-only";
import { copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

// Day 42. A JSON file in .data/ as a tiny table: read it whole, change it,
// write it back — the way lib/orders.js has kept orders since Day 39, pulled
// out so the accounts and the sessions can be kept the same way.
//
// .data/ is gitignored: what people sign up with and the sessions they hold
// are runtime data, never committed. A store may name a `seed` file in data/
// (committed) that is copied in the first time the table is read — that is
// how the three demo accounts exist on a fresh clone.
//
// A real database replaces this in Module 4.

const DATA_DIR = path.join(process.cwd(), ".data");

export function jsonStore(name, { seed } = {}) {
  const file = path.join(DATA_DIR, `${name}.json`);
  const seedFile = seed ? path.join(process.cwd(), "data", seed) : null;

  async function load() {
    try {
      return JSON.parse(await readFile(file, "utf8"));
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
      if (!seedFile) return [];
      await mkdir(DATA_DIR, { recursive: true });
      await copyFile(seedFile, file);
      return JSON.parse(await readFile(file, "utf8"));
    }
  }

  async function save(rows) {
    await mkdir(DATA_DIR, { recursive: true });
    // A temporary file renamed over the old one: a reader never sees half.
    const temp = `${file}.${process.pid}.tmp`;
    await writeFile(temp, `${JSON.stringify(rows, null, 2)}\n`);
    await rename(temp, file);
  }

  // Writes are queued one after another per file, so two at once cannot
  // both read, both change, and lose one of the changes. The queue lives on
  // globalThis so every bundle in this process shares it.
  const queues = (globalThis.__addisEatsStoreQueues ??= new Map());
  if (!queues.has(file)) queues.set(file, { tail: Promise.resolve() });
  const queue = queues.get(file);

  function mutate(change) {
    const run = queue.tail.then(async () => {
      const rows = await load();
      const result = await change(rows);
      await save(rows);
      return result;
    });
    queue.tail = run.catch(() => {});
    return run;
  }

  return { load, mutate };
}
