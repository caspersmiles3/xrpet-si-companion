import * as THREE from 'https://esm.sh/three@0.169.0';

const host=document.getElementById('companion3d');
if(!host) throw new Error('XRPet 3D host missing');

const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(31,1,.1,100);
camera.position.set(0,.15,8.4);

const deviceMemory=Number(navigator.deviceMemory||8);
const cpuCores=Number(navigator.hardwareConcurrency||8);
const prefersReducedMotion=matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;
let savedGraphics='auto';
try{savedGraphics=JSON.parse(localStorage.getItem('xrpet-v2-state')||'{}').graphicsQuality||'auto'}catch{}
const autoLowPower=deviceMemory<=4||cpuCores<=4||prefersReducedMotion;
const lowPower=savedGraphics==='performance'?true:savedGraphics==='full'?false:autoLowPower;
const XRPetQuality={
  mode:savedGraphics,
  lowPower,
  pixelRatio:lowPower?1:Math.min(window.devicePixelRatio||1,1.75),
  shadows:!lowPower,
  reflections:!lowPower,
  fps:lowPower?24:45
};

let renderer;
try{
  renderer=new THREE.WebGLRenderer({antialias:!XRPetQuality.lowPower,alpha:true,powerPreference:XRPetQuality.lowPower?'default':'high-performance'});
}catch(err){
  host.innerHTML='<div class="companion3d-fallback"><strong>XRPet 3D Safe Mode</strong><small>Your browser could not initialize WebGL. The app will continue without the live 3D layer.</small></div>';
  window.dispatchEvent(new CustomEvent('xrpet:model-fallback',{detail:{kind:'ripplet',error:'WebGL unavailable'}}));
  throw err;
}
renderer.setPixelRatio(XRPetQuality.pixelRatio);
renderer.setClearColor(0x000000,0);
renderer.setClearAlpha(0);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.18;
renderer.shadowMap.enabled=XRPetQuality.shadows;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.domElement.className='companion3d-canvas';
renderer.domElement.setAttribute('aria-label','Interactive cinematic XRPet companion');

host.appendChild(renderer.domElement);

let orbitControls=null;
let composer=null;
let ssaoPass=null;
let bloomPass=null;
let postFxReady=false;
const cameraGoal=new THREE.Vector3(0,.15,8.4);
const targetGoal=new THREE.Vector3(0,.2,0);
let cameraTween=0;

// Smooth orbit controls. Failure falls back to the built-in model rotation.
(async()=>{
  try{
    const mod=await import('https://esm.sh/three@0.169.0/examples/jsm/controls/OrbitControls.js?deps=three@0.169.0');
    orbitControls=new mod.OrbitControls(camera,renderer.domElement);
    orbitControls.enableDamping=true;
    orbitControls.dampingFactor=.075;
    orbitControls.enablePan=false;
    orbitControls.enableZoom=true;
    orbitControls.minDistance=5.2;
    orbitControls.maxDistance=10.5;
    orbitControls.minPolarAngle=Math.PI*.28;
    orbitControls.maxPolarAngle=Math.PI*.72;
    orbitControls.target.copy(targetGoal);
    orbitControls.rotateSpeed=.62;
    orbitControls.zoomSpeed=.75;
    orbitControls.addEventListener('start',()=>{cameraTween=0;lastInteract=performance.now()});
  }catch(err){
    console.warn('XRPet orbit controls unavailable',err);
  }
})();

// Performance-gated post-processing: SSAO + restrained bloom.
(async()=>{
  if(XRPetQuality.lowPower)return;
  try{
    const [composerMod,renderMod,ssaoMod,bloomMod]=await Promise.all([
      import('https://esm.sh/three@0.169.0/examples/jsm/postprocessing/EffectComposer.js?deps=three@0.169.0'),
      import('https://esm.sh/three@0.169.0/examples/jsm/postprocessing/RenderPass.js?deps=three@0.169.0'),
      import('https://esm.sh/three@0.169.0/examples/jsm/postprocessing/SSAOPass.js?deps=three@0.169.0'),
      import('https://esm.sh/three@0.169.0/examples/jsm/postprocessing/UnrealBloomPass.js?deps=three@0.169.0')
    ]);
    composer=new composerMod.EffectComposer(renderer);
    composer.addPass(new renderMod.RenderPass(scene,camera));
    ssaoPass=new ssaoMod.SSAOPass(scene,camera,1,1);
    ssaoPass.kernelRadius=7;
    ssaoPass.minDistance=.004;
    ssaoPass.maxDistance=.12;
    composer.addPass(ssaoPass);
    bloomPass=new bloomMod.UnrealBloomPass(new THREE.Vector2(1,1),.23,.42,.82);
    bloomPass.threshold=.74;
    bloomPass.strength=.28;
    bloomPass.radius=.38;
    composer.addPass(bloomPass);
    const rr=host.getBoundingClientRect();
    composer.setSize(Math.max(1,rr.width),Math.max(1,rr.height));
    ssaoPass.setSize?.(Math.max(1,rr.width),Math.max(1,rr.height));
    postFxReady=true;
    window.dispatchEvent(new CustomEvent('xrpet:quality',{detail:{mode:'full',postFx:true,fps:XRPetQuality.fps}}));
  }catch(err){
    console.warn('XRPet post FX unavailable; using direct renderer',err);
    composer=null;ssaoPass=null;bloomPass=null;postFxReady=false;
    window.dispatchEvent(new CustomEvent('xrpet:quality',{detail:{mode:XRPetQuality.lowPower?'performance':'standard',postFx:false,fps:XRPetQuality.fps}}));
  }
})();

// Physically based reflection environment. Disabled in performance mode.
(async()=>{
  if(!XRPetQuality.reflections)return;
  try{
    const envMod=await import('https://esm.sh/three@0.169.0/examples/jsm/environments/RoomEnvironment.js?deps=three@0.169.0');
    const pmrem=new THREE.PMREMGenerator(renderer);
    const envScene=new envMod.RoomEnvironment();
    const target=pmrem.fromScene(envScene,.035);
    scene.environment=target.texture;
    envScene.dispose?.();
    pmrem.dispose();
  }catch(err){
    console.warn('XRPet reflection environment unavailable',err);
  }
})();


const root=new THREE.Group();
root.position.y=.08;
scene.add(root);

const palette={
  classic:{shell:0xbfcbd2,dark:0x10171d,accent:0x43e8ff,glass:0xa6f8ff},
  aqua:{shell:0x88dce8,dark:0x09202a,accent:0x45e8ff,glass:0xc5fbff},
  midnight:{shell:0x313c45,dark:0x04080b,accent:0x2ebcff,glass:0x79dcff},
  pearl:{shell:0xe8eef2,dark:0x65727a,accent:0xb4f8ff,glass:0xffffff},
  solar:{shell:0xd78f48,dark:0x28110a,accent:0xffbf57,glass:0xffe5ad},
  resonance:{shell:0x9daab1,dark:0x090b0d,accent:0xd1aa56,glass:0x8ff3ff}
};

const shellMat=new THREE.MeshPhysicalMaterial({
  color:palette.classic.shell,metalness:.72,roughness:.22,clearcoat:1,clearcoatRoughness:.12
});
const shellDarkMat=new THREE.MeshPhysicalMaterial({
  color:palette.classic.dark,metalness:.82,roughness:.18,clearcoat:.75,clearcoatRoughness:.16
});
const accentMat=new THREE.MeshStandardMaterial({
  color:palette.classic.accent,emissive:palette.classic.accent,emissiveIntensity:2.5,metalness:.22,roughness:.24
});
const glassMat=new THREE.MeshPhysicalMaterial({
  color:palette.classic.glass,emissive:0x1a87a3,emissiveIntensity:.62,roughness:.06,
  metalness:.05,transmission:.32,transparent:true,opacity:.94,clearcoat:1
});
const blackMat=new THREE.MeshPhysicalMaterial({color:0x010305,metalness:.35,roughness:.08,clearcoat:1});

const irisMat=new THREE.MeshPhysicalMaterial({color:0x72efff,emissive:0x23cce9,emissiveIntensity:3.2,metalness:.08,roughness:.12,clearcoat:1,clearcoatRoughness:.03});
const skinJointMat=new THREE.MeshPhysicalMaterial({color:0x17242b,metalness:.72,roughness:.22,clearcoat:.72,clearcoatRoughness:.08});
const softMat=new THREE.MeshPhysicalMaterial({color:0x25313a,metalness:.3,roughness:.42,clearcoat:.35});
const detailTextures={};
function makeDetailTexture(kind){
  const c=document.createElement('canvas');c.width=c.height=192;
  const x=c.getContext('2d');
  x.fillStyle='#7f7f7f';x.fillRect(0,0,c.width,c.height);
  const rnd=(seed=>()=>((seed=Math.imul(seed^seed>>>15,1|seed))+(seed^seed>>>7))>>>0)(kind.length*9173+41);

  if(kind==='metal'){
    for(let i=0;i<230;i++){
      const y=(i/230)*c.height+(rnd()%5);
      const a=.06+(rnd()%13)/100;
      x.strokeStyle='rgba(235,235,235,'+a+')';x.lineWidth=.45+(rnd()%3)*.2;
      x.beginPath();x.moveTo(0,y);x.lineTo(c.width,y+(rnd()%3-1));x.stroke();
    }
  }else if(kind==='fur'){
    for(let i=0;i<850;i++){
      const px=rnd()%c.width,py=rnd()%c.height,len=3+(rnd()%8);
      const light=(rnd()%2)===0?230:45;
      x.strokeStyle='rgba('+light+','+light+','+light+','+(.04+(rnd()%10)/100)+')';
      x.lineWidth=.35+(rnd()%2)*.25;
      x.beginPath();x.moveTo(px,py);x.lineTo(px+((rnd()%5)-2),py+len);x.stroke();
    }
  }else if(kind==='feather'){
    for(let y=8;y<c.height;y+=14){
      x.strokeStyle='rgba(235,235,235,.12)';x.lineWidth=1;
      x.beginPath();x.moveTo(0,y);x.lineTo(c.width,y-5);x.stroke();
      for(let px=0;px<c.width;px+=18){
        x.strokeStyle='rgba(30,30,30,.08)';x.beginPath();x.moveTo(px,y);x.lineTo(px+9,y+8);x.stroke();
      }
    }
  }else if(kind==='shell'){
    x.strokeStyle='rgba(235,235,235,.12)';x.lineWidth=1;
    const r=18;
    for(let row=-1;row<12;row++){
      for(let col=-1;col<12;col++){
        const cx=col*r*1.5+(row%2?r*.75:0),cy=row*r*1.28;
        x.beginPath();
        for(let k=0;k<6;k++){
          const a=Math.PI/3*k;const px=cx+Math.cos(a)*r*.8,py=cy+Math.sin(a)*r*.8;
          k?x.lineTo(px,py):x.moveTo(px,py);
        }
        x.closePath();x.stroke();
      }
    }
  }
  const t=new THREE.CanvasTexture(c);
  t.wrapS=t.wrapT=THREE.RepeatWrapping;
  t.repeat.set(kind==='fur'?5:kind==='metal'?3:4,kind==='fur'?5:4);
  t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy?.()||1);
  t.needsUpdate=true;
  return t;
}
detailTextures.metal=makeDetailTexture('metal');
detailTextures.fur=makeDetailTexture('fur');
detailTextures.feather=makeDetailTexture('feather');
detailTextures.shell=makeDetailTexture('shell');


function add(geo,mat,parent=root,name=''){
  const m=new THREE.Mesh(geo,mat);
  m.name=name;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function tag(obj,role){obj.userData.role=role;return obj}
function hideGroup(g){g.visible=false;return g}

function signedPow(v,p){return Math.sign(v)*Math.pow(Math.abs(v),p)}
function makeSuperellipsoidGeometry(rx,ry,rz,pLat=.62,pLon=.62,segU=72,segV=48){
  const positions=[],uvs=[],indices=[];
  for(let iy=0;iy<=segV;iy++){
    const v=-Math.PI/2+(iy/segV)*Math.PI;
    const cv=Math.cos(v),sv=Math.sin(v);
    for(let ix=0;ix<=segU;ix++){
      const u=-Math.PI+(ix/segU)*Math.PI*2;
      const cu=Math.cos(u),su=Math.sin(u);
      const radial=signedPow(cv,pLat);
      positions.push(
        rx*radial*signedPow(cu,pLon),
        ry*signedPow(sv,pLat),
        rz*radial*signedPow(su,pLon)
      );
      uvs.push(ix/segU,iy/segV);
    }
  }
  for(let iy=0;iy<segV;iy++){
    for(let ix=0;ix<segU;ix++){
      const a=iy*(segU+1)+ix,b=a+1,c=(iy+1)*(segU+1)+ix,d=c+1;
      indices.push(a,c,b,b,c,d);
    }
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();
  return g;
}
function bevelBoxGeometry(w,h,d,r=.08,curveSegments=8){
  const shape=new THREE.Shape();
  const x=-w/2,y=-h/2;
  shape.moveTo(x+r,y);shape.lineTo(x+w-r,y);shape.quadraticCurveTo(x+w,y,x+w,y+r);
  shape.lineTo(x+w,y+h-r);shape.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  shape.lineTo(x+r,y+h);shape.quadraticCurveTo(x,y+h,x,y+h-r);
  shape.lineTo(x,y+r);shape.quadraticCurveTo(x,y,x+r,y);
  const g=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelThickness:r*.35,bevelSize:r*.3,bevelSegments:2,curveSegments});
  g.center();return g;
}

const pet=new THREE.Group();
pet.scale.setScalar(.82);
root.add(pet);

// --- cinematic base anatomy ---
const pelvis=tag(add(makeSuperellipsoidGeometry(.52,.34,.44,.58,.62,56,36),shellDarkMat,pet,'pelvis'),'pelvis');
pelvis.scale.set(.9,.54,.78);pelvis.position.set(0,-.87,.02);

const torso=tag(add(makeSuperellipsoidGeometry(.74,.82,.57,.54,.58,72,50),shellMat,pet,'torso'),'torso');
torso.scale.set(.9,.9,.78);torso.position.set(0,-.36,.03);

const chestPanel=tag(add(makeSuperellipsoidGeometry(.47,.39,.18,.52,.58,56,36),shellDarkMat,pet,'chest'),'chest');
chestPanel.scale.set(1.08,.8,.5);chestPanel.position.set(0,-.3,.64);

const neck=add(new THREE.CylinderGeometry(.31,.39,.34,40),shellDarkMat,pet,'neck');
neck.position.set(0,.28,.02);

const headRig=new THREE.Group();headRig.name='headRig';pet.add(headRig);
const head=tag(add(makeSuperellipsoidGeometry(.99,.83,.86,.48,.56,88,60),shellMat,headRig,'head'),'head');
head.scale.set(1,.82,.9);head.position.set(0,1.06,.04);

const face=tag(add(makeSuperellipsoidGeometry(.84,.55,.36,.5,.6,72,48),shellDarkMat,headRig,'face'),'face');
face.scale.set(.96,.66,.73);face.position.set(0,.99,.63);

