(() => {
  const gate = document.getElementById('launchGate');
  if (!gate) return;

  const status = document.getElementById('launchStatus');
  const activity = document.getElementById('launchActivityLabel');
  const pulse = document.getElementById('launchActivityPulse');
  const bar = document.getElementById('launchProgressBar');
  const orbit = document.getElementById('launchLiveOrbit');
  const counter = document.getElementById('launchLedgerCounter');
  const enter = document.getElementById('launchEnter');

  const states = [
    ['Connecting to XRPL live data…', 'Listening for validated ledgers'],
    ['Synchronizing public network signals…', 'Checking XRPL mainnet telemetry'],
    ['Loading Ripple + XRP context…', 'Preparing the ecosystem directory'],
    ['Ripplet is standing by.', 'Move your pointer over the signal core'],
    ['XRPet is ready when you are.', 'Press Enter XRPet whenever you want']
  ];

  let index = 0;
  let signal = 1;
  let progress = 18;
  let idleTicks = 0;

  function renderState() {
    if (!gate.isConnected) return;
    const [headline, detail] = states[index % states.length];
    if (status) status.textContent = headline;
    if (activity) activity.textContent = detail;
    if (pulse) pulse.textContent = 'signal ' + String(signal++).padStart(3, '0');
    progress = Math.min(94, progress + 7);
    if (bar) bar.style.width = progress + '%';
    index += 1;
    idleTicks += 1;
    if (counter && idleTicks > 1) counter.textContent = 'READY';
  }

  const timer = setInterval(renderState, 2400);
  renderState();

  const stop = () => clearInterval(timer);
  enter?.addEventListener('click', stop, { once: true });
  window.addEventListener('xrpet:launch-failsafe-release', stop, { once: true });

  if (orbit) {
    const reset = () => {
      orbit.style.transform = '';
      orbit.style.setProperty('--launch-x', '0px');
      orbit.style.setProperty('--launch-y', '0px');
    };

    orbit.addEventListener('pointermove', (event) => {
      const rect = orbit.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      orbit.style.setProperty('--launch-x', (x * 16).toFixed(1) + 'px');
      orbit.style.setProperty('--launch-y', (y * 16).toFixed(1) + 'px');
      orbit.style.transform = 'perspective(500px) rotateX(' + (-y * 8).toFixed(1) + 'deg) rotateY(' + (x * 8).toFixed(1) + 'deg)';
    });
    orbit.addEventListener('pointerleave', reset);
    orbit.addEventListener('click', () => {
      orbit.classList.remove('launch-orbit-ping');
      void orbit.offsetWidth;
      orbit.classList.add('launch-orbit-ping');
      if (activity) activity.textContent = 'Signal acknowledged · Ripplet is awake';
      if (pulse) pulse.textContent = 'interactive pulse';
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
    .clean-launch-signal i, .launch-activity i { animation:xrpetLaunchBlink 1.8s ease-in-out infinite; }
    .clean-launch-enter { position:relative; overflow:hidden; }
    .clean-launch-enter::after {
      content:""; position:absolute; top:0; bottom:0; width:35%; left:-50%;
      background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);
      animation:xrpetLaunchSweep 3.8s ease-in-out infinite;
    }
    @keyframes xrpetLaunchPing { from{opacity:.9;transform:scale(.35)} to{opacity:0;transform:scale(1.85)} }
    @keyframes xrpetLaunchDrift { from{transform:translate3d(0,0,0)} 50%{transform:translate3d(-8px,5px,0)} to{transform:translate3d(0,0,0)} }
    @keyframes xrpetLaunchBlink { 0%,100%{opacity:.45} 50%{opacity:1} }
    @keyframes xrpetLaunchSweep { 0%,35%{left:-50%} 70%,100%{left:125%} }
    @media (prefers-reduced-motion:reduce) {
      .clean-launch-grid,.clean-launch-signal i,.launch-activity i,.clean-launch-enter::after { animation:none!important; }
      #launchLiveOrbit { transition:none; }
    }
  `;
  document.head.appendChild(style);
})();