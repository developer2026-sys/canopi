import { INSTITUTION, COURSES, LIBRARY, STRATEGIES, AGE_GROUPS, LEVELS, PLATFORMS } from '@/lib/data';

export async function GET() {
  return Response.json({
    institution: INSTITUTION,
    courses: COURSES,
    libraryCount: LIBRARY.length,
    strategies: STRATEGIES,
    ageGroups: AGE_GROUPS,
    levels: LEVELS,
    platforms: PLATFORMS,
    endpoints: ['/api/lms/import', '/api/syllabus/parse', '/api/recommend', '/api/campaigns', '/api/metrics', '/api/parker'],
  });
}
