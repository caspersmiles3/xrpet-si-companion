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
  lifeFood:Number.isFinite(saved.lifeFood)?saved.lifeFood:88,
  lifeWater:Number.isFinite(saved.lifeWater)?saved.lifeWater:90,
  lifeRest:Number.isFinite(saved.lifeRest)?saved.lifeRest:86,
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
  drink:{label:'Drinking XRPL flow',thought:'Transactions are moving through the XRP Ledger. I am taking in the flow.'},
  eat:{label:'Feeding on market energy',thought:'XRP moved. I am checking the market energy without treating movement as a prediction.'},
  sleep:{label:'Sleeping',thought:'The ledger is quiet right now, so I am resting until the signal changes.'},
  socialize:{label:'With Signal Friend',thought:'A new official signal arrived. I am checking it with my Signal Friend.'},
  explore:{label:'Roaming XRPet',thought:'I am walking through XRPet and watching for the next live signal.'},
  ledger:{label:'Watching XRPL',thought:'I am monitoring validated XRP Ledger activity.'},
};
function clampNeed(v){return Math.max(0,Math.min(100,Number(v)||0))}
function applyOfflineLifeDecay(){
  const now=Date.now(),elapsed=Math.min(12*60*60*1000,Math.max(0,now-state.lifeLastTick)),minutes=elapsed/60000;
  state.lifeFood=clampNeed(state.lifeFood-minutes*.05);state.lifeWater=clampNeed(state.lifeWater-minutes*.06);
  state.lifeRest=clampNeed(state.lifeRest-minutes*.04);state.lifeSocial=clampNeed(state.lifeSocial-minutes*.04);state.lifeLastTick=now;
}
function renderLife(){
  const cfg=LIFE_STATIONS[state.lifeActivity]||LIFE_STATIONS.explore;
  setText('#lifeMode',cfg.label);setText('#lifeThought',cfg.thought);
}
const LIFE_REACTIONS={
  drink:[
    {name:'Cool Sip',actions:[['sip',0],['wave',900]],sounds:[['sip',0],['wave',850]],variant:'a'},
    {name:'Ledger Gulp',actions:[['gulp',0],['happy',1150]],sounds:[['gulp',0],['pet',1100]],variant:'b'},
    {name:'Flow Splash',actions:[['splash',0],['celebrate',1050]],sounds:[['splash',0],['celebrate',1050]],variant:'c'}
  ],
  eat:[
    {name:'Core Bite',actions:[['bite',0],['happy',850]],sounds:[['bite',0],['pet',850]],variant:'a'},
    {name:'Market Taste',actions:[['taste',0],['greet',1050]],sounds:[['taste',0],['greet',1000]],variant:'b'},
    {name:'Energy Charge',actions:[['charge',0],['celebrate',1200]],sounds:[['charge',0],['success',1200]],variant:'c'}
  ],
  sleep:[
    {name:'Quiet Curl',actions:[['curl',0],['sleep',850]],sounds:[['curl',0]],variant:'a'},
    {name:'Ledger Dream',actions:[['dream',0],['sleep',950]],sounds:[['dream',0]],variant:'b'},
    {name:'Deep Snore',actions:[['snore',0]],sounds:[['snore',0],['snore',1200]],variant:'c'}
  ],
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
function performLifeActivity(activity,manual=false,moveToStation=manual){
  const isLiveOverlay=!manual&&['drink','eat','sleep','socialize'].includes(activity);
  if(!isLiveOverlay)state.lifeActivity=activity;
  if(activity==='drink')state.lifeWater=clampNeed(state.lifeWater+(manual?12:4));
  if(activity==='eat')state.lifeFood=clampNeed(state.lifeFood+(manual?12:4));
  if(activity==='sleep')state.lifeRest=clampNeed(state.lifeRest+(manual?10:3));
  if(activity==='socialize')state.lifeSocial=clampNeed(state.lifeSocial+(manual?12:4));
  const reaction=activity==='ledger'?'scan':activity==='explore'?'greet':'greet';
  const lifeReaction=['drink','eat','sleep','socialize'].includes(activity)?playLifeReaction(activity):null;
  if(!lifeReaction)window.XRPet3D?.perform?.(reaction);
  // Automatic live reactions happen wherever Ripplet currently is. Manual station taps may guide him there.
  if(moveToStation)window.XRPetRoam?.go?.(activity);
  clearTimeout(lifeReturnTimer);
  if(moveToStation&&['drink','eat','sleep','socialize'].includes(activity)){
    lifeReturnTimer=setTimeout(()=>{state.lifeActivity='explore';renderLife();persist()},4200);
  }
  renderLife();persist();
}
function lifeTick(){
  state.lifeFood=clampNeed(state.lifeFood-.03);state.lifeWater=clampNeed(state.lifeWater-.04);
  state.lifeRest=clampNeed(state.lifeRest-.02);
  state.lifeSocial=clampNeed(state.lifeSocial-.02);state.lifeLastTick=Date.now();
  const quiet=Date.now()-(state.lastLedgerTxAt||0)>20000;
  if(quiet&&Date.now()-lastQuietReactionAt>45000){
    lastQuietReactionAt=Date.now();performLifeActivity('sleep');
    setText('#sleepSignal','Quiet period');
  }else if(!quiet){
    setText('#sleepSignal','XRPL active');
  }
  renderLife();persist();
}
applyOfflineLifeDecay();
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

let marketWs=null,marketRetry=0,marketLastTickAt=0,liveChartPoints=[];
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
function updateMarketDetail(d={}){
  const bid=Number(d.bestBid??d.best_bid),ask=Number(d.bestAsk??d.best_ask),price=Number(d.price);
  const spread=Number.isFinite(bid)&&Number.isFinite(ask)?ask-bid:Number(d.spread);
  const spreadBps=Number.isFinite(spread)&&Number.isFinite(price)&&price>0?(spread/price)*10000:Number(d.spreadBps);
  setText('#marketBid',fmtMarketNumber(bid,5));
  setText('#marketAsk',fmtMarketNumber(ask,5));
  setText('#marketSpread',Number.isFinite(spread)?'$'+spread.toFixed(6):'—');
  setText('#marketSpreadBps',Number.isFinite(spreadBps)?spreadBps.toFixed(2)+' bps':'— bps');
  if(Number.isFinite(Number(d.open24h)))setText('#chartOpen',fmtMarketNumber(d.open24h));
  if(Number.isFinite(Number(d.high24h)))setText('#chartHigh',fmtMarketNumber(d.high24h));
  if(Number.isFinite(Number(d.low24h)))setText('#chartLow',fmtMarketNumber(d.low24h));
  if(Number.isFinite(Number(d.volume24hXrp)))setText('#chartVolume',fmtCompact(d.volume24hXrp,' XRP'));
  if(Number.isFinite(Number(d.volume24hUsd)))setText('#chartVolumeUsd','$'+fmtCompact(d.volume24hUsd));
  if(Number.isFinite(Number(d.range24hPct)))setText('#chartRangePct',Number(d.range24hPct).toFixed(2)+'%');
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
  const p=Number(ticker.price);
  if(!Number.isFinite(p)||p<=0)return;
  const previousPrice=state.lastMarketPrice;
  state.xrpPrice=p;state.lastMarketPrice=p;
  const change24h=Number(ticker.price_percent_chg_24_h);
  if(Number.isFinite(change24h))state.xrpChange24h=change24h;
  if(Number.isFinite(previousPrice)&&previousPrice!==p){
    const delta=(p-previousPrice)/previousPrice*100;
    state.lastPriceTickPct=delta;
    setText('#foodSignal',(delta>=0?'+':'')+delta.toFixed(3)+'% tick');
  }
  const livePrice='$'+p.toFixed(5);
  const liveChange=Number.isFinite(state.xrpChange24h)?(state.xrpChange24h>=0?'+':'')+state.xrpChange24h.toFixed(2)+'% · 24h':'STREAMING';
  setText('#xrpPrice',livePrice);setText('#xrpChange',liveChange);
  setText('#globalXrpPrice',livePrice);setText('#globalXrpChange',liveChange);
  marketLastTickAt=Date.now();
  const bid=Number(ticker.best_bid),ask=Number(ticker.best_ask);
  const vol=Number(ticker.volume_24_h),hi=Number(ticker.high_24_h),lo=Number(ticker.low_24_h);
  updateMarketDetail({
    price:p,bestBid:bid,bestAsk:ask,
    volume24hXrp:vol,volume24hUsd:Number.isFinite(vol)?vol*p:null,
    high24h:hi,low24h:lo,
    range24hPct:Number.isFinite(hi)&&Number.isFinite(lo)&&lo>0?((hi-lo)/lo)*100:null,
    source:'Coinbase live ticker',
    generatedAt:new Date().toISOString()
  });
  mergeLiveTickIntoChart(p);
  if(liveChartPoints.length>=2)renderMarketChart(liveChartPoints);
  renderSignal589();
}
function scheduleMarketReconnect(){
  clearTimeout(marketRetry);
  marketRetry=setTimeout(connectMarketStream,2500);
}
function connectMarketStream(){
  clearTimeout(marketRetry);
  try{marketWs=new WebSocket('wss://advanced-trade-ws.coinbase.com')}catch{return scheduleMarketReconnect()}
  marketWs.onopen=()=>{
    marketWs.send(JSON.stringify({type:'subscribe',product_ids:['XRP-USD'],channel:'ticker'}));
    marketWs.send(JSON.stringify({type:'subscribe',channel:'heartbeats'}));
    setText('#globalXrpChange','LIVE STREAM');
    setText('#marketSource','Coinbase live ticker');
  };
  marketWs.onmessage=e=>{
    let m;try{m=JSON.parse(e.data)}catch{return}
    if(m.channel!=='ticker'||!Array.isArray(m.events))return;
    for(const ev of m.events){
      for(const t of ev.tickers||[]){
        if(t.product_id!=='XRP-USD')continue;
        applyLiveMarketTick(t);
      }
    }
  };
  marketWs.onclose=scheduleMarketReconnect;
  marketWs.onerror=()=>{try{marketWs.close()}catch{}};
}
async function loadMarket(){
  try{
    const r=await fetch('/api/market',{cache:'no-store'}),d=await r.json();if(!r.ok)throw new Error();
    const previousPrice=state.lastMarketPrice;
    state.xrpPrice=Number(d.price);state.xrpChange24h=Number(d.change24h);state.lastMarketPrice=state.xrpPrice;
    renderSignal589();updateMarketDetail(d);
    if(Number.isFinite(previousPrice)&&Number.isFinite(state.xrpPrice)&&previousPrice!==state.xrpPrice){
      const delta=(state.xrpPrice-previousPrice)/previousPrice*100;
      state.lastPriceTickPct=delta;setText('#foodSignal',(delta>=0?'+':'')+delta.toFixed(3)+'% tick');
      performLifeActivity('eat');
    }
    const livePrice=Number.isFinite(state.xrpPrice)?'$'+state.xrpPrice.toFixed(5):'Unavailable';
    const liveChange=Number.isFinite(state.xrpChange24h)?(state.xrpChange24h>=0?'+':'')+state.xrpChange24h.toFixed(2)+'% · 24h':'24h unavailable';
    setText('#xrpPrice',livePrice);setText('#xrpChange',liveChange);setText('#globalXrpPrice',livePrice);setText('#globalXrpChange',liveChange);
    if(state.marketMood&&Number.isFinite(state.xrpChange24h)&&Math.abs(state.xrpChange24h)>=5)mood(state.xrpChange24h>0?'Excited':'Watchful','XRP moved '+Math.abs(state.xrpChange24h).toFixed(2)+'% over 24 hours. Movement is not a prediction.',state.xrpChange24h>0?'energized':'alert');
  }catch{
    setText('#xrpPrice','Unavailable');setText('#xrpChange','Market feed offline');setText('#globalXrpPrice','Unavailable');setText('#globalXrpChange','Market feed offline');setText('#marketSource','Market feed offline');renderSignal589();
  }
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
    const r=await fetch('/api/market-history',{cache:'no-store'}),d=await r.json();
    if(!r.ok||!Array.isArray(d.points))throw new Error();
    liveChartPoints=(d.points||[]).slice(-288).map(p=>({...p,time:Number(p.time)}));
    renderMarketChart(liveChartPoints);
  }catch{setText('#chartRange','MARKET CHART OFFLINE')}
}
async function loadUpdates(){const box=q('#updates');if(box)box.innerHTML='<p class="muted">Checking official Ripple and XRPL sources…</p>';try{const r=await fetch('/api/updates',{cache:'no-store'});const d=await r.json();if(!r.ok||!Array.isArray(d.items)||!d.items.length)throw new Error();const items=d.items.slice(0,12);box.innerHTML=items.map((x,i)=>'<article class="announcement-card"><div class="announcement-index">'+String(i+1).padStart(2,'0')+'</div><div><span class="announcement-source">'+esc(x.source)+' · '+esc(x.label||'CONFIRMED')+'</span><a href="'+esc(x.url)+'" target="_blank" rel="noopener">'+esc(x.title)+'</a><small>Official source ↗</small></div></article>').join('');setText('#announcementStatus','Live');setText('#announcementUpdated','Updated '+new Date().toLocaleTimeString());const newest=items[0]?.title||'';setText('#friendSignal',newest?'New signal':'Standing by');if(newest&&state.lastAnnouncementTitle&&newest!==state.lastAnnouncementTitle&&!false){state.lastAnnouncementAt=Date.now();performLifeActivity('socialize')}state.lastAnnouncementTitle=newest;persist()}catch{if(box)box.innerHTML='<p class="muted">Official update feed is temporarily unavailable.</p>';setText('#announcementStatus','Unavailable');setText('#announcementUpdated','Retrying automatically')}}
const liveTransactions=[];
const seenLiveTx=new Set();
let liveTxRenderTimer=0,lifeWaterTimer=0,lifeReturnTimer=0,lastQuietReactionAt=0,spontaneousReactionTimer=0;
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
  return {hash,type:tx.TransactionType||'Transaction',account:tx.Account||'',destination:tx.Destination||'',destinationTag:tx.DestinationTag,amount:formatLedgerAmount(extractDeliveredAmount(m,tx)),fee:tx.Fee!=null?(Number(tx.Fee)/1000000).toFixed(6)+' XRP':'—',sequence:tx.Sequence??'—',ledger,status:meta.TransactionResult||m.engine_result||(m.validated===false?'Pending':'Validated'),validated:m.validated!==false,flags:tx.Flags??0,ticket:tx.TicketSequence??null,timestamp,memos,source:activeXrplEndpoint,explorer:'https://livenet.xrpl.org/transactions/'+encodeURIComponent(hash)};
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
function scrollSectionTop(id){
  const target=q('#'+id); if(!target)return;
  const y=Math.max(0,target.getBoundingClientRect().top+window.scrollY-14);
  window.scrollTo({top:y,behavior:'smooth'});
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
let launchOpened=false,launchProgress=0,launchTimer=0;

function setSimpleLaunchProgress(value,text){
  launchProgress=Math.max(0,Math.min(100,Number(value)||0));
  if(launchBar)launchBar.style.width=launchProgress+'%';
  if(text)setText('#launchStatus',text);
}
function finishLaunch(){
  if(launchOpened)return;
  launchOpened=true;
  clearInterval(launchTimer);
  setSimpleLaunchProgress(100,'XRPet ready.');
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
  launchTimer=setInterval(()=>{
    if(launchOpened)return;
    if(launchProgress<88){
      const next=Math.min(88,launchProgress+Math.max(3,Math.round((90-launchProgress)*.12)));
      const text=next<42?'Connecting to XRPL live data…':next<70?'Synchronizing live signals…':'Waking Ripplet…';
      setSimpleLaunchProgress(next,text);
    }
  },180);
  launchEnter?.addEventListener('click',finishLaunch);
  launchGate?.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();finishLaunch()}});
  // Never trap the user on the loading screen if another service is slow.
  setTimeout(()=>{if(!launchOpened)setSimpleLaunchProgress(Math.max(launchProgress,92),'Ready when you are.');},1800);
}else{
  document.body.classList.remove('launch-locked');
}

