import 'server-only';
import {cookies} from 'next/headers';
import {ADMIN_SESSION_SECONDS,createAdminSession,validAdminSession} from './admin-session';
export async function isAdmin(){return validAdminSession((await cookies()).get('karga_admin')?.value,process.env.ORGANIZER_PASSWORD);}
export async function signInAdmin(){const secret=process.env.ORGANIZER_PASSWORD;if(!secret)throw new Error('Organizer access is not configured.');(await cookies()).set('karga_admin',createAdminSession(secret),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:ADMIN_SESSION_SECONDS});}
export async function signOutAdmin(){(await cookies()).delete('karga_admin');}
