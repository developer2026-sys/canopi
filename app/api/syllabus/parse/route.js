import { parseSyllabusLines, weekDates, TERM_START } from '@/lib/data';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const text = String(body.text || '');
  const termStart = /^\d{4}-\d{2}-\d{2}$/.test(body.termStart || '') ? body.termStart : TERM_START;
  if (text.trim().length < 10) {
    return Response.json({ error: 'Paste a syllabus with lines like "Week 6: Cellular respiration - glycolysis, Krebs cycle".' }, { status: 400 });
  }
  const weeks = parseSyllabusLines(text).map((w) => ({ ...w, ...weekDates(w.week, termStart), topics: w.topics.length ? w.topics : [w.title] }));
  if (!weeks.length) {
    return Response.json({ error: 'No weeks found. Each week should start with "Week" and a number, for example "Week 3: Macromolecules".' }, { status: 422 });
  }
  return Response.json({ weeks, termStart, parser: 'parker-reader-v1 (demo)', topicCount: weeks.reduce((a, w) => a + w.topics.length, 0) });
}
