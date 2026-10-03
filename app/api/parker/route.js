import { answer } from '@/lib/parker';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const reply = answer(body.message, body.context || {});
  return Response.json({ from: 'parker', reply, engine: 'parker-guide-v1 (demo responses)' });
}
