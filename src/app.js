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
  soundEnabled:saved.soundEnabled===true,soundVolume:Number.isFinite(saved.soundVolume)?saved.soundVolume:35
};
const FORMS=[['Drop',0],['Ripple',50],['Wave',150],['Surge',350],['Nexus',700],['Titan',1200],['Legend',2000]];
const ROOM_NAMES={nexus:'Neon Horizon',ocean:'Ripple Sanctuary',vault:'Ledger Vault',aurora:'Sky Garden',legend:'Orbital Station'};
const COSMETIC_NAMES={classic:'Classic Nexus',aqua:'Ripple Scout',midnight:'Ledger Guardian',pearl:'Oracle Halo',solar:'Solar Vanguard'};
const COMPANION_NAMES={nexus:'Nexus',fox:'Ripple Fox',pup:'Ledger Pup',cat:'Vault Cat',bird:'Pulse Bird',turtle:'Wave Turtle'};
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
function mood(label,speech,cls='calm'){setText('#petMood',label);setText('#petSpeech',speech);const action=cls==='alert'?'alert':cls==='energized'?'happy':'greet';window.XRPet3D?.react?.(action);window.dispatchEvent(new CustomEvent('xrpet:appearance',{detail:{room:state.room,cosmetic:state.cosmetic,companionKind:state.companionKind,companionGender:state.companionGender,mood:cls}}))}
function render(){
  const [name,min]=form(); const i=FORMS.findIndex(x=>x[0]===name); const next=FORMS[Math.min(i+1,FORMS.length-1)];
  setText('#petName',state.petName);setText('#chatPetName',state.petName);setText('#topPetName',state.petName);setText('#floatingPetName',state.petName);setText('#evolution',name.toUpperCase());
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
  qa('.room-choice').forEach(b=>{const rank=FORMS.findIndex(x=>x[0]===name),need=b.dataset.room==='aurora'?2:b.dataset.room==='legend'?5:0;b.disabled=rank<need;const active=b.dataset.room===state.room;b.classList.toggle('active',active);const e=b.querySelector('em');if(e&&active)e.textContent='Active';else if(e)e.textContent=need?((b.dataset.room==='aurora')?'Wave+':'Titan+'):'Unlocked'}); qa('.cosmetic-choice').forEach(b=>{const active=b.dataset.cosmetic===state.cosmetic;b.classList.toggle('active',active);const e=b.querySelector('em');if(e)e.textContent=active?'Equipped':'Owned'});
  document.body.classList.remove('room-nexus','room-ocean','room-vault','room-aurora','room-legend');document.body.classList.add('room-'+state.room); const pet=q('#pet'); if(pet){pet.classList.remove('skin-classic','skin-aqua','skin-midnight','skin-pearl','skin-solar');pet.classList.add('skin-'+state.cosmetic)}
  setText('#unlocksChip',(['nexus','ocean','vault'].length+(FORMS.findIndex(x=>x[0]===name)>=2?1:0)+(FORMS.findIndex(x=>x[0]===name)>=5?1:0))+' unlocked');setText('#homeRoom',ROOM_NAMES[state.room]||state.room);setText('#homeCosmetic',COSMETIC_NAMES[state.cosmetic]||state.cosmetic);setText('#homeCompanionModel',COMPANION_NAMES[state.companionKind]||state.companionKind);setText('#homeCompanionGender',(state.companionGender==='girl'?'Girl':'Boy')+' companion');setText('#companionModelChip',(COMPANION_NAMES[state.companionKind]||state.companionKind)+' · '+(state.companionGender==='girl'?'Girl':'Boy'));
  if(q('#explainLevel'))q('#explainLevel').value=state.explainLevel;if(q('#notifyLevel'))q('#notifyLevel').value=state.notifyLevel;
  if(q('#truthToggle'))q('#truthToggle').checked=state.truthMode;if(q('#marketMoodToggle'))q('#marketMoodToggle').checked=state.marketMood;
  if(q('#soundToggle'))q('#soundToggle').checked=state.soundEnabled;if(q('#soundVolume'))q('#soundVolume').value=state.soundVolume;
  qa('.companion-choice').forEach(b=>b.classList.toggle('active',b.dataset.companion===state.companionKind));qa('.gender-choice').forEach(b=>b.classList.toggle('active',b.dataset.gender===state.companionGender));
  window.dispatchEvent(new CustomEvent('xrpet:appearance',{detail:{room:state.room,cosmetic:state.cosmetic,companionKind:state.companionKind,companionGender:state.companionGender,mood:state.networkMood||'calm'}}));
  renderMemory();
}
function renderMemory(){const box=q('#memoryList');if(!box)return;box.innerHTML=state.memories.length?state.memories.map((m,i)=>'<span class="memory-chip">'+esc(m)+' <button type="button" data-rm="'+i+'">×</button></span>').join(''):'<span class="muted">No saved preferences.</span>';qa('[data-rm]').forEach(b=>b.addEventListener('click',()=>{state.memories.splice(Number(b.dataset.rm),1);persist();renderMemory()}))}
function addXp(n){state.xp+=n;persist();render()}
function dailyVisit(){const t=new Date().toISOString().slice(0,10);if(state.lastVisitDate!==t){const y=new Date(Date.now()-86400000).toISOString().slice(0,10);state.streak=state.lastVisitDate===y?state.streak+1:1;state.lastVisitDate=t;state.xp+=5;persist()}}
function bubble(text,type='assistant'){const box=q('#chat');if(!box)return;const d=document.createElement('div');d.className='bubble '+type;d.textContent=text;box.appendChild(d);box.scrollTop=box.scrollHeight}
function context(){return{connected:state.connected,ledgerIndex:state.ledgerIndex,txCount:state.txCount,baseFeeDrops:state.baseFeeDrops,petName:state.petName,personality:state.personality,focus:state.focus,explainLevel:state.explainLevel,memories:state.memories}}
async function ask(message){
  bubble(message,'user');bubble('Thinking…','assistant');const box=q('#chat');const pending=box?.lastElementChild;
  try{const r=await fetch('/api/companion',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message,context:context()})});const d=await r.json();if(!r.ok)throw new Error(d.error||'SI request failed');if(pending)pending.textContent=d.reply||'No response returned.'}
  catch(e){if(pending)pending.textContent='SI is unavailable right now: '+e.message}
}
async function loadMarket(){try{const r=await fetch('/api/market',{cache:'no-store'});const d=await r.json();if(!r.ok)throw new Error();state.xrpPrice=Number(d.price);state.xrpChange24h=Number(d.change24h);setText('#xrpPrice',Number.isFinite(state.xrpPrice)?'$'+state.xrpPrice.toFixed(4):'Unavailable');setText('#xrpChange',Number.isFinite(state.xrpChange24h)?(state.xrpChange24h>=0?'+':'')+state.xrpChange24h.toFixed(2)+'% · 24h':'24h unavailable');if(state.marketMood&&Number.isFinite(state.xrpChange24h)&&Math.abs(state.xrpChange24h)>=5)mood(state.xrpChange24h>0?'Excited':'Watchful','XRP moved '+Math.abs(state.xrpChange24h).toFixed(2)+'% over 24 hours. Movement is not a prediction.',state.xrpChange24h>0?'energized':'alert')}catch{setText('#xrpPrice','Unavailable');setText('#xrpChange','Market feed offline')}}
async function loadUpdates(){const box=q('#updates');if(box)box.innerHTML='<p class="muted">Checking official Ripple and XRPL sources…</p>';try{const r=await fetch('/api/updates',{cache:'no-store'});const d=await r.json();if(!r.ok||!Array.isArray(d.items)||!d.items.length)throw new Error();box.innerHTML=d.items.slice(0,9).map(x=>'<div class="update"><a href="'+esc(x.url)+'" target="_blank" rel="noopener">'+esc(x.title)+'</a><small>'+esc(x.source)+' · '+esc(x.label||'CONFIRMED')+'</small></div>').join('')}catch{if(box)box.innerHTML='<p class="muted">Official update feed is temporarily unavailable.</p>'}}
let ws,retry,watchedSubscribed=null;
function subscribeAccount(a){if(!a||!ws||ws.readyState!==1)return;if(watchedSubscribed&&watchedSubscribed!==a)ws.send(JSON.stringify({id:'unwatch',command:'unsubscribe',accounts:[watchedSubscribed]}));ws.send(JSON.stringify({id:'watch',command:'subscribe',accounts:[a]}));watchedSubscribed=a}
function connectLedger(){clearTimeout(retry);try{ws=new WebSocket('wss://xrplcluster.com/')}catch{return scheduleReconnect()}
  ws.onopen=()=>{state.connected=true;setText('#status','Live');const b=q('#liveBadge');if(b){b.className='status-pill live';b.innerHTML='<i></i><span>XRPL Live</span>'}mood('Connected','Live XRPL data is flowing.','calm');ws.send(JSON.stringify({id:'ledger',command:'subscribe',streams:['ledger','server']}));ws.send(JSON.stringify({id:'fee',command:'fee'}));if(state.account)subscribeAccount(state.account)};
  ws.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch{return}if(m.type==='ledgerClosed'){state.ledgerIndex=m.ledger_index;state.txCount=m.txn_count??0;state.baseFeeDrops=m.fee_base??state.baseFeeDrops;setText('#ledger',Number(m.ledger_index).toLocaleString());setText('#txCount',(m.txn_count??0)+' transactions');if(m.fee_base!=null)setText('#fee',m.fee_base)}else if(m.type==='serverStatus'){setText('#serverState',m.server_status||'Connected')}else if(m.id==='fee'&&m.result){const drops=m.result?.drops?.base_fee;if(drops!=null){state.baseFeeDrops=Number(drops);setText('#fee',drops)}}else if(m.id==='xrpet-nfts'&&Array.isArray(m.result?.account_nfts)){
    renderNfts(m.result.account_nfts);
  }else if(m.type==='transaction'&&state.account){window.XRPet3D?.celebrate?.();playSound('success');mood('Wallet activity','Validated activity detected on the watched account.','energized');addXp(3)}};
  ws.onclose=()=>{state.connected=false;setText('#status','Reconnecting');const b=q('#liveBadge');if(b){b.className='status-pill waiting';b.innerHTML='<i></i><span>Reconnecting</span>'}scheduleReconnect()};ws.onerror=()=>safe(()=>ws.close())
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
bind('#refreshNews','click',()=>{loadUpdates();loadMarket()});bind('#profileForm','submit',e=>{e.preventDefault();state.petName=q('#profileName').value.trim()||'NEXUS-589';state.personality=q('#profilePersonality').value;state.focus=q('#profileFocus').value.trim();persist();render();mood('Personalized',state.petName+' is now running '+state.personality+' mode.','calm')});
bind('#memoryForm','submit',e=>{e.preventDefault();const i=q('#memoryInput');const v=i.value.trim();if(!v)return;state.memories.push(v);state.memories=state.memories.slice(-8);i.value='';persist();renderMemory()});
bind('#watchForm','submit',e=>{e.preventDefault();const a=q('#account').value.trim();if(!/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(a)){setText('#walletState','That does not look like a valid XRPL classic address.');return}state.account=a;state.walletProvider='manual';persist();subscribeAccount(a);render();mood('Watching wallet','Public account watch is active.','calm')});
bind('#clearWallet','click',()=>{if(watchedSubscribed&&ws?.readyState===1)ws.send(JSON.stringify({id:'unwatch',command:'unsubscribe',accounts:[watchedSubscribed]}));watchedSubscribed=null;state.account=null;state.walletProvider='manual';persist();render();setText('#walletConnection','No wallet connected. Public wallet watch still works.')});
bind('#connectXaman','click',connectXaman);bind('#connectGem','click',connectGem);
let charge=0;bind('#charge','click',()=>{const t=new Date().toISOString().slice(0,10);if(state.lastMissionDate===t){mood('Complete','Today’s core mission is already complete.','calm');return}charge=Math.min(7,charge+1);setText('#chargeCount',charge+'/7');if(q('#meterFill'))q('#meterFill').style.width=(charge/7*100)+'%';if(charge===7){state.lastMissionDate=t;addXp(15);setText('#missionText','Mission complete. +15 XP. New pulse tomorrow.');mood('Charged','Core synchronized. Mission complete.','energized')}});
qa('.companion-choice').forEach(b=>b.addEventListener('click',()=>{state.companionKind=b.dataset.companion;state.nftCompanion=null;persist();applyNftCompanion();render();mood('Companion changed',(COMPANION_NAMES[state.companionKind]||state.companionKind)+' is now your active companion.','energized')}));
qa('.gender-choice').forEach(b=>b.addEventListener('click',()=>{state.companionGender=b.dataset.gender;state.nftCompanion=null;persist();applyNftCompanion();render();mood('Companion updated',(state.companionGender==='girl'?'Girl':'Boy')+' companion presentation selected.','calm')}));
qa('[data-pet-action]').forEach(b=>b.addEventListener('click',()=>{
  const action=b.dataset.petAction;
  state.nftCompanion=null;applyNftCompanion();
  window.XRPet3D?.perform?.(action);
  if(action==='celebrate'){playSound('success');setText('#petMood','Celebrating');setText('#petSpeech','Ledger core charged. Celebration sequence active.')}
  else if(action==='alert'){playSound('cosmetic');setText('#petMood','Alert');setText('#petSpeech','Sensors focused. Watching the ledger closely.')}
  else if(action==='sleep'){playSound('tap');setText('#petMood','Resting');setText('#petSpeech','Low-power rest mode. I am still watching quietly.')}
  else{playSound('pet');setText('#petMood','Hello');setText('#petSpeech','Companion link acknowledged.')}
}));
qa('.room-choice').forEach(b=>b.addEventListener('click',()=>{if(b.disabled)return;state.room=b.dataset.room;persist();render();mood('Theme changed','The entire XRPet interface is now running '+b.querySelector('strong')?.textContent+'.','calm')})); qa('.cosmetic-choice').forEach(b=>b.addEventListener('click',()=>{state.cosmetic=b.dataset.cosmetic;state.nftCompanion=null;persist();applyNftCompanion();render();mood('Reconfigured','Companion build changed to '+b.querySelector('strong')?.textContent+'.','energized')}));
qa('[data-scroll]').forEach(b=>b.addEventListener('click',()=>q('#'+b.dataset.scroll)?.scrollIntoView({behavior:'smooth',block:'center'})));
bind('#explainLevel','change',e=>{state.explainLevel=e.target.value;persist()});bind('#notifyLevel','change',e=>{state.notifyLevel=e.target.value;persist()});bind('#truthToggle','change',e=>{state.truthMode=e.target.checked;persist()});bind('#marketMoodToggle','change',e=>{state.marketMood=e.target.checked;persist()});
bind('#notifyButton','click',async()=>{if(!('Notification'in window)){alert('Browser notifications are not supported here.');return}const p=await Notification.requestPermission();if(p==='granted')new Notification('XRPet alerts enabled',{body:'Browser alerts are ready while XRPet is open.'});});
bind('#refreshIntegrations','click',integrationCheck);bind('#loadNfts','click',requestNfts);

