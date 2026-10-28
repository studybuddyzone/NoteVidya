# StudyBuddyPro: Firebase → Supabase Migration: Status Report

> **Ek line mein:** Auth, payments, backend API, notices aur ~93 pages ka code Supabase pe likha ja chuka hai aur unit-test hua hai. **Real Supabase/Cashfree pe abhi kuch bhi run nahi hua**, data migration script nahi bani, aur quiz/arena tumhare kehne par Firebase pe hi chhode gaye hain.
> **Production pe deploy mat karo.** Sirf test Supabase project + Vercel preview pe try karo.

---

## 1. Numbers (ginti se)

| Cheez | Pehle | Ab |
|---|---|---|
| Files jo Firebase mention karti hain | 123 | **31** |
| Un 31 mein se asli Firebase code | – | **23** (quiz 6, arena/battle 13, `answer.html` 1, server helpers 2; manual-payment admin `manager.html` **hata diya gaya**) |
| Un 31 mein se sirf text/comment (docs, SQL comments) | – | 8 |
| HTML pages jo naye Supabase client pe hain | 0 | **93 / 125** |
| Baaki 32 pages | – | 14 static (backend nahi), 18 legacy (quiz/arena/admin) |
| API routes Supabase pe | 0 | 8 (create-order, verify-payment, webhook + 3 `-fy1` compat, backend (38 actions), notices) |
| Tests (mock-based) | – | **61 pass** (payments 21, backend 29, compat layer 11) |
| SQL migrations | – | 4 files (untested on real Postgres) |

**Mota andaaza (rough, sirf ek anuman):** code ka ~60% likha ja chuka hai. Real testing + data migration + quiz/arena baaki hai, wo kaam ka lagbhag baaki 40% hai. "Real environment mein tested" abhi **0%** hai.

---

## 2. Zip ka structure

```
studybuddypro-main/
├── MIGRATION.md                        ← ye file
├── .env.example                        ★ NEW  saare env vars (placeholders)
├── package.json                        ✏️ + @supabase/supabase-js, Node>=18
├── vercel.json                         ✏️ FCM service-worker header hataya
├── .vercelignore                       ✏️ supabase/, docs public serve nahi honge
│
├── supabase/migrations/                ★ NEW  (inhe order mein run karo)
│   ├── 001_initial_schema.sql          profiles, RLS, plans/orders/payments/subs, referrals, scores, storage...
│   ├── 002_auth_helpers.sql            check_refer_code()
│   ├── 003_payment_catalogs.sql        FY vs main plans, fulfill_order (idempotent)
│   └── 004_backend_support.sql         withdrawals, notices targeting, leaderboard, certificate lookup...
│
├── js/                                 ★ NEW  (browser-side shared modules)
│   ├── supabase-config.js              ← yahan URL + anon key bharo
│   ├── supabase-client.js              ek hi shared client (window.sbz)
│   ├── auth.js                         login/signup/reset helpers (SBZAuth)
│   └── sbz-legacy.js                   compat layer: purane pages ka auth/database API Supabase pe
│
├── lib/                                server-side (Vercel functions)
│   ├── supabase-admin.js               ★ service_role client + token verify + user-scoped client
│   ├── authz.js                        ★ roles (staff vs paid tier), legacyRole()
│   ├── cashfree.js                     ★ Cashfree API + raw-body webhook signature
│   ├── payment-handlers.js             ★ create-order / verify / webhook logic
│   ├── backend-handlers.js             ★ api/backend ke saare 38 actions
│   ├── notices-handler.js              ★ api/notices
│   ├── legacy-rooms.js                 ★ sirf manage-rooms (Firestore), isolated
│   └── helpers.js                      (original, quiz ke liye Firebase admin)
│
├── api/
│   ├── create-order.js, create-order-fy1.js        ✏️ (URL same, auth + DB price)
│   ├── verify-payment.js, verify-payment-fy1.js    ✏️
│   ├── webhook.js, webhook-fy1.js                  ✏️ (raw body signature)
│   ├── backend.js                                  ✏️ Supabase router
│   ├── notices.js                                  ✏️ Supabase
│   └── quiz.js                                     ⚠️ ORIGINAL (Firebase)
│
├── reset-password.html                 ★ NEW  Supabase reset link yahin aata hai (styling basic)
├── index.html, premium-get.html, payment.html      ✏️ Supabase Auth
├── certificate.html, solo.html         ✏️ per-PRN RPC / leaderboard RPC
├── master.html, refer.html, receipt.html, up-premium.html, material-hub.html,
│   profile-edit.html, edit-profile-request.html, silver*.html, fy/second/third/fourth-year...,
│   SY-*.html, TY-*.html, note-*/book-*/answerkey*.html ...   ✏️ (~85 pages: script-tag swap)
│
├── quiz-host/join/live/leaderboard.html, quiz-common.js     ⚠️ ORIGINAL (tumhara faisla)
├── *-arena.html (12), battle-arena.html, battle arena.html, mcq-file.html   ⚠️ ORIGINAL (Firestore rooms)
├── answer.html                         ⚠️ ORIGINAL (Answer Keys page, Firebase pe; browser se expiry pe role reset likhta hai)
│
└── 🗑 REMOVED: backend.js (stale public duplicate), firebase-messaging-sw.js (FCM),
              payment-gateway.html (dead code), lib/referral.js (logic ab SQL mein)
```
★ = naya, ✏️ = badla hua, ⚠️ = jaan-bujhkar original

