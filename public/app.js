let gemApiPromise;
const getGemApi=()=>gemApiPromise||(gemApiPromise=import('https://esm.sh/@gemwallet/api@3.7.0'));
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const STORE='xrpet-v1-state';
const todayKey=()=>new Date().toISOString().slice(0,10);
const saved=JSON.parse(localStorage.getItem(STORE)||'{}');

const state={
  connected:false, ledgerIndex:null, txCount:0, baseFeeDrops:null,
  xrpPrice:null, xrpChange24h:null, networkMood:saved.networkMood||'Calm',
  petName:saved.petName||'NEXUS-589', personality:saved.personality||'Guardian',
  focus:saved.focus||'', account:saved.account||null, xp:saved.xp||0,
  streak:saved.streak||0, lastMissionDate:saved.lastMissionDate||null,
  lastVisitDate:saved.lastVisitDate||null, room:saved.room||'nexus',
  memories:Array.isArray(saved.memories)?saved.memories:[],
  notifications:Array.isArray(saved.notifications)?saved.notifications:[],
  explainLevel:saved.explainLevel||'balanced',
  notifyLevel:saved.notifyLevel||'quiet',
  truthMode:saved.truthMode!==false,
  marketMood:saved.marketMood!==false,
  onboarded:saved.onboarded===true,
  walletProvider:saved.walletProvider||'manual',
  walletNetwork:saved.walletNetwork||null
};

function persist(){
  localStorage.setItem(STORE,JSON.stringify({
    networkMood:state.networkMood,petName:state.petName,personality:state.personality,
    focus:state.focus,account:state.account,xp:state.xp,streak:state.streak,
    lastMissionDate:state.lastMissionDate,lastVisitDate:state.lastVisitDate,
    room:state.room,memories:state.memories.slice(-8),notifications:state.notifications.slice(0,40),
    explainLevel:state.explainLevel,notifyLevel:state.notifyLevel,
    truthMode:state.truthMode,marketMood:state.marketMood,
    onboarded:state.onboarded,walletProvider:state.walletProvider,walletNetwork:state.walletNetwork
  }));
}

