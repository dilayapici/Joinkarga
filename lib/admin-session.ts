import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
export const ADMIN_SESSION_SECONDS=4*60*60;
function sign(payload:string,secret:string){return createHmac('sha256',secret).update('karga-admin:'+payload).digest('hex');}
export function createAdminSession(secret:string,now=Date.now()){
 if(secret.length<16)throw new Error('Organizer password must have at least 16 characters.');
 const payload=`${Math.floor(now/1000)+ADMIN_SESSION_SECONDS}.${randomBytes(24).toString('hex')}`;
 return `${payload}.${sign(payload,secret)}`;
}
export function validAdminSession(token:string|undefined,secret:string|undefined,now=Date.now()){
 if(!token||!secret||secret.length<16||!/^\d{10}\.[a-f\d]{48}\.[a-f\d]{64}$/.test(token))return false;
 const [expires,nonce,signature]=token.split('.');const expiry=Number(expires);
 if(expiry<=Math.floor(now/1000)||expiry>Math.floor(now/1000)+ADMIN_SESSION_SECONDS)return false;
 return timingSafeEqual(Buffer.from(signature,'hex'),Buffer.from(sign(`${expires}.${nonce}`,secret),'hex'));
}
