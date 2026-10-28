const { makeNotices } = require("../lib/notices-handler");
const { admin, getUserFromRequest } = require("../lib/supabase-admin");
const { withRateLimit } = require("../lib/rate-limit");
module.exports = withRateLimit(makeNotices({ admin, getUserFromRequest }), { name: "notices", max: 60, windowSec: 60 });
