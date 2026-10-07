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
  const change=finiteNumber(state.xrpChange24h);
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
    {name:'Signal Cheer',actions:[['cheer',0],['salute',1200]],sounds:[['success',0],['greet',1150]],variant:'c'}
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
  visitorPollTimer=setInterval(async()=>{
    if(document.hidden||document.body.classList.contains('launch-locked'))return;
    try{const r=await fetch('/api/visitor-count',{cache:'no-store'});const d=await r.json();if(r.ok&&Number(d.count)!==visitorShown)animateVisitorCount(d.count)}catch{}
  },15000);
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
function finiteNumber(v){if(v===null||v===undefined||v==='')return null;const n=Number(v);return Number.isFinite(n)?n:null}
function fmtMarketNumber(v,digits=4){
  const n=finiteNumber(v);return Number.isFinite(n)?'$'+n.toFixed(digits):'—';
}
function fmtCompact(v,suffix=''){
  const n=finiteNumber(v);if(!Number.isFinite(n))return '—';
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
  const bid=finiteNumber(d.bestBid??d.best_bid),ask=finiteNumber(d.bestAsk??d.best_ask),price=finiteNumber(d.price);
  const spread=Number.isFinite(bid)&&Number.isFinite(ask)?ask-bid:finiteNumber(d.spread);
  const spreadBps=Number.isFinite(spread)&&Number.isFinite(price)&&price>0?(spread/price)*10000:finiteNumber(d.spreadBps);
  const meta=EXCHANGE_LABELS[d.exchange]||selectedExchangeMeta();
  setText('#marketBid',fmtMarketNumber(bid,5));
  setText('#marketAsk',fmtMarketNumber(ask,5));
  setText('#marketBidVenue',d.exchangeName||meta.name);
  setText('#marketAskVenue',d.exchangeName||meta.name);
  setText('#marketSpread',Number.isFinite(spread)?'$'+spread.toFixed(6):'—');
  setText('#marketSpreadBps',Number.isFinite(spreadBps)?spreadBps.toFixed(2)+' bps':'— bps');
  setText('#chartOpen',Number.isFinite(finiteNumber(d.open24h))?fmtMarketNumber(d.open24h):'—');
  setText('#chartHigh',Number.isFinite(finiteNumber(d.high24h))?fmtMarketNumber(d.high24h):'—');
  setText('#chartLow',Number.isFinite(finiteNumber(d.low24h))?fmtMarketNumber(d.low24h):'—');
  setText('#chartVolume',Number.isFinite(finiteNumber(d.volume24hXrp))?fmtCompact(d.volume24hXrp,' XRP'):'—');
  setText('#chartVolumeUsd',Number.isFinite(finiteNumber(d.volume24hUsd))?'$'+fmtCompact(d.volume24hUsd):'—');
  setText('#chartRangePct',Number.isFinite(finiteNumber(d.range24hPct))?finiteNumber(d.range24hPct).toFixed(2)+'%':'—');
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
  const p=finiteNumber(ticker.price);
  if(!Number.isFinite(p)||p<=0)return;
  const previousPrice=state.lastMarketPrice;
  state.xrpPrice=p;state.lastMarketPrice=p;
  const change24h=finiteNumber(ticker.price_percent_chg_24_h);
  if(Number.isFinite(change24h))state.xrpChange24h=change24h;
  if(Number.isFinite(previousPrice)&&previousPrice!==p)state.lastPriceTickPct=(p-previousPrice)/previousPrice*100;
  const livePrice='$'+p.toFixed(5);
  const liveChange=Number.isFinite(state.xrpChange24h)?(state.xrpChange24h>=0?'+':'')+state.xrpChange24h.toFixed(2)+'% · 24h':'STREAMING';
  setText('#xrpPrice',livePrice);setText('#xrpChange',liveChange);
  marketLastTickAt=Date.now();
  const bid=finiteNumber(ticker.best_bid),ask=finiteNumber(ticker.best_ask),vol=finiteNumber(ticker.volume_24_h),hi=finiteNumber(ticker.high_24_h),lo=finiteNumber(ticker.low_24_h);
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
    const interval=state.selectedExchange==='all'?6500:5500;
    marketPollTimer=setInterval(()=>{
      if(document.hidden||document.body.classList.contains('launch-locked'))return;
      loadMarket(false);
    },interval);
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
    state.xrpPrice=finiteNumber(d.price);state.xrpChange24h=finiteNumber(d.change24h);state.lastMarketPrice=state.xrpPrice;
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
function formatExchangePrice(v){const n=finiteNumber(v);return Number.isFinite(n)?'$'+n.toFixed(5):'—';}
function formatExchangeMove(v){const n=finiteNumber(v);return Number.isFinite(n)?(n>=0?'+':'')+n.toFixed(2)+'%':'';}
function renderExchangeBoard(data={}){
  const composite=data.composite||{},venues=Array.isArray(data.venues)?data.venues:[];
  [{...composite,id:'all'},...venues].forEach(row=>{
    qa('[data-exchange-price="'+row.id+'"]').forEach(el=>{
      el.textContent=formatExchangePrice(row.price);
      el.dataset.available=Number.isFinite(finiteNumber(row.price))?'true':'false';
      const move=formatExchangeMove(row.change24h);
      if(move)el.setAttribute('data-move',move);else el.removeAttribute('data-move');
    });
  });
  const cp=finiteNumber(composite.price),cc=finiteNumber(composite.change24h);
  setText('#globalXrpPrice',Number.isFinite(cp)?'$'+cp.toFixed(5):'—');
  setText('#globalXrpChange',Number.isFinite(cc)?(cc>=0?'+':'')+cc.toFixed(2)+'% · '+(Number(composite.venueCount)||venues.filter(v=>v.available).length)+' venues':'LIVE COMPOSITE');
}
async function loadExchangeBoard(){try{const r=await fetch('/api/exchange-board',{cache:'no-store'}),d=await r.json();if(!r.ok)throw new Error();renderExchangeBoard(d)}catch{setText('#globalXrpChange','COMPOSITE FEED OFFLINE')}}
function bindExchangeMenu(){
  qa('[data-exchange]').forEach(button=>button.addEventListener('click',async()=>{
    setPrimaryView('exchanges');
    await setExchange(button.dataset.exchange);
  }));
  renderExchangeSelection();
  clearInterval(exchangeBoardTimer);
  loadExchangeBoard();
  exchangeBoardTimer=setInterval(()=>{
    if(document.hidden||document.body.classList.contains('launch-locked'))return;
    loadExchangeBoard();
  },12000);
}
function renderMarketChart(points=[]){
  const svg=q('#xrpMarketChart'),line=q('#marketLine'),area=q('#marketArea'),grid=q('#marketGrid');
  if(!svg||!line||!area||!grid||!points.length)return;
  const pts=points.filter(p=>Number.isFinite(finiteNumber(p.close))&&Number.isFinite(finiteNumber(p.time)));
  if(pts.length<2)return;
  const closes=pts.map(p=>finiteNumber(p.close));
  const highs=pts.map(p=>finiteNumber(p.high)).filter(Number.isFinite);
  const lows=pts.map(p=>finiteNumber(p.low)).filter(Number.isFinite);
  const min=Math.min(...lows,...closes),max=Math.max(...highs,...closes),span=Math.max(.000001,max-min);
  const W=1000,H=320,padX=18,padY=18,plotW=W-padX*2,plotH=H-padY*2;
  const coords=pts.map((p,i)=>[padX+(i/(pts.length-1))*plotW,padY+(1-(finiteNumber(p.close)-min)/span)*plotH]);
  const d=coords.map(([x,y],i)=>(i?'L':'M')+x.toFixed(2)+' '+y.toFixed(2)).join(' ');
  line.setAttribute('d',d);
  area.setAttribute('d',d+' L '+coords[coords.length-1][0].toFixed(2)+' '+(H-padY)+' L '+coords[0][0].toFixed(2)+' '+(H-padY)+' Z');
  grid.innerHTML='';
  [.25,.5,.75].forEach(n=>{const el=document.createElementNS('http://www.w3.org/2000/svg','line');el.setAttribute('x1',padX);el.setAttribute('x2',W-padX);el.setAttribute('y1',padY+n*plotH);el.setAttribute('y2',padY+n*plotH);grid.appendChild(el)});
  const first=closes[0],last=closes[closes.length-1],panel=q('.market-chart-panel');
  if(panel)panel.dataset.direction=last>=first?'up':'down';
  setText('#chartHigh','$'+Math.max(...highs,...closes).toFixed(4));
  setText('#chartLow','$'+Math.min(...lows,...closes).toFixed(4));
  const volume=pts.reduce((sum,p)=>{const v=finiteNumber(p.volume);return sum+(Number.isFinite(v)?v:0)},0);
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
async function integrationCheck(){
  const box=q('#integrationStatus');if(!box)return;
  box.innerHTML='<div class="integration-item"><span>System</span><strong>Checking live services…</strong></div>';
  try{
    const r=await fetch('/api/self-test',{cache:'no-store'});
    const self=await r.json();
    const core=self.core||{},integrations=self.integrations||{};
    const coreLabel=x=>x?.state==='live'?'LIVE':x?.state==='degraded'?'DEGRADED':x?.state==='down'?'DOWN':'CHECKING';
    const configuredLabel=x=>x?.configured?'CONFIGURED':'NOT CONFIGURED';
    const xConfigured=integrations.x?.readConfigured||integrations.x?.writeConfigured;
    const rows=[
      ['XRPL',coreLabel(core.xrpl)],
      ['XRP Market',coreLabel(core.market)],
      ['XRPL Meta',coreLabel(core.ecosystem)],
      ['Official Updates',coreLabel(core.updates)],
      ['Xaman',configuredLabel(integrations.xaman)],
      ['Web Push',configuredLabel(integrations.push)],
      ['Full SI',integrations.si?.configured?'CONFIGURED':'LOCAL FALLBACK'],
      ['X API',xConfigured?'CONFIGURED':'NOT CONFIGURED']
    ];
    box.innerHTML=rows.map(([name,status])=>{
      const good=/LIVE|CONFIGURED/.test(status),warn=/DEGRADED|CHECKING|LOCAL/.test(status);
      return '<div class="integration-item"><span>'+name+'</span><strong class="'+(good?'ok':warn?'warn':'bad')+'">'+status+'</strong></div>';
    }).join('');
  }catch{
    box.innerHTML='<div class="integration-item"><span>System</span><strong class="warn">Health check retrying</strong></div>';
  }
}
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
  if(action==='dance'&&window.XRPetMusicPlaying!==true){
    setText('#petMood','Starting music');
    setText('#petSpeech','Ripplet is going to the music player to press Play, then he will dance.');
    rippletPressMusicControl('play');
    return;
  }
  if(action==='dance'&&window.XRPetMusicPlaying===true){
    setRippletMusicDance(true);
    return;
  }
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

const launchGate=q('#launchGate'),launchBar=q('#launchProgressBar');
const launchBackgroundVideo=q('#launchBackgroundVideo');
if(launchBackgroundVideo){
  launchBackgroundVideo.muted=true;
  launchBackgroundVideo.loop=true;
  launchBackgroundVideo.playsInline=true;
  launchBackgroundVideo.play?.().catch(()=>{});
}

function setSimpleLaunchProgress(value,text){
  const controller=window.XRPetLaunch;
  if(controller?.setProgress){
    controller.setProgress(value,text);
    return;
  }
  const progress=Math.max(0,Math.min(100,Number(value)||0));
  if(launchBar)launchBar.style.width=progress+'%';
  if(text)setText('#launchStatus',text);
}

if(!launchGate){
  document.body.classList.remove('launch-locked');
}else{
  window.addEventListener('xrpet:launch-complete',()=>{
    setTimeout(()=>setRoomAmbience(state.room),120);
  },{once:true});
}

const floatEl=q('#floatingCompanion'),roamLayer=q('#rippletRoamLayer'),lifeAvatar=q('#lifeAvatar');
let roamPinned=false,roamDocked=false,roamX=.72,roamY=.72,roamTimer=0;
let rippletPointer={x:0,y:0,active:false,movedAt:0};
let rippletPointerTimer=0;
let rippletLastPointerTarget=null;
let rippletRouteToken=0;
let rippletRouteUntil=0;
let rippletMusicDancing=false;
let rippletMusicDanceTimer=0;
let rippletDanceVariantIndex=0;
const RIPPLET_DANCE_SEQUENCE=['dance','dance2','dance3','dance4','cheer','dance2','happy','dance3'];
let rippletMusicStageState='idle';
let rippletMusicStageToken=0;
let rippletMusicControlToken=0;
let rippletMusicControlBusy=false;
let rippletRouteAllowsShell=false;
let heldCryptoCoin=null;
let pendingCryptoCoin=null;
let cryptoCoinMissionTimer=0;
let cryptoCoinDeposits=0;

const RIPPLET_CRYPTO_COINS=[]; // Removed in 5.5.54: Ripplet no longer spawns collectible crypto tokens.

function activePageElement(){
  return q('.primary-view-section.view-active:not([hidden])')||q('.primary-view-section.view-active');
}
function shellMovementBounds(){
  const shell=q('.main-shell');
  if(!shell)return {left:4,top:4,right:4,bottom:4};
  return {left:4,top:4,right:Math.max(8,shell.scrollWidth-4),bottom:Math.max(8,shell.scrollHeight-4)};
}
function activePageBounds(pad=8){
  const shell=q('.main-shell'),view=activePageElement();
  if(!shell||!view)return shellMovementBounds();
  const sr=shell.getBoundingClientRect(),vr=view.getBoundingClientRect();
  const left=Math.max(4,vr.left-sr.left+shell.scrollLeft+pad);
  const top=Math.max(4,vr.top-sr.top+shell.scrollTop+pad);
  const right=Math.min(shell.scrollWidth-4,vr.right-sr.left+shell.scrollLeft-pad);
  const bottom=Math.min(shell.scrollHeight-4,vr.bottom-sr.top+shell.scrollTop-pad);
  if(right-left<70||bottom-top<90)return shellMovementBounds();
  return {left,top,right,bottom};
}
function topRailBounds(includeDock=false){
  const deck=q('#topCommandDeck'),dock=q('#rippletDock'),avatar=lifeAvatar?.getBoundingClientRect();
  if(!deck)return {left:4,top:4,right:Math.max(8,window.innerWidth-4),bottom:Math.max(8,window.innerHeight-4)};
  const dr=deck.getBoundingClientRect(),rr=dock?.getBoundingClientRect();
  const aw=Math.max(52,avatar?.width||52),ah=Math.max(72,avatar?.height||72);
  const left=Math.max(2,dr.left+6);
  const right=Math.max(left+aw,includeDock?dr.right-6:(rr?rr.left-6:dr.right-6));
  // The bottom edge of the sidebar command center is Ripplet's physical walking floor.
  const ground=dr.bottom-5;
  const top=Math.max(0,ground-ah);
  return {left,top,right,bottom:top+ah};
}
function rippletMovementBounds(includeDock=false){
  return topRailBounds(includeDock);
}
function rippletPositionInsideActivePage(x,y){
  const avatar=lifeAvatar?.getBoundingClientRect(),b=topRailBounds(false);
  const aw=Math.max(52,avatar?.width||52),ah=Math.max(72,avatar?.height||72);
  return x>=b.left&&y>=b.top&&x+aw<=b.right&&y+ah<=b.bottom;
}

function syncRoamBounds(){
  if(!roamLayer)return;
  roamLayer.style.left='0px';
  roamLayer.style.top='0px';
  roamLayer.style.width=window.innerWidth+'px';
  roamLayer.style.height=window.innerHeight+'px';
}
function setRoamPosition(x,y,activity='walk',durationOverride=''){
  if(!lifeAvatar||!roamLayer)return;
  const avatar=lifeAvatar.getBoundingClientRect();
  const includeDock=rippletRouteAllowsShell||rippletMusicStageState!=='idle'||activity==='dock';
  const b=rippletMovementBounds(includeDock);
  const minX=b.left;
  const maxX=Math.max(minX,b.right-avatar.width);
  const px=Math.max(minX,Math.min(maxX,x));
  const py=activity==='dock'&&Number.isFinite(Number(y))?Number(y):b.top;
  const duration=durationOverride||'.9s';
  lifeAvatar.style.setProperty('transition-property','transform','important');
  lifeAvatar.style.setProperty('transition-duration',duration,'important');
  lifeAvatar.style.setProperty('transition-timing-function','linear','important');
  lifeAvatar.style.transform='translate3d('+px+'px,'+py+'px,0)';
  lifeAvatar.dataset.activity=activity;
  roamX=maxX>minX?(px-minX)/(maxX-minX):.5;
  roamY=0;
}
function walkRippletTo(x,activity='walk',durationOverride=''){
  if(!lifeAvatar)return false;
  if(rippletRouteBusy()&&activity!=='dock')return false;
  const ar=lifeAvatar.getBoundingClientRect();
  const currentX=ar.left;
  const distance=Math.abs(x-currentX);
  const duration=durationOverride||Math.max(.28,Math.min(2.4,distance/145)).toFixed(2)+'s';
  window.XRPet2D?.face?.(x<currentX?'left':'right');
  window.XRPet2D?.motor?.('walk');
  setRoamPosition(x,0,activity,duration);
  rippletRouteUntil=performance.now()+parseFloat(duration)*1000;
  setTimeout(()=>{
    if(!rippletMusicDancing&&!rippletMusicControlBusy&&!roamDocked)window.XRPet2D?.motor?.('stand');
  },parseFloat(duration)*1000+40);
  return true;
}
function cancelRippletRoute(){
  if(!lifeAvatar)return;
  const ar=lifeAvatar.getBoundingClientRect();
  ++rippletRouteToken;
  rippletRouteUntil=0;
  rippletRouteAllowsShell=false;
  const x=ar.left,y=ar.top;
  lifeAvatar.style.setProperty('transition-duration','0s','important');
  lifeAvatar.style.transform='translate3d('+x+'px,'+y+'px,0)';
  void lifeAvatar.offsetWidth;
  roamX=window.innerWidth?x/Math.max(1,window.innerWidth-ar.width):.5;
  roamY=0;
}
function rippletRouteBusy(){return performance.now()<rippletRouteUntil}

function stationPosition(activity){
  const station=q('[data-life-action="'+activity+'"]'),layer=roamLayer?.getBoundingClientRect();
  if(!station||!layer)return null;
  const r=station.getBoundingClientRect();
  return {x:r.left-layer.left+r.width/2-85,y:r.bottom-layer.top+4};
}
function dockPosition(){
  const dock=q('#rippletDock'),berth=q('#rippletDock .ripplet-dock-platform'),avatar=lifeAvatar?.getBoundingClientRect();
  if(!dock||!berth)return null;
  const r=berth.getBoundingClientRect();
  const w=Math.max(52,avatar?.width||52),h=Math.max(72,avatar?.height||72);
  const b=topRailBounds(true);
  const desiredX=r.left+(r.width-w)/2;
  const desiredY=r.bottom-h-1;
  return {
    x:Math.max(b.left,Math.min(b.right-w,desiredX)),
    y:desiredY
  };
}
function setDockStatus(text){
  setText('#rippletDockStatus',text);
  const docked=text==='DOCKED';
  q('#rippletDock')?.classList.toggle('is-docked',docked);
  document.body.classList.toggle('ripplet-docked',docked);
}
function dockRipplet(){
  roamDocked=true;
  clearTimeout(roamTimer);
  cancelRippletRoute();
  syncRoamBounds();
  const target=dockPosition();
  if(target){
    const ar=lifeAvatar?.getBoundingClientRect();
    const currentX=ar?ar.left:target.x;
    const distance=Math.abs(target.x-currentX);
    const walkMs=Math.max(320,Math.min(2200,Math.round(distance/145*1000)));
    setDockStatus('DOCKING');
    window.XRPet2D?.face?.(target.x<currentX?'left':'right');
    window.XRPet2D?.motor?.('walk');
    setRoamPosition(target.x,target.y,'dock',walkMs+'ms');
    rippletRouteUntil=performance.now()+walkMs;
    setTimeout(()=>{
      if(!roamDocked||rippletMusicDancing)return;
      setDockStatus('DOCKED');
      if(lifeAvatar)lifeAvatar.dataset.activity='stand';
      window.XRPet2D?.motor?.('stand');
      window.XRPet3D?.perform?.('salute');
    },walkMs+40);
  }
}
function undockRipplet(){
  roamDocked=false;
  setDockStatus('ROAMING');
  window.XRPet3D?.perform?.('wave');
  setTimeout(()=>{if(!roamDocked&&!rippletMusicDancing)goRipplet('explore')},260);
  roamingStep();
}
function goRipplet(activity='explore'){
  syncRoamBounds();
  if(rippletMusicDancing||!lifeAvatar)return false;
  if(rippletRouteBusy()&&activity!=='dock')return false;
  if(activity==='dock'){dockRipplet();return true}
  const ar=lifeAvatar.getBoundingClientRect();
  const b=topRailBounds(false);
  const aw=Math.max(52,ar.width||52);
  const minX=b.left,maxX=Math.max(minX,b.right-aw);
  const currentX=ar.left;
  let targetX=minX+Math.random()*Math.max(1,maxX-minX);
  if(Math.abs(targetX-currentX)<70){
    targetX=currentX<(minX+maxX)/2?Math.min(maxX,currentX+110):Math.max(minX,currentX-110);
  }
  const targetY=b.top+Math.random()*4;
  const distance=Math.abs(targetX-currentX);
  const duration=Math.max(.32,Math.min(2.4,distance/145)).toFixed(2)+'s';
  window.XRPet2D?.face?.(targetX<currentX?'left':'right');
  window.XRPet2D?.motor?.('walk');
  setRoamPosition(targetX,targetY,'walk',duration);
  rippletRouteUntil=performance.now()+parseFloat(duration)*1000;
  setTimeout(()=>{
    if(!rippletMusicDancing&&!roamDocked&&!rippletRouteBusy())window.XRPet2D?.motor?.('stand');
  },parseFloat(duration)*1000+40);
  return true;
}
let lastInterfacePlayAt=0;
let rippletTerrainCache={at:0,view:'',scrollTop:-1,width:0,height:0,text:[],lines:[],targets:[]};
function invalidateRippletTerrain(){
  rippletTerrainCache.at=0;
}
function getRippletTerrainSnapshot(force=false){
  const shell=q('.main-shell');
  const now=performance.now();
  const view=activeViewName();
  const scrollTop=shell?.scrollTop||0;
  const width=shell?.clientWidth||0;
  const height=shell?.clientHeight||0;
  const valid=!force&&rippletTerrainCache.at>0&&now-rippletTerrainCache.at<900&&
    rippletTerrainCache.view===view&&Math.abs(rippletTerrainCache.scrollTop-scrollTop)<2&&
    rippletTerrainCache.width===width&&rippletTerrainCache.height===height;
  if(valid)return rippletTerrainCache;
  rippletTerrainCache={
    at:now,view,scrollTop,width,height,
    text:visibleTextTerrain(),
    lines:visibleLineTerrain(),
    targets:visibleInterfaceTargets()
  };
  return rippletTerrainCache;
}

function visibleTextTerrain(){
  const shellEl=q('.main-shell'),shell=shellEl?.getBoundingClientRect();
  if(!shellEl||!shell)return[];
  const walker=document.createTreeWalker(shellEl,NodeFilter.SHOW_TEXT,{
    acceptNode(node){
      const parent=node.parentElement;
      const text=(node.nodeValue||'').trim();
      if(!parent||text.length<1)return NodeFilter.FILTER_REJECT;
      if(parent.closest('#rippletRoamLayer,#lifeAvatar,#rippletDock,script,style,textarea,input,select,option,[hidden]'))return NodeFilter.FILTER_REJECT;
      const cs=getComputedStyle(parent);
      if(cs.display==='none'||cs.visibility==='hidden'||Number(cs.opacity)===0)return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const terrain=[],seen=new Set();
  const addRect=(rect,kind,label='')=>{
    if(!rect||rect.width<1.5||rect.height<3)return;
    if(rect.bottom<shell.top+4||rect.top>shell.bottom-4||rect.right<shell.left+4||rect.left>shell.right-4)return;
    const key=[kind,Math.round(rect.left),Math.round(rect.top),Math.round(rect.width),Math.round(rect.height)].join(':');
    if(seen.has(key))return;
    seen.add(key);
    terrain.push({
      __terrain:kind,
      __rect:rect,
      tagName:kind==='sentence'?'TEXTLINE':'TEXTWORD',
      label
    });
  };
  while(walker.nextNode()&&terrain.length<240){
    const node=walker.currentNode,text=node.nodeValue||'';
    try{
      const lineRange=document.createRange();
      lineRange.selectNodeContents(node);
      for(const rect of [...lineRange.getClientRects()]){
        if(terrain.length>=240)break;
        addRect(rect,'sentence',text.trim().slice(0,80));
      }
    }catch{}
    const re=/\S+/g;let m;
    while((m=re.exec(text))&&terrain.length<240){
      try{
        const range=document.createRange();
        range.setStart(node,m.index);
        range.setEnd(node,m.index+m[0].length);
        addRect(range.getBoundingClientRect(),'word',m[0]);
      }catch{}
    }
  }
  return terrain;
}
function visibleLineTerrain(){
  const shellEl=q('.main-shell'),shell=shellEl?.getBoundingClientRect();
  if(!shellEl||!shell)return[];
  const terrain=[],seen=new Set();
  const add=(el,r)=>{
    if(!r||r.width<1||r.height<1)return;
    if(r.bottom<shell.top+2||r.top>shell.bottom-2||r.right<shell.left+2||r.left>shell.right-2)return;
    const horizontal=r.width>=18&&r.height<=8;
    const vertical=r.height>=18&&r.width<=8;
    if(!horizontal&&!vertical)return;
    const rect={
      left:r.left,top:r.top,right:r.right,bottom:r.bottom,
      width:Math.max(2,r.width),height:Math.max(2,r.height)
    };
    if(horizontal&&r.height<2){rect.bottom=rect.top+2;rect.height=2}
    if(vertical&&r.width<2){rect.right=rect.left+2;rect.width=2}
    const key=[Math.round(rect.left),Math.round(rect.top),Math.round(rect.width),Math.round(rect.height)].join(':');
    if(seen.has(key))return;
    seen.add(key);
    terrain.push({__terrain:'line',__rect:rect,tagName:'UILINE',label:el?.getAttribute?.('aria-label')||'interface line'});
  };
  const explicit=[...shellEl.querySelectorAll('hr,[role="separator"],.divider,.separator,.rule,.line,.panel-line,.section-line')];
  explicit.forEach(el=>{
    const cs=getComputedStyle(el),r=el.getBoundingClientRect();
    if(cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity)!==0)add(el,r);
  });
  for(const el of shellEl.querySelectorAll('.primary-view-section.view-active *,.sidebar *,#topCommandDeck *')){
    if(terrain.length>=120)break;
    if(el.closest('#rippletRoamLayer,#lifeAvatar,#rippletDock'))continue;
    const cs=getComputedStyle(el),r=el.getBoundingClientRect();
    if(cs.display==='none'||cs.visibility==='hidden'||Number(cs.opacity)===0)continue;
    if((r.height<=5&&r.width>=18)||(r.width<=5&&r.height>=18))add(el,r);
  }
  return terrain;
}
function visibleInterfaceTargets(){
  const layer=roamLayer?.getBoundingClientRect(),shellEl=q('.main-shell'),shell=shellEl?.getBoundingClientRect();
  if(!layer||!shellEl||!shell)return[];
  const selectors=[
    '.primary-view-section.view-active button',
    '.primary-view-section.view-active input',
    '.primary-view-section.view-active textarea',
    '.primary-view-section.view-active select',
    '.primary-view-section.view-active .detail-card',
    '.primary-view-section.view-active .contact-card',
    '.primary-view-section.view-active .ecosystem-token-card',
    '.primary-view-section.view-active article',
    '.primary-view-section.view-active .game-panel.active',
    '.primary-view-section.view-active .card',
    '.primary-view-section.view-active .panel',
    '.primary-view-section.view-active .message-box',
    '.primary-view-section.view-active .notice',
    '.primary-view-section.view-active .alert',
    'dialog',
    '[role="dialog"]',
    '.modal',
    '.dialog',
    '.popover',
    '.sidebar button',
    '.sidebar a'
  ];
  const candidates=[...new Set([...shellEl.querySelectorAll(selectors.join(','))])];
  for(const el of shellEl.querySelectorAll('.primary-view-section.view-active *')){
    if(candidates.length>=180)break;
    if(el.closest('#rippletRoamLayer,#lifeAvatar,#rippletDock,#topCommandDeck'))continue;
    const r=el.getBoundingClientRect(),style=getComputedStyle(el);
    if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0||r.width<18||r.height<10)continue;
    const border=
      parseFloat(style.borderTopWidth||0)+parseFloat(style.borderRightWidth||0)+
      parseFloat(style.borderBottomWidth||0)+parseFloat(style.borderLeftWidth||0);
    const tag=el.tagName;
    const semanticBox=['BUTTON','INPUT','TEXTAREA','SELECT','FIELDSET','DIALOG'].includes(tag)||el.getAttribute('role')==='dialog';
    const namedBox=/(^|[-_])(card|panel|dialog|modal|box|tile|button|input|notice|alert)([-_]|$)/i.test(String(el.className||''));
    if((border>=1.5||semanticBox||namedBox)&&r.width<shell.width*.97&&r.height<shell.height*.94)candidates.push(el);
  }
  return [...new Set(candidates)].filter(el=>{
    if(el.closest('#rippletRoamLayer,#lifeAvatar,#rippletDock,#topCommandDeck'))return false;
    const r=el.getBoundingClientRect(),style=getComputedStyle(el);
    return style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)!==0&&r.width>18&&r.height>10&&
      r.bottom>shell.top+4&&r.top<shell.bottom-4&&r.right>shell.left+4&&r.left<shell.right-4;
  }).slice(0,180);
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
  const terrain=getRippletTerrainSnapshot();
  const pool=[...terrain.text,...terrain.lines,...terrain.targets];
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
  const terrainKind=target?.__terrain||'box';
  const textual=terrainKind==='word'||terrainKind==='sentence'||terrainKind==='letter';
  const line=terrainKind==='line';

  // Boxes are solid. Ripplet may only get on top by jumping when the top is within its jump limit.
  if(terrainKind==='box'){
    const hop=interfaceTargetPosition(target,'hop');
    if(hop&&canJumpOntoTarget(target,hop))return {mode:'hop',action:'jump'};
    return {mode:'side',action:'stand'};
  }

  // Words, letters, sentence lines, and separator lines behave like climbable platform terrain.
  if(side&&(textual||line))return {mode:'hang',action:'hang'};
  if(my<rect.top-10&&(textual||line))return {mode:'climb',action:'climb'};
  if(nearTop||line)return {mode:'perch',action:Math.random()<.18?'sit':'stand'};
  if(nearBottom){
    const hop=interfaceTargetPosition(target,'hop');
    if(hop&&canJumpOntoTarget(target,hop))return {mode:'hop',action:'jump'};
    return {mode:'climb',action:'climb'};
  }
  if(textual&&Math.random()<.30)return {mode:'hang',action:'hang'};
  return {mode:'perch',action:'stand'};
}
function followRippletPointer(force=false){
  if(roamDocked||rippletMusicDancing||heldCryptoCoin||pendingCryptoCoin||!lifeAvatar||!roamLayer)return false;
  if(rippletRouteBusy())return true;
  if(!rippletPointer.active&&!force)return false;
  const pb=activePageBounds(4);
  if(rippletPointer.x<pb.left||rippletPointer.x>pb.right||rippletPointer.y<pb.top||rippletPointer.y>pb.bottom)return false;
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

  const routeAction=choice.action==='sit'?'sit':choice.action==='hang'?'hang':choice.action==='climb'?'climb':choice.action==='jump'?'jump':'stand';
  if(!routeRippletTo(p.x,p.y,routeAction,hit.target)){
    markInterfaceTarget(hit.target,false);
    return false;
  }
  setText('#mindAction',
    choice.action==='hang'?'Following cursor · hanging':
    choice.action==='climb'?'Following cursor · climbing':
    choice.action==='jump'?'Following cursor · short hop':
    choice.action==='sit'?'Following cursor · sitting':
    'Following cursor · perched'
  );
  setText('#mindThought','I am following your mouse through the page terrain.');

  clearTimeout(rippletPointerTimer);
  rippletPointerTimer=setTimeout(()=>{
    if(rippletLastPointerTarget===hit.target)markInterfaceTarget(hit.target,false);
  },650);
  return true;
}
function updateRippletPointer(e){
  if(document.hidden||document.body.classList.contains('launch-locked'))return;
  const shell=q('.main-shell');if(!shell)return;
  const r=shell.getBoundingClientRect();
  rippletPointer.x=e.clientX-r.left+shell.scrollLeft;
  rippletPointer.y=e.clientY-r.top+shell.scrollTop;
  rippletPointer.active=true;
  rippletPointer.movedAt=Date.now();
  clearTimeout(rippletPointerTimer);
  rippletPointerTimer=setTimeout(()=>followRippletPointer(),240);
}
function rectsOverlap(a,b,pad=0){
  return !(a.right<=b.left+pad||a.left>=b.right-pad||a.bottom<=b.top+pad||a.top>=b.bottom-pad);
}
function avatarRectAt(x,y){
  const avatar=lifeAvatar?.getBoundingClientRect();
  const w=Math.max(52,avatar?.width||52),h=Math.max(72,avatar?.height||72);
  return {left:x,top:y,right:x+w,bottom:y+h,width:w,height:h};
}
function visibleCollisionRects(ignoreTarget=null){
  const shell=q('.main-shell'),sr=shell?.getBoundingClientRect();
  if(!shell||!sr)return[];
  const rects=[],seen=new Set();
  const terrain=getRippletTerrainSnapshot();
  const targets=[...terrain.text,...terrain.lines,...terrain.targets];
  for(const target of targets){
    if(target===ignoreTarget)continue;
    const r=target?.__rect||target?.getBoundingClientRect?.();
    if(!r)continue;
    const local={
      left:r.left-sr.left+shell.scrollLeft,
      right:r.right-sr.left+shell.scrollLeft,
      top:r.top-sr.top+shell.scrollTop,
      bottom:r.bottom-sr.top+shell.scrollTop,
      kind:target?.__terrain||'box',
      target
    };
    const key=[local.kind,Math.round(local.left),Math.round(local.top),Math.round(local.right),Math.round(local.bottom)].join(':');
    if(seen.has(key))continue;
    seen.add(key);rects.push(local);
  }
  const boxes=rects.filter(r=>r.kind==='box');
  return rects.filter(r=>{
    if(r.kind==='box')return true;
    return !boxes.some(b=>
      r.left>=b.left+1&&r.right<=b.right-1&&
      r.top>=b.top+1&&r.bottom<=b.bottom-1
    );
  });
}
function positionInsideMovementBounds(x,y,allowShell=false){
  const avatar=lifeAvatar?.getBoundingClientRect(),b=rippletMovementBounds(allowShell);
  const aw=Math.max(52,avatar?.width||52),ah=Math.max(72,avatar?.height||72);
  return x>=b.left&&y>=b.top&&x+aw<=b.right&&y+ah<=b.bottom;
}
function surfacePositionIsClear(x,y,ignoreTarget=null,allowShell=false){
  if(!positionInsideMovementBounds(x,y,allowShell))return false;
  const a=avatarRectAt(x,y);
  return !visibleCollisionRects(ignoreTarget).some(r=>rectsOverlap(a,r,1));
}
function pathIsClear(a,b,ignoreTarget=null,allowShell=false){
  const distance=Math.hypot(b.x-a.x,b.y-a.y);
  const steps=Math.max(1,Math.ceil(distance/12));
  for(let i=1;i<=steps;i++){
    const t=i/steps;
    const x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
    const allowTarget=i===steps?ignoreTarget:null;
    if(!surfacePositionIsClear(x,y,allowTarget,allowShell))return false;
  }
  return true;
}
function findNearestClearPosition(x,y,ignoreTarget=null,allowShell=false){
  const avatar=lifeAvatar?.getBoundingClientRect(),b=rippletMovementBounds(allowShell);
  const aw=Math.max(52,avatar?.width||52),ah=Math.max(72,avatar?.height||72);
  const minX=b.left,minY=b.top,maxX=Math.max(minX,b.right-aw),maxY=Math.max(minY,b.bottom-ah);
  const clampPoint=(px,py)=>({x:Math.max(minX,Math.min(maxX,px)),y:Math.max(minY,Math.min(maxY,py))});
  let p=clampPoint(x,y);
  if(surfacePositionIsClear(p.x,p.y,ignoreTarget,allowShell))return p;
  const dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
  for(let radius=14;radius<=260;radius+=14){
    for(const [dx,dy] of dirs){
      p=clampPoint(x+dx*radius,y+dy*radius);
      if(surfacePositionIsClear(p.x,p.y,ignoreTarget,allowShell))return p;
    }
  }
  return null;
}
function findClearRoute(start,end,ignoreTarget=null,allowShell=false){
  const avatar=lifeAvatar?.getBoundingClientRect(),b=rippletMovementBounds(allowShell);
  const aw=Math.max(52,avatar?.width||52),ah=Math.max(72,avatar?.height||72);
  const minX=b.left,minY=b.top,maxX=Math.max(minX,b.right-aw),maxY=Math.max(minY,b.bottom-ah);
  const clampPoint=p=>({x:Math.max(minX,Math.min(maxX,p.x)),y:Math.max(minY,Math.min(maxY,p.y))});
  const candidates=[];

  if(Math.abs(end.x-start.x)<=8||Math.abs(end.y-start.y)<=8)candidates.push([end]);
  candidates.push(
    [{x:start.x,y:end.y},end],
    [{x:end.x,y:start.y},end],
    [{x:minX,y:start.y},{x:minX,y:end.y},end],
    [{x:maxX,y:start.y},{x:maxX,y:end.y},end],
    [{x:start.x,y:minY},{x:end.x,y:minY},end],
    [{x:start.x,y:maxY},{x:end.x,y:maxY},end]
  );

  const blockers=visibleCollisionRects().sort((a,bx)=>{
    const ac=Math.hypot((a.left+a.right)*.5-start.x,(a.top+a.bottom)*.5-start.y);
    const bc=Math.hypot((bx.left+bx.right)*.5-start.x,(bx.top+bx.bottom)*.5-start.y);
    return ac-bc;
  }).slice(0,40);

  for(const r of blockers){
    const top=Math.max(minY,r.top-ah-6),bottom=Math.min(maxY,r.bottom+6);
    const left=Math.max(minX,r.left-aw-6),right=Math.min(maxX,r.right+6);
    candidates.push(
      [{x:start.x,y:top},{x:end.x,y:top},end],
      [{x:start.x,y:bottom},{x:end.x,y:bottom},end],
      [{x:left,y:start.y},{x:left,y:end.y},end],
      [{x:right,y:start.y},{x:right,y:end.y},end],
      [{x:left,y:start.y},{x:left,y:top},{x:end.x,y:top},end],
      [{x:right,y:start.y},{x:right,y:bottom},{x:end.x,y:bottom},end]
    );
  }

  let best=null,bestDistance=Infinity;
  for(const raw of candidates){
    const route=[];
    for(const p of raw.map(clampPoint)){
      const prev=route[route.length-1]||start;
      if(Math.hypot(p.x-prev.x,p.y-prev.y)<2)continue;
      route.push(p);
    }
    if(!route.length)continue;
    let from=start,total=0,ok=true;
    for(let i=0;i<route.length;i++){
      const to=route[i],final=i===route.length-1;
      if(!pathIsClear(from,to,final?ignoreTarget:null,allowShell)){ok=false;break}
      total+=Math.hypot(to.x-from.x,to.y-from.y);
      from=to;
    }
    if(ok&&total<bestDistance){best=route;bestDistance=total}
  }
  return best;
}
function rippletMaxJumpHeight(){
  const avatar=lifeAvatar?.getBoundingClientRect();
  return Math.round(Math.max(22,Math.min(38,(avatar?.height||72)*.34)));
}
function rippletMaxJumpDistance(){
  const avatar=lifeAvatar?.getBoundingClientRect();
  return Math.round(Math.max(28,Math.min(48,(avatar?.width||52)*.82)));
}
function targetTerrainKind(target){
  return target?.__terrain||'box';
}
function canJumpOntoTarget(target,position=null){
  const shell=q('.main-shell'),sr=shell?.getBoundingClientRect(),ar=lifeAvatar?.getBoundingClientRect();
  if(!shell||!sr||!ar)return false;
  const p=position||interfaceTargetPosition(target,'hop');
  if(!p)return false;
  const currentX=ar.left-sr.left+shell.scrollLeft;
  const currentY=ar.top-sr.top+shell.scrollTop;
  const rise=currentY-p.y;
  const horizontal=Math.abs(currentX-p.x);
  return rise>=-6&&rise<=rippletMaxJumpHeight()&&horizontal<=rippletMaxJumpDistance();
}
function routeSegmentActivity(from,to,requested='walk',final=false){
  const dx=Math.abs(to.x-from.x),dy=Math.abs(to.y-from.y);
  if(final&&requested==='jump'&&dy<=rippletMaxJumpHeight()&&dx<=rippletMaxJumpDistance())return 'jump';
  if(dy>8)return 'climb';
  if(dx>82)return 'run';
  return 'walk';
}
function routeSegmentDuration(from,to,activity){
  const distance=Math.max(1,Math.hypot(to.x-from.x,to.y-from.y));
  const speed=activity==='run'?245:activity==='climb'?78:activity==='jump'?115:135;
  return Math.max(260,Math.min(activity==='climb'?900:720,(distance/speed)*1000));
}
function expandPhysicalRoute(start,route){
  const expanded=[];
  let from=start;
  for(const point of route){
    const dx=point.x-from.x,dy=point.y-from.y;
    const vertical=Math.abs(dy)>8;
    const maxStep=vertical?34:76;
    const count=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/maxStep));
    for(let i=1;i<=count;i++){
      expanded.push({x:from.x+dx*(i/count),y:from.y+dy*(i/count)});
    }
    from=point;
  }
  return expanded;
}
function currentTerrainCollision(current){
  const a=avatarRectAt(current.x,current.y);
  return visibleCollisionRects().find(r=>rectsOverlap(a,r,1))||null;
}
function recoverRippletFromCollision(current,goal,activity,ignoreTarget,allowShell=false){
  const avatar=lifeAvatar?.getBoundingClientRect(),blocker=currentTerrainCollision(current),b=rippletMovementBounds(allowShell);
  if(!avatar||!blocker)return false;
  const aw=Math.max(52,avatar.width||52),ah=Math.max(72,avatar.height||72);
  const minX=b.left,minY=b.top,maxX=Math.max(minX,b.right-aw),maxY=Math.max(minY,b.bottom-ah);
  const candidates=[
    {x:Math.max(minX,Math.min(maxX,current.x)),y:Math.max(minY,blocker.top-ah-3)},
    {x:Math.max(minX,blocker.left-aw-3),y:Math.max(minY,Math.min(maxY,current.y))},
    {x:Math.min(maxX,blocker.right+3),y:Math.max(minY,Math.min(maxY,current.y))},
    {x:Math.max(minX,Math.min(maxX,current.x)),y:Math.min(maxY,blocker.bottom+3)}
  ].filter(p=>surfacePositionIsClear(p.x,p.y,blocker.target,allowShell));
  if(!candidates.length)return false;
  candidates.sort((a,bx)=>Math.hypot(a.x-current.x,a.y-current.y)-Math.hypot(bx.x-current.x,bx.y-current.y));
  const escape=candidates[0],token=++rippletRouteToken;
  rippletRouteAllowsShell=allowShell;
  rippletRouteUntil=performance.now()+720;
  window.XRPet2D?.motor?.('climb');
  setRoamPosition(escape.x,escape.y,'climb');
  setTimeout(()=>{
    if(token!==rippletRouteToken)return;
    rippletRouteUntil=0;
    routeRippletTo(goal.x,goal.y,activity,ignoreTarget);
  },740);
  return true;
}
function routeRippletTo(x,y,activity='walk',ignoreTarget=null){
  if(!lifeAvatar||!roamLayer)return false;
  const shell=q('.main-shell'),sr=shell?.getBoundingClientRect(),ar=lifeAvatar.getBoundingClientRect();
  if(!shell||!sr)return false;
  const allowShell=['dock','coin-return','page-enter'].includes(activity);
  const current={
    x:ar.left-sr.left+shell.scrollLeft,
    y:ar.top-sr.top+shell.scrollTop
  };

  if(currentTerrainCollision(current)&&recoverRippletFromCollision(current,{x,y},activity,ignoreTarget,allowShell))return true;

  let end={x,y};
  if(!surfacePositionIsClear(end.x,end.y,ignoreTarget,allowShell)){
    const adjusted=findNearestClearPosition(end.x,end.y,ignoreTarget,allowShell);
    if(!adjusted){rippletRouteAllowsShell=false;return false}
    end=adjusted;
  }

  let route=null;
  if(activity==='jump'&&canJumpOntoTarget(ignoreTarget,end)&&pathIsClear(current,end,ignoreTarget,allowShell)){
    route=[end];
  }else{
    route=findClearRoute(current,end,ignoreTarget,allowShell);
  }
  if(!route){rippletRouteAllowsShell=false;return false}

  const physicalRoute=expandPhysicalRoute(current,route);
  if(!physicalRoute.length){rippletRouteAllowsShell=false;return false}

  const routeToken=++rippletRouteToken;
  rippletRouteAllowsShell=allowShell;
  let delay=0,from=current;
  physicalRoute.forEach((point,index)=>{
    const final=index===physicalRoute.length-1;
    const stepActivity=routeSegmentActivity(from,point,activity,final);
    const stepDelay=routeSegmentDuration(from,point,stepActivity);
    setTimeout(()=>{
      if(routeToken!==rippletRouteToken)return;
      if(roamDocked&&activity!=='dock')return;
      window.XRPet2D?.motor?.(stepActivity);
      setRoamPosition(point.x,point.y,stepActivity);
      if(final){
        const finish=activity==='sit'?'sit':activity==='hang'?'hang':
          ['stand','dock','coin-return','page-enter'].includes(activity)?'stand':null;
        if(finish)window.XRPet2D?.motor?.(finish);
        rippletRouteUntil=0;
        rippletRouteAllowsShell=false;
      }
    },delay);
    delay+=stepDelay;
    from=point;
  });
  rippletRouteUntil=performance.now()+delay+80;
  return true;
}
function interfaceTargetPosition(el,mode='perch'){
  const shell=q('.main-shell'),avatar=lifeAvatar?.getBoundingClientRect(),r=el?.__rect||el?.getBoundingClientRect?.();
  if(!shell||!r)return null;
  const sr=shell.getBoundingClientRect();
  const aw=Math.max(52,avatar?.width||52),ah=Math.max(72,avatar?.height||72);
  const localLeft=r.left-sr.left+shell.scrollLeft;
  const localTop=r.top-sr.top+shell.scrollTop;
  const localRight=r.right-sr.left+shell.scrollLeft;
  const localBottom=r.bottom-sr.top+shell.scrollTop;
  const terrainKind=el?.__terrain||'box';

  // Stand/perch on the upper surface of words, sentence lines, UI lines, and boxes.
  if(mode==='perch'){
    const desired=terrainKind==='line'&&rippletPointer.active
      ? rippletPointer.x-aw*.5
      : localLeft+r.width*.5-aw*.5;
    const x=Math.max(4,Math.min(shell.scrollWidth-aw-4,desired));
    const y=Math.max(4,localTop-ah-1);
    return {x,y};
  }

  // Jumps land on top, never inside the target.
  if(mode==='hop'){
    const desired=terrainKind==='line'&&rippletPointer.active
      ? rippletPointer.x-aw*.5
      : localLeft+r.width*.5-aw*.5;
    const x=Math.max(4,Math.min(shell.scrollWidth-aw-4,desired));
    const y=Math.max(4,localTop-ah-2);
    return {x,y};
  }

  // Climbing is for textual/line terrain and stays outside the edge.
  if(mode==='climb'){
    const useLeft=rippletPointer.x<(localLeft+r.width*.5);
    const x=useLeft?Math.max(4,localLeft-aw-2):Math.min(shell.scrollWidth-aw-4,localRight+2);
    const y=Math.max(4,Math.min(shell.scrollHeight-ah-4,localTop+r.height*.45-ah*.5));
    return {x,y};
  }

  // Hanging touches an outside edge without crossing through the surface.
  if(mode==='hang'){
    const useLeft=rippletPointer.x<(localLeft+r.width*.5);
    const x=useLeft?Math.max(4,localLeft-aw):Math.min(shell.scrollWidth-aw-4,localRight);
    const y=Math.max(4,Math.min(shell.scrollHeight-ah-4,localTop+Math.min(r.height*.35,8)));
    return {x,y};
  }

  // For boxes that are too tall to jump, stop beside them instead of clipping through them.
  if(mode==='side'){
    const center=localLeft+r.width*.5;
    const current=rippletPointer.active?rippletPointer.x:center;
    const useLeft=current<center;
    const x=useLeft?Math.max(4,localLeft-aw-3):Math.min(shell.scrollWidth-aw-4,localRight+3);
    const y=Math.max(4,Math.min(shell.scrollHeight-ah-4,localBottom-ah));
    return {x,y};
  }

  const x=Math.max(4,localLeft-aw-2);
  const y=Math.max(4,localTop-ah-1);
  return {x,y};
}
function markInterfaceTarget(el,on=true){
  qa('.ripplet-target-active').forEach(x=>x.classList.remove('ripplet-target-active'));
  if(on&&el)el.classList.add('ripplet-target-active');
}
function activeViewName(){
  return activePageElement()?.dataset?.viewSection||document.body.dataset.primaryView||'home';
}
function clearCryptoCoins(keepHeld=true){
  clearTimeout(cryptoCoinMissionTimer);
  qa('.ripplet-crypto-coin').forEach(coin=>{
    if(keepHeld&&coin===heldCryptoCoin)return;
    coin.remove();
  });
  if(pendingCryptoCoin&&pendingCryptoCoin!==heldCryptoCoin)pendingCryptoCoin=null;
}
function cryptoCoinSpotClear(x,y,size=12){
  const b=activePageBounds(12);
  const rect={left:x,top:y,right:x+size,bottom:y+size,width:size,height:size};
  if(rect.left<b.left||rect.top<b.top||rect.right>b.right||rect.bottom>b.bottom)return false;

  const padded={left:x-7,top:y-7,right:x+size+7,bottom:y+size+7};
  if(visibleCollisionRects().some(r=>rectsOverlap(padded,r,0)))return false;

  const shell=q('.main-shell'),sr=shell?.getBoundingClientRect(),avatar=lifeAvatar?.getBoundingClientRect();
  if(shell&&sr&&avatar){
    const ar={
      left:avatar.left-sr.left+shell.scrollLeft-12,
      top:avatar.top-sr.top+shell.scrollTop-12,
      right:avatar.right-sr.left+shell.scrollLeft+12,
      bottom:avatar.bottom-sr.top+shell.scrollTop+12
    };
    if(rectsOverlap(rect,ar,0))return false;
  }

  for(const coin of qa('.ripplet-crypto-coin:not(.is-carried)')){
    const cx=parseFloat(coin.style.left)||0,cy=parseFloat(coin.style.top)||0;
    const cr={left:cx-8,top:cy-8,right:cx+20,bottom:cy+20};
    if(rectsOverlap(rect,cr,0))return false;
  }
  return true;
}
function ensureCryptoCoins(){
  qa('.ripplet-crypto-coin,.dock-crypto-token').forEach(node=>node.remove());
  heldCryptoCoin=null;
  pendingCryptoCoin=null;
  clearTimeout(cryptoCoinMissionTimer);
  return false;
}
function nearestCryptoCoin(){
  const view=activeViewName(),shell=q('.main-shell'),sr=shell?.getBoundingClientRect(),ar=lifeAvatar?.getBoundingClientRect();
  const coins=qa('.ripplet-crypto-coin:not(.is-carried)').filter(coin=>coin.dataset.view===view&&coin.isConnected);
  if(!coins.length||!shell||!sr||!ar)return null;
  const ax=ar.left-sr.left+shell.scrollLeft+ar.width*.5;
  const ay=ar.top-sr.top+shell.scrollTop+ar.height*.5;
  return coins.map(coin=>{
    const r=coin.getBoundingClientRect();
    const x=r.left-sr.left+shell.scrollLeft+r.width*.5;
    const y=r.top-sr.top+shell.scrollTop+r.height*.5;
    return {coin,distance:Math.hypot(x-ax,y-ay)};
  }).sort((a,b)=>a.distance-b.distance);
}
function cryptoCoinPickupPosition(coin){
  const shell=q('.main-shell'),sr=shell?.getBoundingClientRect(),ar=lifeAvatar?.getBoundingClientRect(),r=coin?.getBoundingClientRect();
  if(!shell||!sr||!ar||!r)return null;
  const aw=Math.max(52,ar.width||52),ah=Math.max(72,ar.height||72);
  const left=r.left-sr.left+shell.scrollLeft,top=r.top-sr.top+shell.scrollTop;
  const right=r.right-sr.left+shell.scrollLeft,bottom=r.bottom-sr.top+shell.scrollTop;
  const candidates=[
    {x:left-aw-3,y:bottom-ah},
    {x:right+3,y:bottom-ah},
    {x:left+r.width*.5-aw*.5,y:top-ah-3},
    {x:left+r.width*.5-aw*.5,y:bottom+3}
  ];
  for(const p of candidates){
    if(surfacePositionIsClear(p.x,p.y,null,false))return p;
  }
  for(const p of candidates){
    const adjusted=findNearestClearPosition(p.x,p.y,null,false);
    if(adjusted&&Math.hypot(adjusted.x-p.x,adjusted.y-p.y)<=90)return adjusted;
  }
  return null;
}
function recordDockCryptoCoin(symbol){
  const platform=q('#rippletDock .ripplet-dock-platform');if(!platform)return;
  const token=document.createElement('span');
  token.className='dock-crypto-token';
  token.dataset.symbol=symbol;
  token.setAttribute('aria-hidden','true');
  const spots=[[18,10],[72,12],[28,72],[67,70],[45,7],[48,78],[10,48],[80,48]];
  const count=qa('#rippletDock .dock-crypto-token').length;
  const spot=spots[count%spots.length];
  token.style.left=spot[0]+'%';
  token.style.top=spot[1]+'%';
  platform.appendChild(token);
  const tokens=qa('#rippletDock .dock-crypto-token');
  while(tokens.length>8)tokens.shift()?.remove();
}
function keepRippletInsideActivePage(){
  if(!lifeAvatar||roamDocked||rippletMusicDancing||heldCryptoCoin||pendingCryptoCoin||rippletRouteBusy())return false;
  const shell=q('.main-shell'),sr=shell?.getBoundingClientRect(),ar=lifeAvatar.getBoundingClientRect();
  if(!shell||!sr)return false;
  const current={
    x:ar.left-sr.left+shell.scrollLeft,
    y:ar.top-sr.top+shell.scrollTop
  };
  if(rippletPositionInsideActivePage(current.x,current.y))return true;
  const b=activePageBounds(12);
  const target=findNearestClearPosition(
    Math.max(b.left,Math.min(b.right-ar.width,current.x)),
    b.top+12,
    null,
    false
  )||findNearestClearPosition((b.left+b.right-ar.width)*.5,b.top+18,null,false);
  if(!target)return false;
  return routeRippletTo(target.x,target.y,'page-enter');
}
function depositCryptoCoin(){
  clearTimeout(cryptoCoinMissionTimer);
  const coin=heldCryptoCoin;if(!coin)return false;
  const symbol=coin.dataset.symbol||'XRP';
  coin.remove();
  heldCryptoCoin=null;
  pendingCryptoCoin=null;
  cryptoCoinDeposits++;
  recordDockCryptoCoin(symbol);
  window.XRPet2D?.motor?.('stand');
  window.XRPet3D?.perform?.('happy');
  setText('#mindAction','Delivered '+symbol);
  setText('#mindThought','I carried a tiny '+symbol+' coin back to the dock. I may look for another one later.');
  setTimeout(()=>{
    ensureCryptoCoins(false);
    keepRippletInsideActivePage();
  },520);
  return true;
}
function carryCryptoCoinToDock(){
  if(!heldCryptoCoin)return false;
  if(rippletMusicDancing)return false;
  if(rippletRouteBusy())return true;
  const dock=q('#rippletDock'),target=dockPosition();
  if(!dock||!target)return false;
  if(!routeRippletTo(target.x,target.y,'coin-return',dock)){
    cryptoCoinMissionTimer=setTimeout(carryCryptoCoinToDock,900);
    return false;
  }
  window.XRPet2D?.motor?.('carry',{side:'right'});
  setText('#mindAction','Carrying '+(heldCryptoCoin.dataset.symbol||'crypto')+' to dock');
  setText('#mindThought','I picked up a tiny crypto coin and I am physically taking it back to my dock.');
  const wait=Math.max(850,rippletRouteUntil-performance.now()+180);
  cryptoCoinMissionTimer=setTimeout(()=>{
    if(!heldCryptoCoin)return;
    if(rippletMusicDancing){cryptoCoinMissionTimer=setTimeout(carryCryptoCoinToDock,700);return}
    depositCryptoCoin();
  },wait);
  return true;
}
function pickUpCryptoCoin(coin){
  clearTimeout(cryptoCoinMissionTimer);
  if(!coin||coin!==pendingCryptoCoin||!coin.isConnected||rippletMusicDancing||roamDocked){
    if(coin)coin.classList.remove('is-targeted');
    if(pendingCryptoCoin===coin)pendingCryptoCoin=null;
    return false;
  }
  const shell=q('.main-shell'),sr=shell?.getBoundingClientRect(),ar=lifeAvatar?.getBoundingClientRect(),cr=coin.getBoundingClientRect();
  if(!shell||!sr||!ar)return false;
  const distance=Math.hypot(
    (cr.left+cr.width*.5)-(ar.left+ar.width*.5),
    (cr.top+cr.height*.5)-(ar.top+ar.height*.5)
  );
  if(distance>Math.max(95,ar.height*1.5)){
    coin.classList.remove('is-targeted');
    pendingCryptoCoin=null;
    return false;
  }
  pendingCryptoCoin=null;
  heldCryptoCoin=coin;
  coin.classList.remove('is-targeted');
  coin.classList.add('is-carried');
  coin.style.left='';
  coin.style.top='';
  lifeAvatar.appendChild(coin);
  window.XRPet2D?.motor?.('grab',{side:'right'});
  setText('#mindAction','Picked up '+(coin.dataset.symbol||'crypto'));
  setText('#mindThought','I found a tiny coin in a clear part of the page. I am taking it to the dock.');
  cryptoCoinMissionTimer=setTimeout(carryCryptoCoinToDock,420);
  return true;
}
function collectRandomCryptoCoin(){return false;}
function makeInterfaceEcho(){return null;}
function playWithInterface(force=false){
  if(roamDocked||rippletMusicDancing||!lifeAvatar||!roamLayer)return false;
  if(rippletRouteBusy())return false;
  if(!force&&Date.now()-lastInterfacePlayAt<1900)return false;

  const terrainSnapshot=getRippletTerrainSnapshot();
  const words=terrainSnapshot.text;
  const lines=terrainSnapshot.lines;
  const elements=terrainSnapshot.targets;
  if(!words.length&&!lines.length&&!elements.length)return false;
  lastInterfacePlayAt=Date.now();

  const terrain=[...words,...lines];
  const preferTerrain=terrain.length&&(Math.random()<.78||!elements.length);
  const target=preferTerrain
    ? terrain[Math.floor(Math.random()*terrain.length)]
    : elements[Math.floor(Math.random()*elements.length)];
  if(!target)return false;

  const terrainKind=target?.__terrain||'box';
  const textual=terrainKind==='word'||terrainKind==='sentence'||terrainKind==='letter'||terrainKind==='line';
  const roll=Math.random();
  let mode='perch',action='walk';

  if(textual){
    const hop=interfaceTargetPosition(target,'hop');
    const shortHop=hop&&canJumpOntoTarget(target,hop);
    if(roll<.18){mode='hang';action='hang'}
    else if(roll<.58){mode='climb';action='climb'}
    else if(roll<.70&&shortHop){mode='hop';action='jump'}
    else{mode='perch';action='walk'}
  }else{
    const hop=interfaceTargetPosition(target,'hop');
    if(roll<.28&&hop&&canJumpOntoTarget(target,hop)){mode='hop';action='jump'}
    else{mode='side';action='walk'}
  }

  let p=interfaceTargetPosition(target,mode);if(!p)return false;
  if(action==='jump'&&!canJumpOntoTarget(target,p)){
    action='climb';mode='climb';
    p=interfaceTargetPosition(target,mode);
    if(!p)return false;
  }
  markInterfaceTarget(target,true);

  if(action==='hang'){
    if(!routeRippletTo(p.x,p.y,'hang',target)){markInterfaceTarget(target,false);return false}
    setText('#mindAction',terrainKind==='line'?'Hanging from a line':'Hanging from letters');
    setText('#mindThought','I reached the edge without crossing through it.');
    setTimeout(()=>{
      if(roamDocked||rippletMusicDancing||rippletRouteBusy())return;
      const up=interfaceTargetPosition(target,'perch');
      if(up)routeRippletTo(up.x,up.y,'climb',target);
    },1200);
  }else if(action==='jump'){
    if(!routeRippletTo(p.x,p.y,'jump',target)){markInterfaceTarget(target,false);return false}
    setText('#mindAction','Short hop');
    setText('#mindThought','I only jump when the platform is close enough to reach physically.');
  }else if(action==='climb'){
    if(!routeRippletTo(p.x,p.y,'climb',target)){markInterfaceTarget(target,false);return false}
    setText('#mindAction',terrainKind==='line'?'Climbing a line':'Climbing page terrain');
    setText('#mindThought','I am climbing the outside edge instead of passing through it.');
  }else{
    if(!routeRippletTo(p.x,p.y,'stand',target)){markInterfaceTarget(target,false);return false}
    setText('#mindAction',terrainKind==='box'?'Walking around a box':terrainKind==='line'?'Standing on a line':'Walking to a word');
    setText('#mindThought',terrainKind==='box'
      ? 'The box is solid, so I am taking a grounded route around it.'
      : 'Words and lines are solid platforms, not empty space.');
  }

  setTimeout(()=>{
    markInterfaceTarget(target,false);
    if(!roamDocked&&!rippletMusicDancing&&!rippletRouteBusy()&&Math.random()<.42){
      const emotes=['wave','thinking','happy','salute'];
      window.XRPet3D?.perform?.(emotes[Math.floor(Math.random()*emotes.length)]);
    }
  },2200);

  return true;
}
function playWithObject(){return false;}
window.XRPetPlayground={
  play:()=>goRipplet('explore'),
  object:playWithObject,
  drop:()=>false,
  refresh:()=>false
};
ensureCryptoCoins();

