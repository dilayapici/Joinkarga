import {validRequestOrigin} from '@/lib/request-origin';
import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {resolveFlight} from '@/lib/flight';
export const runtime='nodejs';
const schema=z.object({origin:z.string().trim().min(2).max(120),destination:z.string().trim().min(2).max(120)});
export async function POST(req:NextRequest){
 if(!validRequestOrigin(req.headers.get('origin'),req.url))return NextResponse.json({error:'Invalid origin'},{status:403});
 try{const text=await req.text();if(text.length>2048)return NextResponse.json({error:'Request too large'},{status:413});const input=schema.parse(JSON.parse(text));return NextResponse.json(await resolveFlight(input.origin,input.destination),{headers:{'Cache-Control':'no-store'}});}catch(e){const error=e instanceof z.ZodError?'Enter your departure and arrival cities.':e instanceof Error?e.message:'Unable to estimate this flight.';return NextResponse.json({error},{status:400});}
}
