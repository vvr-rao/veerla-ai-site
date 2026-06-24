// Fetch Venkat Ram Rao's Medium RSS feed and write posts.json.
// Run by .github/workflows/medium.yml (daily) and locally via `npm run build:medium`.
// Requires Node 20+ (global fetch) and fast-xml-parser.

import { writeFileSync } from "node:fs";
import { XMLParser } from "fast-xml-parser";

const PROFILE = "https://medium.com/@venkat.ramrao";
const FEED_URL = `${PROFILE}/feed`;
const OUT = new URL("../posts.json", import.meta.url);
const MAX_POSTS = 12;
const EXCERPT_LEN = 180;

function stripHtml(html = "") {
  return html
    .replace(/<figcaption[\s\S]*?<\/figcaption>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/\s*Continue reading on Medium\s*»?\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function firstImage(html = "") {
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

function cleanLink(link = "") {
  try {
    const u = new URL(link);
    u.search = ""; // drop Medium tracking params (?source=rss-...)
    return u.toString();
  } catch {
    return link;
  }
}

function excerpt(html) {
  const text = stripHtml(html);
  if (text.length <= EXCERPT_LEN) return text;
  return text.slice(0, EXCERPT_LEN).replace(/\s+\S*$/, "") + "…";
}

function asArray(v) {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

async function main() {
  const res = await fetch(FEED_URL, {
    headers: { "User-Agent": "veerla-ai-site-builder/1.0" },
  });
  if (!res.ok) throw new Error(`Feed fetch failed: ${res.status} ${res.statusText}`);
  const xml = await res.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    cdataPropName: "__cdata",
    trimValues: true,
  });
  const doc = parser.parse(xml);
  const items = asArray(doc?.rss?.channel?.item);

  const text = (v) => (v && typeof v === "object" ? v.__cdata ?? "" : v ?? "");

  const posts = items.slice(0, MAX_POSTS).map((it) => {
    // Medium's feed sometimes provides full HTML in content:encoded and sometimes
    // only an image + snippet in description. Prefer the richer of the two.
    const encoded = text(it["content:encoded"]);
    const desc = text(it.description);
    const content = encoded.length >= desc.length ? encoded : desc;
    return {
      title: text(it.title).trim(),
      link: cleanLink(text(it.link).trim()),
      pubDate: it.pubDate ? new Date(text(it.pubDate)).toISOString() : null,
      image: firstImage(content),
      excerpt: excerpt(content),
      tags: asArray(it.category).map((c) => text(c).trim()).filter(Boolean),
    };
  });

  const out = {
    updated: new Date().toISOString(),
    profile: PROFILE,
    count: posts.length,
    posts,
  };

  writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
  console.log(`Wrote ${posts.length} posts to posts.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
