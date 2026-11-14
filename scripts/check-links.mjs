import { readFile, writeFile } from "node:fs/promises";

/**
 * Checks every resource URL in the catalogue. Resources borrow their URL from
 * the catalogue, so 118 unique URLs cover all 243 library cards.
 */
const source = await readFile(new URL("../lib/catalog.ts", import.meta.url), "utf8");

const entries = [...source.matchAll(/title: "((?:[^"\\]|\\.)*)"[\s\S]*?url: "([^"]+)"/g)].map(
  ([, title, url]) => ({ title, url }),
);

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

async function check({ title, url }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": UA,
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
      },
    });
    return { title, url, status: response.status, finalUrl: response.url };
  } catch (error) {
    return { title, url, status: 0, error: String(error).slice(0, 120) };
  } finally {
    clearTimeout(timer);
  }
}

const results = [];
const queue = [...entries];
const workers = Array.from({ length: 8 }, async () => {
  for (;;) {
    const next = queue.shift();
    if (!next) return;
    results.push(await check(next));
  }
});
await Promise.all(workers);

results.sort((a, b) => a.status - b.status || a.title.localeCompare(b.title));

const summary = results.reduce((acc, item) => {
  const key = item.status === 0 ? "network-error" : String(item.status);
  acc[key] = (acc[key] ?? 0) + 1;
  return acc;
}, {});

await writeFile(
  new URL("../.next/link-report.json", import.meta.url),
  JSON.stringify({ checked: results.length, summary, results }, null, 2),
);

console.log(`checked ${results.length}`, summary);
for (const item of results) {
  if (item.status !== 200) {
    console.log(`${item.status}\t${item.title}\t${item.url}${item.error ? ` (${item.error})` : ""}`);
  }
}
