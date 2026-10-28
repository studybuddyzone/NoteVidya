# Payment testing (Cashfree sandbox) — go-live se pehle

**Sach:** `MIGRATION.md` ke hisaab se Supabase + Cashfree par abhi tak asli test nahi hua. Neeche ka checklist wahi test hai. Paise wale step aapko khud karne honge (mere paas aapki keys nahi hain).

## 0. Taiyari
1. Vercel **Preview** deployment banao (production nahi). Env: `CASHFREE_ENV=sandbox`, sandbox `CASHFREE_APP_ID` / `CASHFREE_SECRET_KEY` / `CASHFREE_WEBHOOK_SECRET`, test Supabase project ke keys.
2. Cashfree dashboard (sandbox) mein webhook URL = `https://<preview>/api/webhook` (events ke liye `/api/event-webhook`).
3. Supabase SQL migrations (`supabase/migrations/001…004`) **test project** par ek-ek order mein chalao. Ye files is repo ke zip mein nahi thi — apne repo mein `supabase/` folder commit karo, warna schema kho sakta hai.

## 1. Automatic safety check (1 min)
```
node scripts/payment-smoke.js https://<preview>.vercel.app
```
Sab ✅ hone chahiye (login ke bina order nahi, galat signature par 401, bahari website ko CORS nahi, rate limit 429).

## 2. Manual test cases (sandbox)
| # | Test | Kya hona chahiye |
|---|---|---|
| 1 | Silver/Gold khareedo, sandbox test card se **success** | `orders.status=paid`, role/plan turant upgrade, receipt khule |
| 2 | Payment page par **cancel** dabao | `/payment-failed` par CANCELLED, role same, koi paisa nahi |
| 3 | Fail hone wala test card | FAILED screen, retry button sahi plan select kare |
| 4 | Success ke baad **same webhook dobara** bhejo (Cashfree dashboard → resend) | Plan dobara nahi badhna (`fulfill_order` idempotent), expiry double nahi |
| 5 | Browser DevTools mein `amount` badal ke `/api/create-order` bhejo | Server DB wala price use kare, tumhara amount ignore |
| 6 | Bina pay kiye `/api/verify-payment?order_id=<apna unpaid order>` kholo | `/payment-failed` par redirect; role/plan nahi badhna (server Cashfree se status poochta hai) |
| 7 | Payment ke beech tab band karo, 5 min baad webhook aaye | Order phir bhi paid ho (webhook se) |
| 8 | FY (`-fy1`) plan ka poora flow | Alag catalog se sahi price |
| 9 | Swayam event register (Rs 20) + GTMC (Rs 30) | Registration `paid`, certificate lookup chale |
| 10 | Referral code laga ke khareedo | Referrer ko reward ek hi baar |

## 3. Production par jaane se pehle
- `CASHFREE_ENV=production` + live keys sirf Production env mein; Preview mein sandbox hi rahe.
- Live mein pehla test **sabse sasta plan** (jaise Rs 1–20), phir Cashfree dashboard mein refund.
- Cashfree ka webhook URL production domain ka ho.
- Rate limit shared rakhne ke liye `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` set karo.
