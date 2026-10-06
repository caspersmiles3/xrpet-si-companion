const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
const STORE='xrpet-v2-state';
const safe=(fn)=>{try{return fn()}catch(e){console.warn(e);return null}};
const saved=safe(()=>JSON.parse(localStorage.getItem(STORE)||'{}'))||{};
const state={
  connected:false,ledgerIndex:null,txCount:0,baseFeeDrops:null,
  xrpPrice:null,xrpChange24h:null,
  petName:saved.petName||'NEXUS-589',personality:saved.personality||'Guardian',
  focus:saved.focus||'',xp:Number(saved.xp)||0,streak:Number(saved.streak)||0,
  lastVisitDate:saved.lastVisitDate||null,lastMissionDate:saved.lastMissionDate||null,
  room:saved.room||'nexus',cosmetic:saved.cosmetic||'classic',memories:Array.isArray(saved.memories)?saved.memories:[],
  account:saved.account||null,walletProvider:saved.walletProvider||'manual',
  explainLevel:saved.explainLevel||'balanced',notifyLevel:saved.notifyLevel||'quiet',
  truthMode:saved.truthMode!==false,marketMood:saved.marketMood!==false,
  floatingPinned:saved.floatingPinned===true,floatX:Number.isFinite(saved.floatX)?saved.floatX:null,floatY:Number.isFinite(saved.floatY)?saved.floatY:null,
  nftCompanion:saved.nftCompanion||null,
  companionKind:saved.companionKind||'nexus',companionGender:saved.companionGender||'boy',
  eyeStyle:saved.eyeStyle||'cyan',coreStyle:saved.coreStyle||'standard',headGear:saved.headGear||'none',trailStyle:saved.trailStyle||'none',
  graphicsQuality:saved.graphicsQuality||'auto',
  soundEnabled:saved.soundEnabled!==false,soundVolume:Number.isFinite(saved.soundVolume)?saved.soundVolume:35,
  interfaceSound:saved.interfaceSound!==false,ambientSound:saved.ambientSound!==false,ledgerSound:saved.ledgerSound!==false,
  signalLoreIndex:Number.isFinite(saved.signalLoreIndex)?saved.signalLoreIndex:0
};
const FORMS=[['Drop',0],['Ripple',50],['Wave',150],['Surge',350],['Nexus',700],['Titan',1200],['Legend',2000]];
const ROOM_NAMES={nexus:'Neon Horizon',ocean:'Ripple Sanctuary',vault:'Ledger Vault',aurora:'Sky Garden',legend:'Orbital Station'};
const COSMETIC_NAMES={classic:'Classic Nexus',aqua:'Ripple Scout',midnight:'Ledger Guardian',pearl:'Oracle Halo',solar:'Solar Vanguard',resonance:'589 Resonance'};
const COMPANION_NAMES={nexus:'Nexus',fox:'Ripple Fox',pup:'Ledger Pup',cat:'Vault Cat',bird:'Pulse Bird',turtle:'Wave Turtle'};
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
function persist(){safe(()=>localStorage.setItem(STORE,JSON.stringify({...state,connected:undefined,ledgerIndex:undefined,txCount:undefined,baseFeeDrops:undefined,xrpPrice:undefined,xrpChange24h:undefined})))}
function form(){return [...FORMS].reverse().find(x=>state.xp>=x[1])||FORMS[0]}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function setText(sel,text){const el=q(sel);if(el)el.textContent=text}
function mood(label,speech,cls='calm'){setText('#petMood',label);setText('#petSpeech',speech);const action=cls==='alert'?'alert':cls==='energized'?'happy':'greet';window.XRPet3D?.react?.(action);window.dispatchEvent(new CustomEvent('xrpet:appearance',{detail:{room:state.room,cosmetic:state.cosmetic,companionKind:state.companionKind,companionGender:state.companionGender,eyeStyle:state.eyeStyle,coreStyle:state.coreStyle,headGear:state.headGear,trailStyle:state.trailStyle,mood:cls}}))}
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

