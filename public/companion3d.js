import * as THREE from 'https://esm.sh/three@0.169.0';

const host=document.getElementById('companion3d');
if(!host) throw new Error('XRPet 3D host missing');

const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(35,1,0.1,100);
camera.position.set(0,0.42,7.35);

const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setClearColor(0x000000,0);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.25;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.domElement.className='companion3d-canvas';
renderer.domElement.setAttribute('aria-label','Interactive XRPet 3D companion');
host.appendChild(renderer.domElement);

const world=new THREE.Group();
scene.add(world);

const palette={
  classic:{shell:0xc9d6dc,dark:0x0a1117,accent:0x45e8ff,glass:0x92f4ff},
  aqua:{shell:0x8eeeff,dark:0x08202a,accent:0x42e8ff,glass:0xb9fbff},
  midnight:{shell:0x26323b,dark:0x03070a,accent:0x29b7ff,glass:0x73dcff},
  pearl:{shell:0xf2f7fa,dark:0x5b6b75,accent:0xa8f5ff,glass:0xffffff},
  solar:{shell:0xf1a24d,dark:0x341108,accent:0xffc35f,glass:0xffe3a3}
};
let current='classic';

const shellMat=new THREE.MeshPhysicalMaterial({color:palette.classic.shell,metalness:.72,roughness:.2,clearcoat:1,clearcoatRoughness:.12});
const darkMat=new THREE.MeshPhysicalMaterial({color:palette.classic.dark,metalness:.82,roughness:.17,clearcoat:.8});
const accentMat=new THREE.MeshStandardMaterial({color:palette.classic.accent,emissive:palette.classic.accent,emissiveIntensity:2.4,metalness:.2,roughness:.28});
const glassMat=new THREE.MeshPhysicalMaterial({color:palette.classic.glass,emissive:0x1b8eaa,emissiveIntensity:.75,metalness:.05,roughness:.08,transmission:.28,transparent:true,opacity:.92});
const blackMat=new THREE.MeshPhysicalMaterial({color:0x010306,metalness:.45,roughness:.12,clearcoat:1});
const pedestalMat=new THREE.MeshPhysicalMaterial({color:0x0b151c,metalness:.88,roughness:.16,clearcoat:.7});

function mesh(geo,mat,parent=world){const m=new THREE.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}

const pet=new THREE.Group();
pet.position.y=.28;
pet.scale.setScalar(.82);
world.add(pet);

const body=mesh(new THREE.SphereGeometry(.82,64,48),shellMat,pet);body.userData.role='body';
body.scale.set(.9,.83,.82); body.position.y=-.68;
const chest=mesh(new THREE.SphereGeometry(.48,48,32),darkMat,pet);chest.userData.role='chest';
chest.scale.set(1.15,.78,.65); chest.position.set(0,-.63,.58);

const head=mesh(new THREE.SphereGeometry(1.18,72,56),shellMat,pet);head.userData.role='head';
head.scale.set(1.05,.88,.95); head.position.y=.72;
const face=mesh(new THREE.SphereGeometry(1.04,64,48),darkMat,pet);face.userData.role='face';
face.scale.set(1.01,.72,.83); face.position.set(0,.61,.52);

function ear(x,flip=1){
  const g=new THREE.ConeGeometry(.42,1.05,5);
  const e=mesh(g,shellMat,pet);
  e.position.set(x,1.72,-.02); e.rotation.z=flip*.24; e.rotation.x=-.15; e.userData.role='ear';
  const inner=mesh(new THREE.ConeGeometry(.26,.7,5),darkMat,pet);
  inner.position.set(x,1.70,.15); inner.rotation.z=flip*.24; inner.rotation.x=-.15; inner.userData.role='earInner';
}
ear(-.72,-1); ear(.72,1);

const eyes=[];
const pupils=[];
for(const x of [-.48,.48]){
  const socket=mesh(new THREE.SphereGeometry(.31,48,32),glassMat,pet);
  socket.scale.set(1,.95,.45); socket.position.set(x,.78,1.23); eyes.push(socket);
  const pupil=mesh(new THREE.SphereGeometry(.105,32,24),blackMat,pet);
  pupil.scale.z=.5;pupil.position.set(x,.78,1.49);pupils.push(pupil);
  const glint=mesh(new THREE.SphereGeometry(.035,16,12),new THREE.MeshBasicMaterial({color:0xffffff}),pet);
  glint.position.set(x-.035,.86,1.55);
}