const FORMS=[
  {name:'Drop',min:0},{name:'Ripple',min:50},{name:'Wave',min:150},
  {name:'Surge',min:350},{name:'Nexus',min:700},{name:'Titan',min:1200},{name:'Legend',min:2000}
];
function evolution(){
  return [...FORMS].reverse().find(x=>state.xp>=x.min)||FORMS[0];
}
function nextForm(){
  const i=FORMS.findIndex(x=>x.name===evolution().name);
  return FORMS[Math.min(i+1,FORMS.length-1)];
}
function level(){return Math.max(1,Math.floor(state.xp/100)+1)}
function escapeHtml(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

function renderProfile(){
  const form=evolution(), next=nextForm();
  $('#petName').textContent=state.petName;
  $('#chatPetName').textContent=state.petName;
  $('#profileName').value=state.petName;
  $('#profilePersonality').value=state.personality;
  $('#profileFocus').value=state.focus;
  $('#personalityChip').textContent=state.personality;
  $('#evolution').textContent=form.name;
  $('#level').textContent='Lv. '+level();
  $('#xpLabel').textContent=state.xp+' XP';
  const pct=form.name==='Legend'?100:Math.max(0,Math.min(100,(state.xp-form.min)/(next.min-form.min)*100));
  $('#xpFill').style.width=pct+'%';
  $('#streakChip').textContent=state.streak+' day streak';
  $('#pet').classList.remove(...FORMS.map(x=>'form-'+x.name.toLowerCase()));
  $('#pet').classList.add('form-'+form.name.toLowerCase());
  $('#memorySummary').textContent=state.memories.length
    ? `${state.petName} remembers ${state.memories.length} preference${state.memories.length===1?'':'s'} about you.`
    : 'No companion memory yet.';
  renderMemory();
  renderRoom();
  renderUnlocks();
}

function setPetMood(mood,speech,cls='calm'){
  state.networkMood=mood; persist();
  $('#networkMood').textContent=mood;
  $('#petMood').textContent=`Mood: ${mood}`;
  $('#petSpeech').textContent=speech;
  $('#pet').classList.remove('calm','energized','alert');
  $('#pet').classList.add(cls);
}

function notify(title,body,type='info',browser=false){
  const item={id:Date.now()+Math.random(),title,body,type,at:new Date().toISOString()};
  state.notifications.unshift(item); state.notifications=state.notifications.slice(0,40); persist();
  renderNotifications();
  if(browser && Notification.permission==='granted'){
    try{new Notification(title,{body,icon:'/xrpet-icon.svg'})}catch{}
  }
}
function renderNotifications(){
  const list=$('#notificationList');
  if(!state.notifications.length){list.innerHTML='<p class="muted">No signals yet.</p>';return}
  list.innerHTML=state.notifications.slice(0,12).map(n=>`<div class="signal ${escapeHtml(n.type)}"><strong>${escapeHtml(n.title)}</strong><p>${escapeHtml(n.body)}</p><small>${new Date(n.at).toLocaleString()}</small></div>`).join('');
}
function renderMemory(){
  $('#memoryList').innerHTML=state.memories.length
    ? state.memories.map((m,i)=>`<span class="memory-chip">${escapeHtml(m)} <button data-memory-remove="${i}" aria-label="Remove">×</button></span>`).join('')
    : '<p class="muted">Nothing stored yet.</p>';
  $$('[data-memory-remove]').forEach(b=>b.onclick=()=>{state.memories.splice(Number(b.dataset.memoryRemove),1);persist();renderProfile()});
}
function renderRoom(){
  $('#room').className='hero card room-'+state.room;
  $$('.cosmetic').forEach(b=>b.classList.toggle('active',b.dataset.room===state.room));
}
function roomUnlocked(room){
  const rank=FORMS.findIndex(x=>x.name===evolution().name);
  if(room==='aurora') return rank>=2;
  if(room==='legend') return rank>=5;
  return true;
}
function renderUnlocks(){
  const unlocked=['nexus','ocean','vault','aurora','legend'].filter(roomUnlocked).length;
  $('#unlocksChip').textContent=unlocked+' unlocked';
  $$('.cosmetic').forEach(b=>{
    const ok=roomUnlocked(b.dataset.room);
    b.disabled=!ok; b.classList.toggle('locked',!ok);
  });
}
function addXp(amount,reason){
  const before=evolution().name;
  state.xp+=amount; persist(); renderProfile();
  const after=evolution().name;
  notify('+'+amount+' XP',reason,'xp');
  if(after!==before){
    notify('Evolution unlocked',`${state.petName} evolved from ${before} to ${after}.`,'evolution',true);
    setPetMood('Evolved',`I evolved into ${after}. We built this together.`,'energized');
  }
}

function dailyVisit(){
  const t=todayKey();
  if(state.lastVisitDate!==t){
    const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);
    state.streak=state.lastVisitDate===yesterday?state.streak+1:1;
    state.lastVisitDate=t; state.xp+=5; persist();
    notify('Daily check-in',`Day ${state.streak} streak. +5 XP.`,'xp');
  }
}

