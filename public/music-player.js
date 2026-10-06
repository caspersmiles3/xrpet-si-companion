(() => {
  const player=document.getElementById('xrpetMusicPlayer');
  const audio=document.getElementById('xrpetAudio');
  const play=document.getElementById('musicToggle');
  const prev=document.getElementById('musicPrev');
  const next=document.getElementById('musicNext');
  const shuffleBtn=document.getElementById('musicShuffle');
  const name=document.getElementById('musicTrackName');
  const drag=document.getElementById('musicDrag');
  if(!player||!audio||!play||!name)return;

  const tracks=[
    ['Corrupted Transmission 2','Corrupted Transmission 2 (Instr.).mp3'],
    ['Distant Stars 2','Distant Stars 2 (Instr.).mp3'],
    ['Kardashev Scale','Kardashev Scale (Instr.).mp3'],
    ['Liquid Restlessness','Liquid Restlessness (Instr.).mp3'],
    ['Payment Clearing','Payment Clearing (Instr.).mp3'],
    ['Unified Pulse','Unified Pulse (Instr.).mp3']
  ];

  let state={index:0,shuffle:false,volume:.5};
  try{state={...state,...JSON.parse(localStorage.getItem('xrpet-music-v2')||'{}')}}catch{}
  state.index=Math.max(0,Math.min(tracks.length-1,Number(state.index)||0));
  state.volume=Number.isFinite(Number(state.volume))?Math.max(0,Math.min(1,Number(state.volume))):.5;
  audio.volume=state.volume;
  audio.preload='metadata';

  const save=()=>localStorage.setItem('xrpet-music-v2',JSON.stringify(state));
  const pathFor=file=>'/audio/'+file.split('/').map(encodeURIComponent).join('/');

  function loadTrack(i,autoplay=false){
    state.index=(i+tracks.length)%tracks.length;
    const [title,file]=tracks[state.index];
    name.textContent=title;
    audio.src=pathFor(file);
    audio.load();
    save();
    if(autoplay) audio.play().catch(err=>{
      console.error('XRPet audio play failed',err);
      name.textContent='Tap Play again';
      play.textContent='▶';
    });
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

  play.addEventListener('click',async e=>{
    e.stopPropagation();
    if(!audio.src)loadTrack(state.index,false);
    try{
      if(audio.paused)await audio.play();
      else audio.pause();
    }catch(err){
      console.error('XRPet soundtrack error',err);
      name.textContent='Playback blocked — tap again';
    }
  });
  prev?.addEventListener('click',e=>{e.stopPropagation();loadTrack(state.index-1,!audio.paused)});
  next?.addEventListener('click',e=>{e.stopPropagation();loadTrack(randomNext(),!audio.paused)});
  shuffleBtn?.addEventListener('click',e=>{
    e.stopPropagation();state.shuffle=!state.shuffle;shuffleBtn.classList.toggle('active',state.shuffle);save();
  });
  audio.addEventListener('play',syncButton);
  audio.addEventListener('pause',syncButton);
  audio.addEventListener('ended',()=>loadTrack(randomNext(),true));
  audio.addEventListener('error',()=>{
    const code=audio.error?.code||'';
    console.error('XRPet audio file failed',audio.currentSrc,code);
    name.textContent='Track failed to load';
    syncButton();
  });
  audio.addEventListener('canplay',()=>{ if(name.textContent==='Track failed to load') name.textContent=tracks[state.index][0] });

  // Drag the entire player by its empty/title area; controls remain clickable.
  let moving=false,dx=0,dy=0;
  const savedPos=(()=>{try{return JSON.parse(localStorage.getItem('xrpet-music-pos-v2')||'null')}catch{return null}})();
  if(savedPos&&Number.isFinite(savedPos.x)&&Number.isFinite(savedPos.y)){
    player.style.left=Math.max(4,Math.min(innerWidth-player.offsetWidth-4,savedPos.x))+'px';
    player.style.top=Math.max(4,Math.min(innerHeight-player.offsetHeight-4,savedPos.y))+'px';
    player.style.bottom='auto';
  }
  player.addEventListener('pointerdown',e=>{
    if(e.target.closest('button,input,audio'))return;
    const r=player.getBoundingClientRect();
    moving=true;dx=e.clientX-r.left;dy=e.clientY-r.top;
    player.classList.add('dragging');
    player.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  });
  drag?.addEventListener('pointerdown',e=>{
    const r=player.getBoundingClientRect();
    moving=true;dx=e.clientX-r.left;dy=e.clientY-r.top;
    player.classList.add('dragging');
    player.setPointerCapture?.(e.pointerId);
    e.preventDefault();e.stopPropagation();
  });
  player.addEventListener('pointermove',e=>{
    if(!moving)return;
    const x=Math.max(4,Math.min(innerWidth-player.offsetWidth-4,e.clientX-dx));
    const y=Math.max(4,Math.min(innerHeight-player.offsetHeight-4,e.clientY-dy));
    player.style.left=x+'px';player.style.top=y+'px';player.style.bottom='auto';player.style.right='auto';
  });
  const stop=e=>{
    if(!moving)return;
    moving=false;player.classList.remove('dragging');
    const r=player.getBoundingClientRect();
    localStorage.setItem('xrpet-music-pos-v2',JSON.stringify({x:r.left,y:r.top}));
    try{player.releasePointerCapture?.(e.pointerId)}catch{}
  };
  player.addEventListener('pointerup',stop);
  player.addEventListener('pointercancel',stop);

  shuffleBtn?.classList.toggle('active',state.shuffle);
  loadTrack(state.index,false);
  syncButton();
})();