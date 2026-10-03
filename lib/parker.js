// Parker: Canopi's AI assistant for finding the right videos.
// In this demo, Parker's answers are rule-based over the demo data.
import { PLAN_WEEK, STRATEGIES } from './data';

export const PARKER = { name: 'Parker', role: 'Assistant for finding the right videos' };

const list = (arr) => (arr.length <= 1 ? arr.join('') : `${arr.slice(0, -1).join(', ')} and ${arr.at(-1)}`);
const stratNames = (ids) => ids.map((id) => (STRATEGIES.find((s) => s.id === id)?.label || id).toLowerCase());
const has = (t, ...words) => words.some((w) => t.includes(w));

export function answer(message, ctx = {}) {
  const t = String(message || '').toLowerCase();
  const week = ctx.week || PLAN_WEEK;
  if (!t.trim()) return 'Ask about video picks, credits or results.';
  if (has(t, 'thank')) return 'Glad to help.';
  if (/^(hi|hello|hey)\b/.test(t)) return `Hi. I can help find videos for Week ${week}, check credits, or summarize results.`;
  if (has(t, 'credit', 'balance', 'budget', 'spend')) {
    return `${Number(ctx.available ?? 0).toLocaleString('en-US')} of ${Number(ctx.allotted ?? 1200).toLocaleString('en-US')} credits are available this year. A typical week uses 100 to 150 credits on one or two channels. Credits are held when a campaign starts and unspent credits return at close.`;
  }
  if (has(t, '18', 'minor', 'under', 'age', 'high school', 'teen')) {
    return 'Paid placements target ages 18 and up only. Younger students get the same videos in the Canopi app. No student data goes to any social platform.';
  }
  if (has(t, 'struggl', 'confus', 'stuck', 'mix up', 'mixing')) {
    return 'Describe the exact mix-up in the "Where students struggle" box. Videos built around that confusion rank first.';
  }
  if (has(t, 'best', 'perform', 'result', 'how did', 'views', 'recap')) {
    if (ctx.metrics) return `Week ${ctx.campaignWeek}: ${Number(ctx.metrics.views).toLocaleString('en-US')} views and ${Number(ctx.metrics.watchMin).toLocaleString('en-US')} minutes watched. ${ctx.metrics.top} drove the most views.`;
    return 'No results yet. Once a campaign runs, platform reports come in nightly.';
  }
  if (has(t, 'tiktok', 'spark')) return 'On TikTok, open the post, tap the three dots, then Ad settings, and generate a Spark code. Paste it into Canopi so the post can run as an ad from the educator\'s own handle.';
  if (has(t, 'youtube', 'shorts')) return 'Link the YouTube channel once. Canopi promotes the Shorts through Google Ads and keeps a course playlist ordered by syllabus week.';
  if (has(t, 'instagram', 'reels', 'meta')) return 'Allow partnership ads on Instagram so Reels can run from the educator\'s handle in students\' Reels feeds near campus.';
  if (has(t, 'syllabus', 'parse', 'read')) return 'Each "Week N: topic" line in the syllabus becomes a week with dates and topics. Paste an updated syllabus anytime to re-plan from that week on.';
  if (has(t, 'post', 'pick', 'recommend', 'video', 'this week', 'next week', 'what should')) {
    const strat = ctx.prefs?.strategies?.length ? list(stratNames(ctx.prefs.strategies)) : 'visual and step-by-step';
    return `For Week ${week}${ctx.weekTitle ? `, ${ctx.weekTitle}` : ''}: lead with one short explainer of the main idea and one that clears up the common mix-up. Current style settings favor ${strat}. Use Find videos to rank the library.`;
  }
  if (has(t, 'who are you', 'what are you', 'what can you')) return 'I\'m Parker, Canopi\'s assistant for finding the right videos. I read syllabi, rank videos against your inputs and answer quick questions. You approve everything.';
  return `I can help find videos for a week, check credits, explain the 18+ rule, or summarize results. Try "What should I post for Week ${week}?"`;
}
