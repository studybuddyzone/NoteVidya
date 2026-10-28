# StudyBuddyZone (StudyBuddyPro)

B.Tech (BATU/DBATU, AKTU) students ke liye study platform — static HTML pages + Vercel serverless API (`api/`), Supabase (auth, DB, storage) aur Cashfree payments. Quiz/arena abhi bhi Firebase par hain (`MIGRATION.md` dekho).

## Folder map
| Folder / file | Kya hai |
|---|---|
| `*.html` | Saare pages (clean URLs: `fy.html` → `/fy`) |
| `s/css`, `s/js` | Pages se nikaale gaye shared CSS/JS (file name = content hash, isliye browser unhe hamesha ke liye cache karta hai) |
| `js/` | Shared browser modules: `supabase-config.js`, `supabase-client.js`, `auth.js`, `sbz-legacy.js`, `sbz-safe.js` (XSS helpers) |
| `api/` | Vercel serverless entry points (patle wrappers) |
| `lib/` | Server logic: payments, backend actions, events, `cors.js`, `rate-limit.js` |
| `tests/` | `npm test` (Node 18+, koi extra package nahi) |
| `scripts/` | Data migration, SRI hash tool, Firebase rules checker |
| `docs/` | Payment sandbox checklist, Firebase rules guide |
| `firebase/` | Firebase rules **templates** (deploy se pehle review zaroori) |

## Setup
1. `cp .env.example .env` aur values bharo (Vercel mein bhi same env vars).
2. `npm install` → `npm test`
3. Deploy: Vercel (git push).

## Security env vars (naye)
- `ALLOWED_ORIGINS` — extra website origins jo API call kar sakte hain (comma separated). `SITE_URL` apne aap allowed hai.
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — optional; set karo to rate limit saare serverless instances mein shared chalega.

## Useful commands
```
npm test                          # unit tests
node scripts/check-firebase-rules.js   # public internet se Firebase DB open hai ya nahi
node scripts/add-sri.js           # CDN <script> tags par integrity hash lagata hai (internet chahiye)
```
