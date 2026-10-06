(() => {
  const player=document.getElementById('xrpetMusicPlayer');
  const audio=document.getElementById('xrpetAudio');
  const play=document.getElementById('musicToggle');
  const prev=document.getElementById('musicPrev');
  const next=document.getElementById('musicNext');
  const shuffleBtn=document.getElementById('musicShuffle');
  const volume=document.getElementById('musicVolume');
  const name=document.getElementById('musicTrackName');
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

  let state={index:0,shuffle:false,volume:.75};
  try{state={...state,...JSON.parse(localStorage.getItem('xrpet-music-v3')||'{}')}}catch{}
  state.index=Math.max(0,Math.min(tracks.length-1,Number(state.index)||0));
  state.volume=Number.isFinite(Number(state.volume))?Math.max(.15,Math.min(1,Number(state.volume))):.75;

  audio.muted=false;
  audio.defaultMuted=false;
  audio.volume=state.volume;
  audio.preload='metadata';
  audio.setAttribute('playsinline','');

  if(volume){
    volume.value=String(state.volume);
    volume.addEventListener('input',()=>{
      state.volume=Math.max(0,Math.min(1,Number(volume.value)||0));
      audio.muted=false;
      audio.volume=state.volume;
      save();
    });
  }

  const save=()=>localStorage.setItem('xrpet-music-v3',JSON.stringify(state));
  const localUrl=file=>'/audio/'+encodeURIComponent(file).replace(/%2F/g,'/');
  const rawUrl=file=>'https://raw.githubusercontent.com/caspersmiles3/xrpet-si-companion/main/public/audio/'+encodeURIComponent(file).replace(/%2F/g,'/');
  let usingFallback=false;
  let audioCtx=null,analyser=null,mediaSource=null,waveRaf=0;
  let waveData=null;

  function resizeWave(){
    if(!waveform||!waveCtx)return;
    const rect=waveform.getBoundingClientRect();
    const dpr=Math.min(2,window.devicePixelRatio||1);
    const w=Math.max(80,Math.round(rect.width*dpr)),h=Math.max(24,Math.round(rect.height*dpr));
    if(waveform.width!==w||waveform.height!==h){waveform.width=w;waveform.height=h}
  }
  function ensureAnalyser(){
    if(analyser||!waveform)return;
    try{
      audioCtx=new (window.AudioContext||window.webkitAudioContext)();
      analyser=audioCtx.createAnalyser();analyser.fftSize=128;analyser.smoothingTimeConstant=.82;
      mediaSource=audioCtx.createMediaElementSource(audio);
      mediaSource.connect(analyser);analyser.connect(audioCtx.destination);
      waveData=new Uint8Array(analyser.frequencyBinCount);
    }catch(err){
      console.warn('XRPet waveform analyser unavailable; using visual fallback',err);
      analyser=null;audioCtx=null;
    }
  }
  function drawWave(){
    cancelAnimationFrame(waveRaf);
    if(!waveform||!waveCtx)return;
    resizeWave();
    const W=waveform.width,H=waveform.height,dpr=Math.min(2,window.devicePixelRatio||1);
    waveCtx.clearRect(0,0,W,H);
    const bars=36,gap=2*dpr,bw=Math.max(1,(W-gap*(bars-1))/bars);
    if(analyser&&waveData){analyser.getByteFrequencyData(waveData)}
    const playing=!audio.paused&&!audio.ended;
    const now=performance.now()/1000;
    for(let i=0;i<bars;i++){
      let level;
      if(analyser&&waveData){
        const idx=Math.floor(i/bars*waveData.length);
        level=waveData[idx]/255;
      }else{
        level=playing?(0.18+0.48*(.5+.5*Math.sin(now*4+i*.72))*(.65+.35*Math.sin(now*1.7+i*.23))):.08;
      }
      const bh=Math.max(2*dpr,level*H*.9);
      const x=i*(bw+gap),y=(H-bh)/2;
      const grad=waveCtx.createLinearGradient(0,y,0,y+bh);
      grad.addColorStop(0,'rgba(126,244,255,.95)');
      grad.addColorStop(.55,'rgba(63,209,238,.78)');
      grad.addColorStop(1,'rgba(45,122,151,.28)');
      waveCtx.fillStyle=grad;
      waveCtx.fillRect(x,y,bw,bh);
    }
    waveRaf=requestAnimationFrame(drawWave);
  }

  function loadTrack(i,autoplay=false){
    state.index=(i+tracks.length)%tracks.length;
    const [title,file]=tracks[state.index];
    name.textContent=title;
    usingFallback=false;
    audio.muted=false;
    audio.volume=state.volume;
    audio.src=localUrl(file);
    audio.load();
    save();
    if(autoplay) attemptPlay();
  }

  async function attemptPlay(){
    audio.muted=false;
    audio.defaultMuted=false;
    if(audio.volume<=0.01){state.volume=.75;audio.volume=.75;if(volume)volume.value='.75';save()}
    try{
      ensureAnalyser();
      if(audioCtx?.state==='suspended')await audioCtx.resume();
      await audio.play();
      syncButton();
    }catch(err){
      console.error('XRPet soundtrack play failed',err);
      name.textContent='Tap Play again';
      syncButton();
    }
  }

  function randomNext(){
    if(!state.shuffle||tracks.length<2)return state.index+1;
    let n=state.index;
    while(n===state.index)n=Math.floor(Math.random()*tracks.length);
    return n;
  }

  function musicState(reason='state'){
    const playing=!audio.paused&&!audio.ended&&!audio.error;
    window.XRPetMusicPlaying=playing;
    window.dispatchEvent(new CustomEvent('xrpet:music-state',{
      detail:{playing,reason,index:state.index,track:tracks[state.index]?.[0]||''}
    }));
    return playing;
  }
  function syncButton(reason='state'){
    const playing=!audio.paused&&!audio.ended;
    play.textContent=playing?'Ⅱ':'▶';
    play.setAttribute('aria-label',playing?'Pause soundtrack':'Play soundtrack');
    player.classList.toggle('playing',playing);
    musicState(reason);
  }

  play.addEventListener('click',async()=>{
    if(audio.paused) await attemptPlay();
    else audio.pause();
  });
  prev?.addEventListener('click',()=>loadTrack(state.index-1,!audio.paused));
  next?.addEventListener('click',()=>loadTrack(randomNext(),!audio.paused));
  shuffleBtn?.addEventListener('click',()=>{
    state.shuffle=!state.shuffle;
    shuffleBtn.classList.toggle('active',state.shuffle);
    save();
  });

  audio.addEventListener('play',()=>syncButton('play'));
  audio.addEventListener('pause',()=>syncButton('pause'));
  audio.addEventListener('volumechange',()=>{
    if(!audio.muted && volume) volume.value=String(audio.volume);
  });
  audio.addEventListener('ended',()=>{
    syncButton('ended');
    loadTrack(randomNext(),true);
  });
  audio.addEventListener('error',()=>{
    const file=tracks[state.index][1];
    if(!usingFallback){
      usingFallback=true;
      name.textContent='Loading backup audio…';
      audio.src=rawUrl(file);
      audio.load();
      attemptPlay();
      return;
    }
    console.error('XRPet audio failed',audio.currentSrc,audio.error?.code);
    name.textContent='Audio could not load';
    syncButton('error');
  });

  shuffleBtn?.classList.toggle('active',state.shuffle);
  loadTrack(state.index,false);
  syncButton('init');
  drawWave();
  window.addEventListener('resize',resizeWave,{passive:true});
})();