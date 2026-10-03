# Canopi demo

End-to-end demo of Canopi: school setup, syllabus parsing, AI video recommendations, review, credit-funded campaigns to TikTok, YouTube and Instagram (simulated adapters), student feeds and results. All data is sample data.

## Run locally

    npm install
    npm run dev

## Deploy to Vercel

Import this folder as a new Vercel project (framework: Next.js) or run `npx vercel --prod` from this folder.

## API routes

- `POST /api/lms/import` - simulated LMS import of courses and plan
- `POST /api/syllabus/parse` - parses "Week N: Title - topic, topic" lines into weeks with dates
- `POST /api/recommend` - ranks the demo library against teacher inputs
- `POST /api/campaigns` - guardrails, credit split and per-platform request payloads (simulated)
- `POST /api/metrics` - simulated nightly reporting for a campaign
- `POST /api/parker` - Parker, the in-app assistant: answers quick questions about picks, credits and results (scripted demo responses)
- `GET /api/status` - demo data summary