const muzzle=tag(add(makeSuperellipsoidGeometry(.31,.16,.18,.56,.62,44,28),softMat,headRig,'muzzle'),'muzzle');
muzzle.scale.set(1.08,.52,.65);muzzle.position.set(0,.7,1.35);

const nose=tag(add(new THREE.SphereGeometry(.095,28,20),blackMat,headRig,'nose'),'nose');
nose.scale.set(1.05,.68,.75);nose.position.set(0,.71,1.58);

const mouth=add(new THREE.TorusGeometry(.13,.015,8,28,Math.PI),accentMat,headRig,'mouth');
mouth.position.set(0,.55,1.56);mouth.rotation.z=Math.PI;

// shell seam details
for(const x of [-.48,.48]){
  const cheek=add(new THREE.TorusGeometry(.19,.018,10,38,Math.PI*1.15),accentMat,headRig,'cheekSeam');
  cheek.position.set(x,.72,1.14);cheek.rotation.z=x<0?.72:-.72;
}
const browBridge=add(new THREE.BoxGeometry(.55,.035,.04),accentMat,headRig,'browBridge');
browBridge.position.set(0,1.37,1.19);

// eyes with cornea + pupil
const eyes=[], pupils=[], irises=[], glints=[], lids=[];
for(const x of [-.42,.42]){
  const eye=add(new THREE.SphereGeometry(.285,48,36),glassMat,headRig,'eye');
  eye.scale.set(1,.92,.48);eye.position.set(x,1.11,1.29);eyes.push(eye);

  const pupil=add(new THREE.SphereGeometry(.105,30,22),blackMat,headRig,'pupil');
  pupil.scale.set(.74,1,.4);pupil.position.set(x,1.11,1.52);pupils.push(pupil);

  const iris=add(new THREE.SphereGeometry(.145,40,28),irisMat,headRig,'iris');
  iris.scale.set(.9,1,.28);iris.position.set(x,1.11,1.49);
  iris.userData.eyeIndex=eyes.length-1;irises.push(iris);

  const cornea=add(new THREE.SphereGeometry(.292,48,36),glassMat,headRig,'cornea');
  cornea.scale.set(1.01,.93,.5);cornea.position.set(x,1.11,1.3);cornea.material=cornea.material.clone();
  cornea.material.opacity=.24;cornea.material.transparent=true;cornea.material.depthWrite=false;

  const glint=add(new THREE.SphereGeometry(.032,14,10),new THREE.MeshBasicMaterial({color:0xffffff}),headRig,'glint');
  glint.position.set(x-.035,1.2,1.58);glints.push(glint);

  const lid=add(new THREE.SphereGeometry(.295,48,30,0,Math.PI*2,0,Math.PI/2),shellDarkMat,headRig,'lid');
  lid.scale.set(1.02,.16,.51);lid.position.set(x,1.32,1.28);lids.push(lid);
}


const eyeSocketRings=[],browPlates=[];
for(const [x,sgn] of [[-.42,-1],[.42,1]]){
  const ring=add(new THREE.TorusGeometry(.31,.026,12,52),skinJointMat,headRig,'eyeSocketRing');
  ring.position.set(x,1.11,1.34);ring.rotation.x=Math.PI/2;eyeSocketRings.push(ring);

  const brow=add(bevelBoxGeometry(.42,.09,.08,.045),shellMat,headRig,'browPlate');
  brow.position.set(x,1.43,1.22);brow.rotation.z=sgn*.08;brow.rotation.x=-.08;browPlates.push(brow);
}
const foreheadPlate=tag(add(new THREE.SphereGeometry(.74,56,38),shellMat,headRig,'foreheadPlate'),'foreheadPlate');
foreheadPlate.scale.set(1,.28,.72);foreheadPlate.position.set(0,1.53,.56);
const jawPlate=tag(add(new THREE.SphereGeometry(.62,52,36),shellMat,headRig,'jawPlate'),'jawPlate');
jawPlate.scale.set(1,.24,.55);jawPlate.position.set(0,.64,.72);
for(const x of [-.56,.56]){
  const temple=tag(add(new THREE.SphereGeometry(.28,38,28),shellMat,headRig,'templePlate'),'templePlate');
  temple.scale.set(.62,1.05,.5);temple.position.set(x,1.12,.72);
}
// Ripplet 3.0 hard-surface micro detailing
const microDetails=new THREE.Group();microDetails.name='ripplet3BodyDetails';pet.add(microDetails);
const headDetails=new THREE.Group();headDetails.name='ripplet3HeadDetails';headRig.add(headDetails);
const microShellMat=shellMat.clone();microShellMat.metalness=.48;microShellMat.roughness=.3;
const microDarkMat=shellDarkMat.clone();microDarkMat.metalness=.62;microDarkMat.roughness=.28;

for(const sgn of [-1,1]){
  const templeRail=add(bevelBoxGeometry(.12,.46,.07,.035),microShellMat,headDetails,'templeRail');
  templeRail.position.set(sgn*.73,1.12,.78);templeRail.rotation.z=sgn*.12;templeRail.rotation.y=sgn*.08;

  const jawRail=add(bevelBoxGeometry(.13,.33,.075,.035),microDarkMat,headDetails,'jawRail');
  jawRail.position.set(sgn*.56,.72,1.05);jawRail.rotation.z=sgn*.26;

  for(let i=0;i<3;i++){
    const vent=add(bevelBoxGeometry(.12,.025,.045,.012),accentMat,headDetails,'cheekVent');
    vent.position.set(sgn*(.50+i*.03),.77-i*.055,1.23);
    vent.rotation.z=sgn*.24;
  }

  const shoulderPlate=add(bevelBoxGeometry(.36,.24,.11,.065),microShellMat,microDetails,'shoulderArmor');
  shoulderPlate.position.set(sgn*.74,-.12,.37);shoulderPlate.rotation.z=sgn*.12;shoulderPlate.rotation.x=-.06;

  for(let i=0;i<2;i++){
    const bolt=add(new THREE.CylinderGeometry(.025,.025,.018,20),accentMat,microDetails,'microBolt');
    bolt.rotation.x=Math.PI/2;bolt.position.set(sgn*(.62+i*.12),-.08,.45);
  }

  const shinPlate=add(bevelBoxGeometry(.16,.30,.07,.035),microShellMat,microDetails,'shinArmor');
  shinPlate.position.set(sgn*.29,-1.28,.35);
}
for(let i=0;i<4;i++){
  const chestRail=add(bevelBoxGeometry(.055,.28,.045,.025),i%2?microShellMat:accentMat,microDetails,'chestRail');
  chestRail.position.set((i-1.5)*.13,-.36,.84);
}
const collar=add(new THREE.TorusGeometry(.35,.045,16,56),microDarkMat,microDetails,'collarRing');
collar.position.set(0,.29,.05);collar.rotation.x=Math.PI/2;

// ears
const ears=[];
for(const [x,s] of [[-.72,-1],[.72,1]]){
  const ear=tag(add(new THREE.ConeGeometry(.39,.98,5),shellMat,pet,'ear'),'ear');
  ear.position.set(x,1.87,.02);ear.rotation.z=s*.24;ear.rotation.x=-.12;ears.push(ear);
  const inner=tag(add(new THREE.ConeGeometry(.24,.67,5),shellDarkMat,pet,'earInner'),'earInner');
  inner.position.set(x,1.86,.17);inner.rotation.z=s*.24;inner.rotation.x=-.12;
}

// shoulders / arms
const shoulders=[],forearms=[];
for(const [x,s] of [[-.89,-1],[.89,1]]){
  const shoulder=tag(add(new THREE.SphereGeometry(.34,36,24),shellMat,pet,'shoulder'),'shoulder');
  shoulder.scale.set(.76,.94,.7);shoulder.position.set(x,-.15,.02);shoulders.push(shoulder);
  const ring=add(new THREE.TorusGeometry(.245,.042,14,42),accentMat,pet,'shoulderLight');
  ring.position.set(x,-.15,.27);ring.rotation.x=Math.PI/2;

  const fore=tag(add(new THREE.CapsuleGeometry(.16,.42,8,20),shellDarkMat,pet,'forearm'),'forearm');
  fore.position.set(x*1.02,-.67,.13);fore.rotation.z=s*.09;forearms.push(fore);
}


// Ripplet 2.0: articulated upper arms, palms and finger pads for a less primitive silhouette.
const upperArms=[],hands=[],fingerPads=[],fingerDigits=[];
for(const [x,sgn] of [[-.78,-1],[.78,1]]){
  const upper=tag(add(new THREE.CapsuleGeometry(.145,.38,12,32),shellMat,pet,'upperArm'),'upperArm');
  upper.position.set(x,-.48,.08);upper.rotation.z=sgn*.08;upper.scale.set(.92,1.08,.88);upperArms.push(upper);

  const elbow=tag(add(new THREE.SphereGeometry(.17,36,28),skinJointMat,pet,'elbow'),'elbow');
  elbow.scale.set(1,.82,.92);elbow.position.set(sgn*.86,-.71,.12);

  const hand=tag(add(makeSuperellipsoidGeometry(.19,.15,.14,.5,.58,42,28),shellMat,pet,'hand'),'hand');
  hand.scale.set(.92,.7,.82);hand.position.set(sgn*.94,-.96,.2);hands.push(hand);

  for(let n=0;n<3;n++){
    const pad=tag(add(new THREE.SphereGeometry(.055,24,18),softMat,pet,'fingerPad'),'fingerPad');
    pad.scale.set(.7,1.15,.62);
    pad.position.set(sgn*(.88+.06*n),-.99-.03*n,.37+.015*n);
    fingerPads.push(pad);

    const digit=tag(add(new THREE.CapsuleGeometry(.035,.13,6,14),shellDarkMat,pet,'fingerDigit'),'fingerDigit');
    digit.position.set(sgn*(.89+.055*n),-1.045-.025*n,.31+.012*n);
    digit.rotation.z=sgn*(.18+.03*n);
    digit.rotation.x=-.18;fingerDigits.push(digit);
  }
}

// legs
const legs=[],feet=[];
for(const [x,s] of [[-.37,-1],[.37,1]]){
  const thigh=tag(add(new THREE.CapsuleGeometry(.2,.45,8,22),shellMat,pet,'leg'),'leg');
  thigh.position.set(x,-1.18,.02);thigh.rotation.z=s*.04;legs.push(thigh);
  const ankle=add(new THREE.TorusGeometry(.16,.03,12,32),accentMat,pet,'ankleLight');
  ankle.position.set(x,-1.49,.14);ankle.rotation.x=Math.PI/2;
  const foot=tag(add(makeSuperellipsoidGeometry(.24,.12,.34,.5,.56,44,28),shellDarkMat,pet,'foot'),'foot');
  foot.scale.set(1.18,.38,1.35);foot.position.set(x,-1.6,.23);feet.push(foot);
}


const calves=[],toeCaps=[];
for(const [x,sgn] of [[-.29,-1],[.29,1]]){
  const calf=tag(add(new THREE.CapsuleGeometry(.13,.31,12,28),shellDarkMat,pet,'calf'),'calf');
  calf.position.set(x,-1.26,.1);calf.scale.set(.9,1.08,.84);calves.push(calf);
  const toe=tag(add(makeSuperellipsoidGeometry(.17,.08,.24,.48,.56,38,24),shellMat,pet,'toeCap'),'toeCap');
  toe.scale.set(1.18,.35,1.5);toe.position.set(x,-1.5,.36);toeCaps.push(toe);
}

// core
const coreRing=add(new THREE.TorusGeometry(.205,.045,18,52),accentMat,pet,'coreRing');
coreRing.position.set(0,-.28,1.05);coreRing.rotation.x=Math.PI/2;
const coreBall=add(new THREE.SphereGeometry(.105,28,20),glassMat,pet,'coreBall');
coreBall.position.set(0,-.28,1.08);
const coreX1=add(new THREE.BoxGeometry(.24,.035,.025),accentMat,pet,'coreX1');
coreX1.position.set(0,-.28,1.19);coreX1.rotation.z=.78;
const coreX2=add(new THREE.BoxGeometry(.24,.035,.025),accentMat,pet,'coreX2');
coreX2.position.copy(coreX1.position);coreX2.rotation.z=-.78;

// Ripplet side-flow fins: rounded Ripple-inspired lobes beside the head.
const rippletFins=new THREE.Group();pet.add(rippletFins);
for(const [side,sgn] of [['left',-1],['right',1]]){
  const group=new THREE.Group();rippletFins.add(group);
  group.position.set(sgn*1.03,1.02,.02);
  for(const [dx,dy,scale] of [[0,.22,1],[.07,0,.86],[0,-.22,.72]]){
    const lobe=add(new THREE.SphereGeometry(.22,28,20),shellMat,group,'rippletFin');
    lobe.scale.set(.58*scale,1.05*scale,.42*scale);
    lobe.position.set(sgn*dx,dy,0);
    const glow=add(new THREE.TorusGeometry(.15*scale,.016,8,36),accentMat,group,'rippletFinGlow');
    glow.scale.set(.6,1,.7);glow.position.copy(lobe.position);glow.rotation.y=Math.PI/2;
  }
}

// Hover thruster / lower glow.
const rippletHover=add(new THREE.SphereGeometry(.24,28,18),glassMat,pet,'rippletHover');
rippletHover.visible=false;rippletHover.scale.set(.82,.35,.72);rippletHover.position.set(0,-1.1,.02);


// floating crown orb
const orbGroup=new THREE.Group();pet.add(orbGroup);orbGroup.position.set(0,2.45,0);
const orb=add(new THREE.SphereGeometry(.18,34,24),glassMat,orbGroup,'orb');
const orbit1=add(new THREE.TorusGeometry(.34,.018,10,58),accentMat,orbGroup,'orbit1');orbit1.rotation.x=1.1;
const orbit2=add(new THREE.TorusGeometry(.27,.014,10,52),accentMat,orbGroup,'orbit2');orbit2.rotation.set(.35,.7,.2);

// --- species geometry ---
const species={
  ripplet:new THREE.Group(),
  nexus:new THREE.Group(),
  fox:new THREE.Group(),
  pup:new THREE.Group(),
  cat:new THREE.Group(),
  bird:new THREE.Group(),
  turtle:new THREE.Group()
};
Object.values(species).forEach(g=>pet.add(g));

const foxTailPivot=new THREE.Group();species.fox.add(foxTailPivot);foxTailPivot.position.set(.55,-.8,-.42);
const foxTail=add(new THREE.TorusGeometry(.66,.12,14,58,Math.PI*1.35),shellMat,foxTailPivot,'foxTail');
foxTail.rotation.set(.3,.8,-.52);
const foxTailGlow=add(new THREE.TorusGeometry(.66,.026,10,58,Math.PI*1.35),accentMat,foxTailPivot,'foxTailGlow');
foxTailGlow.rotation.copy(foxTail.rotation);

for(const x of [-1,1]){
  const flap=add(new THREE.SphereGeometry(.32,28,22),shellMat,species.pup,'pupEar');
  flap.scale.set(.55,1.22,.34);flap.position.set(x*.86,1.58,.12);flap.rotation.z=x*.42;
}
const pupMuzzle=add(new THREE.SphereGeometry(.37,34,26),softMat,species.pup,'pupMuzzle');
pupMuzzle.scale.set(1.15,.64,.62);pupMuzzle.position.set(0,.67,1.42);

