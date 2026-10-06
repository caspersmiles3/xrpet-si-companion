import express from 'express';
import * as cheerio from 'cheerio';
import webpush from 'web-push';

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json({ limit: '100kb' }));
app.use(express.static('public'));

const OFFICIAL_SOURCES = [
  { name: 'Ripple Insights', url: 'https://ripple.com/insights/', type: 'official' },
  { name: 'Ripple Press', url: 'https://ripple.com/press-releases/', type: 'official' },
  { name: 'XRPL Blog', url: 'https://xrpl.org/blog/', type: 'official' }
];

const cache = {
  updates: { at: 0, data: [] },
  market: { at: 0, data: null }
};
const FIVE_MIN = 5 * 60 * 1000;
const TEN_MIN = 10 * 60 * 1000;
const clean = s => (s || '').replace(/\s+/g, ' ').trim();
const pushSubscriptions = new Map();
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails('https://xrpet-si-companion.onrender.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

async function fetchJson(url, options={}) {
  const r = await fetch(url, { headers: { 'user-agent': 'XRPetSI/1.0 (+xrpl companion)' }, ...options });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}
async function fetchPage(url) {
  const r = await fetch(url, { headers: { 'user-agent': 'XRPetSI/1.0 (+xrpl companion)' }});
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}

function classify(title, source) {
  const t = title.toLowerCase();
  let importance = 'normal';
  if (/launch|partner|license|approval|acqui|institution|lending|etf|custody|settlement|payment|stablecoin|rlusd|xrpl|xrp|amendment|mainnet/.test(t)) importance = 'important';
  return {
    label: source.type === 'official' ? 'CONFIRMED' : 'UNVERIFIED',
    importance,
    reason: source.type === 'official'
      ? 'Published by an official Ripple/XRPL source.'
      : 'Requires confirmation from a primary source.'
  };
}

async function scrapeSource(source) {
  const html = await fetchPage(source.url);
  const $ = cheerio.load(html);
  const items = [];
  $('a').each((_, a) => {
    const title = clean($(a).text());
    let href = $(a).attr('href');
    if (!title || title.length < 18 || title.length > 180 || !href) return;
    if (href.startsWith('/')) href = new URL(href, source.url).toString();
    if (!href.startsWith('http')) return;
    if (!/ripple\.com\/(insights|ripple-press|press-releases)|xrpl\.org\//.test(href)) return;
    if (items.some(x => x.title === title)) return;
    items.push({ title, url: href, source: source.name, ...classify(title, source) });
  });
  return items.slice(0, 12);
}

async function getUpdates() {
  if (Date.now() - cache.updates.at < TEN_MIN && cache.updates.data.length) return cache.updates.data;
  const settled = await Promise.allSettled(OFFICIAL_SOURCES.map(scrapeSource));
  const items = settled.flatMap(x => x.status === 'fulfilled' ? x.value : []);
  const seen = new Set();
  const unique = items.filter(x => !seen.has(x.url) && seen.add(x.url)).slice(0, 18);
  cache.updates = { at: Date.now(), data: unique };
  return unique;
}

async function getMarket() {
  if (Date.now() - cache.market.at < FIVE_MIN && cache.market.data) return cache.market.data;
  try {
    const [spot, stats] = await Promise.all([
      fetchJson('https://api.coinbase.com/v2/prices/XRP-USD/spot'),
      fetchJson('https://api.exchange.coinbase.com/products/XRP-USD/stats')
    ]);
    const price = Number(spot?.data?.amount);
    const open = Number(stats?.open);
    const last = Number(stats?.last || price);
    const change24h = Number.isFinite(open) && open > 0 ? ((last - open) / open) * 100 : null;
    const data = {
      price,
      change24h,
      volume24hXrp: Number(stats?.volume),
      high24h: Number(stats?.high),
      low24h: Number(stats?.low),
      source: 'Coinbase public market data',
      generatedAt: new Date().toISOString()
    };
    cache.market = { at: Date.now(), data };
    return data;
  } catch {
    const cg = await fetchJson('https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd&include_24hr_change=true');
    const data = {
      price: Number(cg?.ripple?.usd),
      change24h: Number(cg?.ripple?.usd_24h_change),
      volume24hXrp: null,
      high24h: null,
      low24h: null,
      source: 'CoinGecko public market data',
      generatedAt: new Date().toISOString()
    };
    cache.market = { at: Date.now(), data };
    return data;
  }
}

function fmtPct(n) {
  if (!Number.isFinite(n)) return 'unavailable';
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}
function buildBriefing(context, market, updates) {
  const important = updates.filter(x => x.importance === 'important').slice(0, 3);
  const movement = Number.isFinite(market?.change24h)
    ? Math.abs(market.change24h) >= 5 ? 'a notable move' : Math.abs(market.change24h) >= 2 ? 'a moderate move' : 'a relatively quiet move'
    : 'an unavailable 24-hour move';
  return {
    headline: `XRP is ${Number.isFinite(market?.price) ? '$' + market.price.toFixed(4) : 'price unavailable'} with ${movement} over 24h.`,
    ledger: `XRPL is ${context.connected ? 'live' : 'not currently connected in this browser'}${context.ledgerIndex ? ', latest observed ledger ' + Number(context.ledgerIndex).toLocaleString() : ''}${context.txCount != null ? ', with ' + context.txCount + ' transactions in the last observed close' : ''}.`,
    market: Number.isFinite(market?.change24h) ? `24h change: ${fmtPct(market.change24h)}.` : '24h market change unavailable.',
    important,
    caution: 'Market movement is descriptive, not a prediction. Official-source headlines are facts about announcements, not proof of future XRP price performance.'
  };
}

function truthLabelForClaim(claim, updates) {
  const c = claim.toLowerCase();
  const words = c.split(/[^a-z0-9]+/).filter(w => w.length > 4);
  const match = updates.find(x => words.filter(w => x.title.toLowerCase().includes(w)).length >= 2);
  if (match) return { label:'LIKELY', reason:`A related official headline exists: “${match.title}”. This does not prove every detail of the claim.`, source:match.url };
  if (/guarantee|guaranteed|will hit|definitely|1000|10000|overnight|replace swift|all banks/.test(c)) return { label:'SPECULATION', reason:'The wording makes a future-price or universal-adoption claim that cannot be confirmed as fact.', source:null };
  return { label:'RUMOR', reason:'I could not match this claim to the official Ripple/XRPL headlines currently in my feed. Treat it as unconfirmed until a primary source supports it.', source:null };
}

app.get('/api/config', (_req, res) => {
  res.json({
    xamanApiKey: process.env.XAMAN_API_KEY || null,
    pushEnabled: Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY),
    siProviderEnabled: Boolean(process.env.SI_PROVIDER_URL && process.env.SI_PROVIDER_KEY && process.env.SI_MODEL)
  });
});

app.get('/api/push/public-key', (_req, res) => {
  if (!VAPID_PUBLIC_KEY) return res.status(503).json({ enabled:false });
  res.json({ enabled:true, publicKey:VAPID_PUBLIC_KEY });
});

app.post('/api/push/subscribe', (req, res) => {
  const sub = req.body?.subscription;
  if (!sub?.endpoint) return res.status(400).json({ error:'Invalid subscription' });
  pushSubscriptions.set(sub.endpoint, sub);
  res.json({ ok:true, count:pushSubscriptions.size });
});

async function sendPush(title, body, data={}) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !pushSubscriptions.size) return;
  const payload = JSON.stringify({ title, body, data });
  for (const [endpoint, sub] of [...pushSubscriptions.entries()]) {
    try { await webpush.sendNotification(sub, payload); }
    catch (e) {
      if (e?.statusCode === 404 || e?.statusCode === 410) pushSubscriptions.delete(endpoint);
    }
  }
}

