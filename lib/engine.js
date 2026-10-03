// Server-side logic used by the API routes. Pure functions over the demo data.
import { LIBRARY, STRATEGIES, AGE_GROUPS, LEVELS, PLATFORMS, INSTITUTION, seeded, weekDates } from './data';

const STOP = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'vs', 'up', 'is', 'it', 'its', 'how', 'what', 'mixing', 'students', 'between']);
const words = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));

function overlap(a, bText) {
  const A = words(a);
  if (!A.length) return 0;
  const B = new Set(words(bText));
  return A.filter((w) => B.has(w)).length / A.length;
}

const levelIdx = (id) => LEVELS.findIndex((l) => l.id === id);

export function recommend(input) {
  const { topic = '', age = 'col', level = 'intro', maxLength = 60, strategies = [], struggle = '', limit = 6 } = input || {};
  const chosen = new Set(strategies);
  const scored = LIBRARY.filter((v) => v.lengthSec <= Number(maxLength)).map((v) => {
    const topicFit = overlap(topic, `${v.topic} ${v.keywords}`);
    const targeted = /\b(difference|confusing|mixing|myths?)\b/.test(v.keywords);
    const struggleFit = struggle ? (targeted ? 1 : 0.3) * overlap(struggle, v.keywords) : 0;
    const stratFit = chosen.has(v.strategy) ? 1 : 0;
    const lvlGap = Math.abs(levelIdx(v.level) - levelIdx(level));
    const ageFit = v.ages.includes(age) ? 1 : 0;
    const popularity = Math.min(v.baseViews / 50000, 1);
    const score = 40 * topicFit + 30 * struggleFit + 14 * stratFit + (lvlGap === 0 ? 10 : lvlGap === 1 ? 4 : 0) + 8 * ageFit + 6 * popularity;
    const reasons = [];
    if (struggleFit >= 0.5) reasons.push('Targets the struggle you described.');
    if (topicFit > 0) reasons.push(`Covers this week's topic, ${v.topic}.`);
    reasons.push(`${AGE_GROUPS.find((a) => a.id === age)?.short || 'Age'} fit: ${ageFit ? 'yes' : 'partial'}.`);
    const lvlName = LEVELS[levelIdx(v.level)].short.toLowerCase();
    reasons.push(lvlGap === 0 ? `Pitched at your learning curve (${lvlName}).` : `Pitched ${lvlName}, ${lvlGap === 1 ? 'one step' : 'two steps'} ${levelIdx(v.level) > levelIdx(level) ? 'above' : 'below'} your setting.`);
    const sLabel = STRATEGIES.find((s) => s.id === v.strategy)?.label || v.strategy;
    reasons.push(stratFit ? `Uses ${sLabel.toLowerCase()}, one of your strategies.` : `Adds ${sLabel.toLowerCase()} for variety.`);
    return { ...v, score, topicFit, reasons };
  }).filter((v) => v.topicFit > 0 || (struggle && overlap(struggle, v.keywords) >= 0.5));

  scored.sort((a, b) => b.score - a.score);
  const seen = new Set();
  const picks = [];
  for (const v of scored) {
    const key = v.strategy + (v.title.startsWith('Quick take') ? 'q' : '');
    if (seen.has(v.strategy) && picks.length < limit - 1) continue;
    if (seen.has(key)) continue;
    seen.add(v.strategy); seen.add(key);
    picks.push(v);
    if (picks.length >= limit) break;
  }
  const top = picks.length ? picks[0].score : 1;
  return picks.map((v) => ({ ...v, match: Math.max(55, Math.min(99, Math.round(70 + 29 * (v.score / Math.max(top, 1))))) }));
}

// ---------- campaigns ----------
const INTERESTS = {
  tiktok: ['Education', 'Science', 'Science & Education > Biology'],
  youtube: ['Science/Biological Sciences', 'Jobs & Education/Education'],
  meta: ['Biology (interest)', 'Science (interest)', 'Higher education (interest)'],
};

export function validateCampaign(body, availableCredits) {
  const errors = [];
  if (!body || typeof body !== 'object') return ['Missing campaign details.'];
  if (!body.video && !LIBRARY.find((v) => v.id === body.videoId)) errors.push('Pick a video to promote.');
  if (!Array.isArray(body.platforms) || !body.platforms.length) errors.push('Choose at least one platform.');
  if (Number(body.minAge) < 18) errors.push('Paid campaigns must target ages 18 and up. Under-18 students are reached through the Canopi feed only.');
  const credits = Math.round(Number(body.credits));
  if (!credits || credits < 10) errors.push('Commit at least 10 credits.');
  if (credits > availableCredits) errors.push(`Only ${availableCredits} credits are available.`);
  return errors;
}

