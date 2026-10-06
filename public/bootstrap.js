(() => {
  const q = s => document.querySelector(s);
  const qa = s => Array.from(document.querySelectorAll(s));
  const STORE='xrpet-v1-state';
  let step=1;

  function readState(){
    try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch{return {}}
  }
  function writeState(patch){
    const current=readState();
    localStorage.setItem(STORE,JSON.stringify({...current,...patch}));
  }
  function render(){
    qa('[data-step]').forEach(el=>el.classList.toggle('hidden',Number(el.dataset.step)!==step));
    q('#onboardBack')?.classList.toggle('hidden',step===1);
    q('#onboardNext')?.classList.toggle('hidden',step===3);
    q('#onboardFinish')?.classList.toggle('hidden',step!==3);
  }
  function init(){
    const modal=q('#onboarding');
    if(!modal)return;
    const saved=readState();
    if(saved.onboarded===true){
      modal.classList.add('hidden');
      return;
    }
    modal.classList.remove('hidden');
    render();

    q('#onboardNext')?.addEventListener('click',()=>{
      if(step===1){
        writeState({
          petName:q('#onboardName')?.value.trim()||'NEXUS-589',
          personality:q('#onboardPersonality')?.value||'Guardian'
        });
      }else if(step===2){
        writeState({
          focus:q('#onboardFocus')?.value.trim()||'',
          explainLevel:q('#onboardExplain')?.value||'balanced'
        });
      }
      step=Math.min(3,step+1);
      render();
    });

    q('#onboardBack')?.addEventListener('click',()=>{
      step=Math.max(1,step-1);
      render();
    });

    q('#onboardFinish')?.addEventListener('click',()=>{
      writeState({onboarded:true});
      modal.classList.add('hidden');
      location.reload();
    });
  }

  window.addEventListener('error',e=>{
    const status=q('#onboardWalletStatus');
    if(status && !status.textContent.includes('Optional')){
      status.textContent='A feature error occurred, but onboarding remains available.';
    }
    console.error('XRPet startup error:',e.error||e.message);
  });

  init();
})();