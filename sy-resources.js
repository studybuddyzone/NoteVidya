/*
  Second-Year shared config — Question Bank & Answer Bank.

  Ek hi jagah par saari branches (AIML / CS / ENTC / Civil) ki semester-wise subject list
  aur tier rules rakhe gaye hain, taaki SY-aiml, SY-cs, SY-entc aur second-year.html
  sab same data use karein. Naya subject add karna ho to sirf yahin add karo.

  Needs: subject-pdf-list-modal.js (openSubjectPicker) loaded before use.

  Tiers
    PYQ           → Gold    (gold, diamond, admin roles)
    Question Bank → Gold    (gold, diamond, admin roles)
    Answer Bank   → Gold    (gold, diamond, admin roles)

  Categories (dashboard Management upload ki category se match hoti hain)
    PYQ           → 'pyq'
    Question Bank → 'question-bank'
    Answer Bank   → 'answer-bank' + 'answer-key'
  Notes → 'notes' (Gold+) — user ki branch ke Semester 3 + Semester 4 subjects.
  Question Bank / Answer Bank / PYQ mein 'notes' category kabhi mix nahi hoti.
*/
(function () {
  const ADMIN_ROLES = ['admin', 'superadmin', 'super admin', 'super-admin', 'master'];

  const SECTIONS = {
    notes: {
      key: 'notes',
      label: 'Notes',
      tier: 'gold',
      categories: ['notes'],
      noGeneral: true, // sirf Semester 3 + Semester 4 dikhao
      roles: ['gold', 'diamond'].concat(ADMIN_ROLES),
    },
    pyq: {
      key: 'pyq',
      label: 'PYQ',
      tier: 'gold',
      categories: ['pyq'],
      roles: ['gold', 'diamond'].concat(ADMIN_ROLES),
    },
    questionBank: {
      key: 'questionBank',
      label: 'Question Bank',
      tier: 'gold',
      categories: ['question-bank'],
      roles: ['gold', 'diamond'].concat(ADMIN_ROLES),
    },
    answerBank: {
      key: 'answerBank',
      label: 'Answer Bank',
      tier: 'gold',
      categories: ['answer-bank', 'answer-key'],
      roles: ['gold', 'diamond'].concat(ADMIN_ROLES),
    },
  };

  // `name` MUST match the subject name used on the Same Third / Same Fourth
  // pages (that is the key files are uploaded under in the dashboard).
  const BRANCHES = {
    aiml: {
      code: 'AIML',
      title: 'AIML',
      general: { name: 'AIML', label: 'AIML — General' },
      sem3: [
        'Engineering Mathematics-III', 'Data Structures', 'Discrete Mathematics',
        'Artificial Intelligence', 'Prompt Engineering', 'Universal Human Values-II',
        'Life of Chhatrapati Shivaji Maharaj',
      ],
      sem4: [
        'Intro to Operating Systems', 'Data Analytics', 'Probability and Statistics',
        'Full Stack Development', 'Life of Dr. Babasaheb Ambedkar',
      ],
    },
    cs: {
      code: 'CS',
      title: 'CSE',
      general: { name: 'CS', label: 'CSE — General' },
      sem3: [
        'Engineering Mathematics-III', 'Data Structures', 'Discrete Mathematics',
        'Object-Oriented Programming', 'Digital Electronics', 'Universal Human Values-II',
        'Life of Chhatrapati Shivaji Maharaj',
      ],
      sem4: [
        'Design and Analysis of Algorithms', 'Computer Architecture and Organisation',
        'Probability and Statistics', 'Python Programming', 'Life of Dr. Babasaheb Ambedkar',
      ],
    },
    entc: {
      code: 'ENTC',
      title: 'ENTC',
      general: { name: 'ENTC', label: 'ENTC — General' },
      sem3: [
        'Engineering Mathematics-III', 'Electronic Devices & Circuits', 'Digital Electronics',
        'Open Elective Bucket', 'MDM Bucket',
        'Employability & Skill Dev. / Innovation & Entrepreneurship',
        'Life of Chhatrapati Shivaji Maharaj', 'Universal Human Values II',
      ],
      sem4: [
        'Signals and Systems', 'Microprocessors', 'Network Theory', 'MDM Bucket',
        'Patents and IPR', 'Open Elective Bucket',
        'Life of Bharatratna Dr. Babasaheb Ambedkar',
      ],
    },
    civil: {
      code: 'CIVIL',
      title: 'Civil',
      general: { name: 'CIVIL', label: 'Civil — General' },
      sem3: [
        'Engineering Mathematics-III', 'Mechanics of Solids', 'Surveying', 'Building Construction',
        'Open Elective-I', 'Multi-Disciplinary Minor-I', 'Constitution of India',
        'Life of Dr. Babasaheb Ambedkar', 'Modern Indian Language',
      ],
      sem4: [
        'Structural Mechanics-I', 'Concrete Technology', 'Hydraulics Engineering',
        'Building Planning & Drawing', 'Open Elective-II', 'Multi-Disciplinary Minor-II',
        'Universal Human Values-II', 'Life of Chhatrapati Shivaji Maharaj',
        'Entrepreneurship Development Process',
      ],
    },
  };

  function roleHasAccess(role, sectionKey) {
    const sec = SECTIONS[sectionKey];
    if (!sec) return false;
    return sec.roles.indexOf(String(role || '').toLowerCase().trim()) !== -1;
  }

  // Profile mein branch alag-alag format mein save ho sakti hai (AIML / ai-ml / CSE / E&TC ...).
  const BRANCH_ALIASES = {
    aiml: ['aiml', 'ai/ml', 'ai-ml', 'ai ml', 'ai/ml & ai/ds', 'aids', 'ai/ds', 'aiml & aids', 'artificial intelligence', 'artificial intelligence & machine learning'],
    cs: ['cs', 'cse', 'computer science', 'computer science & engineering', 'computer science and engineering', 'computer engineering'],
    entc: ['entc', 'e&tc', 'etc', 'extc', 'electronics & telecommunication', 'electronics and telecommunication', 'electronics & telecom', 'electronics and telecommunication engineering'],
    civil: ['civil', 'civil engineering', 'civil engg', 'civil engg.', 'civil engineering (civil)'],
  };
  function normBranch(branch) {
    const b = String(branch || '').toLowerCase().trim();
    if (BRANCHES[b]) return b;
    const keys = Object.keys(BRANCH_ALIASES);
    for (let i = 0; i < keys.length; i++) {
      if (BRANCH_ALIASES[keys[i]].indexOf(b) !== -1) return keys[i];
    }
    return '';
  }

  function openSection(sectionKey, branch) {
    const b = normBranch(branch);
    const sec = SECTIONS[sectionKey];
    if (!b || !sec) return false;
    const cfg = BRANCHES[b];
    if (typeof window.openSubjectPicker !== 'function') {
      alert('Subject list script load nahi hui. Internet check karke page reload karein.');
      return false;
    }
    window.openSubjectPicker(
      sec.categories,
      (sec.noGeneral ? [] : [{ title: 'General', items: [cfg.general] }]).concat([
        { title: 'Semester 3', items: cfg.sem3 },
        { title: 'Semester 4', items: cfg.sem4 },
      ]),
      cfg.title + ' ' + sec.label
    );
    return true;
  }

  // ── DEMO ─────────────────────────────────────────────────────────────────
  // Demo = free sample files. Admin dashboard se upload karte waqt category me "-demo" lagao:
  //   notes-demo / question-bank-demo / answer-bank-demo / pyq-demo   (aur min_tier = free/null rakho,
  //   warna database (RLS) non-gold user se file chhupa dega).
  // sem: 3 | 4 | 'all'  — kis semester ke subjects ka demo dikhana hai.
  function openDemo(sectionKey, branch, sem) {
    const b = normBranch(branch);
    const sec = SECTIONS[sectionKey];
    if (!b || !sec) return false;
    if (typeof window.openDemoList !== 'function') {
      alert('Demo script load nahi hui. Internet check karke page reload karein.');
      return false;
    }
    const cfg = BRANCHES[b];
    let items = [];
    if (sem === 3) items = cfg.sem3.slice();
    else if (sem === 4) items = cfg.sem4.slice();
    else items = [cfg.general].concat(cfg.sem3, cfg.sem4);
    const semLabel = sem === 3 ? ' — Semester 3' : sem === 4 ? ' — Semester 4' : '';
    window.openDemoList(
      sec.categories.map(function (c) { return c + '-demo'; }),
      items,
      cfg.title + ' ' + sec.label + semLabel + ' (Demo)'
    );
    return true;
  }

  window.SY_RESOURCES = {
    openDemo: openDemo,
    SECTIONS: SECTIONS,
    BRANCHES: BRANCHES,
    ADMIN_ROLES: ADMIN_ROLES,
    hasBranch: function (branch) { return !!normBranch(branch); },
    normBranch: normBranch,
    roleHasAccess: roleHasAccess,
    openNotes: function (branch) { return openSection('notes', branch); },
    openPYQ: function (branch) { return openSection('pyq', branch); },
    openQuestionBank: function (branch) { return openSection('questionBank', branch); },
    openAnswerBank: function (branch) { return openSection('answerBank', branch); },
  };
})();
