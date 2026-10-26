import {NextRequest,NextResponse} from 'next/server';
import {processPendingWallets} from '@/lib/wallets';
import {hash} from '@/lib/server';
import {timingSafeEqual} from 'node:crypto';
export const runtime='nodejs';
export const maxDuration=60;
export async function GET(req:NextRequest){const secret=process.env.CRON_SECRET;if(!secret||!timingSafeEqual(Buffer.from(hash(req.headers.get('authorization')??'')),Buffer.from(hash(`Bearer ${secret}`))))return NextResponse.json({error:'Unauthorized'},{status:401});try{return NextResponse.json({processed:await processPendingWallets()});}catch{return NextResponse.json({error:'Background processing unavailable'},{status:503});}}
