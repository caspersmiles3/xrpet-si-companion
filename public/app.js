const $ = s => document.querySelector(s);
const saved=JSON.parse(localStorage.getItem('xrpet-state')||'{}');
const state = { connected:false, ledgerIndex:null, txCount:0, baseFeeDrops:null, networkMood:saved.networkMood||'Calm', petName:saved.petName||'NEXUS-589', account:saved.account||null, streak:saved.streak||0, xp:saved.xp||0 };
function saveState(){localStorage.setItem('xrpet-state',JSON.stringify({networkMood:state.networkMood,petName:state.petName,account:state.account,streak:state.streak,xp:state.xp}))}
const XRPL_WS = 'wss://xrplcluster.com/';
let ws;
let charge=0;

function setPetMood(mood, speech, cls='calm'){
  state.networkMood=mood; saveState(); $('#networkMood').textContent=mood; $('#petMood').textContent=`Mood: ${mood}`; $('#petSpeech').textContent=speech; $('#pet').className=`pet ${cls}`;
}
function connect(){
  ws = new WebSocket(XRPL_WS);
  ws.onopen=()=>{
    state.connected=true; $('#liveBadge').className='badge online'; $('#liveBadge').innerHTML='<span></span> XRPL LIVE'; $('#status').textContent='Live';
    ws.send(JSON.stringify({id:'xrpet-ledger',command:'subscribe',streams:['ledger','server']}));
    ws.send(JSON.stringify({id:'xrpet-fee',command:'fee'}));
    ws.send(JSON.stringify({id:'xrpet-state',command:'server_state',ledger_index:'current'}));
    if(state.account) subscribeAccount(state.account);
    setPetMood('Connected','I’m connected to XRPL. Every validated ledger gives me a new pulse.','calm');
  };
  ws.onmessage=e=>handle(JSON.parse(e.data));
  ws.onclose=()=>{state.connected=false; $('#liveBadge').className='badge offline'; $('#liveBadge').innerHTML='<span></span> RECONNECTING'; $('#status').textContent='Offline'; setTimeout(connect,3000)};
  ws.onerror=()=>ws.close();
}
function handle(msg){
  if(msg.type==='ledgerClosed' || msg.type==='ledger'){
    const idx=msg.ledger_index || msg.ledger_index_max || msg.ledger_index_min;
    if(idx){state.ledgerIndex=idx; $('#ledger').textContent=Number(idx).toLocaleString();}
    if(msg.txn_count!=null){state.txCount=msg.txn_count; $('#txCount').textContent=`${msg.txn_count} transactions`; const mood=msg.txn_count>100?'Energized':msg.txn_count>40?'Curious':'Calm'; setPetMood(mood,`Ledger ${Number(idx).toLocaleString()} just closed with ${msg.txn_count} transactions.`,mood==='Energized'?'energized':'calm');}
    $('#closeTime').textContent='Ledger just closed';
    ws.send(JSON.stringify({id:'xrpet-fee-'+Date.now(),command:'fee'}));
  }
  if(msg.id && String(msg.id).startsWith('xrpet-fee') && msg.result?.drops){state.baseFeeDrops=msg.result.drops.base_fee; $('#fee').textContent=msg.result.drops.base_fee;}
  if(msg.id==='xrpet-state' && msg.result?.state){$('#serverState').textContent=msg.result.state.server_state || 'connected';}
  if(msg.type==='transaction' && state.account){
    const tx=msg.transaction || msg.tx_json || {};
    $('#walletState').textContent=`New validated activity detected · ${tx.TransactionType || 'Transaction'} · ${new Date().toLocaleTimeString()}`;
    setPetMood('Celebrating','Your watched XRPL account just had validated activity!','energized');
  }
}
function subscribeAccount(account){ if(ws?.readyState===1) ws.send(JSON.stringify({id:'xrpet-account',command:'subscribe',accounts:[account]})); }

async function loadUpdates(){
  $('#updates').innerHTML='<p class="muted">Checking official Ripple/XRPL sources…</p>';
  try{const r=await fetch('/api/updates'); const d=await r.json(); if(!d.items.length) throw new Error('No items'); $('#updates').innerHTML=d.items.slice(0,10).map(x=>`<div class="update"><a href="${x.url}" target="_blank" rel="noopener">${escapeHtml(x.title)}</a><div class="meta"><span class="chip confirmed">${x.label}</span><span class="chip">${escapeHtml(x.source)}</span><span class="chip">${x.importance}</span></div></div>`).join('');}
  catch(e){$('#updates').innerHTML='<p class="muted">Official update feed is temporarily unavailable. Live XRPL data still works.</p>'}
}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
async function ask(message){
  const chat=$('#chat'); chat.insertAdjacentHTML('beforeend',`<div class="bubble user-bubble">${escapeHtml(message)}</div>`); chat.scrollTop=chat.scrollHeight;
  const r=await fetch('/api/companion',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message,context:state})}); const d=await r.json(); chat.insertAdjacentHTML('beforeend',`<div class="bubble pet-bubble">${escapeHtml(d.reply)}</div>`); chat.scrollTop=chat.scrollHeight;
}
$('#chatForm').addEventListener('submit',e=>{e.preventDefault();const m=$('#message').value.trim();if(!m)return;$('#message').value='';ask(m)});
document.querySelectorAll('.quick button').forEach(b=>b.onclick=()=>ask(b.dataset.q));
$('#catchup').onclick=()=>{ask('Catch me up');loadUpdates()}; $('#refreshNews').onclick=loadUpdates;
$('#watchForm').addEventListener('submit',e=>{e.preventDefault();const a=$('#account').value.trim(); if(!/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(a)){ $('#walletState').textContent='That does not look like a valid XRPL classic address.'; return;} state.account=a; saveState(); subscribeAccount(a); $('#walletState').textContent=`Watching ${a.slice(0,6)}…${a.slice(-5)} for validated transactions.`;});
$('#charge').onclick=()=>{charge=Math.min(7,charge+1);$('#chargeCount').textContent=`${charge}/7`;$('#meterFill').style.width=`${charge/7*100}%`; if(charge===7){state.streak+=1;state.xp+=10;saveState();setPetMood('Charged',`Core fully charged. Mission complete. Streak ${state.streak} · XP ${state.xp}.`,'energized')}};
connect(); loadUpdates();

if(state.account){$('#account').value=state.account;$('#walletState').textContent=`Watching ${state.account.slice(0,6)}…${state.account.slice(-5)} after restart.`;}
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));}