export function buildCampaign(body) {
  const video = body.video || LIBRARY.find((v) => v.id === body.videoId);
  const id = `cmp_${Math.abs(Math.round(seeded(`${body.videoId}${body.week}${body.credits}${body.platforms.join()}${Date.now()}`) * 1e8)).toString(36)}`;
  const { start, end } = weekDates(Number(body.week) || 7);
  const per = Math.floor(Number(body.credits) / body.platforms.length);
  const remainder = Number(body.credits) - per * body.platforms.length;
  const c = INSTITUTION.campus;
  const platforms = body.platforms.map((p, i) => {
    const credits = per + (i === 0 ? remainder : 0);
    const extId = `${p}_${id.slice(4)}${i}`;
    let payload;
    if (p === 'tiktok') {
      payload = {
        endpoint: 'POST /open_api/v1.3/campaign/create/ then /adgroup/create/ then /ad/create/',
        advertiser_id: 'canopi_northfield_state',
        campaign: { campaign_name: `${body.courseCode} Wk${body.week} ${video.title.slice(0, 40)}`, objective_type: 'VIDEO_VIEWS', budget_mode: 'BUDGET_MODE_TOTAL', budget: credits, operation_status: 'DISABLE' },
        adgroup: {
          placements: ['PLACEMENT_TIKTOK'],
          location: { type: 'radius', center: [c.lat, c.lng], radius_miles: c.radiusMiles },
          age_groups: ['AGE_18_24', 'AGE_25_34'],
          interest_categories: INTERESTS.tiktok,
          schedule_type: 'SCHEDULE_START_END', schedule_start_time: `${start} 00:00:00`, schedule_end_time: `${end} 23:59:59`,
          dayparting: 'evenings and weekends',
        },
        ad: { identity_type: 'AUTH_CODE', spark_ads_auth_code: body.auth?.tiktok || 'educator-provided Spark code', creator_handle: video.handle, call_to_action: 'LEARN_MORE', landing_page_url: 'https://canopi.example/feed?utm_source=tiktok' },
      };
    } else if (p === 'youtube') {
      payload = {
        endpoint: 'Google Ads API: CampaignService, AdGroupService, AdGroupAdService mutate',
        customer_id: 'canopi-northfield-state',
        campaign: { name: `${body.courseCode} Wk${body.week}`, advertising_channel_type: 'DEMAND_GEN', status: 'PAUSED', campaign_budget_total: credits, start_date: start, end_date: end },
        ad_group: { targeting: { age_ranges: ['AGE_RANGE_18_24', 'AGE_RANGE_25_34'], proximity: { lat: c.lat, lng: c.lng, radius: c.radiusMiles, unit: 'MILES' }, topics: INTERESTS.youtube }, channels: ['YOUTUBE_SHORTS'] },
        ad: { type: 'DEMAND_GEN_VIDEO_RESPONSIVE_AD', youtube_video_id: body.auth?.youtube || 'educator channel video ID', headline: video.title.slice(0, 40), business_name: 'Canopi' },
      };
    } else {
      payload = {
        endpoint: 'Meta Marketing API: POST /act_{id}/campaigns, /adsets, /ads',
        ad_account_id: 'act_canopi_northfield_state',
        campaign: { name: `${body.courseCode} Wk${body.week}`, objective: 'OUTCOME_AWARENESS', status: 'PAUSED', special_ad_categories: [] },
        adset: {
          lifetime_budget: credits, start_time: `${start}T00:00:00`, end_time: `${end}T23:59:59`,
          targeting: { age_min: 18, geo_locations: { custom_locations: [{ latitude: c.lat, longitude: c.lng, radius: c.radiusMiles, distance_unit: 'mile' }] }, interests: INTERESTS.meta, publisher_platforms: ['instagram'], instagram_positions: ['reels'] },
        },
        ad: { creative: { type: 'partnership_ad', creator_handle: video.handle, permission: body.auth?.meta ? 'granted' : 'pending' } },
      };
    }
    return { platform: p, label: PLATFORMS.find((x) => x.id === p)?.label, credits, externalId: extId, state: 'submitted', payload };
  });
  return {
    id, videoId: video.id, video, week: Number(body.week), courseCode: body.courseCode, credits: Number(body.credits),
    flight: { start, end }, audience: { campus: c.label, radiusMiles: c.radiusMiles, ages: '18+', interests: video.topic },
    state: 'submitted', createdAt: new Date().toISOString(), platforms,
    states: ['draft', 'committed', 'built', 'submitted', 'in_review', 'live', 'reporting', 'closed'],
  };
}

export function campaignMetrics(campaign) {
  const days = 5;
  const series = campaign.platforms.map((p) => {
    const rows = [];
    let spent = 0;
    for (let d = 0; d < days; d++) {
      const r = seeded(`${campaign.id}${p.platform}${d}`);
      const share = (0.16 + r * 0.06);
      const spend = Math.min(p.credits - spent, Math.round(p.credits * share));
      spent += spend;
      const cpm = p.platform === 'tiktok' ? 6 : p.platform === 'youtube' ? 8 : 7;
      const impressions = Math.round((spend / cpm) * 1000);
      const viewRate = p.platform === 'youtube' ? 0.34 : p.platform === 'tiktok' ? 0.41 : 0.29;
      const views = Math.round(impressions * viewRate);
      const watchMin = Math.round(views * (campaign.video.lengthSec * (0.45 + r * 0.25)) / 60);
      const clicks = Math.round(views * (0.012 + r * 0.01));
      const { start } = campaign.flight;
      const dt = new Date(`${start}T00:00:00Z`); dt.setUTCDate(dt.getUTCDate() + d);
      rows.push({ date: dt.toISOString().slice(0, 10), spend, impressions, views, watchMin, clicks });
    }
    return { platform: p.platform, label: p.label, credits: p.credits, spent, rows };
  });
  const spent = series.reduce((a, s) => a + s.spent, 0);
  const totals = series.reduce((a, s) => {
    s.rows.forEach((r) => { a.impressions += r.impressions; a.views += r.views; a.watchMin += r.watchMin; a.clicks += r.clicks; });
    return a;
  }, { impressions: 0, views: 0, watchMin: 0, clicks: 0 });
  return { campaignId: campaign.id, series, spent, returned: campaign.credits - spent, totals };
}