const catTailPivot=new THREE.Group();species.cat.add(catTailPivot);catTailPivot.position.set(.56,-.9,-.44);
const catTail=add(new THREE.TorusGeometry(.58,.082,12,52,Math.PI*1.42),shellMat,catTailPivot,'catTail');
catTail.rotation.set(.15,.68,-.42);
for(const y of [.72,.61,.5]){
  for(const side of [-1,1]){
    const whisk=add(new THREE.CylinderGeometry(.011,.011,.54,8),accentMat,species.cat,'whisker');
    whisk.position.set(side*.55,y,1.37);whisk.rotation.z=Math.PI/2+side*.12;
  }
}

const birdWings=[];
for(const [x,s] of [[-.93,-1],[.93,1]]){
  const pivot=new THREE.Group();species.bird.add(pivot);pivot.position.set(x,-.26,-.02);birdWings.push(pivot);
  const wing=add(new THREE.ConeGeometry(.37,1.18,5),shellMat,pivot,'birdWing');
  wing.position.set(s*.2,-.2,0);wing.rotation.z=s*-1.18;wing.rotation.x=-.1;
  const stripe=add(new THREE.BoxGeometry(.055,.68,.045),accentMat,pivot,'wingStripe');
  stripe.position.set(s*.17,-.17,.22);stripe.rotation.z=s*-1.12;
}
const beak=add(new THREE.ConeGeometry(.15,.44,4),shellMat,species.bird,'beak');
beak.position.set(0,.69,1.72);beak.rotation.x=Math.PI/2;

const turtleShell=add(new THREE.SphereGeometry(.83,48,34),shellMat,species.turtle,'turtleShell');
turtleShell.scale.set(1.05,.76,.43);turtleShell.position.set(0,-.58,-.5);
const turtleShellRing=add(new THREE.TorusGeometry(.54,.045,14,62),accentMat,species.turtle,'turtleShellRing');
turtleShellRing.position.set(0,-.58,-.86);turtleShellRing.rotation.x=Math.PI/2;
for(const [x,s] of [[-.88,-1],[.88,1]]){
  const paddle=add(new THREE.SphereGeometry(.31,24,18),shellMat,species.turtle,'turtlePaddle');
  paddle.scale.set(1.18,.38,.78);paddle.position.set(x,-1.05,.02);paddle.rotation.z=s*.1;
}

// --- Boy / Girl presentation ---
const boyGroup=new THREE.Group();pet.add(boyGroup);
for(const [x,s] of [[-.4,-1],[.4,1]]){
  const brow=add(new THREE.BoxGeometry(.3,.045,.055),accentMat,boyGroup,'boyBrow');
  brow.position.set(x,1.42,1.48);brow.rotation.z=s*.12;
}
const girlGroup=new THREE.Group();pet.add(girlGroup);
const crest=add(new THREE.TorusGeometry(.28,.027,12,50,Math.PI*1.55),accentMat,girlGroup,'girlCrest');
crest.position.set(0,1.68,1.03);crest.rotation.z=.25;
for(const x of [-.69,.69]){
  const gem=add(new THREE.SphereGeometry(.058,18,12),glassMat,girlGroup,'girlGem');
  gem.position.set(x,1.02,1.27);
}


/* higher-detail anatomy */
const foxDetail=new THREE.Group();species.fox.add(foxDetail);
for(const [x,s] of [[-.58,-1],[.58,1]]){
  const tuft=add(new THREE.ConeGeometry(.12,.38,5),shellMat,foxDetail,'foxCheekTuft');
  tuft.position.set(x,.69,1.2);tuft.rotation.z=s*1.05;tuft.rotation.x=-.05;
}
const foxTailTip=add(new THREE.SphereGeometry(.15,24,18),glassMat,foxTailPivot,'foxTailTip');
foxTailTip.position.set(.47,.05,-.52);foxTailTip.scale.set(.7,1.4,.7);

const pupDetail=new THREE.Group();species.pup.add(pupDetail);
for(const x of [-.32,.32]){
  for(let i=0;i<3;i++){
    const claw=add(new THREE.ConeGeometry(.025,.12,8),shellDarkMat,pupDetail,'pupClaw');
    claw.position.set(x+(i-1)*.07,-1.65,.47);claw.rotation.x=Math.PI/2;
  }
}
const pupNose=add(new THREE.SphereGeometry(.11,24,18),blackMat,pupDetail,'pupNose');
pupNose.scale.set(1.15,.72,.72);pupNose.position.set(0,.68,1.69);

const catDetail=new THREE.Group();species.cat.add(catDetail);
for(const x of [-.32,.32]){
  for(let i=0;i<3;i++){
    const claw=add(new THREE.ConeGeometry(.019,.095,7),shellDarkMat,catDetail,'catClaw');
    claw.position.set(x+(i-1)*.06,-1.64,.48);claw.rotation.x=Math.PI/2;
  }
}
for(const x of [-.18,.18]){
  const whiskerPad=add(new THREE.SphereGeometry(.11,18,14),softMat,catDetail,'whiskerPad');
  whiskerPad.scale.set(1.2,.65,.45);whiskerPad.position.set(x,.67,1.48);
}

const featherDetails=[];
for(const [x,s] of [[-.93,-1],[.93,1]]){
  for(let i=0;i<5;i++){
    const feather=add(new THREE.CapsuleGeometry(.055,.34+.06*i,5,10),shellMat,species.bird,'featherLayer');
    feather.position.set(x+s*(.12+.07*i),-.22-.08*i,-.03+.03*i);
    feather.rotation.z=s*(-.8-.08*i);feather.rotation.x=-.08;featherDetails.push(feather);
  }
}
for(let i=0;i<3;i++){
  const tailFeather=add(new THREE.CapsuleGeometry(.045,.42+i*.08,5,10),shellMat,species.bird,'tailFeather');
  tailFeather.position.set((i-1)*.12,-1.02,-.43);tailFeather.rotation.x=.22;tailFeather.rotation.z=(i-1)*.08;
  featherDetails.push(tailFeather);
}

const turtleScutes=[];
const scuteData=[[0,-.58,-.86,.17],[-.3,-.52,-.82,.13],[.3,-.52,-.82,.13],[-.18,-.78,-.8,.12],[.18,-.78,-.8,.12]];
for(const [x,y,z,r] of scuteData){
  const scute=add(new THREE.CircleGeometry(r,6),shellDarkMat,species.turtle,'shellScute');
  scute.position.set(x,y,z);scute.rotation.y=Math.PI;scute.rotation.z=Math.PI/6;turtleScutes.push(scute);
}

// --- additive cosmetics ---
const cosmeticGroups={
  classic:new THREE.Group(),
  aqua:new THREE.Group(),
  midnight:new THREE.Group(),
  pearl:new THREE.Group(),
  solar:new THREE.Group(),
  resonance:new THREE.Group()
};
Object.values(cosmeticGroups).forEach(g=>pet.add(g));

for(const [x,s] of [[-.98,-1],[.98,1]]){
  const fin=add(new THREE.ConeGeometry(.16,.9,4),shellMat,cosmeticGroups.aqua,'scoutFin');
  fin.position.set(x,.65,.02);fin.rotation.z=s*-1.12;
}
for(const [x,s] of [[-.9,-1],[.9,1]]){
  const armor=add(new THREE.BoxGeometry(.5,.32,.39),shellMat,cosmeticGroups.midnight,'guardianArmor');
  armor.position.set(x,-.13,.1);armor.rotation.z=s*.14;
}
const visor=add(new THREE.TorusGeometry(.7,.034,10,50,Math.PI),accentMat,cosmeticGroups.midnight,'guardianVisor');
visor.position.set(0,1.11,1.16);visor.rotation.z=Math.PI;

const halo1=add(new THREE.TorusGeometry(.52,.023,12,68),accentMat,cosmeticGroups.pearl,'halo1');
halo1.position.set(0,2.55,0);halo1.rotation.x=1.12;
const halo2=add(new THREE.TorusGeometry(.38,.017,10,60),accentMat,cosmeticGroups.pearl,'halo2');
halo2.position.set(0,2.55,0);halo2.rotation.set(.45,.35,.1);
const haloNode=add(new THREE.OctahedronGeometry(.13,1),glassMat,cosmeticGroups.pearl,'haloNode');
haloNode.position.set(0,2.55,0);

for(const [x,s] of [[-.98,-1],[.98,1]]){
  const wing=add(new THREE.ConeGeometry(.19,1.05,4),shellMat,cosmeticGroups.solar,'vanguardFin');
  wing.position.set(x,-.12,-.02);wing.rotation.z=s*-1.0;wing.rotation.x=-.15;
}
const solarChest=add(new THREE.BoxGeometry(.73,.39,.2),shellMat,cosmeticGroups.solar,'solarChest');
solarChest.position.set(0,-.3,.9);
const solarReactor=add(new THREE.TorusGeometry(.27,.068,16,46),accentMat,cosmeticGroups.solar,'solarReactor');
solarReactor.position.set(0,-.3,1.05);solarReactor.rotation.x=Math.PI/2;


// 589 Resonance: angular ledger lattice, not a paint-only skin.
const resCore=add(new THREE.OctahedronGeometry(.24,0),glassMat,cosmeticGroups.resonance,'resonanceCore');
resCore.position.set(0,-.28,1.12);resCore.rotation.z=Math.PI/4;
for(const [x,s] of [[-.72,-1],[.72,1]]){
  const rail=add(new THREE.BoxGeometry(.055,1.18,.07),accentMat,cosmeticGroups.resonance,'resonanceRail');
  rail.position.set(x,-.1,.45);rail.rotation.z=s*.22;
  const fin=add(new THREE.ConeGeometry(.1,.56,4),shellMat,cosmeticGroups.resonance,'resonanceFin');
  fin.position.set(x,.65,.18);fin.rotation.z=s*-.82;
}
for(let i=0;i<9;i++){
  const node=add(new THREE.OctahedronGeometry(i===4?.055:.038,0),accentMat,cosmeticGroups.resonance,'resonanceNode'+i);
  const a=(i/9)*Math.PI*2;node.position.set(Math.cos(a)*.78,.08+Math.sin(a)*.33,.34);
}
const resX1=add(new THREE.BoxGeometry(.72,.045,.06),accentMat,cosmeticGroups.resonance,'resonanceX1');
resX1.position.set(0,.62,.86);resX1.rotation.z=.72;
const resX2=add(new THREE.BoxGeometry(.72,.045,.06),accentMat,cosmeticGroups.resonance,'resonanceX2');
resX2.position.copy(resX1.position);resX2.rotation.z=-.72;

// holographic grounding ring; transparent scene, no box/pedestal
const holo=new THREE.Group();root.add(holo);holo.position.y=-1.92;
const holoRing=add(new THREE.TorusGeometry(1.03,.025,12,72),accentMat,holo,'holoRing');holoRing.rotation.x=Math.PI/2;
const holoRing2=add(new THREE.TorusGeometry(.7,.012,10,60),accentMat,holo,'holoRing2');holoRing2.rotation.x=Math.PI/2;
holo.visible=false;

// universal XRPet presentation layers for imported GLB companions
const externalPresentation=new THREE.Group();root.add(externalPresentation);externalPresentation.visible=false;
const externalGender={boy:new THREE.Group(),girl:new THREE.Group()};
Object.values(externalGender).forEach(g=>externalPresentation.add(g));

for(const [x,s] of [[-.58,-1],[.58,1]]){
  const sig=add(new THREE.BoxGeometry(.28,.045,.055),accentMat,externalGender.boy,'externalBoySignal');
  sig.position.set(x,.92,.92);sig.rotation.z=s*.12;
}
const extGirlCrest=add(new THREE.TorusGeometry(.3,.025,12,54,Math.PI*1.55),accentMat,externalGender.girl,'externalGirlCrest');
extGirlCrest.position.set(0,1.35,.55);extGirlCrest.rotation.z=.25;
for(const x of [-.48,.48]){
  const gem=add(new THREE.SphereGeometry(.055,18,12),glassMat,externalGender.girl,'externalGirlGem');
  gem.position.set(x,.88,.83);
}

const externalCosmetics={
  classic:new THREE.Group(),aqua:new THREE.Group(),midnight:new THREE.Group(),pearl:new THREE.Group(),solar:new THREE.Group(),resonance:new THREE.Group()
};
Object.values(externalCosmetics).forEach(g=>externalPresentation.add(g));

const extCoreRing=add(new THREE.TorusGeometry(.2,.04,16,52),accentMat,externalCosmetics.classic,'externalCoreRing');
extCoreRing.position.set(0,.05,1.15);extCoreRing.rotation.x=Math.PI/2;
const extCore=add(new THREE.SphereGeometry(.09,24,18),glassMat,externalCosmetics.classic,'externalCore');
extCore.position.set(0,.05,1.18);

const extAqua1=add(new THREE.TorusGeometry(.88,.022,12,72),accentMat,externalCosmetics.aqua,'externalAquaOrbit1');
extAqua1.position.set(0,.18,0);extAqua1.rotation.x=1.1;
const extAqua2=add(new THREE.TorusGeometry(.66,.016,10,64),accentMat,externalCosmetics.aqua,'externalAquaOrbit2');
extAqua2.position.set(0,.18,0);extAqua2.rotation.set(.45,.5,.2);

const extGuardian=add(new THREE.TorusGeometry(.78,.04,12,60,Math.PI*1.35),accentMat,externalCosmetics.midnight,'externalGuardianShield');
extGuardian.position.set(0,.25,.78);extGuardian.rotation.z=Math.PI*.83;

const extHalo1=add(new THREE.TorusGeometry(.5,.023,12,68),accentMat,externalCosmetics.pearl,'externalHalo1');
extHalo1.position.set(0,1.55,0);extHalo1.rotation.x=1.12;
const extHalo2=add(new THREE.TorusGeometry(.34,.016,10,58),accentMat,externalCosmetics.pearl,'externalHalo2');
extHalo2.position.set(0,1.55,0);extHalo2.rotation.set(.4,.4,.1);

const extSolar=add(new THREE.TorusGeometry(.3,.065,16,52),accentMat,externalCosmetics.solar,'externalSolarReactor');
extSolar.position.set(0,.08,1.08);extSolar.rotation.x=Math.PI/2;
for(const [x,s] of [[-.76,-1],[.76,1]]){
  const fin=add(new THREE.ConeGeometry(.11,.7,4),shellMat,externalCosmetics.solar,'externalSolarFin');
  fin.position.set(x,.1,.15);fin.rotation.z=s*-1.03;
}



