import { copyFile, mkdir, readFile, writeFile, readdir } from 'node:fs/promises';

await mkdir('public',{recursive:true});
await mkdir('public/vendor',{recursive:true});
await mkdir('public/media',{recursive:true});

await copyFile('src/app.js','public/app.js');
await copyFile('node_modules/three/build/three.module.js','public/vendor/three.module.js');

const launchDir='scripts/launch-bg';
const launchParts=(await readdir(launchDir))
  .filter(name=>/^part\d+\.txt$/.test(name))
  .sort()
  .map(name=>launchDir+'/'+name);

if(launchParts.length!==25){
  throw new Error('Expected 25 launch-video parts, found '+launchParts.length);
}
const launchBase64=(await Promise.all(launchParts.map(path=>readFile(path,'utf8'))))
  .map(part=>part.trim())
  .join('');
await writeFile('public/media/xrpet-launch-bg.mp4',Buffer.from(launchBase64,'base64'));

console.log('XRPet client, Three.js module, and replacement 960x720 launch video built from '+launchParts.length+' parts');
