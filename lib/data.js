// Demo data for the Canopi end-to-end demo. All names, courses and figures are sample data.

export const INSTITUTION = {
  id: 'inst_northfield',
  name: 'Northfield State University',
  type: 'College',
  campus: { label: 'Main campus (demo coordinates)', lat: 39.9568, lng: -86.0139, radiusMiles: 10 },
  plan: { name: 'Annual institution plan', term: '2026-27', renews: '2027-08-01', educatorSeats: 40, creditsPerSeat: 1200 },
  lms: 'Canvas',
};

export const COURSES = [
  { id: 'bio112', code: 'BIO 112', title: 'Intro to Biology', students: 142, educator: 'BIO 112 Professor', subject: 'Biology' },
  { id: 'econ201', code: 'ECON 201', title: 'Microeconomics', students: 118, educator: 'ECON 201 Professor', subject: 'Economics' },
  { id: 'math151', code: 'MATH 151', title: 'Calculus I', students: 165, educator: 'MATH 151 Professor', subject: 'Mathematics' },
  { id: 'eng104', code: 'ENG 104', title: 'Composition', students: 96, educator: 'ENG 104 Instructor', subject: 'English' },
  { id: 'chem101', code: 'CHEM 101', title: 'General Chemistry', students: 131, educator: 'CHEM 101 Professor', subject: 'Chemistry' },
  { id: 'psyc110', code: 'PSYC 110', title: 'Intro to Psychology', students: 204, educator: 'PSYC 110 Professor', subject: 'Psychology' },
];

export const TERM_START = '2026-08-24'; // Monday of Week 1
export const CURRENT_WEEK = 6; // today falls in Week 6; professors plan Week 7 next
export const PLAN_WEEK = 7;

export const SAMPLE_SYLLABUS = `BIO 112 Intro to Biology, Fall 2026

Week 1: Scientific method - observation, hypothesis, controlled experiments
Week 2: Chemistry of life - atoms, water, pH
Week 3: Macromolecules - carbohydrates, lipids, proteins, nucleic acids
Week 4: Cell structure - organelles, prokaryotes vs eukaryotes
Week 5: Membranes and transport - diffusion, osmosis, active transport
Week 6: Cellular respiration - glycolysis, Krebs cycle, electron transport chain, fermentation, ATP
Week 7: Photosynthesis - light reactions, Calvin cycle, chloroplasts
Week 8: Midterm review
Week 9: Cell division - mitosis, meiosis
Week 10: Mendelian genetics - Punnett squares, dominance, inheritance
Week 11: DNA replication - double helix, replication fork
Week 12: Gene expression - transcription, translation
Week 13: Evolution - natural selection, speciation
Week 14: Ecology - food webs, energy flow, ecosystems
Week 15: Final review`;

export const STRATEGIES = [
  { id: 'visual', label: 'Visual and animated' },
  { id: 'real', label: 'Real-world examples' },
  { id: 'step', label: 'Step-by-step' },
  { id: 'demo', label: 'Hands-on demos' },
  { id: 'story', label: 'Storytelling' },
  { id: 'exam', label: 'Exam prep' },
  { id: 'myth', label: 'Common misconceptions' },
];

export const AGE_GROUPS = [
  { id: 'ms', label: 'Middle school (grades 6 to 8)', short: 'Grades 6-8' },
  { id: 'hs', label: 'High school (grades 9 to 12)', short: 'Grades 9-12' },
  { id: 'col', label: 'College (18 to 22)', short: 'College' },
  { id: 'adult', label: 'Adult learners', short: 'Adult' },
];

export const LEVELS = [
  { id: 'intro', label: 'First exposure to the topic', short: 'Intro' },
  { id: 'build', label: 'Building on the basics', short: 'Building' },
  { id: 'adv', label: 'Advanced, applying it', short: 'Advanced' },
];

export const PLATFORMS = [
  { id: 'tiktok', label: 'TikTok', feed: 'For You feed' },
  { id: 'youtube', label: 'YouTube', feed: 'Shorts feed' },
  { id: 'meta', label: 'Instagram', feed: 'Reels' },
];

// ---------- library generator (deterministic) ----------
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function seeded(str) { return (hash(str) % 10000) / 10000; }

const lc = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const uc = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const TEMPLATES = {
  visual: { t: (x) => `${uc(x)}, animated in under a minute`, h: '@learnvisual', r: 'Professor', len: 54 },
  real: { t: (x) => `Where ${lc(x)} shows up in everyday life`, h: '@realworldlearn', r: 'Professor', len: 58 },
  step: { t: (x) => `${uc(x)}, one step at a time`, h: '@stepwise.edu', r: 'Teacher', len: 49 },
  demo: { t: (x) => `A quick demo that makes ${lc(x)} click`, h: '@demoroom', r: 'Teacher', len: 41 },
  story: { t: (x) => `The discovery story behind ${lc(x)}`, h: '@storyfirsttalks', r: 'Speaker', len: 78 },
  exam: { t: (x) => `${uc(x)}: four exam questions, answered fast`, h: '@examready', r: 'Teacher', len: 57 },
  myth: { t: (x) => `Three things students get wrong about ${lc(x)}`, h: '@clearitup.edu', r: 'Professor', len: 46 },
};

