import {readFile,writeFile,chmod} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {Keypair,StrKey} from '@stellar/stellar-sdk';
import postgres from 'postgres';

async function main(){
 const envPath=new URL('../.env.local',import.meta.url);
 if(!existsSync(envPath))throw new Error('Connect the database first with npm run db:connect.');
 process.loadEnvFile(envPath);
 if(!process.env.DATABASE_URL)throw new Error('Connect the database first with npm run db:connect.');
 const sql=postgres(process.env.DATABASE_URL,{max:1,prepare:false,connect_timeout:10,onnotice:()=>{}});
 try{
  const [stored]=await sql`select count(*)::integer as count from wallet_jobs where encrypted_secret is not null`;
  if(!process.env.WALLET_ENCRYPTION_KEY&&stored.count>0)throw new Error('Existing encrypted wallets were found. Restore the original WALLET_ENCRYPTION_KEY from your backup; this helper will not replace it.');
  if(process.env.WALLET_ENCRYPTION_KEY&&!/^[a-f\d]{64}$/i.test(process.env.WALLET_ENCRYPTION_KEY))throw new Error('WALLET_ENCRYPTION_KEY has an invalid format. Restore its correct value before retrying.');
  if(process.env.STELLAR_SECRET_KEY&&!StrKey.isValidEd25519SecretSeed(process.env.STELLAR_SECRET_KEY))throw new Error('STELLAR_SECRET_KEY has an invalid format. Correct it privately before retrying.');
  const treasury=process.env.STELLAR_SECRET_KEY?Keypair.fromSecret(process.env.STELLAR_SECRET_KEY):Keypair.random();
  const values={STELLAR_SECRET_KEY:treasury.secret(),WALLET_ENCRYPTION_KEY:process.env.WALLET_ENCRYPTION_KEY||randomBytes(32).toString('hex'),CRON_SECRET:process.env.CRON_SECRET||randomBytes(32).toString('hex')};
  let env=await readFile(envPath,'utf8');
  for(const [name,value]of Object.entries(values)){
   const matcher=new RegExp(`^(?:export\\s+)?${name}\\s*=.*$`,'gm');
   const line=`${name}=${JSON.stringify(value)}`;
   env=matcher.test(env)?env.replace(matcher,()=>line):env+(env.endsWith('\n')?'':'\n')+line+'\n';
  }
  // Persist BEFORE funding, so a timeout/retry always uses the same treasury.
  await writeFile(envPath,env,{mode:0o600});await chmod(envPath,0o600);
  console.log('Testnet treasury and encryption settings saved privately. Existing keys and DATABASE_URL preserved.');
  const accountUrl='https://horizon-testnet.stellar.org/accounts/'+treasury.publicKey();
  let response=await fetch(accountUrl,{signal:AbortSignal.timeout(15000)});
  if(response.status===404){
   console.log('Funding the Testnet treasury with Stellar Friendbot…');
   const faucet=new URL('https://friendbot.stellar.org/');faucet.searchParams.set('addr',treasury.publicKey());
   // Only the PUBLIC address is sent. The seed never leaves .env.local/the server.
   const funded=await fetch(faucet,{method:'POST',signal:AbortSignal.timeout(30000)});
   if(!funded.ok)throw new Error('Friendbot funding is temporarily unavailable. Run npm run wallet:setup again; saved keys will be reused.');
   response=await fetch(accountUrl,{signal:AbortSignal.timeout(15000)});
  }
  if(!response.ok)throw new Error('Unable to confirm the treasury on Stellar Testnet. Run npm run wallet:setup again.');
  const account=await response.json();
  if(!Array.isArray(account.balances))throw new Error('Unable to confirm the treasury on Stellar Testnet. Run npm run wallet:setup again.');
  const native=account.balances.find(balance=>balance.asset_type==='native');
  if(!native||Number(native.balance)<4)throw new Error('The Testnet treasury needs more test XLM before it can activate wallets. Top it up in Stellar Lab, then retry.');
  await sql`update wallet_jobs set next_attempt_at=now(),last_error=null where confirmed_at is null`;
  console.log('Testnet treasury confirmed. Pending wallets are ready to retry.');
  console.log('Restart npm run dev. Sign in and choose Retry activation on your Karga wallet.');
  console.log('Testnet XLM has no monetary value. No private keys were printed.');
 }finally{await sql.end({timeout:3});}
}
main().catch(error=>{
 const allowed=['Connect the database','Existing encrypted','WALLET_ENCRYPTION_KEY','STELLAR_SECRET_KEY','Friendbot funding','Unable to confirm','The Testnet treasury'];
 console.error(allowed.some(prefix=>error.message?.startsWith(prefix))?error.message:'Wallet setup could not reach the database or Stellar Testnet. Check your internet connection and rerun npm run wallet:setup. Saved keys will be reused; no credentials were printed.');
 process.exitCode=1;
});