const XRPL_WS='wss://xrplcluster.com/';
let ws,reconnectTimer,charge=0,lastLedgerNotification=0;
function connect(){
  clearTimeout(reconnectTimer);
  ws=new WebSocket(XRPL_WS);
  ws.onopen=()=>{
    state.connected=true;
    $('#liveBadge').className='badge online'; $('#liveBadge').innerHTML='<span></span> XRPL LIVE';
    $('#status').textContent='Live';
    ws.send(JSON.stringify({id:'xrpet-ledger',command:'subscribe',streams:['ledger','server']}));
    ws.send(JSON.stringify({id:'xrpet-fee',command:'fee'}));
    ws.send(JSON.stringify({id:'xrpet-state',command:'server_state',ledger_index:'current'}));
    if(state.account) subscribeAccount(state.account);
    setPetMood('Connected',personalityLine('connected'),'calm');
  };
  ws.onmessage=e=>{try{handle(JSON.parse(e.data))}catch{}};
  ws.onclose=()=>{
    state.connected=false; $('#status').textContent='Offline';
    $('#liveBadge').className='badge offline'; $('#liveBadge').innerHTML='<span></span> RECONNECTING';
    reconnectTimer=setTimeout(connect,3500);
  };
  ws.onerror=()=>ws.close();
}
function personalityLine(kind){
  const lines={
    Guardian:{connected:'I have the ledger watch. You can focus on your day.',mission:'Core secure. Mission complete.'},
    Explorer:{connected:'Ledger link established. Let’s see what changed out there.',mission:'Another signal mapped. Nice work.'},
    Oracle:{connected:'The ledger is speaking again. I will separate signal from noise.',mission:'Pattern complete. The next layer is clearer.'},
    Builder:{connected:'Systems online. Live data is flowing.',mission:'Task complete. Progress compounds.'},
    Spark:{connected:'We’re live! The ledger is pulsing.',mission:'Core charged! That was quick.'},
    Jester:{connected:'Connected. I promise not to spend the XRP. I cannot anyway.',mission:'Seven taps. Highly advanced blockchain engineering.'}
  };
  return lines[state.personality]?.[kind]||lines.Guardian[kind];
}
function handle(msg){
  if(msg.type==='ledgerClosed'||msg.type==='ledger'){
    const idx=msg.ledger_index||msg.ledger_index_max||msg.ledger_index_min;
    if(idx){state.ledgerIndex=idx;$('#ledger').textContent=Number(idx).toLocaleString()}
    if(msg.txn_count!=null){
      state.txCount=msg.txn_count; $('#txCount').textContent=`${msg.txn_count} transactions`;
      const mood=msg.txn_count>100?'Energized':msg.txn_count>40?'Curious':'Calm';
      setPetMood(mood,`Ledger ${Number(idx).toLocaleString()} closed with ${msg.txn_count} transactions.`,mood==='Energized'?'energized':'calm');
      if(state.notifyLevel==='active' && Date.now()-lastLedgerNotification>3600000){
        notify('XRPL pulse',`Recent ledger closed with ${msg.txn_count} transactions.`,'ledger');
        lastLedgerNotification=Date.now();
      }
    }
    $('#closeTime').textContent='Ledger just closed';
    ws.send(JSON.stringify({id:'xrpet-fee-'+Date.now(),command:'fee'}));
  }
  if(msg.id&&String(msg.id).startsWith('xrpet-fee')&&msg.result?.drops){
    state.baseFeeDrops=msg.result.drops.base_fee; $('#fee').textContent=msg.result.drops.base_fee;
  }
  if(msg.id==='xrpet-state'&&msg.result?.state) $('#serverState').textContent=msg.result.state.server_state||'connected';
  if(msg.type==='transaction'&&state.account){
    const tx=msg.transaction||msg.tx_json||{};
    $('#walletState').textContent=`Validated activity · ${tx.TransactionType||'Transaction'} · ${new Date().toLocaleTimeString()}`;
    setPetMood('Celebrating','Your watched XRPL account just had validated activity!','energized');
    notify('Wallet activity',`${tx.TransactionType||'Transaction'} validated on your watched XRPL account.`,'wallet',state.notifyLevel!=='quiet');
    addXp(3,'Observed a validated wallet event.');
  }
}
function subscribeAccount(account){
  if(ws?.readyState===1) ws.send(JSON.stringify({id:'xrpet-account',command:'subscribe',accounts:[account]}));
}