---

## 3. Jo COMPLETE hua (code likha + mock tests)

**Phase 0: Audit.** 123 files, 3 Firebase services, security bugs ki list (neeche).

**Phase 1: Auth.** Email/PRN login, signup (profile DB trigger se), forgot password (`reset-password.html`), master login. Passwords ab sirf Supabase Auth mein.

**Phase 2: Payments (Cashfree).** Login zaroori, price DB se, Cashfree API se verify, signed webhook (raw body), idempotent premium + referral commission. Purane URLs same.

**Phase 4: Backend API.** `api/backend.js` ke saare 38 actions Supabase pe:
- Identity sirf token se (body ke `prn/uid/adminPrn/idToken` ignore).
- Role rules server pe + DB functions mein; moderator admin ko promote/demote nahi kar sakta.
- Stored passwords ab kahin return nahi hote (`master-list-users` pehle dikhata tha).
- Atomic referral withdraw/process (DB transaction), notices targeting + per-user read state.

**Phase 5: Pages.** 93 pages ek compat layer (`js/sbz-legacy.js`) se Supabase pe: `users`, `premium`, `site_config`, SY/TY content reads + realtime. Alag se: `certificate.html` (poora score table download hona band), `solo.html` (leaderboard RPC, masked PRN), `master.html` (password row hata di), privacy policy text.

**Security fixes jo purane code mein the:** plaintext password RTDB mein; client-controlled amount; `verify-payment` URL pe bharosa; webhook signature mismatch risk; unauthenticated role changes (`demote-role`, `submit-score` etc.); poora solo leaderboard public API key se download; PRN-by-body identity.

---

## 4. Jo BAAKI hai (kitna, kyun)

### 🔴 A. Go-live se pehle zaroori
| # | Kaam | Size |
|---|---|---|
| 1 | SQL `001–004` real Supabase pe run karke errors theek karna (abhi kabhi run nahi hui) | S |
| 2 | **Data migration script** (Firebase export → Supabase): users→auth+profiles, premium→subscriptions, payments, notices, content (`SY/TY/management`→`resources`), referrals, solo scores, revaluation. **Abhi likhi hi nahi gayi.** | **L** |
| 3 | Purane users ka safe transfer (decision: password-reset email ya hash import) | M |
| 4 | **Real end-to-end testing**: auth, Cashfree sandbox, har page browser mein (visual QA). Abhi sirf mock tests hue hain | **L** |
| 5 | `resources.min_tier` data migration mein set karna (sem4/notes/piqs → gold) warna premium content DB-level pe gated nahi hoga, sirf UI-level pe | S |
| 6 | **Alag project `manager-public`** (admin dashboard): wo abhi bhi RTDB mein notices/content likhta hai. Unhe Supabase pe lana padega (payment approval ka koi hissa ab nahi bacha) | M–L |