const floatEl=q('#floatingCompanion'),roamLayer=q('#rippletRoamLayer'),lifeAvatar=q('#lifeAvatar');
let roamPinned=false,roamX=.72,roamY=.72,roamTimer=0;

function syncRoamBounds(){
  const shell=q('.main-shell');if(!shell||!roamLayer)return;
  const r=shell.getBoundingClientRect();
  roamLayer.style.left=Math.max(0,r.left)+'px';
  roamLayer.style.top='0px';
  roamLayer.style.width=Math.max(0,r.width)+'px';
  roamLayer.style.height=innerHeight+'px';
}
function setRoamPosition(x,y,activity='explore'){
  if(!lifeAvatar||!roamLayer)return;
  const layer=roamLayer.getBoundingClientRect(),avatar=lifeAvatar.getBoundingClientRect();
  const maxX=Math.max(0,layer.width-avatar.width-10),maxY=Math.max(0,layer.height-avatar.height-10);
  const px=Math.max(8,Math.min(maxX,x)),py=Math.max(92,Math.min(maxY,y));
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
function goRipplet(activity='explore'){
  syncRoamBounds();
  if(activity==='drink'||activity==='eat'||activity==='sleep'||activity==='socialize'){
    const p=stationPosition(activity);if(p){setRoamPosition(p.x,p.y,activity);return}
  }
  const layer=roamLayer?.getBoundingClientRect();if(!layer)return;
  if(activity==='ledger'){setRoamPosition(layer.width*.72,Math.max(165,layer.height*.34),'ledger');return}
  const x=70+Math.random()*Math.max(60,layer.width-300);
  const y=190+Math.random()*Math.max(40,layer.height-430);
  window.XRPet3D?.perform?.('walk');
  setRoamPosition(x,y,'walk');
}
function roamingStep(){
  clearTimeout(roamTimer);
  goRipplet('explore');
  roamTimer=setTimeout(roamingStep,4200+Math.random()*5200);
}
function renderMind(){
  const labels={roam:'Roaming',drink:'Water Fountain',eat:'Food Station',sleep:'Sleep Pod',socialize:'Signal Friend',scan:'Scanning XRPL',wave:'Waving',dance:'Dancing',focus:'Focused'};
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
    needs:{food:state.lifeFood,water:state.lifeWater,rest:state.lifeRest,social:state.lifeSocial},
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
  if(['drink','eat','sleep','socialize'].includes(action)){
    performLifeActivity(action,false,Boolean(decision.visitStation));
  }else if(action==='roam'){
    state.lifeActivity='explore';window.XRPetRoam?.go?.('explore');
  }else if(['scan','wave','dance','focus'].includes(action)){
    window.XRPet3D?.perform?.(action);
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
    const options=['greet','happy','focus','scan','wave','dance'];
    const pick=options[Math.floor(Math.random()*options.length)];
    window.XRPet3D?.perform?.(pick);
    if(Math.random()<.35)playSound(pick==='dance'?'dance':pick==='wave'?'wave':pick==='scan'?'ledgerTx':'pet',true);
  }
  spontaneousReactionTimer=setTimeout(spontaneousRippletReaction,6500+Math.random()*9000);
}
function setRoamPinned(){
  roamPinned=false;state.lifePinned=false;state.lifeRoaming=true;state.lifeActivity='explore';persist();renderLife();
}
window.XRPetRoam={go:goRipplet,pin:()=>setRoamPinned(false),sync:syncRoamBounds};
addEventListener('resize',()=>{syncRoamBounds();goRipplet(state.lifeActivity||'explore')});
addEventListener('scroll',syncRoamBounds,{passive:true});
syncRoamBounds();setTimeout(()=>goRipplet('explore'),300);roamingStep();spontaneousRippletReaction();applyNftCompanion();
qa('[data-life-action]').forEach(b=>b.addEventListener('click',()=>performLifeActivity(b.dataset.lifeAction,true)));
setInterval(lifeTick,15000);
dailyVisit();render();registerVisitor();connectLedger();loadMarket();loadMarketHistory();connectMarketStream();loadUpdates();integrationCheck();setTimeout(runAutonomousMind,12000);setInterval(()=>{if(Date.now()-marketLastTickAt>15000)loadMarket()},15000);setInterval(loadMarketHistory,300000);setInterval(loadUpdates,15000);setInterval(integrationCheck,15000);

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
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('/sw.js').catch(err=>console.warn('XRPet service worker registration failed',err));
  },{once:true});
}