const forehead=mesh(new THREE.TorusGeometry(.17,.035,20,48),accentMat,pet); forehead.position.set(0,1.31,1.0); forehead.rotation.x=Math.PI/2;
const core=mesh(new THREE.TorusGeometry(.19,.045,20,48),accentMat,pet); core.position.set(0,-.52,1.05); core.rotation.x=Math.PI/2;
const coreBall=mesh(new THREE.SphereGeometry(.09,24,16),glassMat,pet);coreBall.position.copy(core.position);coreBall.z+=.04;

for(const x of [-.94,.94]){
  const pod=mesh(new THREE.SphereGeometry(.34,36,24),shellMat,pet);pod.scale.set(.75,.95,.7);pod.position.set(x,-.48,.05);pod.userData.role='pod';
  const ring=mesh(new THREE.TorusGeometry(.25,.045,16,48),accentMat,pet);ring.position.set(x,-.48,.29);ring.rotation.x=Math.PI/2;
}
for(const x of [-.45,.45]){
  const leg=mesh(new THREE.SphereGeometry(.36,36,24),shellMat,pet);leg.userData.role='leg';leg.scale.set(.78,.92,.8);leg.position.set(x,-1.3,.12);
  const foot=mesh(new THREE.SphereGeometry(.26,28,20),darkMat,pet);foot.userData.role='foot';foot.scale.set(1.15,.42,1.35);foot.position.set(x,-1.59,.23);
  const footLight=mesh(new THREE.TorusGeometry(.18,.03,12,32),accentMat,pet);footLight.position.set(x,-1.57,.48);footLight.rotation.x=Math.PI/2;
}

const neck=mesh(new THREE.TorusGeometry(.48,.075,20,64),accentMat,pet);neck.position.set(0,-.05,.03);neck.rotation.x=Math.PI/2;

const orbGroup=new THREE.Group();pet.add(orbGroup);orbGroup.position.set(0,2.2,0);
const orb=mesh(new THREE.SphereGeometry(.24,36,24),glassMat,orbGroup);
const orbit1=mesh(new THREE.TorusGeometry(.42,.018,12,64),accentMat,orbGroup);orbit1.rotation.x=1.1;
const orbit2=mesh(new THREE.TorusGeometry(.34,.014,12,64),accentMat,orbGroup);orbit2.rotation.set(.35,.7,.2);

const base=new THREE.Group();world.add(base);base.position.y=-1.78;
const baseDisc=mesh(new THREE.CylinderGeometry(1.55,1.65,.24,80),pedestalMat,base);
const baseRing=mesh(new THREE.TorusGeometry(1.36,.045,16,96),accentMat,base);baseRing.rotation.x=Math.PI/2;baseRing.position.y=.15;
const innerRing=mesh(new THREE.TorusGeometry(.9,.025,12,72),accentMat,base);innerRing.rotation.x=Math.PI/2;innerRing.position.y=.17;

const floorGlow=mesh(new THREE.CircleGeometry(1.65,80),new THREE.MeshBasicMaterial({color:0x0b8eb2,transparent:true,opacity:.08}),base);floorGlow.rotation.x=-Math.PI/2;floorGlow.position.y=.14;



const foxGroup=new THREE.Group();pet.add(foxGroup);
const foxTail=mesh(new THREE.TorusGeometry(.58,.11,14,54,Math.PI*1.45),shellMat,foxGroup);
foxTail.position.set(.68,-.85,-.62);foxTail.rotation.set(.2,.72,-.5);
const foxTailLight=mesh(new THREE.TorusGeometry(.58,.026,10,54,Math.PI*1.45),accentMat,foxGroup);
foxTailLight.position.copy(foxTail.position);foxTailLight.rotation.copy(foxTail.rotation);

const pupGroup=new THREE.Group();pet.add(pupGroup);
for(const x of [-1,1]){
  const flap=mesh(new THREE.SphereGeometry(.34,28,20),shellMat,pupGroup);
  flap.scale.set(.55,1.25,.32);flap.position.set(x*.87,1.36,.17);flap.rotation.z=x*.34;
}
const pupMuzzle=mesh(new THREE.SphereGeometry(.34,32,24),darkMat,pupGroup);
pupMuzzle.scale.set(1.05,.6,.55);pupMuzzle.position.set(0,.48,1.35);