// Universal XRPL exoskeleton: gives every imported companion a shared XRPet identity.
const externalLedgerFrame=new THREE.Group();externalPresentation.add(externalLedgerFrame);
for(const [x,s] of [[-.77,-1],[.77,1]]){
  const vertical=add(new THREE.BoxGeometry(.045,1.22,.055),accentMat,externalLedgerFrame,'ledgerRail');
  vertical.position.set(x,.18,.45);vertical.rotation.z=s*.13;
  const shoulder=add(new THREE.BoxGeometry(.48,.055,.08),shellDarkMat,externalLedgerFrame,'ledgerShoulderRail');
  shoulder.position.set(x*.72,.7,.47);shoulder.rotation.z=s*.28;
  const lower=add(new THREE.BoxGeometry(.38,.045,.06),accentMat,externalLedgerFrame,'ledgerLowerRail');
  lower.position.set(x*.63,-.5,.4);lower.rotation.z=s*-.22;
}
const externalXCore=new THREE.Group();externalLedgerFrame.add(externalXCore);externalXCore.position.set(0,.12,1.08);
for(const r of [-.72,.72]){
  const bar=add(new THREE.BoxGeometry(.5,.055,.07),accentMat,externalXCore,'xrpCoreBar');
  bar.rotation.z=r;
}
const externalCoreHousing=add(new THREE.OctahedronGeometry(.18,0),glassMat,externalXCore,'xrpCoreHousing');
externalCoreHousing.rotation.z=Math.PI/4;
const externalTopRail=add(new THREE.BoxGeometry(1.1,.035,.05),shellDarkMat,externalLedgerFrame,'ledgerTopRail');
externalTopRail.position.set(0,1.14,.25);
for(let i=0;i<5;i++){
  const n=add(new THREE.OctahedronGeometry(.027,0),accentMat,externalLedgerFrame,'validationFive'+i);
  n.position.set(-.58+i*.29,1.14,.31);
}

// 589 Resonance imported-model hardware.
const extRes=externalCosmetics.resonance;
const extResCore=add(new THREE.OctahedronGeometry(.28,0),glassMat,extRes,'ext589Core');
extResCore.position.set(0,.08,1.16);extResCore.rotation.z=Math.PI/4;
for(const [x,s] of [[-.9,-1],[.9,1]]){
  const rail=add(new THREE.BoxGeometry(.055,1.35,.065),accentMat,extRes,'ext589Rail');
  rail.position.set(x,.12,.26);rail.rotation.z=s*.19;
  const crown=add(new THREE.ConeGeometry(.095,.52,4),shellMat,extRes,'ext589Crown');
  crown.position.set(x*.72,1.1,.2);crown.rotation.z=s*-.72;
}
const ext589Nodes=[];
for(let i=0;i<9;i++){
  const node=add(new THREE.OctahedronGeometry(i===4?.05:.034,0),accentMat,extRes,'ext589Node'+i);
  const a=(i/9)*Math.PI*2;node.position.set(Math.cos(a)*.76,.18+Math.sin(a)*.44,.38);
  ext589Nodes.push(node);
}
const ext589SlashA=add(new THREE.BoxGeometry(.72,.045,.06),accentMat,extRes,'ext589SlashA');
ext589SlashA.position.set(0,.64,.9);ext589SlashA.rotation.z=.72;
const ext589SlashB=add(new THREE.BoxGeometry(.72,.045,.06),accentMat,extRes,'ext589SlashB');
ext589SlashB.position.copy(ext589SlashA.position);ext589SlashB.rotation.z=-.72;


// Universal Equipment Matrix — independent of species and main cosmetic preset.
const equipmentMatrixGroup=new THREE.Group();root.add(equipmentMatrixGroup);
const eyeSignalMat=new THREE.MeshStandardMaterial({color:0x47e6ff,emissive:0x47e6ff,emissiveIntensity:3.4,metalness:.15,roughness:.18});

const eyeSignalGroup=new THREE.Group();equipmentMatrixGroup.add(eyeSignalGroup);
for(const x of [-.42,.42]){
  const emitter=add(new THREE.OctahedronGeometry(.065,0),eyeSignalMat,eyeSignalGroup,'matrixEyeEmitter');
  emitter.position.set(x,1.04,1.43);emitter.scale.set(1,.72,.55);
}

const matrixCoreGroups={standard:new THREE.Group(),ripple:new THREE.Group(),vault:new THREE.Group(),589:new THREE.Group()};
Object.values(matrixCoreGroups).forEach(g=>equipmentMatrixGroup.add(g));
for(const r of [-.72,.72]){
  const bar=add(new THREE.BoxGeometry(.48,.05,.055),accentMat,matrixCoreGroups.standard,'matrixStandardX');
  bar.position.set(0,-.02,1.24);bar.rotation.z=r;
}
const standardGem=add(new THREE.OctahedronGeometry(.115,0),glassMat,matrixCoreGroups.standard,'matrixStandardGem');
standardGem.position.set(0,-.02,1.27);

for(const [y,s] of [[.08,1],[-.12,-1]]){
  const split=add(new THREE.BoxGeometry(.58,.05,.06),accentMat,matrixCoreGroups.ripple,'matrixRippleSplit');
  split.position.set(s*.08,y,1.22);split.rotation.z=s*.22;
}
const rippleGem=add(new THREE.TetrahedronGeometry(.13,0),glassMat,matrixCoreGroups.ripple,'matrixRippleGem');
rippleGem.position.set(0,-.02,1.28);rippleGem.rotation.z=.55;

const vaultSeal=add(new THREE.CylinderGeometry(.2,.2,.055,6),shellDarkMat,matrixCoreGroups.vault,'matrixVaultSeal');
vaultSeal.position.set(0,-.02,1.22);vaultSeal.rotation.x=Math.PI/2;vaultSeal.rotation.z=Math.PI/6;
const vaultGem=add(new THREE.OctahedronGeometry(.105,0),accentMat,matrixCoreGroups.vault,'matrixVaultGem');
vaultGem.position.set(0,-.02,1.28);

const core589Gem=add(new THREE.OctahedronGeometry(.145,0),glassMat,matrixCoreGroups[589],'matrix589Gem');
core589Gem.position.set(0,-.02,1.28);core589Gem.rotation.z=Math.PI/4;
const core589Nodes=[];
for(let i=0;i<9;i++){
  const node=add(new THREE.OctahedronGeometry(i===4?.035:.025,0),accentMat,matrixCoreGroups[589],'matrix589CoreNode'+i);
  const a=i/9*Math.PI*2;node.position.set(Math.cos(a)*.29,-.02+Math.sin(a)*.22,1.25);
  core589Nodes.push(node);
}

const headGearGroups={none:new THREE.Group(),crest:new THREE.Group(),halo:new THREE.Group(),ridge:new THREE.Group()};
Object.values(headGearGroups).forEach(g=>equipmentMatrixGroup.add(g));
for(const [x,s] of [[-.18,-1],[0,0],[.18,1]]){
  const fin=add(new THREE.ConeGeometry(.07,.42,4),shellMat,headGearGroups.crest,'matrixCrestFin');
  fin.position.set(x,1.7,.28);fin.rotation.z=s*.2;
}
const matrixHalo=add(new THREE.TorusGeometry(.43,.022,8,12),accentMat,headGearGroups.halo,'matrixHalo');
matrixHalo.position.set(0,1.72,.04);matrixHalo.rotation.x=1.08;
for(let i=0;i<4;i++){
  const ridge=add(new THREE.BoxGeometry(.1,.32,.07),shellDarkMat,headGearGroups.ridge,'matrixRidge'+i);
  ridge.position.set((i-1.5)*.12,1.58+i*.035,.24);ridge.rotation.z=(i-1.5)*.08;
}

const trailGroups={none:new THREE.Group(),pulse:new THREE.Group(),nodes:new THREE.Group(),resonance:new THREE.Group()};
Object.values(trailGroups).forEach(g=>equipmentMatrixGroup.add(g));
const pulseTrailNodes=[],nodeTrailNodes=[],resTrailNodes=[];
for(let i=0;i<6;i++){
  const node=add(new THREE.OctahedronGeometry(.045-i*.004,0),accentMat,trailGroups.pulse,'pulseTrail'+i);
  node.position.set(0,-.15-i*.09,-.65-i*.22);pulseTrailNodes.push(node);
}
for(let i=0;i<8;i++){
  const node=add(new THREE.BoxGeometry(.055,.055,.055),accentMat,trailGroups.nodes,'nodeTrail'+i);
  node.rotation.set(.4,.5,.4);node.position.set((i%2?1:-1)*(.11+i*.015),-.1-i*.07,-.65-i*.2);nodeTrailNodes.push(node);
}
for(let i=0;i<9;i++){
  const mat=i%2?accentMat:new THREE.MeshStandardMaterial({color:0xc7a253,emissive:0xc7a253,emissiveIntensity:2.8,metalness:.2,roughness:.25});
  const node=add(new THREE.OctahedronGeometry(i===4?.055:.035,0),mat,trailGroups.resonance,'resTrail'+i);
  node.position.set(Math.sin(i*.9)*.16,-.08-i*.065,-.68-i*.19);resTrailNodes.push(node);
}

function configureEquipment(detail={}){
  const eye=detail.eyeStyle||'cyan',core=detail.coreStyle||'standard',head=detail.headGear||'none',trail=detail.trailStyle||'none';
  const eyeColors={cyan:0x47e6ff,white:0xf5fbff,violet:0x8d78ff,amber:0xd5a64f};
  const ec=eyeColors[eye]??eyeColors.cyan;eyeSignalMat.color.setHex(ec);eyeSignalMat.emissive.setHex(ec);
  Object.entries(matrixCoreGroups).forEach(([k,g])=>g.visible=k===core);
  Object.entries(headGearGroups).forEach(([k,g])=>g.visible=k===head);
  Object.entries(trailGroups).forEach(([k,g])=>g.visible=k===trail);
}

// lighting
scene.add(new THREE.HemisphereLight(0xc9f6ff,0x061017,2.1));
const key=new THREE.SpotLight(0xffffff,44,20,.5,.5,1.3);key.position.set(-4,5,5);key.castShadow=XRPetQuality.shadows;scene.add(key);key.target=pet;
const fill=new THREE.PointLight(0x45e8ff,24,9,1.7);fill.position.set(2.9,1.3,3.6);scene.add(fill);
const rim=new THREE.PointLight(0x6b6dff,17,8,1.7);rim.position.set(-3.1,1.2,-2.1);scene.add(rim);
const under=new THREE.PointLight(0x35ddff,10,5,2);under.position.set(0,-1.2,1.8);scene.add(under);
const faceFill=new THREE.PointLight(0xffffff,7.5,7,2);faceFill.position.set(0,1.8,3.8);scene.add(faceFill);
const sideWarm=new THREE.PointLight(0x9ad7ff,5.5,7,2);sideWarm.position.set(3.4,-.2,-.8);scene.add(sideWarm);

// Cinematic studio lighting.
const studioKey=new THREE.DirectionalLight(0xffffff,3.6);
studioKey.position.set(-4.5,6.2,5.2);
studioKey.castShadow=XRPetQuality.shadows;
studioKey.shadow.mapSize.set(XRPetQuality.lowPower?512:1024,XRPetQuality.lowPower?512:1024);
studioKey.shadow.camera.near=.5;studioKey.shadow.camera.far=24;
scene.add(studioKey);

const studioRim=new THREE.DirectionalLight(0x6bdcff,2.1);
studioRim.position.set(4.8,3.8,-5.6);scene.add(studioRim);

const studioWarm=new THREE.DirectionalLight(0xd2aa6a,.85);
studioWarm.position.set(-3,-1.8,-2.6);scene.add(studioWarm);

const contactShadowMat=new THREE.ShadowMaterial({color:0x000000,opacity:XRPetQuality.lowPower?.18:.28});
const contactShadow=add(new THREE.CircleGeometry(1.62,48),contactShadowMat,scene,'studioContactShadow');
contactShadow.rotation.x=-Math.PI/2;
contactShadow.position.set(0,-1.72,.1);
contactShadow.receiveShadow=true;
contactShadow.visible=false;


let nextBlinkAt=performance.now()+1800+Math.random()*2400;
let blinkStart=0,secondBlinkQueued=false;
function naturalBlinkAmount(now){
  if(!blinkStart&&now>=nextBlinkAt){blinkStart=now;secondBlinkQueued=Math.random()<.14}
  if(blinkStart){
    const p=(now-blinkStart)/190;
    if(p<1)return Math.sin(p*Math.PI);
    blinkStart=0;
    if(secondBlinkQueued){secondBlinkQueued=false;nextBlinkAt=now+135}
    else nextBlinkAt=now+1700+Math.random()*4200;
  }
  return 0;
}

// state
const BUILTIN_MODELS={
  ripplet:{
    url:'/models/Ripplet.glb',
    credit:'Ripplet — XRPet canonical Ripple + XRP companion',
    rotationY:0,targetHeight:3.15,
    actions:{
      idle:['Idle'],greet:['Greet','Wave'],happy:['Happy','Emote_Excited'],
      celebrate:['Celebrate','Emote_Cheer','Emote_Victory'],alert:['Alert'],
      sleep:['Sleep'],wake:['Wake'],focus:['Focus'],scan:['Scan'],orbit:['Emote_Dance','LookAround'],
      walk:['Walk'],run:['Run'],wave:['Wave'],dance:['Emote_Dance'],
      cheer:['Emote_Cheer'],laugh:['Emote_Laugh'],shrug:['Emote_Shrug'],
      confused:['Emote_Confused'],sad:['Emote_Sad'],excited:['Emote_Excited'],
      point:['Emote_Point'],salute:['Emote_Salute'],thinking:['Emote_Thinking'],
      victory:['Emote_Victory'],surprised:['Emote_Surprised']
    }
  },
  nexus:{
    url:'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/RobotExpressive/RobotExpressive.glb',
    credit:'RobotExpressive — Tomás Laulhé / Don McCurdy, CC0 1.0',
    rotationY:Math.PI,targetHeight:3.25,
    actions:{idle:['idle'],greet:['wave','yes'],happy:['thumbsup','yes'],celebrate:['dance'],alert:['running','walking','no'],sleep:['sitting'],wake:['standing','idle']}
  },
  fox:{
    url:'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Fox/glTF-Binary/Fox.glb',
    credit:'Fox — PixelMannen / tomkranis / AsoboStudio / scurest, CC0 + CC BY 4.0',
    rotationY:0,targetSpan:3.0,
    actions:{idle:['survey'],greet:['survey'],happy:['survey'],celebrate:['run'],alert:['run','walk'],sleep:['survey'],wake:['survey']}
  },
  pup:{
    url:'https://raw.githubusercontent.com/Lost-secuirty/lostsouls-game/b92e39c3e6e438339fd2954a329205181f1d4752/public/models/dog.glb',
    credit:'Shiba Inu — Quaternius via Poly Pizza, CC0 1.0',
    rotationY:0,targetSpan:2.8,
    actions:{idle:['idle','standing'],greet:['idle','walk'],happy:['walk','idle'],celebrate:['run','walk'],alert:['run','walk'],sleep:['idle'],wake:['idle','walk']}
  },
  cat:{
    url:'https://raw.githubusercontent.com/Lost-secuirty/lostsouls-game/b92e39c3e6e438339fd2954a329205181f1d4752/public/models/cat.glb',
    credit:'Cat — Quaternius via Poly Pizza, CC0 1.0',
    rotationY:0,targetSpan:2.7,
    actions:{idle:['idle','standing'],greet:['idle','walk'],happy:['walk','idle'],celebrate:['run','walk'],alert:['run','walk'],sleep:['idle'],wake:['idle','walk']}
  },
  bird:{
    url:'https://raw.githubusercontent.com/bob6664569/open-water/285b6ce32057c70191a7fe16c31d979fa383ac64/site/assets/animals/scarlet_macaw.glb',
    credit:'Scarlet Macaw — Mateus Schwaab, CC BY 4.0',
    rotationY:0,targetSpan:2.7,
    actions:{idle:['fly'],greet:['fly'],happy:['fly'],celebrate:['fly'],alert:['fly'],sleep:['fly'],wake:['fly']}
  },
  turtle:{
    url:'https://raw.githubusercontent.com/amarnotcool/ABYSS/468cd31632ebf7f7a466713a1dc483d02a965ca2/public/assets/models/turtle.glb',
    credit:'Turtle — Poly by Google via Poly Pizza, CC BY',
    rotationY:Math.PI/2,targetSpan:2.9,
    actions:{idle:[],greet:[],happy:[],celebrate:[],alert:[],sleep:[],wake:[]}
  }
};

