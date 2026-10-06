(()=>{
  const root=document.getElementById('gamesSection');if(!root)return;
  const q=s=>root.querySelector(s),qa=s=>[...root.querySelectorAll(s)];
  let totalScore=0;
  const emit=(type,detail={})=>window.dispatchEvent(new CustomEvent('xrpet:gameEvent',{detail:{type,...detail}}));
  const addTotal=n=>{totalScore=Math.max(0,totalScore+n);const el=q('#gamesTotalScore');if(el)el.textContent=String(totalScore).padStart(6,'0')};
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const delay=ms=>new Promise(r=>setTimeout(r,ms));

  qa('[data-game-tab]').forEach(btn=>btn.addEventListener('click',()=>{
    const id=btn.dataset.gameTab;
    qa('[data-game-tab]').forEach(b=>{const on=b===btn;b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on))});
    qa('[data-game-panel]').forEach(p=>{const on=p.dataset.gamePanel===id;p.classList.toggle('active',on);p.hidden=!on});
  }));

  // Ledger Rush — progressive validation pressure + decoys.
  const rush={running:false,score:0,streak:0,time:40,level:1,integrity:3,timer:null,targetTimer:null,decoys:new Set(),hits:0};
  const rushTarget=q('#rushTarget'),rushArena=q('#rushArena');
  function rushWindow(){return Math.max(360,980-rush.level*85)}
  function updateRush(){
    q('#rushScore').textContent=rush.score;
    q('#rushStreak').textContent=rush.streak;
    q('#rushTime').textContent=rush.time;
    q('#rushStatus').textContent=rush.running?'Level '+rush.level+' · Integrity '+rush.integrity+' · '+rushWindow()+'ms window':'Ready.';
  }
  function clearRushDecoys(){rush.decoys.forEach(d=>d.remove());rush.decoys.clear()}
  function spawnRushDecoys(count){
    clearRushDecoys();
    const r=rushArena.getBoundingClientRect();
    for(let i=0;i<count;i++){
      const d=document.createElement('button');d.type='button';d.className='rush-decoy';d.innerHTML='<span>×</span>';d.setAttribute('aria-label','Decoy validation node');
      const size=34+Math.random()*18;
      d.style.width=size+'px';d.style.height=size+'px';
      d.style.transform='translate('+(12+Math.random()*Math.max(20,r.width-size-24))+'px,'+(12+Math.random()*Math.max(20,r.height-size-24))+'px)';
      d.addEventListener('click',()=>{
        if(!rush.running)return;
        rush.integrity-=1;rush.streak=0;rush.score=Math.max(0,rush.score-25);
        emit('miss',{game:'Ledger Rush'});updateRush();
        if(rush.integrity<=0)stopRush('Integrity failed');else moveRushTarget();
      });
      rushArena.appendChild(d);rush.decoys.add(d);
    }
  }
  function moveRushTarget(){
    if(!rush.running)return;
    const r=rushArena.getBoundingClientRect();
    const size=Math.max(34,68-rush.level*3);
    const x=14+Math.random()*Math.max(10,r.width-size-28),y=14+Math.random()*Math.max(10,r.height-size-28);
    rushTarget.style.width=size+'px';rushTarget.style.height=size+'px';rushTarget.style.transform='translate('+x+'px,'+y+'px)';
    rushTarget.classList.remove('pulse');void rushTarget.offsetWidth;rushTarget.classList.add('pulse');
    spawnRushDecoys(Math.min(5,Math.max(0,rush.level-1)));
    clearTimeout(rush.targetTimer);
    rush.targetTimer=setTimeout(()=>{
      if(!rush.running)return;
      rush.integrity-=1;rush.streak=0;emit('miss',{game:'Ledger Rush'});updateRush();
      if(rush.integrity<=0)stopRush('Validation window missed');else moveRushTarget();
    },rushWindow());
  }
  function stopRush(reason='Round complete'){
    rush.running=false;clearInterval(rush.timer);clearTimeout(rush.targetTimer);clearRushDecoys();
    rushTarget.classList.remove('active');q('#rushStart').disabled=false;
    q('#rushStatus').textContent=reason+' · '+rush.score+' points · Level '+rush.level;
    addTotal(rush.score);emit('complete',{game:'Ledger Rush',score:rush.score,level:rush.level});
  }
  q('#rushStart').addEventListener('click',()=>{
    rush.running=true;rush.score=0;rush.streak=0;rush.time=40;rush.level=1;rush.integrity=3;rush.hits=0;
    q('#rushStart').disabled=true;rushTarget.classList.add('active');updateRush();moveRushTarget();emit('start',{game:'Ledger Rush'});
    rush.timer=setInterval(()=>{rush.time-=1;if(rush.time<=0)stopRush();else updateRush()},1000);
  });
  rushTarget.addEventListener('click',()=>{
    if(!rush.running)return;
    clearTimeout(rush.targetTimer);rush.hits+=1;rush.streak+=1;
    rush.level=1+Math.floor(rush.hits/5);
    const multiplier=1+Math.floor(rush.streak/4)*.25;
    rush.score+=Math.round((12+rush.level*4)*multiplier);
    if(rush.hits%8===0)rush.integrity=Math.min(4,rush.integrity+1);
    emit('hit',{game:'Ledger Rush',streak:rush.streak,level:rush.level});updateRush();moveRushTarget();
  });

  // XRP Flow — escalating traffic + combo + shield packets.
  const flow={running:false,score:0,lives:3,time:45,lane:1,level:1,combo:0,shield:0,timer:null,spawnTimer:null,objects:new Set(),caught:0};
  const flowArena=q('#flowArena'),receiver=q('#flowReceiver');
  function updateFlow(){
    q('#flowScore').textContent=flow.score;q('#flowLives').textContent=flow.lives;q('#flowTime').textContent=flow.time;
    receiver.dataset.lane=flow.lane;
    q('#flowStatus').textContent=flow.running?'Level '+flow.level+' · Combo x'+(1+Math.floor(flow.combo/4))+(flow.shield?' · Shield '+flow.shield:''):'Ready.';
  }
  function moveFlow(dir){if(!flow.running)return;flow.lane=clamp(flow.lane+dir,0,2);updateFlow()}
  q('#flowLeft').addEventListener('click',()=>moveFlow(-1));q('#flowRight').addEventListener('click',()=>moveFlow(1));
  flowArena.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();moveFlow(-1)}if(e.key==='ArrowRight'){e.preventDefault();moveFlow(1)}});
  function clearFlowObjects(){flow.objects.forEach(o=>o.remove());flow.objects.clear()}
  function spawnFlowPacket(){
    if(!flow.running)return;
    const lane=Math.floor(Math.random()*3);
    const roll=Math.random(),bad=roll<Math.min(.36,.18+flow.level*.025),shield=!bad&&roll>.93;
    const packet=document.createElement('button');packet.type='button';
    packet.className='flow-packet '+(bad?'congestion':shield?'shield-packet':'xrp-packet');packet.dataset.lane=lane;
    packet.setAttribute('aria-label',bad?'Congestion packet':shield?'Shield packet':'XRP packet');packet.innerHTML=bad?'!':shield?'◇':'X';
    flowArena.appendChild(packet);flow.objects.add(packet);
    const duration=Math.max(900,2450-flow.level*170)+Math.random()*420,start=performance.now();
    function step(now){
      if(!flow.running||!packet.isConnected){packet.remove();flow.objects.delete(packet);return}
      const p=Math.min(1,(now-start)/duration);packet.style.top=(p*82)+'%';
      if(p>=1){
        if(lane===flow.lane){
          if(bad){
            if(flow.shield>0){flow.shield-=1;flow.score+=5}
            else{flow.lives-=1;flow.combo=0;emit('miss',{game:'XRP Flow'})}
          }else if(shield){flow.shield=Math.min(2,flow.shield+1);flow.score+=10;emit('hit',{game:'XRP Flow',streak:flow.combo})}
          else{
            flow.caught+=1;flow.combo+=1;flow.level=1+Math.floor(flow.caught/8);
            const multi=1+Math.floor(flow.combo/4);flow.score+=15*multi;emit('hit',{game:'XRP Flow',streak:flow.combo,level:flow.level});
          }
          updateFlow();if(flow.lives<=0){stopFlow('Settlement failed');return}
        }else if(!bad&&!shield){flow.combo=0}
        packet.remove();flow.objects.delete(packet);return;
      }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    const cadence=Math.max(180,650-flow.level*45)+Math.random()*220;
    flow.spawnTimer=setTimeout(spawnFlowPacket,cadence);
  }
  function stopFlow(reason='Flow complete'){
    flow.running=false;clearInterval(flow.timer);clearTimeout(flow.spawnTimer);clearFlowObjects();q('#flowStart').disabled=false;
    q('#flowStatus').textContent=reason+' · '+flow.score+' points · Level '+flow.level;addTotal(flow.score);emit('complete',{game:'XRP Flow',score:flow.score,level:flow.level});
  }
  q('#flowStart').addEventListener('click',()=>{
    clearFlowObjects();Object.assign(flow,{running:true,score:0,lives:3,time:45,lane:1,level:1,combo:0,shield:0,caught:0});
    q('#flowStart').disabled=true;updateFlow();flowArena.focus();spawnFlowPacket();emit('start',{game:'XRP Flow'});
    flow.timer=setInterval(()=>{flow.time-=1;if(flow.time<=0)stopFlow();else updateFlow()},1000);
  });

  // Consensus 80 — memory + shrinking response clock.
  const cons={sequence:[],input:[],round:0,best:0,locked:true,playing:false,responseTimer:null,responseLeft:0};
  const validators=qa('[data-validator]');
  function updateConsensus(){
    q('#consensusRound').textContent=cons.round;q('#consensusBest').textContent=cons.best;
    q('#consensusState').textContent=cons.locked?'WATCH':Math.ceil(cons.responseLeft/1000)+'s';
    q('#consensusMeter').style.width=Math.min(100,20+cons.round*8)+'%';
  }
  async function flashValidator(i){
    const b=validators[i];b.classList.add('lit');await delay(Math.max(170,380-cons.round*18));b.classList.remove('lit');await delay(Math.max(70,125-cons.round*4));
  }
  function failConsensus(reason){
    clearInterval(cons.responseTimer);cons.playing=false;cons.locked=true;cons.best=Math.max(cons.best,cons.round-1);updateConsensus();q('#consensusStart').disabled=false;
    q('#consensusStatus').textContent=reason+' · reached round '+Math.max(0,cons.round-1);
    const score=Math.max(0,(cons.round-1)*50);addTotal(score);emit('complete',{game:'Consensus 80',score,level:cons.round-1});
  }
  function startResponseClock(){
    clearInterval(cons.responseTimer);
    cons.responseLeft=Math.max(2200,6200-cons.round*300);
    updateConsensus();
    cons.responseTimer=setInterval(()=>{cons.responseLeft-=100;updateConsensus();if(cons.responseLeft<=0)failConsensus('Consensus timed out')},100);
  }
  async function showSequence(){
    cons.locked=true;clearInterval(cons.responseTimer);updateConsensus();q('#consensusStatus').textContent='Watch the validator sequence…';
    await delay(400);for(const i of cons.sequence)await flashValidator(i);
    cons.input=[];cons.locked=false;q('#consensusStatus').textContent='Repeat before the response window closes.';startResponseClock();
  }
  async function nextConsensusRound(){
    cons.round+=1;
    cons.sequence.push(Math.floor(Math.random()*validators.length));
    if(cons.round>6&&cons.round%3===0)cons.sequence.push(Math.floor(Math.random()*validators.length));
    updateConsensus();await showSequence();
  }
  q('#consensusStart').addEventListener('click',()=>{
    clearInterval(cons.responseTimer);Object.assign(cons,{sequence:[],input:[],round:0,playing:true,locked:true,responseLeft:0});
    q('#consensusStart').disabled=true;q('#consensusStatus').textContent='Initializing validator quorum…';emit('start',{game:'Consensus 80'});nextConsensusRound();
  });
  validators.forEach((b,i)=>b.addEventListener('click',async()=>{
    if(!cons.playing||cons.locked)return;
    await flashValidator(i);cons.input.push(i);
    const pos=cons.input.length-1;
    if(cons.input[pos]!==cons.sequence[pos])return failConsensus('Consensus lost');
    if(cons.input.length===cons.sequence.length){
      clearInterval(cons.responseTimer);cons.best=Math.max(cons.best,cons.round);emit('hit',{game:'Consensus 80',streak:cons.round});
      q('#consensusStatus').textContent='Consensus reached. Difficulty increasing…';cons.locked=true;updateConsensus();await delay(520);nextConsensusRound();
    }
  }));

  updateRush();updateFlow();updateConsensus();
})();