import { randomBytes, scrypt as derive, timingSafeEqual, createCipheriv, createDecipheriv } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt=promisify(derive);
export async function passwordHash(password:string){const salt=randomBytes(16).toString('hex');const key=await scrypt(password,salt,64) as Buffer;return `scrypt:${salt}:${key.toString('hex')}`;}
export async function passwordMatches(password:string,stored:string){const [kind,salt,digest]=stored.split(':');if(kind!=='scrypt'||!salt||!digest)return false;const expected=Buffer.from(digest,'hex');const actual=await scrypt(password,salt,64) as Buffer;return expected.length===actual.length&&timingSafeEqual(expected,actual);}
export function encryptionKey(){const value=process.env.WALLET_ENCRYPTION_KEY??'';if(!/^[a-f\d]{64}$/i.test(value))throw new Error('Wallet encryption is not configured.');return Buffer.from(value,'hex');}
export function encryptSecret(secret:string){const iv=randomBytes(12);const cipher=createCipheriv('aes-256-gcm',encryptionKey(),iv);const encrypted=Buffer.concat([cipher.update(secret,'utf8'),cipher.final()]);return [iv.toString('hex'),cipher.getAuthTag().toString('hex'),encrypted.toString('hex')].join(':');}
export function decryptSecret(encrypted:string){const [iv,tag,data]=encrypted.split(':');const cipher=createDecipheriv('aes-256-gcm',encryptionKey(),Buffer.from(iv,'hex'));cipher.setAuthTag(Buffer.from(tag,'hex'));return Buffer.concat([cipher.update(Buffer.from(data,'hex')),cipher.final()]).toString('utf8');}