let currentKind='ripplet', currentGender='neutral', currentCosmetic='classic';
let targetRotY=0,targetRotX=0,dragging=false,lastX=0,lastY=0,pointerX=0,pointerY=0,globalClientX=innerWidth*.5,globalClientY=innerHeight*.5,gazeX=0,gazeY=0,boost=0,lastInteract=0;
let action='idle',actionUntil=0,actionStarted=0,externalModel=null,externalMixer=null,externalKind=null,externalActions={},externalActiveAction=null,externalBlinkAction=null,externalNextBlinkAt=0,externalNativeRig=false,externalLoadToken=0,externalLoadingKind=null,externalLoadingPromise=null,externalParts={};
const motor={
  mode:'idle', speed:0, targetSpeed:0, phase:0, verticalVelocity:0,
  grounded:true, grip:0, reachSide:1, turn:0, carry:false
};
function motorDuration(name){
  return ({run:4200,jump:1500,climb:5200,reach:2200,grab:2800,carry:5200,crouch:2600,turn:1800}[name]||2200);
}
function motorProgress(now=performance.now()){
  if(actionUntil<=actionStarted)return 0;
  return Math.max(0,Math.min(1,(now-actionStarted)/(actionUntil-actionStarted)));
}
const baseEarTransforms=ears.map(e=>({scale:e.scale.clone(),rot:e.rotation.clone()}));

function resetBaseShape(){
  head.scale.set(1,.82,.9);face.scale.set(.96,.66,.73);torso.scale.set(.9,.9,.78);
  muzzle.scale.set(1.08,.52,.65);muzzle.position.set(0,.7,1.35);nose.position.set(0,.71,1.58);
  ears.forEach((e,i)=>{e.visible=true;e.scale.copy(baseEarTransforms[i].scale);e.rotation.copy(baseEarTransforms[i].rot)});
  shoulders.forEach(s=>s.visible=true);
  legs.forEach(l=>l.scale.set(1,1,1));
}
function applySurfaceProfile(kind){
  const profiles={
    ripplet:{metalness:.58,roughness:.24,clearcoat:1,darkMetal:.7,darkRough:.2},
    nexus:{metalness:.72,roughness:.22,clearcoat:1,darkMetal:.82,darkRough:.18},
    fox:{metalness:.28,roughness:.5,clearcoat:.34,darkMetal:.24,darkRough:.55},
    pup:{metalness:.24,roughness:.54,clearcoat:.3,darkMetal:.22,darkRough:.58},
    cat:{metalness:.3,roughness:.46,clearcoat:.38,darkMetal:.28,darkRough:.5},
    bird:{metalness:.38,roughness:.36,clearcoat:.48,darkMetal:.32,darkRough:.44},
    turtle:{metalness:.34,roughness:.43,clearcoat:.42,darkMetal:.3,darkRough:.48}
  };
  const p=profiles[kind]||profiles.nexus;
  const detail=(kind==='ripplet'||kind==='nexus')?detailTextures.metal:kind==='bird'?detailTextures.feather:kind==='turtle'?detailTextures.shell:detailTextures.fur;
  shellMat.metalness=p.metalness;shellMat.roughness=p.roughness;shellMat.clearcoat=p.clearcoat;
  shellDarkMat.metalness=p.darkMetal;shellDarkMat.roughness=p.darkRough;
  shellMat.bumpMap=detail;shellDarkMat.bumpMap=detail;softMat.bumpMap=detail;
  shellMat.bumpScale=(kind==='ripplet'||kind==='nexus')?.018:kind==='turtle'?.026:.032;
  shellDarkMat.bumpScale=(kind==='ripplet'||kind==='nexus')?.014:.025;softMat.bumpScale=.022;
  shellMat.roughnessMap=detail;shellDarkMat.roughnessMap=detail;
  shellMat.needsUpdate=true;shellDarkMat.needsUpdate=true;softMat.needsUpdate=true;
}

function configureSpecies(){
  currentKind='ripplet';
  applySurfaceProfile('ripplet');
  Object.values(species).forEach(g=>g.visible=false);
  species.ripplet.visible=true;
  resetBaseShape();

  // Ripplet: oversized smooth head, tiny floating body, no animal muzzle/legs.
  head.scale.set(1.03,.94,.98);
  face.scale.set(1,.76,.84);
  torso.scale.set(.78,.88,.72);
  pelvis.scale.set(.72,.48,.66);
  muzzle.visible=false;
  nose.visible=false;
  ears.forEach(e=>e.visible=false);
  legs.forEach((e,i)=>{e.visible=true;e.scale.set(.58,.54,.58);e.position.set(i===0?-.28:.28,-1.08,.02)});
  feet.forEach((o,i)=>{o.visible=true;o.scale.set(.72,.28,.9);o.position.set(i===0?-.29:.29,-1.42,.2)});
  shoulders.forEach((o,i)=>{o.scale.set(.68,.82,.62);o.position.set(i===0?-.7:.7,-.2,.08)});
  upperArms.forEach((o,i)=>{o.visible=true;o.position.x=i===0?-.77:.77});
  forearms.forEach((o,i)=>{o.visible=true;o.position.x=i===0?-.88:.88});
  hands.forEach((o,i)=>{o.visible=true;o.position.x=i===0?-.94:.94});
  calves.forEach(o=>o.visible=true);toeCaps.forEach(o=>o.visible=true);
}
function configureGender(){
  currentGender='neutral';
  boyGroup.visible=false;
  girlGroup.visible=false;
  externalGender.boy.visible=false;
  externalGender.girl.visible=false;
}
function configureCosmetic(cosmetic){
  currentCosmetic=palette[cosmetic]?cosmetic:'classic';
  Object.entries(cosmeticGroups).forEach(([k,g])=>g.visible=k===currentCosmetic);
  Object.entries(externalCosmetics).forEach(([k,g])=>g.visible=k===currentCosmetic);
  const p=palette[currentCosmetic];
  shellMat.color.setHex(p.shell);shellDarkMat.color.setHex(p.dark);accentMat.color.setHex(p.accent);
  accentMat.emissive.setHex(p.accent);glassMat.color.setHex(p.glass);
  coreRing.scale.setScalar(currentCosmetic==='solar'?1.35:currentCosmetic==='midnight'?.84:currentCosmetic==='resonance'?1.18:1);
  coreBall.scale.setScalar(currentCosmetic==='solar'?1.45:currentCosmetic==='resonance'?1.22:1);
  orbGroup.visible=currentCosmetic!=='midnight';
  externalLedgerFrame.visible=true;
  if(currentKind==='ripplet'){holo.visible=false;contactShadow.visible=false;rippletHover.visible=false;}
}
function applyRoom(room){
  const rooms={
    nexus:[0x43e8ff,0x696cff,1.18],
    ocean:[0x55e9ff,0x1289aa,1.12],
    vault:[0xd8b76b,0x6c5220,1.02],
    aurora:[0x79f1ff,0xaa8cff,1.23],
    legend:[0xf0ce73,0x7b5cff,1.27],
    genesis:[0x8fdfff,0x6f8fa8,1.16],
    city:[0x45e9ff,0x176f93,1.2],
    quantum:[0x9f8cff,0x4ce5ff,1.25],
    desert:[0xefc27a,0x6bbfe8,1.1],
    arctic:[0xc7f7ff,0x6eb8d0,1.2]
  };
  const r=rooms[room]||rooms.nexus;
  fill.color.setHex(r[0]);rim.color.setHex(r[1]);sideWarm.color.setHex(r[0]);
  studioRim.color.setHex(r[0]);
  studioWarm.color.setHex(room==='vault'||room==='legend'||room==='desert'?0xd6aa62:0xaec8d1);
  studioKey.intensity=room==='vault'?3.1:room==='legend'?4.0:3.6;
  faceFill.intensity=room==='vault'?6.2:room==='legend'?8.2:7.5;
  renderer.toneMappingExposure=r[2];
}
function performAction(name='greet',options={}){
  const allowed=new Set(['greet','celebrate','alert','sleep','wake','happy','focus','scan','orbit','walk','run','jump','climb','reach','grab','carry','crouch','turn','sip','gulp','splash','bite','taste','charge','curl','dream','snore','wave','highfive','dance','cheer','laugh','shrug','confused','sad','excited','point','salute','thinking','victory','surprised']);
  action=allowed.has(name)?name:'greet';
  actionStarted=performance.now();
  actionUntil=actionStarted+(['sleep','curl','dream','snore'].includes(action)?9000:action==='walk'?5000:action==='orbit'||action==='dance'?5200:action==='scan'||action==='gulp'||action==='taste'?3200:action==='focus'||action==='charge'?4200:action==='celebrate'||action==='splash'||action==='highfive'?2800:action==='alert'?2200:motorDuration(action));
  motor.mode=action;
  motor.reachSide=options.side==='left'?-1:1;
  motor.turn=Number(options.turn)||0;
  motor.carry=action==='carry';
  motor.grip=(action==='grab'||action==='carry')?1:0;
  lastInteract=performance.now();
  if(action==='wake')actionUntil=performance.now()+700;
  if(['happy','greet','celebrate','splash','bite','charge','wave','highfive','dance','sip','gulp','taste','cheer','laugh','excited','victory','surprised'].includes(action))boost=1;
  playExternalAction(action);
}
function currentAction(){
  if(action!=='idle'&&performance.now()>actionUntil){action='idle'}
  return action;
}