app.get('/api/updates', async (_req, res) => {
  try {
    const items = await getUpdates();
    res.json({ generatedAt:new Date().toISOString(), sourcePolicy:'Official Ripple and XRPL sources are CONFIRMED.', items });
  } catch (e) {
    res.status(502).json({ error:'Official update feed unavailable', detail:e.message });
  }
});

app.get('/api/market', async (_req, res) => {
  try { res.json(await getMarket()); }
  catch (e) { res.status(502).json({ error:'XRP market feed unavailable', detail:e.message }); }
});

app.post('/api/briefing', async (req, res) => {
  try {
    const [market, updates] = await Promise.all([getMarket(), getUpdates()]);
    res.json(buildBriefing(req.body?.context || {}, market, updates));
  } catch (e) {
    res.status(502).json({ error:'Briefing unavailable', detail:e.message });
  }
});

async function askExternalSI(message, context, market, updates) {
  const url = process.env.SI_PROVIDER_URL;
  const key = process.env.SI_PROVIDER_KEY;
  const model = process.env.SI_MODEL;
  if (!url || !key || !model) return null;
  const official = updates.slice(0, 5).map(x => ({ title:x.title, source:x.source, label:x.label, url:x.url }));
  const system = [
    'You are the SI core inside XRPet, an XRP Ledger companion.',
    'Use supplied live data as ground truth. Separate fact from speculation.',
    'Never promise XRP price outcomes or ask for a seed phrase/private key.',
    'Be concise, companion-like, and match the requested explanation level.',
    'If a claim is not supported, say it is unconfirmed.'
  ].join(' ');
  try {
    const r = await fetch(url, {
      method:'POST',
      headers:{ 'content-type':'application/json', 'authorization':'Bearer '+key },
      body:JSON.stringify({
        model,
        messages:[
          { role:'system', content:system },
          { role:'user', content:JSON.stringify({ message, context, market, officialUpdates:official }) }
        ],
        temperature:0.4
      })
    });
    if (!r.ok) return null;
    const d = await r.json();
    return clean(d?.choices?.[0]?.message?.content || d?.output_text || '');
  } catch { return null; }
}