function closeCustomizationPanels(){
  qa('[data-customization-panel]').forEach(p=>p.classList.remove('is-open'));
  document.body.classList.remove('customization-open','workspace-open');
  const target=primaryView==='home'?'homeSection':primaryView==='live'?'xrplPanel':primaryView==='announcements'?'announcementsSection':primaryView==='ripplet'?'companionSection':primaryView==='ecosystem'?'ecosystemSection':primaryView==='games'?'gamesSection':'xrpHistorySection';
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
function setPrimaryView(view='home'){
  primaryView=view;
  qa('[data-view-section]').forEach(section=>section.classList.toggle('view-active',section.dataset.viewSection===view));
  qa('[data-primary-view]').forEach(b=>b.classList.toggle('active',b.dataset.primaryView===view));
  document.body.dataset.primaryView=view;
  qa('[data-customization-panel]').forEach(p=>p.classList.remove('is-open'));
  document.body.classList.remove('workspace-open','customization-open');
  const target=view==='home'?'homeSection':view==='live'?'xrplPanel':view==='announcements'?'announcementsSection':view==='ripplet'?'companionSection':view==='ecosystem'?'ecosystemSection':view==='games'?'gamesSection':'xrpHistorySection';
  setTimeout(()=>scrollSectionTop(target),10);
}
qa('[data-primary-view]').forEach(b=>b.addEventListener('click',()=>setPrimaryView(b.dataset.primaryView)));

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

q('#customizeDetails')?.addEventListener('toggle',e=>{
  if(e.target.open) q('#settingsDetails')?.removeAttribute('open');
});
q('#settingsDetails')?.addEventListener('toggle',e=>{
  if(e.target.open) q('#customizeDetails')?.removeAttribute('open');
});

setPrimaryView('home');