async function setConnectedWallet(provider,address,network){
  state.walletProvider=provider;
  state.walletNetwork=network||'unknown';
  state.account=address;
  persist();
  $('#walletProvider').textContent=provider;
  $('#walletConnection').textContent=`${provider} connected · ${address.slice(0,6)}…${address.slice(-5)} · ${state.walletNetwork}`;
  $('#account').value=address;
  $('#walletState').textContent=`Watching connected wallet ${address.slice(0,6)}…${address.slice(-5)}.`;
  subscribeAccount(address);
  notify('Wallet connected',`${provider} connected safely. XRPet received only your public address.`,'wallet');
  addXp(5,'Connected a wallet safely.');
}
async function connectGemWallet(statusTarget='#walletConnection'){
  const status=$(statusTarget);
  try{
    const {isInstalled,getAddress,getNetwork}=await getGemApi();
    const installed=await isInstalled();
    if(!installed?.result?.isInstalled){status.textContent='GemWallet is not installed in this browser.';return false}
    const [addressResult,networkResult]=await Promise.all([getAddress(),getNetwork()]);
    const address=addressResult?.result?.address;
    if(!address){status.textContent='GemWallet did not share an address.';return false}
    await setConnectedWallet('GemWallet',address,networkResult?.result?.network||'unknown');
    status.textContent=`GemWallet connected: ${address.slice(0,6)}…${address.slice(-5)}`;
    return true;
  }catch(e){status.textContent='GemWallet connection failed.';return false}
}
async function loadPublicConfig(){
  try{const r=await fetch('/api/config');return await r.json()}catch{return {}}
}
async function connectXaman(statusTarget='#walletConnection'){
  const status=$(statusTarget);
  const cfg=await loadPublicConfig();
  if(!cfg.xamanApiKey){status.textContent='Xaman is ready, but the public Xaman API key has not been configured on the server yet.';return false}
  if(typeof window.Xumm!=='function'){status.textContent='Xaman SDK did not load.';return false}
  try{
    const xumm=new window.Xumm(cfg.xamanApiKey);
    status.textContent='Opening Xaman authorization…';
    await xumm.authorize();
    const address=await xumm.user?.account;
    const network=await xumm.environment?.openTxNetworkEndpoint;
    if(!address){status.textContent='Xaman authorization completed without an account address.';return false}
    await setConnectedWallet('Xaman',address,network||'XRPL');
    status.textContent=`Xaman connected: ${address.slice(0,6)}…${address.slice(-5)}`;
    return true;
  }catch(e){status.textContent='Xaman connection was cancelled or failed.';return false}
}

