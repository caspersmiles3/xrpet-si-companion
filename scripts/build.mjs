import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';

await mkdir('public',{recursive:true});
await mkdir('public/vendor',{recursive:true});
await mkdir('public/media',{recursive:true});

await copyFile('src/app.js','public/app.js');
await copyFile('node_modules/three/build/three.module.js','public/vendor/three.module.js');

const launchParts=[
  'scripts/launch-bg/part00.txt',
  'scripts/launch-bg/part01.txt',
  'scripts/launch-bg/part02.txt'
];
const launchBase64=(await Promise.all(launchParts.map(path=>readFile(path,'utf8'))))
  .map(part=>part.trim())
  .join('');
await writeFile('public/media/xrpet-launch-bg.mp4',Buffer.from(launchBase64,'base64'));

console.log('XRPet client, Three.js module, and looping launch background built');
