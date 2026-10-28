// lib/event-config.js — single source of truth for the Swayam event (server enforces it, pages read it via /api/event-info).
const MB = 1024 * 1024;

const cfg = module.exports = {
  REGISTRATION_CLOSES_AT: "2026-10-20T00:00:00+05:30",   // 20 Oct, 12:00 AM IST. Edit this to change the deadline.

  // Competition categories. The participant picks ONE at registration; /event-submit then shows the matching upload option.
  //   submit.kind "file": exts = allowed extensions, max = size limit in bytes (keep <= 3 MB, Vercel body limit is 4.5 MB)
  //   submit.kind "link": a public https link (YouTube / Instagram / Google Drive)
  //   topics: placeholders, edit freely (ids unique, lowercase, no spaces). Empty list = no topic step for that category.
  DEFAULT_TRACK: "coding",   // registrations made before categories existed were all coding
  TRACKS: {
    "coding": {
      title: "Coding", icon: "fa-code",
      desc: "Beginner-friendly website बनाओ। HTML, CSS, JavaScript, Node.js या Python, कुछ भी चलेगा।",
      submit: { kind: "file", exts: ["zip"], max: 1 * MB, label: "Project की zip file", hint: "Project folder को zip करें। Maximum 1 MB।" },
      topics: [
        { id: "portfolio", title: "Personal Portfolio", desc: "अपने बारे में, skills और projects दिखाने वाली वेबसाइट।" },
        { id: "club-site", title: "College Club ya Event Website", desc: "किसी club या event की जानकारी, schedule और contact वाली वेबसाइट।" },
        { id: "cafe-menu", title: "Cafe ya Restaurant Menu", desc: "Menu, prices और timings दिखाने वाली सुंदर वेबसाइट।" },
        { id: "study-planner", title: "Study Planner ya To-do App", desc: "Tasks जोड़ने, पूरे करने और हटाने वाला छोटा app।" },
        { id: "mini-quiz", title: "Mini Quiz App", desc: "सवाल, options और अंत में score दिखाने वाला quiz।" },
        { id: "landing-page", title: "Product Landing Page", desc: "किसी भी product या service का आकर्षक landing page।" },
      ],
    },
    "poster-design": {
      title: "Poster Designing", icon: "fa-palette",
      desc: "दिए गए theme पर एक असरदार poster design करो।",
      submit: { kind: "file", exts: ["png", "jpg", "jpeg", "pdf"], max: 3 * MB, label: "Poster की image या PDF", hint: "PNG, JPG या PDF। Maximum 3 MB।" },
      topics: [
        { id: "digital-india", title: "Digital India", desc: "Technology से बदलता भारत।" },
        { id: "save-environment", title: "Save the Environment", desc: "पर्यावरण बचाने का संदेश देता poster।" },
        { id: "campus-fest", title: "College Fest", desc: "किसी college fest के लिए promotional poster।" },
      ],
    },
    "poster-presentation": {
      title: "Poster Presentation", icon: "fa-person-chalkboard",
      desc: "किसी विषय पर poster बनाकर उसे समझाने के लिए presentation तैयार करो।",
      submit: { kind: "file", exts: ["pdf", "pptx"], max: 3 * MB, label: "Presentation file", hint: "PDF या PPTX। Maximum 3 MB।" },
      topics: [
        { id: "ai-in-daily-life", title: "AI in Daily Life", desc: "रोज़मर्रा की ज़िंदगी में AI का इस्तेमाल।" },
        { id: "renewable-energy", title: "Renewable Energy", desc: "सौर, पवन और दूसरी हरित ऊर्जा।" },
        { id: "startup-idea", title: "Student Startup Idea", desc: "एक student-friendly startup का विचार।" },
      ],
    },
    "logo-design": {
      title: "Logo Design", icon: "fa-pen-nib",
      desc: "किसी brand या club के लिए अपना खुद का logo बनाओ।",
      submit: { kind: "file", exts: ["png", "jpg", "jpeg", "svg", "pdf"], max: 3 * MB, label: "Logo file", hint: "PNG, JPG, SVG या PDF। Maximum 3 MB।" },
      topics: [
        { id: "studybuddyzone", title: "StudyBuddyZone", desc: "StudyBuddyZone के लिए नया logo।" },
        { id: "college-club", title: "College Club", desc: "अपने पसंद के किसी club का logo।" },
        { id: "imaginary-brand", title: "Imaginary Brand", desc: "अपनी कल्पना का कोई नया brand।" },
      ],
    },
    "reel-making": {
      title: "Reel Making", icon: "fa-film",
      desc: "60 सेकंड के अंदर एक creative reel या short video बनाओ।",
      submit: { kind: "link", label: "Reel का link", hint: "YouTube, Instagram या Google Drive का public link। Link खुला (view access ON) होना चाहिए।" },
      topics: [
        { id: "day-in-campus", title: "A Day in Campus", desc: "College की ज़िंदगी का एक दिन।" },
        { id: "study-tips", title: "Study Tips", desc: "पढ़ाई के काम आने वाले tips।" },
        { id: "festival-vibes", title: "Festival Vibes", desc: "त्योहार का माहौल।" },
      ],
    },
    "photography": {
      title: "Photography", icon: "fa-camera",
      desc: "अपने कैमरे या फ़ोन से एक बेहतरीन photo खींचो।",
      submit: { kind: "file", exts: ["jpg", "jpeg", "png"], max: 3 * MB, label: "Photo", hint: "JPG या PNG। Maximum 3 MB (बड़ी photo को compress करें)।" },
      topics: [
        { id: "nature", title: "Nature", desc: "प्रकृति की कोई खूबसूरत झलक।" },
        { id: "street-life", title: "Street Life", desc: "सड़क और शहर की ज़िंदगी।" },
        { id: "my-campus", title: "My Campus", desc: "अपने college campus की photo।" },
      ],
    },
    "essay-writing": {
      title: "Essay Writing", icon: "fa-feather-pointed",
      desc: "दिए गए विषय पर अपने शब्दों में एक सोचा-समझा लेख लिखो।",
      submit: { kind: "file", exts: ["pdf", "docx"], max: 3 * MB, label: "Essay file", hint: "PDF या DOCX। Maximum 3 MB।" },
      topics: [
        { id: "tech-and-students", title: "Technology and Students", desc: "विद्यार्थियों पर technology का असर।" },
        { id: "my-dream-career", title: "My Dream Career", desc: "आप आगे क्या बनना चाहते हैं।" },
        { id: "future-of-education", title: "Future of Education", desc: "आने वाले कल की पढ़ाई।" },
      ],
    },
    "digital-art": {
      title: "Digital Art", icon: "fa-paintbrush",
      desc: "Digital माध्यम में अपनी कला का नमूना बनाओ।",
      submit: { kind: "file", exts: ["png", "jpg", "jpeg", "pdf"], max: 3 * MB, label: "Artwork file", hint: "PNG, JPG या PDF। Maximum 3 MB।" },
      topics: [
        { id: "my-hero", title: "My Hero", desc: "अपने हीरो का चित्र।" },
        { id: "fantasy-world", title: "Fantasy World", desc: "कल्पना की एक अलग दुनिया।" },
        { id: "free-choice", title: "Free Choice", desc: "अपनी पसंद का कोई भी विषय।" },
      ],
    },
  },


  // ---- Second event: Swayam (State Level) by Gramin Technical & Management Campus, directed by ASTRA club.
  // Only registration + details are live for it. Fee is enforced server-side in lib/event-handlers.js (EVENTS).
  GTMC_SLUG: "swayam-gtmc",
  GTMC_REGISTRATION_CLOSES_AT: "2026-10-20T00:00:00+05:30",   // edit to change the deadline
  GTMC_TRACKS: {
    "web-design": {
      title: "Web Designing", icon: "fa-laptop-code",
      desc: "दिए गए theme पर एक सुंदर और responsive website design करो।",
      submit: { kind: "file", exts: ["zip"], max: 1 * MB, label: "Website की zip file", hint: "Project folder को zip करें। Maximum 1 MB।" },
    },
  },
  // College level only: courses offered at GTMC and the years of each.
  GTMC_COURSES: {
    polytechnic: { title: "Polytechnic", years: [{ v: 1, t: "First Year" }, { v: 2, t: "Second Year" }, { v: 3, t: "Third Year (Final)" }] },
    engineering: { title: "Engineering", years: [{ v: 1, t: "First Year" }, { v: 2, t: "Second Year" }, { v: 3, t: "Third Year" }, { v: 4, t: "Fourth Year (Final)" }] },
  },
  gtmcCourseOf(id) { return Object.prototype.hasOwnProperty.call(cfg.GTMC_COURSES, id) ? cfg.GTMC_COURSES[id] : null; },
  gtmcYearOk(course, year) { const c = cfg.gtmcCourseOf(course); return !!c && c.years.some((y) => y.v === Number(year)); },
  gtmcCourses() { return Object.keys(cfg.GTMC_COURSES).map((id) => ({ id, ...cfg.GTMC_COURSES[id] })); },
  gtmcTrackOf(id) { return Object.prototype.hasOwnProperty.call(cfg.GTMC_TRACKS, id) ? cfg.GTMC_TRACKS[id] : null; },
  gtmcPublicTracks() {
    return Object.keys(cfg.GTMC_TRACKS).map((id) => { const t = cfg.GTMC_TRACKS[id]; return { id, title: t.title, icon: t.icon, desc: t.desc, submit: t.submit }; });
  },

  // Safe lookup (blocks "constructor" / "__proto__" as a track id)
  trackOf(id) { return Object.prototype.hasOwnProperty.call(cfg.TRACKS, id) ? cfg.TRACKS[id] : null; },

  // What the browser needs to draw categories (no secrets here).
  publicTracks() {
    return Object.keys(cfg.TRACKS).map((id) => {
      const t = cfg.TRACKS[id];
      return { id, title: t.title, icon: t.icon, desc: t.desc, submit: t.submit };
    });
  },

  // Phase switches are controlled from Vercel env vars, so you can turn them on later without editing code.
  phases(env) {
    return { topics_open: String(env.EVENT_TOPICS_OPEN) === "1", submit_open: String(env.EVENT_SUBMIT_OPEN) === "1" };
  },
};
