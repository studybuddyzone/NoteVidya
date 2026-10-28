// Refer & Earn — shared logic (referral code, linking, commission credit).
// Sirf Firebase Admin SDK use hota hai (rules bypass) — client is data ko
// seedha kabhi nahi chhoota, sab kuch api/backend.js ke through jaata hai.
//
// RTDB layout:
//   users/{prn}/referCode                 -> user ka apna refer code
//   users/{prn}/referredBy                -> jis user ke code se register hua (uski PRN)
//   refer_codes/{CODE}                    -> PRN (unique code -> owner)
//   referrals/{referrerPrn}/wallet        -> { balance, totalEarned, totalWithdrawn, subscriptionCount }
//   referrals/{referrerPrn}/referred/{prn}-> { name, joinedAt, subscribed, amount, commission }
//   referrals/{referrerPrn}/withdrawals/{id} -> withdrawal summary (user ko dikhane ke liye)
//   referral_payments/{orderId}           -> idempotency guard (ek order ka commission ek hi baar)
//   referral_withdrawals/{id}             -> full request (master page ke liye, QR url ke saath)
//   site_config/referral                  -> { percent, minWithdraw }  (master badal sakta hai)

const { admin } = require("./helpers");

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // O/0, I/1 jaise confusing chars nahi
const DEFAULT_PERCENT = 10;
const DEFAULT_MIN_WITHDRAW = 50;

// Eligibility: sirf jiska Gold (ya usse upar Diamond) membership abhi chal rahi ho
// wahi refer code bana sakta hai / use kar sakta hai. Sirf Gold rakhna ho to
// list ko ["gold"] kar dein.
const ELIGIBLE_ROLES = ["gold", "diamond"];

// roleExpires set na ho (master ne haath se role diya ho) to active maana jaata hai;
// set ho aur nikal chuka ho to eligible nahi.
function isEligibleUser(user) {
  if (!user) return false;
  const role = (user.role || "").toString().toLowerCase();
  if (!ELIGIBLE_ROLES.includes(role)) return false;
  const exp = Number(user.roleExpires);
  if (user.roleExpires !== undefined && user.roleExpires !== null && Number.isFinite(exp) && exp <= Date.now()) return false;
  return true;
}

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

