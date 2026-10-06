const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
const STORE='xrpet-v2-state';
const safe=(fn)=>{try{return fn()}catch(e){console.warn(e);return null}};
const saved=safe(()=>JSON.parse(localStorage.getItem(STORE)||'{}'))||{};
const enableAudioDefaults=saved.audioDefaultsV41!==true;
const state={
  connected:false,ledgerIndex:null,txCount:0,baseFeeDrops:null,
  xrpPrice:null,xrpChange24h:null,
  petName:'Ripplet',personality:'Guardian',
  focus:saved.focus||'',xp:Number(saved.xp)||0,streak:Number(saved.streak)||0,
  lastVisitDate:saved.lastVisitDate||null,lastMissionDate:saved.lastMissionDate||null,
  room:saved.room||'nexus',cosmetic:'classic',memories:Array.isArray(saved.memories)?saved.memories:[],
  account:saved.account||null,walletProvider:saved.walletProvider||'manual',
  explainLevel:saved.explainLevel||'balanced',notifyLevel:saved.notifyLevel||'quiet',
  truthMode:saved.truthMode!==false,marketMood:saved.marketMood!==false,
  floatingPinned:saved.floatingPinned===true,floatX:Number.isFinite(saved.floatX)?saved.floatX:null,floatY:Number.isFinite(saved.floatY)?saved.floatY:null,
  nftCompanion:saved.nftCompanion||null,
  companionKind:'ripplet',companionGender:'neutral',
  eyeStyle:saved.eyeStyle||'cyan',coreStyle:saved.coreStyle||'standard',headGear:saved.headGear||'none',trailStyle:saved.trailStyle||'none',
  graphicsQuality:saved.graphicsQuality||'auto',
  audioDefaultsV41:true,
  soundEnabled:enableAudioDefaults?true:saved.soundEnabled!==false,soundVolume:Number.isFinite(saved.soundVolume)?saved.soundVolume:35,
  interfaceSound:enableAudioDefaults?true:saved.interfaceSound!==false,ambientSound:enableAudioDefaults?true:saved.ambientSound!==false,ledgerSound:enableAudioDefaults?true:saved.ledgerSound!==false,
  signalLoreIndex:Number.isFinite(saved.signalLoreIndex)?saved.signalLoreIndex:0,
  lifeSocial:Number.isFinite(saved.lifeSocial)?saved.lifeSocial:82,
  lifeActivity:saved.lifeActivity||'explore',
  lifeRoaming:saved.lifeRoaming!==false,
  lifePinned:false,
  lifeLastTick:Number(saved.lifeLastTick)||Date.now(),
  lastLedgerTxAt:Number(saved.lastLedgerTxAt)||0,
  lastAnnouncementTitle:saved.lastAnnouncementTitle||'',
  lastAnnouncementAt:Number(saved.lastAnnouncementAt)||0,
  lastMarketPrice:Number.isFinite(saved.lastMarketPrice)?saved.lastMarketPrice:null,
  lastPriceTickPct:Number.isFinite(saved.lastPriceTickPct)?saved.lastPriceTickPct:0,
  selectedExchange:saved.selectedExchange||'all',
  mindAction:saved.mindAction||'roam',
  mindThought:saved.mindThought||'Watching the Ledger and deciding what to do next.',
  mindMode:saved.mindMode||'local-autonomy'
};
const FORMS=[['Drop',0],['Ripple',50],['Wave',150],['Surge',350],['Nexus',700],['Titan',1200],['Legend',2000]];
const ROOM_NAMES={nexus:'Neon Horizon',ocean:'Ripple Sanctuary',vault:'Ledger Vault',aurora:'Sky Garden',legend:'Orbital Station',genesis:'Genesis Chamber',city:'Settlement City',quantum:'Quantum Ledger Lab',desert:'Digital Oasis',arctic:'Arctic Node'};
const COSMETIC_NAMES={classic:'Classic Nexus',aqua:'Ripple Scout',midnight:'Ledger Guardian',pearl:'Oracle Halo',solar:'Solar Vanguard',resonance:'589 Resonance'};
const COMPANION_NAMES={ripplet:'Ripplet'};
const SIGNAL_589_LORE=[
  'Community lore note: 589 has become a long-running XRP cultural symbol. XRPet treats it as an easter egg, not a confirmed price target.',
  'Signal archive: XRP communities have attached meaning to recurring numbers, screenshots, riddles, and historical posts. These interpretations remain community speculation.',
  'Ledger truth check: XRPL validation, fees, account activity, and transaction data are measurable. Symbolic 589 interpretations are a separate culture layer.',
  'Signal discipline: a memorable number can become community mythology without becoming protocol evidence. XRPet keeps those categories visibly separated.',
  'Community signal: use the mystery for lore, collectibles, and discovery—not as proof of future XRP price or Ripple plans.',
  'Archive 589: the strongest version of the idea is cultural identity—hidden markers, rare equipment, serials, and community references built around a shared motif.'
];
function hexToUtf8(hex){try{return decodeURIComponent(hex.match(/.{1,2}/g).map(b=>'%'+b).join(''))}catch{return''}}
function mediaUrl(uri){
  if(!uri)return null;
  if(uri.startsWith('ipfs://')) return 'https://ipfs.io/ipfs/'+uri.slice(7).replace(/^ipfs\//,'');
  if(/^https:\/\//i.test(uri)) return uri;
  return null;
}
async function resolveNftMedia(uri){
  const direct=mediaUrl(uri);
  if(!direct)return {uri,media:null,model:null};
  if(/\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(direct))return {uri,media:direct,model:null};
  if(/\.(glb|gltf)(\?.*)?$/i.test(direct))return {uri,media:null,model:direct};
  try{
    const r=await fetch(direct,{cache:'no-store'});
    if(!r.ok)throw new Error();
    const d=await r.json();
    const img=mediaUrl(d.image||d.image_url||d.image_uri||'');
    const anim=mediaUrl(d.animation_url||d.model||d.model_url||'');
    return {uri,media:img,model:/\.(glb|gltf)(\?.*)?$/i.test(anim||'')?anim:null,name:d.name||null,description:d.description||null};
  }catch{return {uri,media:null,model:null}}
}
function persist(){state.petName='Ripplet';state.personality='Guardian';state.companionKind='ripplet';state.companionGender='neutral';state.cosmetic='classic';safe(()=>localStorage.setItem(STORE,JSON.stringify({...state,connected:undefined,ledgerIndex:undefined,txCount:undefined,baseFeeDrops:undefined,xrpPrice:undefined,xrpChange24h:undefined})))}
function form(){return [...FORMS].reverse().find(x=>state.xp>=x[1])||FORMS[0]}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function setText(sel,text){const el=q(sel);if(el)el.textContent=text}
function mood(label,speech,cls='calm'){setText('#petMood',label);setText('#homePetMood',label);setText('#petSpeech',speech);const action=cls==='alert'?'alert':cls==='energized'?'happy':'greet';window.XRPet3D?.react?.(action);window.dispatchEvent(new CustomEvent('xrpet:appearance',{detail:{room:state.room,cosmetic:state.cosmetic,companionKind:state.companionKind,companionGender:state.companionGender,eyeStyle:state.eyeStyle,coreStyle:state.coreStyle,headGear:state.headGear,trailStyle:state.trailStyle,mood:cls}}))}
function renderSignal589(){
  const connected=!!state.connected;
  const tx=Number(state.txCount)||0;
  const change=Number(state.xrpChange24h);
  const hasMarket=Number.isFinite(change);
  const pulse=!connected?'OFFLINE':tx>=80?'HIGH FLOW':tx>=20?'STEADY':'QUIET';
  const ledger=connected?'VALIDATED':'WAITING';
  const health=connected?'LIVE / VALIDATED':'CONNECTING';
  const stateLabel=connected?'SIGNAL LOCKED':'STANDBY';
  const lore=SIGNAL_589_LORE[((state.signalLoreIndex%SIGNAL_589_LORE.length)+SIGNAL_589_LORE.length)%SIGNAL_589_LORE.length];

  setText('#signal589State',stateLabel);
  setText('#signal589Message',lore);
  setText('#signalLedger',ledger);
  setText('#communityPulse',pulse);
  setText('#signalTruth',state.truthMode?'SEPARATED':'BASIC');
  setText('#homeSignal589',connected?'589 // LOCKED':'589 // STANDBY');
  setText('#homeSignalCaption','Community lore · not protocol fact');
  setText('#homeLedgerHealth',health);

  const section=q('#signal589Section');
  if(section){
    section.dataset.pulse=pulse.toLowerCase().replace(/\s+/g,'-');
    section.dataset.market=hasMarket?(change>2?'positive':change<-2?'negative':'neutral'):'unknown';
  }
}


const LIFE_STATIONS={
  socialize:{label:'Signal Friend',thought:'I am checking the latest XRPL signal and reacting to what changed.'},
  explore:{label:'Roaming XRPet',thought:'I am moving through XRPet and watching for the next live signal.'},
  ledger:{label:'Watching XRPL',thought:'I am monitoring validated XRP Ledger activity.'},
};
function clampNeed(v){return Math.max(0,Math.min(100,Number(v)||0))}
function renderLife(){
  const cfg=LIFE_STATIONS[state.lifeActivity]||LIFE_STATIONS.explore;
  setText('#lifeMode',cfg.label);setText('#lifeThought',cfg.thought);
}
const LIFE_REACTIONS={
  socialize:[
    {name:'Signal Wave',actions:[['wave',0],['greet',950]],sounds:[['wave',0],['greet',900]],variant:'a'},
    {name:'Signal High-Five',actions:[['highfive',0],['celebrate',1100]],sounds:[['highfive',0],['celebrate',1100]],variant:'b'},
    {name:'Signal Dance',actions:[['dance',0],['orbit',1200]],sounds:[['dance',0],['success',1200]],variant:'c'}
  ]
};
const lastLifeReaction={};
let lifeReactionTimers=[];
function playLifeReaction(activity){
  const options=LIFE_REACTIONS[activity];
  if(!options?.length)return null;
  let choices=options.map((_,i)=>i).filter(i=>i!==lastLifeReaction[activity]);
  if(!choices.length)choices=options.map((_,i)=>i);
  const index=choices[Math.floor(Math.random()*choices.length)];
  lastLifeReaction[activity]=index;
  const choice=options[index];
  lifeReactionTimers.forEach(clearTimeout);lifeReactionTimers=[];
  const avatar=q('#lifeAvatar');
  if(avatar){avatar.dataset.reaction=choice.variant;avatar.dataset.reactionName=choice.name}
  choice.actions.forEach(([actionName,delay])=>lifeReactionTimers.push(setTimeout(()=>window.XRPet3D?.perform?.(actionName),delay)));
  (choice.sounds||[]).forEach(([soundName,delay])=>lifeReactionTimers.push(setTimeout(()=>playSound(soundName,true),delay)));
  setText('#lifeMode',choice.name);
  return choice;
}
function performLifeActivity(activity,manual=false,moveToStation=false){
  if(!['socialize','explore','ledger'].includes(activity))activity='explore';
  state.lifeActivity=activity;
  if(activity==='socialize')state.lifeSocial=clampNeed(state.lifeSocial+(manual?8:2));
  const reaction=activity==='ledger'?'scan':activity==='socialize'?'wave':'greet';
  const lifeReaction=activity==='socialize'?playLifeReaction(activity):null;
  if(!lifeReaction)window.XRPet3D?.perform?.(reaction);
  if(moveToStation&&activity!=='socialize')window.XRPetRoam?.go?.(activity);
  clearTimeout(lifeReturnTimer);
  if(activity==='socialize'){
    lifeReturnTimer=setTimeout(()=>{state.lifeActivity='explore';renderLife();persist()},4200);
  }
  renderLife();persist();
}
function lifeTick(){
  state.lifeLastTick=Date.now();
  renderLife();persist();
}
function render(){
  const [name,min]=form(); const i=FORMS.findIndex(x=>x[0]===name); const next=FORMS[Math.min(i+1,FORMS.length-1)];
  setText('#petName',state.petName);setText('#chatPetName',state.petName);setText('#topPetName',state.petName);setText('#floatingPetName',state.nftCompanion?.name||state.petName);setText('#studioCompanionName',state.nftCompanion?.name||state.petName);setText('#studioQualityBadge',(state.graphicsQuality||'auto').toUpperCase()+' QUALITY');setText('#evolution',name.toUpperCase());
  const lvl=Math.floor(state.xp/100)+1; setText('#level','Lv. '+lvl);setText('#xpLabel',state.xp+' XP');setText('#topLevel','Level '+lvl);setText('#topXp',state.xp+' XP');
  const pct=name==='Legend'?100:Math.max(0,Math.min(100,(state.xp-min)/(next[1]-min)*100));
  if(q('#xpFill'))q('#xpFill').style.width=pct+'%';
  if(q('#profileName'))q('#profileName').value=state.petName;
  if(q('#profilePersonality'))q('#profilePersonality').value=state.personality;
  if(q('#profileFocus'))q('#profileFocus').value=state.focus;
  setText('#personalityChip',state.personality);setText('#streakChip',state.streak+' day streak');
  if(q('#account'))q('#account').value=state.account||'';
  setText('#walletProvider',state.walletProvider==='manual'?'Manual':state.walletProvider);
  setText('#walletState',state.account?'Watching '+state.account.slice(0,8)+'…'+state.account.slice(-6)+' for validated activity.':'No public account is being watched.');
  bind('#decode589','click',()=>{
  state.signalLoreIndex=(state.signalLoreIndex+1)%SIGNAL_589_LORE.length;
  persist();renderSignal589();playSound('notification');
  window.XRPet3D?.perform?.('scan');
});

qa('.room-choice').forEach(b=>{const rank=FORMS.findIndex(x=>x[0]===name),need=0;b.disabled=rank<need;const active=b.dataset.room===state.room;b.classList.toggle('active',active);const e=b.querySelector('em');if(e&&active)e.textContent='Active';else if(e)e.textContent=need?((b.dataset.room==='aurora')?'Wave+':'Titan+'):'Unlocked'}); qa('.cosmetic-choice').forEach(b=>{const active=b.dataset.cosmetic===state.cosmetic;b.classList.toggle('active',active);const e=b.querySelector('em');if(e)e.textContent=active?'Equipped':'Owned'});
  document.body.classList.remove('room-nexus','room-ocean','room-vault','room-aurora','room-legend','room-genesis','room-city','room-quantum','room-desert','room-arctic');document.body.classList.add('room-'+state.room); const pet=q('#pet'); if(pet){pet.classList.remove('skin-classic','skin-aqua','skin-midnight','skin-pearl','skin-solar','skin-resonance');pet.classList.add('skin-'+state.cosmetic)}
  setText('#unlocksChip',Object.keys(ROOM_NAMES).length+' environments');setText('#homeRoom',ROOM_NAMES[state.room]||state.room);setText('#homeCosmetic',COSMETIC_NAMES[state.cosmetic]||state.cosmetic);setText('#homeCompanionModel',COMPANION_NAMES[state.companionKind]||state.companionKind);setText('#homeCompanionGender','Official XRPet companion');setText('#companionModelChip','OFFICIAL // RIPPLET');
  if(q('#explainLevel'))q('#explainLevel').value=state.explainLevel;if(q('#notifyLevel'))q('#notifyLevel').value=state.notifyLevel;
  if(q('#truthToggle'))q('#truthToggle').checked=state.truthMode;if(q('#marketMoodToggle'))q('#marketMoodToggle').checked=state.marketMood;
  if(q('#soundToggle'))q('#soundToggle').checked=state.soundEnabled;if(q('#soundVolume'))q('#soundVolume').value=state.soundVolume;
  if(q('#interfaceSoundToggle'))q('#interfaceSoundToggle').checked=state.interfaceSound;if(q('#ambientSoundToggle'))q('#ambientSoundToggle').checked=state.ambientSound;if(q('#ledgerSoundToggle'))q('#ledgerSoundToggle').checked=state.ledgerSound;if(q('#graphicsQuality'))q('#graphicsQuality').value=state.graphicsQuality;
  qa('.companion-choice').forEach(b=>b.classList.toggle('active',b.dataset.companion===state.companionKind));qa('.gender-choice').forEach(b=>b.classList.toggle('active',b.dataset.gender===state.companionGender));
  qa('[data-eye-style]').forEach(b=>b.classList.toggle('active',b.dataset.eyeStyle===state.eyeStyle));
  qa('[data-core-style]').forEach(b=>b.classList.toggle('active',b.dataset.coreStyle===state.coreStyle));
  qa('[data-head-gear]').forEach(b=>b.classList.toggle('active',b.dataset.headGear===state.headGear));
  qa('[data-trail-style]').forEach(b=>b.classList.toggle('active',b.dataset.trailStyle===state.trailStyle));
  window.dispatchEvent(new CustomEvent('xrpet:appearance',{detail:{room:state.room,cosmetic:state.cosmetic,companionKind:state.companionKind,companionGender:state.companionGender,eyeStyle:state.eyeStyle,coreStyle:state.coreStyle,headGear:state.headGear,trailStyle:state.trailStyle,mood:state.networkMood||'calm'}}));
  renderMemory();renderSignal589();renderLife();renderMind();
}
function renderMemory(){const box=q('#memoryList');if(!box)return;box.innerHTML=state.memories.length?state.memories.map((m,i)=>'<span class="memory-chip">'+esc(m)+' <button type="button" data-rm="'+i+'">×</button></span>').join(''):'<span class="muted">No saved preferences.</span>';qa('[data-rm]').forEach(b=>b.addEventListener('click',()=>{state.memories.splice(Number(b.dataset.rm),1);persist();renderMemory()}))}
function addXp(n){state.xp+=n;persist();render()}
function dailyVisit(){const t=new Date().toISOString().slice(0,10);if(state.lastVisitDate!==t){const y=new Date(Date.now()-86400000).toISOString().slice(0,10);state.streak=state.lastVisitDate===y?state.streak+1:1;state.lastVisitDate=t;state.xp+=5;persist()}}
function bubble(text,type='assistant'){const box=q('#chat');if(!box)return;const d=document.createElement('div');d.className='bubble '+type;d.textContent=text;box.appendChild(d);box.scrollTop=box.scrollHeight}
function context(){return{connected:state.connected,ledgerIndex:state.ledgerIndex,txCount:state.txCount,baseFeeDrops:state.baseFeeDrops,petName:state.petName,personality:state.personality,focus:state.focus,explainLevel:state.explainLevel,memories:state.memories}}
async function ask(message){
  playSound('chatSend');bubble(message,'user');bubble('Thinking…','assistant');const box=q('#chat');const pending=box?.lastElementChild;
  try{const r=await fetch('/api/companion',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message,context:context()})});const d=await r.json();if(!r.ok)throw new Error(d.error||'SI request failed');if(pending)pending.textContent=d.reply||'No response returned.';playSound('chatReceive')}
  catch(e){if(pending)pending.textContent='SI is unavailable right now: '+e.message;playSound('error')}
}
let visitorShown=0,visitorPollTimer=0;
function formatVisitorCount(n){return Math.max(0,Number(n)||0).toString().padStart(6,'0')}
function animateVisitorCount(n){
  const next=Math.max(0,Number(n)||0);
  if(next===visitorShown&&visitorShown!==0)return;
  visitorShown=next;
  for(const sel of ['#visitorCount','#homeVisitorCount']){
    const el=q(sel);if(!el)continue;
    el.classList.remove('ticker-turn');void el.offsetWidth;el.textContent=formatVisitorCount(next);el.classList.add('ticker-turn');
  }
}
async function registerVisitor(){
  let visitorId=safe(()=>localStorage.getItem('xrpet-visitor-id'));
  if(!visitorId){
    visitorId=(globalThis.crypto?.randomUUID?.()||('xrpet-'+Date.now()+'-'+Math.random().toString(36).slice(2)));
    safe(()=>localStorage.setItem('xrpet-visitor-id',visitorId));
  }
  try{
    const r=await fetch('/api/visitor',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({visitorId})});
    const d=await r.json();if(r.ok)animateVisitorCount(d.count);
  }catch{}
  clearInterval(visitorPollTimer);
  visitorPollTimer=setInterval(async()=>{try{const r=await fetch('/api/visitor-count',{cache:'no-store'});const d=await r.json();if(r.ok&&Number(d.count)!==visitorShown)animateVisitorCount(d.count)}catch{}},3000);
}