const catGroup=new THREE.Group();pet.add(catGroup);
for(const y of [.68,.54,.4]){
  const l=mesh(new THREE.CylinderGeometry(.015,.015,.62,10),accentMat,catGroup);
  l.position.set(-.63,y,1.28);l.rotation.z=Math.PI/2-.14;
  const r=mesh(new THREE.CylinderGeometry(.015,.015,.62,10),accentMat,catGroup);
  r.position.set(.63,y,1.28);r.rotation.z=Math.PI/2+.14;
}
const catTail=mesh(new THREE.TorusGeometry(.54,.08,12,48,Math.PI*1.4),shellMat,catGroup);
catTail.position.set(.73,-.9,-.55);catTail.rotation.set(.15,.7,-.4);

const birdGroup=new THREE.Group();pet.add(birdGroup);
for(const x of [-1,1]){
  const wing=mesh(new THREE.ConeGeometry(.36,1.15,5),shellMat,birdGroup);
  wing.position.set(x*.92,-.43,-.05);wing.rotation.z=x*-1.18;wing.rotation.x=-.1;
  const wingGlow=mesh(new THREE.BoxGeometry(.05,.7,.05),accentMat,birdGroup);
  wingGlow.position.set(x*.87,-.38,.18);wingGlow.rotation.z=x*-1.12;
}
const beak=mesh(new THREE.ConeGeometry(.18,.52,4),shellMat,birdGroup);
beak.position.set(0,.56,1.64);beak.rotation.x=Math.PI/2;

const turtleGroup=new THREE.Group();pet.add(turtleGroup);
const shellBack=mesh(new THREE.SphereGeometry(.82,48,32),shellMat,turtleGroup);
shellBack.scale.set(1.03,.75,.42);shellBack.position.set(0,-.72,-.48);
const shellPlate=mesh(new THREE.TorusGeometry(.55,.045,14,64),accentMat,turtleGroup);
shellPlate.position.set(0,-.72,-.86);shellPlate.rotation.x=Math.PI/2;
for(const x of [-1,1]){
  const sideLeg=mesh(new THREE.SphereGeometry(.3,24,18),shellMat,turtleGroup);
  sideLeg.scale.set(1.15,.42,.8);sideLeg.position.set(x*.92,-1.03,.0);
}

const boyGroup=new THREE.Group();pet.add(boyGroup);
const boyBrowL=mesh(new THREE.BoxGeometry(.34,.045,.06),accentMat,boyGroup);
boyBrowL.position.set(-.43,1.07,1.48);boyBrowL.rotation.z=.12;
const boyBrowR=mesh(new THREE.BoxGeometry(.34,.045,.06),accentMat,boyGroup);
boyBrowR.position.set(.43,1.07,1.48);boyBrowR.rotation.z=-.12;

const girlGroup=new THREE.Group();pet.add(girlGroup);
const girlCrest=mesh(new THREE.TorusGeometry(.29,.026,12,52,Math.PI*1.5),accentMat,girlGroup);
girlCrest.position.set(0,1.52,1.02);girlCrest.rotation.z=.25;
const girlSideL=mesh(new THREE.SphereGeometry(.06,18,12),glassMat,girlGroup);girlSideL.position.set(-.72,.92,1.23);
const girlSideR=mesh(new THREE.SphereGeometry(.06,18,12),glassMat,girlGroup);girlSideR.position.set(.72,.92,1.23);

foxGroup.visible=false;pupGroup.visible=false;catGroup.visible=false;birdGroup.visible=false;turtleGroup.visible=false;
boyGroup.visible=true;girlGroup.visible=false;