function generateCode() {
  let s = "SBZ";
  for (let i = 0; i < 5; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return s;
}

function normalizeCode(code) {
  return (code || "").toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

async function getReferralConfig() {
  const snap = await admin.database().ref("site_config/referral").once("value");
  const cfg = snap.val() || {};
  const percent = Number(cfg.percent);
  const minWithdraw = Number(cfg.minWithdraw);
  return {
    percent: Number.isFinite(percent) && percent >= 0 ? percent : DEFAULT_PERCENT,
    minWithdraw: Number.isFinite(minWithdraw) && minWithdraw > 0 ? minWithdraw : DEFAULT_MIN_WITHDRAW
  };
}

// User ka refer code (pehli baar dashboard khulne par "activate" ho jaata hai)
async function ensureReferCode(prn) {
  const db = admin.database();
  const userSnap = await db.ref(`users/${prn}`).once("value");
  if (!isEligibleUser(userSnap.val())) return null; // Gold membership nahi => code nahi
  const codeRef = db.ref(`users/${prn}/referCode`);
  const existing = (await codeRef.once("value")).val();
  if (existing) return existing;

  for (let i = 0; i < 15; i++) {
    const code = generateCode();
    const tx = await db.ref(`refer_codes/${code}`).transaction((cur) => (cur === null ? prn : undefined));
    if (tx.committed) {
      await codeRef.set(code);
      return code;
    }
  }
  throw new Error("Refer code generate nahi ho paaya, dobara try karein.");
}

// Code -> referrer (PRN + naam). Nahi mila to null.
async function lookupReferrer(code) {
  const c = normalizeCode(code);
  if (!c) return null;
  const db = admin.database();
  const prn = (await db.ref(`refer_codes/${c}`).once("value")).val();
  if (!prn) return null;
  const userSnap = await db.ref(`users/${prn}`).once("value");
  if (!userSnap.exists()) return null;
  const u = userSnap.val() || {};
  if (!isEligibleUser(u)) return null; // membership khatam => code kaam nahi karega
  return { prn, name: u.name || u.displayName || "Student", mobile: (u.mobile || "").toString(), code: c };
}

// Naye user ko referrer se jodta hai. Kabhi throw nahi karta — registration ko
// refer ki wajah se fail nahi hona chahiye.
async function linkReferral(newPrn, newName, newMobile, code) {
  try {
    const referrer = await lookupReferrer(code);
    if (!referrer) return { linked: false, reason: "invalid_code" };
    if (referrer.prn === newPrn) return { linked: false, reason: "self_referral" };
    if (newMobile && referrer.mobile && referrer.mobile === newMobile) return { linked: false, reason: "same_mobile" };

    const db = admin.database();
    await db.ref().update({
      [`users/${newPrn}/referredBy`]: referrer.prn,
      [`users/${newPrn}/referredByCode`]: referrer.code,
      [`referrals/${referrer.prn}/referred/${newPrn}`]: {
        name: newName || "Student",
        joinedAt: Date.now(),
        subscribed: false,
        amount: 0,
        commission: 0
      }
    });
    return { linked: true, referrerPrn: referrer.prn };
  } catch (err) {
    console.error("linkReferral error:", err);
    return { linked: false, reason: "error" };
  }
}

// Payment verify hone ke baad call hota hai. Ek orderId ka commission sirf ek
// hi baar milta hai (verify-payment aur webhook dono call karein tab bhi).
// Kabhi throw nahi karta — payment flow ko kabhi block nahi karta.
async function creditReferralForPayment(prn, orderId, amount) {
  if (!prn || !orderId) return { credited: false, reason: "missing_params" };
  const db = admin.database();
  let walletDone = false;

  try {
    const guard = await db.ref(`referral_payments/${orderId}`).transaction((cur) =>
      cur === null ? { prn, status: "processing", at: Date.now() } : undefined
    );
    if (!guard.committed) return { credited: false, reason: "already_processed" };

    const referrerPrn = (await db.ref(`users/${prn}/referredBy`).once("value")).val();
    if (!referrerPrn) {
      await db.ref(`referral_payments/${orderId}`).update({ status: "no_referrer" });
      return { credited: false, reason: "no_referrer" };
    }

    const refUser = (await db.ref(`users/${referrerPrn}`).once("value")).val();
    if (!isEligibleUser(refUser)) {
      await db.ref(`referral_payments/${orderId}`).update({ status: "referrer_not_eligible", referrerPrn });
      return { credited: false, reason: "referrer_not_eligible" };
    }

    const paid = Number(amount) || 0;
    const { percent } = await getReferralConfig();
    const commission = round2((paid * percent) / 100);

    await db.ref(`referrals/${referrerPrn}/wallet`).transaction((w) => {
      w = w || {};
      return {
        balance: round2((w.balance || 0) + commission),
        totalEarned: round2((w.totalEarned || 0) + commission),
        totalWithdrawn: round2(w.totalWithdrawn || 0),
        subscriptionCount: (w.subscriptionCount || 0) + 1
      };
    });
    walletDone = true;

    await db.ref(`referrals/${referrerPrn}/referred/${prn}`).transaction((r) => {
      r = r || {};
      return {
        name: r.name || "Student",
        joinedAt: r.joinedAt || Date.now(),
        subscribed: true,
        amount: round2((r.amount || 0) + paid),
        commission: round2((r.commission || 0) + commission),
        lastSubscribedAt: Date.now()
      };
    });

    await db.ref(`referral_payments/${orderId}`).set({
      prn, referrerPrn, amount: paid, percent, commission, status: "credited", at: Date.now()
    });
    return { credited: true, referrerPrn, commission, percent };
  } catch (err) {
    console.error("creditReferralForPayment error:", err);
    // Wallet credit hua hi nahi tha to guard hata do taaki dobara try ho sake
    if (!walletDone) {
      try { await db.ref(`referral_payments/${orderId}`).remove(); } catch (e) {}
    }
    return { credited: false, reason: "error", error: err.message };
  }
}

module.exports = {
  round2, normalizeCode, getReferralConfig, ensureReferCode,
  lookupReferrer, linkReferral, creditReferralForPayment, isEligibleUser, ELIGIBLE_ROLES,
  DEFAULT_PERCENT, DEFAULT_MIN_WITHDRAW
};