let marketWs=null,marketRetry=0,marketPollTimer=0,marketLastTickAt=0,liveChartPoints=[];
const EXCHANGE_LABELS={
  all:{name:'All Exchanges',pair:'XRP/USD + XRP/USDT',quote:'MIXED'},
  coinbase:{name:'Coinbase',pair:'XRP/USD',quote:'USD'},
  kraken:{name:'Kraken',pair:'XRP/USD',quote:'USD'},
  bitstamp:{name:'Bitstamp',pair:'XRP/USD',quote:'USD'},
  bitfinex:{name:'Bitfinex',pair:'XRP/USD',quote:'USD'},
  binanceus:{name:'Binance.US',pair:'XRP/USDT',quote:'USDT'},
  okx:{name:'OKX',pair:'XRP/USDT',quote:'USDT'},
  bybit:{name:'Bybit',pair:'XRP/USDT',quote:'USDT'},
  kucoin:{name:'KuCoin',pair:'XRP/USDT',quote:'USDT'},
  gateio:{name:'Gate.io',pair:'XRP/USDT',quote:'USDT'},
  mexc:{name:'MEXC',pair:'XRP/USDT',quote:'USDT'}
};
function fmtMarketNumber(v,digits=4){
  const n=Number(v);return Number.isFinite(n)?'$'+n.toFixed(digits):'—';
}
function fmtCompact(v,suffix=''){
  const n=Number(v);if(!Number.isFinite(n))return '—';
  if(Math.abs(n)>=1e9)return (n/1e9).toFixed(2)+'B'+suffix;
  if(Math.abs(n)>=1e6)return (n/1e6).toFixed(2)+'M'+suffix;
  if(Math.abs(n)>=1e3)return (n/1e3).toFixed(1)+'K'+suffix;
  return n.toFixed(2)+suffix;
}
function selectedExchangeMeta(){
  return EXCHANGE_LABELS[state.selectedExchange]||EXCHANGE_LABELS.all;
}
function renderExchangeSelection(){
  const meta=selectedExchangeMeta();
  setText('#selectedExchangeName',meta.name);
  setText('#marketPairLabel',meta.pair);
  setText('#marketBidVenue',meta.name);
  setText('#marketAskVenue',meta.name);
  setText('#chartQuoteVolumeLabel',meta.quote==='USDT'?'USDT VOLUME':meta.quote==='USD'?'USD VOLUME':'QUOTE VOLUME');
  setText('#marketChartEyebrow',meta.pair+' // '+meta.name.toUpperCase());
  setText('#marketChartCopy',state.selectedExchange==='all'
    ? 'Composite XRP price and 24-hour market snapshot across supported public exchanges. The chart uses a liquid reference candle feed while the composite snapshot refreshes live.'
    : 'Rolling 5-minute XRP market history from '+meta.name+' public market data. This is descriptive market data, not a prediction.');
  qa('[data-exchange]').forEach(b=>b.classList.toggle('active',b.dataset.exchange===state.selectedExchange));
}
function updateMarketDetail(d={}){
  const bid=Number(d.bestBid??d.best_bid),ask=Number(d.bestAsk??d.best_ask),price=Number(d.price);
  const spread=Number.isFinite(bid)&&Number.isFinite(ask)?ask-bid:Number(d.spread);
  const spreadBps=Number.isFinite(spread)&&Number.isFinite(price)&&price>0?(spread/price)*10000:Number(d.spreadBps);
  const meta=EXCHANGE_LABELS[d.exchange]||selectedExchangeMeta();
  setText('#marketBid',fmtMarketNumber(bid,5));
  setText('#marketAsk',fmtMarketNumber(ask,5));
  setText('#marketBidVenue',d.exchangeName||meta.name);
  setText('#marketAskVenue',d.exchangeName||meta.name);
  setText('#marketSpread',Number.isFinite(spread)?'$'+spread.toFixed(6):'—');
  setText('#marketSpreadBps',Number.isFinite(spreadBps)?spreadBps.toFixed(2)+' bps':'— bps');
  setText('#chartOpen',Number.isFinite(Number(d.open24h))?fmtMarketNumber(d.open24h):'—');
  setText('#chartHigh',Number.isFinite(Number(d.high24h))?fmtMarketNumber(d.high24h):'—');
  setText('#chartLow',Number.isFinite(Number(d.low24h))?fmtMarketNumber(d.low24h):'—');
  setText('#chartVolume',Number.isFinite(Number(d.volume24hXrp))?fmtCompact(d.volume24hXrp,' XRP'):'—');
  setText('#chartVolumeUsd',Number.isFinite(Number(d.volume24hUsd))?'$'+fmtCompact(d.volume24hUsd):'—');
  setText('#chartRangePct',Number.isFinite(Number(d.range24hPct))?Number(d.range24hPct).toFixed(2)+'%':'—');
  if(d.source)setText('#marketSource',d.source);
  if(d.generatedAt)setText('#marketLastTick',new Date(d.generatedAt).toLocaleTimeString([], {hour:'numeric',minute:'2-digit',second:'2-digit'}));
}
function mergeLiveTickIntoChart(p){
  if(!Number.isFinite(p)||p<=0)return;
  const now=Date.now(),bucket=Math.floor(now/300000)*300000;
  const last=liveChartPoints[liveChartPoints.length-1];
  if(last&&Math.floor(Number(last.time)/300000)*300000===bucket){
    last.close=p;last.high=Math.max(Number(last.high)||p,p);last.low=Math.min(Number(last.low)||p,p);last.time=now;
  }else{
    liveChartPoints.push({time:now,open:p,high:p,low:p,close:p,volume:0});
  }
  if(liveChartPoints.length>288)liveChartPoints=liveChartPoints.slice(-288);
}
function applyLiveMarketTick(ticker={}){
  if(state.selectedExchange!=='coinbase')return;
  const p=Number(ticker.price);
  if(!Number.isFinite(p)||p<=0)return;
  const previousPrice=state.lastMarketPrice;
  state.xrpPrice=p;state.lastMarketPrice=p;
  const change24h=Number(ticker.price_percent_chg_24_h);
  if(Number.isFinite(change24h))state.xrpChange24h=change24h;
  if(Number.isFinite(previousPrice)&&previousPrice!==p)state.lastPriceTickPct=(p-previousPrice)/previousPrice*100;
  const livePrice='$'+p.toFixed(5);
  const liveChange=Number.isFinite(state.xrpChange24h)?(state.xrpChange24h>=0?'+':'')+state.xrpChange24h.toFixed(2)+'% · 24h':'STREAMING';
  setText('#xrpPrice',livePrice);setText('#xrpChange',liveChange);
  marketLastTickAt=Date.now();
  const bid=Number(ticker.best_bid),ask=Number(ticker.best_ask),vol=Number(ticker.volume_24_h),hi=Number(ticker.high_24_h),lo=Number(ticker.low_24_h);
  updateMarketDetail({
    exchange:'coinbase',exchangeName:'Coinbase',price:p,bestBid:bid,bestAsk:ask,
    volume24hXrp:vol,volume24hUsd:Number.isFinite(vol)?vol*p:null,
    high24h:hi,low24h:lo,range24hPct:Number.isFinite(hi)&&Number.isFinite(lo)&&lo>0?((hi-lo)/lo)*100:null,
    source:'Coinbase live WebSocket ticker',generatedAt:new Date().toISOString()
  });
  mergeLiveTickIntoChart(p);
  if(liveChartPoints.length>=2)renderMarketChart(liveChartPoints);
  renderSignal589();
}
function closeMarketStream(){
  clearTimeout(marketRetry);clearInterval(marketPollTimer);marketPollTimer=0;
  if(marketWs){
    marketWs.onclose=null;marketWs.onerror=null;
    try{marketWs.close()}catch{}
    marketWs=null;
  }
}
function scheduleMarketReconnect(){
  clearTimeout(marketRetry);
  if(state.selectedExchange!=='coinbase')return;
  marketRetry=setTimeout(connectMarketStream,2500);
}
function connectMarketStream(){
  closeMarketStream();
  if(state.selectedExchange!=='coinbase'){
    const interval=state.selectedExchange==='all'?6000:4000;
    marketPollTimer=setInterval(()=>loadMarket(false),interval);
    return;
  }
  try{marketWs=new WebSocket('wss://advanced-trade-ws.coinbase.com')}catch{return scheduleMarketReconnect()}
  marketWs.onopen=()=>{
    marketWs.send(JSON.stringify({type:'subscribe',product_ids:['XRP-USD'],channel:'ticker'}));
    marketWs.send(JSON.stringify({type:'subscribe',channel:'heartbeats'}));
    setText('#marketSource','Coinbase live WebSocket ticker');
  };
  marketWs.onmessage=e=>{
    let m;try{m=JSON.parse(e.data)}catch{return}
    if(m.channel!=='ticker'||!Array.isArray(m.events))return;
    for(const ev of m.events){
      for(const t of ev.tickers||[]){
        if(t.product_id==='XRP-USD')applyLiveMarketTick(t);
      }
    }
  };
  marketWs.onclose=scheduleMarketReconnect;
  marketWs.onerror=()=>{try{marketWs.close()}catch{}};
}
async function loadMarket(showOffline=true){
  const exchange=state.selectedExchange||'all';
  try{
    const r=await fetch('/api/market?exchange='+encodeURIComponent(exchange),{cache:'no-store'}),d=await r.json();
    if(!r.ok)throw new Error(d.detail||'Unavailable');
    const previousPrice=state.lastMarketPrice;
    state.xrpPrice=Number(d.price);state.xrpChange24h=Number(d.change24h);state.lastMarketPrice=state.xrpPrice;
    if(Number.isFinite(previousPrice)&&Number.isFinite(state.xrpPrice)&&previousPrice!==state.xrpPrice){
      state.lastPriceTickPct=(state.xrpPrice-previousPrice)/previousPrice*100;
    }
    renderSignal589();updateMarketDetail(d);
    const livePrice=Number.isFinite(state.xrpPrice)?'$'+state.xrpPrice.toFixed(5):'Unavailable';
    const liveChange=Number.isFinite(state.xrpChange24h)?(state.xrpChange24h>=0?'+':'')+state.xrpChange24h.toFixed(2)+'% · 24h':'24h unavailable';
    setText('#xrpPrice',livePrice);setText('#xrpChange',liveChange);
    marketLastTickAt=Date.now();
    if(state.marketMood&&Number.isFinite(state.xrpChange24h)&&Math.abs(state.xrpChange24h)>=5)mood(state.xrpChange24h>0?'Excited':'Watchful','XRP moved '+Math.abs(state.xrpChange24h).toFixed(2)+'% over 24 hours on '+(d.exchangeName||selectedExchangeMeta().name)+'. Movement is not a prediction.',state.xrpChange24h>0?'energized':'alert');
  }catch{
    if(showOffline){
      setText('#xrpPrice','Unavailable');setText('#xrpChange','Exchange feed offline');
      setText('#marketSource',selectedExchangeMeta().name+' feed unavailable');
    }
    renderSignal589();
  }
}
async function setExchange(id,{initial=false}={}){
  if(!EXCHANGE_LABELS[id])id='all';
  state.selectedExchange=id;
  persist();
  renderExchangeSelection();
  closeMarketStream();
  liveChartPoints=[];
  setText('#chartRange','LOADING '+selectedExchangeMeta().name.toUpperCase());
  await Promise.allSettled([loadMarket(true),loadMarketHistory()]);
  connectMarketStream();
  if(!initial){
    window.XRPet3D?.perform?.('scan');
    const details=q('#exchangeNavDetails');if(details)details.open=false;
  }
}
let exchangeBoardTimer=0;
function formatExchangePrice(v){const n=Number(v);return Number.isFinite(n)?'$'+n.toFixed(5):'—';}
function formatExchangeMove(v){const n=Number(v);return Number.isFinite(n)?(n>=0?'+':'')+n.toFixed(2)+'%':'';}
function renderExchangeBoard(data={}){
  const composite=data.composite||{},venues=Array.isArray(data.venues)?data.venues:[];
  [{...composite,id:'all'},...venues].forEach(row=>{
    qa('[data-exchange-price="'+row.id+'"]').forEach(el=>{
      el.textContent=formatExchangePrice(row.price);
      el.dataset.available=Number.isFinite(Number(row.price))?'true':'false';
      const move=formatExchangeMove(row.change24h);
      if(move)el.setAttribute('data-move',move);else el.removeAttribute('data-move');
    });
  });
  const cp=Number(composite.price),cc=Number(composite.change24h);
  setText('#globalXrpPrice',Number.isFinite(cp)?'$'+cp.toFixed(5):'—');
  setText('#globalXrpChange',Number.isFinite(cc)?(cc>=0?'+':'')+cc.toFixed(2)+'% · '+(Number(composite.venueCount)||venues.filter(v=>v.available).length)+' venues':'LIVE COMPOSITE');
}
async function loadExchangeBoard(){try{const r=await fetch('/api/exchange-board',{cache:'no-store'}),d=await r.json();if(!r.ok)throw new Error();renderExchangeBoard(d)}catch{setText('#globalXrpChange','COMPOSITE FEED OFFLINE')}}
function bindExchangeMenu(){
  qa('[data-exchange]').forEach(button=>button.addEventListener('click',()=>setExchange(button.dataset.exchange)));
  renderExchangeSelection();
  clearInterval(exchangeBoardTimer);
  loadExchangeBoard();
  exchangeBoardTimer=setInterval(loadExchangeBoard,5000);
}
function renderMarketChart(points=[]){
  const svg=q('#xrpMarketChart'),line=q('#marketLine'),area=q('#marketArea'),grid=q('#marketGrid');
  if(!svg||!line||!area||!grid||!points.length)return;
  const pts=points.filter(p=>Number.isFinite(Number(p.close))&&Number.isFinite(Number(p.time)));
  if(pts.length<2)return;
  const closes=pts.map(p=>Number(p.close));
  const highs=pts.map(p=>Number(p.high)).filter(Number.isFinite);
  const lows=pts.map(p=>Number(p.low)).filter(Number.isFinite);
  const min=Math.min(...lows,...closes),max=Math.max(...highs,...closes),span=Math.max(.000001,max-min);
  const W=1000,H=320,padX=18,padY=18,plotW=W-padX*2,plotH=H-padY*2;
  const coords=pts.map((p,i)=>[padX+(i/(pts.length-1))*plotW,padY+(1-(Number(p.close)-min)/span)*plotH]);
  const d=coords.map(([x,y],i)=>(i?'L':'M')+x.toFixed(2)+' '+y.toFixed(2)).join(' ');
  line.setAttribute('d',d);
  area.setAttribute('d',d+' L '+coords[coords.length-1][0].toFixed(2)+' '+(H-padY)+' L '+coords[0][0].toFixed(2)+' '+(H-padY)+' Z');
  grid.innerHTML='';
  [.25,.5,.75].forEach(n=>{const el=document.createElementNS('http://www.w3.org/2000/svg','line');el.setAttribute('x1',padX);el.setAttribute('x2',W-padX);el.setAttribute('y1',padY+n*plotH);el.setAttribute('y2',padY+n*plotH);grid.appendChild(el)});
  const first=closes[0],last=closes[closes.length-1],panel=q('.market-chart-panel');
  if(panel)panel.dataset.direction=last>=first?'up':'down';
  setText('#chartHigh','$'+Math.max(...highs,...closes).toFixed(4));
  setText('#chartLow','$'+Math.min(...lows,...closes).toFixed(4));
  const volume=pts.reduce((n,p)=>n+(Number.isFinite(Number(p.volume))?Number(p.volume):0),0);
  setText('#chartVolume',volume>=1e6?(volume/1e6).toFixed(1)+'M XRP':volume>=1e3?(volume/1e3).toFixed(1)+'K XRP':Math.round(volume)+' XRP');
  const fmt=t=>new Date(t).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
  setText('#chartStart',fmt(pts[0].time));setText('#chartEnd',fmt(pts[pts.length-1].time));setText('#chartRange','24H · 5 MIN CANDLES');
}
async function loadMarketHistory(){
  try{
    const exchange=state.selectedExchange||'all';
    const r=await fetch('/api/market-history?exchange='+encodeURIComponent(exchange),{cache:'no-store'}),d=await r.json();
    if(!r.ok||!Array.isArray(d.points))throw new Error();
    liveChartPoints=(d.points||[]).slice(-288).map(p=>({...p,time:Number(p.time)}));
    renderMarketChart(liveChartPoints);
    const meta=selectedExchangeMeta();
    setText('#chartRange',(exchange==='all'?'REFERENCE':'24H')+' · 5 MIN · '+meta.name.toUpperCase());
  }catch{setText('#chartRange','MARKET CHART OFFLINE')}
}
async function loadUpdates(){const box=q('#updates');if(box)box.innerHTML='<p class="muted">Checking official Ripple and XRPL sources…</p>';try{const r=await fetch('/api/updates',{cache:'no-store'});const d=await r.json();if(!r.ok||!Array.isArray(d.items)||!d.items.length)throw new Error();const items=d.items.slice(0,12);box.innerHTML=items.map((x,i)=>'<article class="announcement-card"><div class="announcement-index">'+String(i+1).padStart(2,'0')+'</div><div><span class="announcement-source">'+esc(x.source)+' · '+esc(x.label||'CONFIRMED')+'</span><a href="'+esc(x.url)+'" target="_blank" rel="noopener">'+esc(x.title)+'</a><small>Official source ↗</small></div></article>').join('');setText('#announcementStatus','Live');setText('#announcementUpdated','Updated '+new Date().toLocaleTimeString());const newest=items[0]?.title||'';setText('#friendSignal',newest?'New signal':'Standing by');if(newest&&state.lastAnnouncementTitle&&newest!==state.lastAnnouncementTitle&&!false){state.lastAnnouncementAt=Date.now();performLifeActivity('socialize')}state.lastAnnouncementTitle=newest;persist()}catch{if(box)box.innerHTML='<p class="muted">Official update feed is temporarily unavailable.</p>';setText('#announcementStatus','Unavailable');setText('#announcementUpdated','Retrying automatically')}}
const liveTransactions=[];
const seenLiveTx=new Set();
let liveTxRenderTimer=0,lifeWaterTimer=0,lifeReturnTimer=0,lastQuietReactionAt=0,spontaneousReactionTimer=0,lastWsTransactionAt=0,lastHttpTransactionAt=0;
function shortAccount(v){if(!v)return '—';const s=String(v);return s.length>18?s.slice(0,9)+'…'+s.slice(-6):s}
function formatLedgerAmount(amount){
  if(amount==null)return '—';
  if(typeof amount==='string'&&!Number.isNaN(Number(amount)))return (Number(amount)/1000000).toLocaleString(undefined,{maximumFractionDigits:6})+' XRP';
  if(typeof amount==='object'&&amount.value!=null)return String(amount.value)+' '+String(amount.currency||'issued');
  return String(amount);
}
function extractDeliveredAmount(m,tx){const meta=m.meta||m.metaData||{};return meta.delivered_amount??meta.DeliveredAmount??tx.DeliverMax??tx.Amount??null}
function normalizeLiveTransaction(m){
  if(m?.type!=='transaction'||m?.validated!==true)return null;
  const tx=m.transaction||m.tx_json||m.tx||{};
  if(!tx||typeof tx!=='object')return null;
  const hash=tx.hash||m.hash||m.transaction_hash||'';
  const ledger=m.ledger_index??tx.ledger_index??null;
  if(!hash||!Number.isFinite(Number(ledger)))return null;
  if(hash&&seenLiveTx.has(hash))return null;
  if(hash){seenLiveTx.add(hash);if(seenLiveTx.size>300){const first=seenLiveTx.values().next().value;seenLiveTx.delete(first)}}
  const meta=m.meta||m.metaData||{};
  const timestamp=Number.isFinite(Number(tx.date))?new Date((Number(tx.date)+946684800)*1000).toISOString():new Date().toISOString();
  const memos=Array.isArray(tx.Memos)?tx.Memos.map(x=>{const memo=x?.Memo||{};return {type:hexToUtf8(memo.MemoType||''),format:hexToUtf8(memo.MemoFormat||''),data:hexToUtf8(memo.MemoData||'')}}).filter(x=>x.type||x.format||x.data):[];
  return {hash,type:tx.TransactionType||'Transaction',account:tx.Account||'',destination:tx.Destination||'',destinationTag:tx.DestinationTag,amount:formatLedgerAmount(extractDeliveredAmount(m,tx)),fee:tx.Fee!=null?(Number(tx.Fee)/1000000).toFixed(6)+' XRP':'—',sequence:tx.Sequence??'—',ledger,status:meta.TransactionResult||m.engine_result||(m.validated===false?'Pending':'Validated'),validated:m.validated!==false,flags:tx.Flags??0,ticket:tx.TicketSequence??null,timestamp,memos,source:m.source||activeXrplEndpoint,explorer:'https://livenet.xrpl.org/transactions/'+encodeURIComponent(hash)};
}
function scheduleLiveTransactionRender(){if(liveTxRenderTimer)return;liveTxRenderTimer=setTimeout(()=>{liveTxRenderTimer=0;renderLiveTransactions()},250)}
function renderLiveTransactions(){
  const box=q('#liveTransactions');if(!box)return;
  if(!liveTransactions.length){box.innerHTML='<p class="muted">Waiting for validated XRPL transactions…</p>';return}
  box.innerHTML=liveTransactions.map((x,i)=>'<details class="live-tx-card clean-tx" '+(i===0?'open':'')+'>'+
    '<summary>'+
      '<span class="tx-primary"><b class="tx-type">'+esc(x.type)+'</b><strong>'+esc(x.amount)+'</strong></span>'+
      '<span class="tx-route"><small>FROM</small><b>'+esc(shortAccount(x.account))+'</b><i>→</i><small>TO</small><b>'+esc(shortAccount(x.destination))+'</b></span>'+
      '<span class="tx-meta"><b>Ledger #'+esc(x.ledger)+'</b><small>Seq '+esc(x.sequence)+' · '+esc(x.fee)+'</small></span>'+
      '<span class="tx-result '+(String(x.status).includes('tesSUCCESS')?'ok':'')+'">'+esc(x.status)+'</span>'+
    '</summary>'+
    '<div class="live-tx-details">'+
      '<p><span>Sender</span><code>'+esc(x.account||'—')+'</code></p>'+
      '<p><span>Destination</span><code>'+esc(x.destination||'—')+'</code></p>'+
      (x.destinationTag!=null?'<p><span>Destination Tag</span><code>'+esc(x.destinationTag)+'</code></p>':'')+
      '<p><span>Ledger / Sequence</span><code>'+esc(x.ledger)+' / '+esc(x.sequence)+'</code></p>'+
      '<p><span>Fee</span><code>'+esc(x.fee)+'</code></p>'+
      '<p><span>Timestamp</span><code>'+esc(new Date(x.timestamp).toLocaleString())+'</code></p>'+
      (x.ticket!=null?'<p><span>Ticket Sequence</span><code>'+esc(x.ticket)+'</code></p>':'')+
      '<p><span>Flags</span><code>'+esc(x.flags)+'</code></p>'+
      '<p class="tx-hash"><span>Transaction Hash</span><code>'+esc(x.hash||'—')+'</code><a class="tx-explorer-link" href="'+esc(x.explorer)+'" target="_blank" rel="noopener">Open on XRPL Explorer ↗</a></p>'+
      '<p><span>Validation</span><code>Validated on XRPL Mainnet</code></p>'+
      '<p><span>Live Source</span><code>'+esc(x.source||'XRPL mainnet WebSocket')+'</code></p>'+
      (x.memos?.length?'<p class="tx-memos"><span>Memos</span><code>'+esc(x.memos.map(m=>[m.type,m.format,m.data].filter(Boolean).join(' · ')).join(' | '))+'</code></p>':'')+
      '<p class="tx-safety-note"><span>Security</span><small>Public XRPL data only. Seeds and private keys are never part of this feed.</small></p>'+
    '</div></details>').join('');
  setText('#liveTxRate',liveTransactions.length+' RECENT');
}
let ws,retry,watchedSubscribed=null;
const XRPL_ENDPOINTS=['wss://s2.ripple.com/','wss://xrplcluster.com/'];
let xrplEndpointIndex=0,activeXrplEndpoint=XRPL_ENDPOINTS[0];
function xrplSourceLabel(url){return url.includes('s2.ripple.com')?'Ripple public XRPL node':'XRPLCluster public mainnet node'}
function subscribeAccount(a){
  if(!a||!ws||ws.readyState!==1)return;
  if(watchedSubscribed&&watchedSubscribed!==a)ws.send(JSON.stringify({id:'unwatch',command:'unsubscribe',accounts:[watchedSubscribed]}));
  ws.send(JSON.stringify({id:'watch',command:'subscribe',accounts:[a]}));watchedSubscribed=a;
}
function connectLedger(){
  clearTimeout(retry);
  activeXrplEndpoint=XRPL_ENDPOINTS[xrplEndpointIndex%XRPL_ENDPOINTS.length];
  setText('#txStreamSource','CONNECTING · '+xrplSourceLabel(activeXrplEndpoint));
  try{ws=new WebSocket(activeXrplEndpoint)}catch{return scheduleReconnect(true)}
  ws.onopen=()=>{
    state.connected=true;setSimpleLaunchProgress?.(96,'XRPL live connection established.');renderSignal589();setText('#status','Live');
    setText('#serverState',xrplSourceLabel(activeXrplEndpoint));setText('#txStreamSource','LIVE · '+xrplSourceLabel(activeXrplEndpoint));
    const b=q('#liveBadge');if(b){b.className='status-pill live';b.innerHTML='<i></i><span>XRPL Live</span>'}
    mood('Connected','Validated XRPL mainnet data is flowing.','calm');
    ws.send(JSON.stringify({id:'ledger',command:'subscribe',streams:['ledger','server','transactions']}));
    ws.send(JSON.stringify({id:'fee',command:'fee'}));if(state.account)subscribeAccount(state.account);
  };
  ws.onmessage=e=>{
    let m;try{m=JSON.parse(e.data)}catch{return}
    if(m.type==='ledgerClosed'){
      state.ledgerIndex=m.ledger_index;setText('#launchLedgerCounter',Number(m.ledger_index).toLocaleString());state.txCount=m.txn_count??0;state.baseFeeDrops=m.fee_base??state.baseFeeDrops;
      setText('#ledger',Number(m.ledger_index).toLocaleString());setText('#txCount',(m.txn_count??0)+' transactions');setText('#homeNetworkDetail','Ledger '+Number(m.ledger_index).toLocaleString()+' · '+(m.txn_count??0)+' transactions in latest close');
      if(m.fee_base!=null)setText('#fee',m.fee_base);renderSignal589();
    }else if(m.type==='serverStatus'){
      setText('#serverState',m.server_status||xrplSourceLabel(activeXrplEndpoint));
    }else if(m.id==='fee'&&m.result){
      const drops=m.result?.drops?.base_fee;if(drops!=null){state.baseFeeDrops=Number(drops);setText('#fee',drops)}
    }else if(m.id==='xrpet-nfts'&&Array.isArray(m.result?.account_nfts)){
      renderNfts(m.result.account_nfts);
    }else if(m.type==='transaction'){
      const normalized=normalizeLiveTransaction(m);
      if(normalized){
        lastWsTransactionAt=Date.now();
        window.dispatchEvent(new CustomEvent('xrpet:xrplTransaction',{detail:normalized}));
        liveTransactions.unshift(normalized);if(liveTransactions.length>40)liveTransactions.length=40;scheduleLiveTransactionRender();
        state.lastLedgerTxAt=Date.now();setText('#waterSignal','Ledger #'+normalized.ledger);setText('#sleepSignal','XRPL active');
        if(!lifeWaterTimer){performLifeActivity('drink');lifeWaterTimer=setTimeout(()=>lifeWaterTimer=0,3500)}
      }
      const tx=m.transaction||m.tx_json||m.tx||{};
      if(m.validated===true&&state.account&&(tx.Account===state.account||tx.Destination===state.account)){
        if(state.ledgerSound)playSound('ledgerTx');window.XRPet3D?.celebrate?.();mood('Wallet activity','Validated activity detected on the watched XRPL account.','energized');addXp(3)
      }
    }
  };
  ws.onclose=()=>{state.connected=false;renderSignal589();setText('#status','Reconnecting');setText('#txStreamSource','RECONNECTING');const b=q('#liveBadge');if(b){b.className='status-pill waiting';b.innerHTML='<i></i><span>Reconnecting</span>'}scheduleReconnect(true)};
  ws.onerror=()=>safe(()=>ws.close());
}
function scheduleReconnect(rotate=false){
  clearTimeout(retry);if(rotate)xrplEndpointIndex=(xrplEndpointIndex+1)%XRPL_ENDPOINTS.length;
  retry=setTimeout(connectLedger,2500);
}
async function loadRecentTransactionsFallback(force=false){
  const quietFor=Date.now()-Math.max(lastWsTransactionAt||0,lastHttpTransactionAt||0);
  if(!force&&state.connected&&quietFor<9000)return;
  try{
    const r=await fetch('/api/xrpl/recent-transactions',{cache:'no-store'});
    const d=await r.json();if(!r.ok)throw new Error(d.error||'XRPL fallback unavailable');
    let added=0;
    for(const item of d.transactions||[]){
      const normalized=normalizeLiveTransaction({
        type:'transaction',
        validated:true,
        transaction:item.transaction,
        meta:item.meta,
        hash:item.hash,
        ledger_index:item.ledger_index||d.ledgerIndex,
        source:'XRPL JSON-RPC fallback'
      });
      if(!normalized)continue;
      liveTransactions.push(normalized);added+=1;
      window.dispatchEvent(new CustomEvent('xrpet:xrplTransaction',{detail:normalized}));
    }
    if(added){
      liveTransactions.sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
      if(liveTransactions.length>40)liveTransactions.length=40;
      lastHttpTransactionAt=Date.now();
      scheduleLiveTransactionRender();
      setText('#txStreamSource',state.connected?'LIVE + RPC BACKUP':'RPC FALLBACK · VALIDATED');
      setText('#liveTxRate',liveTransactions.length+' RECENT');
    }
  }catch(e){
    if(!state.connected)setText('#txStreamSource','XRPL RETRYING');
  }
}

