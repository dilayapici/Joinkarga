import {readFile,writeFile,chmod} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {spawnSync} from 'node:child_process';
async function main(){
 if(process.platform!=='darwin')throw new Error('On this system, privately set ORGANIZER_PASSWORD to a random value of at least 16 characters in .env.local, then restart Karga.');
 const path=new URL('../.env.local',import.meta.url);if(existsSync(path))process.loadEnvFile(path);
 if(!process.env.DATABASE_URL)throw new Error('Connect your database first with npm run db:connect.');
 const existing=process.env.ORGANIZER_PASSWORD;
 if(existing&&existing.length<16)throw new Error('Your existing ORGANIZER_PASSWORD must have at least 16 characters. Update it privately; the setup command will not overwrite it.');
 const password=existing||randomBytes(24).toString('base64url');let env=existsSync(path)?await readFile(path,'utf8'):'';
 const line='ORGANIZER_PASSWORD='+JSON.stringify(password);const matcher=/^(?:export\s+)?ORGANIZER_PASSWORD\s*=.*$/gm;
 env=matcher.test(env)?env.replace(matcher,()=>line):env+(env.endsWith('\n')?'':'\n')+line+'\n';
 await writeFile(path,env,{mode:0o600});await chmod(path,0o600);
 const copied=spawnSync('/usr/bin/pbcopy',[],{input:password,encoding:'utf8'});
 if(copied.status!==0)throw new Error('Organizer password saved privately, but clipboard access is unavailable here. Run npm run admin:setup directly in your Mac’s Terminal.');
 console.log('Organizer password saved privately and copied to your clipboard. No password was printed.');
 console.log('Restart npm run dev, open http://localhost:3000/admin and paste the password into the organizer sign-in form.');
 console.log('Keep the password in your password manager. Existing credentials and database settings were preserved.');
}
main().catch(error=>{const safe=['On this system','Connect your database','Your existing','Organizer password saved'];console.error(safe.some(prefix=>error.message?.startsWith(prefix))?error.message:'Admin setup failed. Check local file permissions. No credentials were printed.');process.exitCode=1;});