function syncDanceButton(){
  qa('[data-pet-action="dance"]').forEach(button=>{
    button.disabled=false;
    button.title=window.XRPetMusicPlaying===true
      ? 'Ripplet will dance with the music.'
      : 'Ripplet will physically press Play, then dance.';
  });
}
function musicControlButton(control){
  return q(control==='play'?'#musicToggle':
    control==='previous'?'#musicPrev':
    control==='next'?'#musicNext':
    control==='shuffle'?'#musicShuffle':'');
}
function musicControlPosition(control){
  const button=musicControlButton(control),avatar=lifeAvatar?.getBoundingClientRect();
  if(!button||!avatar)return null;
  const br=button.getBoundingClientRect(),b=topRailBounds(false);
  const aw=Math.max(52,avatar.width||52);
  const x=br.left+br.width/2-aw/2;
  return {x:Math.max(b.left,Math.min(b.right-aw,x)),y:b.top,button};
}
function resumeAfterMusicControl(){
  rippletMusicControlBusy=false;
  if(window.XRPetMusicPlaying===true){
    rippletMusicDancing=true;
    rippletMusicStageState='idle';
    runRippletToMusicStage();
  }else{
    rippletMusicDancing=false;
    rippletMusicStageState='idle';
    rippletRouteAllowsShell=false;
    goRipplet('explore');
    clearTimeout(roamTimer);
    roamTimer=setTimeout(roamingStep,1100);
  }
}
function rippletPressMusicControl(control='play'){
  const target=musicControlPosition(control);
  if(!target||document.body.classList.contains('launch-locked'))return false;

  if(control==='play'&&window.XRPetMusicPlaying===true){
    rippletMusicDancing=true;
    rippletMusicStageState='idle';
    runRippletToMusicStage();
    return true;
  }

  const token=++rippletMusicControlToken;
  ++rippletMusicStageToken;
  clearTimeout(rippletMusicDanceTimer);
  clearTimeout(roamTimer);
  roamDocked=false;
  setDockStatus('ROAMING');
  cancelRippletRoute();
  rippletMusicControlBusy=true;
  rippletMusicStageState='control';
  rippletRouteAllowsShell=true;
  document.body.classList.remove('music-ripplet-stage');
  q('#xrpetMusicPlayer')?.classList.remove('ripplet-stage-active');

  const ar=lifeAvatar?.getBoundingClientRect();
  const currentX=ar?ar.left:target.x;
  const distance=Math.abs(target.x-currentX);
  const travelMs=Math.max(320,Math.min(2200,Math.round(distance/145*1000)));
  const label=control==='previous'?'Previous':control==='next'?'Next':control==='shuffle'?'Shuffle':'Play';

  setText('#mindAction','Pressing '+label);
  setText('#mindThought','I am going to the music player and pressing '+label+' myself.');
  window.XRPet2D?.face?.(target.x<currentX?'left':'right');
  window.XRPet2D?.motor?.('walk');
  setRoamPosition(target.x,target.y,'walk',travelMs+'ms');

  setTimeout(()=>{
    if(token!==rippletMusicControlToken)return;
    window.XRPet2D?.motor?.('reach',{side:'right'});
    target.button.classList.add('ripplet-press-target');

    setTimeout(()=>{
      if(token!==rippletMusicControlToken)return;
      window.XRPet2D?.motor?.('grab',{side:'right'});
      target.button.classList.add('ripplet-pressed');
      target.button.click();

      setTimeout(()=>{
        target.button.classList.remove('ripplet-pressed','ripplet-press-target');
        if(token!==rippletMusicControlToken)return;

        // Play can dispatch its own music-state event asynchronously.
        if(control==='play'){
          setTimeout(()=>{
            if(token!==rippletMusicControlToken)return;
            if(window.XRPetMusicPlaying===true){
              rippletMusicControlBusy=false;
              rippletMusicDancing=true;
              rippletMusicStageState='idle';
              runRippletToMusicStage();
            }else{
              rippletMusicControlBusy=false;
              resumeAfterMusicControl();
            }
          },420);
          return;
        }
        resumeAfterMusicControl();
      },210);
    },190);
  },travelMs+40);
  return true;
}
window.XRPetMusicByRipplet={
  play:()=>rippletPressMusicControl('play'),
  previous:()=>rippletPressMusicControl('previous'),
  next:()=>rippletPressMusicControl('next'),
  shuffle:()=>rippletPressMusicControl('shuffle')
};
function musicPlayerStagePosition(){
  const player=q('#xrpetMusicPlayer'),ar=lifeAvatar?.getBoundingClientRect();
  if(!player||!ar)return null;
  const pr=player.getBoundingClientRect();
  const aw=Math.max(52,ar.width||52);
  const b=topRailBounds(false);
  const x=pr.left+Math.max(aw*.5,pr.width*.68)-aw*.5;
  return {
    x:Math.max(b.left,Math.min(b.right-aw,x)),
    y:b.top,
    player
  };
}
function snapRippletToMusicStage(){
  if(!rippletMusicDancing)return false;
  const stage=musicPlayerStagePosition();if(!stage)return false;
  rippletRouteAllowsShell=true;
  return walkRippletTo(stage.x,'walk');
}
function danceToMusicBeat(){
  clearTimeout(rippletMusicDanceTimer);
  if(!rippletMusicDancing||window.XRPetMusicPlaying!==true)return;
  if(rippletMusicStageState!=='dancing'){
    rippletMusicDanceTimer=setTimeout(danceToMusicBeat,160);
    return;
  }
  const move=RIPPLET_DANCE_SEQUENCE[rippletDanceVariantIndex%RIPPLET_DANCE_SEQUENCE.length];
  rippletDanceVariantIndex=(rippletDanceVariantIndex+1)%RIPPLET_DANCE_SEQUENCE.length;
  if(lifeAvatar){
    lifeAvatar.dataset.activity='dance';
    lifeAvatar.dataset.reaction=move;
  }
  window.XRPet3D?.perform?.(move);
  state.mindAction='dance';
  state.mindThought='The music is playing. I am cycling through dance moves on the top rail.';
  renderMind();
  rippletMusicDanceTimer=setTimeout(danceToMusicBeat,1450);
}
function runRippletToMusicStage(){
  const stage=musicPlayerStagePosition();
  if(!stage){
    rippletMusicStageState='dancing';
    danceToMusicBeat();
    return;
  }
  const token=++rippletMusicStageToken;
  const ar=lifeAvatar?.getBoundingClientRect();
  if(!ar)return;
  const currentX=ar.left;
  const distance=Math.abs(stage.x-currentX);
  const walkMs=Math.max(320,Math.min(2200,Math.round(distance/145*1000)));

  rippletMusicStageState='walking';
  rippletRouteAllowsShell=true;
  document.body.classList.add('music-ripplet-stage');
  stage.player.classList.add('ripplet-stage-active');
  setText('#mindAction','Walking to music stage');
  setText('#mindThought','Music started. I am walking along the top rail to my dance position.');
  window.XRPet2D?.face?.(stage.x<currentX?'left':'right');
  window.XRPet2D?.motor?.('walk');
  setRoamPosition(stage.x,stage.y,'walk',walkMs+'ms');
  rippletRouteUntil=performance.now()+walkMs;

  setTimeout(()=>{
    if(token!==rippletMusicStageToken||!rippletMusicDancing||window.XRPetMusicPlaying!==true)return;
    rippletMusicStageState='dancing';
    if(lifeAvatar)lifeAvatar.dataset.activity='dance';
    window.XRPet2D?.motor?.('stand');
    danceToMusicBeat();
  },walkMs+40);
}
function setRippletMusicDance(playing){
  const next=playing===true;
  syncDanceButton();

  // During Previous/Next/Shuffle, the player can briefly emit pause/play while changing sources.
  if(rippletMusicControlBusy){
    rippletMusicDancing=next;
    return;
  }

  // Ignore duplicate play events from audio.play() + UI synchronization.
  if(next===rippletMusicDancing&&next&&rippletMusicStageState!=='idle')return;

  rippletMusicDancing=next;
  clearTimeout(rippletMusicDanceTimer);
  clearTimeout(roamTimer);
  clearTimeout(cryptoCoinMissionTimer);
  ensureCryptoCoins();

  if(next){
    rippletDanceVariantIndex=0;
    roamDocked=false;
    setDockStatus('ROAMING');
    cancelRippletRoute();
    runRippletToMusicStage();
    return;
  }

  ++rippletMusicStageToken;
  q('#xrpetMusicPlayer')?.classList.remove('ripplet-stage-active');
  document.body.classList.remove('music-ripplet-stage');

  if(lifeAvatar){
    if(lifeAvatar.dataset.activity==='dance')lifeAvatar.dataset.activity='stand';
    if(lifeAvatar.dataset.reaction==='dance')delete lifeAvatar.dataset.reaction;
  }
  window.XRPet2D?.motor?.('stand');
  rippletRouteAllowsShell=false;
  rippletMusicStageState='idle';
  state.mindAction='roam';
  state.mindThought='The music stopped. I am leaving the music-player stage and returning to the top rail.';
  renderMind();

  setTimeout(()=>{
    if(rippletMusicDancing)return;
    goRipplet('explore');
    roamTimer=setTimeout(roamingStep,900);
  },140);
}
window.addEventListener('xrpet:music-state',e=>setRippletMusicDance(e.detail?.playing===true));
qa('[data-ripplet-music-control]').forEach(button=>button.addEventListener('click',()=>{
  rippletPressMusicControl(button.dataset.rippletMusicControl);
}));
setTimeout(()=>setRippletMusicDance(window.XRPetMusicPlaying===true),0);