const PLATFORM_ROTATION = ['youtube', 'tiktok', 'meta'];
const LEVEL_IDS = ['intro', 'build', 'adv'];

export function parseSyllabusLines(text) {
  const weeks = [];
  const re = /^\s*(?:week|wk)\s*(\d{1,2})\s*[:.\-)]\s*(.+)$/i;
  for (const raw of String(text || '').split(/\r?\n/)) {
    const m = raw.match(re);
    if (!m) continue;
    const week = Number(m[1]);
    const rest = m[2].trim();
    const [titlePart, topicsPart] = rest.split(/\s+[-–]\s+/);
    const title = (titlePart || rest).trim();
    const topics = topicsPart ? topicsPart.split(/,|;/).map((s) => s.trim()).filter(Boolean) : [];
    weeks.push({ week, title, topics });
  }
  weeks.sort((a, b) => a.week - b.week);
  return weeks;
}

function buildLibrary() {
  const weeks = parseSyllabusLines(SAMPLE_SYLLABUS).filter((w) => !/review/i.test(w.title));
  const lib = [];
  weeks.forEach((w) => {
    STRATEGIES.forEach((s, si) => {
      [0, 1].forEach((k) => {
        const tpl = TEMPLATES[s.id];
        const level = LEVEL_IDS[(si + k + w.week) % 3];
        const short = k === 1;
        const id = `v_${w.week}_${s.id}_${k}`;
        lib.push({
          id,
          title: (short ? 'Quick take: ' : '') + tpl.t(w.title),
          handle: tpl.h,
          role: tpl.r,
          platform: PLATFORM_ROTATION[(si + k + w.week) % 3],
          lengthSec: short ? Math.round(tpl.len * 0.5) : tpl.len + (si % 3) * 3,
          subject: 'Biology',
          topic: w.title,
          keywords: [w.title, ...w.topics].join(' ').toLowerCase(),
          strategy: s.id,
          level,
          ages: (si + w.week) % 4 === 0 ? ['hs', 'col'] : ['col', 'adult'],
          baseViews: 2000 + Math.round(seeded(id) * 48000),
        });
      });
    });
    w.topics.forEach((sub, i) => {
      const s = STRATEGIES[(i + w.week) % STRATEGIES.length];
      const id = `v_${w.week}_sub_${i}`;
      lib.push({
        id,
        title: `${uc(sub)} explained in 45 seconds`,
        handle: TEMPLATES[s.id].h,
        role: TEMPLATES[s.id].r,
        platform: PLATFORM_ROTATION[(i + w.week) % 3],
        lengthSec: 45,
        subject: 'Biology',
        topic: w.title,
        keywords: `${sub} ${w.title}`.toLowerCase(),
        strategy: s.id,
        level: LEVEL_IDS[i % 3],
        ages: ['hs', 'col', 'adult'],
        baseViews: 2000 + Math.round(seeded(id) * 48000),
      });
    });
  });
  // targeted videos for a common Week 6 confusion
  lib.push({
    id: 'v_6_fix_1', title: 'Krebs cycle vs. electron transport chain: where each one happens', handle: '@clearitup.edu', role: 'Professor',
    platform: 'tiktok', lengthSec: 55, subject: 'Biology', topic: 'Cellular respiration',
    keywords: 'krebs cycle electron transport chain mitochondria matrix inner membrane cellular respiration mixing up difference',
    strategy: 'myth', level: 'intro', ages: ['hs', 'col', 'adult'], baseViews: 31200,
  });
  lib.push({
    id: 'v_6_fix_2', title: 'Quick take: Krebs cycle vs. electron transport chain', handle: '@stepwise.edu', role: 'Teacher',
    platform: 'youtube', lengthSec: 28, subject: 'Biology', topic: 'Cellular respiration',
    keywords: 'krebs cycle electron transport chain difference cellular respiration mixing up',
    strategy: 'step', level: 'intro', ages: ['hs', 'col', 'adult'], baseViews: 18400,
  });
  lib.push({
    id: 'v_7_fix_1', title: 'Light reactions vs. Calvin cycle: what each one makes', handle: '@clearitup.edu', role: 'Professor',
    platform: 'tiktok', lengthSec: 52, subject: 'Biology', topic: 'Photosynthesis',
    keywords: 'light reactions calvin cycle confusing difference thylakoid stroma atp nadph glucose photosynthesis',
    strategy: 'myth', level: 'intro', ages: ['hs', 'col', 'adult'], baseViews: 27400,
  });
  lib.push({
    id: 'v_7_fix_2', title: 'Quick take: light reactions vs. Calvin cycle', handle: '@stepwise.edu', role: 'Teacher',
    platform: 'youtube', lengthSec: 29, subject: 'Biology', topic: 'Photosynthesis',
    keywords: 'light reactions calvin cycle confusing difference photosynthesis',
    strategy: 'step', level: 'intro', ages: ['hs', 'col', 'adult'], baseViews: 16900,
  });
  return lib;
}

export const LIBRARY = buildLibrary();

export function weekDates(week, termStart = TERM_START) {
  const start = new Date(`${termStart}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() + (week - 1) * 7);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 4);
  const iso = (d) => d.toISOString().slice(0, 10);
  return { start: iso(start), end: iso(end) };
}

export function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months.at(m - 1)} ${d}`;
}