async function loadMarket(){
  try{
    const r=await fetch('/api/market'); const d=await r.json();
    state.xrpPrice=Number(d.price); state.xrpChange24h=Number(d.change24h);
    $('#xrpPrice').textContent=Number.isFinite(state.xrpPrice)?'$'+state.xrpPrice.toFixed(4):'Unavailable';
    if(Number.isFinite(state.xrpChange24h)){
      const sign=state.xrpChange24h>=0?'+':'';
      $('#xrpChange').textContent=sign+state.xrpChange24h.toFixed(2)+'% · 24h';
      if(state.marketMood&&Math.abs(state.xrpChange24h)>=5){
        setPetMood(state.xrpChange24h>0?'Excited':'Watchful',`XRP has moved ${sign}${state.xrpChange24h.toFixed(2)}% over 24 hours. That is movement, not a prediction.`,state.xrpChange24h>0?'energized':'alert');
      }
    }else $('#xrpChange').textContent='24h data unavailable';
  }catch{
    $('#xrpPrice').textContent='Unavailable'; $('#xrpChange').textContent='Market feed offline';
  }
}
let latestUpdates=[];
async function loadUpdates(){
  $('#updates').innerHTML='<p class="muted">Checking official Ripple/XRPL sources…</p>';
  try{
    const r=await fetch('/api/updates'); const d=await r.json(); latestUpdates=d.items||[];
    if(!latestUpdates.length) throw new Error('No items');
    $('#updates').innerHTML=latestUpdates.slice(0,10).map(x=>`<div class="update"><a href="${x.url}" target="_blank" rel="noopener">${escapeHtml(x.title)}</a><div class="meta"><span class="chip confirmed">${escapeHtml(x.label)}</span><span class="chip">${escapeHtml(x.source)}</span><span class="chip">${escapeHtml(x.importance)}</span></div></div>`).join('');
    const important=latestUpdates.filter(x=>x.importance==='important');
    if(important.length&&state.notifyLevel==='active') notify('Official XRP ecosystem update',important[0].title,'news');
  }catch{
    $('#updates').innerHTML='<p class="muted">Official update feed is temporarily unavailable. Live XRPL data still works.</p>';
  }
}
async function ask(message){
  const chat=$('#chat');
  chat.insertAdjacentHTML('beforeend',`<div class="bubble user-bubble">${escapeHtml(message)}</div>`);
  chat.scrollTop=chat.scrollHeight;
  try{
    const r=await fetch('/api/companion',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message,context:{...state,memories:state.memories.slice(-5)}})});
    const d=await r.json();
    chat.insertAdjacentHTML('beforeend',`<div class="bubble pet-bubble">${escapeHtml(d.reply)}</div>`);
    if(d.truth?.label) notify('Truth Mode: '+d.truth.label,d.truth.reason,'truth');
    addXp(1,'Companion interaction.');
  }catch{
    chat.insertAdjacentHTML('beforeend','<div class="bubble pet-bubble">My SI feed is temporarily unavailable, but live XRPL monitoring is still running.</div>');
  }
  chat.scrollTop=chat.scrollHeight;
}
async function dailyBriefing(){
  const chat=$('#chat');
  try{
    const r=await fetch('/api/briefing',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({context:state})});
    const b=await r.json();
    let text=`${b.headline} ${b.market} ${b.ledger}`;
    if(b.important?.length) text+=' Important confirmed items: '+b.important.map(x=>x.title).join(' • ');
    text+=' '+b.caution;
    chat.insertAdjacentHTML('beforeend',`<div class="bubble pet-bubble briefing"><strong>Daily briefing</strong><br>${escapeHtml(text)}</div>`);
    notify('Daily briefing ready',b.headline,'briefing');
    addXp(2,'Read a grounded daily briefing.');
    chat.scrollTop=chat.scrollHeight;
  }catch{ask('Catch me up')}
}

$('#chatForm').addEventListener('submit',e=>{e.preventDefault();const m=$('#message').value.trim();if(!m)return;$('#message').value='';ask(m)});
$$('.quick button').forEach(b=>b.onclick=()=>ask(b.dataset.q));
$('#catchup').onclick=()=>{ask('Catch me up');loadUpdates();loadMarket()};
$('#dailyButton').onclick=dailyBriefing;
$('#refreshNews').onclick=()=>{loadUpdates();loadMarket()};

$('#profileForm').addEventListener('submit',e=>{
  e.preventDefault();
  state.petName=$('#profileName').value.trim()||'NEXUS-589';
  state.personality=$('#profilePersonality').value;
  state.focus=$('#profileFocus').value.trim();
  persist();renderProfile();
  setPetMood('Personalized',`I’m ${state.petName}. ${state.personality} mode is active.`,'calm');
  notify('Profile updated',`${state.petName} is now using the ${state.personality} personality.`,'profile');
});

