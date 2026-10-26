import {validRequestOrigin} from '@/lib/request-origin';
import {NextRequest,NextResponse,after} from 'next/server';
import {z} from 'zod';
import {localHandoffAllowed,newHandoffCode,handoffBucket,HANDOFF_SECONDS} from '@/lib/admin-handoff';
import {AdminDatabaseError,adminQueryNames} from '@/lib/admin-database-error';
import {database,organizer,authLimit,RateLimitError} from '@/lib/server';
import {isAdmin,signInAdmin,signOutAdmin} from '@/lib/admin';
import {processWallet,processPendingWallets,stellarConfigured} from '@/lib/wallets';
import {reconcileReward} from '@/lib/reconcile-reward';
export const runtime='nodejs';
export const maxDuration=60;
function json(data:unknown,status=200){return NextResponse.json(data,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie'}});}
function setup(){return {database:!!process.env.DATABASE_URL,organizer:(process.env.ORGANIZER_PASSWORD?.length??0)>=16,stellar:stellarConfigured(),cron:!!process.env.CRON_SECRET};}
export async function GET(req:NextRequest){
 if(!await isAdmin())return json({authenticated:false,setup:setup(),browserSignIn:process.env.NODE_ENV==='development'},401);
 try{
 const sql=database();const query=z.object({search:z.string().trim().max(100).default(''),page:z.coerce.number().int().min(1).max(100000).default(1)}).parse(Object.fromEntries(req.nextUrl.searchParams));const size=20,offset=(query.page-1)*size,search='%'+query.search+'%';
 const results=await Promise.allSettled([
 sql`select (select count(*)::integer from participants) participants,(select count(*)::integer from footprints where origin is not null) journeys,(select count(*)::integer from footprints where kg is not null and origin is not null) estimated_journeys,(select coalesce(sum(kg),0)::double precision from footprints where origin is not null) estimated_kg,(select count(*)::integer from verifications where verified_at is not null) verified_actions,(select count(*)::integer from verifications where verified_at is null) pending_actions,(select coalesce(sum(points),0)::integer from verifications where verified_at is not null) points,(select count(*)::integer from wallet_jobs where confirmed_at is not null) active_wallets,(select count(*)::integer from wallet_jobs where confirmed_at is null) pending_wallets,(select count(*)::integer from rewards where confirmed_at is not null) paid_rewards,(select count(*)::integer from rewards where confirmed_at is null) pending_rewards`,
 sql`select p.id,p.name,p.email,p.created_at,coalesce(v.points,0)::integer points,coalesce(v.verified_actions,0)::integer verified_actions,(f.origin is not null) journey_recorded,f.kg,w.public_key,case when w.confirmed_at is not null then 'active' when w.participant_id is not null then 'pending' else 'not_created' end wallet_status from participants p left join (select participant_id,sum(points) points,count(*) verified_actions from verifications where verified_at is not null group by participant_id) v on v.participant_id=p.id left join footprints f on f.participant_id=p.id left join wallet_jobs w on w.participant_id=p.id where p.name ilike ${search} or coalesce(p.email,'') ilike ${search} order by p.created_at desc,p.id limit ${size} offset ${offset}`,
 sql`select count(*)::integer total from participants where name ilike ${search} or coalesce(email,'') ilike ${search}`,
 sql`select v.id,v.participant_id,p.name,p.email,v.action,v.points,v.created_at,v.verified_at from verifications v join participants p on p.id=v.participant_id order by (v.verified_at is null) desc,v.created_at desc limit 50`,
 sql`select * from (select w.participant_id,p.name,'wallet' kind,w.transaction_hash,w.public_key destination,w.confirmed_at,w.created_at,w.last_error,w.attempts from wallet_jobs w join participants p on p.id=w.participant_id union all select r.participant_id,p.name,'reward' kind,r.transaction_hash,r.destination,r.confirmed_at,r.created_at,null last_error,0 attempts from rewards r join participants p on p.id=r.participant_id) activity order by (confirmed_at is null) desc,created_at desc limit 50`,
 sql`select mode,count(*)::integer count,coalesce(sum(kg),0)::double precision kg from footprints where origin is not null group by mode order by count desc`,
 sql`select (created_at at time zone 'UTC')::date::text AS "day",count(*)::integer AS "count"
 from participants
 where created_at >= ((date_trunc('day',now() at time zone 'UTC') - interval '6 days') at time zone 'UTC')
 group by 1 order by 1`
 ]);
 const failed=results.findIndex(result=>result.status==='rejected');
 if(failed>=0){const failure=results[failed];if(failure.status==='rejected')throw new AdminDatabaseError(failure.reason,adminQueryNames[failed]);}
 const [summary,participants,count,verifications,transactions,modes,registrations]=results.map(result=>{if(result.status==='rejected')throw result.reason;return result.value;});
 return json({authenticated:true,setup:setup(),summary:summary[0],participants,participantCount:count[0].total,page:query.page,pageSize:size,verifications,transactions,modes,registrations});
 }catch(error){if(error instanceof z.ZodError)return json({error:'Invalid dashboard search or page.'},400);const issue=error instanceof AdminDatabaseError?error:new AdminDatabaseError(error);console.error('Karga admin database check:',{query:issue.query??'connection',code:issue.databaseCode});return json({error:issue.message,code:'DASHBOARD_DATA_UNAVAILABLE',databaseCode:issue.databaseCode,query:issue.query??'connection'},503);}
}
export async function POST(req:NextRequest){
 if(!validRequestOrigin(req.headers.get('origin'),req.url))return json({error:'Request origin does not match this server. Open the dashboard using its localhost URL.',code:'ORIGIN_REJECTED'},403);
 try{
 const text=await req.text();if(text.length>4096)return json({error:'Request too large'},413);const body=JSON.parse(text);
 if(body.op==='browser-login'){
 if(!localHandoffAllowed(req.headers.get('origin'),req.url))return json({error:'Local sign-in is unavailable here.'},404);
 const parsed=z.string().regex(/^[a-f\d]{64}$/).safeParse(body.code);
 if(!parsed.success)return json({error:'This sign-in link is invalid. Run npm run admin:open again.'},401);
 const code=parsed.data;
 const bucket=handoffBucket(code,process.env.ORGANIZER_PASSWORD);
 if(!bucket)return json({error:'Local sign-in is unavailable. Run npm run admin:open again.'},401);
 const [used]=await database()`delete from auth_attempts where bucket=${bucket} and count=0 and expires_at>now() returning bucket`;
 if(!used)return json({error:'This sign-in link expired or was already used. Run npm run admin:open again.'},401);
 await signInAdmin();return json({ok:true});
 }
 if(body.op==='login'){
 if(!setup().database||!setup().organizer)return json({error:'Organizer access needs DATABASE_URL and an ORGANIZER_PASSWORD of at least 16 characters.'},503);
 try{await authLimit('admin-login:'+((req.headers.get('x-vercel-forwarded-for')??'local').split(',')[0]));}catch(error){if(error instanceof RateLimitError)return json({error:'Too many organizer login attempts. Please wait 15 minutes.',code:'LOGIN_RATE_LIMITED'},429);return json({error:'Organizer sign-in cannot reach the database or required tables. Check Neon and run npm run db:setup.',code:'DATABASE_UNAVAILABLE'},503);}
 try{organizer(z.string().min(1).max(256).parse(body.password));}catch{return json({error:'Incorrect organizer password.'},401);}
 await signInAdmin();return json({ok:true});
 }
 if(!await isAdmin())return json({error:'Organizer sign-in required.'},401);
 if(body.op==='browser-link'){
 if(!localHandoffAllowed(req.headers.get('origin'),req.url))return json({error:'Local sign-in is unavailable here.'},404);
 const code=newHandoffCode(),bucket=handoffBucket(code,process.env.ORGANIZER_PASSWORD);
 if(!bucket)return json({error:'Organizer access is not configured.'},503);
 const sql=database();
 await sql`delete from auth_attempts where bucket like 'admin-handoff:%' and expires_at<=now()`;
 await sql`insert into auth_attempts(bucket,count,expires_at) values(${bucket},0,now()+(${HANDOFF_SECONDS}::integer * interval '1 second'))`;
 return json({code,expiresIn:HANDOFF_SECONDS});
 }
 if(body.op==='logout'){await signOutAdmin();return json({ok:true});}
 const sql=database();
 if(body.op==='verify'){
 const input=z.object({id:z.uuid(),attested:z.literal(true)}).parse(body);
 const [row]=await sql`update verifications set verified_at=now() where id=${input.id} and verified_at is null returning id`;
 if(!row)return json({error:'This action is already verified or no longer exists.'},409);
 return json({ok:true,message:'Action verified. Points awarded once.'});
 }
 if(body.op==='retry-wallet'){
 if(!stellarConfigured())return json({error:'Complete Stellar Testnet setup before retrying wallet activation.'},503);
 const id=z.uuid().parse(body.participantId);await authLimit('admin-wallet:'+id);const [row]=await sql`select confirmed_at from wallet_jobs where participant_id=${id}`;
 if(!row)return json({error:'Wallet job not found.'},404);if(row.confirmed_at)return json({ok:true,message:'Wallet is already active.'});
 after(async()=>{await processWallet(id);});return json({ok:true,message:'Wallet retry queued. Refresh to check confirmation.'});
 }
 if(body.op==='retry-reward'){
 const id=z.uuid().parse(body.participantId);await authLimit('admin-reward:'+id);const [row]=await sql`select confirmed_at from rewards where participant_id=${id}`;
 if(!row)return json({error:'No existing claim. The participant must request a reward first.'},404);
 if(row.confirmed_at)return json({ok:true,message:'Reward already confirmed. No payment sent.'});
 await reconcileReward(id);return json({ok:true,message:'Existing reward transaction confirmed. No new claim created.'});
 }
 if(body.op==='process-wallets'){
 if(!stellarConfigured())return json({error:'Complete Stellar Testnet setup first.'},503);await authLimit('admin-process-wallets');after(async()=>{await processPendingWallets();});return json({ok:true,message:'Processing due wallet jobs. Refresh to check progress.'});
 }
 return json({error:'Unknown operation.'},400);
 }catch(error){if(error instanceof z.ZodError)return json({error:'Check the request. Verification requires confirming that you witnessed the action.'},400);return json({error:'The operation could not be completed. No replacement payment was created. Check configuration and retry.'},400);}
}