function roamingStep(){
  clearTimeout(roamTimer);
  if(rippletMusicDancing){
    roamTimer=setTimeout(roamingStep,900);
    return;
  }
  if(rippletRouteBusy()){
    roamTimer=setTimeout(roamingStep,500);
    return;
  }
  if(roamDocked){
    const dockEmotes=['thinking','salute','wave','shrug','happy'];
    window.XRPet3D?.perform?.(dockEmotes[Math.floor(Math.random()*dockEmotes.length)]);
    roamTimer=setTimeout(roamingStep,5200+Math.random()*4200);
    return;
  }

  // Top-rail roaming only: no text, line, box, cursor, or page collision scanning.
  goRipplet('explore');
  if(Math.random()<.24){
    const emotes=['wave','thinking','happy','scan','salute'];
    setTimeout(()=>{
      if(!rippletMusicDancing&&!roamDocked)window.XRPet3D?.perform?.(emotes[Math.floor(Math.random()*emotes.length)]);
    },700);
  }
  roamTimer=setTimeout(roamingStep,2600+Math.random()*3000);
}
function renderMind(){
  const labels={roam:'Roaming',dock:'Docked',socialize:'Signal Friend',scan:'Scanning XRPL',wave:'Waving',dance:'Dancing',music_next:'Pressing Next',music_previous:'Pressing Previous',music_shuffle:'Pressing Shuffle',focus:'Focused',run:'Running',jump:'Jumping',climb:'Climbing',reach:'Reaching',grab:'Grabbing',carry:'Carrying',crouch:'Crouching',turn:'Turning'};
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
    musicPlaying:window.XRPetMusicPlaying===true,
    needs:{social:state.lifeSocial},
    currentActivity:state.lifeActivity,
    memories:state.memories.slice(-5)
  };
}
function executeMindDecision(decision){
  if(!decision)return;
  const requested=decision.action||'roam';
  const action=requested;
  state.mindAction=action;
  state.mindThought=decision.thought||'I chose my next move.';
  state.mindMode=decision.mode||'local-autonomy';
  if(['music_next','music_previous','music_shuffle'].includes(action)){
    const control=action==='music_next'?'next':action==='music_previous'?'previous':'shuffle';
    rippletPressMusicControl(control);
  }else if(action==='dance'){
    if(window.XRPetMusicPlaying===true)setRippletMusicDance(true);
    else rippletPressMusicControl('play');
  }else if(rippletMusicDancing){
    state.mindAction='dance';
    state.mindThought='The music is playing, so I am dancing instead of roaming.';
  }else if(action==='socialize'){
    performLifeActivity('socialize',false,false);
  }else if(action==='roam'){
    state.lifeActivity='explore';window.XRPetRoam?.go?.('explore');
  }else if(['run','jump','climb'].includes(action)){
    state.mindAction='roam';
    state.mindThought='I stay grounded on the top rail, so I am walking instead.';
    window.XRPetRoam?.go?.('explore');
  }else if(['scan','wave','focus','reach','grab','carry','crouch','turn'].includes(action)){
    window.XRPet3D?.motor?.(action,{side:Math.random()<.5?'left':'right',turn:(Math.random()<.5?-1:1)*.45});
    if(action==='wave')playSound('wave',true);
    if(action==='scan')playSound('ledgerTx',true);
  }
  renderMind();persist();
}
let mindTimer=0,mindBusy=false;
async function runAutonomousMind(){
  clearTimeout(mindTimer);
  if(!mindBusy){
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
  if(!rippletMusicDancing&&!rippletRouteBusy()){
    const options=roamDocked
      ? ['thinking','salute','wave','shrug','happy','surprised']
      : ['greet','happy','focus','scan','wave','cheer','laugh','shrug','confused','excited','point','salute','thinking','surprised','turn','reach'];
    const pick=options[Math.floor(Math.random()*options.length)];
    if(['turn','reach'].includes(pick))window.XRPet3D?.motor?.(pick,{side:Math.random()<.5?'left':'right',turn:(Math.random()<.5?-1:1)*.35});
    else window.XRPet3D?.perform?.(pick);
    if(lifeAvatar){
      lifeAvatar.dataset.reaction=pick;
      setTimeout(()=>{if(lifeAvatar?.dataset.reaction===pick)delete lifeAvatar.dataset.reaction},1800);
    }
    if(Math.random()<.28)playSound(pick==='wave'?'wave':pick==='scan'?'ledgerTx':'pet',true);
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
let roamResizeTimer=0;
const rippletShell=q('.main-shell');
// Ripplet intentionally ignores page pointer/scroll terrain. His world is the locked top rail.
addEventListener('resize',()=>{
  clearTimeout(roamResizeTimer);
  roamResizeTimer=setTimeout(()=>{
    if(document.hidden||document.body.classList.contains('launch-locked'))return;
    syncRoamBounds();
    if(rippletRouteBusy())return;
    if(rippletMusicDancing){
      snapRippletToMusicStage();
      return;
    }
    if(roamDocked){
      const p=dockPosition();if(p)walkRippletTo(p.x,'dock','.35s');
    }else{
      goRipplet('explore');
    }
  },160);
});
window.addEventListener('xrpet:view-change',()=>{
  syncRoamBounds();
  if(rippletRouteBusy())return;
  if(rippletMusicDancing)snapRippletToMusicStage();
  else if(roamDocked){
    const p=dockPosition();if(p)walkRippletTo(p.x,'dock','.35s');
  }
});

qa('[data-life-action]').forEach(b=>b.addEventListener('click',()=>performLifeActivity(b.dataset.lifeAction,true,false)));

let xrpetRuntimeStarted=false;
function startXRPetRuntime(){
  if(xrpetRuntimeStarted)return;
  xrpetRuntimeStarted=true;

  // First paint the app; stagger live systems so they do not all compete for the main thread.
  dailyVisit();
  render();
  applyNftCompanion();
  ensureCryptoCoins();
  invalidateRippletTerrain();
  syncRoamBounds();

  setTimeout(()=>{
    if(document.hidden)return;
    connectLedger();
    setExchange(state.selectedExchange||'all',{initial:true});
  },120);

  setTimeout(()=>{
    if(document.hidden)return;
    loadRecentTransactionsFallback(true);
    bindExchangeMenu();
  },520);

  setTimeout(()=>{
    if(document.hidden)return;
    registerVisitor();
    loadUpdates();
  },1050);

  setTimeout(()=>{
    if(document.hidden)return;
    integrationCheck();
  },1700);

  setTimeout(()=>{
    if(document.hidden)return;
    goRipplet('explore');
    roamingStep();
    spontaneousRippletReaction();
  },900);

  setTimeout(runAutonomousMind,14000);

  setInterval(()=>{if(!document.hidden)lifeTick()},30000);
  setInterval(()=>{
    if(document.hidden||Date.now()-marketLastTickAt<=15000)return;
    loadMarket(false);
  },15000);
  setInterval(()=>{if(!document.hidden)loadMarketHistory()},300000);
  setInterval(()=>{if(!document.hidden)loadUpdates()},120000);
  setInterval(()=>{if(!document.hidden)integrationCheck()},120000);
  setInterval(()=>{
    if(document.hidden||state.connected)return;
    loadRecentTransactionsFallback(false);
  },8000);

  setTimeout(checkXRPetBuild,12000);
  setInterval(()=>{if(!document.hidden)checkXRPetBuild()},60000);
}
if(document.body.classList.contains('launch-locked')){
  window.addEventListener('xrpet:launch-complete',startXRPetRuntime,{once:true});
}else{
  startXRPetRuntime();
}

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
    window.XRPet3D?.perform?.((d.score||0)>100?'celebrate':'greet');
    playSound((d.score||0)>100?'success':'pet',true);
    addXp(Math.max(1,Math.min(10,Math.floor((Number(d.score)||0)/50)+1)));
  }else if(d.type==='start'){
    window.XRPet3D?.perform?.('focus');playSound('open',true);
  }
});

