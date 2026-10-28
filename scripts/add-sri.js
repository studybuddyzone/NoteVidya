#!/usr/bin/env node
/**
 * scripts/add-sri.js — adds Subresource Integrity (integrity="sha384-…" crossorigin="anonymous") to CDN <script>/<link> tags.
 *
 *   node scripts/add-sri.js            -> DRY RUN: shows what would change
 *   node scripts/add-sri.js --write    -> rewrites the .html files
 *
 * Needs internet (it downloads each CDN file once and hashes it). Re-run after you change a CDN version.
 * Skipped on purpose: URLs without an exact pinned version (@latest, no version), Cashfree/Agora/Tailwind play-CDN
 * (they change under the same URL, so a fixed hash would BREAK the page), and anything that fails to download.
 */
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const HOSTS = ["cdnjs.cloudflare.com", "cdn.jsdelivr.net", "unpkg.com", "www.gstatic.com", "cdn.socket.io"];
const SKIP_HOSTS = ["sdk.cashfree.com", "download.agora.io", "cdn.tailwindcss.com", "www.youtube.com", "apis.google.com"];

function pinned(url) {
  const u = new URL(url);
  if (SKIP_HOSTS.includes(u.hostname) || !HOSTS.includes(u.hostname)) return false;
  if (/@(latest|next)\b/.test(u.pathname)) return false;
  if (u.hostname === "cdn.jsdelivr.net") return /@\d+\.\d+/.test(u.pathname) || /\/(gh|npm)\/[^/]+@\d/.test(u.pathname);
  if (u.hostname === "unpkg.com") return /@\d+\.\d+/.test(u.pathname);
  if (u.hostname === "cdnjs.cloudflare.com") return /\/ajax\/libs\/[^/]+\/\d+\.\d+/.test(u.pathname);
  if (u.hostname === "www.gstatic.com") return /\/firebasejs\/\d+\.\d+/.test(u.pathname);
  if (u.hostname === "cdn.socket.io") return /\/\d+\.\d+/.test(u.pathname);
  return false;
}

const TAG = /<(script|link)\b[^>]*>/gi;
const ATTR = (name) => new RegExp("\\b" + name + "\\s*=\\s*([\"'])(.*?)\\1", "i");

// pure function (unit-tested): returns { html, changed:[url], skipped:[url] }
function addSri(html, hashOf) {
  const changed = [], skipped = [];
  const out = html.replace(TAG, (tag, kind) => {
    const urlAttr = kind.toLowerCase() === "script" ? "src" : "href";
    const m = tag.match(ATTR(urlAttr));
    if (!m || !/^https:\/\//i.test(m[2])) return tag;
    if (kind.toLowerCase() === "link" && !/rel\s*=\s*["']stylesheet["']/i.test(tag)) return tag;
    if (/\bintegrity\s*=/i.test(tag)) return tag;
    const url = m[2];
    if (!pinned(url)) { skipped.push(url); return tag; }
    const h = hashOf(url);
    if (!h) { skipped.push(url); return tag; }
    changed.push(url);
    let t = tag.replace(/\s*\/?>$/, (end) => ` integrity="${h}"` + (/crossorigin/i.test(tag) ? "" : ' crossorigin="anonymous"') + end);
    return t;
  });
  return { html: out, changed, skipped };
}

async function main() {
  const write = process.argv.includes("--write");
  const root = path.join(__dirname, "..");
  const files = fs.readdirSync(root).filter((f) => f.endsWith(".html"));
  const cacheFile = path.join(__dirname, "sri-cache.json");
  const cache = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, "utf8")) : {};
  const urls = new Set();
  for (const f of files) {
    const html = fs.readFileSync(path.join(root, f), "utf8");
    addSri(html, (u) => { urls.add(u); return "sha384-x"; });
  }
  for (const url of urls) {
    if (cache[url]) continue;
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error("HTTP " + r.status);
      cache[url] = "sha384-" + crypto.createHash("sha384").update(Buffer.from(await r.arrayBuffer())).digest("base64");
      console.log("hashed", url);
    } catch (e) { console.log("SKIP (download failed):", url, e.message); }
  }
  fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));
  let n = 0;
  for (const f of files) {
    const p = path.join(root, f), html = fs.readFileSync(p, "utf8");
    const r = addSri(html, (u) => cache[u]);
    if (r.changed.length) { n += r.changed.length; console.log((write ? "updated " : "would update ") + f + " (" + r.changed.length + " tags)"); if (write) fs.writeFileSync(p, r.html); }
  }
  console.log(`\n${n} tags ${write ? "updated" : "would be updated"}. ${write ? "" : "Run again with --write to apply."}`);
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { addSri, pinned };
