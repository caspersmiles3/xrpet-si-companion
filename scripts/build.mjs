import { copyFile, mkdir, readFile, writeFile, readdir } from 'node:fs/promises';

await mkdir('public',{recursive:true});
await mkdir('public/vendor',{recursive:true});
await mkdir('public/media',{recursive:true});

const packageJson=JSON.parse(await readFile('package.json','utf8'));
let indexHtml=await readFile('public/index.html','utf8');
indexHtml=indexHtml
  .replace(/data-xrpet-build="[^"]+"/,'data-xrpet-build="'+packageJson.version+'"')
  .replace(/\?v=\d+\.\d+\.\d+/g,'?v='+packageJson.version);
await writeFile('public/index.html',indexHtml);

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



console.log('XRPet client and center launch video built');
