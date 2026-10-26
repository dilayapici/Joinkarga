import {validRequestOrigin} from '@/lib/request-origin';
import {NextRequest,NextResponse,after} from 'next/server';
import {database,participant,signup,login,logout,authLimit,organizer,hash} from '@/lib/server';
import {actions} from '@/lib/domain';
import {z} from 'zod';
import {journeySchema,journeyEstimate} from '@/lib/journey';
import {resolveFlight} from '@/lib/flight';
import {reconcileReward} from '@/lib/reconcile-reward';
import {Keypair,Horizon,TransactionBuilder,Networks,Operation,Asset,BASE_FEE,StrKey,Memo} from '@stellar/stellar-sdk';
import {processWallet,processPendingWallets,stellarConfigured} from '@/lib/wallets';
export const runtime='nodejs';
export const maxDuration=60;
const horizon=new Horizon.Server('https://horizon-testnet.stellar.org');
export async function GET(){
 try {if(!process.env.DATABASE_URL)return NextResponse.json({configured:false,stellarConfigured:stellarConfigured(),leaderboard:[],me:null,verifications:[],reward:null,wallet:null,footprint:null});
 const sql=database();let me=null;try{me=await participant();}catch{}
 const leaderboard=await sql`select p.id,p.name,coalesce(sum(v.points),0)::integer as points from participants p left join verifications v on v.participant_id=p.id and v.verified_at is not null group by p.id order by points desc,p.created_at asc limit 20`;
 const verifications=me?await sql`select id,action,points,verified_at from verifications where participant_id=${me.id}`:[];
 const [reward]=me?await sql`select transaction_hash,confirmed_at from rewards where participant_id=${me.id}`:[];
 const [wallet]=me?await sql`select public_key,transaction_hash,confirmed_at,last_error from wallet_jobs where participant_id=${me.id}`:[];
 const [footprint]=me?await sql`select origin,destination,one_way_km,round_trip,mode,cups,bottles,kg,updated_at from footprints where participant_id=${me.id}`:[];
 if(me&&wallet&&!wallet.confirmed_at)after(async()=>{await processPendingWallets();});
 return NextResponse.json({configured:true,stellarConfigured:stellarConfigured(),me,leaderboard,verifications,reward:reward??null,wallet:wallet?{...wallet,setup_required:!stellarConfigured()}:null,footprint:footprint??null});
 }catch{return NextResponse.json({error:'Database unavailable. Check DATABASE_URL and run db:setup.'},{status:503});}
}
export async function POST(req:NextRequest){
 try{
 if(!validRequestOrigin(req.headers.get('origin'),req.url))return NextResponse.json({error:'Invalid origin'},{status:403});
 if(Number(req.headers.get('content-length')??0)>8192)throw new Error('Request too large.');
 const body=await req.json();if(!process.env.DATABASE_URL)return NextResponse.json({error:'Account registration is not connected yet. The organizer must connect the database before accounts can be created.',code:'DATABASE_NOT_CONFIGURED'},{status:503});const sql=database();
 if(body.op==='signup'||body.op==='login'){
 const email=z.email().max(254).parse(z.string().trim().toLowerCase().parse(body.email));
 const password=z.string().min(body.op==='signup'?10:1).max(128).parse(body.password);
 await authLimit('email:'+email);
 // Vercel replaces this forwarding header; local requests use one shared bucket.
 await authLimit('ip:'+(req.headers.get('x-vercel-forwarded-for')??'local').split(',')[0]);
 const id=body.op==='signup'?await signup(z.string().trim().min(2).max(32).parse(body.name),email,password):await login(email,password);
 after(async()=>{await processWallet(id);});
 return NextResponse.json({ok:true,walletStatus:'pending'});
 }
 if(body.op==='logout'){await logout();return NextResponse.json({ok:true});}
 if(body.op==='verify'){z.literal(true).parse(body.attested);await authLimit('organizer');organizer(z.string().parse(body.password));const id=z.uuid().parse(body.id);const [v]=await sql`update verifications set verified_at=now() where id=${id} and verified_at is null returning id`;if(!v)throw new Error('Already verified or invalid QR code.');await sql`delete from auth_attempts where bucket=${hash('organizer')}`;return NextResponse.json({ok:true});}
 const me=await participant();
 if(body.op==='retry-wallet'){await authLimit('wallet:'+me.id);after(async()=>{await processWallet(me.id);});return NextResponse.json({ok:true});}
 if(body.op==='action'){const action=actions.find(a=>a.id===body.action);if(!action)throw new Error('Invalid action');const [v]=await sql`insert into verifications(id,participant_id,action,points) values(${crypto.randomUUID()},${me.id},${action.id},${action.points}) on conflict(participant_id,action) do update set action=excluded.action returning id,verified_at`;return NextResponse.json(v);}
 if(body.op==='calculate'){
 const input=journeySchema.parse(body);if(input.mode==='plane')input.km=(await resolveFlight(input.origin,input.destination)).km;const estimate=journeyEstimate(input);
 await sql`insert into footprints(participant_id,kg,origin,destination,one_way_km,round_trip,mode,cups,bottles)
 values(${me.id},${estimate.kg},${input.origin},${input.destination},${input.km??null},${input.roundTrip},${input.mode},${input.cups},${input.bottles})
 on conflict(participant_id) do update set kg=excluded.kg,origin=excluded.origin,destination=excluded.destination,one_way_km=excluded.one_way_km,round_trip=excluded.round_trip,mode=excluded.mode,cups=excluded.cups,bottles=excluded.bottles,updated_at=now()`;
 return NextResponse.json(estimate);
 }
 if(body.op==='reward'){
 const [existingClaim]=await sql`select destination from rewards where participant_id=${me.id}`;
 const [wallet]=await sql`select public_key,confirmed_at from wallet_jobs where participant_id=${me.id}`;
 const destination=z.string().refine(s=>StrKey.isValidEd25519PublicKey(s),'Enter a valid Stellar public address.').parse(existingClaim?.destination||body.destination||wallet?.public_key);
 if(!existingClaim&&destination===wallet?.public_key&&!wallet.confirmed_at)throw new Error('Your wallet is still activating. Please wait for confirmation.');
 if(!existingClaim&&!process.env.STELLAR_SECRET_KEY)throw new Error('The organizer is still connecting Testnet rewards. Your earned points are safe; please try again later.');
 // A global advisory lock serializes account sequence allocation and submissions.
 const result=await sql.begin(async tx=>{
 await tx`select pg_advisory_xact_lock(684271)`;
 const [points]=await tx`select coalesce(sum(points),0)::integer as total from verifications where participant_id=${me.id} and verified_at is not null`;
 if(points.total<100)throw new Error('Earn 100 verified points to unlock your reward.');
 let [reward]=await tx`select * from rewards where participant_id=${me.id}`;
 if(!reward){
 const [pending]=await tx`select participant_id from rewards where confirmed_at is null limit 1`;
 const [pendingWallet]=await tx`select participant_id from wallet_jobs where transaction_xdr is not null and confirmed_at is null limit 1`;
 if(pendingWallet)throw new Error('A participant wallet is activating. Please retry shortly.');
 if(pending)throw new Error('Another reward is awaiting confirmation. The organizer must reconcile it before new payments.');
 const key=Keypair.fromSecret(process.env.STELLAR_SECRET_KEY!);if(destination===key.publicKey())throw new Error('Use a participant wallet.');
 await horizon.loadAccount(destination);const source=await horizon.loadAccount(key.publicKey());
 const transaction=new TransactionBuilder(source,{fee:BASE_FEE,networkPassphrase:Networks.TESTNET}).addOperation(Operation.payment({destination,asset:Asset.native(),amount:'1.0000000'})).addMemo(Memo.text('Karga eco reward')).setTimeout(0).build();transaction.sign(key);
 [reward]=await tx`insert into rewards(participant_id,destination,transaction_xdr,transaction_hash) values(${me.id},${destination},${transaction.toXDR()},${transaction.hash().toString('hex')}) returning *`;
 }
 return reward;
 });
 // Reconcile only the persisted claim, reusing its exact signed transaction.
 if(!result.confirmed_at)await reconcileReward(me.id);
 return NextResponse.json({hash:result.transaction_hash});
 }
 throw new Error('Unknown operation');
 }catch(error){const isProviderError=!!(error&&typeof error==='object'&&('code' in error||'response' in error));const message=isProviderError?'Service temporarily unavailable. Please try again or contact the event organizer.':error instanceof z.ZodError?(error.issues[0].path[0]==='email'?'Enter a valid email address.':error.issues[0].path[0]==='name'?'Enter a name between 2 and 32 characters.':error.issues[0].path[0]==='password'?'Enter your password. New accounts need at least 10 characters.':error.issues[0].message):error instanceof Error?error.message:'Request failed';console.error('Karga request failed:',error instanceof Error?error.name:'unknown');return NextResponse.json({error:message.includes('fetch')||message.includes('status code')?'Stellar unavailable or wallet not funded. Fund your Testnet wallet, then retry.':message},{status:400});}
}
