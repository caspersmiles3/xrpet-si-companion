(() => {
  const player=document.getElementById('xrpetMusicPlayer');
  const audio=document.getElementById('xrpetAudio');
  const play=document.getElementById('musicToggle');
  const prev=document.getElementById('musicPrev');
  const next=document.getElementById('musicNext');
  const shuffleBtn=document.getElementById('musicShuffle');
  const volume=document.getElementById('musicVolume');
  const name=document.getElementById('musicTrackName');
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

  function syncButton(){
    const playing=!audio.paused&&!audio.ended;
    play.textContent=playing?'Ⅱ':'▶';
    play.setAttribute('aria-label',playing?'Pause soundtrack':'Play soundtrack');
    player.classList.toggle('playing',playing);
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

  audio.addEventListener('play',syncButton);
  audio.addEventListener('pause',syncButton);
  audio.addEventListener('volumechange',()=>{
    if(!audio.muted && volume) volume.value=String(audio.volume);
  });
  audio.addEventListener('ended',()=>loadTrack(randomNext(),true));
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
    syncButton();
  });

  shuffleBtn?.classList.toggle('active',state.shuffle);
  loadTrack(state.index,false);
  syncButton();
})();