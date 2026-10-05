import express from 'express';
import * as cheerio from 'cheerio';

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.static('public'));

const OFFICIAL_SOURCES = [
  { name: 'Ripple Insights', url: 'https://ripple.com/insights/', type: 'official' },
  { name: 'Ripple Press', url: 'https://ripple.com/press-releases/', type: 'official' },
  { name: 'XRPL Blog', url: 'https://xrpl.org/blog/', type: 'official' }
];

const clean = s => (s || '').replace(/\s+/g, ' ').trim();

async function fetchPage(url) {
  const r = await fetch(url, { headers: { 'user-agent': 'XRPetSI/0.1 (+educational companion)' }});
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return await r.text();
}

function classify(title, source) {
  const t = title.toLowerCase();
  let importance = 'normal';
  if (/launch|partner|license|approval|acqui|institution|lending|etf|custody|settlement|payment|stablecoin|rlusd|xrpl|xrp/.test(t)) importance = 'important';
  return {
    label: source.type === 'official' ? 'CONFIRMED' : 'UNVERIFIED',
    importance,
    reason: source.type === 'official' ? 'Published by an official Ripple/XRPL source.' : 'Requires confirmation from a primary source.'
  };
}

async function scrapeRipple(source) {
  const html = await fetchPage(source.url);
  const $ = cheerio.load(html);
  const items = [];
  $('a').each((_, a) => {
    const title = clean($(a).text());
    let href = $(a).attr('href');
    if (!title || title.length < 18 || title.length > 180) return;
    if (!href) return;
    if (href.startsWith('/')) href = new URL(href, source.url).toString();
    if (!href.startsWith('http')) return;
    if (!/ripple\.com\/(insights|ripple-press|press-releases)|xrpl\.org\//.test(href)) return;
    if (items.some(x => x.title === title)) return;
    items.push({ title, url: href, source: source.name, ...classify(title, source) });
  });
  return items.slice(0, 12);
}

app.get('/api/updates', async (_req, res) => {
  const settled = await Promise.allSettled(OFFICIAL_SOURCES.map(scrapeRipple));
  const items = settled.flatMap(x => x.status === 'fulfilled' ? x.value : []);
  const seen = new Set();
  const unique = items.filter(x => !seen.has(x.url) && seen.add(x.url)).slice(0, 18);
  res.json({
    generatedAt: new Date().toISOString(),
    sourcePolicy: 'Official Ripple and XRPL sources are CONFIRMED. Secondary-source support can be added later.',
    items: unique
  });
});

app.post('/api/companion', (req, res) => {
  const { message = '', context = {} } = req.body || {};
  const m = message.toLowerCase();
  let reply;
  if (/what.*happen|catch.*up|update|news/.test(m)) {
    reply = `Ledger ${context.ledgerIndex || 'is live'}. Network mood: ${context.networkMood || 'watchful'}. I can show confirmed Ripple/XRPL updates in the Live Feed. I label official-source items CONFIRMED and avoid turning speculation into fact.`;
  } else if (/fee|cost/.test(m)) {
    reply = `Current base fee: ${context.baseFeeDrops ?? 'checking'} drops. XRPL fees are dynamic under load, so I watch the live fee signal instead of assuming a fixed cost.`;
  } else if (/hello|hi|hey/.test(m)) {
    reply = `Hey. I'm ${context.petName || 'Nexus'}, your XRPL companion. The ledger is ${context.connected ? 'connected and pulsing' : 'still connecting'}.`;
  } else if (/rumor|true|truth/.test(m)) {
    reply = `Truth Mode is on. Give me the exact claim and I’ll classify it as CONFIRMED, LIKELY, SPECULATION, RUMOR, or MISLEADING based on source quality.`;
  } else {
    reply = `I'm listening. Ask me about the live ledger, Ripple/XRPL updates, fees, your watched account, or say “catch me up.”`;
  }
  res.json({ reply, mode: 'local-si', note: 'Provider-neutral SI core. Add a model provider later without changing the UI.' });
});

app.get('/api/health', (_req, res) => res.json({ ok: true, product: 'XRPet SI Companion', version: '0.2.0' }));

app.listen(PORT, () => console.log(`XRPet SI Companion running on http://localhost:${PORT}`));
