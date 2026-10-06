import { copyFile, mkdir } from 'node:fs/promises';
await mkdir('public',{recursive:true});
await mkdir('public/vendor',{recursive:true});
await copyFile('src/app.js','public/app.js');
await copyFile('node_modules/three/build/three.module.js','public/vendor/three.module.js');
console.log('XRPet client and local Three.js module built');
