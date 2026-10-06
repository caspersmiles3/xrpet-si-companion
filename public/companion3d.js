import * as THREE from '/vendor/three.module.js';

const host = document.getElementById('companion3d');
if (host) {
  try {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(37,1,0.1,100);
    camera.position.set(0,0,7.8);
    const renderer = new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'default'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    renderer.setClearColor(0,0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.domElement.className = 'companion3d-canvas';
    renderer.domElement.setAttribute('aria-label','Rotate and interact with XRPet');
    host.appendChild(renderer.domElement);

    const palettes = {
      classic:[0xcbd8e0,0x111d27,0x40e4ff],
      aqua:[0x91eaf3,0x103344,0x3dffee],
      midnight:[0x303d4e,0x050910,0x538dff],
      pearl:[0xe5f0f7,0x63738a,0xd6b5ff],
      solar:[0xcfa073,0x3b2419,0xffbc54]
    };
    const shell = new THREE.MeshPhysicalMaterial({color:0xcbd8e0,metalness:.62,roughness:.19,clearcoat:1,clearcoatRoughness:.1});
    const dark = new THREE.MeshPhysicalMaterial({color:0x111d27,metalness:.4,roughness:.22,clearcoat:.65});
    const glow = new THREE.MeshStandardMaterial({color:0x40e4ff,emissive:0x40e4ff,emissiveIntensity:2.4,metalness:.25,roughness:.28});
    const glass = new THREE.MeshPhysicalMaterial({color:0x8af3ff,emissive:0x2184bb,emissiveIntensity:.7,metalness:.2,roughness:.14,clearcoat:1});
    const pupilMat = new THREE.MeshStandardMaterial({color:0x04131c,roughness:.1});
    const pupilWhite = new THREE.MeshBasicMaterial({color:0xffffff});
    const pet = new THREE.Group();
    scene.add(pet);
    function make(geometry,material,parent=pet){
      const object = new THREE.Mesh(geometry,material);
      parent.add(object);return object;
    }
    function sphere(x,y,z,sx,sy,sz,material= shell,parent=pet){
      const o=make(new THREE.SphereGeometry(1,32,22),material,parent);
      o.position.set(x,y,z);o.scale.set(sx,sy,sz);return o;
    }
    function cone(x,y,z,rad,len,material=shell,parent=pet){
      const o=make(new THREE.ConeGeometry(rad,len,5),material,parent);
      o.position.set(x,y,z);return o;
    }
    function torus(x,y,z,r,tube,material=glow,parent=pet){
      const o=make(new THREE.TorusGeometry(r,tube,12,58),material,parent);
      o.position.set(x,y,z);return o;
    }

    const body=sphere(0,-.74,-.08,.72,.74,.69);
    const belly=sphere(0,-.73,.46,.54,.47,.28,dark);
    const head=sphere(0,.53,0,1.03,.86,.9);
    const face=sphere(0,.43,.57,.88,.57,.51,dark);
    const earL=cone(-.69,1.52,-.08,.33,.91);
    const earR=cone(.69,1.52,-.08,.33,.91);
    earL.rotation.z=-.2;earR.rotation.z=.2;
    const innerL=cone(-.69,1.52,.11,.2,.63,dark);
    const innerR=cone(.69,1.52,.11,.2,.63,dark);
    innerL.rotation.z=-.2;innerR.rotation.z=.2;
    const eyes=[],pupils=[];
    for (const x of [-.42,.42]){
      const eye=sphere(x,.66,1.005,.26,.28,.15,glass);eyes.push(eye);
      pupils.push(sphere(x,.66,1.14,.075,.12,.035,pupilMat));
      sphere(x-.055,.75,1.182,.029,.029,.02,pupilWhite);
    }
    const mouth=make(new THREE.TorusGeometry(.13,.015,8,30,Math.PI),glow);
    mouth.position.set(0,.19,1.07);mouth.rotation.z=Math.PI;
    const core=torus(0,-.65,.76,.19,.045);
    core.rotation.x=.19;
    const coreCrystal=sphere(0,-.65,.8,.11,.11,.06,glass);
    const shoulders=[];
    for(const x of [-.82,.82]){
      const pod=sphere(x,-.54,.02,.25,.32,.27);shoulders.push(pod);
      torus(x,-.54,.29,.14,.024);
    }
    const legs=[];
    for(const x of [-.37,.37]){
      const leg=sphere(x,-1.42,.02,.29,.35,.34);legs.push(leg);
      sphere(x,-1.68,.21,.31,.12,.4,dark);
    }
    const orbGroup=new THREE.Group();pet.add(orbGroup);orbGroup.position.set(0,2.15,.02);
    sphere(0,0,0,.18,.18,.18,glass,orbGroup);
    const orbit1=torus(0,0,0,.35,.017,glow,orbGroup);orbit1.rotation.x=1.0;
    const orbit2=torus(0,0,0,.3,.015,glow,orbGroup);orbit2.rotation.set(.5,.4,.2);

    const speciesExtras={};
    for(const k of ['fox','pup','cat','bird','turtle']){
      speciesExtras[k]=new THREE.Group();pet.add(speciesExtras[k]);
    }
    // Fox: pointed ears, longer muzzle and a luminous sweeping tail.
    sphere(0,.25,1.05,.24,.21,.42,shell,speciesExtras.fox);
    const foxTail=torus(.76,-.92,-.22,.49,.115,shell,speciesExtras.fox);
    foxTail.rotation.set(.35,.5,-.6);
    const foxTailLight=torus(.76,-.92,-.13,.49,.026,glow,speciesExtras.fox);
    foxTailLight.rotation.copy(foxTail.rotation);
    // Pup: drooping ears and rounded face.
    for(const x of [-1,1]){
      const flap=sphere(x*.91,1.03,.07,.24,.48,.24,shell,speciesExtras.pup);
      flap.rotation.z=x*.25;
    }
    sphere(0,.24,1.05,.43,.23,.3,shell,speciesExtras.pup);
    sphere(0,.33,1.31,.14,.12,.12,dark,speciesExtras.pup);
    // Cat: narrow ears, whiskers and curled tail.
    for(const x of [-1,1]){
      for(const dy of [-.09,.03,.15]){
        const whisker=make(new THREE.CylinderGeometry(.009,.009,.4,6),glow,speciesExtras.cat);
        whisker.position.set(x*.78,.28+dy,1.02);
        whisker.rotation.z=Math.PI/2+x*dy;
      }
    }
    const catTail=torus(.81,-1.0,-.2,.46,.075,shell,speciesExtras.cat);
    catTail.rotation.set(.15,.7,-.35);
    // Bird: wings and beak, no ears.
    for(const x of [-1,1]){
      const wing=cone(x*.94,-.42,-.05,.38,1.32,shell,speciesExtras.bird);
      wing.rotation.z=x*-1.12;
      const wingLight=make(new THREE.BoxGeometry(.04,.64,.05),glow,speciesExtras.bird);
      wingLight.position.set(x*.89,-.4,.21);wingLight.rotation.z=x*-1.1;
    }
    const beak=cone(0,.3,1.18,.18,.48,shell,speciesExtras.bird);beak.rotation.x=Math.PI/2;
    // Turtle: wider protective shell and feet.
    sphere(0,-.75,-.54,.92,.69,.4,shell,speciesExtras.turtle);
    const shellRing=torus(0,-.7,-.88,.6,.045,glow,speciesExtras.turtle);shellRing.rotation.y=.15;
    for(const x of [-1,1]) sphere(x*.84,-1.27,.14,.36,.19,.3,shell,speciesExtras.turtle);

    const presentationBoy=new THREE.Group(),presentationGirl=new THREE.Group();
    pet.add(presentationBoy,presentationGirl);
    for(const x of [-1,1]){
      const brow=make(new THREE.BoxGeometry(.28,.045,.06),glow,presentationBoy);
      brow.position.set(x*.42,.98,1.09);brow.rotation.z=x*-.16;
    }
    const diadem=torus(0,1.42,.66,.37,.026,glow,presentationGirl);
    diadem.rotation.x=.4;
    for(const x of [-1,1]) sphere(x*.75,.82,.73,.075,.075,.075,glass,presentationGirl);
    const girlArc=make(new THREE.TorusGeometry(.48,.018,10,50,Math.PI),glow,presentationGirl);
    girlArc.position.set(0,1.3,.12);girlArc.rotation.z=Math.PI;

    const builds={};
    for(const b of ['aqua','midnight','pearl','solar']) {builds[b]=new THREE.Group();pet.add(builds[b]);}
    // Scout: outward fins.
    for (const x of [-1,1]){
      const fin=cone(x*.98,.48,-.09,.17,.9,shell,builds.aqua);fin.rotation.z=-x*.95;
    }
    // Guardian: bulkier chest and shoulder shields.
    sphere(0,-.62,.61,.62,.35,.25,shell,builds.midnight);
    for(const x of [-1,1]) sphere(x*.91,-.52,.19,.35,.34,.27,shell,builds.midnight);
    // Oracle: multi-ring rotating halo.
    const oracleHalo=torus(0,2.11,.08,.58,.03,glow,builds.pearl);
    oracleHalo.rotation.x=.35;
    const oracleCrown=make(new THREE.OctahedronGeometry(.16,0),glass,builds.pearl);
    oracleCrown.position.set(0,2.12,0);
    // Vanguard: reactor and winglets.
    for(const x of [-1,1]){
      const wing=cone(x*.98,-.18,-.27,.2,1.0,shell,builds.solar);
      wing.rotation.z=-x*.95;
    }
    const solarRing=torus(0,-.65,.84,.28,.06,glow,builds.solar);

    scene.add(new THREE.HemisphereLight(0xd7f6ff,0x102034,2.6));
    const key=new THREE.DirectionalLight(0xffffff,4);key.position.set(-3,5,6);scene.add(key);
    const fill=new THREE.PointLight(0x35ceff,16,12);fill.position.set(2.2,1.5,3);scene.add(fill);
    const rim=new THREE.PointLight(0x627fff,12,11);rim.position.set(-2,.2,-2);scene.add(rim);

    let current={companionKind:'nexus',companionGender:'boy',cosmetic:'classic',room:'nexus'};
    let rotX=0,rotY=0,pointerX=0,pointerY=0,drag=false,lastX=0,lastY=0,boost=0,lastInput=0;
    function setAppearance(d={}){
      current={...current,...d};
      const kind=['nexus','fox','pup','cat','bird','turtle'].includes(current.companionKind)?current.companionKind:'nexus';
      const color=palettes[current.cosmetic]||palettes.classic;
      shell.color.setHex(color[0]);dark.color.setHex(color[1]);
      glow.color.setHex(color[2]);glow.emissive.setHex(color[2]);
      glass.color.setHex(color[2]);
      for(const k of Object.keys(speciesExtras))speciesExtras[k].visible=k===kind;
      for(const k of Object.keys(builds))builds[k].visible=k===current.cosmetic;
      presentationBoy.visible=current.companionGender!=='girl';
      presentationGirl.visible=current.companionGender==='girl';
      const e=kind==='fox'?[.76,1.27,.81]:kind==='cat'?[.78,1.13,.78]:
         kind==='pup'?[.66,.8,.8]:kind==='turtle'?[.56,.5,.74]:
         kind==='bird'?[.0,.0,.0]:[1,1,1];
      for(const [i,ear] of [earL,earR,innerL,innerR].entries()){
        ear.visible=kind!=='bird'&&kind!=='turtle';
        ear.scale.set(...e);
        ear.rotation.z=(i%2===0?-1:1)*(kind==='fox'?.12:.25);
      }
      if(kind==='fox'){head.scale.set(.96,.77,.86);body.scale.set(.6,.73,.59)}
      else if(kind==='cat'){head.scale.set(.9,.8,.84);body.scale.set(.59,.75,.55)}
      else if(kind==='pup'){head.scale.set(1.08,.86,.98);body.scale.set(.83,.7,.77)}
      else if(kind==='bird'){head.scale.set(.78,.78,.8);body.scale.set(.46,.89,.46)}
      else if(kind==='turtle'){head.scale.set(.82,.72,.78);body.scale.set(.91,.62,.81)}
      else {head.scale.set(1.03,.86,.9);body.scale.set(.72,.74,.69)}
      if(current.companionGender==='girl'){head.scale.x*=.96;head.scale.y*=1.04;}
      const env={
        nexus:[0x36ceff,0x627fff,1.3],ocean:[0x2eece7,0x2272c7,1.23],
        vault:[0xd8b05c,0x92623c,1.2],aurora:[0x83eeff,0xa777f4,1.34],
        legend:[0xffd382,0x9d60f8,1.33]
      }[current.room]||[0x36ceff,0x627fff,1.3];
      fill.color.setHex(env[0]);rim.color.setHex(env[1]);renderer.toneMappingExposure=env[2];
    }

    renderer.domElement.addEventListener('pointerdown',e=>{
      drag=true;lastX=e.clientX;lastY=e.clientY;lastInput=performance.now();
      renderer.domElement.setPointerCapture?.(e.pointerId);
    });
    renderer.domElement.addEventListener('pointermove',e=>{
      const r=renderer.domElement.getBoundingClientRect();
      pointerX=Math.max(-1,Math.min(1,(e.clientX-r.left)/r.width*2-1));
      pointerY=Math.max(-1,Math.min(1,(e.clientY-r.top)/r.height*2-1));
      if(drag){
        rotY+=(e.clientX-lastX)*.014;rotX+=(e.clientY-lastY)*.005;
        rotX=Math.max(-.3,Math.min(.3,rotX));
        lastX=e.clientX;lastY=e.clientY;lastInput=performance.now();
      }
    });
    renderer.domElement.addEventListener('pointerup',e=>{
      drag=false;renderer.domElement.releasePointerCapture?.(e.pointerId);
    });
    renderer.domElement.addEventListener('pointercancel',()=>drag=false);
    renderer.domElement.addEventListener('click',()=>{
      boost=1;window.dispatchEvent(new CustomEvent('xrpet:petInteract'));
    });
    renderer.domElement.addEventListener('dblclick',()=>{rotX=0;rotY=0;});
    function resize(){
      const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);
      renderer.setSize(w,h,false);
      camera.aspect=w/h;camera.updateProjectionMatrix();
    }
    if(typeof ResizeObserver!=='undefined')new ResizeObserver(resize).observe(host);
    else window.addEventListener('resize',resize);
    resize();
    setAppearance();
    let ready=false;
    const clock=new THREE.Clock();
    function frame(){
      const t=clock.getElapsedTime();
      if(!drag && performance.now()-lastInput>3500)rotY=Math.sin(t*.55)*.23;
      pet.rotation.y+=(rotY-pet.rotation.y)*.08;
      pet.rotation.x+=(rotX-pet.rotation.x)*.08;
      pet.position.y=Math.sin(t*1.4)*.06+boost*.1;
      pet.rotation.z=Math.sin(t*.7)*.016;
      orbit1.rotation.z=t*.55;orbit2.rotation.z=-t*.45;
      orbGroup.rotation.y=t*.45;oracleHalo.rotation.z=t*.3;
      eyes.forEach((o,i)=>{o.scale.y=.28*(1-Math.pow(Math.max(0,Math.sin(t*.56+i*.015+1.9)),45)*.85)});
      pupils.forEach((o,i)=>{o.position.x=(i===0?-.42:.42)+pointerX*.045;o.position.y=.66-pointerY*.03});
      boost*=.87;
      renderer.render(scene,camera);
      if(!ready){
        ready=true;host.querySelector('.companion3d-loading')?.remove();
        window.XRPet3D={setAppearance,react(){boost=1},reset(){rotX=rotY=0}};
        window.dispatchEvent(new CustomEvent('xrpet:3d-ready'));
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }catch(e){
    console.error('XRPet 3D failed:',e);
    host.classList.add('companion3d-failed');
    host.innerHTML='<img src="/xrpet-icon.svg" alt="XRPet icon"><small>3D unavailable on this device</small>';
    window.dispatchEvent(new CustomEvent('xrpet:3d-error',{detail:{message:String(e?.message||e)}}));
  }
}