function captureExternalRippletParts(){
  externalParts={};
  if(!externalModel)return;
  externalModel.traverse(o=>{
    if(!o.name)return;
    externalParts[o.name]=o;
    if(!o.userData.xrpetBase){
      o.userData.xrpetBase={
        position:o.position.clone(),
        rotation:o.rotation.clone(),
        scale:o.scale.clone()
      };
    }
  });
}
function poseExternalPart(name,opts={},speed=.14){
  const o=externalParts[name];
  const b=o?.userData?.xrpetBase;
  if(!o||!b)return;
  const rp=opts.rot||[0,0,0], pp=opts.pos||[0,0,0], sp=opts.scale||[1,1,1];
  const tx=b.rotation.x+rp[0],ty=b.rotation.y+rp[1],tz=b.rotation.z+rp[2];
  o.rotation.x+=(tx-o.rotation.x)*speed;
  o.rotation.y+=(ty-o.rotation.y)*speed;
  o.rotation.z+=(tz-o.rotation.z)*speed;
  o.position.x+=(b.position.x+pp[0]-o.position.x)*speed;
  o.position.y+=(b.position.y+pp[1]-o.position.y)*speed;
  o.position.z+=(b.position.z+pp[2]-o.position.z)*speed;
  o.scale.x+=(b.scale.x*sp[0]-o.scale.x)*speed;
  o.scale.y+=(b.scale.y*sp[1]-o.scale.y)*speed;
  o.scale.z+=(b.scale.z*sp[2]-o.scale.z)*speed;
}
function animateExternalRipplet(t,state){
  if(externalKind!=='ripplet'||!externalModel||externalNativeRig)return;
  const s=Math.sin(t*2.2), slow=Math.sin(t*.72), walk=Math.sin(t*6.2);
  const blinkPhase=t%4.7;
  const blink=blinkPhase>.05&&blinkPhase<.14?.10:1;

  // baseline living motion
  poseExternalPart('Ripplet_Torso',{scale:[1+Math.sin(t*1.7)*.012,1+Math.sin(t*1.7)*.018,1+Math.sin(t*1.7)*.012]});
  poseExternalPart('Ripplet_TorsoInset',{scale:[1+Math.sin(t*1.7)*.01,1+Math.sin(t*1.7)*.014,1+Math.sin(t*1.7)*.01]});
  poseExternalPart('Ripplet_Head',{rot:[slow*.018,slow*.07,slow*.012],pos:[0,Math.sin(t*1.15)*.018,0]});
  poseExternalPart('Ripplet_FacePlate',{rot:[slow*.012,slow*.055,0]});
  poseExternalPart('Ripplet_Forehead',{rot:[slow*.01,slow*.05,0]});
  poseExternalPart('EnergyEye_L',{scale:[1,blink,1]});
  poseExternalPart('EnergyEye_R',{scale:[1,blink,1]});
  poseExternalPart('Ripple_HeadFin_L',{rot:[0,0,-slow*.035]});
  poseExternalPart('Ripple_HeadFin_R',{rot:[0,0,slow*.035]});
  poseExternalPart('XRP_CoreRing',{rot:[0,t*.20,0]},.10);
  poseExternalPart('XRP_CoreCrystal',{scale:[1+.06*Math.sin(t*3.1),1+.06*Math.sin(t*3.1),1+.06*Math.sin(t*3.1)]},.18);

  // neutral limbs
  for(const n of ['UpperArm_L','Forearm_L','Hand_L','UpperArm_R','Forearm_R','Hand_R','Thigh_L','Shin_L','Foot_L','Thigh_R','Shin_R','Foot_R']) poseExternalPart(n,{},.16);

  if(state==='greet'||state==='wave'){
    poseExternalPart('UpperArm_R',{rot:[0,0,-.78],pos:[0,.06,0]},.22);
    poseExternalPart('Forearm_R',{rot:[0,0,-.48+Math.sin(t*8)*.28],pos:[0,.10,0]},.25);
    poseExternalPart('Hand_R',{rot:[0,Math.sin(t*9)*.22,-.28],pos:[0,.12,0]},.28);
    poseExternalPart('Ripplet_Head',{rot:[-.05,.12,Math.sin(t*3)*.035]},.20);
  }else if(state==='happy'){
    poseExternalPart('UpperArm_L',{rot:[0,0,.60]},.22);
    poseExternalPart('UpperArm_R',{rot:[0,0,-.60]},.22);
    poseExternalPart('Forearm_L',{rot:[0,0,.30]},.24);
    poseExternalPart('Forearm_R',{rot:[0,0,-.30]},.24);
    poseExternalPart('Thigh_L',{rot:[walk*.08,0,0]},.20);
    poseExternalPart('Thigh_R',{rot:[-walk*.08,0,0]},.20);
    poseExternalPart('Ripplet_Head',{rot:[-.08,slow*.12,s*.025],pos:[0,.04+Math.abs(s)*.025,0]},.22);
  }else if(state==='celebrate'){
    poseExternalPart('UpperArm_L',{rot:[0,0,1.02+Math.sin(t*7)*.10],pos:[0,.10,0]},.28);
    poseExternalPart('UpperArm_R',{rot:[0,0,-1.02-Math.sin(t*7)*.10],pos:[0,.10,0]},.28);
    poseExternalPart('Forearm_L',{rot:[0,0,.62+Math.sin(t*9)*.16]},.30);
    poseExternalPart('Forearm_R',{rot:[0,0,-.62-Math.sin(t*9)*.16]},.30);
    poseExternalPart('Thigh_L',{rot:[walk*.20,0,.08]},.28);
    poseExternalPart('Thigh_R',{rot:[-walk*.20,0,-.08]},.28);
    poseExternalPart('Shin_L',{rot:[-walk*.16,0,0]},.28);
    poseExternalPart('Shin_R',{rot:[walk*.16,0,0]},.28);
    poseExternalPart('Ripplet_Head',{rot:[-.12,Math.sin(t*5)*.14,Math.sin(t*8)*.045],pos:[0,.08+Math.abs(Math.sin(t*5))*.05,0]},.30);
  }else if(state==='alert'){
    poseExternalPart('UpperArm_L',{rot:[-.16,0,.18]},.28);
    poseExternalPart('UpperArm_R',{rot:[-.16,0,-.18]},.28);
    poseExternalPart('Ripplet_Head',{rot:[-.12,Math.sin(t*10)*.10,0]},.30);
    poseExternalPart('EnergyEye_L',{scale:[1,.72,1.18]},.35);
    poseExternalPart('EnergyEye_R',{scale:[1,.72,1.18]},.35);
  }else if(state==='scan'){
    const scan=Math.sin(t*2.8);
    poseExternalPart('Ripplet_Head',{rot:[0,scan*.34,0]},.22);
    poseExternalPart('Ripplet_FacePlate',{rot:[0,scan*.28,0]},.22);
    poseExternalPart('EnergyEye_L',{scale:[1,.58,1.12]},.28);
    poseExternalPart('EnergyEye_R',{scale:[1,.58,1.12]},.28);
    poseExternalPart('XRP_CoreRing',{rot:[0,t*2.3,0]},.30);
  }else if(state==='focus'){
    poseExternalPart('Ripplet_Head',{rot:[-.11,0,0]},.22);
    poseExternalPart('EnergyEye_L',{scale:[1,.48,1.12]},.30);
    poseExternalPart('EnergyEye_R',{scale:[1,.48,1.12]},.30);
    poseExternalPart('UpperArm_L',{rot:[-.08,0,.08]},.18);
    poseExternalPart('UpperArm_R',{rot:[-.08,0,-.08]},.18);
  }else if(state==='sleep'||state==='curl'||state==='dream'||state==='snore'){
    poseExternalPart('Ripplet_Head',{rot:[.24,0,.10],pos:[0,-.05,0]},.16);
    poseExternalPart('UpperArm_L',{rot:[.12,0,.18]},.14);
    poseExternalPart('UpperArm_R',{rot:[.12,0,-.18]},.14);
    poseExternalPart('Forearm_L',{rot:[.15,0,.12]},.14);
    poseExternalPart('Forearm_R',{rot:[.15,0,-.12]},.14);
    poseExternalPart('EnergyEye_L',{scale:[1,.08,1]},.28);
    poseExternalPart('EnergyEye_R',{scale:[1,.08,1]},.28);
  }else if(state==='run'){
    const run=Math.sin(t*10.5);
    poseExternalPart('UpperArm_L',{rot:[run*.62,0,0]},.34);
    poseExternalPart('UpperArm_R',{rot:[-run*.62,0,0]},.34);
    poseExternalPart('Thigh_L',{rot:[-run*.62,0,0]},.36);
    poseExternalPart('Thigh_R',{rot:[run*.62,0,0]},.36);
    poseExternalPart('Shin_L',{rot:[Math.max(0,run)*.52,0,0]},.34);
    poseExternalPart('Shin_R',{rot:[Math.max(0,-run)*.52,0,0]},.34);
    poseExternalPart('Ripplet_Torso',{rot:[-.12,0,-run*.025],pos:[0,Math.abs(run)*.04,0]},.28);
  }else if(state==='jump'){
    const p=motorProgress(),air=Math.sin(Math.PI*p);
    poseExternalPart('Thigh_L',{rot:[-.30+air*.38,0,0]},.34);
    poseExternalPart('Thigh_R',{rot:[-.30+air*.38,0,0]},.34);
    poseExternalPart('Shin_L',{rot:[.34+air*.25,0,0]},.34);
    poseExternalPart('Shin_R',{rot:[.34+air*.25,0,0]},.34);
    poseExternalPart('UpperArm_L',{rot:[-.55+air*.8,0,.18]},.32);
    poseExternalPart('UpperArm_R',{rot:[-.55+air*.8,0,-.18]},.32);
  }else if(state==='climb'){
    const climb=Math.sin(t*7.8);
    poseExternalPart('UpperArm_L',{rot:[-.9+climb*.35,0,.35]},.34);
    poseExternalPart('UpperArm_R',{rot:[-.9-climb*.35,0,-.35]},.34);
    poseExternalPart('Thigh_L',{rot:[.38-climb*.26,0,.12]},.32);
    poseExternalPart('Thigh_R',{rot:[.38+climb*.26,0,-.12]},.32);
    poseExternalPart('Ripplet_Torso',{rot:[-.16,0,0]},.28);
  }else if(state==='reach'||state==='grab'||state==='carry'){
    const side=motor.reachSide>0?'R':'L',other=side==='R'?'L':'R';
    poseExternalPart('UpperArm_'+side,{rot:[-.72,0,side==='R'?-.36:.36]},.34);
    poseExternalPart('Forearm_'+side,{rot:[-.42,0,side==='R'?-.18:.18],pos:[0,.08,.08]},.34);
    poseExternalPart('Hand_'+side,{rot:[-.18,0,0],pos:[0,.12,.14]},.36);
    if(state==='carry'){
      poseExternalPart('UpperArm_'+other,{rot:[-.38,0,side==='R'?.18:-.18]},.28);
      poseExternalPart('Forearm_'+other,{rot:[-.45,0,side==='R'?.16:-.16]},.28);
    }
  }else if(state==='crouch'){
    poseExternalPart('Thigh_L',{rot:[.52,0,.08]},.34);poseExternalPart('Thigh_R',{rot:[.52,0,-.08]},.34);
    poseExternalPart('Shin_L',{rot:[-.62,0,0]},.34);poseExternalPart('Shin_R',{rot:[-.62,0,0]},.34);
    poseExternalPart('Ripplet_Torso',{rot:[.08,0,0],pos:[0,-.12,0]},.32);
  }else if(state==='turn'){
    poseExternalPart('Ripplet_Torso',{rot:[0,motor.turn||Math.sin(t*2)*.4,0]},.28);
    poseExternalPart('Ripplet_Head',{rot:[0,(motor.turn||.35)*1.3,0]},.30);
  }else if(state==='walk'){
    poseExternalPart('UpperArm_L',{rot:[walk*.34,0,0]},.30);
    poseExternalPart('UpperArm_R',{rot:[-walk*.34,0,0]},.30);
    poseExternalPart('Forearm_L',{rot:[walk*.18,0,0]},.28);
    poseExternalPart('Forearm_R',{rot:[-walk*.18,0,0]},.28);
    poseExternalPart('Thigh_L',{rot:[-walk*.30,0,0]},.30);
    poseExternalPart('Thigh_R',{rot:[walk*.30,0,0]},.30);
    poseExternalPart('Shin_L',{rot:[Math.max(0,walk)*.28,0,0]},.30);
    poseExternalPart('Shin_R',{rot:[Math.max(0,-walk)*.28,0,0]},.30);
    poseExternalPart('Ripplet_Head',{rot:[-.025,0,-walk*.015],pos:[0,Math.abs(walk)*.03,0]},.24);
  }
}
async function loadExternalModel(url,options={}){
  if(!url)throw new Error('A GLB/GLTF URL is required.');
  const mod=await import('https://esm.sh/three@0.169.0/examples/jsm/loaders/GLTFLoader.js?deps=three@0.169.0');
  const loader=new mod.GLTFLoader();
  const gltf=await new Promise((resolve,reject)=>loader.load(url,resolve,undefined,reject));
  if(options.token!=null&&options.token!==externalLoadToken)return {stale:true,animations:[],credit:options.credit||''};

  if(externalModel){
    root.remove(externalModel);
    externalModel.traverse(o=>{if(o.geometry)o.geometry.dispose?.()});
  }
  externalActions={};externalActiveAction=null;externalBlinkAction=null;externalNativeRig=false;
  externalModel=gltf.scene;
  externalKind=options.kind||null;
  externalModel.userData.xrpetActionMap=options.actions||{};

  externalModel.traverse(o=>{
    const n=(o.name||'').toLowerCase();
    if(externalKind==='ripplet' && /(studio|floor|ground|background|backdrop|plane|camera|light)/.test(n)){
      o.visible=false;
      return;
    }
    if(o.isMesh){
      o.castShadow=true;o.receiveShadow=true;
      if(o.material){
        const mats=Array.isArray(o.material)?o.material:[o.material];
        mats.forEach(mat=>{
          if('envMapIntensity'in mat)mat.envMapIntensity=XRPetQuality.lowPower?.82:1.35;
          if('roughness'in mat)mat.roughness=Math.max(.18,Math.min(.68,mat.roughness));
          if('metalness'in mat)mat.metalness=Math.max(0,Math.min(.72,mat.metalness));
          if('clearcoat'in mat&&externalKind==='nexus')mat.clearcoat=Math.max(mat.clearcoat||0,.45);
          mat.needsUpdate=true;
        });
      }
    }
  });

  const box=new THREE.Box3().setFromObject(externalModel);
  const size=new THREE.Vector3(),center=new THREE.Vector3();box.getSize(size);box.getCenter(center);
  const fitValue=options.targetSpan?Math.max(.001,size.x,size.y,size.z):Math.max(.001,size.y);
  const targetValue=options.targetSpan||options.targetHeight||3.1;
  const scale=targetValue/fitValue;
  externalModel.scale.setScalar(scale);
  externalModel.position.set(-center.x*scale,.08-center.y*scale,-center.z*scale);
  externalModel.userData.xrpetBaseY=externalModel.position.y;
  externalModel.rotation.y=options.rotationY||0;
  externalModel.userData.xrpetBaseRotY=externalModel.rotation.y;
  externalModel.userData.xrpetBaseRotX=externalModel.rotation.x;
  root.add(externalModel);
  captureExternalRippletParts();

  pet.visible=false;
  const bareRipplet=externalKind==='ripplet';
  holo.visible=!bareRipplet;
  externalPresentation.visible=!bareRipplet;
  contactShadow.visible=!bareRipplet;
  externalMixer=gltf.animations?.length?new THREE.AnimationMixer(externalModel):null;
  if(externalMixer){
    for(const clip of gltf.animations)externalActions[clip.name]=externalMixer.clipAction(clip);
    const names=(gltf.animations||[]).map(a=>a.name);
    externalNativeRig=externalKind==='ripplet'&&['Idle','Blink','Walk','Run','Wave'].every(n=>names.includes(n));
    externalBlinkAction=externalNativeRig?findExternalAction(['Blink']):null;
    externalNextBlinkAt=performance.now()+1800+Math.random()*2600;
    const preferred=(options.actions?.idle?.length?options.actions.idle:['idle','survey','standing','walk','fly']);
    const first=findExternalAction(preferred)||Object.values(externalActions)[0];
    if(first){first.reset().fadeIn(.15).play();externalActiveAction=first}
  }
  return {animations:(gltf.animations||[]).map(a=>a.name),credit:options.credit||''};
}

function findExternalAction(patterns=[]){
  const entries=Object.entries(externalActions);
  for(const p of patterns){
    const hit=entries.find(([name])=>name.toLowerCase().includes(p.toLowerCase()));
    if(hit)return hit[1];
  }
  return null;
}
function playExternalAction(name){
  if(!externalMixer)return;
  const fallback={
    idle:['Idle','idle','survey','standing','fly'],
    greet:['Greet','Wave','wave','yes','idle'], happy:['Happy','Emote_Excited','thumbsup','yes','dance'],
    celebrate:['Celebrate','Emote_Cheer','Emote_Victory','dance','run'], alert:['Alert','run','walk','no'],
    sleep:['Sleep','sitting','idle'], wake:['Wake','standing','idle'], focus:['Focus','idle','survey'],
    scan:['Scan','survey','walk'], orbit:['Emote_Dance','LookAround','dance','walk'],
    walk:['Walk','walk'], run:['Run','run','walk'], wave:['Wave','wave'],
    jump:['Emote_Excited','Celebrate','jump','run'], climb:['Run','climb','walk'],
    reach:['Emote_Point','reach','wave'], grab:['Emote_Point','grab','reach'],
    carry:['Walk','carry','walk'], crouch:['Emote_Sad','crouch','sitting'], turn:['LookAround','turn','walk'],
    highfive:['Emote_Victory','Wave'], dance:['Emote_Dance','dance'],
    cheer:['Emote_Cheer'], laugh:['Emote_Laugh'], shrug:['Emote_Shrug'], confused:['Emote_Confused'],
    sad:['Emote_Sad'], excited:['Emote_Excited'], point:['Emote_Point'], salute:['Emote_Salute'],
    thinking:['Emote_Thinking'], victory:['Emote_Victory'], surprised:['Emote_Surprised']
  };
  const custom=externalModel?.userData?.xrpetActionMap||{};
  const patterns=(custom[name]&&custom[name].length?custom[name]:fallback[name])||fallback.idle;
  const next=findExternalAction(patterns);
  if(!next||next===externalActiveAction)return;
  next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1);
  const looping=new Set(['idle','walk','run','dance','orbit']);
  if(looping.has(name)){next.setLoop(THREE.LoopRepeat,Infinity);next.clampWhenFinished=false}
  else{next.setLoop(THREE.LoopOnce,1);next.clampWhenFinished=true}
  next.fadeIn(.18).play();
  if(externalActiveAction&&externalActiveAction!==externalBlinkAction)externalActiveAction.fadeOut(.18);
  externalActiveAction=next;
}
async function ensureBuiltInModel(kind){
  const cfg=BUILTIN_MODELS[kind];
  if(!cfg){useProceduralModel();return false}
  if(externalModel&&externalKind===kind)return true;
  if(externalLoadingKind===kind&&externalLoadingPromise)return externalLoadingPromise;

  const token=++externalLoadToken;
  externalLoadingKind=kind;
  externalLoadingPromise=(async()=>{
    try{
      const result=await loadExternalModel(cfg.url,{...cfg,kind,token});
      if(result?.stale||token!==externalLoadToken)return false;
      window.dispatchEvent(new CustomEvent('xrpet:model-ready',{detail:{kind,mode:(result.animations?.length?'rigged':'real'),animations:result.animations,credit:cfg.credit}}));
      playExternalAction('idle');
      return true;
    }catch(err){
      console.warn('Rigged companion failed; using procedural fallback',kind,err);
      if(token===externalLoadToken){
        useProceduralModel();
        window.dispatchEvent(new CustomEvent('xrpet:model-fallback',{detail:{kind,error:String(err?.message||err)}}));
      }
      return false;
    }finally{
      if(token===externalLoadToken){externalLoadingKind=null;externalLoadingPromise=null}
    }
  })();
  return externalLoadingPromise;
}
function useProceduralModel(kind=currentKind){
  externalLoadToken++;
  if(externalModel){root.remove(externalModel);externalModel=null}
  externalMixer=null;externalKind=null;externalActions={};externalActiveAction=null;externalBlinkAction=null;externalNativeRig=false;externalLoadingKind=null;externalLoadingPromise=null;
  pet.visible=true;externalPresentation.visible=false;
  window.dispatchEvent(new CustomEvent('xrpet:model-ready',{detail:{kind,mode:'ripplet-3.0-runtime',animations:[],credit:'XRPet Ripplet 3.0 high-detail runtime model'}}));
}

