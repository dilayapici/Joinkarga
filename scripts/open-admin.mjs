import {spawnSync} from 'node:child_process';
import nextEnv from '@next/env';
import {checkLocalAdmin} from './admin-diagnostic.mjs';
async function main(){
 nextEnv.loadEnvConfig(process.cwd(),true,{info:()=>{},error:()=>{}});
 const password=process.env.ORGANIZER_PASSWORD;
 if(!password||password.length<16){console.error('Organizer password is not configured. Run npm run admin:setup, restart Karga, then run npm run admin:open.');process.exitCode=1;return;}
 console.log('Checking the running Karga server. No passwords or session cookies will be printed.');
 const result=await checkLocalAdmin(password);
 console.log(result.code+': '+result.message);
 if(!result.ok){process.exitCode=1;return;}
 if(process.platform==='darwin'){
  // Open the page first, then set the clipboard, so the next paste is the password.
  const opened=spawnSync('/usr/bin/open',[result.browserUrl??result.url],{stdio:'ignore'});
  if(result.browserUrl&&opened.status===0){console.log(result.url);console.log('Opening a single-use local organizer sign-in. No password pasting is needed. The link expires after 2 minutes.');return;}
  const copied=spawnSync('/usr/bin/pbcopy',[],{input:password,encoding:'utf8'});
  console.log(result.url);
  if(copied.status!==0){console.error('The dashboard is reachable, but clipboard access failed. Run this command in your Mac’s own Terminal.');process.exitCode=1;return;}
  console.log('Organizer password copied. Click the password field, press Command+V, then Open dashboard.');
  if(opened.status!==0)console.log('Open the displayed URL manually; do not copy other text before pasting the password.');
 }else console.log('Open '+result.url+' and use the organizer password configured in your environment.');
}
main().catch(()=>{console.error('Admin diagnostic failed. Check the local server and environment configuration. No credentials were printed.');process.exitCode=1;});