async function loadConfig(){try{const r=await fetch('/api/config',{cache:'no-store'});return await r.json()}catch{return{}}}
async function integrationCheck(){const box=q('#integrationStatus');if(!box)return;box.innerHTML='<div class="integration-item"><span>System</span><strong>Checking…</strong></div>';try{const [cfg,self]=await Promise.all([loadConfig(),fetch('/api/self-test',{cache:'no-store'}).then(r=>r.json())]);const rows=[['XRPL',state.connected?'LIVE':'CONNECTING'],['Xaman',cfg.xamanApiKey?'READY':'NOT CONFIGURED'],['Web Push',cfg.pushEnabled?'READY':'NOT CONFIGURED'],['Full SI',cfg.siProviderEnabled?'READY':'NOT CONFIGURED']];box.innerHTML=rows.map(([n,s])=>'<div class="integration-item"><span>'+n+'</span><strong class="'+(/LIVE|READY/.test(s)?'ok':'warn')+'">'+s+'</strong></div>').join('')}catch{box.innerHTML='<div class="integration-item"><span>System</span><strong class="warn">Check failed</strong></div>'}}
async function requestNfts(){
  const box=q('#nftCompanionList'),status=q('#nftStatus');
  if(!state.account){if(status)status.textContent='Connect or watch an XRPL account first.';return}
  if(!ws||ws.readyState!==1){if(status)status.textContent='XRPL connection is not ready yet.';return}
  if(status)status.textContent='Loading NFTs from XRPL…';
  if(box)box.innerHTML='';
  ws.send(JSON.stringify({id:'xrpet-nfts',command:'account_nfts',account:state.account,ledger_index:'validated'}));
}
async function renderNfts(nfts){
  const box=q('#nftCompanionList'),status=q('#nftStatus');
  if(!box)return;
  const items=nfts.slice(0,24);
  if(status)status.textContent=items.length?items.length+' NFT'+(items.length===1?'':'s')+' found.':'No NFTs found on this account.';
  box.innerHTML='';
  for(const nft of items){
    const uri=hexToUtf8(nft.URI||'');
    const meta=await resolveNftMedia(uri);
    const card=document.createElement('article');card.className='nft-card';
    const preview=meta.media?'<img src="'+esc(meta.media)+'" alt="'+esc(meta.name||'XRPL NFT')+'" loading="lazy">':'<div class="nft-placeholder">NFT</div>';
    card.innerHTML=preview+'<div><strong>'+esc(meta.name||('NFT #'+(nft.nft_serial??'')))+'</strong><small>'+esc(nft.Issuer||'XRPL')+'</small><span>'+esc(meta.model?'3D model detected':meta.media?'Image companion ready':'No preview media')+'</span></div><button type="button">Use as companion</button>';
    card.querySelector('button').disabled=!meta.media;
    card.querySelector('button').addEventListener('click',()=>{
      if(!meta.media)return;
      state.nftCompanion={id:nft.NFTokenID,name:meta.name||('NFT #'+(nft.nft_serial??'')),image:meta.media,model:meta.model||null};
      persist();applyNftCompanion();mood('NFT companion','XRPL NFT companion override equipped. Ripplet remains your official default.','energized');
    });
    box.appendChild(card);
  }
}
function applyNftCompanion(){
  const wrap=q('#nftFloatingCompanion'),img=q('#nftFloatingImage'),canvas=q('#companion3d');
  if(!wrap||!img||!canvas)return;
  const nft=state.nftCompanion;
  // Never cover the 3D companion until external NFT media has actually loaded.
  wrap.classList.add('hidden');wrap.setAttribute('aria-hidden','true');canvas.classList.remove('nft-hidden');
  setText('#floatingPetName',state.petName);
  if(!nft?.image){img.removeAttribute('src');return}
  const url=nft.image;
  img.onload=()=>{
    if(state.nftCompanion?.image!==url)return;
    wrap.classList.remove('hidden');wrap.setAttribute('aria-hidden','false');canvas.classList.add('nft-hidden');
    setText('#floatingPetName',nft.name||state.petName);
  };
  img.onerror=()=>{
    if(state.nftCompanion?.image!==url)return;
    state.nftCompanion=null;persist();
    wrap.classList.add('hidden');wrap.setAttribute('aria-hidden','true');canvas.classList.remove('nft-hidden');
    setText('#floatingPetName',state.petName);
    setText('#nftStatus','NFT artwork could not load; Ripplet has been restored.');
  };
  img.alt=nft.name||'XRPL NFT companion';
  img.src=url;
  if(img.complete&&img.naturalWidth>0)img.onload();
}
async function connectXaman(){const status=q('#walletConnection');if(status)status.textContent='Loading Xaman…';try{const cfg=await loadConfig();if(!cfg.xamanApiKey)throw new Error('Xaman API key is not configured.');if(!window.Xumm){await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://xumm.app/assets/cdn/xumm.min.js';s.onload=resolve;s.onerror=()=>reject(new Error('Xaman SDK could not load'));document.head.appendChild(s)})}const x=new window.Xumm(cfg.xamanApiKey);if(status)status.textContent='Approve the connection in Xaman…';await x.authorize();let account=await x.user?.account;if(typeof account==='function')account=await account();if(!account)throw new Error('Xaman did not return an account.');state.account=account;state.walletProvider='Xaman';persist();subscribeAccount(account);render();if(status)status.textContent='Xaman connected: '+account.slice(0,8)+'…'+account.slice(-6)}catch(e){if(status)status.textContent='Xaman connection failed: '+e.message}}
async function connectGem(){const status=q('#walletConnection');if(status)status.textContent='Checking GemWallet…';try{const api=await import('https://esm.sh/@gemwallet/api@3.7.0');const installed=await api.isInstalled();if(!installed?.result?.isInstalled)throw new Error('GemWallet extension is not installed.');const a=await api.getAddress();const account=a?.result?.address;if(!account)throw new Error('GemWallet did not share an address.');state.account=account;state.walletProvider='GemWallet';persist();subscribeAccount(account);render();if(status)status.textContent='GemWallet connected: '+account.slice(0,8)+'…'+account.slice(-6)}catch(e){if(status)status.textContent='GemWallet connection failed: '+e.message}}
function bind(sel,event,fn){const el=q(sel);if(el)el.addEventListener(event,fn)}
bind('#chatForm','submit',e=>{e.preventDefault();const i=q('#message');const m=i?.value.trim();if(!m)return;i.value='';ask(m)});
qa('.quick button').forEach(b=>b.addEventListener('click',()=>{const m=b.dataset.q;if(m.endsWith(': ')){const i=q('#message');i.value=m;i.focus()}else ask(m)}));
bind('#catchup','click',()=>{ask('Catch me up');loadMarket();loadUpdates()});bind('#dailyButton','click',()=>ask('Give me a concise daily XRP and XRPL briefing.'));
bind('#refreshNews','click',()=>{loadUpdates();loadMarket()});bind('#profileForm','submit',e=>{e.preventDefault();state.petName='Ripplet';state.personality='Guardian';state.focus=q('#profileFocus')?.value.trim()||state.focus;persist();render();playSound('success');mood('Personalized',state.petName+' is now running '+state.personality+' mode.','calm')});
bind('#memoryForm','submit',e=>{e.preventDefault();const i=q('#memoryInput');const v=i.value.trim();if(!v)return;state.memories.push(v);state.memories=state.memories.slice(-8);i.value='';persist();renderMemory();playSound('success')});
bind('#watchForm','submit',e=>{e.preventDefault();const a=q('#account').value.trim();if(!/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(a)){setText('#walletState','That does not look like a valid XRPL classic address.');playSound('error');return}state.account=a;state.walletProvider='manual';persist();subscribeAccount(a);render();playSound('wallet');mood('Watching wallet','Public account watch is active.','calm')});
bind('#clearWallet','click',()=>{if(watchedSubscribed&&ws?.readyState===1)ws.send(JSON.stringify({id:'unwatch',command:'unsubscribe',accounts:[watchedSubscribed]}));watchedSubscribed=null;state.account=null;state.walletProvider='manual';persist();render();playSound('wallet');setText('#walletConnection','No wallet connected. Public wallet watch still works.')});
bind('#connectXaman','click',connectXaman);bind('#connectGem','click',connectGem);
let charge=0;bind('#charge','click',()=>{const t=new Date().toISOString().slice(0,10);if(state.lastMissionDate===t){playSound('notification');mood('Complete','Today’s core mission is already complete.','calm');return}charge=Math.min(7,charge+1);setText('#chargeCount',charge+'/7');if(q('#meterFill'))q('#meterFill').style.width=(charge/7*100)+'%';playSound(charge===7?'success':'mission');if(charge===7){state.lastMissionDate=t;addXp(15);setText('#missionText','Mission complete. +15 XP. New pulse tomorrow.');mood('Charged','Core synchronized. Mission complete.','energized')}});
qa('.companion-choice').forEach(b=>b.addEventListener('click',()=>{state.companionKind=b.dataset.companion;state.nftCompanion=null;persist();applyNftCompanion();render();mood('Companion changed',(COMPANION_NAMES[state.companionKind]||state.companionKind)+' is now your active companion.','energized')}));
qa('.gender-choice').forEach(b=>b.addEventListener('click',()=>{state.companionGender=b.dataset.gender;state.nftCompanion=null;persist();applyNftCompanion();render();mood('Companion updated',(state.companionGender==='girl'?'Girl':'Boy')+' companion presentation selected.','calm')}));
qa('[data-pet-action]').forEach(b=>b.addEventListener('click',()=>{
  const action=b.dataset.petAction;
  state.nftCompanion=null;applyNftCompanion();
  window.XRPet3D?.perform?.(action);
  if(action==='celebrate'){playSound('success');setText('#petMood','Celebrating');setText('#petSpeech','Celebration protocol active. XRP signal lattice energized.')}
  else if(action==='alert'){playSound('alert');setText('#petMood','Alert');setText('#petSpeech','Sensors focused. Watching validated ledger activity closely.')}
  else if(action==='sleep'){playSound('sleep');setText('#petMood','Resting');setText('#petSpeech','Low-power rest mode. Ledger watch remains active.')}
  else if(action==='focus'){playSound('select');setText('#petMood','Focused');setText('#petSpeech','Distractions reduced. Companion focus lock engaged.')}
  else if(action==='scan'){playSound('ledgerTx');setText('#petMood','Scanning');setText('#petSpeech','Scanning current XRPL telemetry and watched-account signals.');loadMarket()}
  else if(action==='orbit'){playSound('cosmetic');setText('#petMood','Orbiting');setText('#petSpeech','Signal hardware released into orbital display mode.')}
  else if(['walk','run','jump','climb','reach','grab','carry','crouch','turn'].includes(action)){
    playSound(action==='jump'||action==='run'?'success':'select');
    const labels={walk:'Walking',run:'Running',jump:'Jumping',climb:'Climbing',reach:'Reaching',grab:'Gripping',carry:'Carrying',crouch:'Crouching',turn:'Turning'};
    setText('#petMood',labels[action]||'Moving');
    setText('#petSpeech','Physical motor cortex: '+(labels[action]||action)+' with full-body balance and limb coordination.');
  }
  else{playSound('pet');setText('#petMood','Linked');setText('#petSpeech','Companion link acknowledged.')}
}));
let pendingRoom=state.room;
qa('.room-choice').forEach(b=>b.addEventListener('click',()=>{
  if(b.disabled)return;
  pendingRoom=b.dataset.room;
  qa('.room-choice').forEach(x=>x.classList.toggle('pending',x.dataset.room===pendingRoom));
  setText('#roomPendingLabel','Ready to apply: '+(ROOM_NAMES[pendingRoom]||pendingRoom));
  playSound('select');
}));
bind('#applyRoom','click',()=>{
  state.room=pendingRoom||state.room;
  persist();render();playSound('room');setRoomAmbience(state.room);
  mood('Theme changed','The entire XRPet interface is now running '+(ROOM_NAMES[state.room]||state.room)+'.','calm');
  closeCustomizationPanels();
}); qa('.cosmetic-choice').forEach(b=>b.addEventListener('click',()=>{state.cosmetic=b.dataset.cosmetic;state.nftCompanion=null;persist();applyNftCompanion();render();mood('Reconfigured','Companion build changed to '+b.querySelector('strong')?.textContent+'.','energized')}));
const sidebar=q('#xrpetSidebar');
const sidebarToggle=q('#sidebarToggle');
function setSidebarCollapsed(collapsed){
  const isCollapsed=Boolean(collapsed);
  document.body.classList.toggle('sidebar-collapsed',isCollapsed);
  sidebarToggle?.setAttribute('aria-expanded',isCollapsed?'false':'true');
  sidebarToggle?.setAttribute('aria-label',isCollapsed?'Expand sidebar':'Minimize sidebar');
  sidebarToggle?.setAttribute('title',isCollapsed?'Expand sidebar':'Minimize sidebar');
  const arrow=sidebarToggle?.querySelector('span');if(arrow)arrow.textContent=isCollapsed?'›':'‹';
  try{localStorage.setItem('xrpet-sidebar-collapsed',isCollapsed?'1':'0')}catch{}
  // Do not touch companion/layout globals here; this runs before those systems initialize.
  setTimeout(()=>window.dispatchEvent(new Event('resize')),240);
}
let savedSidebarCollapsed=false;
try{savedSidebarCollapsed=localStorage.getItem('xrpet-sidebar-collapsed')==='1'}catch{}
if(savedSidebarCollapsed)document.body.classList.add('sidebar-collapsed');
else document.body.classList.remove('sidebar-collapsed');
sidebarToggle?.setAttribute('aria-expanded',savedSidebarCollapsed?'false':'true');
sidebarToggle?.setAttribute('aria-label',savedSidebarCollapsed?'Expand sidebar':'Minimize sidebar');
sidebarToggle?.setAttribute('title',savedSidebarCollapsed?'Expand sidebar':'Minimize sidebar');
const sidebarArrow=sidebarToggle?.querySelector('span');if(sidebarArrow)sidebarArrow.textContent=savedSidebarCollapsed?'›':'‹';
sidebarToggle?.addEventListener('click',()=>setSidebarCollapsed(!document.body.classList.contains('sidebar-collapsed')));

function scrollSectionTop(id){
  const target=q('#'+id);if(!target)return;
  const shell=q('.main-shell');
  const deck=q('#topCommandDeck');
  const headerGap=(deck?.offsetHeight||0)+14;
  if(shell){
    const y=Math.max(0,target.offsetTop-headerGap);
    shell.scrollTo({top:y,behavior:'auto'});
    return;
  }
  const y=Math.max(0,target.getBoundingClientRect().top+window.scrollY-headerGap);
  window.scrollTo({top:y,behavior:'auto'});
}
qa('[data-scroll]').forEach(b=>b.addEventListener('click',()=>{
  qa('[data-customization-panel]').forEach(p=>p.classList.remove('is-open'));
  document.body.classList.remove('customization-open','workspace-open');
  scrollSectionTop(b.dataset.scroll);
}));
bind('#explainLevel','change',e=>{state.explainLevel=e.target.value;persist()});bind('#notifyLevel','change',e=>{state.notifyLevel=e.target.value;persist()});bind('#truthToggle','change',e=>{state.truthMode=e.target.checked;persist();renderSignal589()});bind('#marketMoodToggle','change',e=>{state.marketMood=e.target.checked;persist()});
bind('#graphicsQuality','change',e=>{
  state.graphicsQuality=e.target.value;persist();playSound('select');
  setText('#petSpeech','Graphics mode saved. Reload XRPet to apply the new 3D quality profile.');
});
bind('#notifyButton','click',async()=>{if(!('Notification'in window)){playSound('error');alert('Browser notifications are not supported here.');return}const p=await Notification.requestPermission();if(p==='granted')new Notification('XRPet alerts enabled',{body:'Browser alerts are ready while XRPet is open.'});});
bind('#refreshIntegrations','click',integrationCheck);bind('#loadNfts','click',requestNfts);
bind('#useNativeCompanion','click',()=>{
  state.nftCompanion=null;persist();applyNftCompanion();render();playSound('companion');
  state.companionKind='ripplet';state.companionGender='neutral';mood('Ripplet restored','Ripplet is active again as your official XRPet companion.','calm');
});

bind('#globalSearchForm','submit',e=>{
  e.preventDefault();
  const term=(q('#globalSearch')?.value||'').trim().toLowerCase();
  if(!term)return;
  const map=[
    [['589','signal','community','lore','theory','theories'], '#signal589Section'],
    [['room','rooms','environment'], '#roomsSection'],
    [['cosmetic','skin','appearance','equipment','eye','core','trail','halo'], '#companionSection'],
    [['wallet','xaman','gemwallet'], '#walletPanel'],
    [['chat','ask','si','assistant'], '#chatPanel'],
    [['history','timeline','ripple','sec','lawsuit','escrow','odl','rlusd','acquisition'], '#xrpHistorySection'],
    [['ledger','xrpl','xrp','network','price'], '#xrplPanel'],
    [['companion','pet','profile','memory','evolution'], '#companionSection']
  ];
  const match=map.find(([keys])=>keys.some(k=>term.includes(k)));
  const target=q(match?.[1]||'#homeSection');
  target?.scrollIntoView({behavior:'smooth',block:'start'});
});
qa('.side-link').forEach(b=>b.addEventListener('click',()=>{
  qa('.side-link').forEach(x=>x.classList.remove('active'));b.classList.add('active');
}));

qa('.variant-dot').forEach(b=>b.addEventListener('click',()=>{state.cosmetic=b.dataset.cosmetic;persist();render();mood('Customized','Companion variant updated.','energized')}));
window.addEventListener('xrpet:petInteract',()=>{playSound('pet');revealFloatControls();mood('Responsive','Core pulse received. Drag me to rotate, click to react.','energized');setTimeout(()=>mood('Connected','Live XRPL data is flowing.','calm'),900)});
window.addEventListener('xrpet:3d-ready',()=>render());
window.addEventListener('xrpet:quality',e=>{
  const d=e.detail||{};
  const label=(d.mode||'auto').toUpperCase()+(d.postFx?' · SSAO/BLOOM':'')+(d.fps?' · '+d.fps+' FPS':'');
  setText('#studioQualityBadge',label);
});

window.addEventListener('xrpet:model-loading',e=>{const d=e.detail||{};setText('#modelRuntimeMode','Loading rigged model · '+(COMPANION_NAMES[d.kind]||d.kind||'Companion'));setText('#studioRenderBadge','LOADING GLB');playSound('model')});
window.addEventListener('xrpet:model-ready',e=>{
  const d=e.detail||{};setText('#modelRuntimeMode',(d.mode==='rigged'?'Rigged GLB':d.mode==='real'?'Real GLB':'Procedural')+' · '+(COMPANION_NAMES[d.kind]||d.kind||'Companion'));setText('#studioRenderBadge',d.mode==='rigged'?'RIGGED GLB':d.mode==='real'?'REAL GLB':'PROCEDURAL');playSound('success')
});
window.addEventListener('xrpet:model-fallback',e=>{
  const d=e.detail||{};setText('#modelRuntimeMode','Safe fallback · '+(COMPANION_NAMES[d.kind]||d.kind||'Companion'));setText('#studioRenderBadge','SAFE MODE');playSound('error')
});



let audioContext=null,lastSoundAt=0,lastHoverSoundAt=0;
let ambientBus=null,ambientNodes=[],ambientRoom=null;
const SOUND_PROFILES={
  tap:{tones:[[620,780,0,.055,'sine']],gain:.11},
  hover:{tones:[[880,940,0,.035,'sine']],gain:.045},
  nav:{tones:[[360,520,0,.07,'triangle'],[720,860,.045,.075,'sine']],gain:.085},
  toggle:{tones:[[420,610,0,.065,'square'],[690,780,.04,.07,'sine']],gain:.07},
  select:{tones:[[540,680,0,.06,'triangle'],[810,920,.045,.09,'sine']],gain:.075},
  room:{tones:[[170,300,0,.22,'sine'],[255,510,.09,.3,'triangle'],[680,820,.18,.18,'sine']],gain:.11,noise:.035},
  cosmetic:{tones:[[430,600,0,.08,'triangle'],[690,920,.065,.16,'sine']],gain:.1},
  companion:{tones:[[320,480,0,.1,'triangle'],[520,780,.07,.18,'sine'],[900,1120,.14,.16,'sine']],gain:.105},
  gender:{tones:[[510,640,0,.08,'sine'],[760,880,.06,.12,'triangle']],gain:.08},
  pet:{tones:[[440,660,0,.16,'sine'],[660,990,.1,.22,'sine']],gain:.11},
  greet:{tones:[[410,550,0,.09,'sine'],[620,820,.07,.15,'sine']],gain:.095},
  celebrate:{tones:[[420,620,0,.1,'triangle'],[620,900,.08,.15,'sine'],[880,1320,.17,.2,'sine']],gain:.13,noise:.025},
  alert:{tones:[[520,420,0,.1,'square'],[420,520,.12,.1,'square'],[630,520,.24,.12,'triangle']],gain:.085},
  sleep:{tones:[[330,280,0,.22,'sine'],[220,180,.14,.3,'sine']],gain:.07},
  chatSend:{tones:[[520,690,0,.07,'sine'],[700,900,.045,.1,'triangle']],gain:.075},
  chatReceive:{tones:[[760,620,0,.08,'sine'],[950,760,.055,.13,'sine']],gain:.07},
  wallet:{tones:[[250,500,0,.13,'triangle'],[500,760,.1,.17,'sine']],gain:.1},
  ledger:{tones:[[1180,1380,0,.038,'sine'],[620,690,.025,.055,'sine']],gain:.035},
  ledgerTx:{tones:[[390,620,0,.09,'triangle'],[650,1040,.07,.16,'sine'],[1040,1320,.17,.18,'sine']],gain:.12},
  mission:{tones:[[280,430,0,.08,'triangle'],[430,650,.07,.1,'triangle']],gain:.075},
  success:{tones:[[490,650,0,.12,'sine'],[730,980,.11,.19,'sine'],[980,1240,.2,.16,'sine']],gain:.115},
  error:{tones:[[420,260,0,.12,'sawtooth'],[310,190,.09,.17,'triangle']],gain:.08},
  notification:{tones:[[740,900,0,.08,'sine'],[940,1120,.12,.12,'sine']],gain:.075},
  model:{tones:[[190,380,0,.17,'sine'],[380,760,.13,.2,'triangle']],gain:.08},
  launch:{tones:[[180,360,0,.18,'sine'],[540,820,.1,.22,'triangle']],gain:.1,noise:.025},
  launchStage:{tones:[[260,520,0,.1,'sine'],[760,1040,.07,.14,'sine']],gain:.075},
  open:{tones:[[310,620,0,.16,'triangle'],[620,930,.1,.22,'sine'],[930,1240,.22,.22,'sine']],gain:.115,noise:.02},
  sip:{tones:[[980,1180,0,.06,'sine'],[760,910,.08,.08,'sine']],gain:.085},
  gulp:{tones:[[720,520,0,.08,'triangle'],[520,760,.1,.1,'sine'],[920,1120,.2,.09,'sine']],gain:.095},
  splash:{tones:[[820,1200,0,.08,'sine'],[520,860,.07,.14,'triangle']],gain:.105,noise:.04},
  bite:{tones:[[420,620,0,.055,'square'],[760,980,.08,.09,'sine']],gain:.08},
  taste:{tones:[[650,810,0,.07,'sine'],[900,760,.08,.11,'triangle']],gain:.075},
  charge:{tones:[[260,520,0,.12,'sine'],[620,980,.1,.18,'triangle'],[980,1320,.2,.14,'sine']],gain:.11},
  curl:{tones:[[300,240,0,.18,'sine'],[210,170,.12,.24,'sine']],gain:.06},
  dream:{tones:[[540,660,0,.18,'sine'],[710,590,.2,.22,'sine']],gain:.055},
  snore:{tones:[[180,150,0,.28,'sine'],[140,115,.24,.32,'sine']],gain:.055},
  wave:{tones:[[520,690,0,.07,'sine'],[760,920,.08,.1,'sine']],gain:.08},
  highfive:{tones:[[480,820,0,.08,'triangle'],[900,1260,.09,.13,'sine']],gain:.11,noise:.02},
  dance:{tones:[[360,520,0,.08,'triangle'],[620,820,.08,.09,'triangle'],[900,1180,.16,.12,'sine']],gain:.1}
};

function ensureAudio(){
  try{
    const Context=window.AudioContext||window.webkitAudioContext;
    if(!Context)return null;
    if(!audioContext)audioContext=new Context();
    if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
    return audioContext;
  }catch{return null}
}
function masterVolume(mult=1){return Math.max(.0001,Math.min(.75,(state.soundVolume||0)/100*.42*mult))}
function noiseBurst(ctx,at,duration=.08,amount=.03){
  const len=Math.max(1,Math.floor(ctx.sampleRate*duration));
  const buffer=ctx.createBuffer(1,len,ctx.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<len;i++)data[i]=(Math.random()*2-1)*(1-i/len);
  const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
  src.buffer=buffer;filter.type='bandpass';filter.frequency.value=1200;filter.Q.value=.8;
  gain.gain.setValueAtTime(Math.max(.0001,masterVolume(amount)),at);
  gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
  src.connect(filter);filter.connect(gain);gain.connect(ctx.destination);src.start(at);src.stop(at+duration);
}
function playSound(kind='tap',force=false){
  if(!force&&(!state.soundEnabled||!state.interfaceSound))return;
  const now=performance.now(),profile=SOUND_PROFILES[kind]||SOUND_PROFILES.tap;
  const minGap=kind==='ledger'?900:kind==='hover'?130:55;
  if(!force&&now-lastSoundAt<minGap)return;
  lastSoundAt=now;
  const ctx=ensureAudio();if(!ctx)return;
  const t=ctx.currentTime+.008,vol=masterVolume(profile.gain??.08);
  for(const [low,high,delay,duration,wave] of profile.tones||[]){
    const osc=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();
    osc.type=wave;osc.frequency.setValueAtTime(Math.max(30,low),t+delay);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30,high),t+delay+duration);
    filter.type='lowpass';filter.frequency.value=Math.min(6500,Math.max(low,high)*4);
    gain.gain.setValueAtTime(.0001,t+delay);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002,vol),t+delay+.012);
    gain.gain.exponentialRampToValueAtTime(.0001,t+delay+duration);
    osc.connect(filter);filter.connect(gain);gain.connect(ctx.destination);
    osc.start(t+delay);osc.stop(t+delay+duration+.02);
  }
  if(profile.noise)noiseBurst(ctx,t,.09,profile.noise);
}

