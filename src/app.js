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
  truthMode:saved.truthMode!==false,marketMood:saved.marketMood!==false
};
const FORMS=[['Drop',0],['Ripple',50],['Wave',150],['Surge',350],['Nexus',700],['Titan',1200],['Legend',2000]];
function persist(){safe(()=>localStorage.setItem(STORE,JSON.stringify({...state,connected:undefined,ledgerIndex:undefined,txCount:undefined,baseFeeDrops:undefined,xrpPrice:undefined,xrpChange24h:undefined})))}
function form(){return [...FORMS].reverse().find(x=>state.xp>=x[1])||FORMS[0]}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function setText(sel,text){const el=q(sel);if(el)el.textContent=text}
function mood(label,speech,cls='calm'){setText('#petMood',label);setText('#petSpeech',speech);const p=q('#pet');if(p){p.classList.remove('calm','energized','alert');p.classList.add(cls)}}
function render(){
  const [name,min]=form(); const i=FORMS.findIndex(x=>x[0]===name); const next=FORMS[Math.min(i+1,FORMS.length-1)];
  setText('#petName',state.petName);setText('#chatPetName',state.petName);setText('#topPetName',state.petName);setText('#stripPetName',state.petName);setText('#evolution',name.toUpperCase());
  const lvl=Math.floor(state.xp/100)+1; setText('#level','Lv. '+lvl);setText('#xpLabel',state.xp+' XP');setText('#topLevel','Level '+lvl);setText('#topXp',state.xp+' XP');setText('#stripLevel','Level '+lvl);
  const pct=name==='Legend'?100:Math.max(0,Math.min(100,(state.xp-min)/(next[1]-min)*100));
  if(q('#xpFill'))q('#xpFill').style.width=pct+'%';
  if(q('#profileName'))q('#profileName').value=state.petName;
  if(q('#profilePersonality'))q('#profilePersonality').value=state.personality;
  if(q('#profileFocus'))q('#profileFocus').value=state.focus;
  setText('#personalityChip',state.personality);setText('#streakChip',state.streak+' day streak');
  if(q('#account'))q('#account').value=state.account||'';
  setText('#walletProvider',state.walletProvider==='manual'?'Manual':state.walletProvider);
  setText('#walletState',state.account?'Watching '+state.account.slice(0,8)+'…'+state.account.slice(-6)+' for validated activity.':'No public account is being watched.');
  qa('.room-choice').forEach(b=>{const rank=FORMS.findIndex(x=>x[0]===name),need=b.dataset.room==='aurora'?2:b.dataset.room==='legend'?5:0;b.disabled=rank<need;b.classList.toggle('active',b.dataset.room===state.room)}); qa('.cosmetic-choice').forEach(b=>{const active=b.dataset.cosmetic===state.cosmetic;b.classList.toggle('active',active);const s=b.querySelector('small');if(s)s.textContent=active?'Equipped':'Owned'}); qa('.variant-dot').forEach(b=>b.classList.toggle('active',b.dataset.cosmetic===state.cosmetic));
  document.body.classList.remove('room-nexus','room-ocean','room-vault','room-aurora','room-legend');document.body.classList.add('room-'+state.room); const pet=q('#pet'); if(pet){pet.classList.remove('skin-classic','skin-aqua','skin-midnight','skin-pearl','skin-solar');pet.classList.add('skin-'+state.cosmetic)}
  setText('#unlocksChip',(['nexus','ocean','vault'].length+(FORMS.findIndex(x=>x[0]===name)>=2?1:0)+(FORMS.findIndex(x=>x[0]===name)>=5?1:0))+' unlocked');
  if(q('#explainLevel'))q('#explainLevel').value=state.explainLevel;if(q('#notifyLevel'))q('#notifyLevel').value=state.notifyLevel;
  if(q('#truthToggle'))q('#truthToggle').checked=state.truthMode;if(q('#marketMoodToggle'))q('#marketMoodToggle').checked=state.marketMood;
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
  ws.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch{return}if(m.type==='ledgerClosed'){state.ledgerIndex=m.ledger_index;state.txCount=m.txn_count??0;state.baseFeeDrops=m.fee_base??state.baseFeeDrops;setText('#ledger',Number(m.ledger_index).toLocaleString());setText('#txCount',(m.txn_count??0)+' transactions');if(m.fee_base!=null)setText('#fee',m.fee_base)}else if(m.type==='serverStatus'){setText('#serverState',m.server_status||'Connected')}else if(m.id==='fee'&&m.result){const drops=m.result?.drops?.base_fee;if(drops!=null){state.baseFeeDrops=Number(drops);setText('#fee',drops)}}else if(m.type==='transaction'&&state.account){mood('Wallet activity','Validated activity detected on the watched account.','energized');addXp(3)}};
  ws.onclose=()=>{state.connected=false;setText('#status','Reconnecting');const b=q('#liveBadge');if(b){b.className='status-pill waiting';b.innerHTML='<i></i><span>Reconnecting</span>'}scheduleReconnect()};ws.onerror=()=>safe(()=>ws.close())
}
function scheduleReconnect(){clearTimeout(retry);retry=setTimeout(connectLedger,4000)}
async function loadConfig(){try{const r=await fetch('/api/config',{cache:'no-store'});return await r.json()}catch{return{}}}
async function integrationCheck(){const box=q('#integrationStatus');if(!box)return;box.innerHTML='<div class="integration-item"><span>System</span><strong>Checking…</strong></div>';try{const [cfg,self]=await Promise.all([loadConfig(),fetch('/api/self-test',{cache:'no-store'}).then(r=>r.json())]);const rows=[['XRPL',state.connected?'LIVE':'CONNECTING'],['Xaman',cfg.xamanApiKey?'READY':'NOT CONFIGURED'],['Web Push',cfg.pushEnabled?'READY':'NOT CONFIGURED'],['Full SI',cfg.siProviderEnabled?'READY':'NOT CONFIGURED']];box.innerHTML=rows.map(([n,s])=>'<div class="integration-item"><span>'+n+'</span><strong class="'+(/LIVE|READY/.test(s)?'ok':'warn')+'">'+s+'</strong></div>').join('')}catch{box.innerHTML='<div class="integration-item"><span>System</span><strong class="warn">Check failed</strong></div>'}}
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
qa('.room-choice').forEach(b=>b.addEventListener('click',()=>{if(b.disabled)return;state.room=b.dataset.room;persist();render();mood('Room changed','Environment synchronized to '+b.querySelector('strong')?.textContent+'.','calm')})); qa('.cosmetic-choice').forEach(b=>b.addEventListener('click',()=>{state.cosmetic=b.dataset.cosmetic;persist();render();mood('Customized','Companion finish changed to '+b.querySelector('strong')?.textContent+'.','energized')}));
qa('[data-scroll]').forEach(b=>b.addEventListener('click',()=>q('#'+b.dataset.scroll)?.scrollIntoView({behavior:'smooth',block:'center'})));
bind('#explainLevel','change',e=>{state.explainLevel=e.target.value;persist()});bind('#notifyLevel','change',e=>{state.notifyLevel=e.target.value;persist()});bind('#truthToggle','change',e=>{state.truthMode=e.target.checked;persist()});bind('#marketMoodToggle','change',e=>{state.marketMood=e.target.checked;persist()});
bind('#notifyButton','click',async()=>{if(!('Notification'in window)){alert('Browser notifications are not supported here.');return}const p=await Notification.requestPermission();if(p==='granted')new Notification('XRPet alerts enabled',{body:'Browser alerts are ready while XRPet is open.'});});
bind('#refreshIntegrations','click',integrationCheck);

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
bind('#pet','click',()=>{mood('Responsive','Core pulse received.','energized');setTimeout(()=>mood('Connected','Live XRPL data is flowing.','calm'),900)});
dailyVisit();render();connectLedger();loadMarket();loadUpdates();integrationCheck();setInterval(loadMarket,120000);setInterval(integrationCheck,60000);