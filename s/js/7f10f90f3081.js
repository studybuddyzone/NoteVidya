
  // ── Page shell: figure out which dashboard sent us here, before the
  // Social Mode script below runs (it reads window.SM_YEAR_CODE at
  // load time to scope admin notices / push registration correctly). ──
  (function () {
    const params = new URLSearchParams(window.location.search);
    const yearParam = (params.get('year') || 'fy').toLowerCase();
    const YEAR_MAP = {
      fy:     { code: 'first',  page: 'fy' },
      first:  { code: 'first',  page: 'fy' },
      sy:     { code: 'second', page: 'second-year' },
      second: { code: 'second', page: 'second-year' },
      ty:     { code: 'third',  page: 'third-year' },
      third:  { code: 'third',  page: 'third-year' }
    };
    const match = YEAR_MAP[yearParam] || YEAR_MAP.fy;
    window.SM_YEAR_CODE = match.code;
    window.SM_RETURN_URL = match.page;

        // Performance Monitoring — free, real-user load-time tracking,
        // viewable in Supabase Console → Build → Performance (no laptop
        // or devtools needed). Purely observational, doesn't touch any
        // existing logic or data.
  })();