function configureCompanion(kind='nexus',gender='boy'){
  foxGroup.visible=kind==='fox';
  pupGroup.visible=kind==='pup';
  catGroup.visible=kind==='cat';
  birdGroup.visible=kind==='bird';
  turtleGroup.visible=kind==='turtle';
  boyGroup.visible=gender==='boy';
  girlGroup.visible=gender==='girl';

  pet.traverse(o=>{
    if(o.userData.role==='ear'||o.userData.role==='earInner'){
      o.visible=!['bird','turtle'].includes(kind);
      if(kind==='fox')o.scale.set(.82,1.34,.8);
      else if(kind==='pup')o.scale.set(.4,.58,.6);
      else if(kind==='cat')o.scale.set(.72,1.0,.7);
      else o.scale.set(1,1,1);
    }
    if(o.userData.role==='pod'){
      o.visible=kind!=='bird';
      if(kind==='turtle')o.scale.set(.48,.62,.5);
      else if(kind==='pup')o.scale.set(.9,1.0,.85);
      else o.scale.set(.75,.95,.7);
    }
    if(o.userData.role==='leg'){
      if(kind==='bird')o.scale.set(.46,1.15,.52);
      else if(kind==='turtle')o.scale.set(.58,.48,.85);
      else if(kind==='pup')o.scale.set(.9,1.0,.9);
      else o.scale.set(.78,.92,.8);
    }
    if(o.userData.role==='foot'){
      if(kind==='bird')o.scale.set(.72,.34,.9);
      else if(kind==='turtle')o.scale.set(1.25,.34,1.5);
      else o.scale.set(1.15,.42,1.35);
    }
  });

  if(kind==='fox'){head.scale.set(1.0,.82,.9);body.scale.set(.78,.84,.74);face.scale.set(.96,.68,.8)}
  else if(kind==='pup'){head.scale.set(1.12,.9,1.0);body.scale.set(1.0,.88,.9);face.scale.set(1.06,.76,.9)}
  else if(kind==='cat'){head.scale.set(.98,.84,.9);body.scale.set(.76,.88,.72);face.scale.set(.94,.7,.82)}
  else if(kind==='bird'){head.scale.set(.92,.82,.84);body.scale.set(.62,1.04,.62);face.scale.set(.86,.66,.74)}
  else if(kind==='turtle'){head.scale.set(.86,.76,.82);body.scale.set(1.08,.68,.98);face.scale.set(.82,.6,.72)}
  else {head.scale.set(1.05,.88,.95);body.scale.set(.9,.83,.82);face.scale.set(1.01,.72,.83)}

  // Boy/Girl presentation stays independent of species.
  const gScale=gender==='girl'?0.97:1;
  head.scale.multiplyScalar(gScale);
  if(gender==='girl') face.scale.y*=1.04;
}
const scoutGroup=new THREE.Group();pet.add(scoutGroup);
for(const x of [-1,1]){
  const fin=mesh(new THREE.ConeGeometry(.18,.95,4),shellMat,scoutGroup);
  fin.position.set(x*.93,.9,.05);fin.rotation.z=x*-1.12;fin.rotation.x=.15;
  const finLight=mesh(new THREE.BoxGeometry(.05,.52,.04),accentMat,scoutGroup);
  finLight.position.set(x*.86,.92,.28);finLight.rotation.z=x*-1.05;
}

const guardianGroup=new THREE.Group();pet.add(guardianGroup);
for(const x of [-1,1]){
  const armor=mesh(new THREE.BoxGeometry(.55,.34,.42),shellMat,guardianGroup);
  armor.position.set(x*.92,-.42,.12);armor.rotation.z=x*.16;armor.rotation.y=x*.12;
  const armorLight=mesh(new THREE.BoxGeometry(.34,.045,.06),accentMat,guardianGroup);
  armorLight.position.set(x*.91,-.4,.37);armorLight.rotation.z=x*.16;
}
const guardianVisor=mesh(new THREE.TorusGeometry(.77,.035,12,52,Math.PI),accentMat,guardianGroup);
guardianVisor.position.set(0,.82,1.16);guardianVisor.rotation.z=Math.PI;

const oracleGroup=new THREE.Group();pet.add(oracleGroup);
const oracleHalo1=mesh(new THREE.TorusGeometry(.62,.024,12,72),accentMat,oracleGroup);
oracleHalo1.position.set(0,2.35,0);oracleHalo1.rotation.x=1.18;
const oracleHalo2=mesh(new THREE.TorusGeometry(.47,.018,12,64),accentMat,oracleGroup);
oracleHalo2.position.set(0,2.35,0);oracleHalo2.rotation.set(.45,.3,.1);
const oracleHalo3=mesh(new THREE.TorusGeometry(.31,.014,10,56),accentMat,oracleGroup);
oracleHalo3.position.set(0,2.35,0);oracleHalo3.rotation.set(.2,-.55,.5);
const oracleNode=mesh(new THREE.OctahedronGeometry(.16,1),glassMat,oracleGroup);
oracleNode.position.set(0,2.35,0);

