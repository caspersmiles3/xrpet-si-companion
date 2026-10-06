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

// Physically based reflection environment. Failure here never blocks the companion.
(async()=>{
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

// lighting
scene.add(new THREE.HemisphereLight(0xc9f6ff,0x061017,2.1));
const key=new THREE.SpotLight(0xffffff,44,20,.5,.5,1.3);key.position.set(-4,5,5);key.castShadow=true;scene.add(key);key.target=pet;
const fill=new THREE.PointLight(0x45e8ff,24,9,1.7);fill.position.set(2.9,1.3,3.6);scene.add(fill);
const rim=new THREE.PointLight(0x6b6dff,17,8,1.7);rim.position.set(-3.1,1.2,-2.1);scene.add(rim);
const under=new THREE.PointLight(0x35ddff,10,5,2);under.position.set(0,-1.2,1.8);scene.add(under);
const faceFill=new THREE.PointLight(0xffffff,7.5,7,2);faceFill.position.set(0,1.8,3.8);scene.add(faceFill);
const sideWarm=new THREE.PointLight(0x9ad7ff,5.5,7,2);sideWarm.position.set(3.4,-.2,-.8);scene.add(sideWarm);


// state
const BUILTIN_MODELS={
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

let currentKind='nexus', currentGender='boy', currentCosmetic='classic';
let targetRotY=0,targetRotX=0,dragging=false,lastX=0,lastY=0,pointerX=0,pointerY=0,boost=0,lastInteract=0;
let action='idle',actionUntil=0,externalModel=null,externalMixer=null,externalKind=null,externalActions={},externalActiveAction=null,externalLoadToken=0,externalLoadingKind=null,externalLoadingPromise=null;
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
    nexus:{metalness:.72,roughness:.22,clearcoat:1,darkMetal:.82,darkRough:.18},
    fox:{metalness:.28,roughness:.5,clearcoat:.34,darkMetal:.24,darkRough:.55},
    pup:{metalness:.24,roughness:.54,clearcoat:.3,darkMetal:.22,darkRough:.58},
    cat:{metalness:.3,roughness:.46,clearcoat:.38,darkMetal:.28,darkRough:.5},
    bird:{metalness:.38,roughness:.36,clearcoat:.48,darkMetal:.32,darkRough:.44},
    turtle:{metalness:.34,roughness:.43,clearcoat:.42,darkMetal:.3,darkRough:.48}
  };
  const p=profiles[kind]||profiles.nexus;
  const detail=kind==='nexus'?detailTextures.metal:kind==='bird'?detailTextures.feather:kind==='turtle'?detailTextures.shell:detailTextures.fur;
  shellMat.metalness=p.metalness;shellMat.roughness=p.roughness;shellMat.clearcoat=p.clearcoat;
  shellDarkMat.metalness=p.darkMetal;shellDarkMat.roughness=p.darkRough;
  shellMat.bumpMap=detail;shellDarkMat.bumpMap=detail;softMat.bumpMap=detail;
  shellMat.bumpScale=kind==='nexus'?.018:kind==='turtle'?.026:.032;
  shellDarkMat.bumpScale=kind==='nexus'?.014:.025;softMat.bumpScale=.022;
  shellMat.roughnessMap=detail;shellDarkMat.roughnessMap=detail;
  shellMat.needsUpdate=true;shellDarkMat.needsUpdate=true;softMat.needsUpdate=true;
}

function configureSpecies(kind){
  currentKind=species[kind]?kind:'nexus';
  applySurfaceProfile(currentKind);
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
  externalGender.boy.visible=currentGender==='boy';externalGender.girl.visible=currentGender==='girl';
  // deliberately visible but subtle presentation differences
  if(currentGender==='girl'){
    head.scale.multiplyScalar(.97);face.scale.y*=1.04;
    eyes.forEach(e=>e.scale.y=1.02);
  }
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
}
function applyRoom(room){
  const rooms={
    nexus:[0x43e8ff,0x696cff,1.18],
    ocean:[0x55e9ff,0x1289aa,1.12],
    vault:[0xd8b76b,0x6c5220,1.02],
    aurora:[0x79f1ff,0xaa8cff,1.23],
    legend:[0xf0ce73,0x7b5cff,1.27]
  };
  const r=rooms[room]||rooms.nexus;
  fill.color.setHex(r[0]);rim.color.setHex(r[1]);sideWarm.color.setHex(r[0]);
  faceFill.intensity=room==='vault'?6.2:room==='legend'?8.2:7.5;
  renderer.toneMappingExposure=r[2];
}
function performAction(name='greet'){
  const allowed=new Set(['greet','celebrate','alert','sleep','wake','happy','focus','scan','orbit']);
  action=allowed.has(name)?name:'greet';
  actionUntil=performance.now()+(action==='sleep'?12000:action==='orbit'?5200:action==='scan'?3200:action==='focus'?4200:action==='celebrate'?2600:action==='alert'?2200:1800);
  lastInteract=performance.now();
  if(action==='wake')actionUntil=performance.now()+700;
  if(action==='happy'||action==='greet'||action==='celebrate')boost=1;
  playExternalAction(action);
}
function currentAction(){
  if(action!=='idle'&&performance.now()>actionUntil){action='idle'}
  return action;
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
  externalActions={};externalActiveAction=null;
  externalModel=gltf.scene;
  externalKind=options.kind||null;
  externalModel.userData.xrpetActionMap=options.actions||{};

  externalModel.traverse(o=>{
    if(o.isMesh){
      o.castShadow=true;o.receiveShadow=true;
      if(o.material){
        const mats=Array.isArray(o.material)?o.material:[o.material];
        mats.forEach(mat=>{
          if('envMapIntensity'in mat)mat.envMapIntensity=1.15;
          if('roughness'in mat)mat.roughness=Math.max(.2,Math.min(.78,mat.roughness));
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

  pet.visible=false;holo.visible=true;externalPresentation.visible=true;
  externalMixer=gltf.animations?.length?new THREE.AnimationMixer(externalModel):null;
  if(externalMixer){
    for(const clip of gltf.animations)externalActions[clip.name]=externalMixer.clipAction(clip);
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
    idle:['idle','survey','standing','fly'],
    greet:['wave','yes','idle','survey','fly'],
    happy:['thumbsup','yes','dance','survey','walk','fly'],
    celebrate:['dance','run','yes','thumbsup','fly'],
    alert:['run','walk','no','survey','fly'],
    sleep:['sitting','idle','survey'],
    wake:['standing','idle','survey','fly'],
    focus:['idle','survey','standing'],
    scan:['survey','walk','fly','idle'],
    orbit:['dance','run','walk','fly','survey']
  };
  const custom=externalModel?.userData?.xrpetActionMap||{};
  const patterns=(custom[name]&&custom[name].length?custom[name]:fallback[name])||fallback.idle;
  const next=findExternalAction(patterns);
  if(!next||next===externalActiveAction)return;
  next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(.18).play();
  if(externalActiveAction)externalActiveAction.fadeOut(.18);
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
  externalMixer=null;externalKind=null;externalActions={};externalActiveAction=null;externalLoadingKind=null;externalLoadingPromise=null;
  pet.visible=true;externalPresentation.visible=false;
  window.dispatchEvent(new CustomEvent('xrpet:model-ready',{detail:{kind,mode:'procedural',animations:[],credit:''}}));
}

function setAppearance(detail={}){
  const kind=detail.companionKind||currentKind;
  configureSpecies(kind);
  configureGender(detail.companionGender||currentGender);
  configureCosmetic(detail.cosmetic||currentCosmetic);
  applyRoom(detail.room||'nexus');
  if(BUILTIN_MODELS[kind]){
    window.dispatchEvent(new CustomEvent('xrpet:model-loading',{detail:{kind}}));
    ensureBuiltInModel(kind);
  }else useProceduralModel(kind);
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
  performAction('happy');window.dispatchEvent(new CustomEvent('xrpet:petInteract'));
});

window.XRPet3D={
  setAppearance,
  react(type='happy'){performAction(type)},
  perform:performAction,
  celebrate(){performAction('celebrate')},
  alert(){performAction('alert')},
  sleep(){performAction('sleep')},
  wake(){performAction('wake')},
  loadModel:loadExternalModel,
  useProcedural:useProceduralModel,
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
  const dt=Math.min(.05,clock.getDelta());
  const t=clock.elapsedTime;
  const idle=performance.now()-lastInteract>1600;
  const beforeAction=action;const state=currentAction();
  if(beforeAction!=='idle'&&state==='idle')playExternalAction('idle');

  if(externalMixer)externalMixer.update(dt);
  if(externalModel){
    const extSleep=state==='sleep',extCelebrate=state==='celebrate',extAlert=state==='alert',extFocus=state==='focus',extScan=state==='scan',extOrbit=state==='orbit';
    const baseY=externalModel.userData.xrpetBaseY??0;
    externalModel.position.y=baseY+(extSleep?-.06:0)+Math.sin(t*(extSleep?.65:1.15))*(extSleep?.012:.026)+(extCelebrate?Math.abs(Math.sin(t*6))*.06:0);
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
  const greeting=state==='greet'||state==='happy';

  // levitation and body life
  let lift=.1+Math.sin(t*(sleeping?.72:1.25))*(sleeping?.018:.035);
  if(celebrating)lift+=Math.abs(Math.sin(t*8))*0.14;
  if(orbiting)lift+=.07+Math.sin(t*2.4)*.04;
  if(greeting)lift+=Math.abs(Math.sin(t*5))*0.045;
  pet.position.y=lift+boost*.06;
  chestPanel.position.y=-.3+Math.sin(t*(sleeping?.8:1.65))*(sleeping?.004:.009);

  // head follows the pointer and has small natural micro-movements
  const headFollowX=sleeping?.13:pointerY*.055;
  const headFollowY=sleeping?0:pointerX*.085;
  head.rotation.x+=(headFollowX-head.rotation.x)*.065;
  head.rotation.y+=(headFollowY-head.rotation.y)*.065;
  head.rotation.z+=( (sleeping?.08:Math.sin(t*.48)*.012) - head.rotation.z)*.07;
  if(greeting)head.rotation.z+=Math.sin(t*4)*.018;

  // eye tracking + pupil response
  pupils.forEach((p,i)=>{
    const bx=i===0?-.42:.42;
    p.position.x=bx+(sleeping?0:pointerX*.043);
    p.position.y=1.11-(sleeping?0:pointerY*.034);
    const ps=alerting?1.12:sleeping?.82:1;
    p.scale.set(.74*ps,1*ps,.4);
  });

  const naturalBlink=Math.max(0,Math.sin(t*.43+2.45))**42;
  const lidClose=sleeping?.96:naturalBlink*.72;
  lids.forEach(l=>l.scale.y=.16+lidClose);

  // expressive mouth/core
  mouth.scale.x=greeting?1.28:alerting?.9:sleeping?.82:1;
  mouth.scale.y=greeting?1.14:1;
  coreRing.rotation.z=celebrating?t*2.1:Math.sin(t*.5)*.02;
  coreBall.scale.setScalar((currentCosmetic==='solar'?1.45:1)*(alerting?1.18:celebrating?1.24:1));

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
  cosmeticGroups.resonance.rotation.y=orbiting?t*.8:0;
  orbGroup.rotation.y=t*(alerting?1.35:.7);orbit1.rotation.z=t*(celebrating?1.5:.62);orbit2.rotation.z=-t*(celebrating?1.7:.78);
  holoRing.rotation.z=t*(alerting?.34:.15);holoRing2.rotation.z=-t*(alerting?.45:.21);

  const targetEmissive=scanning?5.2:orbiting?4.6:focusing?3.8:alerting?4.2:celebrating?5.4:greeting?3.4:currentCosmetic==='resonance'?3.2:2.5;
  accentMat.emissiveIntensity+=(targetEmissive-accentMat.emissiveIntensity)*.12;

  if(boost>0){
    boost*=.89;pet.scale.setScalar(.82+boost*.04);
  }else{
    pet.scale.lerp(new THREE.Vector3(.82,.82,.82),.1);
  }

  renderer.render(scene,camera);
  requestAnimationFrame(animate);
}
animate();
