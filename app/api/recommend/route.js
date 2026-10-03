import { recommend } from '@/lib/engine';
import { LIBRARY } from '@/lib/data';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  if (!String(body.topic || '').trim()) {
    return Response.json({ error: 'Add what students are studying so Parker has a topic to match.' }, { status: 400 });
  }
  const results = recommend({ ...body, limit: 6 });
  return Response.json({ results, searched: LIBRARY.length, model: 'parker-match-v1 (demo scoring)' });
}
