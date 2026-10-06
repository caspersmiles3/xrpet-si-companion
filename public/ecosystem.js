(() => {
  const q=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const grid=q('#ecosystemTokenGrid');
  if(!grid)return;

  const PAGE=24;
  let offset=0,count=0,search='',sort='holders',trust='0,1,2,3';
  const nftEvents=[];

  const number=(v)=>{
    const n=Number(v);if(!Number.isFinite(n))return '—';
    if(Math.abs(n)>=1e9)return (n/1e9).toFixed(1)+'B';
    if(Math.abs(n)>=1e6)return (n/1e6).toFixed(1)+'M';
    if(Math.abs(n)>=1e3)return (n/1e3).toFixed(1)+'K';
    return n.toLocaleString(undefined,{maximumFractionDigits:2});
  };
  const pick=(o,...keys)=>{for(const k of keys){const v=o?.[k];if(v!==undefined&&v!==null&&v!=='')return v}return null};
  const listLinks=meta=>{
    const raw=pick(meta,'weblinks','web_links','links');
    return Array.isArray(raw)?raw:[];
  };
  function socialLinks(meta){
    const links=listLinks(meta);
    return links.filter(x=>/twitter|x\.com|social/i.test(String(x?.type||'')+' '+String(x?.url||'')));
  }
  function website(meta){
    const links=listLinks(meta);
    const x=links.find(x=>/website|homepage|project/i.test(String(x?.type||'')))||links.find(x=>/^https?:/i.test(String(x?.url||'')));
    return x?.url||pick(meta,'website','domain','url')||'';
  }
  function publishedLocation(meta){
    const v=pick(meta,'location','country','country_code','jurisdiction','region');
    return v?String(v):'Not published';
  }
  function renderToken(t){
    const meta=t.meta||{},metrics=t.metrics||{};
    const name=pick(meta,'name','token_name')||t.currency||'Unnamed asset';
    const desc=pick(meta,'desc','description')||'No public project description supplied.';
    const icon=pick(meta,'icon','image','logo');
    const issuer=t.issuer||t.mpt_issuance_id||'—';
    const tokenType=(t.token_type||'asset').toUpperCase();
    const trustLevel=Number(pick(meta,'trust_level')??t.trust_level??0);
    const holders=pick(metrics,'holders','trustlines');
    const volume=pick(metrics,'volume_24h','volume24h');
    const site=website(meta),social=socialLinks(meta)[0]?.url||'';
    const creator=pick(meta,'issuer_name','issuer','organization','project','creator','author')||'Issuer address';
    const location=publishedLocation(meta);
    return '<article class="ecosystem-token-card">'+
      '<div class="ecosystem-token-head">'+
        (icon?'<img src="'+esc(icon)+'" alt="" loading="lazy" referrerpolicy="no-referrer">':'<span class="ecosystem-token-fallback">◎</span>')+
        '<div><span>'+esc(tokenType)+' · TRUST '+esc(trustLevel)+'</span><strong>'+esc(name)+'</strong><small>'+esc(t.currency||'')+'</small></div>'+
      '</div>'+
      '<p>'+esc(desc)+'</p>'+
      '<dl>'+
        '<div><dt>Creator / issuer</dt><dd>'+esc(creator)+'</dd></div>'+
        '<div><dt>Issuer address</dt><dd><code>'+esc(issuer)+'</code></dd></div>'+
        '<div><dt>Published location</dt><dd>'+esc(location)+'</dd></div>'+
        '<div><dt>Holders</dt><dd>'+esc(number(holders))+'</dd></div>'+
        '<div><dt>24h volume</dt><dd>'+esc(number(volume))+'</dd></div>'+
      '</dl>'+
      '<div class="ecosystem-token-links">'+
        (site?'<a href="'+esc(site)+'" target="_blank" rel="noopener">Website ↗</a>':'')+
        (social?'<a href="'+esc(social)+'" target="_blank" rel="noopener">X / Social ↗</a>':'')+
      '</div>'+
    '</article>';
  }

  async function loadStats(){
    try{
      const r=await fetch('/api/ecosystem/stats',{cache:'no-store'}),d=await r.json();
      if(!r.ok)throw new Error(d.error||'XRPL ecosystem stats unavailable');
      const total=d.total_tokens??d.tokens??d.token_count;
      const nfts=d.total_nfts??d.nfts??d.nft_count;
      if(total!=null)q('#ecosystemAssetCount').textContent=number(total)+' assets indexed'+(d.stale?' · cached':'');
      else if(d.degraded&&d.ledger_index)q('#ecosystemAssetCount').textContent='XRPL ledger '+number(d.ledger_index)+' live · directory degraded';
      if(nfts!=null)q('#ecosystemNftCount').textContent=number(nfts)+' NFTs indexed'+(d.stale?' · cached':'');
      else if(d.degraded)q('#ecosystemNftCount').textContent='Directory metadata retrying';
    }catch{
      q('#ecosystemAssetCount').textContent='XRPL directory retrying';
      q('#ecosystemNftCount').textContent='Metadata unavailable';
    }
  }

  async function loadTokens(){
    grid.innerHTML='<p class="muted">Loading XRPL ecosystem assets…</p>';
    try{
      const p=new URLSearchParams({limit:String(PAGE),offset:String(offset),sort,trust});
      if(search)p.set('q',search);
      const r=await fetch('/api/ecosystem/tokens?'+p,{cache:'no-store'}),d=await r.json();
      if(!r.ok)throw new Error(d.error||'Unavailable');
      const tokens=Array.isArray(d.tokens)?d.tokens:[];
      count=Number(d.count)||tokens.length;
      grid.innerHTML=tokens.length?tokens.map(renderToken).join(''):'<p class="muted">No matching XRPL assets found.</p>';
      const page=Math.floor(offset/PAGE)+1,pages=Math.max(1,Math.ceil(count/PAGE));
      q('#ecosystemPage').textContent='Page '+page+' of '+pages;
      q('#ecosystemShowing').textContent=tokens.length+' of '+number(count)+(d.stale?' · cached':d.cached?' · cached':'');
      q('#ecosystemPrev').disabled=offset<=0;
      q('#ecosystemNext').disabled=offset+PAGE>=count;
    }catch(e){
      grid.innerHTML='<div class="ecosystem-retry"><p class="muted">XRPL Meta is not responding right now. XRPet will keep retrying, and validated XRPL live data remains available.</p><button id="ecosystemRetryNow" type="button" class="secondary">Retry directory now</button></div>';
      q('#ecosystemShowing').textContent='Retrying directory';
      q('#ecosystemRetryNow')?.addEventListener('click',loadTokens,{once:true});
      setTimeout(()=>{if(grid.querySelector('#ecosystemRetryNow'))loadTokens()},12000);
    }
  }

  async function loadX(){
    const box=q('#ecosystemXFeed'),badge=q('#ecosystemXBadge'),status=q('#ecosystemSocialStatus');
    try{
      const [feedRes,statusRes]=await Promise.all([
        fetch('/api/ecosystem/x-feed',{cache:'no-store'}),
        fetch('/api/x/status',{cache:'no-store'})
      ]);
      const d=await feedRes.json(),xs=await statusRes.json();
      if(!statusRes.ok)throw new Error(xs.error||'X status unavailable');
      const write=q('#xWriteStatus'),button=q('#xPostButton');
      if(write)write.textContent=xs.writeEnabled?'X WRITE READY · ADMIN KEY REQUIRED':'X WRITE NOT CONFIGURED';
      if(button)button.disabled=!xs.writeEnabled;
      if(!feedRes.ok)throw new Error(d.detail||d.error||'X feed unavailable');
      if(!d.enabled){
        badge.textContent='X NOT CONNECTED';status.textContent='Metadata links';
        box.innerHTML='<p class="muted">Add X_BEARER_TOKEN on the server to load live XRPL/XRP posts. Project-published X/social links remain available on asset cards.</p>';
        return;
      }
      badge.textContent='X LIVE';
      status.textContent='X feed connected · '+new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
      const items=d.items||[];
      box.innerHTML=items.length?items.map(item=>'<article class="ecosystem-x-item"><span>@'+esc(item.username||item.author)+'</span><p>'+esc(item.text)+'</p><a href="'+esc(item.url)+'" target="_blank" rel="noopener">Open on X ↗</a></article>').join(''):'<p class="muted">X is connected. No recent posts matched the configured XRPL query.</p>';
    }catch(err){
      badge.textContent='X DEGRADED';status.textContent='X API retrying';
      box.innerHTML='<p class="muted">X API is temporarily unavailable: '+esc(err?.message||'request failed')+'. XRPet will retry automatically.</p>';
    }
  }

  const xText=q('#xPostText'),xForm=q('#xPostForm'),xResult=q('#xPostResult'),xCount=q('#xPostCount'),xPostKey=q('#xPostKey');
  try{if(xPostKey)xPostKey.value=sessionStorage.getItem('xrpet-x-post-key')||''}catch{}
  xPostKey?.addEventListener('input',()=>{try{sessionStorage.setItem('xrpet-x-post-key',xPostKey.value)}catch{}});
  xText?.addEventListener('input',()=>{if(xCount)xCount.textContent=String(xText.value.length)});
  xForm?.addEventListener('submit',async e=>{
    e.preventDefault();
    const text=(xText?.value||'').trim();if(!text)return;
    const button=q('#xPostButton');if(button)button.disabled=true;
    if(xResult)xResult.textContent='Posting to X…';
    try{
      const postKey=(xPostKey?.value||'').trim();
      if(!postKey)throw new Error('Enter your XRPet admin post key before posting.');
      const r=await fetch('/api/x/post',{method:'POST',headers:{'content-type':'application/json','x-xrpet-post-key':postKey},body:JSON.stringify({text})});
      const d=await r.json();if(!r.ok)throw new Error(d.detail||d.error||'X post failed');
      if(xResult)xResult.innerHTML='Posted successfully'+(d.url?' · <a href="'+esc(d.url)+'" target="_blank" rel="noopener">Open on X ↗</a>':'');
      if(xText)xText.value='';if(xCount)xCount.textContent='0';
      loadX();
    }catch(err){
      if(xResult)xResult.textContent=err.message||'X post failed';
    }finally{
      try{
        const r=await fetch('/api/x/status',{cache:'no-store'}),d=await r.json();
        if(button)button.disabled=!d.writeEnabled;
      }catch{if(button)button.disabled=false}
    }
  });

  function renderNftActivity(){
    const box=q('#ecosystemNftActivity');if(!box)return;
    box.innerHTML=nftEvents.length?nftEvents.map(x=>'<article><span>'+esc(x.type)+'</span><strong>'+esc(x.account||'Unknown account')+'</strong><small>Ledger '+esc(x.ledger)+' · '+new Date(x.timestamp).toLocaleTimeString()+'</small></article>').join(''):'<p class="muted">Waiting for NFT transactions…</p>';
  }
  window.addEventListener('xrpet:xrplTransaction',e=>{
    const x=e.detail||{};
    if(!/^NFToken/i.test(String(x.type||'')))return;
    nftEvents.unshift(x);if(nftEvents.length>20)nftEvents.length=20;renderNftActivity();
  });

  q('#ecosystemSearchForm')?.addEventListener('submit',e=>{e.preventDefault();search=q('#ecosystemSearch').value.trim();offset=0;loadTokens()});
  q('#ecosystemSort')?.addEventListener('change',e=>{sort=e.target.value;offset=0;loadTokens()});
  q('#ecosystemTrust')?.addEventListener('change',e=>{trust=e.target.value;offset=0;loadTokens()});
  q('#ecosystemPrev')?.addEventListener('click',()=>{offset=Math.max(0,offset-PAGE);loadTokens();q('#ecosystemSection')?.scrollIntoView({block:'start'})});
  q('#ecosystemNext')?.addEventListener('click',()=>{if(offset+PAGE<count)offset+=PAGE;loadTokens();q('#ecosystemSection')?.scrollIntoView({block:'start'})});

  loadStats();loadTokens();loadX();
  setInterval(()=>{if(!document.hidden)loadStats()},60000);
  setInterval(()=>{if(!document.hidden)loadX()},30000);
  setInterval(()=>{if(!document.hidden)loadTokens()},300000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){loadStats();loadX();loadTokens()}});
})();