const AMBIENT_PROFILES={
  nexus:{freq:[55,82.4,164.8],gain:.016,filter:520},
  ocean:{freq:[43.65,65.4,130.8],gain:.018,filter:430},
  vault:{freq:[41.2,61.7,123.5],gain:.014,filter:360},
  aurora:{freq:[69.3,103.8,207.6],gain:.015,filter:650},
  legend:{freq:[46.25,92.5,185],gain:.016,filter:470},
  genesis:{freq:[58.27,116.54,233.08],gain:.014,filter:610},
  city:{freq:[49,98,196],gain:.016,filter:540},
  quantum:{freq:[73.42,146.83,293.66],gain:.013,filter:720},
  desert:{freq:[55,110,220],gain:.015,filter:480},
  arctic:{freq:[65.41,130.81,261.63],gain:.014,filter:690}
};
function stopAmbient(){
  for(const n of ambientNodes){try{n.stop?.()}catch{}try{n.disconnect?.()}catch{}}
  ambientNodes=[];ambientBus=null;ambientRoom=null;
}
function setRoomAmbience(room=state.room){
  if(!state.soundEnabled||!state.ambientSound){stopAmbient();return}
  const ctx=ensureAudio();if(!ctx)return;
  const p=AMBIENT_PROFILES[room]||AMBIENT_PROFILES.nexus;
  if(ambientBus&&ambientRoom===room){
    ambientBus.gain.setTargetAtTime(masterVolume(p.gain),ctx.currentTime,.35);return;
  }
  stopAmbient();ambientRoom=room;
  ambientBus=ctx.createGain();ambientBus.gain.setValueAtTime(.0001,ctx.currentTime);
  const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=p.filter;filter.Q.value=.4;
  ambientBus.connect(filter);filter.connect(ctx.destination);
  p.freq.forEach((freq,i)=>{
    const osc=ctx.createOscillator(),g=ctx.createGain();
    osc.type=i===0?'sine':i===1?'triangle':'sine';
    osc.frequency.value=freq;osc.detune.value=i===1?4:i===2?-5:0;
    g.gain.value=i===0 ? .62 : i===1 ? .25 : .13;
    osc.connect(g);g.connect(ambientBus);osc.start();ambientNodes.push(osc,g);
  });
  ambientBus.gain.exponentialRampToValueAtTime(masterVolume(p.gain),ctx.currentTime+.9);
}
function refreshAmbient(){setRoomAmbience(state.room)}
function unlockXRPetAudio(){
  const ctx=ensureAudio();if(!ctx)return;
  if(state.soundEnabled&&state.ambientSound&&!document.body.classList.contains('launch-locked'))setRoomAmbience(state.room);
}
document.addEventListener('pointerdown',unlockXRPetAudio,{once:true,capture:true});
document.addEventListener('keydown',unlockXRPetAudio,{once:true,capture:true});

