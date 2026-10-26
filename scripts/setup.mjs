import postgres from 'postgres';
import {readFile} from 'node:fs/promises';
if(!process.env.DATABASE_URL){console.error('Set DATABASE_URL privately in .env.local, or run npm run db:connect.');process.exitCode=1;}
else{
 const sql=postgres(process.env.DATABASE_URL,{max:1,prepare:false,connect_timeout:10,onnotice:()=>{}});
 try{const schema=await readFile(new URL('./schema.sql',import.meta.url),'utf8');await sql.begin(async tx=>{await tx.unsafe(schema);});console.log('Database ready. Existing participant data was preserved.');}
 catch(error){const codes=['ENOTFOUND','ECONNREFUSED','CONNECT_TIMEOUT','28P01','42501','42601','42P01','42703'];const code=codes.includes(error.code)?error.code:'UNKNOWN';console.error(`Database setup failed (${code}). Check your Neon connection, database owner permissions and schema. No credentials were printed.`);process.exitCode=1;}
 finally{await sql.end({timeout:3});}
}