const vanguardGroup=new THREE.Group();pet.add(vanguardGroup);
for(const x of [-1,1]){
  const wing=mesh(new THREE.ConeGeometry(.2,1.18,4),shellMat,vanguardGroup);
  wing.position.set(x*1.03,-.15,-.02);wing.rotation.z=x*-1.0;wing.rotation.x=-.18;
  const wingLight=mesh(new THREE.BoxGeometry(.06,.68,.05),accentMat,vanguardGroup);
  wingLight.position.set(x*.98,-.12,.2);wingLight.rotation.z=x*-1.0;
}
const chestArmor=mesh(new THREE.BoxGeometry(.78,.42,.22),shellMat,vanguardGroup);
chestArmor.position.set(0,-.58,.91);chestArmor.rotation.x=-.08;
const chestReactor=mesh(new THREE.TorusGeometry(.28,.075,16,48),accentMat,vanguardGroup);
chestReactor.position.set(0,-.58,1.06);chestReactor.rotation.x=Math.PI/2;

scoutGroup.visible=false;guardianGroup.visible=false;oracleGroup.visible=false;vanguardGroup.visible=false;

function configureBuild(build){
  scoutGroup.visible=build==='aqua';
  guardianGroup.visible=build==='midnight';
  oracleGroup.visible=build==='pearl';
  vanguardGroup.visible=build==='solar';

  pet.traverse(o=>{
    if(o.userData.role==='ear'){
      if(build==='aqua'){o.scale.set(.68,.68,.68)}
      else if(build==='midnight'){o.scale.set(.62,.72,.72)}
      else if(build==='pearl'){o.scale.set(.82,1.2,.82)}
      else if(build==='solar'){o.scale.set(.72,.9,.72)}
      else{o.scale.set(1,1,1)}
    }
    if(o.userData.role==='earInner'){
      if(build==='aqua'){o.scale.set(.68,.68,.68)}
      else if(build==='midnight'){o.scale.set(.62,.72,.72)}
      else if(build==='pearl'){o.scale.set(.82,1.2,.82)}
      else if(build==='solar'){o.scale.set(.72,.9,.72)}
      else{o.scale.set(1,1,1)}
    }
    if(o.userData.role==='pod'){
      if(build==='aqua')o.scale.set(.46,.72,.52);
      else if(build==='midnight')o.scale.set(1.04,1.18,.9);
      else if(build==='pearl')o.scale.set(.6,.85,.62);
      else if(build==='solar')o.scale.set(.9,1.05,.85);
      else o.scale.set(.75,.95,.7);
    }
  });

  orbGroup.visible=build!=='midnight';
  orbGroup.scale.setScalar(build==='pearl'?1.18:build==='aqua' ? .88:build==='solar'?1.05:1);
  // Cosmetics now layer hardware/material changes without replacing the selected species silhouette.
  core.scale.setScalar(build==='solar'?1.42:build==='midnight' ? .82:build==='pearl' ? .9:1);
  coreBall.scale.setScalar(build==='solar'?1.55:build==='midnight' ? .82:1);
}
const hemi=new THREE.HemisphereLight(0xbfefff,0x071018,2.2);scene.add(hemi);
const key=new THREE.SpotLight(0xffffff,48,20,.45,.45,1.3);key.position.set(-4,5,5);key.castShadow=true;scene.add(key);key.target=pet;
const cyan=new THREE.PointLight(0x42e8ff,26,8,1.8);cyan.position.set(2.7,1.2,3.4);scene.add(cyan);
const rim=new THREE.PointLight(0x5f6cff,18,8,1.8);rim.position.set(-3,1,-2);scene.add(rim);
const under=new THREE.PointLight(0x20dfff,14,5,2);under.position.set(0,-1.3,1.7);scene.add(under);

let targetRotY=0,targetRotX=0,dragging=false,lastX=0,lastY=0;
let pointerX=0,pointerY=0,boost=0,lastInteract=0;

