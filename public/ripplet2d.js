(() => {
  const host = document.getElementById('floatingCompanion');
  if (!host) return;

  host.innerHTML = `
    <div id="ripplet2d" class="ripplet2d" data-state="idle" data-facing="right" aria-label="Ripplet">
      <svg class="ripplet2d-svg" viewBox="0 0 64 88" role="img" aria-label="Ripplet 2D companion">
        <defs>
          <linearGradient id="r2-shell" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#f2fbff"/>
            <stop offset=".48" stop-color="#a9c1c9"/>
            <stop offset="1" stop-color="#536872"/>
          </linearGradient>
          <linearGradient id="r2-dark" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#18303a"/>
            <stop offset="1" stop-color="#071116"/>
          </linearGradient>
          <filter id="r2-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="1.4" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <ellipse class="r2-ground" cx="32" cy="84" rx="12" ry="2.2"/>

        <g class="r2-character">
          <g class="r2-leg r2-leg-left">
            <circle class="r2-joint" cx="25" cy="58" r="2.5"/>
            <rect class="r2-limb r2-thigh" x="22.7" y="58" width="4.6" height="10" rx="2.3"/>
            <circle class="r2-joint r2-knee" cx="25" cy="68" r="2.3"/>
            <rect class="r2-limb r2-calf" x="22.9" y="68" width="4.2" height="9.5" rx="2.1"/>
            <g class="r2-foot"><rect x="21.3" y="76" width="7.2" height="4.2" rx="2.1"/></g>
          </g>

          <g class="r2-leg r2-leg-right">
            <circle class="r2-joint" cx="39" cy="58" r="2.5"/>
            <rect class="r2-limb r2-thigh" x="36.7" y="58" width="4.6" height="10" rx="2.3"/>
            <circle class="r2-joint r2-knee" cx="39" cy="68" r="2.3"/>
            <rect class="r2-limb r2-calf" x="36.9" y="68" width="4.2" height="9.5" rx="2.1"/>
            <g class="r2-foot"><rect x="35.5" y="76" width="7.2" height="4.2" rx="2.1"/></g>
          </g>

          <g class="r2-body">
            <rect class="r2-neck" x="28.5" y="34" width="7" height="5.5" rx="3"/>
            <path class="r2-torso" d="M23 38 Q32 34 41 38 L43 54 Q39 59 32 59 Q25 59 21 54 Z"/>
            <path class="r2-chest" d="M27 43 Q32 40 37 43 L36 51 Q32 53.5 28 51 Z"/>
            <circle class="r2-core-ring" cx="32" cy="47" r="4.1"/>
            <path class="r2-core-x" d="M29.5 44.6 L34.5 49.4 M34.5 44.6 L29.5 49.4"/>
          </g>

          <g class="r2-arm r2-arm-left">
            <circle class="r2-joint r2-shoulder" cx="22" cy="41" r="3"/>
            <g class="r2-arm-motion r2-arm-motion-left">
              <rect class="r2-limb r2-upper-arm" x="18.2" y="40.5" width="4.6" height="10.7" rx="2.3"/>
              <circle class="r2-joint r2-elbow" cx="20.5" cy="51" r="2.25"/>
              <g class="r2-forearm r2-forearm-left">
                <rect class="r2-limb" x="18.25" y="50.7" width="4.5" height="9.2" rx="2.25"/>
                <circle class="r2-joint r2-wrist" cx="20.5" cy="59.9" r="1.75"/>
                <g class="r2-hand r2-hand-left"><rect x="17.9" y="59.4" width="5.2" height="4.3" rx="2.15"/></g>
              </g>
            </g>
          </g>

          <g class="r2-arm r2-arm-right">
            <circle class="r2-joint r2-shoulder" cx="42" cy="41" r="3"/>
            <g class="r2-arm-motion r2-arm-motion-right">
              <rect class="r2-limb r2-upper-arm" x="41.2" y="40.5" width="4.6" height="10.7" rx="2.3"/>
              <circle class="r2-joint r2-elbow" cx="43.5" cy="51" r="2.25"/>
              <g class="r2-forearm r2-forearm-right">
                <rect class="r2-limb" x="41.25" y="50.7" width="4.5" height="9.2" rx="2.25"/>
                <circle class="r2-joint r2-wrist" cx="43.5" cy="59.9" r="1.75"/>
                <g class="r2-hand r2-hand-right"><rect x="40.9" y="59.4" width="5.2" height="4.3" rx="2.15"/></g>
              </g>
            </g>
          </g>

          <g class="r2-head">
            <g class="r2-ear r2-ear-left">
              <path d="M20 18 L15 13 L16.5 25 Z"/>
              <path class="r2-ear-inner" d="M19 19 L16.7 16.4 L17.3 22.4 Z"/>
            </g>
            <g class="r2-ear r2-ear-right">
              <path d="M44 18 L49 13 L47.5 25 Z"/>
              <path class="r2-ear-inner" d="M45 19 L47.3 16.4 L46.7 22.4 Z"/>
            </g>

            <rect class="r2-head-shell" x="17" y="14" width="30" height="24" rx="9"/>
            <rect class="r2-face" x="20.2" y="18.5" width="23.6" height="14.2" rx="6"/>
            <g class="r2-eyes" filter="url(#r2-glow)">
              <rect class="r2-eye r2-eye-left" x="24" y="23.2" width="5.4" height="2.4" rx="1.2"/>
              <rect class="r2-eye r2-eye-right" x="34.6" y="23.2" width="5.4" height="2.4" rx="1.2"/>
            </g>
            <path class="r2-mouth" d="M28 29.2 Q32 31 36 29.2"/>
            <circle class="r2-cheek r2-cheek-left" cx="22.8" cy="29" r="1"/>
            <circle class="r2-cheek r2-cheek-right" cx="41.2" cy="29" r="1"/>
          </g>
        </g>
      </svg>
    </div>
  `;

  const el = document.getElementById('ripplet2d');
  let resetTimer = 0;
  let blinkTimer = 0;

  const durationFor = state => ({
    idle: 0, stand: 0, sit: 0, walk: 1600, run: 1050, jump: 900, climb: 1500, hang: 1500,
    wave: 1600, salute: 1500, thinking: 2200, happy: 1700,
    excited: 1800, cheer: 1900, celebrate: 1900, dance: 2600,
    shrug: 1700, confused: 1900, surprised: 1500, focus: 1900,
    scan: 2000, alert: 1700, laugh: 1900, point: 1700,
    crouch: 1100, turn: 900, reach: 1200, grab: 1100, carry: 1900
  }[state] ?? 1500);

  function setState(state='idle', opts={}) {
    if (!el) return;
    clearTimeout(resetTimer);
    el.dataset.state = state;
    if (opts.side) el.dataset.side = opts.side;
    else delete el.dataset.side;
    if (Number.isFinite(opts.turn)) el.style.setProperty('--r2-turn', opts.turn);
    const d = durationFor(state);
    if (d > 0) resetTimer = setTimeout(() => {
      if (el.dataset.state === state) el.dataset.state = 'idle';
    }, d);
  }

  function scheduleBlink() {
    clearTimeout(blinkTimer);
    blinkTimer = setTimeout(() => {
      if (el && !['sleep','focus'].includes(el.dataset.state)) {
        el.classList.add('is-blinking');
        setTimeout(() => el?.classList.remove('is-blinking'), 130);
      }
      scheduleBlink();
    }, 1800 + Math.random() * 2600);
  }
  scheduleBlink();

  const api = {
    mode: '2d-retro-pointer-platformer',
    motor(action, opts={}) { setState(action, opts); return true; },
    face(direction='right') {
      if(el) el.dataset.facing=direction==='left'?'left':'right';
      return true;
    },
    perform(action, opts={}) { setState(action, opts); return true; },
    react(action, opts={}) { setState(action, opts); return true; },
    celebrate() { setState('celebrate'); return true; },
    setAppearance() { return true; },
    currentAction() { return el?.dataset.state || 'idle'; },
    element: el
  };

  window.XRPet3D = api;
  window.XRPet2D = api;
  window.dispatchEvent(new CustomEvent('xrpet:model-ready', {
    detail: { kind:'ripplet', mode:'2d-retro-pointer-platformer', animations:['stand','sit','walk','run','jump','climb','hang','wave','salute','thinking','happy','dance'] }
  }));
})();