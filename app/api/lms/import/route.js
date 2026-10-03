import { INSTITUTION, COURSES } from '@/lib/data';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  if (body.lms && body.lms !== 'Canvas' && body.lms !== 'Blackboard' && body.lms !== 'Google Classroom') {
    return Response.json({ error: 'Unsupported LMS in this demo. Choose Canvas, Blackboard or Google Classroom.' }, { status: 400 });
  }
  return Response.json({
    institution: INSTITUTION,
    lms: body.lms || INSTITUTION.lms,
    connector: 'simulated',
    courses: COURSES,
    importedAt: new Date().toISOString(),
  });
}
