import {createHmac,randomBytes} from 'node:crypto';
import {validRequestOrigin} from './request-origin';
export const HANDOFF_SECONDS=120;
const local=(hostname:string)=>hostname==='localhost'||hostname==='[::1]'||/^127(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)){3}$/.test(hostname);
export function localHandoffAllowed(origin:string|null,url:string,environment:string|undefined=process.env.NODE_ENV){
 if(environment!=='development'||!validRequestOrigin(origin,url,true)||!origin)return false;
 try{return local(new URL(origin).hostname)&&local(new URL(url).hostname);}catch{return false;}
}
export const newHandoffCode=()=>randomBytes(32).toString('hex');
export function handoffBucket(code:string,secret:string|undefined){
 if(!/^[a-f\d]{64}$/.test(code)||!secret||secret.length<16)return null;
 return 'admin-handoff:'+createHmac('sha256',secret).update('karga-browser-handoff:'+code).digest('hex');
}
