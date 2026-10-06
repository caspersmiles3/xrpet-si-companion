import express from 'express';
import * as cheerio from 'cheerio';
import webpush from 'web-push';

const app = express();
const PORT = process.env.PORT || 3000;
app.disable('x-powered-by');

app.use((req,res,next)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy','same-origin');
  res.setHeader('Cross-Origin-Resource-Policy','same-origin');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' https://xumm.app https://esm.sh; connect-src 'self' https://api.coinbase.com https://api.exchange.coinbase.com wss://advanced-trade-ws.coinbase.com https://api.coingecko.com https://ripple.com https://xrpl.org https://xrplcluster.com wss://xrplcluster.com wss://s2.ripple.com https://xumm.app https://esm.sh https://ipfs.io https://raw.githubusercontent.com; img-src 'self' data: https:; media-src 'self' https://raw.githubusercontent.com; style-src 'self' 'unsafe-inline'; font-src 'self'; frame-src https://xumm.app; object-src 'none'; base-uri 'self'; form-action 'self'");
  next();
});

const rateBuckets=new Map();
function rateLimit(limit,windowMs){
  return (req,res,next)=>{
    const key=req.ip||req.socket.remoteAddress||'unknown';
    const now=Date.now();
    const bucket=rateBuckets.get(key);
    if(!bucket||now-bucket.start>windowMs){
      rateBuckets.set(key,{start:now,count:1}); return next();
    }
    bucket.count+=1;
    if(bucket.count>limit) return res.status(429).json({error:'Too many requests'});
    next();
  };
}

app.use(express.json({ limit: '100kb' }));
app.use('/api/',rateLimit(120,60*1000));
app.use('/api/companion',rateLimit(30,60*1000));
app.use('/api/push/subscribe',rateLimit(10,60*1000));
app.use(express.static('public',{
  etag:true,
  maxAge:'1h',
  setHeaders:(res,filePath)=>{
    if(/(?:index\.html|styles\.css|app\.js|ui-shell\.js|games\.js|ecosystem\.js|timeline\.js|music-player\.js|ripplet2d\.js|launch-enhance\.js|contact-directory\.js|sw\.js)$/.test(filePath)){
      res.setHeader('Cache-Control','no-cache, no-store, must-revalidate');
    }
  }
}));

const OFFICIAL_SOURCES = [
  { name: 'Ripple Insights', url: 'https://ripple.com/insights/', type: 'official' },
  { name: 'Ripple Press', url: 'https://ripple.com/press-releases/', type: 'official' },
  { name: 'XRPL Blog', url: 'https://xrpl.org/blog/', type: 'official' }
];

const cache = {
  updates: { at: 0, data: [] },
  market: { at: 0, data: null },
  marketHistory: { at: 0, data: [] },
  ecosystemStats: { at: 0, data: null },
  ecosystemTokens: new Map()
};
const MARKET_CACHE_MS = 15 * 1000;
const TEN_MIN = 15 * 1000;
const clean = s => (s || '').replace(/\s+/g, ' ').trim();
const pushSubscriptions = new Map();
const visitorIds = new Set();
let visitorCount = 0;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails('https://xrpet-si-companion.onrender.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

async function fetchJson(url, options={}) {
  const ownController=options.signal?null:new AbortController();
  const timer=ownController?setTimeout(()=>ownController.abort(),6500):null;
  try{
    const r = await fetch(url, {
      headers: { 'user-agent': 'XRPetSI/1.0 (+xrpl companion)' },
      ...options,
      ...(ownController?{signal:ownController.signal}:{})
    });
    if (!r.ok) throw new Error(`${r.status} ${url}`);
    return r.json();
  }finally{
    if(timer)clearTimeout(timer);
  }
}
async function fetchJsonWithTimeout(url, options={}, timeoutMs=9000) {
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    return await fetchJson(url,{...options,signal:controller.signal});
  }finally{clearTimeout(timer)}
}
async function fetchFirstJson(urls, options={}, timeoutMs=9000){
  let lastError;
  for(const url of urls){
    try{return {data:await fetchJsonWithTimeout(url,options,timeoutMs),url}}
    catch(e){lastError=e}
  }
  throw lastError||new Error('All upstream sources failed');
}
async function xrplRpc(method,params=[{}]){
  const endpoints=['https://s1.ripple.com:51234/','https://xrplcluster.com/'];
  const body=JSON.stringify({method,params});
  let lastError;
  for(const url of endpoints){
    try{
      const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json','user-agent':'XRPetSI/1.0'},body});
      if(!r.ok)throw new Error('XRPL RPC '+r.status);
      const d=await r.json();
      if(d?.result?.status&&d.result.status!=='success')throw new Error(d.result.error_message||d.result.error||'XRPL RPC error');
      return {result:d.result,source:url};
    }catch(e){lastError=e}
  }
  throw lastError||new Error('XRPL RPC unavailable');
}

async function fetchPage(url) {
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),6500);
  try{
    const r = await fetch(url, {
      headers: { 'user-agent': 'XRPetSI/1.0 (+xrpl companion)' },
      signal:controller.signal
    });
    if (!r.ok) throw new Error(`${r.status} ${url}`);
    return r.text();
  }finally{
    clearTimeout(timer);
  }
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
  if (unique.length) {
    cache.updates = { at: Date.now(), data: unique };
    return unique;
  }
  if (cache.updates.data.length) return cache.updates.data;
  return OFFICIAL_SOURCES.map(source=>({
    title:'Open '+source.name+' — official live source',
    url:source.url,
    source:source.name,
    label:'CONFIRMED',
    importance:'normal',
    reason:'Official source link available while XRPet retries article discovery.'
  }));
}


