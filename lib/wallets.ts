import 'server-only';
import {Keypair,Horizon,TransactionBuilder,Networks,Config,StrKey} from '@stellar/stellar-sdk';
import {database} from './server';
import {encryptSecret} from './security';
import {welcomeTransaction} from './stellar-transactions';
Config.setTimeout(8000);
const horizon=new Horizon.Server('https://horizon-testnet.stellar.org');
export const stellarConfigured=()=>!!process.env.STELLAR_SECRET_KEY&&StrKey.isValidEd25519SecretSeed(process.env.STELLAR_SECRET_KEY)&&/^[a-f\d]{64}$/i.test(process.env.WALLET_ENCRYPTION_KEY??'');
export async function processWallet(id:string){
 const sql=database();
 if(!stellarConfigured()){await sql`update wallet_jobs set last_error='Wallet activation is waiting for organizer configuration.',next_attempt_at=now()+interval '5 minutes' where participant_id=${id} and confirmed_at is null`;return;}
 try{
 // Keep every source-account sequence allocation on the same global lock.
 // Signed transactions are durable before any network submission.
 const job=await sql.begin(async tx=>{
 await tx`select pg_advisory_xact_lock(684271)`;
 let [job]=await tx`select * from wallet_jobs where participant_id=${id} for update`;
 if(!job||job.confirmed_at)return job;
 if(!job.transaction_xdr){
 const [pendingWallet]=await tx`select participant_id from wallet_jobs where transaction_xdr is not null and confirmed_at is null and participant_id<>${id} limit 1`;
 const [pendingReward]=await tx`select participant_id from rewards where confirmed_at is null limit 1`;
 if(pendingWallet||pendingReward)throw new Error('Treasury is reconciling an earlier transaction.');
 const key=Keypair.random();const treasury=Keypair.fromSecret(process.env.STELLAR_SECRET_KEY!);const source=await horizon.loadAccount(treasury.publicKey());
 const transaction=welcomeTransaction(source,treasury,key.publicKey());
 [job]=await tx`update wallet_jobs set public_key=${key.publicKey()},encrypted_secret=${encryptSecret(key.secret())},transaction_xdr=${transaction.toXDR()},transaction_hash=${transaction.hash().toString('hex')},attempts=attempts+1,last_error=null where participant_id=${id} returning *`;
 }
 return job;
 });
 if(!job||job.confirmed_at)return;
 let confirmed=false;
 try{const receipt=await horizon.transactions().transaction(job.transaction_hash).call();if(!receipt.successful)throw new Error('Recorded transaction failed.');confirmed=receipt.successful;}catch{}
 if(!confirmed){const receipt=await horizon.submitTransaction(TransactionBuilder.fromXDR(job.transaction_xdr,Networks.TESTNET));if(!receipt.successful)throw new Error('Transaction not confirmed.');}
 await sql`update wallet_jobs set confirmed_at=now(),last_error=null where participant_id=${id}`;
 }catch{
 // Never store network payloads, XDR, keys, or provider errors in user-visible errors.
 await sql`update wallet_jobs set attempts=attempts+1,last_error='Activation is pending. We will retry safely.',next_attempt_at=now()+interval '2 minutes' where participant_id=${id} and confirmed_at is null`;
 }
}
export async function processPendingWallets(){const jobs=await database()`select participant_id from wallet_jobs where confirmed_at is null and next_attempt_at<=now() order by (transaction_xdr is not null) desc,created_at limit 2`;for(const job of jobs)await processWallet(job.participant_id);return jobs.length;}
