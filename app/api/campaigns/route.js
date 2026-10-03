import { validateCampaign, buildCampaign } from '@/lib/engine';

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const available = Math.max(0, Math.round(Number(body?.availableCredits) || 0));
  const errors = validateCampaign(body, available);
  if (errors.length) return Response.json({ errors }, { status: 422 });
  const campaign = buildCampaign(body);
  return Response.json({ campaign, adapters: 'simulated: payloads shown are what Canopi would send; no live platform call was made' }, { status: 201 });
}