### 🟠 B. Tumhare faisle ki wajah se Firebase pe (abhi bhi 23 files)
- **Quiz** (6 files: `quiz-host/join/live/leaderboard.html`, `quiz-common.js`, `api/quiz.js`)
- **Arena/battle** (13 files: 12 `*-arena.html`, battle pages, `mcq-file.html`; Firestore `rooms`)
- ⚠️ **Asar:** ye sab Firebase Auth login maangte hain. Naye Supabase login wale users ko ye "logged-out" dikhayenge. Jab tak inka decision nahi hota, ye features naye users ke liye kaam nahi karenge. Options: (1) inhe bhi migrate karna, (2) Firebase-Supabase bridge.
- `lib/helpers.js`, `lib/legacy-rooms.js`, `firebase-admin` package aur Firebase env vars inhi ki wajah se rahenge.

### 🟡 C. Baaki items
| Item | Detail |
|---|---|
| `answer.html` | Answer Keys page: RTDB se role padhta hai aur expiry par browser se `users/premium` likhta hai (insecure, Firebase pe). Naye Supabase login ke saath kaam nahi karega. **Supabase pe port karna** (sirf profile read; expiry DB khud handle karta hai) |
| **Social Mode** | `social-mode.html` ka apna alag Supabase project hai (`users`, `follows` tables, Firebase UID se keyed). Naye UUID se mapping/migrate karna padega. **Naya project banao, isi ko reuse mat karo** |
| Push notifications | Web FCM hata diya (stub). Web Push (VAPID) abhi nahi bana; native app ke token `register-token` ab save nahi karta |
| Private PDFs | Signed-URL Edge Function nahi bana; abhi `external_url` (Drive/Cloudinary) chal raha hai |
| Hardening | PRN→email lookup public hai (enumeration): server-side PRN login chahiye; CAPTCHA (client token support nahi hai); rate limits |
| Cleanup | Sab migrate hone ke baad `firebase-admin`, Firebase env, final grep, Cloudinary ko Supabase Storage se badalna (optional) |

---

## 5. Setup (test project pe)

