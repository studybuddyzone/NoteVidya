// api/backend.js — single action-router endpoint, now backed by Supabase.
// All logic lives in lib/backend-handlers.js (dependency-injected, unit-tested).
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});
const { makeBackend } = require("../lib/backend-handlers");
const { admin, getUserFromRequest, userClient } = require("../lib/supabase-admin");

const { handler } = makeBackend({
  admin, getUserFromRequest, userClientFor: userClient, cloudinary, env: process.env,
  // Firestore `rooms` (battle arena) is not migrated yet: Firebase is only loaded if this action runs.
  legacyRooms: (body, res) => require("../lib/legacy-rooms").handle(body, res),
});
const { withRateLimit } = require("../lib/rate-limit");
module.exports = withRateLimit(handler, { name: "backend", max: 120, windowSec: 60 });   // per IP; 38 actions share one budget
