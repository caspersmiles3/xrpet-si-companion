(()=>{
  const root=document.querySelector('#gamesSection');
  if(!root)return;
  const q=s=>root.querySelector(s),qa=s=>[...root.querySelectorAll(s)];
  let totalScore=0;
  const emit=(type,detail={})=>window.dispatchEvent(new CustomEvent('xrpet:gameEvent',{detail:{type,...detail}}));
  const addTotal=n=>{totalScore=Math.max(0,totalScore+n);const el=q('#gamesTotalScore');if(el)el.textContent=String(totalScore).padStart(6,'0')};

  qa('[data-game-tab]').forEach(btn=>btn.addEventListener('click',()=>{
    const id=btn.dataset.gameTab;
    qa('[data-game-tab]').forEach(b=>{const on=b===btn;b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on))});
    qa('[data-game-panel]').forEach(p=>{const on=p.dataset.gamePanel===id;p.classList.toggle('active',on);p.hidden=!on});
  }));

  // Ledger Rush
  const rush={running:false,score:0,streak:0,time:30,timer:null,targetTimer:null};
  const rushTarget=q('#rushTarget'),rushArena=q('#rushArena');
  function updateRush(){
    q('#rushScore').textContent=rush.score;q('#rushStreak').textContent=rush.streak;q('#rushTime').textContent=rush.time;
  }
  function moveRushTarget(){
    if(!rush.running)return;
    const r=rushArena.getBoundingClientRect();
    const size=Math.max(48,Math.min(72,r.width*.09));
    const x=14+Math.random()*Math.max(10,r.width-size-28);
    const y=14+Math.random()*Math.max(10,r.height-size-28);
    rushTarget.style.width=size+'px';rushTarget.style.height=size+'px';
    rushTarget.style.transform='translate('+x+'px,'+y+'px)';
    rushTarget.classList.remove('pulse');void rushTarget.offsetWidth;rushTarget.classList.add('pulse');
    clearTimeout(rush.targetTimer);
    rush.targetTimer=setTimeout(()=>{if(rush.running){rush.streak=0;updateRush();moveRushTarget()}},950);
  }
  function stopRush(){
    rush.running=false;clearInterval(rush.timer);clearTimeout(rush.targetTimer);
    rushTarget.classList.remove('active');q('#rushStart').disabled=false;
    q('#rushStatus').textContent='Round complete · '+rush.score+' points';
    addTotal(rush.score);emit('complete',{game:'Ledger Rush',score:rush.score});
  }
  q('#rushStart').addEventListener('click',()=>{
    rush.running=true;rush.score=0;rush.streak=0;rush.time=30;updateRush();
    q('#rushStart').disabled=true;q('#rushStatus').textContent='Validate the active nodes.';rushTarget.classList.add('active');
    moveRushTarget();
    rush.timer=setInterval(()=>{rush.time-=1;updateRush();if(rush.time<=0)stopRush()},1000);
    emit('start',{game:'Ledger Rush'});
  });
  rushTarget.addEventListener('click',()=>{
    if(!rush.running)return;
    rush.streak+=1;const gain=10+Math.min(40,rush.streak*2);rush.score+=gain;updateRush();emit('hit',{game:'Ledger Rush',streak:rush.streak});moveRushTarget();
  });

  // XRP Flow
  const flow={running:false,score:0,lives:3,time:35,lane:1,timer:null,spawnTimer:null,objects:new Set()};
  const flowArena=q('#flowArena'),receiver=q('#flowReceiver');
  function updateFlow(){q('#flowScore').textContent=flow.score;q('#flowLives').textContent=flow.lives;q('#flowTime').textContent=flow.time;receiver.dataset.lane=flow.lane}
  function moveFlow(dir){if(!flow.running)return;flow.lane=Math.max(0,Math.min(2,flow.lane+dir));updateFlow()}
  q('#flowLeft').addEventListener('click',()=>moveFlow(-1));q('#flowRight').addEventListener('click',()=>moveFlow(1));
  flowArena.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();moveFlow(-1)}if(e.key==='ArrowRight'){e.preventDefault();moveFlow(1)}});
  function clearFlowObjects(){flow.objects.forEach(o=>o.remove());flow.objects.clear()}
  function spawnFlowPacket(){
    if(!flow.running)return;
    const lane=Math.floor(Math.random()*3),bad=Math.random()<.22;
    const packet=document.createElement('button');packet.type='button';packet.className='flow-packet '+(bad?'congestion':'xrp-packet');packet.dataset.lane=lane;packet.setAttribute('aria-label',bad?'Congestion packet':'XRP packet');packet.innerHTML=bad?'!':'X';
    flowArena.appendChild(packet);flow.objects.add(packet);
    const duration=2100+Math.random()*800,start=performance.now();
    function step(now){
      if(!flow.running||!packet.isConnected){packet.remove();flow.objects.delete(packet);return}
      const p=Math.min(1,(now-start)/duration);packet.style.top=(p*82)+'%';
      if(p>=1){
        if(lane===flow.lane){
          if(bad){flow.lives-=1;emit('miss',{game:'XRP Flow'});}else{flow.score+=15;emit('hit',{game:'XRP Flow'});}
          updateFlow();
          if(flow.lives<=0){stopFlow();return}
        }
        packet.remove();flow.objects.delete(packet);return;
      }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    flow.spawnTimer=setTimeout(spawnFlowPacket,420+Math.random()*420);
  }
  function stopFlow(){
    flow.running=false;clearInterval(flow.timer);clearTimeout(flow.spawnTimer);clearFlowObjects();q('#flowStart').disabled=false;
    q('#flowStatus').textContent='Flow complete · '+flow.score+' points';addTotal(flow.score);emit('complete',{game:'XRP Flow',score:flow.score});
  }
  q('#flowStart').addEventListener('click',()=>{
    clearFlowObjects();flow.running=true;flow.score=0;flow.lives=3;flow.time=35;flow.lane=1;updateFlow();q('#flowStart').disabled=true;q('#flowStatus').textContent='Catch XRP. Avoid congestion.';flowArena.focus();spawnFlowPacket();
    flow.timer=setInterval(()=>{flow.time-=1;updateFlow();if(flow.time<=0)stopFlow()},1000);emit('start',{game:'XRP Flow'});
  });

  // Consensus 80
  const cons={sequence:[],input:[],round:0,best:0,locked:true,playing:false};
  const validators=qa('[data-validator]');
  const delay=ms=>new Promise(r=>setTimeout(r,ms));
  function updateConsensus(){
    q('#consensusRound').textContent=cons.round;q('#consensusBest').textContent=cons.best;q('#consensusState').textContent=cons.locked?'WATCH':'REPEAT';
    q('#consensusMeter').style.width=Math.min(100,cons.round*10+20)+'%';
  }
  async function flashValidator(i){
    const b=validators[i];b.classList.add('lit');await delay(360);b.classList.remove('lit');await delay(120);
  }
  async function showSequence(){
    cons.locked=true;updateConsensus();q('#consensusStatus').textContent='Watch the validator sequence…';
    await delay(450);for(const i of cons.sequence)await flashValidator(i);
    cons.input=[];cons.locked=false;updateConsensus();q('#consensusStatus').textContent='Repeat the sequence.';
  }
  async function nextConsensusRound(){
    cons.round+=1;cons.sequence.push(Math.floor(Math.random()*4));updateConsensus();await showSequence();
  }
  q('#consensusStart').addEventListener('click',()=>{
    cons.sequence=[];cons.input=[];cons.round=0;cons.playing=true;cons.locked=true;q('#consensusStart').disabled=true;q('#consensusStatus').textContent='Initializing validators…';emit('start',{game:'Consensus 80'});nextConsensusRound();
  });
  validators.forEach((b,i)=>b.addEventListener('click',async()=>{
    if(!cons.playing||cons.locked)return;
    await flashValidator(i);cons.input.push(i);
    const pos=cons.input.length-1;
    if(cons.input[pos]!==cons.sequence[pos]){
      cons.playing=false;cons.locked=true;cons.best=Math.max(cons.best,cons.round-1);updateConsensus();q('#consensusStart').disabled=false;
      q('#consensusStatus').textContent='Consensus lost · reached round '+Math.max(0,cons.round-1);
      const score=Math.max(0,(cons.round-1)*40);addTotal(score);emit('complete',{game:'Consensus 80',score});return;
    }
    if(cons.input.length===cons.sequence.length){
      cons.best=Math.max(cons.best,cons.round);updateConsensus();emit('hit',{game:'Consensus 80',streak:cons.round});
      q('#consensusStatus').textContent='Consensus reached. Next round…';cons.locked=true;await delay(650);nextConsensusRound();
    }
  }));

  updateRush();updateFlow();updateConsensus();
})();