bind('#soundToggle','change',e=>{
  state.soundEnabled=e.target.checked;persist();
  if(state.soundEnabled){playSound('success',true);setTimeout(refreshAmbient,80)}else stopAmbient();
});
bind('#soundVolume','input',e=>{
  state.soundVolume=Number(e.target.value)||0;persist();
  if(ambientBus&&audioContext){const p=AMBIENT_PROFILES[state.room]||AMBIENT_PROFILES.nexus;ambientBus.gain.setTargetAtTime(masterVolume(p.gain),audioContext.currentTime,.08)}
});
bind('#interfaceSoundToggle','change',e=>{state.interfaceSound=e.target.checked;persist();if(state.interfaceSound)playSound('toggle',true)});
bind('#ambientSoundToggle','change',e=>{state.ambientSound=e.target.checked;persist();e.target.checked?setRoomAmbience(state.room):stopAmbient();if(state.soundEnabled)playSound('room',true)});
bind('#ledgerSoundToggle','change',e=>{state.ledgerSound=e.target.checked;persist();if(state.soundEnabled)playSound('ledgerTx',true)});
bind('#testSound','click',()=>{playSound('open',true);setTimeout(()=>playSound('ledgerTx',true),230)});

function classifyButtonSound(b){
  if(b.dataset.room)return 'room';
  if(b.dataset.cosmetic)return 'cosmetic';
  if(b.dataset.companion)return 'companion';
  if(b.dataset.gender)return 'gender';
  if(b.dataset.petAction)return b.dataset.petAction==='celebrate'?'celebrate':b.dataset.petAction==='alert'?'alert':b.dataset.petAction==='sleep'?'sleep':b.dataset.petAction==='scan'?'ledgerTx':b.dataset.petAction==='focus'?'select':b.dataset.petAction==='orbit'?'cosmetic':'greet';
  if(/connect|wallet|watch|clearWallet/i.test(b.id))return 'wallet';
  if(/catchup|daily|refresh|search/i.test(b.id))return 'nav';
  if(/charge/i.test(b.id))return 'mission';
  if(/notify/i.test(b.id))return 'notification';
  return 'tap';
}
document.addEventListener('click',e=>{
  const b=e.target.closest('button');
  if(b&&b.id!=='testSound'){playSound(classifyButtonSound(b));return}
  const nav=e.target.closest('a,.nav-link,summary');
  if(nav)playSound('nav');
});
document.addEventListener('mouseover',e=>{
  if(!state.soundEnabled||!state.interfaceSound)return;
  const el=e.target.closest('button,a,.nav-link,summary');
  if(!el||el.contains(e.relatedTarget))return;
  const now=performance.now();if(now-lastHoverSoundAt<150)return;lastHoverSoundAt=now;playSound('hover');
});
document.addEventListener('change',e=>{
  const el=e.target;
  if(el.matches('select'))playSound('select');
  else if(el.matches('input[type="checkbox"],input[type="radio"]'))playSound('toggle');
});
document.addEventListener('submit',e=>{if(e.target.matches('form'))playSound(e.target.id==='chatForm'?'chatSend':'success')});

const launchGate=q('#launchGate'),launchEnter=q('#launchEnter'),launchBar=q('#launchProgressBar');
let launchOpened=false,launchProgress=0,launchTimer=0,launchIdleTimer=0,launchPulse=1;

const launchIdleMessages=[
  ['Ripplet is online and waiting.','Watching XRPL mainnet'],
  ['Validated ledgers keep moving.','Following network consensus'],
  ['Live signals are still flowing.','Listening for transactions'],
  ['XRPet is ready when you are.','Companion systems active'],
  ['No rush — the Ledger never sleeps.','Monitoring XRPL mainnet']
];

