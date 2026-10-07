(() => {
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const finiteNumber=v=>{if(v===null||v===undefined||v==='')return null;const n=Number(v);return Number.isFinite(n)?n:null};

  const VIEW_TARGETS={
    home:'homeSection',
    live:'xrplPanel',
    exchanges:'exchangesSection',
    history:'xrpHistorySection',
    'history-origins':'historyOriginsSection',
    'history-ripple':'historyRippleSection',
    'history-xrp':'historyXrpSection',
    'history-xrpl':'historyXrplSection',
    'history-legal':'historyLegalSection',
    'history-market':'historyMarketSection',
    'history-adoption':'historyAdoptionSection',
    'history-acquisition':'historyAcquisitionSection',
    'history-people':'historyPeopleSection',
    learn:'learnSection',
    announcements:'announcementsSection',
    ripplet:'companionSection',
    ecosystem:'ecosystemSection',
    games:'gamesSection'
  };

  const HISTORY_META={
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
  const HISTORY_VIEW_TARGETS={
    All:'history',
    Origins:'history-origins',
    Ripple:'history-ripple',
    XRP:'history-xrp',
    XRPL:'history-xrpl',
    Legal:'history-legal',
    Market:'history-market',
    Adoption:'history-adoption',
    Acquisition:'history-acquisition',
    People:'history-people'
  };

  let historyArchiveCache=null;
  async function getHistoryArchive(){
    if(historyArchiveCache)return historyArchiveCache;
    const r=await fetch('/xrp-history.json',{cache:'no-store'});
    if(!r.ok)throw new Error('History archive unavailable');
    historyArchiveCache=await r.json();
    return historyArchiveCache;
  }
  function historyWhy(category){
    const map={
      Origins:'This explains the creation and earliest development of the XRP Ledger and the organizations that formed around it.',
      Ripple:'This is a Ripple-company milestone. Ripple the company is kept distinct from XRP and the public XRP Ledger.',
      XRP:'This concerns XRP supply, distribution, utility, or asset-level history.',
      XRPL:'This concerns the XRP Ledger protocol, amendments, network operations, or infrastructure.',
      Legal:'This affected the legal or regulatory environment surrounding Ripple and/or XRP.',
      Market:'This is historical market-cycle context only. It is descriptive, not a prediction.',
      Adoption:'This records payment, integration, institutional, or ecosystem adoption connected to Ripple/XRP/XRPL.',
      Acquisition:'This records an acquisition or institutional-infrastructure expansion by Ripple.'
    };
    return map[category]||'This event is part of the Ripple, XRP, and XRP Ledger historical record.';
  }
  function renderHistoryEvents(rows,container=q('#xrpTimeline')){
    const box=container;if(!box)return;
    box.innerHTML=rows.length?rows.map(x=>'<article class="xrp-event '+(x.sentiment==='up'||x.sentiment==='positive'?'up':x.sentiment==='down'?'down':x.sentiment==='mixed'?'mixed':'neutral')+'">'+
      '<div class="xrp-event-rail"><i></i><span>'+esc(x.year||'')+'</span></div>'+
      '<div class="xrp-event-body">'+
        '<div class="xrp-event-meta"><b>'+esc(x.category||'History')+'</b><time>'+esc(x.date||'')+'</time></div>'+
        '<h3>'+esc(x.title||'Historical event')+'</h3>'+
        '<p>'+esc(x.summary||'')+'</p>'+
        '<details class="xrp-event-details"><summary>Open detailed context</summary><div>'+
          '<strong>Why it matters</strong><p>'+esc(historyWhy(x.category))+'</p>'+
          ((x.people||[]).length?'<p><b>People involved:</b> '+esc((x.people||[]).join(', '))+'</p>':'')+
          '<p><b>Status:</b> Historical archive entry</p>'+
          (x.source?'<a href="'+esc(x.source)+'" target="_blank" rel="noopener">Open primary source ↗</a>':'')+
        '</div></details>'+
      '</div>'+
    '</article>').join(''):'<div class="history-empty-state"><strong>No entries found for this section.</strong><p>The archive loaded correctly, but this category currently has no matching milestones.</p></div>';
  }
  async function renderHistoryView(view='All'){
    const targetView=HISTORY_VIEW_TARGETS[view]||'history';
    const section=q('#'+VIEW_TARGETS[targetView]);
    const content=section?.querySelector('[data-history-page-content]')||q('#xrpTimeline');
    if(content)content.innerHTML='<p class="muted">Loading '+esc((HISTORY_META[view]||HISTORY_META.All)[0])+'…</p>';
    try{
      const archive=await getHistoryArchive();
      if(view==='People'){
        if(content){
          content.innerHTML=(archive.people||[]).map(p=>'<article class="xrp-person"><strong>'+esc(p.name)+'</strong><span>'+esc(p.role)+'</span><p>'+esc(p.involvement)+'</p></article>').join('')||'<div class="history-empty-state"><strong>No people entries found.</strong></div>';
        }
        return;
      }
      const rows=(archive.events||[])
        .filter(x=>view==='All'||x.category===view)
        .sort((a,b)=>String(b.date).localeCompare(String(a.date)));
      renderHistoryEvents(rows,content);
    }catch(err){
      if(content)content.innerHTML='<div class="history-empty-state"><strong>History archive could not load.</strong><p>XRPet will retry when you open this page again.</p></div>';
    }
  }

  function closeSidebarMenus(except=null){
    qa('#xrpetSidebar details[open]').forEach(menu=>{
      if(menu!==except)menu.removeAttribute('open');
    });
  }

  function resetWorkspace(){
    document.body.classList.remove('workspace-open','customization-open');
    qa('[data-customization-panel]').forEach(panel=>{
      panel.classList.remove('is-open');
      panel.hidden=true;
    });
  }

  function showView(view='home',{keepMenu=null}={}){
    const next=VIEW_TARGETS[view]?view:'home';
    resetWorkspace();

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

    qa('[data-primary-view]').forEach(el=>el.classList.toggle('active',el.dataset.primaryView===next));
    document.body.dataset.primaryView=next;

    const shell=q('.main-shell');
    const target=q('#'+VIEW_TARGETS[next]);
    if(target){
      target.hidden=false;
      target.scrollTop=0;
    }
    closeSidebarMenus(keepMenu);

    // The shell is locked; only the active page scrolls.
    if(shell)shell.scrollTop=0;
    requestAnimationFrame(()=>{
      if(target)target.scrollTop=0;
    });

    if(next==='announcements')loadAnnouncements();
    if(next==='exchanges')refreshMarket();
    window.dispatchEvent(new CustomEvent('xrpet:view-change',{detail:{view:next}}));
  }

  function showHistory(view='All'){
    const selected=HISTORY_META[view]?view:'All';
    const destination=HISTORY_VIEW_TARGETS[selected]||'history';
    showView(destination);

    // Keep Settlements + History visually selected while a dedicated history page is open.
    q('#historyNavDetails > summary')?.classList.add('active');
    window.XRPetHistoryPending=selected;

    if(selected==='All'){
      const section=q('#xrpHistorySection');
      if(section)section.dataset.historyMode='All';
      try{window.XRPetHistory?.setView?.('All')}catch{}
    }

    renderHistoryView(selected);
  }

  function showLearn(name='xrp'){
    showView('learn');
    const target=qa('[data-learn-panel]').some(p=>p.dataset.learnPanel===name)?name:'xrp';
    qa('[data-learn-panel]').forEach(panel=>{
      const active=panel.dataset.learnPanel===target;
      panel.classList.toggle('active',active);
      panel.hidden=!active;
    });
    qa('[data-learn-module]').forEach(btn=>btn.classList.toggle('active',btn.dataset.learnModule===target));
    const section=q('#learnSection');if(section)section.scrollTop=0;
  }

  function showEcosystem(view='directory'){
    showView('ecosystem');
    const target=qa('[data-ecosystem-panel]').some(p=>p.dataset.ecosystemPanel===view)?view:'directory';
    qa('[data-ecosystem-panel]').forEach(panel=>{
      const active=panel.dataset.ecosystemPanel===target;
      panel.classList.toggle('active',active);
      panel.hidden=!active;
    });
    qa('[data-ecosystem-view]').forEach(btn=>btn.classList.toggle('active',btn.dataset.ecosystemView===target));
  }

  function showGame(id='ledgerRush'){
    showView('games');
    const target=qa('[data-game-panel]').some(p=>p.dataset.gamePanel===id)?id:'ledgerRush';
    qa('[data-game-tab]').forEach(btn=>{
      const active=btn.dataset.gameTab===target;
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-selected',String(active));
    });
    qa('[data-game-panel]').forEach(panel=>{
      const active=panel.dataset.gamePanel===target;
      panel.classList.toggle('active',active);
      panel.hidden=!active;
    });
    qa('[data-game-nav]').forEach(btn=>btn.classList.toggle('active',btn.dataset.gameNav===target));
  }

  function showRipplet(){
    showView('ripplet');
    qa('[data-ripplet-panel]').forEach(panel=>{
      const active=panel.dataset.rippletPanel==='overview';
      panel.classList.toggle('active',active);
      panel.hidden=!active;
    });
  }

  function showCustomization(id){
    const panel=q('#'+id);
    if(!panel)return;
    qa('[data-customization-panel]').forEach(p=>{
      const active=p===panel;
      p.classList.toggle('is-open',active);
      p.hidden=!active;
    });
    panel.hidden=false;
    document.body.classList.add('workspace-open');
    document.body.classList.remove('customization-open');
    closeSidebarMenus();
    const shell=q('.main-shell');if(shell)shell.scrollTop=0;
    panel.scrollTop=0;
    requestAnimationFrame(()=>{panel.scrollTop=0});
  }

  async function selectExchange(id='all'){
    showView('exchanges');
    qa('[data-exchange]').forEach(btn=>btn.classList.toggle('active',btn.dataset.exchange===id));
    const clicked=q('[data-exchange="'+CSS.escape(id)+'"]');
    const name=clicked?.querySelector('strong')?.textContent?.trim()||'All Exchanges';
    if(q('#selectedExchangeName'))q('#selectedExchangeName').textContent=name;
    try{
      const r=await fetch('/api/market?exchange='+encodeURIComponent(id),{cache:'no-store'});
      const d=await r.json();
      if(!r.ok)throw new Error(d.detail||d.error||'Market unavailable');
      const price=finiteNumber(d.price),change=finiteNumber(d.change24h);
      if(Number.isFinite(price)){
        if(q('#xrpPrice'))q('#xrpPrice').textContent='$'+price.toFixed(5);
        qa('[data-exchange-price="'+id+'"]').forEach(el=>el.textContent='$'+price.toFixed(5));
      }
      if(Number.isFinite(change)&&q('#xrpChange'))q('#xrpChange').textContent=(change>=0?'+':'')+change.toFixed(2)+'% · 24h';
      if(q('#marketSource'))q('#marketSource').textContent=d.source||name+' live market API';
    }catch{
      if(q('#marketSource'))q('#marketSource').textContent=name+' feed reconnecting';
    }
  }

  async function loadAnnouncements(){
    const box=q('#updates');if(!box)return;
    box.innerHTML='<p class="muted">Checking official Ripple and XRP Ledger sources…</p>';
    try{
      const r=await fetch('/api/updates',{cache:'no-store'});
      const d=await r.json();
      const items=Array.isArray(d.items)?d.items.slice(0,16):[];
      if(!r.ok||!items.length)throw new Error(d.detail||d.error||'No updates returned');
      box.innerHTML=items.map((x,i)=>'<article class="announcement-card"><div class="announcement-index">'+String(i+1).padStart(2,'0')+'</div><div><span class="announcement-source">'+esc(x.source)+' · '+esc(x.label||'CONFIRMED')+'</span><a href="'+esc(x.url)+'" target="_blank" rel="noopener">'+esc(x.title)+'</a><small>Official source ↗</small></div></article>').join('');
      if(q('#announcementStatus'))q('#announcementStatus').textContent='Live';
      if(q('#announcementUpdated'))q('#announcementUpdated').textContent='Updated '+new Date().toLocaleTimeString();
    }catch{
      box.innerHTML='<p class="muted">Official Ripple/XRPL feed is reconnecting. Use Refresh now to retry immediately.</p>';
      if(q('#announcementStatus'))q('#announcementStatus').textContent='Reconnecting';
      if(q('#announcementUpdated'))q('#announcementUpdated').textContent='Automatic retry active';
    }
  }

  async function refreshMarket(){
    let data=null;
    try{
      const r=await fetch('/api/exchange-board',{cache:'no-store'});
      if(r.ok)data=await r.json();
    }catch{}
    if(!data||!Number.isFinite(finiteNumber(data?.composite?.price))){
      try{
        const r=await fetch('/api/market?exchange=all',{cache:'no-store'});
        if(r.ok){
          const m=await r.json();
          data={composite:{price:finiteNumber(m.price),change24h:finiteNumber(m.change24h),venueCount:finiteNumber(m.venueCount)||0},venues:[]};
        }
      }catch{}
    }
    if(!data)return;

    const composite=data.composite||{};
    const price=finiteNumber(composite.price),change=finiteNumber(composite.change24h);
    if(Number.isFinite(price)){
      const text='$'+price.toFixed(5);
      if(q('#globalXrpPrice'))q('#globalXrpPrice').textContent=text;
      if(q('#xrpPrice'))q('#xrpPrice').textContent=text;
      qa('[data-exchange-price="all"]').forEach(el=>el.textContent=text);
    }
    if(Number.isFinite(change)){
      const move=(change>=0?'+':'')+change.toFixed(2)+'%';
      const count=Number(composite.venueCount)||((data.venues||[]).filter(v=>v&&v.available).length);
      if(q('#globalXrpChange'))q('#globalXrpChange').textContent=move+(count?' · '+count+' venues':'');
      if(q('#xrpChange'))q('#xrpChange').textContent=move+' · 24h';
    }
    for(const row of data.venues||[]){
      const p=finiteNumber(row?.price);
      qa('[data-exchange-price="'+row.id+'"]').forEach(el=>{
        el.textContent=Number.isFinite(p)?'$'+p.toFixed(5):'—';
        el.dataset.available=Number.isFinite(p)?'true':'false';
      });
    }
  }

  document.addEventListener('click',e=>{
    const summary=e.target.closest?.('#xrpetSidebar summary[data-primary-view]');
    if(summary){
      const view=summary.dataset.primaryView;
      if(view==='history')showView('history',{keepMenu:summary.closest('details')});
      else if(view==='ecosystem')showView('ecosystem',{keepMenu:summary.closest('details')});
      else if(view==='games')showView('games',{keepMenu:summary.closest('details')});
      return;
    }

    // Non-summary primary navigation and subview controls are owned by app.js.
    // Keeping a single navigation owner prevents duplicate view switches and duplicate API requests.
    const history=e.target.closest?.('[data-history-view]');
    if(history&&!history.disabled){showHistory(history.dataset.historyView);return}

    const custom=e.target.closest?.('[data-customize-target]');
    if(custom&&!custom.disabled){showCustomization(custom.dataset.customizeTarget);return}
  },true);

  qa('#xrpetSidebar details').forEach(details=>{
    details.addEventListener('toggle',()=>{
      if(!details.open)return;
      qa('#xrpetSidebar details').forEach(other=>{if(other!==details)other.removeAttribute('open')});
    });
  });

  q('#xrpRefreshHistory')?.addEventListener('click',()=>{try{window.XRPetHistory?.setView?.(window.XRPetHistoryPending||'All')}catch{}});
  window.addEventListener('xrpet:view-change',e=>{
    if(e.detail?.view==='announcements')loadAnnouncements();
  });

  window.XRPetShell={showView,showHistory,showLearn,showEcosystem,showGame,showCustomization,selectExchange,refreshMarket,loadAnnouncements,closeSidebarMenus};

  if(!qa('.primary-view-section.view-active').length)showView('home');
  else resetWorkspace();
})();