$('#watchForm').addEventListener('submit',e=>{
  e.preventDefault(); const a=$('#account').value.trim();
  if(!/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(a)){ $('#walletState').textContent='That does not look like a valid XRPL classic address.';return}
  state.account=a;persist();subscribeAccount(a);
  $('#walletState').textContent=`Watching ${a.slice(0,6)}…${a.slice(-5)} for validated activity.`;
  notify('Wallet Watch enabled','A public XRPL address is now being watched. No secret key was requested.','wallet');
});
$('#clearWallet').onclick=()=>{
  state.account=null;state.walletProvider='manual';state.walletNetwork=null;persist();
  $('#account').value='';$('#walletState').textContent='No account watched.';
  $('#walletProvider').textContent='Manual';$('#walletConnection').textContent='No wallet connected. You can still watch any public XRPL address.';
  if(ws?.readyState===1) ws.send(JSON.stringify({id:'xrpet-unsub',command:'unsubscribe',accounts:[]}));
};

$('#charge').onclick=()=>{
  if(state.lastMissionDate===todayKey()){setPetMood('Proud','Today’s mission is already complete. Come back tomorrow for another pulse.','calm');return}
  charge=Math.min(7,charge+1);$('#chargeCount').textContent=`${charge}/7`;$('#meterFill').style.width=`${charge/7*100}%`;
  if(charge===7){
    state.lastMissionDate=todayKey();persist(); addXp(15,'Completed the daily Pulse Check.');
    setPetMood('Charged',personalityLine('mission'),'energized');
    $('#missionText').textContent='Mission complete. New mission arrives tomorrow.';
  }
};

$('#memoryForm').addEventListener('submit',e=>{
  e.preventDefault();const m=$('#memoryInput').value.trim();if(!m)return;
  state.memories.push(m);state.memories=state.memories.slice(-8);$('#memoryInput').value='';persist();renderProfile();
  notify('Memory added','Your companion saved a local preference.','memory');
});
$('#clearMemory').onclick=()=>{state.memories=[];persist();renderProfile()};

$$('.cosmetic').forEach(b=>b.onclick=()=>{
  if(!roomUnlocked(b.dataset.room))return;
  state.room=b.dataset.room;persist();renderRoom();notify('Room changed',b.textContent.trim(),'cosmetic');
});

$('#clearNotifications').onclick=()=>{state.notifications=[];persist();renderNotifications()};
$('#connectGem').onclick=()=>connectGemWallet();
$('#connectXaman').onclick=()=>connectXaman();
$('#walletButton').onclick=()=>document.querySelector('#connectGem')?.scrollIntoView({behavior:'smooth',block:'center'});
function urlBase64ToUint8Array(base64String){
  const padding='='.repeat((4-base64String.length%4)%4);
  const base64=(base64String+padding).replace(/-/g,'+').replace(/_/g,'/');
  const raw=atob(base64);return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)));
}
async function enablePush(){
  if(!('Notification'in window)||!('serviceWorker'in navigator)||!('PushManager'in window)){
    notify('Push unavailable','This browser does not support Web Push.','warning');return false
  }
  const permission=await Notification.requestPermission();
  if(permission!=='granted'){notify('Notifications disabled','Permission was not granted.','settings');return false}
  try{
    const keyRes=await fetch('/api/push/public-key'); const key=await keyRes.json();
    if(!key.enabled){notify('Push not configured','Browser notifications work, but server push is not configured.','settings');return false}
    const reg=await navigator.serviceWorker.ready;
    let sub=await reg.pushManager.getSubscription();
    if(!sub) sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(key.publicKey)});
    await fetch('/api/push/subscribe',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({subscription:sub})});
    notify('Push enabled','XRPet can deliver selected signals while the app is closed.','settings');
    return true;
  }catch{notify('Push setup failed','Local notifications still work.','warning');return false}
}
$('#notifyButton').onclick=enablePush;
$('#settingsButton').onclick=()=>$('#settingsPanel').classList.remove('hidden');
$('#closeSettings').onclick=()=>$('#settingsPanel').classList.add('hidden');
$('#explainLevel').value=state.explainLevel;
$('#notifyLevel').value=state.notifyLevel;
$('#truthToggle').checked=state.truthMode;
$('#marketMoodToggle').checked=state.marketMood;
$('#explainLevel').onchange=e=>{state.explainLevel=e.target.value;persist()};
$('#notifyLevel').onchange=e=>{state.notifyLevel=e.target.value;persist()};
$('#truthToggle').onchange=e=>{state.truthMode=e.target.checked;persist()};
$('#marketMoodToggle').onchange=e=>{state.marketMood=e.target.checked;persist()};