1. **Naya Supabase project** banao (region Mumbai). Social Mode wala project reuse mat karo.
2. SQL Editor mein **order se**: `001` → `002` → `003` → `004`. Error aaye to message save karo.
3. **Auth:** Email enabled, "Confirm email" **OFF**, Site URL set, Redirect URLs mein `https://<domain>/reset-password` (+ preview URL). **Custom SMTP lagao** (default email bahut limited). **CAPTCHA abhi ON mat karo.**
4. `js/supabase-config.js` mein Project URL + **anon** key.
5. **Vercel env:** `SUPABASE_URL`, `SUPABASE_ANON_KEY` (server ko bhi chahiye), `SUPABASE_SERVICE_ROLE_KEY` (sirf server), `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, `CASHFREE_WEBHOOK_SECRET`, `CASHFREE_ENV`, `SITE_URL`, `CLOUDINARY_*`. Firebase vars tab tak rakho jab tak quiz/arena Firebase pe hain.
6. `npm install`; **sirf preview/branch pe deploy.**
7. Pehla master: normal signup, phir SQL: `update public.profiles set role='master' where email='tumhara@email.com';`
8. Cashfree sandbox test ke liye pages mein `Cashfree({mode:"production"})` ko `"sandbox"` karo.

**Test checklist:** signup → profile row; PRN/email login; reset password; master login; sandbox payment → `orders/payments/subscriptions/profiles.tier`; duplicate webhook; devtools se amount badalna (DB price lagni chahiye); notices; solo leaderboard; certificate lookup.

---

## 6. Behaviour changes (jaan lo)
1. Payment bina login nahi; typed PRN login wale account se match hona chahiye; staff ko 403.
2. `verify-prn`, `get-revaluation-score` ab sirf **apni** PRN ke liye (staff sab ke liye). Pehle koi bhi kisi ki PRN dekh sakta tha.
3. Revaluation upload/delete ab sirf admin+; list sirf staff+.
4. Moderator apne se upar/barabar rank ko modify nahi kar sakta.
5. Branch select: free overwrite (purane jaisa).
6. Expiry ab DB check karta hai; client ka `demote-role` sirf apna expired tier saaf karta hai.
7. Cutover ke waqt pending orders grant nahi honge. Low-traffic time pe deploy karo.
8. Cashfree ko ab asli email/mobile jaata hai.
9. Solo leaderboard realtime ki jagah 20 sec refresh.
10. Plan prices pages mein display ke liye hardcoded hain; badalne ho to `plans` table + dono pages.

## 6b. Payments: sirf automatic (webhook)
- **Manual payment approval poora hata diya:** `manager.html` delete; `premium-get.html` ka admin-crown/PRN sheet (jo nonexistent `SY-payment-approval` kholta tha) aur `up-premium.html` ka "APPROVAL Panel" card hata diya. `master.html` ka approval section **payment ka nahi**, profile-edit requests ka hai, wo rakha gaya.
- Premium sirf `fulfill_order()` se milta hai, jo (a) signed Cashfree webhook ya (b) return-URL par Cashfree se seedha verify ke baad chalta hai. Dono idempotent hain.
- Webhook ab `PAYMENT_FAILED` / `USER_DROPPED` par unpaid order ko `failed` mark karta hai (baad mein success aaye to phir bhi grant hota hai).
- **Abhi nahi hai:** refund webhook (refund par premium apne aap band nahi hota), aur `expire_subscriptions()` schedule nahi hai (access expiry `tier_expires_at` se chalti hai, ye sirf safai hai).
- Cashfree dashboard mein webhook URL `/api/webhook` (aur FY ke liye `/api/webhook-fy1`) set karo; `CASHFREE_WEBHOOK_SECRET` wahi hona chahiye jisse Cashfree sign karta hai.

## 7. Pehle se maujood bugs (maine nahi chhue)
- `fy.html` ek action `submit-solo-score` call karta hai jo backend mein kabhi tha hi nahi.

## 8. Aage ka roadmap (suggested order)
1. SQL real project pe run + fix → 2. data migration script → 3. end-to-end test + page QA → 4. `manager-public` + Social Mode → 5. **quiz/arena ka faisla** → 6. push, hardening, cleanup + final Firebase grep.

**Tumhare 4 faisle chahiye:** (1) purane users: reset-email ya hash import? (2) quiz/arena kab aur kaise? (3) `answer.html` Supabase pe port karna? (manager.html / approval panel hata diye gaye hain) (4) cutover ka time/downtime.

---

## 📌 Update (Oct 2026) — status sudhaar

- ✅ `scripts/migrate-firebase-to-supabase.js` **repo mein hai** (438 lines, default DRY-RUN). Upar jo likha tha "data migration script nahi bani" wo purana hai. **Par ise abhi bhi kisi asli data par run nahi kiya gaya** — pehle test Supabase par `--from-json=rtdb-export.json` se dry-run karo.
- ⚠️ `supabase/migrations/001…004.sql` is repo ke zip mein **nahi** mili. Unhe repo mein `supabase/migrations/` mein commit karo (`.vercelignore` unhe deploy se hata deta hai, repo mein rakhna safe hai).
- ✅ Naye tests `tests/` mein (CORS, rate limit, XSS helper, SRI tool, visitor counter): `npm test`. Payments/backend wale 61 mock tests is zip mein nahi the — agar tumhare paas hain to `tests/` mein wapas daalo.
- ✅ Payment ke liye checklist + automatic safety script: `docs/PAYMENT-SANDBOX-TEST.md`, `scripts/payment-smoke.js`.
- ✅ Firebase rules check: `docs/FIREBASE-RULES.md`, `scripts/check-firebase-rules.js`.
- ❌ Ab bhi baaki: asli Supabase/Cashfree sandbox par end-to-end test, data migration ka asli run, quiz/arena ka Firebase se hatna.