const EXCHANGE_MARKETS = {
  coinbase:{id:'coinbase',name:'Coinbase',pair:'XRP-USD',quote:'USD'},
  kraken:{id:'kraken',name:'Kraken',pair:'XRP/USD',quote:'USD'},
  bitstamp:{id:'bitstamp',name:'Bitstamp',pair:'XRP/USD',quote:'USD'},
  bitfinex:{id:'bitfinex',name:'Bitfinex',pair:'XRP/USD',quote:'USD'},
  binanceus:{id:'binanceus',name:'Binance.US',pair:'XRP/USDT',quote:'USDT'},
  okx:{id:'okx',name:'OKX',pair:'XRP/USDT',quote:'USDT'},
  bybit:{id:'bybit',name:'Bybit',pair:'XRP/USDT',quote:'USDT'},
  kucoin:{id:'kucoin',name:'KuCoin',pair:'XRP/USDT',quote:'USDT'},
  gateio:{id:'gateio',name:'Gate.io',pair:'XRP/USDT',quote:'USDT'},
  mexc:{id:'mexc',name:'MEXC',pair:'XRP/USDT',quote:'USDT'}
};
const exchangeMarketCache = new Map();
const exchangeHistoryCache = new Map();
const n=v=>{const x=Number(v);return Number.isFinite(x)?x:null};
const pctFrom=(last,open)=>Number.isFinite(last)&&Number.isFinite(open)&&open>0?((last-open)/open)*100:null;
const rangePctFrom=(high,low)=>Number.isFinite(high)&&Number.isFinite(low)&&low>0?((high-low)/low)*100:null;
function marketShape(exchange,{price,open24h,high24h,low24h,volume24hXrp,bestBid,bestAsk,change24h,volume24hUsd,source}={}){
  const spread=Number.isFinite(bestBid)&&Number.isFinite(bestAsk)?bestAsk-bestBid:null;
  const spreadBps=Number.isFinite(spread)&&Number.isFinite(price)&&price>0?(spread/price)*10000:null;
  return {
    exchange:exchange.id,exchangeName:exchange.name,pair:exchange.pair,quote:exchange.quote,
    price,change24h:Number.isFinite(change24h)?change24h:pctFrom(price,open24h),
    open24h,volume24hXrp,
    volume24hUsd:Number.isFinite(volume24hUsd)?volume24hUsd:(Number.isFinite(volume24hXrp)&&Number.isFinite(price)?volume24hXrp*price:null),
    high24h,low24h,range24hPct:rangePctFrom(high24h,low24h),
    bestBid,bestAsk,spread,spreadBps,
    source:source||exchange.name+' public market API',
    generatedAt:new Date().toISOString()
  };
}
async function getExchangeMarket(id='coinbase'){
  const exchange=EXCHANGE_MARKETS[id]||EXCHANGE_MARKETS.coinbase;
  const cached=exchangeMarketCache.get(exchange.id);
  if(cached&&Date.now()-cached.at<MARKET_CACHE_MS)return cached.data;
  let data;
  if(exchange.id==='coinbase'){
    const [spot,stats,book]=await Promise.all([
      fetchJson('https://api.coinbase.com/v2/prices/XRP-USD/spot'),
      fetchJson('https://api.exchange.coinbase.com/products/XRP-USD/stats'),
      fetchJson('https://api.exchange.coinbase.com/products/XRP-USD/book?level=1')
    ]);
    const price=n(stats?.last)||n(spot?.data?.amount),open24h=n(stats?.open),high24h=n(stats?.high),low24h=n(stats?.low),volume24hXrp=n(stats?.volume);
    data=marketShape(exchange,{price,open24h,high24h,low24h,volume24hXrp,bestBid:n(book?.bids?.[0]?.[0]),bestAsk:n(book?.asks?.[0]?.[0]),source:'Coinbase public spot, stats, and level-1 order book'});
  } else if(exchange.id==='kraken'){
    const d=await fetchJson('https://api.kraken.com/0/public/Ticker?pair=XRPUSD');
    const t=Object.values(d?.result||{})[0]||{};
    const price=n(t?.c?.[0]),open24h=n(t?.o),high24h=n(t?.h?.[1]??t?.h?.[0]),low24h=n(t?.l?.[1]??t?.l?.[0]),volume24hXrp=n(t?.v?.[1]??t?.v?.[0]);
    data=marketShape(exchange,{price,open24h,high24h,low24h,volume24hXrp,bestBid:n(t?.b?.[0]),bestAsk:n(t?.a?.[0]),source:'Kraken public ticker'});
  } else if(exchange.id==='bitstamp'){
    const t=await fetchJson('https://www.bitstamp.net/api/v2/ticker/xrpusd/');
    data=marketShape(exchange,{price:n(t?.last),open24h:n(t?.open),high24h:n(t?.high),low24h:n(t?.low),volume24hXrp:n(t?.volume),bestBid:n(t?.bid),bestAsk:n(t?.ask),source:'Bitstamp public ticker'});
  } else if(exchange.id==='bitfinex'){
    const t=await fetchJson('https://api-pub.bitfinex.com/v2/ticker/tXRPUSD');
    data=marketShape(exchange,{price:n(t?.[6]),open24h:Number.isFinite(n(t?.[6]))&&Number.isFinite(n(t?.[4]))?n(t?.[6])-n(t?.[4]):null,change24h:Number.isFinite(n(t?.[5]))?n(t?.[5])*100:null,high24h:n(t?.[8]),low24h:n(t?.[9]),volume24hXrp:n(t?.[7]),bestBid:n(t?.[0]),bestAsk:n(t?.[2]),source:'Bitfinex public ticker'});
  } else if(exchange.id==='binanceus'){
    const t=await fetchJson('https://api.binance.us/api/v3/ticker/24hr?symbol=XRPUSDT');
    data=marketShape(exchange,{price:n(t?.lastPrice),open24h:n(t?.openPrice),change24h:n(t?.priceChangePercent),high24h:n(t?.highPrice),low24h:n(t?.lowPrice),volume24hXrp:n(t?.volume),volume24hUsd:n(t?.quoteVolume),bestBid:n(t?.bidPrice),bestAsk:n(t?.askPrice),source:'Binance.US public 24h ticker'});
  } else if(exchange.id==='okx'){
    const d=await fetchJson('https://www.okx.com/api/v5/market/ticker?instId=XRP-USDT'),t=d?.data?.[0]||{};
    data=marketShape(exchange,{price:n(t?.last),open24h:n(t?.open24h),high24h:n(t?.high24h),low24h:n(t?.low24h),volume24hXrp:n(t?.vol24h),volume24hUsd:n(t?.volCcy24h),bestBid:n(t?.bidPx),bestAsk:n(t?.askPx),source:'OKX public ticker'});
  } else if(exchange.id==='bybit'){
    const d=await fetchJson('https://api.bybit.com/v5/market/tickers?category=spot&symbol=XRPUSDT'),t=d?.result?.list?.[0]||{};
    data=marketShape(exchange,{price:n(t?.lastPrice),open24h:n(t?.prevPrice24h),change24h:Number.isFinite(n(t?.price24hPcnt))?n(t?.price24hPcnt)*100:null,high24h:n(t?.highPrice24h),low24h:n(t?.lowPrice24h),volume24hXrp:n(t?.volume24h),volume24hUsd:n(t?.turnover24h),bestBid:n(t?.bid1Price),bestAsk:n(t?.ask1Price),source:'Bybit public spot ticker'});
  } else if(exchange.id==='kucoin'){
    const d=await fetchJson('https://api.kucoin.com/api/v1/market/stats?symbol=XRP-USDT'),t=d?.data||{};
    data=marketShape(exchange,{price:n(t?.last),open24h:n(t?.last)&&n(t?.changePrice)!=null?n(t.last)-n(t.changePrice):null,change24h:Number.isFinite(n(t?.changeRate))?n(t.changeRate)*100:null,high24h:n(t?.high),low24h:n(t?.low),volume24hXrp:n(t?.vol),volume24hUsd:n(t?.volValue),bestBid:n(t?.buy),bestAsk:n(t?.sell),source:'KuCoin public market stats'});
  } else if(exchange.id==='gateio'){
    const rows=await fetchJson('https://api.gateio.ws/api/v4/spot/tickers?currency_pair=XRP_USDT'),t=Array.isArray(rows)?rows[0]||{}:{};
    const price=n(t?.last),change24h=n(t?.change_percentage);
    const open24h=Number.isFinite(price)&&Number.isFinite(change24h)&&change24h!==-100?price/(1+change24h/100):null;
    data=marketShape(exchange,{price,open24h,change24h,high24h:n(t?.high_24h),low24h:n(t?.low_24h),volume24hXrp:n(t?.base_volume),volume24hUsd:n(t?.quote_volume),bestBid:n(t?.highest_bid),bestAsk:n(t?.lowest_ask),source:'Gate.io public spot ticker'});
  } else if(exchange.id==='mexc'){
    const t=await fetchJson('https://api.mexc.com/api/v3/ticker/24hr?symbol=XRPUSDT');
    data=marketShape(exchange,{price:n(t?.lastPrice),open24h:n(t?.openPrice),change24h:n(t?.priceChangePercent),high24h:n(t?.highPrice),low24h:n(t?.lowPrice),volume24hXrp:n(t?.volume),volume24hUsd:n(t?.quoteVolume),bestBid:n(t?.bidPrice),bestAsk:n(t?.askPrice),source:'MEXC public 24h ticker'});
  }
  if(!data||!Number.isFinite(data.price))throw new Error(exchange.name+' market data unavailable');
  exchangeMarketCache.set(exchange.id,{at:Date.now(),data});
  return data;
}
async function getCompositeMarket(){
  const ids=Object.keys(EXCHANGE_MARKETS);
  const settled=await Promise.allSettled(ids.map(id=>getExchangeMarket(id)));
  const markets=settled.filter(x=>x.status==='fulfilled'&&Number.isFinite(x.value?.price)).map(x=>x.value);
  if(!markets.length)throw new Error('No exchange feeds available');
  const sorted=markets.map(x=>x.price).sort((a,b)=>a-b);
  const median=sorted[Math.floor(sorted.length/2)];
  const changes=markets.map(x=>x.change24h).filter(Number.isFinite).sort((a,b)=>a-b);
  const change24h=changes.length?changes[Math.floor(changes.length/2)]:null;
  const bids=markets.map(x=>x.bestBid).filter(Number.isFinite),asks=markets.map(x=>x.bestAsk).filter(Number.isFinite);
  return {
    exchange:'all',exchangeName:'All Exchanges',pair:'XRP/USD + XRP/USDT',quote:'MIXED',
    price:median,change24h,open24h:null,high24h:Math.max(...markets.map(x=>x.high24h).filter(Number.isFinite),median),
    low24h:Math.min(...markets.map(x=>x.low24h).filter(Number.isFinite),median),
    volume24hXrp:markets.map(x=>x.volume24hXrp).filter(Number.isFinite).reduce((a,b)=>a+b,0),
    volume24hUsd:markets.map(x=>x.volume24hUsd).filter(Number.isFinite).reduce((a,b)=>a+b,0),
    bestBid:bids.length?Math.max(...bids):null,bestAsk:asks.length?Math.min(...asks):null,
    spread:null,spreadBps:null,
    source:'Composite median from '+markets.map(x=>x.exchangeName).join(', '),
    venues:markets.map(x=>({id:x.exchange,name:x.exchangeName,price:x.price,change24h:x.change24h,pair:x.pair})),
    generatedAt:new Date().toISOString()
  };
}
async function getFallbackXrpMarket(){
  const cg=await fetchJsonWithTimeout('https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true',{},8000);
  const price=Number(cg?.ripple?.usd),change24h=Number(cg?.ripple?.usd_24h_change);
  if(!Number.isFinite(price))throw new Error('Fallback XRP price unavailable');
  return {
    exchange:'fallback',exchangeName:'XRP market fallback',pair:'XRP/USD',quote:'USD',
    price,change24h:Number.isFinite(change24h)?change24h:null,
    open24h:null,volume24hXrp:null,volume24hUsd:Number(cg?.ripple?.usd_24h_vol),
    high24h:null,low24h:null,range24hPct:null,bestBid:null,bestAsk:null,spread:null,spreadBps:null,
    marketCapUsd:Number(cg?.ripple?.usd_market_cap),
    source:'CoinGecko public XRP market fallback',
    generatedAt:new Date().toISOString()
  };
}
async function getMarket(exchangeId='coinbase'){
  try{
    return exchangeId==='all'?await getCompositeMarket():await getExchangeMarket(exchangeId);
  }catch(e){
    const fallback=await getFallbackXrpMarket();
    return {
      ...fallback,
      exchange:exchangeId==='all'?'all':'fallback',
      exchangeName:exchangeId==='all'?'All Exchanges · fallback':'XRP market fallback'
    };
  }
}
async function getExchangeHistory(id='coinbase'){
  const exchange=EXCHANGE_MARKETS[id]||EXCHANGE_MARKETS.coinbase;
  const cached=exchangeHistoryCache.get(exchange.id);
  if(cached&&Date.now()-cached.at<60*1000)return cached.data;
  let rows=[],points=[];
  if(exchange.id==='coinbase'){
    rows=await fetchJson('https://api.exchange.coinbase.com/products/XRP-USD/candles?granularity=300');
    points=(Array.isArray(rows)?rows:[]).map(r=>({time:n(r?.[0])*1000,low:n(r?.[1]),high:n(r?.[2]),open:n(r?.[3]),close:n(r?.[4]),volume:n(r?.[5])}));
  } else if(exchange.id==='kraken'){
    const d=await fetchJson('https://api.kraken.com/0/public/OHLC?pair=XRPUSD&interval=5');
    rows=Object.values(d?.result||{}).find(v=>Array.isArray(v))||[];
    points=rows.map(r=>({time:n(r?.[0])*1000,open:n(r?.[1]),high:n(r?.[2]),low:n(r?.[3]),close:n(r?.[4]),volume:n(r?.[6])}));
  } else if(exchange.id==='bitstamp'){
    const d=await fetchJson('https://www.bitstamp.net/api/v2/ohlc/xrpusd/?step=300&limit=288');
    rows=d?.data?.ohlc||[];
    points=rows.map(r=>({time:n(r?.timestamp)*1000,open:n(r?.open),high:n(r?.high),low:n(r?.low),close:n(r?.close),volume:n(r?.volume)}));
  } else if(exchange.id==='bitfinex'){
    rows=await fetchJson('https://api-pub.bitfinex.com/v2/candles/trade:5m:tXRPUSD/hist?limit=288&sort=1');
    points=(Array.isArray(rows)?rows:[]).map(r=>({time:n(r?.[0]),open:n(r?.[1]),close:n(r?.[2]),high:n(r?.[3]),low:n(r?.[4]),volume:n(r?.[5])}));
  } else if(exchange.id==='binanceus'||exchange.id==='mexc'){
    const base=exchange.id==='binanceus'?'https://api.binance.us':'https://api.mexc.com';
    rows=await fetchJson(base+'/api/v3/klines?symbol=XRPUSDT&interval=5m&limit=288');
    points=(Array.isArray(rows)?rows:[]).map(r=>({time:n(r?.[0]),open:n(r?.[1]),high:n(r?.[2]),low:n(r?.[3]),close:n(r?.[4]),volume:n(r?.[5])}));
  } else if(exchange.id==='okx'){
    const d=await fetchJson('https://www.okx.com/api/v5/market/candles?instId=XRP-USDT&bar=5m&limit=288');
    rows=d?.data||[];
    points=rows.map(r=>({time:n(r?.[0]),open:n(r?.[1]),high:n(r?.[2]),low:n(r?.[3]),close:n(r?.[4]),volume:n(r?.[5])}));
  } else if(exchange.id==='bybit'){
    const d=await fetchJson('https://api.bybit.com/v5/market/kline?category=spot&symbol=XRPUSDT&interval=5&limit=288');
    rows=d?.result?.list||[];
    points=rows.map(r=>({time:n(r?.[0]),open:n(r?.[1]),high:n(r?.[2]),low:n(r?.[3]),close:n(r?.[4]),volume:n(r?.[5])}));
  } else if(exchange.id==='kucoin'){
    rows=await fetchJson('https://api.kucoin.com/api/v1/market/candles?type=5min&symbol=XRP-USDT');
    rows=rows?.data||[];
    points=rows.map(r=>({time:n(r?.[0])*1000,open:n(r?.[1]),close:n(r?.[2]),high:n(r?.[3]),low:n(r?.[4]),volume:n(r?.[5])}));
  } else if(exchange.id==='gateio'){
    rows=await fetchJson('https://api.gateio.ws/api/v4/spot/candlesticks?currency_pair=XRP_USDT&interval=5m&limit=288');
    points=(Array.isArray(rows)?rows:[]).map(r=>({time:n(r?.[0])*1000,close:n(r?.[2]),high:n(r?.[3]),low:n(r?.[4]),open:n(r?.[5]),volume:n(r?.[6]??r?.[1])}));
  }
  points=points.filter(p=>Number.isFinite(p.time)&&Number.isFinite(p.close)).sort((a,b)=>a.time-b.time).slice(-288);
  if(!points.length)throw new Error(exchange.name+' chart unavailable');
  exchangeHistoryCache.set(exchange.id,{at:Date.now(),data:points});
  return points;
}
async function getMarketHistory(exchangeId='coinbase'){
  if(exchangeId==='all')return getExchangeHistory('coinbase');
  return getExchangeHistory(exchangeId);
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

app.get('/reset-xrpet', (_req, res) => {
  res.setHeader('Cache-Control','no-store, no-cache, must-revalidate');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'");
  res.type('html').send(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reset XRPet</title>
<style>
body{font-family:system-ui;background:#07131b;color:#eef8ff;margin:0;display:grid;place-items:center;min-height:100vh}
.card{max-width:520px;margin:24px;padding:28px;border:1px solid #214255;border-radius:20px;background:#0b1a24}
button{font:inherit;padding:14px 20px;border-radius:12px;border:0;cursor:pointer}
#status{margin-top:16px;color:#9fd7e8}
</style>
</head>
<body>
<div class="card">
<h1>Resetting XRPet</h1>
<p>This clears the old cached app and opens the current build.</p>
<button id="reset">Reset and reopen XRPet</button>
<p id="status">Ready.</p>
</div>
<script>
document.getElementById('reset').addEventListener('click', async () => {
  const status=document.getElementById('status');
  status.textContent='Clearing old XRPet cache…';
  try{
    if('serviceWorker' in navigator){
      const regs=await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r=>r.unregister()));
    }
    if('caches' in window){
      const keys=await caches.keys();
      await Promise.all(keys.map(k=>caches.delete(k)));
    }
    try{ localStorage.removeItem('xrpet-v1-state'); localStorage.removeItem('xrpet-v2-state'); }catch{}
    status.textContent='Done. Opening fresh XRPet…';
    setTimeout(()=>location.replace('/?fresh='+Date.now()),300);
  }catch(e){
    status.textContent='Reset finished with a browser warning. Opening XRPet…';
    setTimeout(()=>location.replace('/?fresh='+Date.now()),500);
  }
});
</script>
</body>
</html>`);
});

app.post('/api/visitor', (req, res) => {
  const id = clean(req.body?.visitorId || '').slice(0, 120);
  if (!id) return res.status(400).json({ error:'visitorId required' });
  const isNew = !visitorIds.has(id);
  if (isNew) {
    visitorIds.add(id);
    visitorCount += 1;
  }
  res.json({ count:visitorCount, isNew });
});

app.get('/api/visitor-count', (_req, res) => {
  res.json({ count:visitorCount });
});

app.get('/api/config', (_req, res) => {
  res.json({
    xamanApiKey: process.env.XAMAN_API_KEY || null,
    pushEnabled: Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY),
    siProviderEnabled: Boolean(process.env.SI_PROVIDER_KEY)
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

app.post('/api/xaman/webhook', express.json({type:'application/json', limit:'100kb'}), (req, res) => {
  // Xaman callback receiver. No secrets are logged or returned.
  const eventType = clean(req.body?.type || req.body?.event || req.body?.payload?.response?.txid || 'callback');
  console.log('Xaman webhook received:', eventType);
  res.status(200).json({ ok:true });
});

app.get('/xaman/callback', (_req, res) => {
  res.type('html').send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Xaman Connected</title><style>body{font-family:system-ui;background:#061018;color:#edf8ff;margin:0;display:grid;place-items:center;min-height:100vh}.card{max-width:520px;background:#0b1924;border:1px solid #17384a;border-radius:20px;padding:28px;text-align:center}a{color:#42e8ff}</style></head><body><div class="card"><h1>Xaman return complete</h1><p>You can return to XRPet and continue the wallet connection.</p><p><a href="/">Return to XRPet</a></p></div></body></html>`);
});


const XRPL_META_BASE='https://s1.xrplmeta.org/v2';
const ECOSYSTEM_CACHE_MS=5*60*1000;
app.get('/api/ecosystem/stats', async (_req,res)=>{
  try{
    if(cache.ecosystemStats.data&&Date.now()-cache.ecosystemStats.at<ECOSYSTEM_CACHE_MS){
      return res.json({...cache.ecosystemStats.data,cached:true});
    }
    const data=await fetchJsonWithTimeout(XRPL_META_BASE+'/server',{},8000);
    const payload={source:'XRPL Meta',...data,generatedAt:new Date().toISOString()};
    cache.ecosystemStats={at:Date.now(),data:payload};res.json(payload);
  }catch(e){
    if(cache.ecosystemStats.data)return res.json({...cache.ecosystemStats.data,cached:true,stale:true,warning:'Serving last-known-good XRPL Meta stats'});
    try{
      const {result,source}=await xrplRpc('server_info',[{}]);
      return res.json({source:'XRPL mainnet fallback',ledger_index:result?.info?.validated_ledger?.seq||null,network_id:result?.info?.network_id||0,degraded:true,generatedAt:new Date().toISOString(),rpcSource:source});
    }catch{}
    res.status(502).json({error:'XRPL ecosystem stats unavailable',detail:e.message})
  }
});
app.get('/api/ecosystem/tokens', async (req,res)=>{
  const limit=Math.max(1,Math.min(60,Number(req.query.limit)||24));
  const offset=Math.max(0,Number(req.query.offset)||0);
  const sortAllowed=new Set(['holders','supply','marketcap','price_percent_24h','price_percent_7d','volume_24h','volume_7d','exchanges_24h','exchanges_7d','takers_24h','takers_7d']);
  const sort=sortAllowed.has(String(req.query.sort))?String(req.query.sort):'holders';
  const search=clean(req.query.q||'').slice(0,80);
  const trust=clean(req.query.trust||'0,1,2,3');
  const key=JSON.stringify({limit,offset,sort,search,trust});
  const cached=cache.ecosystemTokens.get(key);
  if(cached&&Date.now()-cached.at<ECOSYSTEM_CACHE_MS)return res.json({...cached.data,cached:true});
  const params=new URLSearchParams({limit:String(limit),offset:String(offset),sort_by:sort,decode_currency:'true',expand_meta:'true'});
  if(search)params.set('name_like',search);
  if(/^[0-3](,[0-3])*$/.test(trust))params.set('trust_level',trust);
  try{
    let data;
    try{data=await fetchJsonWithTimeout(XRPL_META_BASE+'/tokens?'+params.toString(),{},10000)}
    catch{
      params.set('expand_meta','false');
      data=await fetchJsonWithTimeout(XRPL_META_BASE+'/tokens?'+params.toString(),{},8000);
    }
    const payload={source:'XRPL Meta',...data,generatedAt:new Date().toISOString()};
    cache.ecosystemTokens.set(key,{at:Date.now(),data:payload});
    res.json(payload);
  }catch(e){
    if(cached)return res.json({...cached.data,cached:true,stale:true,warning:'Serving last-known-good XRPL Meta token directory'});
    res.status(502).json({error:'XRPL token directory unavailable',detail:e.message,retryable:true});
  }
});

app.get('/api/xrpl/recent-transactions', async (_req,res)=>{
  try{
    const {result,source}=await xrplRpc('ledger',[{ledger_index:'validated',transactions:true,expand:true,api_version:2}]);
    const ledger=result?.ledger||result;
    const ledgerIndex=Number(result?.ledger_index||ledger?.ledger_index||ledger?.seqNum);
    const txs=Array.isArray(ledger?.transactions)?ledger.transactions:[];
    const transactions=txs.slice(-40).reverse().map(item=>({
      transaction:item?.tx_json||item?.tx||item,
      meta:item?.meta||item?.metaData||null,
      hash:item?.hash||item?.tx_hash||item?.tx_json?.hash||'',
      ledger_index:ledgerIndex,
      validated:result?.validated===true||ledger?.validated===true
    })).filter(x=>x.hash&&x.validated);
    res.json({validated:true,ledgerIndex,transactions,source,generatedAt:new Date().toISOString()});
  }catch(e){res.status(502).json({error:'XRPL recent transaction fallback unavailable',detail:e.message})}
});

async function getXrplXFeed(){
  const token=process.env.X_BEARER_TOKEN||'';
  const query=clean(process.env.XRPL_X_QUERY||'(XRPL OR "XRP Ledger") -is:retweet lang:en');
  if(!token)return {enabled:false,items:[],reason:'X_BEARER_TOKEN is not configured'};
  const params=new URLSearchParams({
    query:query.slice(0,512),
    max_results:'20',
    'tweet.fields':'created_at,author_id,public_metrics',
    expansions:'author_id',
    'user.fields':'username,name,verified'
  });
  const r=await fetch('https://api.x.com/2/tweets/search/recent?'+params.toString(),{
    headers:{authorization:'Bearer '+token,'user-agent':'XRPetSI/1.0'}
  });
  if(!r.ok)throw new Error('X API '+r.status);
  const d=await r.json();
  const users=new Map((d.includes?.users||[]).map(u=>[u.id,u]));
  const items=(d.data||[]).map(t=>{
    const u=users.get(t.author_id)||{};
    return {id:t.id,text:t.text,createdAt:t.created_at,author:u.name||u.username||'X',username:u.username||'',verified:!!u.verified,url:u.username?'https://x.com/'+u.username+'/status/'+t.id:'https://x.com/i/web/status/'+t.id};
  });
  return {enabled:true,items};
}
app.get('/api/ecosystem/x-feed', async (_req,res)=>{
  try{res.json(await getXrplXFeed())}
  catch(e){res.status(502).json({enabled:true,items:[],error:'X feed unavailable',detail:e.message})}
});

app.get('/api/x/status', (_req,res)=>{
  res.json({
    readEnabled:Boolean(process.env.X_BEARER_TOKEN),
    writeEnabled:Boolean(process.env.X_USER_ACCESS_TOKEN),
    query:clean(process.env.XRPL_X_QUERY||'(XRPL OR "XRP Ledger") -is:retweet lang:en'),
    provider:'X API v2'
  });
});
app.post('/api/x/post',rateLimit(8,60*1000),async(req,res)=>{
  const token=process.env.X_USER_ACCESS_TOKEN||'';
  if(!token)return res.status(503).json({error:'X posting is not configured',code:'X_WRITE_NOT_CONFIGURED'});
  const text=clean(req.body?.text||'');
  if(!text)return res.status(400).json({error:'Post text is required'});
  if(text.length>280)return res.status(400).json({error:'Post is too long for this XRPet composer'});
  try{
    const r=await fetch('https://api.x.com/2/tweets',{
      method:'POST',
      headers:{authorization:'Bearer '+token,'content-type':'application/json','user-agent':'XRPetSI/1.0'},
      body:JSON.stringify({text})
    });
    const d=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(d?.detail||d?.title||d?.errors?.[0]?.message||('X API '+r.status));
    const id=d?.data?.id;
    res.json({ok:true,id,text:d?.data?.text||text,url:id?'https://x.com/i/web/status/'+id:null});
  }catch(e){res.status(502).json({error:'X post failed',detail:e.message})}
});

app.get('/api/updates', async (_req, res) => {
  try {
    const items = await getUpdates();
    res.json({ generatedAt:new Date().toISOString(), sourcePolicy:'Official Ripple and XRPL sources are CONFIRMED.', items });
  } catch (e) {
    res.status(502).json({ error:'Official update feed unavailable', detail:e.message });
  }
});

app.get('/api/exchanges', (_req,res)=>{
  res.json({
    items:[
      {id:'all',name:'All Exchanges',pair:'Composite XRP/USD + XRP/USDT',mode:'composite'},
      ...Object.values(EXCHANGE_MARKETS).map(x=>({...x,mode:x.id==='coinbase'?'websocket+rest':'live-rest'}))
    ],
    generatedAt:new Date().toISOString()
  });
});
app.get('/api/exchange-board', async (_req,res)=>{
  const ids=Object.keys(EXCHANGE_MARKETS);
  const settled=await Promise.allSettled(ids.map(id=>getExchangeMarket(id)));
  const venues=settled.map((result,i)=>{
    const meta=EXCHANGE_MARKETS[ids[i]];
    if(result.status==='fulfilled'){
      const d=result.value;
      return {id:meta.id,name:meta.name,pair:meta.pair,quote:meta.quote,available:true,price:d.price,change24h:d.change24h,generatedAt:d.generatedAt};
    }
    return {id:meta.id,name:meta.name,pair:meta.pair,quote:meta.quote,available:false,price:null,change24h:null};
  });
  const live=venues.filter(v=>v.available&&Number.isFinite(v.price));
  const prices=live.map(v=>v.price).sort((a,b)=>a-b);
  const changes=live.map(v=>v.change24h).filter(Number.isFinite).sort((a,b)=>a-b);
  let fallback=null;
  if(!live.length){
    try{fallback=await getFallbackXrpMarket()}catch{}
  }
  const compositePrice=prices.length?prices[Math.floor(prices.length/2)]:(Number.isFinite(fallback?.price)?fallback.price:null);
  const compositeChange=changes.length?changes[Math.floor(changes.length/2)]:(Number.isFinite(fallback?.change24h)?fallback.change24h:null);
  res.json({
    composite:{
      id:'all',name:'All Exchanges',pair:'XRP/USD + XRP/USDT',
      price:compositePrice,change24h:compositeChange,venueCount:live.length,
      fallback:Boolean(fallback),source:fallback?.source||'Composite live exchange median'
    },
    venues,
    generatedAt:new Date().toISOString()
  });
});
app.get('/api/market', async (req, res) => {
  const exchange=clean(req.query.exchange||'coinbase').toLowerCase();
  if(exchange!=='all'&&!EXCHANGE_MARKETS[exchange])return res.status(400).json({error:'Unsupported exchange'});
  try { res.json(await getMarket(exchange)); }
  catch (e) { res.status(502).json({ error:'XRP market feed unavailable', detail:e.message, exchange }); }
});

app.get('/api/market-history', async (req, res) => {
  const exchange=clean(req.query.exchange||'coinbase').toLowerCase();
  if(exchange!=='all'&&!EXCHANGE_MARKETS[exchange])return res.status(400).json({error:'Unsupported exchange'});
  try {
    const points = await getMarketHistory(exchange);
    const meta=exchange==='all'?{name:'All Exchanges',pair:'XRP/USD + XRP/USDT'}:EXCHANGE_MARKETS[exchange];
    res.json({ exchange,exchangeName:meta.name,pair:meta.pair,granularitySeconds:300,points,source:(meta.name||'Exchange')+' public 5-minute candles',generatedAt:new Date().toISOString() });
  } catch (e) {
    res.status(502).json({ error:'XRP market history unavailable', detail:e.message, exchange });
  }
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
  const key = process.env.SI_PROVIDER_KEY;
  if (!key) return null;

  const url = process.env.SI_PROVIDER_URL || 'https://api.openai.com/v1/responses';
  const model = process.env.SI_MODEL || 'gpt-6-luna';
  const official = updates.slice(0, 5).map(x => ({ title:x.title, source:x.source, label:x.label, url:x.url }));
  const instructions = [
    'You are the SI core inside XRPet, an XRP Ledger companion.',
    'Use supplied live data as ground truth.',
    'Clearly separate confirmed facts, interpretation, and speculation.',
    'Never promise XRP price outcomes or ask for a seed phrase or private key.',
    'Be concise, useful, and companion-like.',
    'Respect the requested explanation level.'
  ].join(' ');

  try {
    if (url.includes('/responses')) {
      const r = await fetch(url, {
        method:'POST',
        headers:{ 'content-type':'application/json', 'authorization':'Bearer '+key },
        body:JSON.stringify({
          model,
          instructions,
          input: JSON.stringify({ message, context, market, officialUpdates:official })
        })
      });
      if (!r.ok) return null;
      const d = await r.json();
      return clean(
        d?.output_text ||
        d?.output?.flatMap?.(x=>x?.content||[])?.map?.(x=>x?.text||'')?.join?.(' ') ||
        ''
      );
    }

    const r = await fetch(url, {
      method:'POST',
      headers:{ 'content-type':'application/json', 'authorization':'Bearer '+key },
      body:JSON.stringify({
        model,
        messages:[
          { role:'system', content:instructions },
          { role:'user', content:JSON.stringify({ message, context, market, officialUpdates:official }) }
        ],
        temperature:0.4
      })
    });
    if (!r.ok) return null;
    const d = await r.json();
    return clean(d?.choices?.[0]?.message?.content || d?.output_text || '');
  } catch {
    return null;
  }
}

function deterministicCompanionDecision(context={}) {
  const needs=context.needs||{};
  const txRecent=Number(context.recentTxSeconds ?? 9999);
  const priceMove=Math.abs(Number(context.priceTickPct)||0);
  const choices=[];
  const add=(action,weight,thought,visitStation=false)=>choices.push({action,weight,thought,visitStation});
  add('roam',3,'I want to wander around XRPet and watch what changes.');
  add('scan',txRecent<15?4:1,'I want to check the live ledger signal.');
  add('wave',1.4,'I feel like greeting whoever is here.');
  add('dance',priceMove>.05?2.6:.5,'The market moved enough to give me some extra energy.');
  add('run',txRecent<8?1.7:.55,'I want to move quickly across XRPet and check another area.');
  add('jump',priceMove>.08?1.4:.35,'I have enough energy for a quick jump.');
  add('crouch',.35,'I want to lower my stance and observe for a moment.');
  add('turn',.45,'I want to turn and look around the interface.');
  add('reach',.4,'I want to reach toward something nearby and inspect it.');
  add('climb',.12,'I want to practice a climbing motion.');
  add('socialize',Number(needs.social)<50?2.6:context.newAnnouncement?2.8:.4,'I want to check in with Signal Friend.',false);
  const total=choices.reduce((n,x)=>n+x.weight,0);
  let roll=Math.random()*total;
  let chosen=choices[0];
  for(const item of choices){roll-=item.weight;if(roll<=0){chosen=item;break}}
  return { action:chosen.action, thought:chosen.thought, visitStation:chosen.visitStation, mode:'local-autonomy' };
}

async function askExternalDecision(context={}) {
  const key=process.env.SI_PROVIDER_KEY;
  if(!key)return null;
  const market=await getMarket().catch(()=>({}));
  const updates=await getUpdates().catch(()=>[]);
  const prompt=[
    'Choose ONE next autonomous behavior for Ripplet, an XRPet companion.',
    'Allowed actions: roam, socialize, scan, wave, dance, focus, run, jump, climb, reach, grab, carry, crouch, turn.',
    'Return strict JSON only with keys action, thought, visitStation.',
    'visitStation must be false. Ripplet no longer has food, water, or sleep needs.',
    'Keep thought under 110 characters.',
    'Use live XRPL state and social context; do not make financial predictions.'
  ].join(' ');
  const raw=await askExternalSI(prompt, {...context, autonomousDecision:true}, market, updates);
  if(!raw)return null;
  try{
    const text=raw.replace(/`{3}json|`{3}/gi,'').trim();
    const parsed=JSON.parse(text);
    const allowed=new Set(['roam','socialize','scan','wave','dance','focus','run','jump','climb','reach','grab','carry','crouch','turn']);
    if(!allowed.has(parsed.action))return null;
    return {
      action:parsed.action,
      thought:clean(parsed.thought||'I chose my next move.').slice(0,110),
      visitStation:false,
      mode:'external-si-autonomy'
    };
  }catch{return null}
}

app.post('/api/companion/decision', async (req,res)=>{
  const context=req.body?.context||{};
  let decision=null;
  try{decision=await askExternalDecision(context)}catch{}
  if(!decision)decision=deterministicCompanionDecision(context);
  res.json(decision);
});
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

app.get('/api/self-test', (_req, res) => {
  const integrations = {
    xrpl: { configured:true, endpoint:'wss://xrplcluster.com/' },
    xaman: { configured:Boolean(process.env.XAMAN_API_KEY) },
    push: { configured:Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) },
    si: { configured:Boolean(process.env.SI_PROVIDER_KEY), provider:process.env.SI_PROVIDER_URL ? 'configured' : 'default', model:process.env.SI_MODEL || 'default' }
  };
  res.json({
    ok: integrations.xaman.configured && integrations.push.configured && integrations.si.configured,
    integrations
  });
});

app.get('/api/health', (_req, res) => res.json({
  ok:true, product:'XRPet SI Companion', version:'5.5.31',
  capabilities:['xrpl-live','xrp-market','official-updates','truth-mode','companion-memory','evolution','notifications','wallet-watch','gemwallet','xaman-hook','web-push','capacitor-mobile','external-si-hook','interactive-webgl-companion','signal-589-community-layer','equipment-matrix','full-audio-engine','room-environments','rigged-glb-roster','glass-studio-ui','orbit-camera','ssao','bloom','adaptive-render-quality','ripple-xrp-living-archive','auto-updating-history','ripplet-single-companion','nft-companion-override','persistent-ripplet','in-app-companion-workspaces','audio-default-on','isolated-primary-views','one-minute-live-refresh','simplified-ripplet-page','ripplet-life-system','bounded-companion-habitat','live-xrpl-transactions','sidebar-history-routing','global-xrp-ticker','cinematic-ripple-launch','global-ripplet-ecosystem','data-driven-companion-life','bounded-roaming-companion','ripplet-primary-tab','varied-live-reactions','visitor-counter','clean-home','clean-xrpl-live','expressive-ripplet-limbs','life-reaction-sounds','visible-ripplet-feet','free-roam-companion','live-reaction-overlays','spontaneous-companion-actions','xrpet-custom-cursor','ripplet-walk-cycle','autonomous-companion-mind','si-behavior-decisions','xrp-market-history','live-market-chart','ripplet-2-runtime','global-eye-tracking','organic-companion-anatomy','xrpet-games','ledger-rush','xrp-flow-game','consensus-80-game','ripplet-3-runtime','superellipsoid-shell-geometry','unified-head-rig','randomized-natural-blink','transparent-direct-alpha-render','high-detail-micro-hardware','validated-mainnet-transaction-feed','xrpl-source-failover','live-bid-ask-spread','24h-market-detail','viewport-layout-guard','physical-motor-cortex','run-gait','jump-arc','climb-cycle','reach-grab-carry','crouch-balance','autonomous-physical-motion','viewport-contained-scroll','grounded-free-roam','no-ground-ring','advanced-arcade-difficulty','arcade-combos-and-hazards','music-waveform','x-api-posting','xrpl-http-transaction-fallback','ecosystem-last-good-cache','ecosystem-retry-fallback','ripplet-v6-skinned-rig','native-animation-library','native-emote-library'],
  integrations:{ xaman:Boolean(process.env.XAMAN_API_KEY), push:Boolean(VAPID_PUBLIC_KEY&&VAPID_PRIVATE_KEY), si:Boolean(process.env.SI_PROVIDER_KEY) }
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

app.listen(PORT, () => {
  console.log(`XRPet // Signal 589 v5.5.1 running on http://localhost:${PORT}`);
  console.log('Integration readiness:', {
    xaman:Boolean(process.env.XAMAN_API_KEY),
    push:Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY),
    si:Boolean(process.env.SI_PROVIDER_KEY)
  });
});