function setSimpleLaunchProgress(value,text){
  launchProgress=Math.max(0,Math.min(100,Number(value)||0));
  if(launchBar)launchBar.style.width=launchProgress+'%';
  if(text)setText('#launchStatus',text);
}
function updateLaunchActivity(label){
  if(label)setText('#launchActivityLabel',label);
  setText('#launchActivityPulse','signal '+String(launchPulse++).padStart(3,'0'));
}
function finishLaunch(){
  if(launchOpened)return;
  launchOpened=true;
  clearInterval(launchTimer);
  clearInterval(launchIdleTimer);
  setSimpleLaunchProgress(100,'XRPet ready.');
  updateLaunchActivity('Opening companion interface');
  launchGate?.classList.add('launch-complete');
  document.body.classList.remove('launch-locked');
  setTimeout(()=>{
    launchGate?.remove();
    window.XRPet3D?.react?.();
    window.dispatchEvent(new CustomEvent('xrpet:launch-complete'));
    setTimeout(()=>setRoomAmbience(state.room),120);
  },420);
}
if(launchGate){
  setSimpleLaunchProgress(18,'Connecting to XRPL live data…');
  updateLaunchActivity('Listening for validated ledgers');

  launchTimer=setInterval(()=>{
    if(launchOpened)return;
    if(launchProgress<88){
      const next=Math.min(88,launchProgress+Math.max(3,Math.round((90-launchProgress)*.12)));
      const text=next<42?'Connecting to XRPL live data…':next<70?'Synchronizing live signals…':'Waking Ripplet…';
      const activity=next<42?'Opening XRPL mainnet stream':next<70?'Matching ledger + market signals':'Companion systems coming online';
      setSimpleLaunchProgress(next,text);
      updateLaunchActivity(activity);
    }
  },180);

  let idleIndex=0;
  setTimeout(()=>{
    if(launchOpened)return;
    setSimpleLaunchProgress(Math.max(launchProgress,92),'Waiting for your command.');
    updateLaunchActivity('Companion systems active');
    launchIdleTimer=setInterval(()=>{
      if(launchOpened)return;
      const item=launchIdleMessages[idleIndex++%launchIdleMessages.length];
      setSimpleLaunchProgress(Math.max(launchProgress,92),item[0]);
      updateLaunchActivity(item[1]);
      launchGate.classList.remove('launch-pulse');
      requestAnimationFrame(()=>launchGate.classList.add('launch-pulse'));
    },2600);
  },1800);

  launchEnter?.addEventListener('click',finishLaunch);
  launchGate?.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();finishLaunch()}});
  launchGate?.addEventListener('pointermove',e=>{
    const r=launchGate.getBoundingClientRect();
    const x=((e.clientX-r.left)/Math.max(1,r.width)-.5)*2;
    const y=((e.clientY-r.top)/Math.max(1,r.height)-.5)*2;
    launchGate.style.setProperty('--launch-mx',x.toFixed(3));
    launchGate.style.setProperty('--launch-my',y.toFixed(3));
  });
  launchGate?.addEventListener('pointerleave',()=>{
    launchGate.style.setProperty('--launch-mx','0');
    launchGate.style.setProperty('--launch-my','0');
  });
  q('#launchLiveOrbit')?.addEventListener('click',()=>{
    launchGate.classList.remove('launch-pulse');
    requestAnimationFrame(()=>launchGate.classList.add('launch-pulse'));
    updateLaunchActivity('XRPL signal ping acknowledged');
    setText('#launchStatus','Mainnet signal received. Ripplet is listening.');
    playSound('notification',true);
  });
}else{
  document.body.classList.remove('launch-locked');
}

const floatEl=q('#floatingCompanion'),roamLayer=q('#rippletRoamLayer'),lifeAvatar=q('#lifeAvatar');
let roamPinned=false,roamDocked=false,roamX=.72,roamY=.72,roamTimer=0;
let rippletPointer={x:0,y:0,active:false,movedAt:0};
let rippletPointerTimer=0;
let rippletLastPointerTarget=null;

function syncRoamBounds(){
  const shell=q('.main-shell');if(!shell||!roamLayer)return;
  roamLayer.style.left='0px';
  roamLayer.style.top='0px';
  roamLayer.style.width=Math.max(shell.clientWidth,shell.scrollWidth)+'px';
  roamLayer.style.height=Math.max(shell.clientHeight,shell.scrollHeight)+'px';
}
function setRoamPosition(x,y,activity='explore'){
  if(!lifeAvatar||!roamLayer)return;
  const layer=roamLayer.getBoundingClientRect(),avatar=lifeAvatar.getBoundingClientRect();
  const maxX=Math.max(0,layer.width-avatar.width-10),maxY=Math.max(0,layer.height-avatar.height-10);
  const px=Math.max(8,Math.min(maxX,x)),py=Math.max(12,Math.min(maxY,y));
  lifeAvatar.style.transitionDuration=activity==='run'?'.72s':activity==='jump'?'.58s':activity==='climb'?'1s':'1.18s';
  lifeAvatar.style.transform='translate3d('+px+'px,'+py+'px,0)';
  lifeAvatar.dataset.activity=activity;
  roamX=maxX?px/maxX:.5;roamY=maxY?py/maxY:.5;
}
function stationPosition(activity){
  const station=q('[data-life-action="'+activity+'"]'),layer=roamLayer?.getBoundingClientRect();
  if(!station||!layer)return null;
  const r=station.getBoundingClientRect();
  return {x:r.left-layer.left+r.width/2-85,y:r.bottom-layer.top+4};
}
function dockPosition(){
  const dock=q('#rippletDock'),layer=roamLayer?.getBoundingClientRect(),avatar=lifeAvatar?.getBoundingClientRect();
  if(!dock||!layer)return null;
  const r=dock.getBoundingClientRect();
  const w=Math.max(7,avatar?.width||8);
  const h=Math.max(10,avatar?.height||11);
  return {
    x:r.left-layer.left+r.width/2-w/2,
    y:Math.max(6,r.top-layer.top+Math.max(4,(r.height-h)*.16))
  };
}
function setDockStatus(text){
  setText('#rippletDockStatus',text);
  q('#rippletDock')?.classList.toggle('is-docked',text==='DOCKED');
}
function dockRipplet(){
  roamDocked=true;
  clearTimeout(roamTimer);
  syncRoamBounds();
  const target=dockPosition();
  if(target){
    window.XRPet3D?.motor?.('walk');
    setRoamPosition(target.x,target.y,'walk');
    setDockStatus('DOCKING');
    setTimeout(()=>{
      if(!roamDocked)return;
      setDockStatus('DOCKED');
      lifeAvatar && (lifeAvatar.dataset.activity='dock');
      window.XRPet3D?.perform?.('salute');
      setTimeout(()=>{if(roamDocked)window.XRPet3D?.perform?.('thinking')},2600);
    },1750);
  }
}
function undockRipplet(){
  roamDocked=false;
  setDockStatus('ROAMING');
  window.XRPet3D?.perform?.('wave');
  setTimeout(()=>{if(!roamDocked)goRipplet('explore')},650);
  roamingStep();
}
function goRipplet(activity='explore'){
  syncRoamBounds();
  const layer=roamLayer?.getBoundingClientRect();if(!layer)return;
  const avatar=lifeAvatar?.getBoundingClientRect();
  const currentX=avatar?avatar.left-layer.left:layer.width*.5;
  const currentY=avatar?avatar.top-layer.top:layer.height*.55;
  let target=null;
  if(activity==='dock')target=dockPosition();
  if(activity==='socialize')target=null;
  if(activity==='ledger')target={x:layer.width*.72,y:Math.max(165,layer.height*.34)};
  if(!target){
    const avatarH=Math.max(10,avatar?.height||11);
    const avatarW=Math.max(7,avatar?.width||8);
    target={
      x:14+Math.random()*Math.max(40,layer.width-avatarW-28),
      y:12+Math.random()*Math.max(36,layer.height-avatarH-24)
    };
  }
  const distance=Math.hypot(target.x-currentX,target.y-currentY);
  const locomotion=activity==='dock'?'walk':distance>Math.max(180,layer.width*.24)?'run':'walk';
  window.XRPet3D?.motor?.(locomotion);
  setRoamPosition(target.x,target.y,locomotion);
  if(activity==='socialize'){
    window.XRPet3D?.perform?.('wave');
  }
}
const RIPPLET_PLAY_PROPS=[
  {kind:'orb',label:'XRP orb',glyph:'X'},
  {kind:'cube',label:'ledger cube',glyph:'▣'},
  {kind:'ring',label:'signal ring',glyph:'◇'},
  {kind:'chip',label:'589 chip',glyph:'589'}
];
let heldPlayProp=null,playPropDropTimer=0,lastInterfacePlayAt=0;