function bindEquipment(selector,key,label){
  qa(selector).forEach(b=>b.addEventListener('click',()=>{
    state[key]=b.dataset[key];persist();render();playSound('cosmetic');
    setText('#petMood','Reconfigured');setText('#petSpeech',label+' updated. XRPL equipment matrix synchronized.');
  }));
}
bindEquipment('[data-eye-style]','eyeStyle','Eye signal');
bindEquipment('[data-core-style]','coreStyle','Chest core');
bindEquipment('[data-head-gear]','headGear','Head hardware');
bindEquipment('[data-trail-style]','trailStyle','Signal trail');

qa('.room-choice').forEach(b=>{const rank=FORMS.findIndex(x=>x[0]===name),need=b.dataset.room==='aurora'?2:b.dataset.room==='legend'?5:0;b.disabled=rank<need;const active=b.dataset.room===state.room;b.classList.toggle('active',active);const e=b.querySelector('em');if(e&&active)e.textContent='Active';else if(e)e.textContent=need?((b.dataset.room==='aurora')?'Wave+':'Titan+'):'Unlocked'}); qa('.cosmetic-choice').forEach(b=>{const active=b.dataset.cosmetic===state.cosmetic;b.classList.toggle('active',active);const e=b.querySelector('em');if(e)e.textContent=active?'Equipped':'Owned'});
  document.body.classList.remove('room-nexus','room-ocean','room-vault','room-aurora','room-legend');document.body.classList.add('room-'+state.room); const pet=q('#pet'); if(pet){pet.classList.remove('skin-classic','skin-aqua','skin-midnight','skin-pearl','skin-solar','skin-resonance');pet.classList.add('skin-'+state.cosmetic)}
  setText('#unlocksChip',(['nexus','ocean','vault'].length+(FORMS.findIndex(x=>x[0]===name)>=2?1:0)+(FORMS.findIndex(x=>x[0]===name)>=5?1:0))+' unlocked');setText('#homeRoom',ROOM_NAMES[state.room]||state.room);setText('#homeCosmetic',COSMETIC_NAMES[state.cosmetic]||state.cosmetic);setText('#homeCompanionModel',COMPANION_NAMES[state.companionKind]||state.companionKind);setText('#homeCompanionGender',(state.companionGender==='girl'?'Girl':'Boy')+' companion');setText('#companionModelChip',(COMPANION_NAMES[state.companionKind]||state.companionKind)+' · '+(state.companionGender==='girl'?'Girl':'Boy'));
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
  renderMemory();renderSignal589();
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
async function loadMarket(){try{const r=await fetch('/api/market',{cache:'no-store'});const d=await r.json();if(!r.ok)throw new Error();state.xrpPrice=Number(d.price);state.xrpChange24h=Number(d.change24h);renderSignal589();setText('#xrpPrice',Number.isFinite(state.xrpPrice)?'$'+state.xrpPrice.toFixed(4):'Unavailable');setText('#xrpChange',Number.isFinite(state.xrpChange24h)?(state.xrpChange24h>=0?'+':'')+state.xrpChange24h.toFixed(2)+'% · 24h':'24h unavailable');if(state.marketMood&&Number.isFinite(state.xrpChange24h)&&Math.abs(state.xrpChange24h)>=5)mood(state.xrpChange24h>0?'Excited':'Watchful','XRP moved '+Math.abs(state.xrpChange24h).toFixed(2)+'% over 24 hours. Movement is not a prediction.',state.xrpChange24h>0?'energized':'alert')}catch{setText('#xrpPrice','Unavailable');setText('#xrpChange','Market feed offline');renderSignal589()}}
async function loadUpdates(){const box=q('#updates');if(box)box.innerHTML='<p class="muted">Checking official Ripple and XRPL sources…</p>';try{const r=await fetch('/api/updates',{cache:'no-store'});const d=await r.json();if(!r.ok||!Array.isArray(d.items)||!d.items.length)throw new Error();box.innerHTML=d.items.slice(0,9).map(x=>'<div class="update"><a href="'+esc(x.url)+'" target="_blank" rel="noopener">'+esc(x.title)+'</a><small>'+esc(x.source)+' · '+esc(x.label||'CONFIRMED')+'</small></div>').join('')}catch{if(box)box.innerHTML='<p class="muted">Official update feed is temporarily unavailable.</p>'}}
let ws,retry,watchedSubscribed=null;
function subscribeAccount(a){if(!a||!ws||ws.readyState!==1)return;if(watchedSubscribed&&watchedSubscribed!==a)ws.send(JSON.stringify({id:'unwatch',command:'unsubscribe',accounts:[watchedSubscribed]}));ws.send(JSON.stringify({id:'watch',command:'subscribe',accounts:[a]}));watchedSubscribed=a}
function connectLedger(){clearTimeout(retry);try{ws=new WebSocket('wss://xrplcluster.com/')}catch{return scheduleReconnect()}
  ws.onopen=()=>{state.connected=true;renderSignal589();setText('#status','Live');const b=q('#liveBadge');if(b){b.className='status-pill live';b.innerHTML='<i></i><span>XRPL Live</span>'}mood('Connected','Live XRPL data is flowing.','calm');ws.send(JSON.stringify({id:'ledger',command:'subscribe',streams:['ledger','server']}));ws.send(JSON.stringify({id:'fee',command:'fee'}));if(state.account)subscribeAccount(state.account)};
  ws.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch{return}if(m.type==='ledgerClosed'){state.ledgerIndex=m.ledger_index;state.txCount=m.txn_count??0;state.baseFeeDrops=m.fee_base??state.baseFeeDrops;setText('#ledger',Number(m.ledger_index).toLocaleString());setText('#txCount',(m.txn_count??0)+' transactions');if(m.fee_base!=null)setText('#fee',m.fee_base);renderSignal589()}else if(m.type==='serverStatus'){setText('#serverState',m.server_status||'Connected')}else if(m.id==='fee'&&m.result){const drops=m.result?.drops?.base_fee;if(drops!=null){state.baseFeeDrops=Number(drops);setText('#fee',drops)}}else if(m.id==='xrpet-nfts'&&Array.isArray(m.result?.account_nfts)){
    renderNfts(m.result.account_nfts);
  }else if(m.type==='transaction'&&state.account){window.XRPet3D?.celebrate?.();if(state.ledgerSound)playSound('ledgerTx');mood('Wallet activity','Validated activity detected on the watched account.','energized');addXp(3)}};
  ws.onclose=()=>{state.connected=false;renderSignal589();setText('#status','Reconnecting');const b=q('#liveBadge');if(b){b.className='status-pill waiting';b.innerHTML='<i></i><span>Reconnecting</span>'}scheduleReconnect()};ws.onerror=()=>safe(()=>ws.close())
}
function scheduleReconnect(){clearTimeout(retry);retry=setTimeout(connectLedger,4000)}
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
      persist();applyNftCompanion();mood('NFT companion','XRPL NFT companion equipped.','energized');
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
    setText('#nftStatus','NFT artwork could not load; your regular companion has been restored.');
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
bind('#refreshNews','click',()=>{loadUpdates();loadMarket()});bind('#profileForm','submit',e=>{e.preventDefault();state.petName=q('#profileName').value.trim()||'NEXUS-589';state.personality=q('#profilePersonality').value;state.focus=q('#profileFocus').value.trim();persist();render();playSound('success');mood('Personalized',state.petName+' is now running '+state.personality+' mode.','calm')});
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
qa('.room-choice').forEach(b=>b.addEventListener('click',()=>{if(b.disabled)return;state.room=b.dataset.room;persist();render();playSound('room');setRoomAmbience(state.room);mood('Theme changed','The entire XRPet interface is now running '+b.querySelector('strong')?.textContent+'.','calm')})); qa('.cosmetic-choice').forEach(b=>b.addEventListener('click',()=>{state.cosmetic=b.dataset.cosmetic;state.nftCompanion=null;persist();applyNftCompanion();render();mood('Reconfigured','Companion build changed to '+b.querySelector('strong')?.textContent+'.','energized')}));
qa('[data-scroll]').forEach(b=>b.addEventListener('click',()=>q('#'+b.dataset.scroll)?.scrollIntoView({behavior:'smooth',block:'center'})));
bind('#explainLevel','change',e=>{state.explainLevel=e.target.value;persist()});bind('#notifyLevel','change',e=>{state.notifyLevel=e.target.value;persist()});bind('#truthToggle','change',e=>{state.truthMode=e.target.checked;persist();renderSignal589()});bind('#marketMoodToggle','change',e=>{state.marketMood=e.target.checked;persist()});
bind('#graphicsQuality','change',e=>{
  state.graphicsQuality=e.target.value;persist();playSound('select');
  setText('#petSpeech','Graphics mode saved. Reload XRPet to apply the new 3D quality profile.');
});
bind('#notifyButton','click',async()=>{if(!('Notification'in window)){playSound('error');alert('Browser notifications are not supported here.');return}const p=await Notification.requestPermission();if(p==='granted')new Notification('XRPet alerts enabled',{body:'Browser alerts are ready while XRPet is open.'});});
bind('#refreshIntegrations','click',integrationCheck);bind('#loadNfts','click',requestNfts);
bind('#useNativeCompanion','click',()=>{
  state.nftCompanion=null;persist();applyNftCompanion();render();playSound('companion');
  mood('Native companion','Returned to the XRPet 3D companion roster.','calm');
});

