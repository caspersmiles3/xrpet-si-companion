(() => {
  const el = s => document.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let archive=null, liveUpdates=[], market=null, filter='All', query='';

  function tone(s){ return s==='up'||s==='positive'?'up':s==='down'?'down':s==='mixed'?'mixed':'neutral'; }
  function renderPeople(){
    const box=el('#xrpPeople');
    if(!box||!archive)return;
    box.innerHTML=archive.people.map(p=>`<article class="xrp-person"><strong>${esc(p.name)}</strong><span>${esc(p.role)}</span><p>${esc(p.involvement)}</p></article>`).join('');
  }
  function renderFilters(){
    const box=el('#xrpFilters'); if(!box||!archive)return;
    const cats=['All',...new Set(archive.events.map(e=>e.category))];
    box.innerHTML=cats.map(c=>`<button type="button" class="${filter===c?'active':''}" data-xcat="${esc(c)}">${esc(c)}</button>`).join('');
    box.querySelectorAll('[data-xcat]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.xcat;renderFilters();renderTimeline()}));
  }
  function allItems(){
    const historical=(archive?.events||[]).map(e=>({...e,live:false}));
    const live=liveUpdates.map((u,i)=>({
      date:new Date().toISOString().slice(0,10), year:new Date().getFullYear(),
      category:/acqui|custody|prime|treasury/i.test(u.title)?'Acquisition':/xrpl|ledger|amendment/i.test(u.title)?'XRPL':'Live',
      sentiment:'neutral', title:u.title,
      summary:`Latest official update from ${u.source}. Open the primary source for full details.`,
      people:[], source:u.url, live:true, key:'live-'+i
    }));
    return [...live,...historical].sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  }
  function significance(x){
    const map={
      Origins:'This explains how the XRP Ledger and the organizations around it began.',
      Ripple:'This is a Ripple-company milestone. It should not be treated as a protocol change unless XRPL is explicitly involved.',
      XRP:'This directly concerns XRP supply, distribution, usage, or asset-level history.',
      XRPL:'This concerns the open-source XRP Ledger network, its functionality, amendments, or operational history.',
      Legal:'This affected the legal or regulatory environment around Ripple and/or XRP and may have influenced access, adoption, or market sentiment.',
      Market:'This is market-history context. It describes what happened; it is not a forecast of future XRP performance.',
      Adoption:'This shows a real-world use, integration, customer, market-infrastructure, or payments development connected to Ripple/XRP/XRPL.',
      Acquisition:'This expanded Ripple’s business or institutional infrastructure through an acquisition.',
      People:'This explains the role of an individual who materially influenced the XRP Ledger, Ripple, or the XRP ecosystem.',
      Live:'This is a current official-source item and may be updated as more primary-source information becomes available.'
    };
    return map[x.category]||'This event is included because it materially affected the Ripple, XRP, or XRP Ledger story.';
  }
  function renderTimeline(){
    const box=el('#xrpTimeline'); if(!box||!archive)return;
    const q=query.trim().toLowerCase();
    const rows=allItems().filter(x=>(filter==='All'||x.category===filter) && (!q || [x.title,x.summary,x.category,(x.people||[]).join(' ')].join(' ').toLowerCase().includes(q)));
    box.innerHTML=rows.map(x=>`<article class="xrp-event ${tone(x.sentiment)}">
      <div class="xrp-event-rail"><i></i><span>${esc(String(x.year))}</span></div>
      <div class="xrp-event-body">
        <div class="xrp-event-meta"><b>${esc(x.category)}</b>${x.live?'<em>LIVE / AUTO-UPDATED</em>':''}<time>${esc(x.date)}</time></div>
        <h3>${esc(x.title)}</h3>
        <p>${esc(x.summary)}</p>
        <details class="xrp-event-details">
          <summary>Open detailed context</summary>
          <div>
            <strong>Why it matters</strong>
            <p>${esc(significance(x))}</p>
            ${(x.people||[]).length?`<p><b>People involved:</b> ${esc(x.people.join(', '))}</p>`:''}
            <p><b>Status:</b> ${x.live?'Current official-source update':'Historical archive entry'}</p>
            <a href="${esc(x.source)}" target="_blank" rel="noopener">Open primary source ↗</a>
          </div>
        </details>
      </div>
    </article>`).join('') || '<p class="muted">No timeline entries match this filter.</p>';
  }
  function renderMarket(){
    if(!market)return;
    const p=Number(market.price), ch=Number(market.change24h);
    const trend=Number.isFinite(ch)?(ch>=0?'UP':'DOWN'):'—';
    const box=el('#xrpArchiveLive');
    if(box)box.innerHTML=`
      <article><span>LIVE XRP/USD</span><strong>${Number.isFinite(p)?'$'+p.toFixed(4):'Unavailable'}</strong><small>${Number.isFinite(ch)?(ch>=0?'+':'')+ch.toFixed(2)+'% · 24h':'24h unavailable'}</small></article>
      <article><span>MARKET DIRECTION</span><strong>${trend}</strong><small>Live snapshot, not a forecast</small></article>
      <article><span>OFFICIAL FEED</span><strong>${liveUpdates.length}</strong><small>Current Ripple/XRPL items</small></article>
      <article><span>ARCHIVE</span><strong>${archive?.events?.length||0}+</strong><small>Major milestones since 2011</small></article>`;
  }
  async function refreshLive(){
    try{
      const [m,u]=await Promise.all([
        fetch('/api/market',{cache:'no-store'}).then(r=>r.ok?r.json():null),
        fetch('/api/updates',{cache:'no-store'}).then(r=>r.ok?r.json():null)
      ]);
      if(m)market=m;
      if(Array.isArray(u?.items))liveUpdates=u.items.slice(0,18);
      renderMarket();renderTimeline();
      const t=el('#xrpAutoTime'); if(t)t.textContent='Last auto-refresh: '+new Date().toLocaleTimeString();
    }catch{}
  }
  async function init(){
    const root=el('#xrpHistorySection'); if(!root)return;
    try{
      archive=await fetch('/xrp-history.json',{cache:'no-store'}).then(r=>r.json());
      renderPeople();renderFilters();renderTimeline();
      const input=el('#xrpHistorySearch');
      input?.addEventListener('input',()=>{query=input.value;renderTimeline()});
      el('#xrpRefreshHistory')?.addEventListener('click',refreshLive);
      await refreshLive();
      setInterval(refreshLive,60*1000);
    }catch(e){
      const box=el('#xrpTimeline'); if(box)box.innerHTML='<p class="muted">Ripple/XRP history archive is temporarily unavailable.</p>';
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init); else init();
})();