function visibleTextTerrain(){
  const shell=q('.main-shell')?.getBoundingClientRect();
  const active=q('.primary-view-section.view-active');
  if(!shell||!active)return[];
  const walker=document.createTreeWalker(active,NodeFilter.SHOW_TEXT,{
    acceptNode(node){
      const parent=node.parentElement;
      const text=(node.nodeValue||'').trim();
      if(!parent||text.length<2)return NodeFilter.FILTER_REJECT;
      if(parent.closest('script,style,textarea,input,select,option,.muted[hidden]'))return NodeFilter.FILTER_REJECT;
      const cs=getComputedStyle(parent);
      if(cs.display==='none'||cs.visibility==='hidden'||Number(cs.opacity)===0)return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const terrain=[];
  while(walker.nextNode()&&terrain.length<90){
    const node=walker.currentNode,text=node.nodeValue||'';
    const re=/\S+/g;let m,count=0;
    while((m=re.exec(text))&&terrain.length<90){
      if(count++%2===1)continue;
      try{
        const range=document.createRange();
        range.setStart(node,m.index);
        range.setEnd(node,m.index+m[0].length);
        const r=range.getBoundingClientRect();
        if(r.width<5||r.height<6)continue;
        if(r.bottom<shell.top+54||r.top>shell.bottom-8||r.right<shell.left+8||r.left>shell.right-8)continue;
        terrain.push({__terrain:'word',__rect:r,tagName:'TEXTWORD',label:m[0],classList:null});
      }catch{}
    }
  }
  return terrain;
}
function visibleInterfaceTargets(){
  const layer=roamLayer?.getBoundingClientRect(),shell=q('.main-shell')?.getBoundingClientRect();
  if(!layer||!shell)return[];
  const selectors=[
    '.primary-view-section.view-active h1',
    '.primary-view-section.view-active h2',
    '.primary-view-section.view-active h3',
    '.primary-view-section.view-active p',
    '.primary-view-section.view-active .eyebrow',
    '.primary-view-section.view-active button',
    '.primary-view-section.view-active .detail-card',
    '.primary-view-section.view-active .contact-card',
    '.primary-view-section.view-active .ecosystem-token-card',
    '.primary-view-section.view-active article',
    '.primary-view-section.view-active .game-panel.active'
  ];
  return qa(selectors.join(',')).filter(el=>{
    if(el.closest('.sidebar')||el.closest('#rippletDock')||el.closest('#topCommandDeck'))return false;
    const r=el.getBoundingClientRect(),style=getComputedStyle(el);
    return style.display!=='none'&&style.visibility!=='hidden'&&r.width>28&&r.height>12&&
      r.bottom>shell.top+18&&r.top<shell.bottom-18&&r.right>shell.left+12&&r.left<shell.right-12;
  });
}
function terrainRectLocal(target){
  const shell=q('.main-shell'),rect=target?.__rect||target?.getBoundingClientRect?.();
  if(!shell||!rect)return null;
  const sr=shell.getBoundingClientRect();
  return {
    left:rect.left-sr.left+shell.scrollLeft,
    right:rect.right-sr.left+shell.scrollLeft,
    top:rect.top-sr.top+shell.scrollTop,
    bottom:rect.bottom-sr.top+shell.scrollTop,
    width:rect.width,
    height:rect.height
  };
}
function terrainDistanceToPointer(rect){
  const dx=Math.max(rect.left-rippletPointer.x,0,rippletPointer.x-rect.right);
  const dy=Math.max(rect.top-rippletPointer.y,0,rippletPointer.y-rect.bottom);
  return Math.hypot(dx,dy);
}
function terrainNearPointer(){
  const pool=[...visibleTextTerrain(),...visibleInterfaceTargets()];
  return pool.map(target=>{
    const rect=terrainRectLocal(target);
    return rect?{target,rect,distance:terrainDistanceToPointer(rect)}:null;
  }).filter(Boolean).sort((a,b)=>a.distance-b.distance).slice(0,10);
}
function pointerActionFor(hit){
  const {rect,target}=hit;
  const mx=rippletPointer.x,my=rippletPointer.y;
  const edgeX=Math.min(Math.abs(mx-rect.left),Math.abs(mx-rect.right));
  const nearTop=Math.abs(my-rect.top)<=8;
  const nearBottom=Math.abs(my-rect.bottom)<=8;
  const side=edgeX<=7;
  const word=target?.__terrain==='word';

  if(side)return {mode:'hang',action:'hang'};
  if(my<rect.top-10)return {mode:'climb',action:'climb'};
  if(nearTop)return {mode:'perch',action:Math.random()<.22?'sit':'stand'};
  if(nearBottom)return {mode:'hop',action:'jump'};
  if(word&&Math.random()<.34)return {mode:'hang',action:'hang'};
  return {mode:'perch',action:'stand'};
}
function followRippletPointer(force=false){
  if(roamDocked||!lifeAvatar||!roamLayer)return false;
  if(!rippletPointer.active&&!force)return false;
  const hits=terrainNearPointer();
  if(!hits.length)return false;

  const hit=hits[0],choice=pointerActionFor(hit);
  const p=interfaceTargetPosition(hit.target,choice.mode);
  if(!p)return false;

  rippletLastPointerTarget=hit.target;
  markInterfaceTarget(hit.target,true);

  const avatar=lifeAvatar.getBoundingClientRect(),shell=q('.main-shell')?.getBoundingClientRect();
  if(shell){
    const currentCenter=(avatar.left-shell.left)+(avatar.width*.5)+q('.main-shell').scrollLeft;
    const dir=rippletPointer.x<currentCenter?'left':'right';
    window.XRPet2D?.face?.(dir);
  }

  if(choice.action==='hang'){
    window.XRPet2D?.motor?.('hang');
    routeRippletTo(p.x,p.y,'hang',hit.target);
    setText('#mindAction','Following cursor · hanging');
  }else if(choice.action==='climb'){
    window.XRPet2D?.motor?.('climb');
    routeRippletTo(p.x,p.y,'climb',hit.target);
    setText('#mindAction','Following cursor · climbing');
  }else if(choice.action==='jump'){
    window.XRPet2D?.motor?.('jump');
    routeRippletTo(p.x,p.y,'jump',hit.target);
    setText('#mindAction','Following cursor · jumping');
  }else if(choice.action==='sit'){
    window.XRPet2D?.motor?.('sit');
    routeRippletTo(p.x,p.y,'sit',hit.target);
    setText('#mindAction','Following cursor · sitting');
  }else{
    window.XRPet2D?.motor?.('stand');
    routeRippletTo(p.x,p.y,'stand',hit.target);
    setText('#mindAction','Following cursor · perched');
  }
  setText('#mindThought','I am following your mouse through the page terrain.');

  clearTimeout(rippletPointerTimer);
  rippletPointerTimer=setTimeout(()=>{
    if(rippletLastPointerTarget===hit.target)markInterfaceTarget(hit.target,false);
  },650);
  return true;
}
function updateRippletPointer(e){
  const shell=q('.main-shell');if(!shell)return;
  const r=shell.getBoundingClientRect();
  rippletPointer.x=e.clientX-r.left+shell.scrollLeft;
  rippletPointer.y=e.clientY-r.top+shell.scrollTop;
  rippletPointer.active=true;
  rippletPointer.movedAt=Date.now();
  clearTimeout(rippletPointerTimer);
  rippletPointerTimer=setTimeout(()=>followRippletPointer(),34);
}
function rectsOverlap(a,b,pad=0){
  return !(a.right<=b.left+pad||a.left>=b.right-pad||a.bottom<=b.top+pad||a.top>=b.bottom-pad);
}
function avatarRectAt(x,y){
  const avatar=lifeAvatar?.getBoundingClientRect();
  const w=Math.max(7,avatar?.width||8),h=Math.max(10,avatar?.height||11);
  return {left:x,top:y,right:x+w,bottom:y+h,width:w,height:h};
}
function visibleCollisionRects(ignoreTarget=null){
  const shell=q('.main-shell'),sr=shell?.getBoundingClientRect();
  if(!shell||!sr)return[];
  const rects=[];
  for(const target of [...visibleTextTerrain(),...visibleInterfaceTargets()]){
    if(target===ignoreTarget)continue;
    const r=target?.__rect||target?.getBoundingClientRect?.();
    if(!r)continue;
    rects.push({
      left:r.left-sr.left+shell.scrollLeft,
      right:r.right-sr.left+shell.scrollLeft,
      top:r.top-sr.top+shell.scrollTop,
      bottom:r.bottom-sr.top+shell.scrollTop
    });
  }
  return rects;
}
function surfacePositionIsClear(x,y,ignoreTarget=null){
  const a=avatarRectAt(x,y);
  return !visibleCollisionRects(ignoreTarget).some(r=>rectsOverlap(a,r,0));
}
function routeRippletTo(x,y,activity='walk',ignoreTarget=null){
  if(!lifeAvatar||!roamLayer)return;
  const shell=q('.main-shell'),sr=shell?.getBoundingClientRect(),ar=lifeAvatar.getBoundingClientRect();
  if(!shell||!sr){setRoamPosition(x,y,activity);return}
  const current={
    x:ar.left-sr.left+shell.scrollLeft,
    y:ar.top-sr.top+shell.scrollTop
  };
  const distance=Math.hypot(x-current.x,y-current.y);

  if(distance<20||activity==='climb'||activity==='hang'){
    setRoamPosition(x,y,activity);
    return;
  }

  // Route through open air above the current and destination surfaces instead of through page content.
  const clearanceY=Math.max(4,Math.min(current.y,y)-18);
  window.XRPet2D?.motor?.('jump');
  setRoamPosition(current.x,clearanceY,'jump');
  setTimeout(()=>{
    if(roamDocked)return;
    setRoamPosition(x,clearanceY,'run');
    setTimeout(()=>{
      if(roamDocked)return;
      setRoamPosition(x,y,activity==='sit'?'walk':activity);
      if(activity==='sit')window.XRPet2D?.motor?.('sit');
      else if(activity==='stand')window.XRPet2D?.motor?.('stand');
    },220);
  },180);
}
function interfaceTargetPosition(el,mode='perch'){
  const shell=q('.main-shell'),avatar=lifeAvatar?.getBoundingClientRect(),r=el?.__rect||el?.getBoundingClientRect?.();
  if(!shell||!r)return null;
  const sr=shell.getBoundingClientRect();
  const aw=Math.max(7,avatar?.width||8),ah=Math.max(10,avatar?.height||11);
  const localLeft=r.left-sr.left+shell.scrollLeft;
  const localTop=r.top-sr.top+shell.scrollTop;
  const localRight=r.right-sr.left+shell.scrollLeft;
  const localBottom=r.bottom-sr.top+shell.scrollTop;

  // Stand/sit/perch strictly above the element: never inside its text/box rectangle.
  if(mode==='perch'){
    const x=Math.max(4,Math.min(shell.scrollWidth-aw-4,localLeft+r.width*.5-aw*.5));
    const y=Math.max(4,localTop-ah-1);
    return {x,y};
  }

  // Jump destination is also a top surface.
  if(mode==='hop'){
    const x=Math.max(4,Math.min(shell.scrollWidth-aw-4,localRight-aw));
    const y=Math.max(4,localTop-ah-2);
    return {x,y};
  }

  // Climb alongside an outside edge.
  if(mode==='climb'){
    const useLeft=rippletPointer.x<(localLeft+r.width*.5);
    const x=useLeft?Math.max(4,localLeft-aw-1):Math.min(shell.scrollWidth-aw-4,localRight+1);
    const y=Math.max(4,Math.min(shell.scrollHeight-ah-4,localTop+r.height*.45-ah*.5));
    return {x,y};
  }

  // Hang outside the nearest edge with only the hands visually meeting the surface.
  if(mode==='hang'){
    const useLeft=rippletPointer.x<(localLeft+r.width*.5);
    const x=useLeft?Math.max(4,localLeft-aw+1):Math.min(shell.scrollWidth-aw-4,localRight-1);
    const y=Math.max(4,Math.min(shell.scrollHeight-ah-4,localTop+Math.min(r.height*.35,8)));
    return {x,y};
  }

  const x=Math.max(4,localLeft-aw-1);
  const y=Math.max(4,localTop-ah-1);
  return {x,y};
}
function markInterfaceTarget(el,on=true){
  qa('.ripplet-target-active').forEach(x=>x.classList.remove('ripplet-target-active'));
  if(on&&el)el.classList.add('ripplet-target-active');
}
function ensurePlayProps(){qa('.companion-play-prop').forEach(el=>el.remove());}
function nearestFreePlayProp(){ensurePlayProps();return null;}
function carryProp(prop){
  if(!prop||!lifeAvatar)return;
  clearTimeout(playPropDropTimer);
  heldPlayProp=prop;
  prop.classList.add('held');
  prop.style.left='';prop.style.top='';
  lifeAvatar.appendChild(prop);
  window.XRPet3D?.motor?.('grab',{side:'right'});
  setTimeout(()=>window.XRPet3D?.motor?.('carry',{side:'right'}),700);
  setText('#mindAction','Carrying '+(prop.dataset.propLabel||'object'));
  setText('#mindThought','I found something in the interface to play with.');
  playPropDropTimer=setTimeout(dropPlayProp,4200+Math.random()*2600);
}
function dropPlayProp(){
  clearTimeout(playPropDropTimer);
  const prop=heldPlayProp;if(!prop||!roamLayer||!lifeAvatar)return;
  const layer=roamLayer.getBoundingClientRect(),a=lifeAvatar.getBoundingClientRect();
  prop.classList.remove('held');roamLayer.appendChild(prop);
  prop.style.left=Math.max(8,Math.min(layer.width-42,a.left-layer.left+a.width*.62))+'px';
  prop.style.top=Math.max(12,Math.min(layer.height-42,a.bottom-layer.top-34))+'px';
  prop.classList.remove('just-dropped');void prop.offsetWidth;prop.classList.add('just-dropped');
  heldPlayProp=null;
  window.XRPet3D?.motor?.('reach',{side:'right'});
}
function makeInterfaceEcho(){return null;}
function playWithInterface(force=false){
  if(roamDocked||!lifeAvatar||!roamLayer)return false;
  if(!force&&Date.now()-lastInterfacePlayAt<1900)return false;

  const words=visibleTextTerrain();
  const elements=visibleInterfaceTargets();
  if(!words.length&&!elements.length)return false;
  lastInterfacePlayAt=Date.now();

  const preferWord=words.length&&(Math.random()<.76||!elements.length);
  const target=preferWord
    ? words[Math.floor(Math.random()*words.length)]
    : elements[Math.floor(Math.random()*elements.length)];
  if(!target)return false;

  const heading=!target.__terrain&&/^H[1-3]$/.test(target.tagName);
  const card=!target.__terrain&&Boolean(target.matches?.('article,.detail-card,.contact-card,.ecosystem-token-card,.game-panel,button'));
  const roll=Math.random();

  let mode='perch',action='walk';
  if(target.__terrain){
    if(roll<.24){mode='hang';action='hang'}
    else if(roll<.70){mode='hop';action='jump'}
    else{mode='perch';action='walk'}
  }else if((heading||card)&&roll<.30){
    mode='hang';action='hang';
  }else if((heading||card)&&roll<.62){
    mode='climb';action='climb';
  }else if(roll<.78){
    mode='hop';action='jump';
  }

  const p=interfaceTargetPosition(target,mode);if(!p)return false;
  markInterfaceTarget(target,true);

  if(action==='hang'){
    window.XRPet3D?.motor?.('hang');
    routeRippletTo(p.x,p.y,'hang',target);
    setText('#mindAction',target.__terrain?'Hanging from letters':'Hanging from a box');
    setText('#mindThought','I grabbed the edge and I am hanging on.');
    setTimeout(()=>{
      if(roamDocked)return;
      window.XRPet3D?.motor?.('climb');
      const up=interfaceTargetPosition(target,'perch');
      if(up)setRoamPosition(up.x,up.y,'climb');
    },850);
  }else if(action==='jump'){
    window.XRPet3D?.motor?.('jump');
    routeRippletTo(p.x,p.y,'jump',target);
    setText('#mindAction','Jumping between letters');
    setText('#mindThought','I am using the words as little platforms.');
  }else if(action==='climb'){
    window.XRPet3D?.motor?.('climb');
    routeRippletTo(p.x,p.y,'climb',target);
    setText('#mindAction','Climbing the interface');
    setText('#mindThought','I grabbed the edge and climbed onto it.');
  }else{
    window.XRPet3D?.motor?.('walk');
    routeRippletTo(p.x,p.y,'stand',target);
    setText('#mindAction',target.__terrain?'Walking on words':'Exploring the page');
    setText('#mindThought',target.__terrain?'I found another word to stand on.':'I am moving through this page on my own.');
  }

  setTimeout(()=>{
    markInterfaceTarget(target,false);
    if(!roamDocked&&Math.random()<.42){
      const emotes=['wave','thinking','happy','salute'];
      window.XRPet3D?.perform?.(emotes[Math.floor(Math.random()*emotes.length)]);
    }
  },1450);

  return true;
}
function playWithObject(){
  if(roamDocked)return false;
  const prop=nearestFreePlayProp();if(!prop)return false;
  const layer=roamLayer?.getBoundingClientRect(),r=prop.getBoundingClientRect(),avatar=lifeAvatar?.getBoundingClientRect();
  if(!layer||!avatar)return false;
  const x=r.left-layer.left-avatar.width*.55,y=r.top-layer.top-avatar.height*.55;
  window.XRPet3D?.motor?.('walk');setRoamPosition(x,y,'walk');
  setText('#mindAction','Playing');
  setText('#mindThought','I spotted '+(prop.dataset.propLabel||'an object')+' and decided to pick it up.');
  setTimeout(()=>carryProp(prop),1300);
  return true;
}
window.XRPetPlayground={
  play:()=>playWithInterface(true),
  object:playWithObject,
  drop:dropPlayProp,
  refresh:ensurePlayProps
};
ensurePlayProps();

function roamingStep(){
  clearTimeout(roamTimer);
  if(roamDocked){
    const dockEmotes=['thinking','salute','wave','shrug','happy'];
    const emote=dockEmotes[Math.floor(Math.random()*dockEmotes.length)];
    window.XRPet3D?.perform?.(emote);
    roamTimer=setTimeout(roamingStep,5200+Math.random()*4200);
    return;
  }
  if(rippletPointer.active&&Date.now()-rippletPointer.movedAt<8000){
    followRippletPointer(true);
    roamTimer=setTimeout(roamingStep,320);
    return;
  }
  const roll=Math.random();
  if(roll<.93)playWithInterface();
  else goRipplet('explore');
  roamTimer=setTimeout(roamingStep,1700+Math.random()*2500);
}
function renderMind(){
  const labels={roam:'Roaming',dock:'Docked',socialize:'Signal Friend',scan:'Scanning XRPL',wave:'Waving',dance:'Dancing',focus:'Focused',run:'Running',jump:'Jumping',climb:'Climbing',reach:'Reaching',grab:'Grabbing',carry:'Carrying',crouch:'Crouching',turn:'Turning'};
  setText('#mindAction',labels[state.mindAction]||state.mindAction||'Roaming');
  setText('#mindThought',state.mindThought||'Watching the Ledger and deciding what to do next.');
  setText('#mindMode',state.mindMode==='external-si-autonomy'?'SI MIND':'LOCAL AUTONOMY');
}
function mindContext(){
  return {
    connected:state.connected,
    ledgerIndex:state.ledgerIndex,
    txCount:state.txCount,
    recentTxSeconds:state.lastLedgerTxAt?Math.max(0,(Date.now()-state.lastLedgerTxAt)/1000):9999,
    price:state.xrpPrice,
    priceTickPct:state.lastPriceTickPct||0,
    change24h:state.xrpChange24h,
    newAnnouncement:Boolean(state.lastAnnouncementAt&&Date.now()-state.lastAnnouncementAt<120000),
    needs:{social:state.lifeSocial},
    currentActivity:state.lifeActivity,
    memories:state.memories.slice(-5)
  };
}
function executeMindDecision(decision){
  if(!decision||false)return;
  const action=decision.action||'roam';
  state.mindAction=action;
  state.mindThought=decision.thought||'I chose my next move.';
  state.mindMode=decision.mode||'local-autonomy';
  if(action==='socialize'){
    performLifeActivity('socialize',false,false);
  }else if(action==='roam'){
    state.lifeActivity='explore';window.XRPetRoam?.go?.('explore');
  }else if(['scan','wave','dance','focus','run','jump','climb','reach','grab','carry','crouch','turn'].includes(action)){
    if(action==='run'){window.XRPetRoam?.go?.('explore')}
    else window.XRPet3D?.motor?.(action,{side:Math.random()<.5?'left':'right',turn:(Math.random()<.5?-1:1)*.45});
    if(action==='wave')playSound('wave',true);
    if(action==='dance')playSound('dance',true);
    if(action==='scan')playSound('ledgerTx',true);
  }
  renderMind();persist();
}
let mindTimer=0,mindBusy=false;
async function runAutonomousMind(){
  clearTimeout(mindTimer);
  if(!false&&!mindBusy){
    mindBusy=true;
    try{
      const r=await fetch('/api/companion/decision',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({context:mindContext()})});
      const d=await r.json();
      if(r.ok)executeMindDecision(d);
      setText('#mindSiStatus',d.mode==='external-si-autonomy'?'Connected SI':'Local fallback');
    }catch{
      setText('#mindSiStatus','Local fallback');
      executeMindDecision({action:'roam',thought:'The SI link is quiet, so I am exploring on my own.',visitStation:false,mode:'local-autonomy'});
    }finally{mindBusy=false}
  }
  mindTimer=setTimeout(runAutonomousMind,38000+Math.random()*22000);
}
function spontaneousRippletReaction(){
  clearTimeout(spontaneousReactionTimer);
  {
    const options=roamDocked
      ? ['thinking','salute','wave','shrug','happy','surprised']
      : ['greet','happy','focus','scan','wave','dance','cheer','laugh','shrug','confused','excited','point','salute','thinking','surprised','jump','turn','reach'];
    const pick=options[Math.floor(Math.random()*options.length)];
    if(['jump','turn','reach'].includes(pick))window.XRPet3D?.motor?.(pick,{side:Math.random()<.5?'left':'right',turn:(Math.random()<.5?-1:1)*.35});
    else window.XRPet3D?.perform?.(pick);
    if(lifeAvatar){
      lifeAvatar.dataset.reaction=pick;
      setTimeout(()=>{if(lifeAvatar?.dataset.reaction===pick)delete lifeAvatar.dataset.reaction},1800);
    }
    if(Math.random()<.28)playSound(pick==='dance'?'dance':pick==='wave'?'wave':pick==='scan'?'ledgerTx':'pet',true);
  }
  spontaneousReactionTimer=setTimeout(spontaneousRippletReaction,4200+Math.random()*5200);
}
function setRoamPinned(){
  roamPinned=false;roamDocked=false;setDockStatus('ROAMING');state.lifePinned=false;state.lifeRoaming=true;state.lifeActivity='explore';persist();renderLife();
}
window.XRPetRoam={go:goRipplet,pin:()=>setRoamPinned(false),dock:dockRipplet,undock:undockRipplet,sync:syncRoamBounds};
q('#dockRipplet')?.addEventListener('click',dockRipplet);
q('#undockRipplet')?.addEventListener('click',undockRipplet);
q('#rippletDock')?.addEventListener('dblclick',()=>roamDocked?undockRipplet():dockRipplet());
let roamScrollTimer=0;
const rippletShell=q('.main-shell');
rippletShell?.addEventListener('pointermove',updateRippletPointer,{passive:true});
rippletShell?.addEventListener('pointerenter',updateRippletPointer,{passive:true});
rippletShell?.addEventListener('pointerleave',()=>{rippletPointer.active=false},{passive:true});
addEventListener('resize',()=>{syncRoamBounds();if(roamDocked){const p=dockPosition();if(p)setRoamPosition(p.x,p.y,'dock')}else if(rippletPointer.active)followRippletPointer(true);else playWithInterface(true)});
q('.main-shell')?.addEventListener('scroll',()=>{
  syncRoamBounds();
  if(roamDocked){
    const p=dockPosition();if(p)setRoamPosition(p.x,p.y,'dock');
    return;
  }
  clearTimeout(roamScrollTimer);
  roamScrollTimer=setTimeout(()=>rippletPointer.active?followRippletPointer(true):playWithInterface(true),180);
},{passive:true});
syncRoamBounds();setTimeout(()=>goRipplet('explore'),300);roamingStep();spontaneousRippletReaction();applyNftCompanion();
qa('[data-life-action]').forEach(b=>b.addEventListener('click',()=>performLifeActivity(b.dataset.lifeAction,true,false)));
setInterval(lifeTick,15000);
dailyVisit();render();registerVisitor();connectLedger();loadRecentTransactionsFallback(true);bindExchangeMenu();setExchange(state.selectedExchange||'all',{initial:true});loadUpdates();integrationCheck();setTimeout(runAutonomousMind,12000);setInterval(()=>{if(Date.now()-marketLastTickAt>18000)loadMarket(false)},18000);setInterval(loadMarketHistory,300000);setInterval(loadUpdates,15000);setInterval(integrationCheck,15000);setInterval(()=>loadRecentTransactionsFallback(false),8000);

window.addEventListener('xrpet:gameEvent',e=>{
  const d=e.detail||{};
  if(d.type==='hit'){
    const action=d.streak>=5?'celebrate':d.game==='Consensus 80'?'scan':'happy';
    window.XRPet3D?.perform?.(action);
    playSound(d.streak>=5?'success':'notification',true);
    addXp(d.streak>=5?2:1);
  }else if(d.type==='miss'){
    window.XRPet3D?.perform?.('alert');playSound('error',true);
  }else if(d.type==='complete'){
    window.XRPet3D?.perform?.((d.score||0)>100?'jump':'greet');
    playSound((d.score||0)>100?'success':'pet',true);
    addXp(Math.max(1,Math.min(10,Math.floor((Number(d.score)||0)/50)+1)));
  }else if(d.type==='start'){
    window.XRPet3D?.perform?.('focus');playSound('open',true);
  }
});

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('/sw.js').catch(err=>console.warn('XRPet service worker registration failed',err));
  },{once:true});
}