if('serviceWorker' in navigator){
  window.addEventListener('load',async()=>{
    // XRPet is under active development: remove old offline workers/caches so UI and companion changes cannot stay stale.
    try{
      const regs=await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(reg=>reg.unregister()));
    }catch{}
    try{
      const keys=await caches.keys();
      await Promise.all(keys.filter(key=>key.startsWith('xrpet-')).map(key=>caches.delete(key)));
    }catch{}
  },{once:true});
}

const XRPetClientBuild=document.documentElement.dataset.xrpetBuild||'0.0.0';
function xrpetVersionParts(v){return String(v).split('.').map(n=>Number(n)||0)}
function xrpetVersionNewer(a,b){
  const A=xrpetVersionParts(a),B=xrpetVersionParts(b),n=Math.max(A.length,B.length);
  for(let i=0;i<n;i++){const x=A[i]||0,y=B[i]||0;if(x!==y)return x>y}
  return false;
}
async function checkXRPetBuild(){
  try{
    const r=await fetch('/api/health?ts='+Date.now(),{cache:'no-store'});
    if(!r.ok)return;
    const data=await r.json();
    const serverBuild=String(data.version||'');
    if(!serverBuild||!xrpetVersionNewer(serverBuild,XRPetClientBuild))return;
    const key='xrpet-reloaded-'+serverBuild;
    if(sessionStorage.getItem(key)==='1')return;
    sessionStorage.setItem(key,'1');
    location.reload();
  }catch{}
}
// Build checks are started by startXRPetRuntime() after the loading screen is released.

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
const PRIMARY_VIEW_TARGETS={
  home:'homeSection',
  live:'xrplPanel',
  exchanges:'exchangesSection',
  history:'xrpHistorySection',
  learn:'learnSection',
  announcements:'announcementsSection',
  ripplet:'companionSection',
  ecosystem:'ecosystemSection',
  games:'gamesSection'
};
function ensurePrimaryViewVisible(){
  const active=qa('.primary-view-section.view-active');
  if(active.length)return;
  const home=q('#homeSection');
  if(home){
    home.classList.add('view-active');
    home.hidden=false;
    document.body.dataset.primaryView='home';
  }
}
ensurePrimaryViewVisible();
function setPrimaryView(view='home'){
  const next=PRIMARY_VIEW_TARGETS[view]?view:'home';
  const target=PRIMARY_VIEW_TARGETS[next];

  // Switch the interface first. Companion animation is optional and must never block navigation.
  clearTimeout(cryptoCoinMissionTimer);
  if(!rippletMusicDancing)++rippletRouteToken;
  if(pendingCryptoCoin&&pendingCryptoCoin!==heldCryptoCoin){
    pendingCryptoCoin.classList.remove('is-targeted');
    pendingCryptoCoin=null;
  }
  clearCryptoCoins(true);

  primaryView=next;
  qa('[data-view-section]').forEach(section=>{
    const active=section.dataset.viewSection===next;
    section.classList.toggle('view-active',active);
    section.hidden=!active;
    if(active){
      section.style.removeProperty('display');
      section.style.removeProperty('visibility');
      section.style.removeProperty('opacity');
    }
  });
  qa('[data-primary-view]').forEach(b=>b.classList.toggle('active',b.dataset.primaryView===next));
  document.body.dataset.primaryView=next;
  window.dispatchEvent(new CustomEvent('xrpet:view-change',{detail:{view:next}}));
  qa('[data-customization-panel]').forEach(p=>p.classList.remove('is-open'));
  document.body.classList.remove('workspace-open','customization-open');

  ['historyNavDetails','exchangeNavDetails','rippletNavDetails','ecosystemNavDetails','gamesNavDetails','customizeDetails','settingsDetails']
    .forEach(id=>q('#'+id)?.removeAttribute('open'));

  const pane=q('#'+target);
  if(pane){
    pane.hidden=false;
    pane.scrollTop=0;
  }
  const shell=q('.main-shell');
  if(shell)shell.scrollTop=0;

  requestAnimationFrame(()=>{
    try{scrollSectionTop(target)}catch{}
    try{
      syncRoamBounds?.();
      if(rippletMusicDancing)snapRippletToMusicStage?.();
      else if(roamDocked){
        const p=dockPosition?.();if(p)walkRippletTo?.(p.x,'dock','.35s');
      }
    }catch{}
  });
}
qa('[data-primary-view]').forEach(b=>{
  if(b.tagName==='SUMMARY')return;
  b.addEventListener('click',()=>setPrimaryView(b.dataset.primaryView));
});

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
  setPrimaryView('learn');
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
  if(window.XRPetShell?.showHistory){
    window.XRPetShell.showHistory(view);
    return;
  }
  primaryView='history';
  qa('[data-view-section]').forEach(section=>{
    const active=section.dataset.viewSection==='history';
    section.classList.toggle('view-active',active);
    section.hidden=!active;
  });
  qa('[data-primary-view]').forEach(b=>b.classList.remove('active'));
  document.body.dataset.primaryView='history';
  const section=q('#xrpHistorySection');if(!section)return;
  section.hidden=false;
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
if(!window.XRPetShell)qa('[data-history-view]').forEach(b=>b.addEventListener('click',()=>openHistoryView(b.dataset.historyView)));

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