app.post('/api/companion', async (req, res) => {
  const { message = '', context = {} } = req.body || {};
  const petName = clean(context.petName || 'Nexus');
  const personality = clean(context.personality || 'Guardian');
  const explainLevel = clean(context.explainLevel || 'balanced');
  const memories = Array.isArray(context.memories) ? context.memories.slice(-5).map(clean).filter(Boolean) : [];
  const memoryHint = memories.length ? ' Saved preferences: ' + memories.join(' | ') + '.' : '';
  const styleHint = explainLevel === 'technical'
    ? ' Use concise technical XRPL language.'
    : explainLevel === 'simple'
      ? ' Keep the explanation simple and short.'
      : '';
  const m = clean(message);
  const lower = m.toLowerCase();
  let market = null, updates = [];
  try { [market, updates] = await Promise.all([getMarket(), getUpdates()]); } catch {}
  let reply, truth = null;
  const externalReply = await askExternalSI(m, context, market || {}, updates);
  if (externalReply && !/rumor|true|truth|claim|verify/.test(lower)) {
    return res.json({ reply:externalReply, truth:null, mode:'external-si-grounded-v1.5', personality, explainLevel, marketSource:market?.source || null });
  }

  if (/what.*happen|catch.*up|update|news|today/.test(lower)) {
    const b = buildBriefing(context, market || {}, updates);
    const top = b.important[0] ? ` Top confirmed update: ${b.important[0].title}` : '';
    reply = `${b.headline} ${b.market} ${b.ledger}${top} ${b.caution}`;
  } else if (/price|xrp.*usd|market/.test(lower)) {
    reply = Number.isFinite(market?.price)
      ? `XRP is about $${market.price.toFixed(4)} USD. The 24-hour change is ${fmtPct(market.change24h)}. Source: ${market.source}. That's a live market snapshot, not a forecast.`
      : 'The live XRP market feed is temporarily unavailable.';
  } else if (/fee|cost/.test(lower)) {
    reply = `Current observed XRPL base fee: ${context.baseFeeDrops ?? 'checking'} drops. I use the live network signal instead of assuming a fixed fee.`;
  } else if (/hello|hi|hey/.test(lower)) {
    reply = `Hey. I'm ${petName}, your ${personality.toLowerCase()} XRPL companion. The ledger is ${context.connected ? 'connected and pulsing' : 'still connecting'}.${styleHint}`;
  } else if (/rumor|true|truth|claim|verify/.test(lower)) {
    const claim = m.replace(/^(is|check|verify|truth|rumor)\s+/i,'');
    truth = truthLabelForClaim(claim, updates);
    reply = `Truth Mode: ${truth.label}. ${truth.reason}`;
  } else {
    reply = `${petName} here. Ask me for “catch me up,” the live XRP price, XRPL fees, a Ripple/XRPL update, or paste a claim and say “verify this.”${styleHint}${memoryHint}`;
  }
  res.json({ reply, truth, mode:'grounded-companion-si-v1.0', personality, explainLevel, marketSource:market?.source || null });
});

app.get('/api/health', (_req, res) => res.json({
  ok:true, product:'XRPet SI Companion', version:'1.5.0',
  capabilities:['xrpl-live','xrp-market','official-updates','truth-mode','companion-memory','evolution','notifications','wallet-watch','gemwallet','xaman-hook','web-push','capacitor-mobile','external-si-hook'],
  integrations:{ xaman:Boolean(process.env.XAMAN_API_KEY), push:Boolean(VAPID_PUBLIC_KEY&&VAPID_PRIVATE_KEY), si:Boolean(process.env.SI_PROVIDER_URL&&process.env.SI_PROVIDER_KEY&&process.env.SI_MODEL) }
}));

let lastPushMarket = null;
setInterval(async () => {
  try {
    const market = await getMarket();
    if (Number.isFinite(market?.change24h) && Math.abs(market.change24h) >= 5) {
      const bucket = Math.round(market.change24h);
      if (bucket !== lastPushMarket) {
        lastPushMarket = bucket;
        await sendPush('XRPet market signal', `XRP is ${market.change24h >= 0 ? 'up' : 'down'} ${Math.abs(market.change24h).toFixed(2)}% over 24h. Movement is not a prediction.`, { type:'market' });
      }
    }
  } catch {}
}, 10 * 60 * 1000);

app.listen(PORT, () => console.log(`XRPet SI Companion v1.5 running on http://localhost:${PORT}`));
