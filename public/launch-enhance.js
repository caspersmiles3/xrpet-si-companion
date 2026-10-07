(() => {
  if (window.__xrpetLaunchControllerReady) return;
  window.__xrpetLaunchControllerReady = true;

  const gate = document.getElementById('launchGate');
  if (!gate) {
    document.body.classList.remove('launch-locked');
    return;
  }

  const status = document.getElementById('launchStatus');
  const activity = document.getElementById('launchActivityLabel');
  const pulse = document.getElementById('launchActivityPulse');
  const bar = document.getElementById('launchProgressBar');
  const orbit = document.getElementById('launchLiveOrbit');
  const enter = document.getElementById('launchEnter');

  const backgroundVideo = document.getElementById('launchBackgroundVideo');
  if (backgroundVideo) {
    backgroundVideo.muted = true;
    backgroundVideo.loop = true;
    backgroundVideo.playsInline = true;
    const resumeVideo = () => backgroundVideo.play?.().catch(() => {});
    backgroundVideo.addEventListener('error', () => gate.classList.add('launch-video-fallback'), { once:true });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !released) resumeVideo();
    });
    resumeVideo();
  }

  const states = [
    ['Connecting to XRPL live data…', 'Listening for validated ledgers'],
    ['Synchronizing public network signals…', 'Checking XRPL mainnet telemetry'],
    ['Loading Ripple + XRP context…', 'Preparing the live interface'],
    ['Waking Ripplet…', 'Companion systems coming online'],
    ['XRPet is ready when you are.', 'Press Enter XRPet to continue']
  ];

  let index = 0;
  let signal = 1;
  let progress = 18;
  let released = false;
  let ready = false;
  let removeTimer = 0;
  let stateTimer = 0;

  const setProgress = (value, text, allowDecrease = false) => {
    const next = Math.max(0, Math.min(100, Number(value) || 0));
    progress = allowDecrease ? next : Math.max(progress, next);
    if (bar) bar.style.width = progress + '%';
    if (text && status) status.textContent = text;
  };

  const setActivity = text => {
    if (text && activity) activity.textContent = text;
    if (pulse) pulse.textContent = 'signal ' + String(signal++).padStart(3, '0');
  };

  const renderNextState = () => {
    if (released || ready || !gate.isConnected) return;
    const state = states[index];
    if (!state) {
      ready = true;
      setProgress(Math.max(progress, 94), 'XRPet is ready when you are.');
      if (activity) activity.textContent = 'Press Enter XRPet to continue';
      return;
    }

    const [headline, detail] = state;
    const targetProgress = [28, 46, 66, 82, 94][index] ?? 94;
    setProgress(targetProgress, headline);
    setActivity(detail);
    index += 1;

    if (index >= states.length) {
      ready = true;
      if (activity) activity.textContent = 'Press Enter XRPet to continue';
      return;
    }
    stateTimer = window.setTimeout(renderNextState, 1100);
  };

  const finish = source => {
    if (released) return;
    released = true;
    window.clearTimeout(stateTimer);
    window.clearTimeout(removeTimer);

    setProgress(100, 'XRPet ready.');
    if (activity) activity.textContent = 'Opening companion interface';
    if (enter) {
      enter.disabled = true;
      enter.setAttribute('aria-disabled', 'true');
    }

    document.body.classList.remove('launch-locked');
    gate.classList.add('launch-complete');
    gate.setAttribute('aria-hidden', 'true');

    window.dispatchEvent(new CustomEvent('xrpet:launch-complete', {
      detail: { source: source || 'launch-controller' }
    }));

    removeTimer = window.setTimeout(() => {
      if (gate.isConnected) gate.remove();
    }, 320);
  };

  window.XRPetLaunch = {
    finish,
    setProgress,
    setActivity,
    isReleased: () => released
  };

  enter?.addEventListener('click', () => finish('enter-button'));
  gate.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    finish('keyboard');
  });

  // If another module has already marked the gate complete, never leave the page locked.
  gate.addEventListener('transitionend', () => {
    if (gate.classList.contains('launch-complete')) document.body.classList.remove('launch-locked');
  });

  if (orbit) {
    const reset = () => {
      orbit.style.transform = '';
      orbit.style.setProperty('--launch-x', '0px');
      orbit.style.setProperty('--launch-y', '0px');
    };

    let orbitFrame = 0;
    let orbitPointer = null;
    orbit.addEventListener('pointermove', event => {
      orbitPointer = { x:event.clientX, y:event.clientY };
      if (orbitFrame) return;
      orbitFrame = requestAnimationFrame(() => {
        orbitFrame = 0;
        if (!orbitPointer) return;
        const rect = orbit.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = (orbitPointer.x - rect.left) / rect.width - 0.5;
        const y = (orbitPointer.y - rect.top) / rect.height - 0.5;
        orbit.style.setProperty('--launch-x', (x * 12).toFixed(1) + 'px');
        orbit.style.setProperty('--launch-y', (y * 12).toFixed(1) + 'px');
        orbit.style.transform = 'perspective(620px) rotateX(' + (-y * 5).toFixed(1) + 'deg) rotateY(' + (x * 5).toFixed(1) + 'deg)';
      });
    });
    orbit.addEventListener('pointerleave', reset);
    orbit.addEventListener('click', () => {
      orbit.classList.remove('launch-orbit-ping');
      void orbit.offsetWidth;
      orbit.classList.add('launch-orbit-ping');
      setActivity('XRPL signal acknowledged · Ripplet is awake');
      if (status) status.textContent = 'Mainnet signal received. XRPet is ready.';
      window.setTimeout(() => orbit.classList.remove('launch-orbit-ping'), 900);
    });
  }

  const style = document.createElement('style');
  style.textContent = `
    #launchLiveOrbit { cursor:pointer; transition:transform .18s ease; will-change:transform; }
    #launchLiveOrbit .orbit-core { transform:translate(var(--launch-x,0),var(--launch-y,0)); transition:transform .16s ease, filter .2s ease; }
    #launchLiveOrbit:hover .orbit-core { filter:drop-shadow(0 0 16px rgba(255,255,255,.55)); }
    #launchLiveOrbit.launch-orbit-ping::after {
      content:""; position:absolute; inset:18%; border:1px solid rgba(255,255,255,.75);
      border-radius:50%; animation:xrpetLaunchPing .85s ease-out forwards; pointer-events:none;
    }
    .clean-launch-grid { animation:xrpetLaunchDrift 12s linear infinite; }
    .clean-launch-enter { position:relative; overflow:hidden; pointer-events:auto; }
    .clean-launch-enter::after {
      content:""; position:absolute; top:0; bottom:0; width:35%; left:-50%; pointer-events:none;
      background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);
      animation:xrpetLaunchSweep 3.8s ease-in-out infinite;
    }
    @keyframes xrpetLaunchPing { from{opacity:.9;transform:scale(.35)} to{opacity:0;transform:scale(1.85)} }
    @keyframes xrpetLaunchDrift { from{transform:translate3d(0,0,0)} 50%{transform:translate3d(-8px,5px,0)} to{transform:translate3d(0,0,0)} }
    @keyframes xrpetLaunchSweep { 0%,35%{left:-50%} 70%,100%{left:125%} }
    @media (prefers-reduced-motion:reduce) {
      .clean-launch-grid,.clean-launch-enter::after { animation:none!important; }
      #launchLiveOrbit { transition:none; }
    }
  `;
  document.head.appendChild(style);

  // Run the loading sequence once. It never loops back to an earlier state.
  renderNextState();

  // Independent safety: even if a timer is throttled, the gate reaches a stable ready state.
  window.setTimeout(() => {
    if (released || !gate.isConnected) return;
    ready = true;
    window.clearTimeout(stateTimer);
    setProgress(94, 'XRPet is ready when you are.');
    if (activity) activity.textContent = 'Press Enter XRPet to continue';
  }, 6200);
})();
