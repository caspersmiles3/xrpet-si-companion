(() => {
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>Array.from(r.querySelectorAll(s));

  const VIEW_TARGETS={
    home:'homeSection',
    live:'xrplPanel',
    exchanges:'exchangesSection',
    history:'xrpHistorySection',
    learn:'learnSection',
    announcements:'announcementsSection',
    ripplet:'companionSection',
    ecosystem:'ecosystemSection',
    games:'gamesSection'
  };

  function closeSidebarMenus(except=null){
    qa('#xrpetSidebar details[open]').forEach(menu=>{
      if(menu!==except)menu.removeAttribute('open');
    });
  }

  function showView(view='home',{keepMenu=null}={}){
    const next=VIEW_TARGETS[view]?view:'home';

    // Primary navigation always exits tools/customization mode.
    document.body.classList.remove('workspace-open','customization-open');
    qa('[data-customization-panel]').forEach(panel=>{
      panel.classList.remove('is-open');
      panel.hidden=true;
    });

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
    if(shell&&target){
      const deck=q('#topCommandDeck');
      const gap=(deck?.offsetHeight||0)+12;
      requestAnimationFrame(()=>{
        shell.scrollTop=Math.max(0,target.offsetTop-gap);
      });
    }else if(shell){
      shell.scrollTop=0;
    }
    window.dispatchEvent(new CustomEvent('xrpet:view-change',{detail:{view:next}}));
  }

  function showCustomization(id){
    const panel=q('#'+id);
    if(!panel)return;
    qa('[data-customization-panel]').forEach(p=>p.classList.remove('is-open'));
    panel.classList.add('is-open');
    panel.hidden=false;
    document.body.classList.add('workspace-open');
    const shell=q('.main-shell');if(shell)shell.scrollTop=0;
    requestAnimationFrame(()=>panel.scrollIntoView({block:'start',behavior:'auto'}));
  }

  document.addEventListener('click',e=>{
    const summary=e.target.closest?.('#xrpetSidebar summary[data-primary-view]');
    if(summary&&!summary.closest('details')?.disabled){
      showView(summary.dataset.primaryView,{keepMenu:summary.closest('details')});
      return;
    }

    const primary=e.target.closest?.('[data-primary-view]');
    if(primary&&!primary.disabled){
      showView(primary.dataset.primaryView);
      return;
    }

    const exchange=e.target.closest?.('[data-exchange]');
    if(exchange&&!exchange.disabled){
      showView('exchanges');
      return;
    }

    const history=e.target.closest?.('[data-history-view]');
    if(history&&!history.disabled){
      showView('history');
      return;
    }

    const ripplet=e.target.closest?.('[data-ripplet-view]');
    if(ripplet&&!ripplet.disabled){
      showView('ripplet');
      return;
    }

    const ecosystem=e.target.closest?.('[data-ecosystem-view]');
    if(ecosystem&&!ecosystem.disabled){
      showView('ecosystem');
      return;
    }

    const game=e.target.closest?.('[data-game-nav]');
    if(game&&!game.disabled){
      showView('games');
      return;
    }

    const custom=e.target.closest?.('[data-customize-target]');
    if(custom&&!custom.disabled){
      closeSidebarMenus();
      showCustomization(custom.dataset.customizeTarget);
    }
  },true);

  // Keep only one sidebar flyout open at a time without blocking native <details>.
  qa('#xrpetSidebar details').forEach(details=>{
    details.addEventListener('toggle',()=>{
      if(!details.open)return;
      qa('#xrpetSidebar details').forEach(other=>{
        if(other!==details)other.removeAttribute('open');
      });
    });
  });

  async function refreshMarket(){
    let data=null;
    try{
      const r=await fetch('/api/exchange-board',{cache:'no-store'});
      if(r.ok)data=await r.json();
    }catch{}
    if(!data){
      try{
        const r=await fetch('/api/market?exchange=all',{cache:'no-store'});
        if(r.ok){
          const m=await r.json();
          data={
            composite:{
              price:Number(m.price),
              change24h:Number(m.change24h),
              venueCount:Number(m.venueCount)||0
            },
            venues:[]
          };
        }
      }catch{}
    }
    if(!data)return;

    const composite=data.composite||{};
    const price=Number(composite.price);
    const change=Number(composite.change24h);
    if(Number.isFinite(price)){
      const text='$'+price.toFixed(5);
      const top=q('#globalXrpPrice');if(top)top.textContent=text;
      const live=q('#xrpPrice');if(live)live.textContent=text;
    }
    if(Number.isFinite(change)){
      const move=(change>=0?'+':'')+change.toFixed(2)+'%';
      const count=Number(composite.venueCount)||((data.venues||[]).filter(v=>v&&v.available).length);
      const topChange=q('#globalXrpChange');if(topChange)topChange.textContent=move+(count?' · '+count+' venues':'');
      const liveChange=q('#xrpChange');if(liveChange)liveChange.textContent=move+' · 24h';
    }
    [...(data.venues||[]),{...composite,id:'all'}].forEach(row=>{
      const p=Number(row.price);
      if(!Number.isFinite(p))return;
      qa('[data-exchange-price="'+row.id+'"]').forEach(el=>el.textContent='$'+p.toFixed(5));
    });
  }

  window.XRPetShell={showView,refreshMarket,closeSidebarMenus};
  if(!qa('.primary-view-section.view-active').length)showView('home');
  refreshMarket();
  setInterval(refreshMarket,5000);
})();