bind('#globalSearchForm','submit',e=>{
  e.preventDefault();
  const term=(q('#globalSearch')?.value||'').trim().toLowerCase();
  if(!term)return;
  const map=[
    [['room','rooms','environment'], '#roomsSection'],
    [['cosmetic','skin','appearance'], '#cosmeticsSection'],
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
window.addEventListener('xrpet:model-ready',e=>{
  const d=e.detail||{};setText('#modelRuntimeMode','Rigged GLB · '+(COMPANION_NAMES[d.kind]||d.kind||'Companion'));
});
window.addEventListener('xrpet:model-fallback',e=>{
  const d=e.detail||{};setText('#modelRuntimeMode','Procedural fallback · '+(COMPANION_NAMES[d.kind]||d.kind||'Companion'));
});



let audioContext=null,lastSoundAt=0;
function playSound(kind='tap',force=false){
  if(!force&&!state.soundEnabled)return;
  const now=performance.now();
  if(!force&&now-lastSoundAt<95)return;
  lastSoundAt=now;
  try{
    const Context=window.AudioContext||window.webkitAudioContext;
    if(!Context)return;
    if(!audioContext)audioContext=new Context();
    if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
    const t=audioContext.currentTime+0.01;
    const volume=Math.max(0,Math.min(.85,state.soundVolume/100*.4));
    const tones=kind==='pet'?[[440,660,.0,.18,'sine'],[660,990,.1,.23,'sine']]:
      kind==='room'?[[220,440,0,.24,'sine'],[330,660,.12,.27,'triangle']]:
      kind==='cosmetic'?[[480,600,0,.09,'triangle'],[710,860,.07,.15,'sine']]:
      kind==='success'?[[490,650,0,.13,'sine'],[730,980,.12,.2,'sine']]:
      [[630,770,0,.075,'sine']];
    for(const [low,high,delay,duration,wave] of tones){
      const osc=audioContext.createOscillator(),gain=audioContext.createGain();
      osc.type=wave;osc.frequency.setValueAtTime(low,t+delay);
      osc.frequency.exponentialRampToValueAtTime(high,t+delay+duration);
      gain.gain.setValueAtTime(.0001,t+delay);
      gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume*.13),t+delay+.014);
      gain.gain.exponentialRampToValueAtTime(.0001,t+delay+duration);
      osc.connect(gain);gain.connect(audioContext.destination);
      osc.start(t+delay);osc.stop(t+delay+duration+.015);
    }
  }catch(err){console.warn('Audio unavailable',err)}
}
bind('#soundToggle','change',e=>{state.soundEnabled=e.target.checked;persist();if(state.soundEnabled)playSound('success',true)});
bind('#soundVolume','input',e=>{state.soundVolume=Number(e.target.value)||0;persist()});
bind('#testSound','click',()=>playSound('pet',true));
document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.id==='testSound'||b.id==='soundToggle')return;
  playSound(b.dataset.room?'room':b.dataset.cosmetic||b.dataset.companion||b.dataset.gender?'cosmetic':'tap');
});


