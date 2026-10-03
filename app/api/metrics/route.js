import { campaignMetrics } from '@/lib/engine';

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const c = body?.campaign;
  if (!c || !c.id || !Array.isArray(c.platforms) || !c.video) {
    return Response.json({ error: 'Send the campaign returned by /api/campaigns.' }, { status: 400 });
  }
  return Response.json(campaignMetrics(c));
}