let modelLoadTimer=0;
function setAppearance(detail={}){
  configureSpecies('ripplet');
  configureGender('neutral');
  configureCosmetic(detail.cosmetic||currentCosmetic);
  configureEquipment(detail);
  applyRoom(detail.room||'nexus');
  clearTimeout(modelLoadTimer);
  ensureBuiltInModel('ripplet');
}
window.addEventListener('xrpet:appearance',e=>setAppearance(e.detail||{}));
setAppearance({room:'nexus',cosmetic:'classic'});

function setCameraPreset(name='front'){
  const presets={
    front:[0,.18,7.7],
    threeQuarter:[3.8,.45,6.7],
    profile:[6.8,.3,.15]
  };
  const p=presets[name]||presets.front;
  cameraGoal.set(p[0],p[1],p[2]);
  targetGoal.set(0,.18,0);
  cameraTween=1;
  if(orbitControls){orbitControls.target.copy(targetGoal)}
  lastInteract=performance.now();
}

window.addEventListener('pointermove',e=>{
  globalClientX=e.clientX;globalClientY=e.clientY;lastInteract=performance.now();
},{passive:true});

renderer.domElement.addEventListener('pointerdown',e=>{
  if(orbitControls){lastInteract=performance.now();return}
  dragging=true;lastX=e.clientX;lastY=e.clientY;lastInteract=performance.now();renderer.domElement.setPointerCapture?.(e.pointerId);
});
renderer.domElement.addEventListener('pointermove',e=>{
  const r=renderer.domElement.getBoundingClientRect();
  pointerX=((e.clientX-r.left)/Math.max(1,r.width)-.5)*2;pointerY=((e.clientY-r.top)/Math.max(1,r.height)-.5)*2;
  if(dragging&&!orbitControls){
    targetRotY+=(e.clientX-lastX)*.012;targetRotX+=(e.clientY-lastY)*.006;
    targetRotX=Math.max(-.24,Math.min(.24,targetRotX));lastX=e.clientX;lastY=e.clientY;lastInteract=performance.now();
  }
});
renderer.domElement.addEventListener('pointerup',e=>{dragging=false;renderer.domElement.releasePointerCapture?.(e.pointerId)});
renderer.domElement.addEventListener('pointercancel',()=>dragging=false);
renderer.domElement.addEventListener('dblclick',()=>{targetRotX=0;targetRotY=0;setCameraPreset('front')});
renderer.domElement.addEventListener('click',()=>{
  const reactions=['greet','happy','celebrate','scan'];
  const next=reactions[Math.floor(Math.random()*reactions.length)];
  performAction(next);
  window.dispatchEvent(new CustomEvent('xrpet:petInteract',{detail:{reaction:next}}));
});

window.XRPet3D={
  setAppearance,
  react(type='happy'){performAction(type)},
  perform:performAction,
  motor(action,options={}){performAction(action,options)},
  locomotion(mode='walk'){performAction(mode)},
  celebrate(){performAction('celebrate')},
  alert(){performAction('alert')},
  sleep(){performAction('sleep')},
  wake(){performAction('wake')},
  loadModel:loadExternalModel,
  useProcedural:useProceduralModel,
  cameraPreset:setCameraPreset,
  reset(){targetRotX=0;targetRotY=0;setCameraPreset('front')},
  emote(name='cheer'){performAction(name)},
  animationNames(){return Object.keys(externalActions)},
  nativeRig(){return externalNativeRig},
  visible(){return renderer.domElement.isConnected}
};

renderer.domElement.addEventListener('webglcontextlost',e=>{
  e.preventDefault();
  window.dispatchEvent(new CustomEvent('xrpet:model-fallback',{detail:{kind:currentKind,error:'WebGL context lost'}}));
  host.classList.add('webgl-lost');
});
renderer.domElement.addEventListener('webglcontextrestored',()=>{
  host.classList.remove('webgl-lost');
  setAppearance({companionKind:currentKind,companionGender:currentGender,cosmetic:currentCosmetic});
});