const launchGate=q('#launchGate'),launchCore=q('#launchCore'),launchEnter=q('#launchEnter');
const launchBar=q('#launchProgressBar'),launchPercent=q('#launchPercent'),launchPhase=q('#launchPhase'),launchStatus=q('#launchStatus');
let launchProgress=0,launchHolding=false,launchRAF=0,launchOpened=false,launchLast=0;

function setLaunchVisual(p){
  launchProgress=Math.max(0,Math.min(1,p));
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
    window.dispatchEvent(new CustomEvent('xrpet:launch-complete'));
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
  try{if(state.soundEnabled)playSound('tap',true)}catch{}
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


const floatEl=q('#floatingCompanion'),floatHandle=q('#floatingHandle');
let floatPinned=state.floatingPinned,dragFloat=false,dragDX=0,dragDY=0,floatRAF=0;
function clampFloat(){
  if(!floatEl)return;
  const r=floatEl.getBoundingClientRect();
  let x=state.floatX??(innerWidth-r.width-28), y=state.floatY??(innerHeight-r.height-22);
  x=Math.max(0,Math.min(innerWidth-r.width,x));y=Math.max(0,Math.min(innerHeight-r.height,y));
  state.floatX=x;state.floatY=y;
  floatEl.style.left=x+'px';floatEl.style.top=y+'px';floatEl.style.right='auto';floatEl.style.bottom='auto';
}
function setPinned(v){
  floatPinned=v;state.floatingPinned=v;persist();
  setText('#toggleFloat',v?'Unpin':'Pin');setText('#floatingModeLabel',v?'pinned · drag tag to move':'auto levitate · drag tag to place');
}
function animateFloat(t){
  if(floatEl&&!floatPinned&&!dragFloat){
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
  dragFloat=true;setPinned(true);const r=floatEl.getBoundingClientRect();dragDX=e.clientX-r.left;dragDY=e.clientY-r.top;floatHandle.setPointerCapture?.(e.pointerId);e.preventDefault();
});
floatHandle?.addEventListener('pointermove',e=>{
  if(!dragFloat)return;const r=floatEl.getBoundingClientRect();
  const x=Math.max(0,Math.min(innerWidth-r.width,e.clientX-dragDX)),y=Math.max(0,Math.min(innerHeight-r.height,e.clientY-dragDY));
  state.floatX=x;state.floatY=y;floatEl.style.left=x+'px';floatEl.style.top=y+'px';floatEl.style.right='auto';floatEl.style.bottom='auto';
});
floatHandle?.addEventListener('pointerup',e=>{if(!dragFloat)return;dragFloat=false;floatHandle.releasePointerCapture?.(e.pointerId);persist()});
qa('.floating-controls button').forEach(b=>b.addEventListener('pointerdown',e=>e.stopPropagation()));
bind('#toggleFloat','click',()=>setPinned(!floatPinned));
bind('#centerFloat','click',()=>{setPinned(true);if(floatEl){const r=floatEl.getBoundingClientRect();state.floatX=Math.max(0,(innerWidth-r.width)/2);state.floatY=Math.max(0,(innerHeight-r.height)/2);clampFloat();persist()}});
addEventListener('resize',()=>{if(floatPinned)clampFloat()});
if(floatPinned)clampFloat();setPinned(floatPinned);requestAnimationFrame(animateFloat);applyNftCompanion();

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