function closeCustomizationPanels(){
  qa('[data-customization-panel]').forEach(p=>p.classList.remove('is-open'));
  document.body.classList.remove('customization-open','workspace-open');
  const target=primaryView==='home'?'homeSection':primaryView==='live'?'xrplPanel':primaryView==='learn'?'learnSection':primaryView==='announcements'?'announcementsSection':primaryView==='ripplet'?'companionSection':primaryView==='ecosystem'?'ecosystemSection':primaryView==='games'?'gamesSection':'xrpHistorySection';
  setTimeout(()=>scrollSectionTop(target),20);
}
qa('[data-customize-target]').forEach(b=>b.addEventListener('click',()=>{
  closeCustomizationPanels();
  const panel=q('#'+b.dataset.customizeTarget);
  if(panel){
    if(b.dataset.customizeTarget==='roomsSection'){
      pendingRoom=state.room;
      qa('.room-choice').forEach(x=>x.classList.toggle('pending',x.dataset.room===pendingRoom));
      setText('#roomPendingLabel','Current room: '+(ROOM_NAMES[state.room]||state.room)+'. Choose another room, then apply.');
    }
    panel.classList.add('is-open');
    document.body.classList.add('workspace-open');
    q('#customizeDetails')?.removeAttribute('open');
    panel.scrollTop=0;
    setTimeout(()=>scrollSectionTop(panel.id),20);
  }
}));
qa('[data-customize-close]').forEach(b=>b.addEventListener('click',closeCustomizationPanels));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeCustomizationPanels()});

let primaryView='home';
function ensurePrimaryViewVisible(){
  const home=q('#homeSection');
  if(!qa('.primary-view-section.view-active').length&&home){
    home.classList.add('view-active');
    document.body.dataset.primaryView='home';
  }
}
ensurePrimaryViewVisible();
function setPrimaryView(view='home'){
  if(lifeAvatar&&!roamDocked){
    lifeAvatar.classList.remove('page-hop');
    void lifeAvatar.offsetWidth;
    lifeAvatar.classList.add('page-hop');
    window.XRPet3D?.motor?.('jump');
  }
  primaryView=view;
  qa('[data-view-section]').forEach(section=>section.classList.toggle('view-active',section.dataset.viewSection===view));
  qa('[data-primary-view]').forEach(b=>b.classList.toggle('active',b.dataset.primaryView===view));
  document.body.dataset.primaryView=view;
  qa('[data-customization-panel]').forEach(p=>p.classList.remove('is-open'));
  document.body.classList.remove('workspace-open','customization-open');
  const target=view==='home'?'homeSection':view==='live'?'xrplPanel':view==='learn'?'learnSection':view==='announcements'?'announcementsSection':view==='ripplet'?'companionSection':view==='ecosystem'?'ecosystemSection':view==='games'?'gamesSection':'xrpHistorySection';
  ['historyNavDetails','exchangeNavDetails','rippletNavDetails','ecosystemNavDetails','gamesNavDetails','customizeDetails','settingsDetails'].forEach(id=>{q('#'+id)?.removeAttribute('open')});
  const pane=q('#'+target);if(pane)pane.scrollTop=0;
  setTimeout(()=>{
    scrollSectionTop(target);
    syncRoamBounds();
    if(!roamDocked)setTimeout(()=>{
      if(rippletPointer.active)followRippletPointer(true);
      else playWithInterface(true);
      lifeAvatar?.classList.remove('page-hop');
    },180);
  },0);
}
qa('[data-primary-view]').forEach(b=>b.addEventListener('click',()=>setPrimaryView(b.dataset.primaryView)));

const XRP_LEARN_QUIZ=[
  {category:'XRP BASICS',q:'What is XRP?',a:['A share of Ripple stock','The native digital asset of the XRP Ledger','A proof-of-work mining reward','A private bank database'],correct:1,why:'XRP is the native digital asset of the XRP Ledger. It is not Ripple stock.'},
  {category:'RIPPLE VS. XRP',q:'Which statement is correct?',a:['Ripple, XRP, and XRPL are the same thing','Ripple owns every XRP Ledger validator','Ripple is a company, XRP is an asset, and XRPL is a public network','XRP can only be used by Ripple'],correct:2,why:'Ripple is a company; XRP is a digital asset; XRPL is the public ledger network.'},
  {category:'XRPL',q:'Does the XRP Ledger use proof-of-work mining?',a:['Yes','No','Only at night','Only for XRP payments'],correct:1,why:'XRPL reaches consensus without proof-of-work mining.'},
  {category:'XRPL',q:'What is a trust line primarily used for on XRPL?',a:['Mining XRP','Holding or transacting an issued currency from an issuer','Creating a password','Voting in political elections'],correct:1,why:'Trust lines define an account relationship with an issuer for issued currencies.'},
  {category:'PAYMENTS',q:'What can a destination tag help a service identify?',a:['A specific customer or recipient within one XRP Ledger address','The current XRP market price','A validator private key','The total XRP supply'],correct:0,why:'Exchanges and custodial services commonly use destination tags to route deposits to the correct internal customer.'},
  {category:'XRPL',q:'What does XRPL include natively for exchanging assets?',a:['Only centralized exchanges','An order-book DEX and AMM functionality','A proof-of-work mining pool','No exchange functionality'],correct:1,why:'XRPL includes built-in decentralized exchange functionality, including order books and AMMs.'},
  {category:'XRP BASICS',q:'Owning XRP means you own part of Ripple the company.',a:['True','False'],correct:1,why:'XRP is a digital asset. It is not equity or ownership in Ripple.'},
  {category:'PAYMENTS',q:'Can an XRPL payment path use liquidity to convert between compatible assets?',a:['Yes','No'],correct:0,why:'XRPL pathfinding can route payments through available liquidity and compatible asset pairs.'},
  {category:'XRPL',q:'Who participates in agreeing on ledger state?',a:['Independent validators','Bitcoin miners only','Ripple customers only','Stock exchanges'],correct:0,why:'Independent validators participate in the consensus process that agrees on ledger state.'},
  {category:'RIPPLE VS. XRP',q:'Can the XRP Ledger continue operating independently of Ripple as a company?',a:['Yes, it is a public open-source network','No, every transaction requires a Ripple employee','No, Ripple manually approves each block','Only during business hours'],correct:0,why:'XRPL is a public open-source network operated by a distributed ecosystem, not a company-operated transaction queue.'}
];
let learnModule='xrp',quizIndex=0,quizCorrect=0,quizAnswered=false;
function openLearnModule(name='xrp'){
  learnModule=name;
  qa('[data-learn-panel]').forEach(p=>p.classList.toggle('active',p.dataset.learnPanel===name));
  qa('[data-learn-module]').forEach(b=>b.classList.toggle('active',b.dataset.learnModule===name));
  q('#learnSection')?.scrollTo({top:0,behavior:'auto'});
  if(name==='quiz')renderQuiz();
}
qa('[data-learn-module]').forEach(b=>b.addEventListener('click',()=>openLearnModule(b.dataset.learnModule)));
qa('[data-learn-next]').forEach(b=>b.addEventListener('click',()=>openLearnModule(b.dataset.learnNext)));

function updateLearnBest(score){
  const prev=Number(localStorage.getItem('xrpetLearnBest')||0);
  const best=Math.max(prev,score);
  localStorage.setItem('xrpetLearnBest',String(best));
  setText('#learnBestScore',best+'%');
}
function renderQuiz(){
  const item=XRP_LEARN_QUIZ[quizIndex];if(!item)return;
  quizAnswered=false;
  q('#quizResult')?.setAttribute('hidden','');
  q('#quizCard')?.removeAttribute('hidden');
  setText('#quizProgress',(quizIndex+1)+' / '+XRP_LEARN_QUIZ.length);
  setText('#quizScoreLive',quizCorrect+' correct');
  setText('#quizCategory',item.category);
  setText('#quizQuestion',item.q);
  const answers=q('#quizAnswers');if(!answers)return;
  answers.innerHTML='';
  item.a.forEach((label,i)=>{
    const b=document.createElement('button');
    b.type='button';b.textContent=label;b.dataset.quizAnswer=String(i);
    b.addEventListener('click',()=>answerQuiz(i));
    answers.appendChild(b);
  });
  const exp=q('#quizExplanation');if(exp){exp.textContent='';exp.className='quiz-explanation'}
  const next=q('#quizNext');if(next){next.disabled=true;next.textContent=quizIndex===XRP_LEARN_QUIZ.length-1?'See Results':'Next Question'}
}
function answerQuiz(choice){
  if(quizAnswered)return;quizAnswered=true;
  const item=XRP_LEARN_QUIZ[quizIndex],correct=choice===item.correct;
  if(correct)quizCorrect++;
  qa('#quizAnswers button').forEach((b,i)=>{
    b.disabled=true;
    if(i===item.correct)b.classList.add('correct');
    else if(i===choice)b.classList.add('wrong');
  });
  const exp=q('#quizExplanation');
  if(exp){exp.textContent=(correct?'Correct. ':'Not quite. ')+item.why;exp.classList.add(correct?'correct':'wrong')}
  setText('#quizScoreLive',quizCorrect+' correct');
  q('#quizNext')?.removeAttribute('disabled');
  window.XRPet3D?.perform?.(correct?'happy':'thinking');
  playSound(correct?'success':'notification',true);
}
q('#quizNext')?.addEventListener('click',()=>{
  if(!quizAnswered)return;
  if(quizIndex<XRP_LEARN_QUIZ.length-1){quizIndex++;renderQuiz();return}
  const pct=Math.round((quizCorrect/XRP_LEARN_QUIZ.length)*100);
  q('#quizCard')?.setAttribute('hidden','');
  q('#quizResult')?.removeAttribute('hidden');
  setText('#quizFinalScore',pct+'%');
  const passed=pct>=70,mastered=pct>=90;
  setText('#quizResultTitle',mastered?'XRPL Scholar':passed?'Knowledge Check Passed':'Keep Learning');
  setText('#quizResultText',mastered?'Excellent. You clearly understand the core differences between Ripple, XRP, and XRPL.':passed?'Good work. Review any missed concepts, then try for 90% or better.':'Go back through the four learning modules and retake the test when you are ready.');
  updateLearnBest(pct);
  if(passed){addXp(mastered?20:10);window.XRPet3D?.perform?.(mastered?'victory':'celebrate');playSound('success',true)}
});
q('#quizRestart')?.addEventListener('click',()=>{quizIndex=0;quizCorrect=0;quizAnswered=false;renderQuiz()});
setText('#learnBestScore',(Number(localStorage.getItem('xrpetLearnBest')||0))+'%');


function openHistoryView(view='All'){
  primaryView='history';
  qa('[data-view-section]').forEach(section=>section.classList.toggle('view-active',section.dataset.viewSection==='history'));
  qa('[data-primary-view]').forEach(b=>b.classList.remove('active'));
  document.body.dataset.primaryView='history';
  const section=q('#xrpHistorySection');if(!section)return;
  section.dataset.historyMode=view;
  const titles={
    All:['Overview + Full Timeline','The complete Ripple, XRP and XRP Ledger chronology.'],
    Origins:['Origins / Genesis','How the XRP Ledger began, its original design, launch and earliest organizational history.'],
    Ripple:['Ripple Company','Company milestones, products, leadership and strategic development connected to Ripple.'],
    XRP:['XRP Asset','XRP supply, distribution, utility and asset-level milestones.'],
    XRPL:['XRP Ledger','Protocol, amendments, network operations and XRP Ledger infrastructure.'],
    Legal:['Legal + Regulation','Court cases, regulatory events and legal milestones affecting Ripple and XRP.'],
    Market:['Market Cycles','Major XRP market-cycle context and historical price-era milestones without predictions.'],
    Adoption:['Adoption + Partnerships','Payments, integrations, institutional use and ecosystem adoption milestones.'],
    Acquisition:['Acquisitions','Ripple acquisitions and infrastructure expansion.'],
    People:['People Involved','Key people who shaped the XRP Ledger, Ripple and the XRP ecosystem.']
  };
  const meta=titles[view]||titles.All;
  const header=q('#historySelectedHeader');if(header)header.hidden=view==='All';
  setText('#historySelectedTitle',meta[0]);setText('#historySelectedDescription',meta[1]);
  window.XRPetHistoryPending=view;window.XRPetHistory?.setView?.(view);
  document.body.classList.remove('workspace-open','customization-open');
  qa('[data-customization-panel]').forEach(p=>p.classList.remove('is-open'));
  q('#historyNavDetails')?.removeAttribute('open');
  setTimeout(()=>scrollSectionTop('xrpHistorySection'),10);
}
qa('[data-history-view]').forEach(b=>b.addEventListener('click',()=>openHistoryView(b.dataset.historyView)));

function setEcosystemSubview(view='directory'){
  setPrimaryView('ecosystem');
  qa('[data-ecosystem-panel]').forEach(panel=>panel.classList.toggle('active',panel.dataset.ecosystemPanel===view));
  qa('[data-ecosystem-view]').forEach(btn=>btn.classList.toggle('active',btn.dataset.ecosystemView===view));
  q('#ecosystemNavDetails')?.removeAttribute('open');
  setTimeout(()=>scrollSectionTop('ecosystemSection'),0);
}
qa('[data-ecosystem-view]').forEach(btn=>btn.addEventListener('click',()=>setEcosystemSubview(btn.dataset.ecosystemView)));

function setGameSubview(id='ledgerRush'){
  setPrimaryView('games');
  const tab=q('[data-game-tab="'+id+'"]');
  tab?.click();
  qa('[data-game-nav]').forEach(btn=>btn.classList.toggle('active',btn.dataset.gameNav===id));
  q('#gamesNavDetails')?.removeAttribute('open');
  setTimeout(()=>scrollSectionTop('gamesSection'),0);
}
qa('[data-game-nav]').forEach(btn=>btn.addEventListener('click',()=>setGameSubview(btn.dataset.gameNav)));

q('#ecosystemNavDetails > summary')?.addEventListener('click',()=>setTimeout(()=>{if(primaryView!=='ecosystem')setPrimaryView('ecosystem')},0));
q('#gamesNavDetails > summary')?.addEventListener('click',()=>setTimeout(()=>{if(primaryView!=='games')setPrimaryView('games')},0));

function setRippletSubview(view='overview'){
  setPrimaryView('ripplet');
  qa('[data-ripplet-panel]').forEach(panel=>panel.classList.toggle('active',panel.dataset.rippletPanel===view));
  qa('[data-ripplet-view]').forEach(btn=>btn.classList.toggle('active',btn.dataset.rippletView===view));
  q('#rippletNavDetails')?.removeAttribute('open');
  const section=q('#companionSection');if(section)section.scrollTop=0;
}
qa('[data-ripplet-view]').forEach(btn=>btn.addEventListener('click',()=>setRippletSubview(btn.dataset.rippletView)));
q('#rippletNavDetails > summary')?.addEventListener('click',()=>setTimeout(()=>{if(primaryView!=='ripplet')setPrimaryView('ripplet')},0));

const dismissibleMenus=['historyNavDetails','exchangeNavDetails','rippletNavDetails','ecosystemNavDetails','gamesNavDetails','customizeDetails','settingsDetails'];
document.addEventListener('pointerdown',e=>{
  dismissibleMenus.forEach(id=>{
    const menu=q('#'+id);
    if(menu?.open&&!menu.contains(e.target))menu.removeAttribute('open');
  });
},{capture:true});
document.addEventListener('focusin',e=>{
  dismissibleMenus.forEach(id=>{
    const menu=q('#'+id);
    if(menu?.open&&!menu.contains(e.target))menu.removeAttribute('open');
  });
});


q('#customizeDetails')?.addEventListener('toggle',e=>{
  if(e.target.open) q('#settingsDetails')?.removeAttribute('open');
});
q('#settingsDetails')?.addEventListener('toggle',e=>{
  if(e.target.open) q('#customizeDetails')?.removeAttribute('open');
});

setPrimaryView('home');
