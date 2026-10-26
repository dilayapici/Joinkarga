import 'server-only';
import postgres from 'postgres';
import { cookies } from 'next/headers';
import {createHash,randomBytes,timingSafeEqual} from 'node:crypto';
import {passwordHash,passwordMatches} from './security';
let db:ReturnType<typeof postgres>;
export function database(){if(!process.env.DATABASE_URL)throw new Error('Registration is temporarily unavailable. The event organizer needs to connect the database.');return db??=postgres(process.env.DATABASE_URL,{max:3,prepare:false,connect_timeout:10});}
export const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
export async function participant(){const token=(await cookies()).get('karga_session')?.value;if(!token)throw new Error('Please sign in first.');const sql=database();const [p]=await sql`select p.id,p.name,p.email from participants p join participant_sessions s on s.participant_id=p.id where s.token_hash=${hash(token)} and s.expires_at>now()`;if(p)return p;const [legacy]=await sql`select id,name,email from participants where session_hash=${hash(token)} and email is null`;if(!legacy)throw new Error('Please sign in again.');return legacy;}
const participantCookieOptions=()=>({httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict' as const,path:'/',maxAge:60*60*24*30});
export async function sessionFor(id:string){const jar=await cookies();const token=randomBytes(32).toString('hex');await database()`insert into participant_sessions(token_hash,participant_id) values(${hash(token)},${id})`;jar.set('karga_session',token,participantCookieOptions());}
export async function signup(name:string,email:string,password:string){
 const jar=await cookies(),sql=database(),digest=await passwordHash(password),id=crypto.randomUUID(),token=randomBytes(32).toString('hex');
 try{await sql.begin(async tx=>{
  await tx`insert into participants(id,session_hash,name,email,password_hash) values(${id},${hash(randomBytes(32).toString('hex'))},${name},${email},${digest})`;
  await tx`insert into wallet_jobs(participant_id) values(${id})`;
  await tx`insert into participant_sessions(token_hash,participant_id) values(${hash(token)},${id})`;
 });}catch(error){if((error as {code?:string}).code==='23505')throw new Error('An account already uses this email. Choose Sign in to continue.');throw error;}
 jar.set('karga_session',token,participantCookieOptions());return id;
}
export async function login(email:string,password:string){const [p]=await database()`select id,password_hash from participants where lower(email)=${email}`;const digest=p?.password_hash??'scrypt:00000000000000000000000000000000:00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';if(!await passwordMatches(password,digest)||!p)throw new Error('Incorrect email or password.');await sessionFor(p.id);return p.id as string;}
export async function logout(){const jar=await cookies();const token=jar.get('karga_session')?.value;if(token)await database()`delete from participant_sessions where token_hash=${hash(token)}`;jar.delete('karga_session');}
export class RateLimitError extends Error{constructor(){super('Too many attempts. Please wait 15 minutes.');this.name='RateLimitError';}}
export async function authLimit(bucket:string){const [attempt]=await database()`insert into auth_attempts(bucket,count,expires_at) values(${hash(bucket)},1,now()+interval '15 minutes') on conflict(bucket) do update set count=case when auth_attempts.expires_at<now() then 1 else auth_attempts.count+1 end,expires_at=case when auth_attempts.expires_at<now() then now()+interval '15 minutes' else auth_attempts.expires_at end returning count`;if(attempt.count>15)throw new RateLimitError();}
export function organizer(password:string){const expected=process.env.ORGANIZER_PASSWORD;if(!expected||expected.length<16||!timingSafeEqual(Buffer.from(hash(password)),Buffer.from(hash(expected))))throw new Error('Invalid organizer password. Configure a password of at least 16 characters.');}