let onboardStep=1;
function renderOnboarding(){
  $('[data-step]').forEach(s=>s.classList.toggle('hidden',Number(s.dataset.step)!==onboardStep));
  $('#onboardBack').classList.toggle('hidden',onboardStep===1);
  $('#onboardNext').classList.toggle('hidden',onboardStep===3);
  $('#onboardFinish').classList.toggle('hidden',onboardStep!==3);
}
if(!state.onboarded){$('#onboarding').classList.remove('hidden');renderOnboarding()}
$('#onboardNext').onclick=()=>{
  if(onboardStep===1){
    state.petName=$('#onboardName').value.trim()||'NEXUS-589';
    state.personality=$('#onboardPersonality').value;
  } else if(onboardStep===2){
    state.focus=$('#onboardFocus').value.trim();
    state.explainLevel=$('#onboardExplain').value;
  }
  onboardStep=Math.min(3,onboardStep+1);persist();renderOnboarding();
};
$('#onboardBack').onclick=()=>{onboardStep=Math.max(1,onboardStep-1);renderOnboarding()};
$('#onboardGem').onclick=()=>connectGemWallet('#onboardWalletStatus');
$('#onboardXaman').onclick=()=>connectXaman('#onboardWalletStatus');
$('#onboardFinish').onclick=()=>{
  state.onboarded=true;persist();$('#onboarding').classList.add('hidden');renderProfile();
  notify('Companion created',`${state.petName} is ready.`,'profile');
};
dailyVisit();renderProfile();renderNotifications();
if(state.account){
  $('#account').value=state.account;
  $('#walletState').textContent=`Watching ${state.account.slice(0,6)}…${state.account.slice(-5)}.`;
  $('#walletProvider').textContent=state.walletProvider==='manual'?'Manual':state.walletProvider;
  if(state.walletProvider!=='manual') $('#walletConnection').textContent=`${state.walletProvider} connected · ${state.account.slice(0,6)}…${state.account.slice(-5)} · ${state.walletNetwork||'XRPL'}`;
}
if(state.lastMissionDate===todayKey()){
  charge=7;$('#chargeCount').textContent='7/7';$('#meterFill').style.width='100%';$('#missionText').textContent='Mission complete. New mission arrives tomorrow.';
}
connect();loadUpdates();loadMarket();setInterval(loadMarket,300000);setInterval(loadUpdates,900000);

