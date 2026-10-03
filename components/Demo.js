'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { SAMPLE_SYLLABUS, TERM_START, CURRENT_WEEK, PLAN_WEEK, STRATEGIES, AGE_GROUPS, LEVELS, PLATFORMS, INSTITUTION, fmtDate } from '@/lib/data';

const STEPS = [
  { id: 'overview', label: 'The flow' },
  { id: 'setup', label: 'School setup' },
  { id: 'syllabus', label: 'Syllabus' },
  { id: 'recommend', label: 'Find videos' },
  { id: 'review', label: 'Review and accounts' },
  { id: 'promote', label: 'Push to feeds' },
  { id: 'students', label: 'Student feeds' },
  { id: 'results', label: 'Results' },
];

const STORE = 'canopi-demo-v3';
const LIFE = [
  ['committed', 'Credits held'],
  ['built', 'Campaign built'],
  ['submitted', 'Sent to platforms'],
  ['in_review', 'Platform review'],
  ['live', 'Live'],
  ['reporting', 'Reporting'],
  ['closed', 'Closed and settled'],
];
const STRUGGLES = { 6: 'Mixing up the Krebs cycle and the electron transport chain', 7: 'Confusing the light reactions with the Calvin cycle' };

const initial = () => ({
  step: 0,
  setup: { lms: 'Canvas', imported: false, courses: [] },
  syllabus: { text: SAMPLE_SYLLABUS, termStart: TERM_START, weeks: [] },
  playlist: {},
  accounts: { tiktok: { code: 'DEMO-SPARK-7G2K9Q', days: '30', connected: false }, youtube: { connected: false }, meta: { connected: false } },
  credits: { allotted: INSTITUTION.plan.creditsPerSeat, used: 0, held: 0, ledger: [] },
  campaign: null,
  lifeIdx: -1,
  metrics: null,
  settled: false,
  studentAge: 19,
  prefs: { used: false, strategies: ['visual', 'step', 'real'], level: 'intro', age: 'col', maxLength: 60 },
  chat: [],
});

import { api } from '@/lib/apiClient';
import { PARKER } from '@/lib/parker';

function settlePatch(p) {
  const c = p.campaign, m = p.metrics;
  if (!c || !m || p.settled) return {};
  return {
    settled: true, lifeIdx: 6,
    credits: {
      ...p.credits, held: Math.max(0, p.credits.held - c.credits), used: p.credits.used + m.spent,
      ledger: [...p.credits.ledger, { type: 'Settle', note: `${c.id} · spent across ${c.platforms.length} platform${c.platforms.length > 1 ? 's' : ''}`, amount: -m.spent }, { type: 'Release', note: `${c.id} · unspent hold returned`, amount: m.returned }],
    },
  };
}

function ParkerAvatar({ size = 28 }) {
  return <span className="pk-av" style={{ width: size, height: size, fontSize: size * 0.5 }} aria-hidden="true">P</span>;
}

function ParkerAssist({ s, up }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const logRef = useRef(null);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [s.chat.length, open]);
  async function ask(e) {
    e.preventDefault();
    const text = msg.trim();
    if (!text) return;
    setMsg('');
    up((p) => ({ chat: [...p.chat, { from: 'you', text }] }));
    setBusy(true);
    const wk = s.syllabus.weeks.find((w) => w.week === PLAN_WEEK);
    const m = s.metrics;
    const top = m ? [...m.series].sort((a, b) => b.rows.reduce((x, r) => x + r.views, 0) - a.rows.reduce((x, r) => x + r.views, 0))[0]?.label : null;
    const context = {
      week: PLAN_WEEK, weekTitle: wk?.title, allotted: s.credits.allotted,
      available: s.credits.allotted - s.credits.used - s.credits.held, prefs: s.prefs,
      campaignWeek: s.campaign?.week, metrics: m ? { views: m.totals.views, watchMin: m.totals.watchMin, top } : null,
    };
    const r = await api('/api/parker', { message: text, context });
    setBusy(false);
    up((p) => ({ chat: [...p.chat, { from: 'parker', text: r.ok ? r.data.reply : 'Connection dropped. Try again.' }] }));
  }
  return (
    <>
      {open && (
        <aside className="pk-pop" aria-label="Ask Parker">
          <div className="pk-head">
            <ParkerAvatar />
            <div style={{ minWidth: 0, flex: 1 }}><b>{PARKER.name}</b><div className="muted small">{PARKER.role}</div></div>
            <button className="mini" onClick={() => setOpen(false)} aria-label="Close Parker">Close</button>
          </div>
          <div className="pk-log" ref={logRef}>
            <p className="pk-msg">Ask about video picks, credits or results.</p>
            {s.chat.map((c, i) => <p key={i} className={c.from === 'you' ? 'pk-you' : 'pk-msg'}>{c.text}</p>)}
            {busy && <p className="pk-msg muted">Thinking...</p>}
          </div>
          <form className="pk-ask" onSubmit={ask}>
            <label htmlFor="askp" className="sr">Ask Parker</label>
            <input id="askp" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={`e.g. "What should I post for Week ${PLAN_WEEK}?"`} />
            <button className="primary" type="submit" disabled={busy}>Ask</button>
          </form>
          <p className="note" style={{ margin: 0 }}>Demo answers are scripted from the demo data.</p>
        </aside>
      )}
      <button className="pk-fab" onClick={() => setOpen((o) => !o)} aria-expanded={open}><ParkerAvatar size={24} />Ask Parker</button>
    </>
  );
}

const PLAY = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>;
const platFeed = (id) => ({ tiktok: 'TikTok', youtube: 'YouTube Short', meta: 'Instagram Reel' }[id] || id);
const num = (n) => Number(n || 0).toLocaleString('en-US');