renderer.domElement.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture?.(e.pointerId);lastInteract=performance.now()});
renderer.domElement.addEventListener('pointermove',e=>{
  const r=renderer.domElement.getBoundingClientRect();
  pointerX=((e.clientX-r.left)/r.width-.5)*2;pointerY=((e.clientY-r.top)/r.height-.5)*2;
  if(dragging){targetRotY+=(e.clientX-lastX)*.012;targetRotX+=(e.clientY-lastY)*.006;targetRotX=Math.max(-.28,Math.min(.28,targetRotX));lastX=e.clientX;lastY=e.clientY;lastInteract=performance.now()}
});
renderer.domElement.addEventListener('pointerup',e=>{dragging=false;renderer.domElement.releasePointerCapture?.(e.pointerId)});
renderer.domElement.addEventListener('pointercancel',()=>dragging=false);
renderer.domElement.addEventListener('dblclick',()=>{targetRotY=0;targetRotX=0});
renderer.domElement.addEventListener('click',()=>{
  boost=1;lastInteract=performance.now();
  window.dispatchEvent(new CustomEvent('xrpet:petInteract'));
});

function setAppearance(detail={}){
  current=detail.cosmetic||current;
  configureCompanion(detail.companionKind||'nexus',detail.companionGender||'boy');
  configureBuild(current);
  const p=palette[current]||palette.classic;
  shellMat.color.setHex(p.shell);darkMat.color.setHex(p.dark);accentMat.color.setHex(p.accent);accentMat.emissive.setHex(p.accent);glassMat.color.setHex(p.glass);
  const room=detail.room||'nexus';
  const rooms={
    nexus:[0x42e8ff,0x5f6cff,1.25],
    ocean:[0x2bdfff,0x087ba6,1.18],
    vault:[0xd6b35a,0x6a5420,1.0],
    aurora:[0x6af2ff,0xa488ff,1.3],
    legend:[0xffd56c,0x805cff,1.38]
  };
  const rp=rooms[room]||rooms.nexus;cyan.color.setHex(rp[0]);rim.color.setHex(rp[1]);renderer.toneMappingExposure=rp[2];
}
window.addEventListener('xrpet:appearance',e=>setAppearance(e.detail||{}));
window.XRPet3D={setAppearance,react(){boost=1},reset(){targetRotX=0;targetRotY=0}};
host.querySelector('.companion3d-loading')?.remove();
window.dispatchEvent(new CustomEvent('xrpet:3d-ready'));

function resize(){
  const r=host.getBoundingClientRect();
  const w=Math.max(1,r.width),h=Math.max(1,r.height);
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(host);resize();

const clock=new THREE.Clock();
function animate(){
  const t=clock.getElapsedTime();
  pet.rotation.y+=(targetRotY-pet.rotation.y)*.08;
  pet.rotation.x+=(targetRotX-pet.rotation.x)*.08;
  if(!dragging && performance.now()-lastInteract>1800) targetRotY=Math.sin(t*.35)*.18;
  pet.position.y=.28+Math.sin(t*1.7)*.035+boost*.08;
  pet.rotation.z=Math.sin(t*.8)*.018;
  orbGroup.rotation.y=t*.7;orbit1.rotation.z=t*.65;orbit2.rotation.z=-t*.8;oracleHalo1.rotation.z=t*.32;oracleHalo2.rotation.z=-t*.41;oracleHalo3.rotation.z=t*.53;scoutGroup.rotation.y=Math.sin(t*.8)*.03;vanguardGroup.rotation.y=Math.sin(t*.55)*.025;foxGroup.rotation.z=Math.sin(t*1.15)*.025;catGroup.rotation.z=Math.sin(t*.9)*.018;birdGroup.rotation.z=Math.sin(t*1.8)*.035;turtleGroup.rotation.y=Math.sin(t*.5)*.02;
  baseRing.rotation.z=t*.16;innerRing.rotation.z=-t*.22;
  pupils.forEach((p,i)=>{const baseX=i===0?-.48:.48;p.position.x=baseX+pointerX*.045;p.position.y=.78-pointerY*.035});
  eyes.forEach((e,i)=>{e.scale.y=1-Math.max(0,Math.sin(t*.47+2.7))**36*.82});
  if(boost>0){boost*=.9;pet.scale.setScalar(.82+boost*.04);accentMat.emissiveIntensity=2.4+boost*4}else{pet.scale.lerp(new THREE.Vector3(.82,.82,.82),.1);accentMat.emissiveIntensity+=(2.4-accentMat.emissiveIntensity)*.1}
  renderer.render(scene,camera);requestAnimationFrame(animate);
}
animate();
