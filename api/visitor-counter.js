// api/visitor-counter.js — POST /api/visitor-counter  => +1 and returns { ok, count }
//                          GET  /api/visitor-counter  => returns { ok, count } (no increment)
// Reuses the Firebase Admin SDK already initialised in lib/helpers.js (FIREBASE_SERVICE_ACCOUNT_KEY).
const { makeVisitorCounter } = require("../lib/visitor-counter-handler");
const fb = require("../lib/helpers");

const { withRateLimit } = require("../lib/rate-limit");

const counter = makeVisitorCounter({
  getDb: () => {
    if (fb.initError) throw fb.initError;
    return fb.admin.database();
  },
});
module.exports = withRateLimit(counter, { name: "visitor", max: 30, windowSec: 60 });