function Mark() {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <g fill="var(--canopy)"><circle cx="36" cy="50" r="20" /><circle cx="60" cy="36" r="26" /><circle cx="84" cy="50" r="20" /><circle cx="48" cy="60" r="16" /><circle cx="72" cy="60" r="16" /><rect x="55.5" y="62" width="9" height="24" rx="2" /></g>
      <g fill="none" stroke="var(--canopy)" strokeWidth="4.5" strokeLinecap="round"><path d="M60 84C60 95 42 97 30 104" /><path d="M60 84V106" /><path d="M60 84C60 95 78 97 90 104" /></g>
      <g fill="var(--sun)"><circle cx="28" cy="105" r="6" /><circle cx="60" cy="108" r="6" /><circle cx="92" cy="105" r="6" /></g>
    </svg>
  );
}

export default function Demo() {
  const [s, setS] = useState(initial);
  const [ready, setReady] = useState(false);
  const timers = useRef([]);

  useEffect(() => {
    try { const raw = localStorage.getItem(STORE); if (raw) setS({ ...initial(), ...JSON.parse(raw) }); } catch {}
    setReady(true);
    return () => timers.current.forEach(clearTimeout);
  }, []);
  useEffect(() => { if (ready) { try { localStorage.setItem(STORE, JSON.stringify(s)); } catch {} } }, [s, ready]);

  const up = (patch) => setS((p) => ({ ...p, ...(typeof patch === 'function' ? patch(p) : patch) }));
  const go = (i) => { up({ step: i }); if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const reset = () => { timers.current.forEach(clearTimeout); try { localStorage.removeItem(STORE); } catch {} setS(initial()); };

  const doneMap = {
    overview: s.step > 0,
    setup: s.setup.imported,
    syllabus: s.syllabus.weeks.length > 0,
    recommend: Object.values(s.playlist).some((l) => l.some((v) => v.source === 'Recommended')),
    review: s.accounts.tiktok.connected || s.accounts.youtube.connected || s.accounts.meta.connected,
    promote: !!s.campaign,
    students: s.step > 6 && !!s.campaign,
    results: s.settled,
  };

  const View = [Overview, Setup, Syllabus, Recommend, Review, Promote, Students, Results][s.step];

  return (
    <>
      <header className="top">
        <div className="top-in">
          <div className="brand"><Mark /><b>canopi</b></div>
          <span className="tag">Demo · sample data</span>
          <span className="spacer" />
          <button className="ghost" onClick={reset}>Reset demo</button>
        </div>
        <nav className="steps" aria-label="Demo steps">
          {STEPS.map((st, i) => (
            <button key={st.id} className={`step ${doneMap[st.id] ? 'done' : ''}`} aria-current={s.step === i ? 'step' : undefined} onClick={() => go(i)}>
              <i>{doneMap[st.id] ? '✓' : i + 1}</i>{st.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="wrap">
        <View s={s} up={up} go={go} timers={timers} />
        <p className="foot">Canopi: an easy, consistent way to bring education and excitement into social media. Demo build with sample data. Platform adapters are simulated: they show the requests Canopi would send to TikTok, Google Ads and Meta, without calling them.</p>
      </main>
      <ParkerAssist s={s} up={up} />
    </>
  );
}

function Next({ go, to, label, disabled, hint }) {
  return (
    <div className="nextbar">
      <span className="muted small">{hint}</span>
      <button className="primary" disabled={disabled} onClick={() => go(to)}>{label}</button>
    </div>
  );
}

/* ---------------- 1. overview ---------------- */
function Overview({ go }) {
  const flow = [
    ['School connects', 'Admin links the LMS. Courses and the annual plan load.'],
    ['Professor uploads the syllabus', 'Parker reads it into weeks, dates and topics.'],
    ['Find the right videos', 'Parker ranks videos against how the professor teaches.'],
    ['Professor approves and connects accounts', 'Approve, pin, add their own links. Authorize TikTok, YouTube, Instagram.'],
    ['Push the week to student feeds', 'Credits run the videos in TikTok, YouTube Shorts and Instagram Reels near campus, timed to the syllabus.'],
    ['Students see it while they scroll', 'In their social feeds and the Canopi app.'],
    ['Results come back', 'Views, watch time and credits settled, by week.'],
  ];
  return (
    <section className="hero">
      <div>
        <div className="eyebrow">{INSTITUTION.name} · BIO 112 · Fall 2026</div>
        <h1 style={{ margin: '10px 0 14px' }}>An easy, consistent way to bring education and excitement into social media.</h1>
        <p>Follow one week of BIO 112 from syllabus to students' feeds. Canopi finds the right short videos for the week and pushes them into the TikTok, YouTube Shorts and Instagram Reels feeds students already scroll.</p>
        <div className="stats3" style={{ margin: '20px 0 22px' }}>
          <div className="stat"><b>7</b><span>steps, start to finish</span></div>
          <div className="stat"><b>3</b><span>social feeds plus the Canopi app</span></div>
          <div className="stat"><b>6</b><span>API endpoints the flow calls</span></div>
        </div>
        <button className="primary" onClick={() => go(1)}>Start the demo</button>
      </div>
      <ol className="flow">
        {flow.map(([b, t], i) => (
          <li key={b}><span className="num">{i + 1}</span><div><b>{b}</b><span>{t}</span></div></li>
        ))}
      </ol>
    </section>
  );
}

function Head({ role, eyebrow, title, lede }) {
  return (
    <div className="head">
      <div>
        {role && <div className="role">{role}</div>}
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="title">{title}</h1>
        {lede && <p className="lede">{lede}</p>}
      </div>
    </div>
  );
}

/* ---------------- 2. setup ---------------- */
function Setup({ s, up, go }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const plan = INSTITUTION.plan;
  async function connect() {
    setBusy(true); setErr('');
    const r = await api('/api/lms/import', { lms: s.setup.lms });
    setBusy(false);
    if (!r.ok) return setErr(r.data.error || 'Import failed.');
    up((p) => ({ setup: { ...p.setup, imported: true, courses: r.data.courses } }));
  }
  return (
    <>
      <Head role="School admin" eyebrow="Step 2 · School setup" title="Connect the school in one step" lede="The admin links the learning management system. Courses, enrollments and term dates come in automatically, and the annual plan sets every educator's credits." />
      <div className="grid2">
        <div className="panel">
          <h3>Learning management system</h3>
          <div className="row" style={{ alignItems: 'flex-end' }}>
            <div className="field" style={{ flex: '1 1 200px', marginBottom: 0 }}>
              <label htmlFor="lms">LMS</label>
              <select id="lms" value={s.setup.lms} onChange={(e) => up((p) => ({ setup: { ...p.setup, lms: e.target.value } }))}>
                <option>Canvas</option><option>Blackboard</option><option>Google Classroom</option>
              </select>
            </div>
            <button className="primary" onClick={connect} disabled={busy}>{busy ? 'Importing...' : s.setup.imported ? 'Re-import courses' : 'Connect and import courses'}</button>
          </div>
          {err && <div className="err">{err}</div>}
          {s.setup.imported && (
            <div className="scroll" style={{ marginTop: 16 }}>
              <p className="ok" style={{ margin: '0 0 8px' }}>{s.setup.courses.length} courses imported from {s.setup.lms}.</p>
              <table className="tbl">
                <thead><tr><th>Course</th><th>Title</th><th>Educator</th><th style={{ textAlign: 'right' }}>Students</th></tr></thead>
                <tbody>{s.setup.courses.map((c) => (
                  <tr key={c.id}><td><b>{c.code}</b></td><td>{c.title}</td><td className="muted">{c.educator}</td><td className="n">{c.students}</td></tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
        <div className="panel">
          <h3>{plan.name}, {plan.term}</h3>
          <div className="stats3">
            <div className="stat"><b>{plan.educatorSeats}</b><span>educator seats</span></div>
            <div className="stat"><b>{num(plan.creditsPerSeat)}</b><span>credits per educator, per year</span></div>
            <div className="stat"><b>{num(plan.educatorSeats * plan.creditsPerSeat)}</b><span>credits in the plan</span></div>
          </div>
          <p className="note">Renews {fmtDate(plan.renews)}, 2027. The school pays one annual subscription. Canopi pays the platforms out of it. Educators never pay and are never paid.</p>
          <p className="note">Campus targeting area: {INSTITUTION.campus.radiusMiles}-mile radius around {INSTITUTION.campus.label.toLowerCase()}.</p>
        </div>
      </div>
      <Next go={go} to={2} label="Next: professor uploads the syllabus" disabled={!s.setup.imported} hint={s.setup.imported ? 'Courses are in. BIO 112 is the course we follow.' : 'Import courses to continue.'} />
    </>
  );
}

/* ---------------- 3. syllabus ---------------- */
function Syllabus({ s, up, go }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function parse() {
    setBusy(true); setErr('');
    const r = await api('/api/syllabus/parse', { text: s.syllabus.text, termStart: s.syllabus.termStart });
    setBusy(false);
    if (!r.ok) return setErr(r.data.error || 'Parsing failed.');
    up((p) => ({ syllabus: { ...p.syllabus, weeks: r.data.weeks } }));
  }
  const weeks = s.syllabus.weeks;
  return (
    <>
      <Head role="BIO 112 Professor" eyebrow="Step 3 · Syllabus" title="Upload the syllabus once. Canopi plans the whole term." lede="Parker reads it into weeks, dates and topics. Those become the matching keys for the rest of the term." />
      <div className="grid2">
        <div className="panel">
          <h3>Syllabus</h3>
          <div className="field">
            <label htmlFor="syl">Syllabus text (edit it and read it again)</label>
            <textarea id="syl" value={s.syllabus.text} onChange={(e) => up((p) => ({ syllabus: { ...p.syllabus, text: e.target.value } }))} />
          </div>
          <div className="row" style={{ alignItems: 'flex-end' }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="ts">Term starts (Monday of Week 1)</label>
              <input id="ts" type="date" value={s.syllabus.termStart} onChange={(e) => up((p) => ({ syllabus: { ...p.syllabus, termStart: e.target.value } }))} />
            </div>
            <button className="primary" onClick={parse} disabled={busy}>{busy ? 'Reading...' : 'Read syllabus'}</button>
          </div>
          {err && <div className="err">{err}</div>}
        </div>
        <div className="panel">
          <h3>{weeks.length ? `${weeks.length} weeks found` : 'Your term, by week'}</h3>
          {!weeks.length && <p className="muted small">Read the syllabus to see the term laid out by week.</p>}
          <div className="weeks">
            {weeks.map((w) => (
              <div key={w.week} className={`wk ${w.week === CURRENT_WEEK ? 'now' : ''}`}>
                <span className="wn">Wk {w.week}</span>
                <div>
                  <b>{w.title}</b> <span className="muted small">{fmtDate(w.start)} to {fmtDate(w.end)}</span>
                  <div className="tp">{w.topics.map((t) => <span key={t} className="pill quiet">{t}</span>)}</div>
                </div>
                {w.week === CURRENT_WEEK ? <span className="pill sun">This week</span> : w.week === PLAN_WEEK ? <span className="pill">Planning next</span> : <span />}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Next go={go} to={3} label="Next: find videos" disabled={!weeks.length} hint={weeks.length ? `Week ${PLAN_WEEK} starts ${fmtDate(weeks.find((w) => w.week === PLAN_WEEK)?.start || '2026-10-05')}. We'll fill it next.` : 'Read the syllabus to continue.'} />
    </>
  );
}

/* ---------------- 4. recommend ---------------- */
function Recommend({ s, up, go }) {
  const weeks = s.syllabus.weeks;
  const defaultWeek = weeks.find((w) => w.week === PLAN_WEEK) ? PLAN_WEEK : weeks[0]?.week;
  const [week, setWeek] = useState(defaultWeek);
  const wk = weeks.find((w) => w.week === week);
  const [form, setForm] = useState(() => ({
    subject: 'Biology',
    topic: wk ? `${wk.title}: ${wk.topics.join(', ')}` : '',
    age: s.prefs.age, level: s.prefs.level, maxLength: s.prefs.maxLength,
    strategies: s.prefs.strategies,
    struggle: STRUGGLES[week] || '',
  }));
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const added = new Set((s.playlist[week] || []).map((v) => v.id));

  function pickWeek(w) {
    setWeek(w);
    const x = weeks.find((y) => y.week === w);
    setForm((f) => ({ ...f, topic: x ? `${x.title}: ${x.topics.join(', ')}` : '', struggle: STRUGGLES[w] || '' }));
    setRes(null);
  }
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggle = (id) => setForm((f) => ({ ...f, strategies: f.strategies.includes(id) ? f.strategies.filter((x) => x !== id) : [...f.strategies, id] }));
  async function run(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    const r = await api('/api/recommend', form);
    setBusy(false);
    if (!r.ok) return setErr(r.data.error || 'Recommendation failed.');
    setRes(r.data);
    up({ prefs: { used: true, strategies: form.strategies, level: form.level, age: form.age, maxLength: Number(form.maxLength) } });
  }
  function add(v) {
    up((p) => ({ playlist: { ...p.playlist, [week]: [...(p.playlist[week] || []), { ...v, source: 'Recommended', status: 'approved' }] } }));
  }
  if (!weeks.length) return <Missing go={go} to={2} what="Read the syllabus first." />;
  return (
    <>
      <Head role="BIO 112 Professor" eyebrow="Step 4 · Find videos" title="Find the right videos for the week" lede="Describe how you teach. Parker, the built-in assistant, ranks the library against your inputs and explains each pick." />
      <div className="grid2">
        <form className="panel" onSubmit={run}>
          <h3>Your inputs</h3>
          <div className="fgrid">
            <div className="field">
              <label htmlFor="rw">Syllabus week</label>
              <select id="rw" value={week} onChange={(e) => pickWeek(Number(e.target.value))}>
                {weeks.map((w) => <option key={w.week} value={w.week}>Week {w.week} · {w.title}</option>)}
              </select>
            </div>
            <div className="field"><label htmlFor="rs">Subject</label><input id="rs" value={form.subject} onChange={set('subject')} /></div>
          </div>
          <div className="field"><label htmlFor="rt">What students are studying</label><input id="rt" value={form.topic} onChange={set('topic')} /></div>
          <div className="fgrid">
            <div className="field"><label htmlFor="ra">Age group</label><select id="ra" value={form.age} onChange={set('age')}>{AGE_GROUPS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}</select></div>
            <div className="field"><label htmlFor="rl">Learning curve</label><select id="rl" value={form.level} onChange={set('level')}>{LEVELS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}</select></div>
            <div className="field"><label htmlFor="rm">Video length</label><select id="rm" value={form.maxLength} onChange={set('maxLength')}><option value={30}>Up to 30 seconds</option><option value={60}>Up to 60 seconds</option><option value={90}>Up to 90 seconds</option></select></div>
            <div className="field"><label htmlFor="rg">Where students struggle (optional)</label><input id="rg" value={form.struggle} onChange={set('struggle')} /></div>
          </div>
          <div className="field">
            <span className="lbl">Teaching strategies</span>
            <div className="chips">{STRATEGIES.map((x) => <button type="button" key={x.id} className="chip" aria-pressed={form.strategies.includes(x.id)} onClick={() => toggle(x.id)}>{x.label}</button>)}</div>
          </div>
          <button className="primary" type="submit" disabled={busy}>{busy ? 'Searching...' : 'Find videos'}</button>
          {err && <div className="err">{err}</div>}
        </form>
        <div className="panel">
          <h3>{res ? `Top ${res.results.length} picks for Week ${week}` : 'Recommended videos'}</h3>
          {!res && <p className="muted small">Run the search to rank the library against your inputs.</p>}
          {res && <p className="note" style={{ marginTop: -6, marginBottom: 6 }}>Ranked by Parker across {num(res.searched)} library videos.</p>}
          {res && !res.results.length && <p className="muted small">Nothing matched. Try a broader topic, a longer length, or more strategies.</p>}
          {res && res.results.map((v) => (
            <div className="vid" key={v.id}>
              <div className="thumb">{PLAY}</div>
              <div className="vmain">
                <div className="vt">{v.title}</div>
                <div className="vm">{v.handle} · {v.role} · {platFeed(v.platform)} · {v.lengthSec}s</div>
                <div className="tags"><span className="pill">{STRATEGIES.find((x) => x.id === v.strategy)?.label}</span><span className="pill quiet">{LEVELS.find((l) => l.id === v.level)?.short}</span></div>
                <div className="why"><b className="pk-tag">Why:</b> {v.reasons.join(' ')}</div>
              </div>
              <div className="match">{v.match}% match<div className="bar"><i style={{ width: `${v.match}%` }} /></div></div>
              <button type="button" className={`mini ${added.has(v.id) ? 'on' : ''}`} disabled={added.has(v.id)} onClick={() => add(v)}>{added.has(v.id) ? `Added to Wk ${week}` : `Add to Wk ${week}`}</button>
            </div>
          ))}
        </div>
      </div>
      <Next go={go} to={4} label="Next: review and connect accounts" disabled={!(s.playlist[week] || []).length} hint={(s.playlist[week] || []).length ? `${(s.playlist[week] || []).length} videos in Week ${week}.` : 'Add at least one pick to continue.'} />
    </>
  );
}

function Missing({ go, to, what }) {
  return (
    <div className="panel" style={{ marginTop: 28 }}>
      <h3>{what}</h3>
      <button className="primary" onClick={() => go(to)}>Go to {STEPS[to].label}</button>
    </div>
  );
}

/* ---------------- 5. review ---------------- */
function Review({ s, up, go }) {
  const weeksWith = Object.keys(s.playlist).map(Number).filter((w) => s.playlist[w].length).sort((a, b) => a - b);
  const [week, setWeek] = useState(weeksWith.includes(PLAN_WEEK) ? PLAN_WEEK : weeksWith[0]);
  const [link, setLink] = useState('');
  const [title, setTitle] = useState('');
  const [err, setErr] = useState('');
  if (!weeksWith.length) return <Missing go={go} to={3} what="Add recommended videos to a week first." />;
  const list = s.playlist[week] || [];
  const setStatus = (id, status) => up((p) => ({ playlist: { ...p.playlist, [week]: p.playlist[week].map((v) => (v.id === id ? { ...v, status } : v)) } }));
  const remove = (id) => up((p) => ({ playlist: { ...p.playlist, [week]: p.playlist[week].filter((v) => v.id !== id) } }));
  function addOwn(e) {
    e.preventDefault(); setErr('');
    let platform = '';
    if (/tiktok\.com/i.test(link)) platform = 'tiktok'; else if (/youtu\.?be/i.test(link)) platform = 'youtube'; else if (/instagram\.com/i.test(link)) platform = 'meta';
    if (!platform) return setErr('Paste a TikTok, YouTube or Instagram link.');
    if (!title.trim()) return setErr('Add a title so students know what the video covers.');
    const v = { id: `own_${Date.now().toString(36)}`, title: title.trim(), handle: '@bio112prof', role: 'Professor', platform, lengthSec: 60, topic: s.syllabus.weeks.find((w) => w.week === week)?.title || '', strategy: 'real', level: 'intro', source: 'Your video', status: 'approved', url: link.trim() };
    up((p) => ({ playlist: { ...p.playlist, [week]: [...(p.playlist[week] || []), v] } }));
    setLink(''); setTitle('');
  }
  const acc = s.accounts;
  const setAcc = (k, patch) => up((p) => ({ accounts: { ...p.accounts, [k]: { ...p.accounts[k], ...patch } } }));
  const anyConnected = acc.tiktok.connected || acc.youtube.connected || acc.meta.connected;
  return (
    <>
      <Head role="BIO 112 Professor" eyebrow="Step 5 · Review and accounts" title="Approve the week and connect your channels" lede="The professor stays in control: pin the best video, block anything off-message, add their own. Connecting accounts once lets Canopi push their posts to students under their own name." />
      <div className="grid2">
        <div className="col">
          <div className="panel">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
              <h3 style={{ margin: 0 }}>Week {week} playlist</h3>
              <select aria-label="Week" value={week} onChange={(e) => setWeek(Number(e.target.value))} className="mini">{weeksWith.map((w) => <option key={w} value={w}>Week {w}</option>)}</select>
            </div>
            {list.map((v) => (
              <div className="vid" key={v.id}>
                <div className="thumb" style={v.status === 'blocked' ? { background: 'var(--ink-muted)' } : undefined}>{PLAY}</div>
                <div className="vmain">
                  <div className="vt">{v.title}</div>
                  <div className="vm">{v.handle} · {platFeed(v.platform)} · {v.source}</div>
                </div>
                <span className={`pill ${v.status === 'pinned' ? 'sun' : v.status === 'blocked' ? 'alert' : ''}`}>{v.status === 'pinned' ? 'Pinned' : v.status === 'blocked' ? 'Blocked' : 'Approved'}</span>
                <div className="row" style={{ gap: 6 }}>
                  {v.status !== 'pinned' && v.status !== 'blocked' && <button className="mini" onClick={() => setStatus(v.id, 'pinned')}>Pin</button>}
                  {v.status === 'pinned' && <button className="mini" onClick={() => setStatus(v.id, 'approved')}>Unpin</button>}
                  {v.status === 'blocked' ? <button className="mini" onClick={() => setStatus(v.id, 'approved')}>Restore</button> : <button className="mini" onClick={() => setStatus(v.id, 'blocked')}>Block</button>}
                  <button className="mini" onClick={() => remove(v.id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
          <form className="panel" onSubmit={addOwn}>
            <h3>Add your own video</h3>
            <div className="fgrid">
              <div className="field"><label htmlFor="ol">TikTok, YouTube or Instagram link</label><input id="ol" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://www.youtube.com/shorts/..." /></div>
              <div className="field"><label htmlFor="ot">Title</label><input id="ot" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Chloroplasts in 40 seconds" /></div>
            </div>
            <button className="secondary" type="submit">Add to Week {week}</button>
            {err && <div className="err">{err}</div>}
          </form>
        </div>
        <div className="panel">
          <h3>Connected accounts</h3>
          <div className="acct">
            <span className="logo">TT</span>
            <div>
              <b>TikTok</b><div className="muted small">Spark Ads code from your post's ad settings. Lets Canopi run that post as an ad from your handle.</div>
              {!acc.tiktok.connected && (
                <div className="fgrid" style={{ marginTop: 8 }}>
                  <div className="field" style={{ marginBottom: 0 }}><label htmlFor="sc">Spark code</label><input id="sc" value={acc.tiktok.code} onChange={(e) => setAcc('tiktok', { code: e.target.value })} /></div>
                  <div className="field" style={{ marginBottom: 0 }}><label htmlFor="sd">Authorized for</label><select id="sd" value={acc.tiktok.days} onChange={(e) => setAcc('tiktok', { days: e.target.value })}><option value="7">7 days</option><option value="30">30 days</option><option value="60">60 days</option><option value="365">365 days</option></select></div>
                </div>
              )}
            </div>
            {acc.tiktok.connected ? <button className="mini on" onClick={() => setAcc('tiktok', { connected: false })}>Connected</button> : <button className="mini" disabled={!acc.tiktok.code.trim()} onClick={() => setAcc('tiktok', { connected: true })}>Connect</button>}
          </div>
          <div className="acct">
            <span className="logo">YT</span>
            <div><b>YouTube</b><div className="muted small">Link your channel. Canopi promotes your Shorts through Google Ads and keeps a course playlist.</div></div>
            <button className={`mini ${acc.youtube.connected ? 'on' : ''}`} onClick={() => setAcc('youtube', { connected: !acc.youtube.connected })}>{acc.youtube.connected ? 'Connected' : 'Link channel'}</button>
          </div>
          <div className="acct">
            <span className="logo">IG</span>
            <div><b>Instagram</b><div className="muted small">Allow partnership ads so your Reels can run from your handle.</div></div>
            <button className={`mini ${acc.meta.connected ? 'on' : ''}`} onClick={() => setAcc('meta', { connected: !acc.meta.connected })}>{acc.meta.connected ? 'Allowed' : 'Allow'}</button>
          </div>
          <p className="note">Demo connections are simulated. In production each one runs the platform's own sign-in and permission screen, and Canopi stores only an encrypted token.</p>
        </div>
      </div>
      <Next go={go} to={5} label="Next: push to student feeds" disabled={!anyConnected} hint={anyConnected ? 'Accounts connected.' : 'Connect at least one account to continue.'} />
    </>
  );
}

/* ---------------- 6. promote ---------------- */
function Promote({ s, up, go, timers }) {
  const weeks = s.syllabus.weeks;
  const weekNums = Object.keys(s.playlist).map(Number).filter((w) => (s.playlist[w] || []).some((v) => v.status !== 'blocked')).sort((a, b) => a - b);
  const [week, setWeek] = useState(weekNums.includes(PLAN_WEEK) ? PLAN_WEEK : weekNums[0]);
  const options = (s.playlist[week] || []).filter((v) => v.status !== 'blocked').sort((a, b) => (b.status === 'pinned') - (a.status === 'pinned'));
  const [videoId, setVideoId] = useState(options[0]?.id);
  const connected = PLATFORMS.filter((p) => s.accounts[p.id].connected).map((p) => p.id);
  const [plats, setPlats] = useState(connected);
  const [credits, setCredits] = useState(150);
  const [minAge, setMinAge] = useState(18);
  const [errs, setErrs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState(null);
  const available = s.credits.allotted - s.credits.used - s.credits.held;
  const w = weeks.find((x) => x.week === week);
  const video = options.find((v) => v.id === videoId) || options[0];

  if (!weekNums.length) return <Missing go={go} to={4} what="Approve at least one video first." />;

  async function submit(e) {
    e.preventDefault(); setErrs([]); setBusy(true);
    const auth = { tiktok: s.accounts.tiktok.connected ? s.accounts.tiktok.code : null, youtube: s.accounts.youtube.connected ? 'yt_demo_shorts_id' : null, meta: s.accounts.meta.connected };
    const r = await api('/api/campaigns', { videoId: video?.id, video, week, credits: Number(credits), platforms: plats, minAge: Number(minAge), courseCode: 'BIO 112', availableCredits: available, auth });
    setBusy(false);
    if (!r.ok) return setErrs(r.data.errors || [r.data.error || 'Campaign rejected.']);
    const c = r.data.campaign;
    timers.current.forEach(clearTimeout); timers.current = [];
    up((p) => ({
      campaign: c, lifeIdx: 0, metrics: null, settled: false,
      credits: { ...p.credits, held: p.credits.held + c.credits, ledger: [...p.credits.ledger, { type: 'Hold', note: `${c.id} · Week ${c.week}`, amount: -c.credits }] },
    }));
    setTab(c.platforms[0].platform);
    [1, 2, 3, 4].forEach((i) => timers.current.push(setTimeout(() => up({ lifeIdx: i }), i * 900)));
  }
  const c = s.campaign;
  const togglePlat = (id) => setPlats((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const shownTab = c ? (c.platforms.find((p) => p.platform === tab) || c.platforms[0]) : null;
  return (
    <>
      <Head role="BIO 112 Professor" eyebrow="Step 6 · Push to feeds" title="Push the week into students' feeds" lede="Commit credits and Canopi builds a campaign for each platform, checks the guardrails, and pushes the video to students near campus during the syllabus week." />
      <div className="grid2">
        <div className="col">
          <form className="panel" onSubmit={submit}>
            <h3>New promotion</h3>
            <div className="fgrid">
              <div className="field"><label htmlFor="pw">Syllabus week</label><select id="pw" value={week} onChange={(e) => { const n = Number(e.target.value); setWeek(n); setVideoId((s.playlist[n] || []).find((v) => v.status !== 'blocked')?.id); }}>{weekNums.map((n) => <option key={n} value={n}>Week {n} · {weeks.find((x) => x.week === n)?.title}</option>)}</select></div>
              <div className="field"><label htmlFor="pv">Video</label><select id="pv" value={video?.id} onChange={(e) => setVideoId(e.target.value)}>{options.map((v) => <option key={v.id} value={v.id}>{v.status === 'pinned' ? 'Pinned: ' : ''}{v.title}</option>)}</select></div>
              <div className="field"><label htmlFor="pc">Credits to commit</label><input id="pc" type="number" min="10" step="10" value={credits} onChange={(e) => setCredits(e.target.value)} /></div>
              <div className="field"><label htmlFor="pa">Minimum age</label><select id="pa" value={minAge} onChange={(e) => setMinAge(e.target.value)}><option value={18}>18 and up</option><option value={16}>16 and up</option><option value={13}>13 and up</option></select></div>
            </div>
            <div className="field">
              <span className="lbl">Platforms</span>
              <div className="chips">
                {PLATFORMS.map((p) => {
                  const ok = connected.includes(p.id);
                  return <button type="button" key={p.id} className="chip" disabled={!ok} aria-pressed={plats.includes(p.id)} onClick={() => togglePlat(p.id)} title={ok ? '' : 'Connect this account in step 5'}>{p.label} {p.feed}{ok ? '' : ' (not connected)'}</button>;
                })}
              </div>
            </div>
            <table className="tbl" style={{ marginBottom: 14 }}>
              <tbody>
                <tr><td className="muted">Audience</td><td>Ages {minAge}+ within {INSTITUTION.campus.radiusMiles} miles of campus, interested in {w?.title.toLowerCase() || 'the topic'}</td></tr>
                <tr><td className="muted">Flight</td><td>{w ? `${fmtDate(w.start)} to ${fmtDate(w.end)}, evenings and weekends` : ''}</td></tr>
                <tr><td className="muted">Split</td><td>{plats.length ? `About ${Math.floor(Number(credits) / plats.length)} credits per platform` : 'Choose a platform'}</td></tr>
              </tbody>
            </table>
            <button className="primary" type="submit" disabled={busy}>{busy ? 'Building campaigns...' : 'Commit credits and submit'}</button>
            {errs.length > 0 && <div className="err">{errs.map((x) => <div key={x}>{x}</div>)}</div>}
            <p className="note">Try a minimum age of 16 to see the guardrail reject it. Demo assumption: 1 credit equals $1 of ad spend.</p>
          </form>
        </div>
        <div className="col">
          <div className="panel">
            <h3>Your credits</h3>
            <div className="stats3">
              <div className="stat"><b>{num(s.credits.allotted)}</b><span>allotted for 2026-27</span></div>
              <div className="stat"><b>{num(s.credits.held + s.credits.used)}</b><span>held or used</span></div>
              <div className="stat"><b>{num(available)}</b><span>available</span></div>
            </div>
            <div className="bar" style={{ height: 8, marginTop: 12 }}><i style={{ width: `${((s.credits.held + s.credits.used) / s.credits.allotted) * 100}%` }} /></div>
          </div>
          {c && (
            <div className="panel">
              <h3>Campaign {c.id}</h3>
              <div className="life">{LIFE.map(([k, l], i) => <span key={k} className={i < s.lifeIdx ? 'done' : i === s.lifeIdx ? 'cur' : ''}>{l}</span>)}</div>
              <div className="tabs">{c.platforms.map((p) => <button key={p.platform} className={`mini ${shownTab?.platform === p.platform ? 'on' : ''}`} onClick={() => setTab(p.platform)}>{p.label} · {p.credits} cr</button>)}</div>
              {shownTab && (
                <>
                  <p className="small muted" style={{ margin: '0 0 8px' }}>Request the {shownTab.label} adapter sends (simulated, ID {shownTab.externalId}):</p>
                  <pre className="code">{JSON.stringify(shownTab.payload, null, 2)}</pre>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <Next go={go} to={6} label="Next: see it in student feeds" disabled={!c || s.lifeIdx < 4} hint={!c ? 'Submit a promotion to continue.' : s.lifeIdx < 4 ? 'Waiting for the campaign to go live...' : 'Live. Students near campus start seeing it.'} />
    </>
  );
}

/* ---------------- 7. students ---------------- */
function Students({ s, up, go }) {
  const c = s.campaign;
  if (!c) return <Missing go={go} to={5} what="Submit a promotion first." />;
  const v = c.video;
  const minor = s.studentAge < 18;
  const inCamp = (id) => c.platforms.some((p) => p.platform === id);
  const phones = [
    { id: 'canopi', label: 'Canopi feed', top: ['Canopi', `BIO 112 · Wk ${c.week}`], social: false },
    { id: 'tiktok', label: 'TikTok For You', top: ['Following  |  For You', ''], social: true },
    { id: 'youtube', label: 'YouTube Shorts', top: ['Shorts', ''], social: true },
    { id: 'meta', label: 'Instagram Reels', top: ['Reels', ''], social: true },
  ];
  return (
    <>
      <Head role="Student" eyebrow="Step 7 · Student feeds" title="Learning shows up where students already scroll" lede="Same video, four places. Students 18 and up near campus see it in their social feeds. Every student in the course sees it in the Canopi app, matched to their exact week." />
      <div className="row" style={{ marginBottom: 16 }}>
        <span className="lbl">Viewing as a student aged</span>
        <button className={`chip`} aria-pressed={!minor} onClick={() => up({ studentAge: 19 })}>19</button>
        <button className={`chip`} aria-pressed={minor} onClick={() => up({ studentAge: 16 })}>16 (dual-credit student)</button>
      </div>
      <div className="phones">
        {phones.map((ph) => {
          const off = ph.social && (!inCamp(ph.id) || minor);
          return (
            <div key={ph.id} className={`phone ${off ? 'off' : ''}`}>
              <div className="ph-label">{ph.label}</div>
              <div className={`screen ${ph.social ? 'dark' : 'brand'}`}>
                <div className="sc-top"><span>{ph.top[0]}</span><span>{ph.top[1]}</span></div>
                <div className="sc-mid">{v.topic || 'This week'}</div>
                <div className="sc-bot">
                  {ph.social ? <span className="spons">Sponsored · with Canopi</span> : <span className="spons">Matched to BIO 112, Week {c.week}</span>}
                  <b>{v.handle}</b>
                  {v.title}
                                    <span className="cta">{ph.social ? 'More for BIO 112 on Canopi' : 'Save for exam review'}</span>
                </div>
                {ph.social && minor && <div className="blocked">Not shown. Paid campaigns target 18+. This student gets the video in the Canopi feed.</div>}
                {ph.social && !minor && !inCamp(ph.id) && <div className="blocked">Not in this campaign. Connect this account and include it to reach students here.</div>}
              </div>
            </div>
          );
        })}
      </div>
      <p className="note">Feeds are simulated. Placement and labels follow how each platform shows a creator's post run as an ad: the educator's handle, a Sponsored label, and a link back to Canopi.</p>
      <Next go={go} to={7} label="Next: results" hint="The campaign runs through the week. Results come back nightly." />
    </>
  );
}

/* ---------------- 8. results ---------------- */
function Results({ s, up, go }) {
  const c = s.campaign;
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => {
    if (!c || s.metrics) return;
    let live = true;
    (async () => {
      setBusy(true);
      const r = await api('/api/metrics', { campaign: c });
      if (!live) return;
      setBusy(false);
      if (!r.ok) return setErr(r.data.error || 'Could not load results.');
      up((p) => ({ metrics: r.data, lifeIdx: Math.max(p.lifeIdx, 5) }));
    })();
    return () => { live = false; };
  }, [c?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const m = s.metrics;
  const chart = useMemo(() => {
    if (!m) return null;
    const days = m.series[0].rows.map((r) => r.date);
    const totals = days.map((_, d) => m.series.reduce((a, srs) => a + srs.rows[d].views, 0));
    const max = Math.max(...totals, 1);
    return { days, max };
  }, [m]);
  if (!c) return <Missing go={go} to={5} what="Submit a promotion first." />;
  const settle = () => up((p) => settlePatch(p));
  const colors = { tiktok: 'var(--ink)', youtube: 'var(--canopy)', meta: 'var(--sun)' };
  const W = 640, H = 220, padL = 44, padB = 28, innerW = W - padL - 12, innerH = H - padB - 12;
  return (
    <>
      <Head role="BIO 112 Professor" eyebrow="Step 8 · Results" title={`Week ${c.week}: how ${c.video.topic ? c.video.topic.toLowerCase() : 'the video'} performed`} lede="Platform reporting comes back nightly and joins Canopi's own feed data. Results are reported by campaign and topic, never by individual student on social." />
      {busy && <p className="muted">Pulling platform reports...</p>}
      {err && <div className="err">{err}</div>}
      {m && (
        <>
          <div className="kpis">
            <div className="kpi"><b>{num(m.totals.impressions)}</b><span>impressions near campus</span></div>
            <div className="kpi"><b>{num(m.totals.views)}</b><span>views</span></div>
            <div className="kpi"><b>{num(m.totals.watchMin)}</b><span>minutes watched</span></div>
            <div className="kpi"><b>{num(m.totals.clicks)}</b><span>taps into Canopi</span></div>
          </div>
          <div className="grid2">
            <div className="panel">
              <h3>Daily views by platform</h3>
              <div className="legend">{m.series.map((srs) => <span key={srs.platform}><i style={{ background: colors[srs.platform] }} />{srs.label}</span>)}</div>
              <div className="scroll">
                <svg className="chart" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Daily views by platform">
                  {[0, 0.5, 1].map((t) => {
                    const y = 12 + innerH - innerH * t;
                    return <g key={t}><line x1={padL} x2={W - 12} y1={y} y2={y} stroke="var(--line)" /><text x={padL - 8} y={y + 4} textAnchor="end">{num(Math.round(chart.max * t))}</text></g>;
                  })}
                  {chart.days.map((d, i) => {
                    const bw = innerW / chart.days.length * 0.56;
                    const x = padL + (innerW / chart.days.length) * i + (innerW / chart.days.length - bw) / 2;
                    let yTop = 12 + innerH;
                    return (
                      <g key={d}>
                        {m.series.map((srs) => {
                          const h = (srs.rows[i].views / chart.max) * innerH;
                          yTop -= h;
                          return <rect key={srs.platform} x={x} y={yTop} width={bw} height={Math.max(h, 0)} fill={colors[srs.platform]} />;
                        })}
                        <text x={x + bw / 2} y={H - 8} textAnchor="middle">{fmtDate(d)}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
              <div className="scroll" style={{ marginTop: 12 }}>
                <table className="tbl">
                  <thead><tr><th>Platform</th><th style={{ textAlign: 'right' }}>Credits</th><th style={{ textAlign: 'right' }}>Spent</th><th style={{ textAlign: 'right' }}>Views</th><th style={{ textAlign: 'right' }}>Minutes</th></tr></thead>
                  <tbody>{m.series.map((srs) => (
                    <tr key={srs.platform}><td><b>{srs.label}</b></td><td className="n">{srs.credits}</td><td className="n">{srs.spent}</td><td className="n">{num(srs.rows.reduce((a, r) => a + r.views, 0))}</td><td className="n">{num(srs.rows.reduce((a, r) => a + r.watchMin, 0))}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
            <div className="col">
              <div className="panel">
                <h3>Credits</h3>
                <p className="small" style={{ marginTop: 0 }}><b>{m.spent}</b> of {c.credits} credits spent. <b>{m.returned}</b> unspent {m.returned === 1 ? 'credit returns' : 'credits return'} to your balance at close.</p>
                <button className="primary" disabled={s.settled} onClick={settle}>{s.settled ? 'Campaign closed and settled' : 'Close campaign and settle credits'}</button>
                <ul className="ledger" style={{ marginTop: 14 }}>
                  {s.credits.ledger.map((l, i) => <li key={i}><b>{l.type}</b><span className="muted">{l.note}</span><span className="amt">{l.amount > 0 ? '+' : ''}{l.amount}</span></li>)}
                </ul>
                <p className="note">Balance: {num(s.credits.allotted - s.credits.used - s.credits.held)} of {num(s.credits.allotted)} credits available.</p>
              </div>
              <div className="panel">
                <h3>What happens next</h3>
                <p className="small" style={{ margin: 0 }}>Week {c.week + 1} is already on the calendar. New picks are ready every Sunday night, so fresh videos reach students' feeds every week of the term.</p>
                <div className="row" style={{ marginTop: 12 }}>
                  <button className="secondary" onClick={() => go(3)}>Plan another week</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