function resize(){
  const r=host.getBoundingClientRect();const w=Math.max(1,r.width),h=Math.max(1,r.height);
  renderer.setSize(w,h,false);
  if(composer)composer.setSize(w,h);
  if(ssaoPass)ssaoPass.setSize?.(w,h);
  camera.aspect=w/h;camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(host);resize();

host.querySelector('.companion3d-loading')?.remove();
window.dispatchEvent(new CustomEvent('xrpet:3d-ready'));
window.dispatchEvent(new CustomEvent('xrpet:quality',{detail:{mode:XRPetQuality.lowPower?'performance':'full',postFx:postFxReady,fps:XRPetQuality.fps}}));

const clock=new THREE.Clock();
function renderFrame(){
  const dt=Math.min(.05,clock.getDelta());
  const t=clock.elapsedTime;
  const idle=performance.now()-lastInteract>1600;
  const beforeAction=action;const state=currentAction();
  if(beforeAction!=='idle'&&state==='idle')playExternalAction('idle');

  if(cameraTween>.002){
    camera.position.lerp(cameraGoal,.105);
    if(orbitControls)orbitControls.target.lerp(targetGoal,.105);
    cameraTween*=.86;
  }
  if(orbitControls){
    orbitControls.update();
  }else{
    camera.lookAt(targetGoal);
  }

  if(externalMixer){
    externalMixer.update(dt);
    if(externalNativeRig&&externalBlinkAction&&!['sleep','focus','scan'].includes(state)&&performance.now()>=externalNextBlinkAt){
      externalBlinkAction.reset().setLoop(THREE.LoopOnce,1).setEffectiveWeight(1).play();
      externalNextBlinkAt=performance.now()+1900+Math.random()*3600;
    }
  }
  animateExternalRipplet(t,state);
  if(externalModel){
    const extSleep=state==='sleep',extCelebrate=state==='celebrate',extAlert=state==='alert',extFocus=state==='focus',extScan=state==='scan',extOrbit=state==='orbit',extRun=state==='run',extJump=state==='jump',extClimb=state==='climb',extCrouch=state==='crouch';
    const baseY=externalModel.userData.xrpetBaseY??0;
    externalModel.position.y=baseY+(extSleep?-.06:0)+(extCrouch?-.10:0)+Math.sin(t*(extSleep?.65:extRun?2.1:1.15))*(extSleep?.012:extRun?.04:.026)+(extCelebrate?Math.abs(Math.sin(t*6))*.06:0)+(extJump?Math.sin(Math.PI*motorProgress())*.36:0)+(extClimb?Math.sin(t*7.8)*.025:0);
    externalModel.rotation.z=(extSleep?.045:Math.sin(t*.52)*.008)+(extCelebrate?Math.sin(t*5)*.018:0)+(extScan?Math.sin(t*4)*.012:0);
    externalModel.rotation.x=extAlert?Math.sin(t*2.2)*.012:extFocus?-.025:0;
    if(extOrbit)externalModel.rotation.y=(externalModel.userData.xrpetBaseRotY??0)+t*.75;
  }

  if(!dragging&&idle&&state!=='alert'&&state!=='sleep') targetRotY=Math.sin(t*.28)*.15;
  pet.rotation.y+=(targetRotY-pet.rotation.y)*.07;
  pet.rotation.x+=(targetRotX-pet.rotation.x)*.07;
  if(externalModel){
    const baseY=externalModel.userData.xrpetBaseRotY??0;
    const baseX=externalModel.userData.xrpetBaseRotX??0;
    externalModel.rotation.y+=(baseY+targetRotY-externalModel.rotation.y)*.07;
    externalModel.rotation.x+=(baseX+targetRotX-externalModel.rotation.x)*.07;
  }

  const sleeping=state==='sleep';
  const celebrating=state==='celebrate';
  const alerting=state==='alert';
  const focusing=state==='focus';
  const scanning=state==='scan';
  const orbiting=state==='orbit';
  const greeting=state==='greet'||state==='happy'||state==='wave';
  const sipping=state==='sip',gulping=state==='gulp',splashing=state==='splash';
  const biting=state==='bite',tasting=state==='taste',charging=state==='charge';
  const curling=state==='curl',dreaming=state==='dream',snoring=state==='snore';
  const highfiving=state==='highfive',dancing=state==='dance',walking=state==='walk';
  const running=state==='run',jumping=state==='jump',climbing=state==='climb';
  const reaching=state==='reach',grabbing=state==='grab',carrying=state==='carry',crouching=state==='crouch',turning=state==='turn';
  const locomoting=walking||running||climbing;

  // levitation and body life
  let lift=sleeping?-.01:0;
  if(celebrating)lift+=Math.abs(Math.sin(t*8))*0.14;
  if(orbiting)lift+=.07+Math.sin(t*2.4)*.04;
  if(greeting)lift+=Math.abs(Math.sin(t*5))*0.045;
  if(walking)lift+=Math.abs(Math.sin(t*7))*.035;
  if(running)lift+=Math.abs(Math.sin(t*10.5))*.07;
  if(climbing)lift+=Math.sin(t*7.8)*.035;
  if(jumping){
    const jp=motorProgress();
    lift+=Math.sin(Math.PI*jp)*.46-Math.max(0,(jp-.84)/.16)*.06;
  }
  if(crouching)lift-=.12;
  pet.position.y=lift+boost*.06;
  const balancePhase=Math.sin(t*(running?10.5:walking?7:climbing?7.8:1));
  if(locomoting){
    pelvis.rotation.y+=(balancePhase*(running?.09:.045)-pelvis.rotation.y)*.12;
    torso.rotation.z+=(balancePhase*(running?.045:.022)-torso.rotation.z)*.1;
  }
  if(jumping){
    const jp=motorProgress();
    torso.rotation.x+=(-.12+Math.sin(Math.PI*jp)*.18);
  }
  if(crouching)torso.rotation.x+=.08;
  if(turning)torso.rotation.y+=( (motor.turn||.45)-torso.rotation.y)*.12;
  chestPanel.position.y=-.3+Math.sin(t*(sleeping?.8:1.65))*(sleeping?.004:.009);

  // Ripplet 2.0 gaze: track the mouse across the entire XRPet interface, not only the canvas.
  const hr=host.getBoundingClientRect();
  const hx=hr.left+hr.width*.5,hy=hr.top+hr.height*.42;
  const rawGX=Math.max(-1,Math.min(1,(globalClientX-hx)/Math.max(180,innerWidth*.42)));
  const rawGY=Math.max(-1,Math.min(1,(globalClientY-hy)/Math.max(140,innerHeight*.36)));
  const idleGlanceX=idle?Math.sin(t*.31)*.16:0;
  const idleGlanceY=idle?Math.sin(t*.23+1.4)*.08:0;
  gazeX+=(rawGX+idleGlanceX-gazeX)*.09;
  gazeY+=(rawGY+idleGlanceY-gazeY)*.09;
  pointerX=gazeX;pointerY=gazeY;
  const headFollowX=sleeping?.13:pointerY*.12;
  const headFollowY=sleeping?0:pointerX*.19;
  headRig.rotation.x+=(headFollowX-headRig.rotation.x)*.085;
  headRig.rotation.y+=(headFollowY-headRig.rotation.y)*.085;
  torso.rotation.y+=( (sleeping?0:pointerX*.035)-torso.rotation.y)*.05;
  headRig.rotation.z+=( (sleeping?.08:Math.sin(t*.48)*.012) - headRig.rotation.z)*.07;
  if(greeting)headRig.rotation.z+=Math.sin(t*4)*.018;
  if(sipping)headRig.rotation.x+=.18+Math.sin(t*3)*.025;
  if(gulping)headRig.rotation.x+=.24+Math.sin(t*6)*.04;
  if(splashing)headRig.rotation.z+=Math.sin(t*8)*.055;
  if(tasting)headRig.rotation.y+=Math.sin(t*3.4)*.08;
  if(curling||dreaming||snoring)headRig.rotation.z+=.10;
  if(highfiving)headRig.rotation.z+=Math.sin(t*5)*.035;
  if(dancing)headRig.rotation.z+=Math.sin(t*7)*.06;

  // eye tracking + pupil response
  pupils.forEach((p,i)=>{
    const bx=i===0?-.42:.42;
    p.position.x=bx+(sleeping?0:pointerX*.075);
    p.position.y=1.11-(sleeping?0:pointerY*.058);
    p.position.z=1.52-Math.min(.025,Math.abs(pointerX)*.012+Math.abs(pointerY)*.012);
    const ps=alerting?1.12:sleeping?.82:1;
    p.scale.set(.74*ps,1*ps,.4);
  });
  irises.forEach((iris,i)=>{
    const bx=i===0?-.42:.42;
    iris.position.x=bx+(sleeping?0:pointerX*.052);
    iris.position.y=1.11-(sleeping?0:pointerY*.041);
    iris.position.z=1.49-Math.min(.018,Math.abs(pointerX)*.008+Math.abs(pointerY)*.008);
  });
  glints.forEach((g,i)=>{
    const bx=i===0?-.455:.385;
    g.position.x=bx+(sleeping?0:pointerX*.022);
    g.position.y=1.20-(sleeping?0:pointerY*.018);
  });
  browPlates.forEach((b,i)=>{
    const side=i===0?-1:1;
    const targetZ=(alerting?side*.02:focusing?side*.11:greeting?side*.05:side*.08);
    b.rotation.z+=(targetZ-b.rotation.z)*.08;
    b.position.y=1.43+(alerting?.035:focusing?-.018:0);
  });

  const naturalBlink=naturalBlinkAmount(performance.now());
  const expressiveBlink=sipping?Math.max(0,Math.sin(t*5))*.35:gulping?Math.max(0,Math.sin(t*8))*.48:tasting?Math.max(0,Math.sin(t*4.5))*.28:highfiving?Math.max(0,Math.sin(t*6))*.25:dancing?Math.max(0,Math.sin(t*7))*.2:0;
  const lidClose=(sleeping||curling||dreaming||snoring)?.96:Math.max(naturalBlink*.72,expressiveBlink);
  lids.forEach(l=>l.scale.y=.16+lidClose);

  // expressive mouth/core
  mouth.scale.x=greeting?1.28:alerting?.9:sleeping?.82:1;
  mouth.scale.y=greeting?1.14:1;
  coreRing.rotation.z=celebrating?t*2.1:Math.sin(t*.5)*.02;
  coreBall.scale.setScalar((currentCosmetic==='solar'?1.45:1)*(alerting?1.18:celebrating?1.24:charging?1.38:splashing?1.2:1)*(1+Math.sin(t*1.8)*.025));

  // expressive Ripplet arms / hands / legs / feet
  shoulders.forEach((sh,i)=>{
    const side=i===0?-1:1;
    let rz=0,rx=0;
    if(sipping){rz=side*(i===0?.52:.26);rx=-.12}
    if(gulping){rz=side*.62;rx=-.18+Math.sin(t*5+i)*.08}
    if(splashing){rz=side*(.55+Math.sin(t*9+i)*.22)}
    if(biting){rz=side*.42;rx=-.2}
    if(tasting){rz=side*(i===0?.35:.15)+Math.sin(t*3+i)*.05}
    if(charging){rz=side*.68;rx=-.25}
    if(highfiving){rz=side*(i===0?.9:.28);rx=-.25}
    if(walking){rz=side*Math.sin(t*7+i*Math.PI)*.22;rx=Math.sin(t*7+i*Math.PI)*.08}
    if(running){rz=side*Math.sin(t*10.5+i*Math.PI)*.42;rx=Math.sin(t*10.5+i*Math.PI)*.18}
    if(jumping){const jp=motorProgress();rz=side*(-.25+Math.sin(Math.PI*jp)*.8);rx=-.12}
    if(climbing){rz=side*(.72+Math.sin(t*7.8+i*Math.PI)*.28);rx=-.25}
    if(reaching||grabbing||carrying){const active=(motor.reachSide>0?1:0)===i; if(active){rz=side*.68;rx=-.35}}
    if(crouching){rz=side*.12;rx=.08}
    if(dancing){rz=side*(.45+Math.sin(t*7+i*Math.PI)*.32)}
    sh.rotation.z+=(rz-sh.rotation.z)*.18;sh.rotation.x+=(rx-sh.rotation.x)*.18;
  });
  if(idle&&!sleeping){
    const breathe=Math.sin(t*1.35)*.012;
    torso.scale.y+=(1+breathe-torso.scale.y)*.05;
    pelvis.rotation.z+=(Math.sin(t*.47)*.008-pelvis.rotation.z)*.04;
    shoulders.forEach((sh,i)=>{
      const side=i===0?-1:1;
      sh.rotation.x+=(Math.sin(t*.72+i)*.018-sh.rotation.x)*.035;
      sh.rotation.z+=(side*(.02+Math.sin(t*.51+i)*.012)-sh.rotation.z)*.035;
    });
    hands.forEach((hand,i)=>{
      const side=i===0?-1:1;
      hand.rotation.y+=(side*Math.sin(t*.83+i)*.045-hand.rotation.y)*.04;
      hand.rotation.x+=(Math.sin(t*.67+i)*.025-hand.rotation.x)*.04;
    });
    fingerPads.forEach((pad,i)=>{
      const pulse=1+Math.sin(t*1.1+i*.7)*.025;
      pad.scale.y+=(1.15*pulse-pad.scale.y)*.05;
    });
  }
  upperArms.forEach((arm,i)=>{
    const side=i===0?-1:1;let rz=side*.04,rx=0;
    if(walking){rz=side*Math.sin(t*7+i*Math.PI)*.16;rx=Math.sin(t*7+i*Math.PI)*.09}
    if(running){rz=side*Math.sin(t*10.5+i*Math.PI)*.36;rx=Math.sin(t*10.5+i*Math.PI)*.2}
    if(jumping){const jp=motorProgress();rz=side*(-.22+Math.sin(Math.PI*jp)*.65);rx=-.18}
    if(climbing){rz=side*(.55+Math.sin(t*7.8+i*Math.PI)*.35);rx=-.3}
    if(reaching||grabbing||carrying){const active=(motor.reachSide>0?1:0)===i;if(active){rz=side*.52;rx=-.42}}
    if(sipping||biting){rz=side*(i===0?.36:.12);rx=-.1}
    if(gulping||charging){rz=side*.45;rx=-.16}
    if(highfiving){rz=side*(i===0?.64:.14);rx=-.19}
    if(dancing){rz=side*(.28+Math.sin(t*7+i*Math.PI)*.22)}
    arm.rotation.z+=(rz-arm.rotation.z)*.18;arm.rotation.x+=(rx-arm.rotation.x)*.18;
  });
  hands.forEach((hand,i)=>{
    const side=i===0?-1:1;let rz=0,rx=0;
    if(sipping||biting){rz=side*(i===0?.35:.08);rx=-.12}
    if(gulping){rz=side*.42;rx=-.18}
    if(splashing){rz=side*Math.sin(t*9+i*Math.PI)*.35}
    if(highfiving){rz=side*(i===0?.58:.1);rx=-.2}
    if(dancing){rz=side*Math.sin(t*8+i*Math.PI)*.28;rx=Math.sin(t*6+i)*.1}
    if(running){rz=side*Math.sin(t*10.5+i*Math.PI)*.18;rx=Math.sin(t*10.5+i*Math.PI)*.12}
    if(climbing){rz=side*Math.sin(t*7.8+i*Math.PI)*.22;rx=-.25}
    if(reaching||grabbing||carrying){const active=(motor.reachSide>0?1:0)===i;if(active){rx=-.32;rz=side*.12}}
    hand.rotation.z+=(rz-hand.rotation.z)*.2;hand.rotation.x+=(rx-hand.rotation.x)*.2;
  });
  forearms.forEach((fore,i)=>{
    const side=i===0?-1:1;
    let rz=side*.09,rx=0;
    if(sipping)rz=side*(i===0?.72:.28);
    if(gulping){rz=side*.84;rx=.18+Math.sin(t*6+i)*.08}
    if(splashing)rz=side*(.8+Math.sin(t*10+i)*.28);
    if(biting)rz=side*.58;
    if(tasting)rz=side*(i===0?.46:.18);
    if(charging)rz=side*.92;
    if(highfiving)rz=side*(i===0?1.08:.32);
    if(walking){rz=side*(.09+Math.sin(t*7+i*Math.PI)*.28);rx=Math.sin(t*7+i*Math.PI)*.10}
    if(running){rz=side*(.12+Math.sin(t*10.5+i*Math.PI)*.44);rx=Math.sin(t*10.5+i*Math.PI)*.22}
    if(jumping){const jp=motorProgress();rz=side*(-.08+Math.sin(Math.PI*jp)*.55);rx=-.2}
    if(climbing){rz=side*(.76+Math.sin(t*7.8+i*Math.PI)*.32);rx=-.34}
    if(reaching||grabbing||carrying){const active=(motor.reachSide>0?1:0)===i;if(active){rz=side*.82;rx=-.4}}
    if(dancing)rz=side*(.55+Math.sin(t*8+i*Math.PI)*.4);
    fore.rotation.z+=(rz-fore.rotation.z)*.2;fore.rotation.x+=(rx-fore.rotation.x)*.18;
  });
  legs.forEach((leg,i)=>{
    const side=i===0?-1:1;let rz=side*.04,rx=0;
    if(splashing){rz=side*(.15+Math.sin(t*8+i*Math.PI)*.16);rx=Math.sin(t*8+i*Math.PI)*.12}
    if(charging){rz=side*.15;rx=-.08}
    if(curling||dreaming||snoring){rz=side*.28;rx=.22}
    if(walking){rz=side*(.04+Math.sin(t*7+i*Math.PI)*.18);rx=Math.sin(t*7+i*Math.PI)*.28}
    if(running){const ph=Math.sin(t*10.5+i*Math.PI);rz=side*(.04+ph*.2);rx=ph*.52}
    if(jumping){const jp=motorProgress();rz=side*.08;rx=.30-Math.sin(Math.PI*jp)*.22}
    if(climbing){const ph=Math.sin(t*7.8+i*Math.PI);rz=side*(.18+ph*.12);rx=.30+ph*.26}
    if(crouching){rz=side*.18;rx=.45}
    if(dancing){rz=side*(.18+Math.sin(t*7+i*Math.PI)*.22);rx=Math.sin(t*7+i*Math.PI)*.16}
    leg.rotation.z+=(rz-leg.rotation.z)*.18;leg.rotation.x+=(rx-leg.rotation.x)*.18;
  });
  feet.forEach((foot,i)=>{
    let ry=0,rx=0;
    if(sipping)rx=Math.sin(t*4+i)*.05;
    if(gulping)rx=Math.sin(t*6+i)*.08;
    if(biting)ry=Math.sin(t*4+i)*.08;
    if(curling||dreaming||snoring){rx=.18;ry=(i===0?-1:1)*.12}
    if(walking){rx=Math.sin(t*7+i*Math.PI)*.18;ry=Math.sin(t*7+i*Math.PI)*.06}
    if(running){const ph=Math.sin(t*10.5+i*Math.PI);rx=ph*.32;ry=ph*.08}
    if(jumping){const jp=motorProgress();rx=-.18+Math.sin(Math.PI*jp)*.32}
    if(climbing){rx=.22+Math.sin(t*7.8+i*Math.PI)*.16;ry=(i===0?-1:1)*.08}
    if(crouching){rx=.24}
    if(dancing){rx=Math.sin(t*8+i*Math.PI)*.22;ry=Math.sin(t*5+i)*.12}
    foot.rotation.x+=(rx-foot.rotation.x)*.2;foot.rotation.y+=(ry-foot.rotation.y)*.2;
  });

  fingerDigits.forEach((digit,i)=>{
    const handIndex=Math.floor(i/3);
    const active=(motor.reachSide>0?1:0)===handIndex;
    let curl=-.18;
    if((grabbing||carrying)&&active)curl=.55;
    else if(reaching&&active)curl=.12;
    else if(climbing)curl=.28+Math.sin(t*7.8+i*.35)*.08;
    digit.rotation.x+=(curl-digit.rotation.x)*.22;
  });

  // ears / species micro-motion
  ears.forEach((e,i)=>{
    if(!e.visible)return;
    const flick=Math.sin(t*(currentKind==='fox'?1.8:1.15)+i*1.7)*.025;
    e.rotation.x=-.12+(alerting?-.08:sleeping?.05:flick);
  });
  foxTailPivot.rotation.z=Math.sin(t*(celebrating?3.4:1.25))*(celebrating?.32:.16);
  catTailPivot.rotation.z=Math.sin(t*(alerting?1.8:.92))*(alerting?.2:.12);
  species.pup.rotation.z=greeting?Math.sin(t*5)*.028:Math.sin(t*.7)*.006;
  birdWings.forEach((w,i)=>{
    const amp=celebrating?.38:alerting?.22:.12;
    const speed=celebrating?7:alerting?4.3:2.2;
    w.rotation.z=Math.sin(t*speed+i*Math.PI)*amp;
  });
  featherDetails.forEach((f,i)=>{f.rotation.x=-.08+Math.sin(t*1.6+i*.47)*.012});
  turtleShell.rotation.y=Math.sin(t*.34)*.018;
  turtleScutes.forEach((s,i)=>{s.position.z=-.86+Math.sin(t*.45+i)*.003});
  species.turtle.rotation.x=sleeping?.035:Math.sin(t*.52)*.006;

  // cosmetic / XRP energy motion
  halo1.rotation.z=t*(celebrating?.75:.3);halo2.rotation.z=-t*(celebrating?.95:.42);
  extAqua1.rotation.z=t*(celebrating?.9:.34);extAqua2.rotation.z=-t*(celebrating?1.1:.48);
  extHalo1.rotation.z=t*(celebrating?.72:.28);extHalo2.rotation.z=-t*(celebrating?.9:.4);
  extSolar.rotation.z=t*(alerting?1.2:.5);extGuardian.rotation.z=Math.PI*.83+Math.sin(t*.8)*.025;
  externalLedgerFrame.rotation.y=orbiting?t*1.05:Math.sin(t*.3)*.025;
  externalXCore.rotation.z=scanning?t*2.1:Math.sin(t*.6)*.05;
  extRes.rotation.y=orbiting?t*1.35:Math.sin(t*.42)*.03;
  extResCore.rotation.y=t*(scanning?2.4:.55);
  ext589Nodes.forEach((n,i)=>{
    const pulse=.88+(Math.sin(t*(scanning?5.2:1.8)+i*.67)+1)*.12;
    n.scale.setScalar(pulse);
  });
  matrixHalo.rotation.z=t*.24;
  standardGem.rotation.y=t*.55;rippleGem.rotation.y=-t*.72;vaultGem.rotation.z=t*.18;core589Gem.rotation.y=t*(scanning?2.6:.72);
  core589Nodes.forEach((n,i)=>n.scale.setScalar(.9+(Math.sin(t*2+i*.55)+1)*.09));
  pulseTrailNodes.forEach((n,i)=>{n.position.y=-.15-i*.09+Math.sin(t*2.6+i*.5)*.025;n.scale.setScalar(.82+(Math.sin(t*3.2+i*.7)+1)*.12)});
  nodeTrailNodes.forEach((n,i)=>{n.rotation.x=t*.4+i*.2;n.rotation.y=t*.55+i*.16});
  resTrailNodes.forEach((n,i)=>{n.position.x=Math.sin(t*1.4+i*.8)*(.12+i*.008);n.scale.setScalar(.82+(Math.sin(t*2.2+i*.9)+1)*.12)});
  cosmeticGroups.resonance.rotation.y=orbiting?t*.8:0;
  orbGroup.rotation.y=t*(alerting?1.35:.7);orbit1.rotation.z=t*(celebrating?1.5:.62);orbit2.rotation.z=-t*(celebrating?1.7:.78);
  holoRing.rotation.z=t*(alerting?.34:.15);holoRing2.rotation.z=-t*(alerting?.45:.21);
  contactShadow.visible=false;

  const targetEmissive=scanning||gulping||tasting?5.2:orbiting||dancing?4.6:focusing||charging?4.2:alerting?4.2:celebrating||splashing||highfiving?5.4:greeting||sipping||biting?3.6:currentCosmetic==='resonance'?3.2:2.5;
  accentMat.emissiveIntensity+=(targetEmissive-accentMat.emissiveIntensity)*.12;

  if(boost>0){
    boost*=.89;pet.scale.setScalar(.82+boost*.04);
  }else{
    pet.scale.lerp(new THREE.Vector3(.82,.82,.82),.1);
  }

  if(currentKind==='ripplet'&&!externalModel){
    renderer.setClearColor(0x000000,0);
    renderer.setClearAlpha(0);
    renderer.render(scene,camera);
  }else if(externalKind==='ripplet'){
    renderer.setClearColor(0x000000,0);
    renderer.setClearAlpha(0);
    renderer.render(scene,camera);
  }else if(composer&&postFxReady)composer.render();else renderer.render(scene,camera);
}
let rafId=0,lastFrameTime=0,renderPaused=document.hidden;
const frameInterval=1000/XRPetQuality.fps;
function animate(ts=0){
  rafId=requestAnimationFrame(animate);
  if(renderPaused)return;
  if(ts-lastFrameTime<frameInterval)return;
  lastFrameTime=ts;
  try{renderFrame()}catch(err){
    console.error('XRPet 3D frame failed',err);
    renderPaused=true;
    host.classList.add('webgl-lost');
    window.dispatchEvent(new CustomEvent('xrpet:model-fallback',{detail:{kind:currentKind,error:String(err?.message||err)}}));
  }
}
document.addEventListener('visibilitychange',()=>{
  renderPaused=document.hidden;
  if(!renderPaused){lastFrameTime=0}
});
animate();