const XRPetSoundtrack=[
  {name:'Corrupted Transmission 2',file:'/audio/Corrupted%20Transmission%202%20(Instr.).mp3'},
  {name:'Distant Stars 2',file:'/audio/Distant%20Stars%202%20(Instr.).mp3'},
  {name:'Kardashev Scale',file:'/audio/Kardashev%20Scale%20(Instr.).mp3'},
  {name:'Liquid Restlessness',file:'/audio/Liquid%20Restlessness%20(Instr.).mp3'},
  {name:'Payment Clearing',file:'/audio/Payment%20Clearing%20(Instr.).mp3'},
  {name:'Unified Pulse',file:'/audio/Unified%20Pulse%20(Instr.).mp3'}
];
(function initXRPetMusic(){
  const audio=$('#xrpetAudio'),toggle=$('#musicToggle'),name=$('#musicTrackName');
  const prev=$('#musicPrev'),next=$('#musicNext'),shuffleBtn=$('#musicShuffle'),volume=$('#musicVolume'),drag=$('#musicDrag'),player=$('#xrpetMusicPlayer');
  if(!audio||!toggle)return;
  if(player&&drag){
    let moving=false,dx=0,dy=0;
    const savedPos=JSON.parse(localStorage.getItem('xrpet-music-pos')||'null');
    if(savedPos&&Number.isFinite(savedPos.left)&&Number.isFinite(savedPos.top)){
      player.style.left=Math.max(4,Math.min(window.innerWidth-player.offsetWidth-4,savedPos.left))+'px';
      player.style.top=Math.max(4,Math.min(window.innerHeight-player.offsetHeight-4,savedPos.top))+'px';
      player.style.right='auto';player.style.bottom='auto';
    }
    drag.addEventListener('pointerdown',e=>{
      moving=true;
      const r=player.getBoundingClientRect();
      dx=e.clientX-r.left;dy=e.clientY-r.top;
      drag.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    });
    drag.addEventListener('pointermove',e=>{
      if(!moving)return;
      const left=Math.max(4,Math.min(window.innerWidth-player.offsetWidth-4,e.clientX-dx));
      const top=Math.max(4,Math.min(window.innerHeight-player.offsetHeight-4,e.clientY-dy));
      player.style.left=left+'px';player.style.top=top+'px';
      player.style.right='auto';player.style.bottom='auto';
    });
    const stopMove=()=>{
      if(!moving)return;
      moving=false;
      const r=player.getBoundingClientRect();
      localStorage.setItem('xrpet-music-pos',JSON.stringify({left:r.left,top:r.top}));
    };
    drag.addEventListener('pointerup',stopMove);
    drag.addEventListener('pointercancel',stopMove);
  }
  let saved={index:0,volume:.45,shuffle:false};
  try{saved={...saved,...JSON.parse(localStorage.getItem('xrpet-music')||'{}')}}catch{}
  let index=Math.max(0,Math.min(XRPetSoundtrack.length-1,Number(saved.index)||0));
  let shuffle=!!saved.shuffle;
  audio.volume=Math.max(0,Math.min(1,Number(saved.volume)??.45));
  volume.value=String(audio.volume);
  const persistMusic=()=>localStorage.setItem('xrpet-music',JSON.stringify({index,volume:audio.volume,shuffle}));
  function loadTrack(i,autoplay=false){
    index=(i+XRPetSoundtrack.length)%XRPetSoundtrack.length;
    const t=XRPetSoundtrack[index];
    audio.src=t.file;
    name.textContent=t.name;
    persistMusic();
    if(autoplay) audio.play().catch(()=>{toggle.textContent='▶'});
  }
  function nextIndex(){
    if(!shuffle)return (index+1)%XRPetSoundtrack.length;
    if(XRPetSoundtrack.length<2)return index;
    let n=index; while(n===index)n=Math.floor(Math.random()*XRPetSoundtrack.length); return n;
  }
  function setPlaying(on){
    toggle.textContent=on?'Ⅱ':'▶';
    toggle.setAttribute('aria-label',on?'Pause soundtrack':'Play soundtrack');
    document.body.classList.toggle('music-playing',on);
  }
  toggle.onclick=async()=>{
    if(audio.paused){
      if(!audio.src)loadTrack(index,false);
      try{await audio.play()}catch{notify?.('Music unavailable','Upload the XRPet soundtrack files to public/audio.','warning')}
    }else audio.pause();
  };
  prev.onclick=()=>loadTrack(index-1,!audio.paused);
  next.onclick=()=>loadTrack(nextIndex(),!audio.paused);
  shuffleBtn.onclick=()=>{shuffle=!shuffle;shuffleBtn.classList.toggle('active',shuffle);persistMusic()};
  volume.oninput=e=>{audio.volume=Number(e.target.value);persistMusic()};
  audio.onplay=()=>setPlaying(true);
  audio.onpause=()=>setPlaying(false);
  audio.onended=()=>loadTrack(nextIndex(),true);
  audio.onerror=()=>{name.textContent='Track files not uploaded yet';setPlaying(false)};
  shuffleBtn.classList.toggle('active',shuffle);
  loadTrack(index,false);
})();

if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));