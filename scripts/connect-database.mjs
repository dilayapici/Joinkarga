import {spawnSync} from 'node:child_process';
import {createInterface} from 'node:readline/promises';
import {readFile,writeFile,chmod} from 'node:fs/promises';
import postgres from 'postgres';
import {databaseUrlFromClipboard} from './database-url.mjs';

// Credentials are read from the local clipboard, never command arguments/logs.
async function main(){
 if(process.platform!=='darwin')throw new Error('This helper uses the macOS clipboard. On other systems, set DATABASE_URL privately in .env.local, then run npm run db:setup.');
 let url;
 const prompt=process.stdin.isTTY?createInterface({input:process.stdin,output:process.stdout}):null;
 try{
  while(!url){
   if(prompt)await prompt.question('Copy the connection string from Neon now (a psql command is also OK). Do not paste it here. Return here and press Enter: ');
   const clipboard=spawnSync('/usr/bin/pbpaste',[],{encoding:'utf8',maxBuffer:16384});
   if(clipboard.status!==0)throw new Error('Unable to read the clipboard. Copy the PostgreSQL connection string from Neon first.');
   try{url=databaseUrlFromClipboard(clipboard.stdout);}catch(error){if(!prompt)throw error;console.log(error.message);console.log('Try copying again, then press Enter. Press Control+C to cancel.');}
  }
 }finally{prompt?.close();}
 // Next.js expands dollar signs in dotenv values. URL-encoding preserves them.
 const connection=url.toString().replace(/\$/g,'%24');
 const sql=postgres(connection,{max:1,prepare:false,connect_timeout:10,onnotice:()=>{}});
 try{
  await sql`select 1`;
  await sql.unsafe(await readFile(new URL('./schema.sql',import.meta.url),'utf8'));
  // Roll back a complete registration storage check: never leave fake users.
  const id=crypto.randomUUID(),email=`karga-check-${id}@example.invalid`;
  let checked=false;
  await sql.begin(async tx=>{
   await tx`insert into participants(id,session_hash,name,email,password_hash) values(${id},${crypto.randomUUID()},'Database check',${email},'temporary-check-not-a-login-hash')`;
   await tx`insert into wallet_jobs(participant_id) values(${id})`;
   await tx`insert into participant_sessions(token_hash,participant_id) values(${crypto.randomUUID()},${id})`;
   const [row]=await tx`select p.id from participants p join wallet_jobs w on w.participant_id=p.id join participant_sessions s on s.participant_id=p.id where p.id=${id}`;
   checked=row?.id===id;
   // postgres.js rolls back on a thrown error, caught only for this sentinel.
   throw new Error('KARGA_CHECK_ROLLBACK');
  }).catch(error=>{if(error.message!=='KARGA_CHECK_ROLLBACK')throw error;});
  if(!checked)throw new Error('Registration table check failed.');
  const [remaining]=await sql`select count(*)::integer as count from participants where id=${id}`;
  if(remaining.count!==0)throw new Error('Database check did not roll back.');
  const path=new URL('../.env.local',import.meta.url);
  let existing='';try{existing=await readFile(path,'utf8');}catch(error){if(error.code!=='ENOENT')throw error;}
  const line=`DATABASE_URL=${JSON.stringify(connection)}`;
  const next=/^(?:export\s+)?DATABASE_URL\s*=.*$/m.test(existing)?existing.replace(/^(?:export\s+)?DATABASE_URL\s*=.*$/gm,()=>line):`${existing}${existing&&!existing.endsWith('\n')?'\n':''}${line}\n`;
  await writeFile(path,next,{mode:0o600});await chmod(path,0o600);
  console.log('Connected to Neon. Schema applied. Registration storage check passed and rolled back.');
  console.log('DATABASE_URL saved privately to .env.local; existing settings preserved.');
  console.log('Restart npm run dev, then sign up in your browser.');
  console.log('The real HTTP signup flow still needs browser verification. Stellar activation needs its separate server configuration.');
 }finally{await sql.end({timeout:5});}
}
main().catch(error=>{
 // Do not print raw database/provider errors: they can contain connection details.
 const safeMessages=['This helper','Unable to read','The clipboard','The copied','The database URL','Copy the full','Expected a Neon','Registration table','Database check'];
 if(safeMessages.some(prefix=>error.message?.startsWith(prefix)))console.error(error.message);
 else console.error('Database setup failed. Check that the copied Neon URL is correct and your Mac can reach the database. No credentials were printed.');
 process.exitCode=1;
});