// Sidebar summary navigation is handled by ui-shell.js so the native details menu can stay open.

function setRippletSubview(view='overview'){
  setPrimaryView('ripplet');
  qa('[data-ripplet-panel]').forEach(panel=>panel.classList.toggle('active',panel.dataset.rippletPanel===view));
  qa('[data-ripplet-view]').forEach(btn=>btn.classList.toggle('active',btn.dataset.rippletView===view));
  q('#rippletNavDetails')?.removeAttribute('open');
  const section=q('#companionSection');if(section)section.scrollTop=0;
}
qa('[data-ripplet-view]').forEach(btn=>btn.addEventListener('click',()=>setRippletSubview(btn.dataset.rippletView)));
// Ripplet summary navigation is handled by ui-shell.js so the dropdown remains usable.

// Sidebar flyout closing is handled explicitly by ui-shell.js after a selection.
q('#customizeDetails')?.addEventListener('toggle',e=>{
  if(e.target.open) q('#settingsDetails')?.removeAttribute('open');
});
q('#settingsDetails')?.addEventListener('toggle',e=>{
  if(e.target.open) q('#customizeDetails')?.removeAttribute('open');
});

setPrimaryView('home');

window.addEventListener('xrpet:model-ready',()=>window.XRPetEnforceRippletSize?.());
window.addEventListener('xrpet:view-change',()=>window.XRPetEnforceRippletSize?.());
setTimeout(()=>window.XRPetEnforceRippletSize?.(),900);
