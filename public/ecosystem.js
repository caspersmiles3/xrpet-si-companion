(() => {
  const q=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const grid=q('#ecosystemTokenGrid');
  if(!grid)return;

  const PAGE=48;
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
      const total=d.total_tokens??d.tokens??d.token_count;
      const nfts=d.total_nfts??d.nfts??d.nft_count;
      if(total!=null)q('#ecosystemAssetCount').textContent=number(total)+' assets indexed';
      if(nfts!=null)q('#ecosystemNftCount').textContent=number(nfts)+' NFTs indexed';
    }catch{}
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
      q('#ecosystemShowing').textContent=tokens.length+' of '+number(count);
      q('#ecosystemPrev').disabled=offset<=0;
      q('#ecosystemNext').disabled=offset+PAGE>=count;
    }catch(e){
      grid.innerHTML='<p class="muted">The XRPL ecosystem directory is temporarily unavailable. Live ledger data is still running.</p>';
    }
  }

  async function loadX(){
    const box=q('#ecosystemXFeed'),badge=q('#ecosystemXBadge'),status=q('#ecosystemSocialStatus');
    try{
      const r=await fetch('/api/ecosystem/x-feed',{cache:'no-store'}),d=await r.json();
      if(!d.enabled){
        badge.textContent='METADATA LINKS';
        status.textContent='Metadata links';
        box.innerHTML='<p class="muted">Live X posts are ready to connect. Until an X API source is configured, XRPet shows each project’s published X/social link directly on its asset card.</p>';
        return;
      }
      badge.textContent='X LIVE';status.textContent='X feed connected';
      const items=d.items||[];
      box.innerHTML=items.length?items.map(x=>'<article class="ecosystem-x-item"><span>@'+esc(x.username||x.author)+'</span><p>'+esc(x.text)+'</p><a href="'+esc(x.url)+'" target="_blank" rel="noopener">Open on X ↗</a></article>').join(''):'<p class="muted">No recent posts matched the configured XRPL X feed.</p>';
    }catch{
      badge.textContent='X RETRYING';box.innerHTML='<p class="muted">X feed is temporarily unavailable.</p>';
    }
  }

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
  setInterval(loadStats,60000);
  setInterval(loadX,30000);
})();