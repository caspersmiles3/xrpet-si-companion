(() => {
  const host=document.getElementById('xrpetMusicDeck');
  if(!host)return;

  const root=host.shadowRoot||host.attachShadow({mode:'open'});
  root.innerHTML=`
    <style>
      :host{
        display:block;
        width:100%;
        min-width:0;
        height:126px;
        min-height:126px;
        max-height:126px;
        box-sizing:border-box;
        font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
        color:#eafcff;
      }
      *{box-sizing:border-box}
      .player{
        width:100%;
        height:100%;
        padding:7px 8px;
        display:grid;
        grid-template-rows:16px 32px 20px 23px 15px;
        gap:4px;
        overflow:hidden;
        border:1px solid #1b414e;
        border-top-color:#2f6676;
        border-radius:9px;
        background:
          radial-gradient(circle at 12% 0%,rgba(104,226,244,.05),transparent 31%),
          linear-gradient(180deg,#08171e 0%,#041015 65%,#02090d 100%);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.04),
          inset 0 -4px 10px rgba(0,0,0,.28);
      }
      .head{
        min-width:0;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:8px;
        overflow:hidden;
      }
      .label{
        min-width:0;
        overflow:hidden;
        white-space:nowrap;
        text-overflow:ellipsis;
        color:#7897a1;
        font-size:5px;
        line-height:1;
        font-weight:900;
        letter-spacing:.14em;
        text-transform:uppercase;
      }
      .status{
        flex:0 0 auto;
        display:flex;
        align-items:center;
        gap:4px;
        color:#7a969f;
        font-size:5px;
        line-height:1;
        font-weight:900;
        letter-spacing:.08em;
      }
      .status::before{
        content:"";
        width:4px;
        height:4px;
        border-radius:50%;
        background:#536d76;
      }
      :host(.playing) .status{color:#90e8ba}
      :host(.playing) .status::before{
        background:#63e0ad;
        box-shadow:0 0 7px rgba(99,224,173,.48);
      }

      .controls{
        display:grid;
        grid-template-columns:30px 40px 30px 30px;
        justify-content:center;
        align-items:center;
        gap:7px;
        min-width:0;
        overflow:hidden;
      }
      button{
        appearance:none;
        -webkit-appearance:none;
        width:30px;
        height:30px;
        margin:0;
        padding:0;
        display:grid;
        place-items:center;
        border:1px solid #214955;
        border-top-color:#347082;
        border-radius:6px;
        background:linear-gradient(180deg,#12303a,#0a2028 54%,#06161c);
        color:#c4f2f7;
        font:700 11px/1 ui-sans-serif,system-ui,sans-serif;
        cursor:pointer;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.06),
          inset 0 -2px 5px rgba(0,0,0,.36);
      }
      button:hover{
        border-color:#3d8294;
        color:#fff;
      }
      button:active{transform:translateY(1px)}
      #play{
        width:40px;
        height:32px;
        color:#f3feff;
        font-size:13px;
        border-color:#326e7e;
      }
      #shuffle.active{
        color:#d8fcff;
        border-color:#347485;
        background:linear-gradient(180deg,#16404b,#0b2831 55%,#071a20);
      }

      .track{
        min-width:0;
        display:grid;
        grid-template-columns:minmax(0,1fr) auto;
        align-items:center;
        gap:8px;
        padding:0 1px;
        overflow:hidden;
      }
      .track strong{
        min-width:0;
        display:block;
        overflow:hidden;
        white-space:nowrap;
        text-overflow:ellipsis;
        color:#ecfcff;
        font-size:9px;
        line-height:1;
        font-weight:800;
      }
      .track small{
        flex:0 0 auto;
        color:#617d86;
        font-size:5px;
        line-height:1;
        font-weight:700;
        white-space:nowrap;
      }

      canvas{
        display:block;
        width:100%;
        height:23px;
        min-width:0;
        border:1px solid rgba(84,200,224,.10);
        border-radius:5px;
        background:#02090d;
      }

      .volume{
        min-width:0;
        display:grid;
        grid-template-columns:22px minmax(0,1fr);
        align-items:center;
        gap:6px;
        padding:0 1px;
        overflow:hidden;
      }
      .volume span{
        color:#617b85;
        font-size:5px;
        line-height:1;
        font-weight:900;
        letter-spacing:.04em;
      }
      input[type="range"]{
        width:100%;
        min-width:0;
        height:12px;
        margin:0;
        accent-color:#58d8ec;
        cursor:pointer;
      }

      @media (max-height:700px){
        :host{
          height:112px;
          min-height:112px;
          max-height:112px;
        }
        .player{
          padding:5px 7px;
          grid-template-rows:14px 28px 17px 19px 13px;
          gap:3px;
        }
        .controls{
          grid-template-columns:27px 36px 27px 27px;
          gap:6px;
        }
        button{
          width:27px;
          height:27px;
        }
        #play{
          width:36px;
          height:28px;
        }
        .track strong{font-size:8px}
        canvas{height:19px}
      }
    </style>

    <div class="player">
      <div class="head">
        <span class="label">XRPet Soundtrack</span>
        <span id="status" class="status">READY</span>
      </div>

      <div class="controls" aria-label="Music controls">
        <button id="prev" type="button" aria-label="Previous track" title="Previous track">‹</button>
        <button id="play" type="button" aria-label="Play soundtrack" title="Play">▶</button>
        <button id="next" type="button" aria-label="Next track" title="Next track">›</button>
        <button id="shuffle" type="button" aria-label="Toggle shuffle" aria-pressed="false" title="Shuffle">⤨</button>
      </div>

      <div class="track">
        <strong id="title">Ready</strong>
        <small id="meta">1 / 6</small>
      </div>

      <canvas id="wave" width="220" height="28" aria-label="Live soundtrack waveform"></canvas>

      <label class="volume">
        <span>VOL</span>
        <input id="volume" type="range" min="0" max="1" step="0.05" value="0.75" aria-label="Music volume">
      </label>

      <audio id="audio" preload="metadata" playsinline></audio>
    </div>
  `;

  const audio=root.getElementById('audio');
  const play=root.getElementById('play');
  const prev=root.getElementById('prev');
  const next=root.getElementById('next');
  const shuffleBtn=root.getElementById('shuffle');
  const volume=root.getElementById('volume');
  const title=root.getElementById('title');
  const meta=root.getElementById('meta');
  const status=root.getElementById('status');
  const waveform=root.getElementById('wave');
  const waveCtx=waveform.getContext('2d');

  window.XRPetMusicPlaying=false;

  const tracks=[
    ['Corrupted Transmission 2','Corrupted Transmission 2 (Instr.).mp3'],
    ['Distant Stars 2','Distant Stars 2 (Instr.).mp3'],
    ['Kardashev Scale','Kardashev Scale (Instr.).mp3'],
    ['Liquid Restlessness','Liquid Restlessness (Instr.).mp3'],
    ['Payment Clearing','Payment Clearing (Instr.).mp3'],
    ['Unified Pulse','Unified Pulse (Instr.).mp3']
  ];

  const STORAGE_KEY='xrpet-music-v5';
  let state={index:0,shuffle:false,volume:.75};
  try{
    const prior=JSON.parse(localStorage.getItem('xrpet-music-v4')||'null');
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
    state={...state,...(prior||{}),...(saved||{})};
  }catch{}

  state.index=Math.max(0,Math.min(tracks.length-1,Number(state.index)||0));
  state.volume=Number.isFinite(Number(state.volume))
    ? Math.max(.05,Math.min(1,Number(state.volume)))
    : .75;

  let changingTrack=false;
  let usingFallback=false;
  let audioCtx=null;
  let analyser=null;
  let mediaSource=null;
  let waveData=null;
  let lastWaveFrame=0;

  const save=()=>{
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch{}
  };
  const localUrl=file=>'/audio/'+encodeURIComponent(file).replace(/%2F/g,'/');
  const rawUrl=file=>'https://raw.githubusercontent.com/caspersmiles3/xrpet-si-companion/main/public/audio/'+encodeURIComponent(file).replace(/%2F/g,'/');

  function updateText(){
    title.textContent=tracks[state.index][0];
    meta.textContent=(state.index+1)+' / '+tracks.length+(state.shuffle?' · SHF':'');
  }

  function setStatus(value){
    status.textContent=value;
  }

  function resizeWave(){
    const rect=waveform.getBoundingClientRect();
    const dpr=Math.min(2,window.devicePixelRatio||1);
    const w=Math.max(80,Math.round(rect.width*dpr));
    const h=Math.max(18,Math.round(rect.height*dpr));
    if(waveform.width!==w||waveform.height!==h){
      waveform.width=w;
      waveform.height=h;
    }
  }

  function ensureAnalyser(){
    if(analyser)return;
    try{
      audioCtx=new (window.AudioContext||window.webkitAudioContext)();
      analyser=audioCtx.createAnalyser();
      analyser.fftSize=128;
      analyser.smoothingTimeConstant=.84;
      mediaSource=audioCtx.createMediaElementSource(audio);
      mediaSource.connect(analyser);
      analyser.connect(audioCtx.destination);
      waveData=new Uint8Array(analyser.frequencyBinCount);
    }catch{
      analyser=null;
      audioCtx=null;
      mediaSource=null;
      waveData=null;
    }
  }

  function drawWave(frameTime=0){
    requestAnimationFrame(drawWave);
    if(document.hidden)return;
    const playing=!audio.paused&&!audio.ended&&!audio.error;
    if(frameTime-lastWaveFrame<(playing?45:160))return;
    lastWaveFrame=frameTime;

    resizeWave();
    const W=waveform.width;
    const H=waveform.height;
    const dpr=Math.min(2,window.devicePixelRatio||1);
    waveCtx.clearRect(0,0,W,H);

    const bars=30;
    const gap=2*dpr;
    const bw=Math.max(1,(W-gap*(bars-1))/bars);
    if(analyser&&waveData)analyser.getByteFrequencyData(waveData);
    const now=performance.now()/1000;

    for(let i=0;i<bars;i++){
      let level=.07;
      if(analyser&&waveData){
        const idx=Math.min(waveData.length-1,Math.floor(i/bars*waveData.length));
        level=Math.max(.05,waveData[idx]/255);
      }else if(playing){
        level=.13+.38*(.5+.5*Math.sin(now*3.6+i*.70))*(.70+.30*Math.sin(now*1.3+i*.22));
      }
      const bh=Math.max(2*dpr,level*H*.82);
      const x=i*(bw+gap);
      const y=(H-bh)/2;
      const grad=waveCtx.createLinearGradient(0,y,0,y+bh);
      grad.addColorStop(0,'rgba(126,244,255,.88)');
      grad.addColorStop(.55,'rgba(63,209,238,.70)');
      grad.addColorStop(1,'rgba(45,122,151,.18)');
      waveCtx.fillStyle=grad;
      waveCtx.fillRect(x,y,bw,bh);
    }
  }

  function musicState(reason='state'){
    const playing=!audio.paused&&!audio.ended&&!audio.error;
    if(changingTrack&&!playing&&reason==='pause')return window.XRPetMusicPlaying;
    const before=window.XRPetMusicPlaying;
    window.XRPetMusicPlaying=playing;
    if(before===playing&&reason!=='init')return playing;
    window.dispatchEvent(new CustomEvent('xrpet:music-state',{
      detail:{playing,reason,index:state.index,track:tracks[state.index][0]}
    }));
    return playing;
  }

  function syncUi(reason='state'){
    const playing=!audio.paused&&!audio.ended&&!audio.error;
    host.classList.toggle('playing',playing);
    play.textContent=playing?'Ⅱ':'▶';
    play.setAttribute('aria-label',playing?'Pause soundtrack':'Play soundtrack');
    play.title=playing?'Pause':'Play';
    setStatus(audio.error?'ERROR':playing?'PLAYING':'READY');
    updateText();
    musicState(reason);
  }

  async function attemptPlay(){
    audio.muted=false;
    audio.defaultMuted=false;
    if(audio.volume<=.01){
      state.volume=.75;
      audio.volume=.75;
      volume.value='.75';
      save();
    }
    try{
      ensureAnalyser();
      if(audioCtx?.state==='suspended')await audioCtx.resume();
      await audio.play();
      syncUi('play');
    }catch(err){
      console.error('XRPet soundtrack play failed',err);
      setStatus('TAP PLAY');
      syncUi('blocked');
    }
  }

  function randomNext(){
    if(!state.shuffle||tracks.length<2)return state.index+1;
    let n=state.index;
    while(n===state.index)n=Math.floor(Math.random()*tracks.length);
    return n;
  }

  function loadTrack(i,autoplay=false){
    changingTrack=autoplay===true;
    state.index=(i+tracks.length)%tracks.length;
    usingFallback=false;
    updateText();
    setStatus(autoplay?'LOADING':'READY');
    audio.muted=false;
    audio.volume=state.volume;
    audio.src=localUrl(tracks[state.index][1]);
    audio.load();
    save();

    if(autoplay){
      attemptPlay().finally(()=>{changingTrack=false});
    }else{
      changingTrack=false;
      syncUi('track');
    }
  }

  volume.value=String(state.volume);
  volume.addEventListener('input',()=>{
    state.volume=Math.max(0,Math.min(1,Number(volume.value)||0));
    audio.muted=false;
    audio.volume=state.volume;
    save();
  });

  play.addEventListener('click',async()=>{
    if(audio.paused||audio.ended)await attemptPlay();
    else audio.pause();
  });
  prev.addEventListener('click',()=>loadTrack(state.index-1,!audio.paused&&!audio.ended));
  next.addEventListener('click',()=>loadTrack(randomNext(),!audio.paused&&!audio.ended));
  shuffleBtn.addEventListener('click',()=>{
    state.shuffle=!state.shuffle;
    shuffleBtn.classList.toggle('active',state.shuffle);
    shuffleBtn.setAttribute('aria-pressed',String(state.shuffle));
    save();
    updateText();
  });

  audio.addEventListener('play',()=>syncUi('play'));
  audio.addEventListener('pause',()=>syncUi('pause'));
  audio.addEventListener('ended',()=>{
    syncUi('ended');
    loadTrack(randomNext(),true);
  });
  audio.addEventListener('waiting',()=>setStatus('BUFFERING'));
  audio.addEventListener('canplay',()=>{
    if(!audio.paused)setStatus('PLAYING');
    else if(!audio.error)setStatus('READY');
  });
  audio.addEventListener('error',()=>{
    const file=tracks[state.index]?.[1];
    if(file&&!usingFallback){
      usingFallback=true;
      setStatus('BACKUP');
      audio.crossOrigin='anonymous';
      audio.src=rawUrl(file);
      audio.load();
      attemptPlay();
      return;
    }
    setStatus('AUDIO ERROR');
    syncUi('error');
  });

  shuffleBtn.classList.toggle('active',state.shuffle);
  shuffleBtn.setAttribute('aria-pressed',String(state.shuffle));
  audio.volume=state.volume;
  loadTrack(state.index,false);
  syncUi('init');
  drawWave();

  window.XRPetMusicUI={
    host,
    root,
    getButton(control){
      return control==='play'?play:
        control==='previous'?prev:
        control==='next'?next:
        control==='shuffle'?shuffleBtn:null;
    }
  };

  window.addEventListener('resize',resizeWave,{passive:true});
})();
