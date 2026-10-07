(() => {
  const player=document.getElementById('xrpetMusicPlayer');
  const audio=document.getElementById('xrpetAudio');
  const play=document.getElementById('musicToggle');
  const prev=document.getElementById('musicPrev');
  const next=document.getElementById('musicNext');
  const shuffleBtn=document.getElementById('musicShuffle');
  const volume=document.getElementById('musicVolume');
  const name=document.getElementById('musicTrackName');
  const meta=document.getElementById('musicTrackMeta');
  const stateLabel=document.getElementById('musicStateLabel');
  const timeLabel=document.getElementById('musicTime');
  const waveform=document.getElementById('musicWaveform');
  const waveCtx=waveform?.getContext?.('2d')||null;

  window.XRPetMusicPlaying=false;
  if(!player||!audio||!play||!name)return;

  const tracks=[
    ['Corrupted Transmission 2','Corrupted Transmission 2 (Instr.).mp3'],
    ['Distant Stars 2','Distant Stars 2 (Instr.).mp3'],
    ['Kardashev Scale','Kardashev Scale (Instr.).mp3'],
    ['Liquid Restlessness','Liquid Restlessness (Instr.).mp3'],
    ['Payment Clearing','Payment Clearing (Instr.).mp3'],
    ['Unified Pulse','Unified Pulse (Instr.).mp3']
  ];

  const STORAGE_KEY='xrpet-music-v4';
  let state={index:0,shuffle:false,volume:.75};
  try{
    const legacy=JSON.parse(localStorage.getItem('xrpet-music-v3')||'null');
    const current=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
    state={...state,...(legacy||{}),...(current||{})};
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
  let waveRaf=0;
  let lastWaveFrame=0;
  let lastTimePaint=0;

  const save=()=>{
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch{}
  };
  const localUrl=file=>'/audio/'+encodeURIComponent(file).replace(/%2F/g,'/');
  const rawUrl=file=>'https://raw.githubusercontent.com/caspersmiles3/xrpet-si-companion/main/public/audio/'+encodeURIComponent(file).replace(/%2F/g,'/');

  audio.muted=false;
  audio.defaultMuted=false;
  audio.volume=state.volume;
  audio.preload='metadata';
  audio.setAttribute('playsinline','');

  function formatTime(seconds){
    const n=Number(seconds);
    if(!Number.isFinite(n)||n<0)return '0:00';
    const m=Math.floor(n/60);
    const s=Math.floor(n%60);
    return m+':'+String(s).padStart(2,'0');
  }

  function paintTime(){
    if(!timeLabel)return;
    const current=formatTime(audio.currentTime);
    const duration=Number.isFinite(audio.duration)?formatTime(audio.duration):'0:00';
    timeLabel.textContent=current+' / '+duration;
  }

  function setStateLabel(text){
    if(stateLabel)stateLabel.textContent=text;
  }

  function updateTrackCopy(){
    const [title]=tracks[state.index];
    name.textContent=title;
    if(meta)meta.textContent='Track '+(state.index+1)+' of '+tracks.length+(state.shuffle?' · Shuffle':'');
  }

  function resizeWave(){
    if(!waveform||!waveCtx)return;
    const rect=waveform.getBoundingClientRect();
    const dpr=Math.min(2,window.devicePixelRatio||1);
    const w=Math.max(80,Math.round(rect.width*dpr));
    const h=Math.max(22,Math.round(rect.height*dpr));
    if(waveform.width!==w||waveform.height!==h){
      waveform.width=w;
      waveform.height=h;
    }
  }

  function ensureAnalyser(){
    if(analyser||!waveform)return;
    try{
      audioCtx=new (window.AudioContext||window.webkitAudioContext)();
      analyser=audioCtx.createAnalyser();
      analyser.fftSize=128;
      analyser.smoothingTimeConstant=.84;
      mediaSource=audioCtx.createMediaElementSource(audio);
      mediaSource.connect(analyser);
      analyser.connect(audioCtx.destination);
      waveData=new Uint8Array(analyser.frequencyBinCount);
    }catch(err){
      console.warn('XRPet waveform analyser unavailable; visual fallback enabled',err);
      analyser=null;
      audioCtx=null;
      mediaSource=null;
      waveData=null;
    }
  }

  function drawWave(frameTime=0){
    waveRaf=requestAnimationFrame(drawWave);
    if(document.hidden||!waveform||!waveCtx)return;

    const playing=!audio.paused&&!audio.ended&&!audio.error;
    const minFrameMs=playing?45:160;
    if(frameTime-lastWaveFrame<minFrameMs)return;
    lastWaveFrame=frameTime;

    resizeWave();
    const W=waveform.width;
    const H=waveform.height;
    const dpr=Math.min(2,window.devicePixelRatio||1);
    waveCtx.clearRect(0,0,W,H);

    const bars=32;
    const gap=2*dpr;
    const bw=Math.max(1,(W-gap*(bars-1))/bars);

    if(analyser&&waveData)analyser.getByteFrequencyData(waveData);
    const now=performance.now()/1000;

    for(let i=0;i<bars;i++){
      let level=.08;
      if(analyser&&waveData){
        const idx=Math.min(waveData.length-1,Math.floor(i/bars*waveData.length));
        level=Math.max(.055,waveData[idx]/255);
      }else if(playing){
        level=.14+.40*(.5+.5*Math.sin(now*3.8+i*.68))*(.72+.28*Math.sin(now*1.35+i*.24));
      }
      const bh=Math.max(2*dpr,level*H*.84);
      const x=i*(bw+gap);
      const y=(H-bh)/2;
      const grad=waveCtx.createLinearGradient(0,y,0,y+bh);
      grad.addColorStop(0,'rgba(126,244,255,.90)');
      grad.addColorStop(.55,'rgba(63,209,238,.72)');
      grad.addColorStop(1,'rgba(45,122,151,.20)');
      waveCtx.fillStyle=grad;
      waveCtx.fillRect(x,y,bw,bh);
    }

    if(frameTime-lastTimePaint>350){
      lastTimePaint=frameTime;
      paintTime();
    }
  }

  function musicState(reason='state'){
    const playing=!audio.paused&&!audio.ended&&!audio.error;
    if(changingTrack&&!playing&&reason==='pause')return window.XRPetMusicPlaying;

    const previous=window.XRPetMusicPlaying;
    window.XRPetMusicPlaying=playing;
    if(previous===playing&&reason!=='init')return playing;

    window.dispatchEvent(new CustomEvent('xrpet:music-state',{
      detail:{
        playing,
        reason,
        index:state.index,
        track:tracks[state.index]?.[0]||''
      }
    }));
    return playing;
  }

  function syncUi(reason='state'){
    const playing=!audio.paused&&!audio.ended&&!audio.error;
    play.textContent=playing?'Ⅱ':'▶';
    play.setAttribute('aria-label',playing?'Pause soundtrack':'Play soundtrack');
    play.title=playing?'Pause':'Play';
    player.classList.toggle('playing',playing);
    setStateLabel(audio.error?'ERROR':playing?'PLAYING':'READY');
    updateTrackCopy();
    paintTime();
    musicState(reason);
  }

  async function attemptPlay(){
    audio.muted=false;
    audio.defaultMuted=false;
    if(audio.volume<=.01){
      state.volume=.75;
      audio.volume=.75;
      if(volume)volume.value='.75';
      save();
    }

    try{
      ensureAnalyser();
      if(audioCtx?.state==='suspended')await audioCtx.resume();
      await audio.play();
      syncUi('play');
    }catch(err){
      console.error('XRPet soundtrack play failed',err);
      setStateLabel('TAP PLAY');
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
    updateTrackCopy();
    setStateLabel(autoplay?'LOADING':'READY');
    audio.muted=false;
    audio.volume=state.volume;
    audio.src=localUrl(tracks[state.index][1]);
    audio.load();
    paintTime();
    save();

    if(autoplay){
      attemptPlay().finally(()=>{changingTrack=false});
    }else{
      changingTrack=false;
      syncUi('track');
    }
  }

  if(volume){
    volume.value=String(state.volume);
    volume.addEventListener('input',()=>{
      state.volume=Math.max(0,Math.min(1,Number(volume.value)||0));
      audio.muted=false;
      audio.volume=state.volume;
      save();
    });
  }

  play.addEventListener('click',async()=>{
    if(audio.paused||audio.ended)await attemptPlay();
    else audio.pause();
  });

  prev?.addEventListener('click',()=>{
    const keepPlaying=!audio.paused&&!audio.ended;
    loadTrack(state.index-1,keepPlaying);
  });

  next?.addEventListener('click',()=>{
    const keepPlaying=!audio.paused&&!audio.ended;
    loadTrack(randomNext(),keepPlaying);
  });

  shuffleBtn?.addEventListener('click',()=>{
    state.shuffle=!state.shuffle;
    shuffleBtn.classList.toggle('active',state.shuffle);
    shuffleBtn.setAttribute('aria-pressed',String(state.shuffle));
    save();
    updateTrackCopy();
  });

  audio.addEventListener('loadedmetadata',paintTime);
  audio.addEventListener('durationchange',paintTime);
  audio.addEventListener('timeupdate',paintTime);
  audio.addEventListener('play',()=>syncUi('play'));
  audio.addEventListener('pause',()=>syncUi('pause'));
  audio.addEventListener('volumechange',()=>{
    if(!audio.muted&&volume)volume.value=String(audio.volume);
  });
  audio.addEventListener('ended',()=>{
    syncUi('ended');
    loadTrack(randomNext(),true);
  });
  audio.addEventListener('waiting',()=>setStateLabel('BUFFERING'));
  audio.addEventListener('canplay',()=>{
    if(!audio.paused)setStateLabel('PLAYING');
    else if(!audio.error)setStateLabel('READY');
  });

  audio.addEventListener('error',()=>{
    const file=tracks[state.index]?.[1];
    if(file&&!usingFallback){
      usingFallback=true;
      setStateLabel('BACKUP');
      try{
        audio.crossOrigin='anonymous';
        audio.src=rawUrl(file);
        audio.load();
        attemptPlay();
        return;
      }catch{}
    }
    console.error('XRPet audio failed',audio.currentSrc,audio.error?.code);
    setStateLabel('AUDIO ERROR');
    syncUi('error');
  });

  shuffleBtn?.classList.toggle('active',state.shuffle);
  shuffleBtn?.setAttribute('aria-pressed',String(state.shuffle));
  loadTrack(state.index,false);
  syncUi('init');
  drawWave();

  window.addEventListener('resize',resizeWave,{passive:true});
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden){
      resizeWave();
      paintTime();
    }
  });
})();