bind('#globalSearchForm','submit',e=>{
  e.preventDefault();
  const term=(q('#globalSearch')?.value||'').trim().toLowerCase();
  if(!term)return;
  const map=[
    [['589','signal','community','lore','theory','theories'], '#signal589Section'],
    [['room','rooms','environment'], '#roomsSection'],
    [['cosmetic','skin','appearance','equipment','eye','core','trail','halo'], '#cosmeticsSection'],
    [['wallet','xaman','gemwallet'], '#walletPanel'],
    [['chat','ask','si','assistant'], '#chatPanel'],
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
  open:{tones:[[310,620,0,.16,'triangle'],[620,930,.1,.22,'sine'],[930,1240,.22,.22,'sine']],gain:.115,noise:.02}
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
  legend:{freq:[46.25,92.5,185],gain:.016,filter:470}
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
    g.gain.value=i===0?.62:i===1?.25:.13;
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

const launchGate=q('#launchGate'),launchCore=q('#launchCore'),launchEnter=q('#launchEnter');
const launchBar=q('#launchProgressBar'),launchPercent=q('#launchPercent'),launchPhase=q('#launchPhase'),launchStatus=q('#launchStatus');
let launchProgress=0,launchHolding=false,launchRAF=0,launchOpened=false,launchLast=0,launchSoundStage=-1;

function setLaunchVisual(p){
  launchProgress=Math.max(0,Math.min(1,p));
  const soundStage=launchProgress>=1?4:launchProgress>=.7?3:launchProgress>=.42?2:launchProgress>=.18?1:0;
  if(soundStage>launchSoundStage){launchSoundStage=soundStage;if(soundStage>0)playSound(soundStage===4?'open':'launchStage',true)}
  launchGate?.style.setProperty('--sync',String(launchProgress));
  if(launchBar)launchBar.style.width=Math.round(launchProgress*100)+'%';
  setText('#launchPercent',Math.round(launchProgress*100)+'%');

  launchGate?.classList.toggle('phase-1',launchProgress>=.18);
  launchGate?.classList.toggle('phase-2',launchProgress>=.42);
  launchGate?.classList.toggle('phase-3',launchProgress>=.7);

  if(launchProgress<.18){
    setText('#launchPhase','XRPL LINK STANDBY');
    if(launchHolding)setText('#launchStatus','Establishing secure ledger link…');
  }else if(launchProgress<.42){
    setText('#launchPhase','NODE PATH VERIFIED');
    setText('#launchStatus','XRPL path confirmed. Synchronizing ledger state…');
  }else if(launchProgress<.7){
    setText('#launchPhase','LEDGER SYNC');
    setText('#launchStatus','Validated network signal acquired. Waking companion core…');
  }else if(launchProgress<1){
    setText('#launchPhase','COMPANION WAKE');
    setText('#launchStatus','Companion identity and room state are coming online…');
  }
}

function completeLaunch(fromFallback=false){
  if(launchOpened)return;
  launchOpened=true;launchHolding=false;cancelAnimationFrame(launchRAF);
  setLaunchVisual(1);
  launchGate?.classList.add('sync-complete');
  setText('#launchPhase','XRPL LINK READY');
  setText('#launchStatus',fromFallback?'Opening XRPet…':'Synchronization complete. Welcome to XRPet.');
  try{if(state.soundEnabled)playSound('success',true)}catch{}
  setTimeout(()=>{
    launchGate?.classList.add('launch-complete');
    document.body.classList.remove('launch-locked');
    setTimeout(()=>launchGate?.remove(),850);
    window.XRPet3D?.react?.();
    window.dispatchEvent(new CustomEvent('xrpet:launch-complete'));setTimeout(()=>setRoomAmbience(state.room),120);
  },560);
}

function launchTick(ts){
  if(!launchHolding||launchOpened)return;
  if(!launchLast)launchLast=ts;
  const dt=Math.min(48,ts-launchLast);launchLast=ts;
  const reduced=matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  launchProgress+=dt/(reduced?650:1750);
  setLaunchVisual(launchProgress);
  if(launchProgress>=1){completeLaunch(false);return}
  launchRAF=requestAnimationFrame(launchTick);
}

function beginLaunchHold(e){
  if(launchOpened)return;
  e?.preventDefault?.();
  launchHolding=true;launchLast=0;
  launchCore?.classList.add('is-holding');
  try{if(state.soundEnabled)playSound('launch',true)}catch{}
  cancelAnimationFrame(launchRAF);launchRAF=requestAnimationFrame(launchTick);
}
function endLaunchHold(){
  if(launchOpened)return;
  launchHolding=false;launchLast=0;launchCore?.classList.remove('is-holding');cancelAnimationFrame(launchRAF);
  if(launchProgress<1){
    setText('#launchStatus',launchProgress>.1?'Hold a little longer to complete the ledger sync.':'Press and hold the XRP core to synchronize.');
  }
}

launchCore?.addEventListener('pointerdown',beginLaunchHold);
launchCore?.addEventListener('pointerup',endLaunchHold);
launchCore?.addEventListener('pointercancel',endLaunchHold);
launchCore?.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')endLaunchHold()});
launchCore?.addEventListener('keydown',e=>{if((e.key===' '||e.key==='Enter')&&!launchHolding)beginLaunchHold(e)});
launchCore?.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter')endLaunchHold()});
launchEnter?.addEventListener('click',()=>completeLaunch(true));

if(launchGate){
  setLaunchVisual(0);
  setTimeout(()=>{if(!launchOpened&&launchEnter){launchEnter.hidden=false;setText('#launchStatus','Hold the core to synchronize, or enter XRPet directly.')}},6500);
}else{
  document.body.classList.remove('launch-locked');
}


bind('#studioViewFront','click',()=>window.XRPet3D?.cameraPreset?.('front'));
bind('#studioViewThreeQuarter','click',()=>window.XRPet3D?.cameraPreset?.('threeQuarter'));
bind('#studioViewProfile','click',()=>window.XRPet3D?.cameraPreset?.('profile'));
bind('#studioResetCamera','click',()=>window.XRPet3D?.reset?.());

const floatEl=q('#floatingCompanion'),floatHandle=q('#floatingHandle');
let floatPinned=state.floatingPinned,dragFloat=false,dragDX=0,dragDY=0,floatRAF=0;
function clampFloat(){
  if(!floatEl)return;
  if(floatEl.classList.contains('studio-docked')){floatEl.style.left='';floatEl.style.top='';floatEl.style.right='';floatEl.style.bottom='';return}
  const r=floatEl.getBoundingClientRect();
  let x=state.floatX??(innerWidth-r.width-28), y=state.floatY??(innerHeight-r.height-22);
  x=Math.max(0,Math.min(innerWidth-r.width,x));y=Math.max(0,Math.min(innerHeight-r.height,y));
  state.floatX=x;state.floatY=y;
  floatEl.style.left=x+'px';floatEl.style.top=y+'px';floatEl.style.right='auto';floatEl.style.bottom='auto';
}
function setPinned(v){
  floatPinned=v;state.floatingPinned=v;persist();
  if(floatEl?.classList.contains('studio-docked')){
    setText('#toggleFloat','Studio');setText('#floatingModeLabel','Interactive studio · orbit, zoom, and configure');
    return;
  }
  setText('#toggleFloat',v?'Unpin':'Pin');setText('#floatingModeLabel',v?'pinned · drag tag to move':'auto levitate · drag tag to place');
}
function animateFloat(t){
  if(floatEl&&!floatEl.classList.contains('studio-docked')&&!floatPinned&&!dragFloat){
    const r=floatEl.getBoundingClientRect();
    const maxX=Math.max(0,innerWidth-r.width),maxY=Math.max(0,innerHeight-r.height);
    const x=maxX*(.5+.34*Math.sin(t/8500)+.10*Math.sin(t/3100));
    const y=maxY*(.5+.28*Math.sin(t/6900+1.2)+.08*Math.sin(t/2300));
    floatEl.style.left=Math.max(0,Math.min(maxX,x))+'px';
    floatEl.style.top=Math.max(0,Math.min(maxY,y))+'px';
    floatEl.style.right='auto';floatEl.style.bottom='auto';
  }
  floatRAF=requestAnimationFrame(animateFloat);
}
floatHandle?.addEventListener('pointerdown',e=>{
  if(floatEl?.classList.contains('studio-docked'))return;
  dragFloat=true;setPinned(true);const r=floatEl.getBoundingClientRect();dragDX=e.clientX-r.left;dragDY=e.clientY-r.top;floatHandle.setPointerCapture?.(e.pointerId);e.preventDefault();
});
floatHandle?.addEventListener('pointermove',e=>{
  if(!dragFloat)return;const r=floatEl.getBoundingClientRect();
  const x=Math.max(0,Math.min(innerWidth-r.width,e.clientX-dragDX)),y=Math.max(0,Math.min(innerHeight-r.height,e.clientY-dragDY));
  state.floatX=x;state.floatY=y;floatEl.style.left=x+'px';floatEl.style.top=y+'px';floatEl.style.right='auto';floatEl.style.bottom='auto';
});
floatHandle?.addEventListener('pointerup',e=>{if(!dragFloat)return;dragFloat=false;floatHandle.releasePointerCapture?.(e.pointerId);persist()});
qa('.floating-controls button').forEach(b=>b.addEventListener('pointerdown',e=>e.stopPropagation()));
bind('#toggleFloat','click',()=>{if(floatEl?.classList.contains('studio-docked'))return;setPinned(!floatPinned)});
bind('#centerFloat','click',()=>{if(floatEl?.classList.contains('studio-docked')){window.XRPet3D?.reset?.();return}setPinned(true);if(floatEl){const r=floatEl.getBoundingClientRect();state.floatX=Math.max(0,(innerWidth-r.width)/2);state.floatY=Math.max(0,(innerHeight-r.height)/2);clampFloat();persist()}});
addEventListener('resize',()=>{if(floatEl?.classList.contains('studio-docked'))clampFloat();else if(floatPinned)clampFloat()});
clampFloat();setPinned(floatPinned);requestAnimationFrame(animateFloat);applyNftCompanion();

let controlsHideTimer=null;
function revealFloatControls(){
  if(!floatEl)return;
  floatEl.classList.remove('controls-hidden');
  clearTimeout(controlsHideTimer);
  controlsHideTimer=setTimeout(()=>{if(!dragFloat&&!floatEl.matches(':hover')&&!floatEl.matches(':focus-within'))floatEl.classList.add('controls-hidden')},4800);
}
floatEl?.addEventListener('pointerenter',revealFloatControls);
floatEl?.addEventListener('pointerleave',()=>{
  clearTimeout(controlsHideTimer);
  controlsHideTimer=setTimeout(()=>{if(!dragFloat)floatEl.classList.add('controls-hidden')},2000);
});
floatEl?.addEventListener('focusin',revealFloatControls);
floatEl?.addEventListener('focusout',()=>setTimeout(()=>{if(!floatEl.matches(':focus-within'))floatEl.classList.add('controls-hidden')},2200));
revealFloatControls();


dailyVisit();render();connectLedger();loadMarket();loadUpdates();integrationCheck();setInterval(loadMarket,120000);setInterval(integrationCheck,60000);

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('/sw.js').catch(err=>console.warn('XRPet service worker registration failed',err));
  },{once:true});
}
