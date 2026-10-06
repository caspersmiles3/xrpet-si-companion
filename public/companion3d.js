import * as THREE from 'https://esm.sh/three@0.169.0';

const host=document.getElementById('companion3d');
if(!host) throw new Error('XRPet 3D host missing');

const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(31,1,.1,100);
camera.position.set(0,.15,8.4);

const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.setClearColor(0x000000,0);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.18;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.domElement.className='companion3d-canvas';
renderer.domElement.setAttribute('aria-label','Interactive cinematic XRPet companion');
host.appendChild(renderer.domElement);

const root=new THREE.Group();
root.position.y=.08;
scene.add(root);

const palette={
  classic:{shell:0xbfcbd2,dark:0x10171d,accent:0x43e8ff,glass:0xa6f8ff},
  aqua:{shell:0x88dce8,dark:0x09202a,accent:0x45e8ff,glass:0xc5fbff},
  midnight:{shell:0x313c45,dark:0x04080b,accent:0x2ebcff,glass:0x79dcff},
  pearl:{shell:0xe8eef2,dark:0x65727a,accent:0xb4f8ff,glass:0xffffff},
  solar:{shell:0xd78f48,dark:0x28110a,accent:0xffbf57,glass:0xffe5ad}
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
const softMat=new THREE.MeshPhysicalMaterial({color:0x25313a,metalness:.3,roughness:.42,clearcoat:.35});

function add(geo,mat,parent=root,name=''){
  const m=new THREE.Mesh(geo,mat);
  m.name=name;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function tag(obj,role){obj.userData.role=role;return obj}
function hideGroup(g){g.visible=false;return g}

const pet=new THREE.Group();
pet.scale.setScalar(.82);
root.add(pet);

// --- cinematic base anatomy ---
const pelvis=tag(add(new THREE.SphereGeometry(.55,48,32),shellDarkMat,pet,'pelvis'),'pelvis');
pelvis.scale.set(.9,.54,.78);pelvis.position.set(0,-.87,.02);

const torso=tag(add(new THREE.SphereGeometry(.84,64,48),shellMat,pet,'torso'),'torso');
torso.scale.set(.9,.9,.78);torso.position.set(0,-.36,.03);

const chestPanel=tag(add(new THREE.SphereGeometry(.48,48,32),shellDarkMat,pet,'chest'),'chest');
chestPanel.scale.set(1.08,.8,.5);chestPanel.position.set(0,-.3,.64);

const neck=add(new THREE.CylinderGeometry(.31,.39,.34,40),shellDarkMat,pet,'neck');
neck.position.set(0,.28,.02);

const head=tag(add(new THREE.SphereGeometry(1.08,72,56),shellMat,pet,'head'),'head');
head.scale.set(1,.82,.9);head.position.set(0,1.06,.04);

const face=tag(add(new THREE.SphereGeometry(.96,64,48),shellDarkMat,pet,'face'),'face');
face.scale.set(.96,.66,.73);face.position.set(0,.99,.63);

const muzzle=tag(add(new THREE.SphereGeometry(.32,36,24),softMat,pet,'muzzle'),'muzzle');
muzzle.scale.set(1.08,.52,.65);muzzle.position.set(0,.7,1.35);

const nose=tag(add(new THREE.SphereGeometry(.095,28,20),blackMat,pet,'nose'),'nose');
nose.scale.set(1.05,.68,.75);nose.position.set(0,.71,1.58);

const mouth=add(new THREE.TorusGeometry(.13,.015,8,28,Math.PI),accentMat,pet,'mouth');
mouth.position.set(0,.55,1.56);mouth.rotation.z=Math.PI;

// shell seam details
for(const x of [-.48,.48]){
  const cheek=add(new THREE.TorusGeometry(.19,.018,10,38,Math.PI*1.15),accentMat,pet,'cheekSeam');
  cheek.position.set(x,.72,1.14);cheek.rotation.z=x<0?.72:-.72;
}
const browBridge=add(new THREE.BoxGeometry(.55,.035,.04),accentMat,pet,'browBridge');
browBridge.position.set(0,1.37,1.19);

// eyes with cornea + pupil
const eyes=[], pupils=[], lids=[];
for(const x of [-.42,.42]){
  const eye=add(new THREE.SphereGeometry(.285,48,36),glassMat,pet,'eye');
  eye.scale.set(1,.92,.48);eye.position.set(x,1.11,1.29);eyes.push(eye);

  const pupil=add(new THREE.SphereGeometry(.105,30,22),blackMat,pet,'pupil');
  pupil.scale.set(.74,1,.4);pupil.position.set(x,1.11,1.52);pupils.push(pupil);

  const glint=add(new THREE.SphereGeometry(.032,14,10),new THREE.MeshBasicMaterial({color:0xffffff}),pet,'glint');
  glint.position.set(x-.035,1.2,1.58);

  const lid=add(new THREE.SphereGeometry(.295,48,30,0,Math.PI*2,0,Math.PI/2),shellDarkMat,pet,'lid');
  lid.scale.set(1.02,.16,.51);lid.position.set(x,1.32,1.28);lids.push(lid);
}

// ears
const ears=[];
for(const [x,s] of [[-.72,-1],[.72,1]]){
  const ear=tag(add(new THREE.ConeGeometry(.39,.98,5),shellMat,pet,'ear'),'ear');
  ear.position.set(x,1.87,.02);ear.rotation.z=s*.24;ear.rotation.x=-.12;ears.push(ear);
  const inner=tag(add(new THREE.ConeGeometry(.24,.67,5),shellDarkMat,pet,'earInner'),'earInner');
  inner.position.set(x,1.86,.17);inner.rotation.z=s*.24;inner.rotation.x=-.12;
}

// shoulders / arms
const shoulders=[];
for(const [x,s] of [[-.89,-1],[.89,1]]){
  const shoulder=tag(add(new THREE.SphereGeometry(.34,36,24),shellMat,pet,'shoulder'),'shoulder');
  shoulder.scale.set(.76,.94,.7);shoulder.position.set(x,-.15,.02);shoulders.push(shoulder);
  const ring=add(new THREE.TorusGeometry(.245,.042,14,42),accentMat,pet,'shoulderLight');
  ring.position.set(x,-.15,.27);ring.rotation.x=Math.PI/2;

  const fore=tag(add(new THREE.CapsuleGeometry(.16,.42,8,20),shellDarkMat,pet,'forearm'),'forearm');
  fore.position.set(x*1.02,-.67,.13);fore.rotation.z=s*.09;
}

// legs
const legs=[];
for(const [x,s] of [[-.37,-1],[.37,1]]){
  const thigh=tag(add(new THREE.CapsuleGeometry(.2,.45,8,22),shellMat,pet,'leg'),'leg');
  thigh.position.set(x,-1.18,.02);thigh.rotation.z=s*.04;legs.push(thigh);
  const ankle=add(new THREE.TorusGeometry(.16,.03,12,32),accentMat,pet,'ankleLight');
  ankle.position.set(x,-1.49,.14);ankle.rotation.x=Math.PI/2;
  const foot=tag(add(new THREE.SphereGeometry(.25,30,20),shellDarkMat,pet,'foot'),'foot');
  foot.scale.set(1.18,.38,1.35);foot.position.set(x,-1.6,.23);
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

// floating crown orb
const orbGroup=new THREE.Group();pet.add(orbGroup);orbGroup.position.set(0,2.45,0);
const orb=add(new THREE.SphereGeometry(.18,34,24),glassMat,orbGroup,'orb');
const orbit1=add(new THREE.TorusGeometry(.34,.018,10,58),accentMat,orbGroup,'orbit1');orbit1.rotation.x=1.1;
const orbit2=add(new THREE.TorusGeometry(.27,.014,10,52),accentMat,orbGroup,'orbit2');orbit2.rotation.set(.35,.7,.2);

// --- species geometry ---
const species={
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

// --- additive cosmetics ---
const cosmeticGroups={
  classic:new THREE.Group(),
  aqua:new THREE.Group(),
  midnight:new THREE.Group(),
  pearl:new THREE.Group(),
  solar:new THREE.Group()
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

// holographic grounding ring; transparent scene, no box/pedestal
const holo=new THREE.Group();root.add(holo);holo.position.y=-1.92;
const holoRing=add(new THREE.TorusGeometry(1.03,.025,12,72),accentMat,holo,'holoRing');holoRing.rotation.x=Math.PI/2;
const holoRing2=add(new THREE.TorusGeometry(.7,.012,10,60),accentMat,holo,'holoRing2');holoRing2.rotation.x=Math.PI/2;

// lighting
scene.add(new THREE.HemisphereLight(0xc9f6ff,0x061017,2.1));
const key=new THREE.SpotLight(0xffffff,44,20,.5,.5,1.3);key.position.set(-4,5,5);key.castShadow=true;scene.add(key);key.target=pet;
const fill=new THREE.PointLight(0x45e8ff,24,9,1.7);fill.position.set(2.9,1.3,3.6);scene.add(fill);
const rim=new THREE.PointLight(0x6b6dff,17,8,1.7);rim.position.set(-3.1,1.2,-2.1);scene.add(rim);
const under=new THREE.PointLight(0x35ddff,10,5,2);under.position.set(0,-1.2,1.8);scene.add(under);

// state
let currentKind='nexus', currentGender='boy', currentCosmetic='classic';
let targetRotY=0,targetRotX=0,dragging=false,lastX=0,lastY=0,pointerX=0,pointerY=0,boost=0,lastInteract=0;
const baseEarTransforms=ears.map(e=>({scale:e.scale.clone(),rot:e.rotation.clone()}));

function resetBaseShape(){
  head.scale.set(1,.82,.9);face.scale.set(.96,.66,.73);torso.scale.set(.9,.9,.78);
  muzzle.scale.set(1.08,.52,.65);muzzle.position.set(0,.7,1.35);nose.position.set(0,.71,1.58);
  ears.forEach((e,i)=>{e.visible=true;e.scale.copy(baseEarTransforms[i].scale);e.rotation.copy(baseEarTransforms[i].rot)});
  shoulders.forEach(s=>s.visible=true);
  legs.forEach(l=>l.scale.set(1,1,1));
}
function configureSpecies(kind){
  currentKind=species[kind]?kind:'nexus';
  Object.entries(species).forEach(([k,g])=>g.visible=k===currentKind);
  // nexus group has no extra geometry; it is still the base body
  resetBaseShape();

  if(currentKind==='fox'){
    head.scale.set(.92,.75,.85);face.scale.set(.9,.62,.72);torso.scale.set(.76,.92,.7);
    ears.forEach(e=>{e.scale.set(.78,1.45,.78)});
    muzzle.scale.set(.93,.42,.62);muzzle.position.z=1.42;nose.position.z=1.64;
  }else if(currentKind==='pup'){
    head.scale.set(1.06,.88,.94);face.scale.set(1.02,.72,.82);torso.scale.set(1,.92,.88);
    ears.forEach(e=>e.visible=false);muzzle.visible=false;nose.position.set(0,.68,1.65);
  }else if(currentKind==='cat'){
    head.scale.set(.95,.79,.86);face.scale.set(.91,.64,.76);torso.scale.set(.73,.96,.68);
    ears.forEach(e=>e.scale.set(.72,1.08,.72));muzzle.scale.set(.82,.38,.55);
  }else if(currentKind==='bird'){
    head.scale.set(.88,.76,.8);face.scale.set(.82,.6,.68);torso.scale.set(.58,1.12,.58);
    ears.forEach(e=>e.visible=false);muzzle.visible=false;nose.visible=false;shoulders.forEach(s=>s.visible=false);
  }else if(currentKind==='turtle'){
    head.scale.set(.82,.7,.78);face.scale.set(.78,.55,.67);torso.scale.set(1.06,.67,.96);
    ears.forEach(e=>e.visible=false);muzzle.scale.set(.78,.4,.55);
  }
  if(currentKind!=='pup'&&currentKind!=='bird')muzzle.visible=true;
  if(currentKind!=='bird')nose.visible=true;
}
function configureGender(gender){
  currentGender=gender==='girl'?'girl':'boy';
  boyGroup.visible=currentGender==='boy';girlGroup.visible=currentGender==='girl';
  // deliberately visible but subtle presentation differences
  if(currentGender==='girl'){
    head.scale.multiplyScalar(.97);face.scale.y*=1.04;
    eyes.forEach(e=>e.scale.y=1.02);
  }
}
function configureCosmetic(cosmetic){
  currentCosmetic=palette[cosmetic]?cosmetic:'classic';
  Object.entries(cosmeticGroups).forEach(([k,g])=>g.visible=k===currentCosmetic);
  const p=palette[currentCosmetic];
  shellMat.color.setHex(p.shell);shellDarkMat.color.setHex(p.dark);accentMat.color.setHex(p.accent);
  accentMat.emissive.setHex(p.accent);glassMat.color.setHex(p.glass);
  coreRing.scale.setScalar(currentCosmetic==='solar'?1.35:currentCosmetic==='midnight'?.84:1);
  coreBall.scale.setScalar(currentCosmetic==='solar'?1.45:1);
  orbGroup.visible=currentCosmetic!=='midnight';
}
function applyRoom(room){
  const rooms={
    nexus:[0x43e8ff,0x696cff,1.18],
    ocean:[0x55e9ff,0x1289aa,1.12],
    vault:[0xd8b76b,0x6c5220,1.02],
    aurora:[0x79f1ff,0xaa8cff,1.23],
    legend:[0xf0ce73,0x7b5cff,1.27]
  };
  const r=rooms[room]||rooms.nexus;fill.color.setHex(r[0]);rim.color.setHex(r[1]);renderer.toneMappingExposure=r[2];
}
function setAppearance(detail={}){
  configureSpecies(detail.companionKind||currentKind);
  configureGender(detail.companionGender||currentGender);
  configureCosmetic(detail.cosmetic||currentCosmetic);
  applyRoom(detail.room||'nexus');
}
window.addEventListener('xrpet:appearance',e=>setAppearance(e.detail||{}));

renderer.domElement.addEventListener('pointerdown',e=>{
  dragging=true;lastX=e.clientX;lastY=e.clientY;lastInteract=performance.now();renderer.domElement.setPointerCapture?.(e.pointerId);
});
renderer.domElement.addEventListener('pointermove',e=>{
  const r=renderer.domElement.getBoundingClientRect();
  pointerX=((e.clientX-r.left)/Math.max(1,r.width)-.5)*2;pointerY=((e.clientY-r.top)/Math.max(1,r.height)-.5)*2;
  if(dragging){
    targetRotY+=(e.clientX-lastX)*.012;targetRotX+=(e.clientY-lastY)*.006;
    targetRotX=Math.max(-.24,Math.min(.24,targetRotX));lastX=e.clientX;lastY=e.clientY;lastInteract=performance.now();
  }
});
renderer.domElement.addEventListener('pointerup',e=>{dragging=false;renderer.domElement.releasePointerCapture?.(e.pointerId)});
renderer.domElement.addEventListener('pointercancel',()=>dragging=false);
renderer.domElement.addEventListener('dblclick',()=>{targetRotX=0;targetRotY=0});
renderer.domElement.addEventListener('click',()=>{
  boost=1;lastInteract=performance.now();window.dispatchEvent(new CustomEvent('xrpet:petInteract'));
});

window.XRPet3D={
  setAppearance,
  react(){boost=1},
  reset(){targetRotX=0;targetRotY=0},
  visible(){return renderer.domElement.isConnected}
};

function resize(){
  const r=host.getBoundingClientRect();const w=Math.max(1,r.width),h=Math.max(1,r.height);
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(host);resize();

host.querySelector('.companion3d-loading')?.remove();
window.dispatchEvent(new CustomEvent('xrpet:3d-ready'));

const clock=new THREE.Clock();
function animate(){
  const t=clock.getElapsedTime();
  const idle=performance.now()-lastInteract>1600;

  if(!dragging&&idle) targetRotY=Math.sin(t*.28)*.15;
  pet.rotation.y+=(targetRotY-pet.rotation.y)*.07;
  pet.rotation.x+=(targetRotX-pet.rotation.x)*.07;

  // breathing / levitation
  pet.position.y=.1+Math.sin(t*1.25)*.035+boost*.075;
  chestPanel.position.y=-.3+Math.sin(t*1.65)*.008;
  head.rotation.z=Math.sin(t*.48)*.012;

  // eye tracking
  pupils.forEach((p,i)=>{
    const bx=i===0?-.42:.42;p.position.x=bx+pointerX*.04;p.position.y=1.11-pointerY*.032;
  });
  const blink=Math.max(0,Math.sin(t*.43+2.45))**42;
  lids.forEach(l=>l.scale.y=.16+blink*.72);

  // species behaviors
  foxTailPivot.rotation.z=Math.sin(t*1.25)*.16;
  catTailPivot.rotation.z=Math.sin(t*.92)*.12;
  birdWings.forEach((w,i)=>w.rotation.z=Math.sin(t*2.2+i*Math.PI)*.12);
  turtleShell.rotation.y=Math.sin(t*.34)*.018;

  // cosmetic motion
  halo1.rotation.z=t*.3;halo2.rotation.z=-t*.42;
  orbGroup.rotation.y=t*.7;orbit1.rotation.z=t*.62;orbit2.rotation.z=-t*.78;
  holoRing.rotation.z=t*.15;holoRing2.rotation.z=-t*.21;

  if(boost>0){
    boost*=.89;pet.scale.setScalar(.82+boost*.045);accentMat.emissiveIntensity=2.5+boost*4;
  }else{
    pet.scale.lerp(new THREE.Vector3(.82,.82,.82),.1);accentMat.emissiveIntensity+=(2.5-accentMat.emissiveIntensity)*.1;
  }

  renderer.render(scene,camera);
  requestAnimationFrame(animate);
}
animate();
