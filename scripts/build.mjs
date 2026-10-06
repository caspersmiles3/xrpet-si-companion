import { copyFile, mkdir } from 'node:fs/promises';
await mkdir('public',{recursive:true});
await copyFile('src/app.js','public/app.js');
console.log('XRPet browser client copied to public/app.js');
