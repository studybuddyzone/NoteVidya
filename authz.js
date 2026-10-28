// lib/authz.js — role model shared by the server code.
//
// Old Firebase data mixed staff level and paid tier in one `role` field
// ("gold", "admin", ...). In Postgres they are separate columns:
//   profiles.role  -> student | moderator | admin | superadmin | master   (staff level)
//   profiles.tier  -> silver | gold | diamond (+ tier_expires_at)          (paid access)
// legacyRole() collapses them back so existing pages that read `role` keep working.

const STAFF_ROLES = ["moderator", "admin", "superadmin", "master"];
const TIERS = ["silver", "gold", "diamond"];
const ROLE_WEIGHT = { master: 100, superadmin: 80, admin: 60, moderator: 40, diamond: 20, gold: 15, silver: 10, student: 0 };
const weight = (r) => (ROLE_WEIGHT[r] !== undefined ? ROLE_WEIGHT[r] : 0);

function tierActive(p, now = Date.now()) {
  return !!(p && p.tier && (!p.tier_expires_at || new Date(p.tier_expires_at).getTime() > now));
}
function legacyRole(p) {
  if (!p) return "student";
  if (p.role && p.role !== "student") return p.role;
  return tierActive(p) ? p.tier : "student";
}
// Columns to write for a legacy "newRole" value.
function roleFields(newRole, nowIso) {
  if (STAFF_ROLES.includes(newRole)) return { role: newRole };
  if (TIERS.includes(newRole)) return { role: "student", tier: newRole, tier_expires_at: null, premium_since: nowIso };
  return { role: "student", tier: null, tier_expires_at: null };   // "student"
}

module.exports = { STAFF_ROLES, TIERS, ROLE_WEIGHT, weight, tierActive, legacyRole, roleFields };
