// Only loopback URLs constructed here are allowed to receive organizer credentials.
export async function checkLocalAdmin(password,fetcher=fetch){
 let server;
 for(let port=3000;port<=3005;port++){
  const base=`http://localhost:${port}`;
  try{
   const response=await fetcher(base+'/api/admin',{signal:AbortSignal.timeout(2500),headers:{Accept:'application/json'},redirect:'error'});
   if(!response.headers.get('content-type')?.includes('application/json'))continue;
   const body=await response.json();
   if(body.authenticated===false&&body.setup&&typeof body.setup.organizer==='boolean'){server={base,port,setup:body.setup,browserSignIn:body.browserSignIn===true};break;}
  }catch{}
 }
 if(!server)return {ok:false,code:'SERVER_NOT_FOUND',message:'No Karga server was found on ports 3000–3005. Start npm run dev in one Terminal window, leave it open, and run npm run admin:open in a second window.'};
 if(!server.setup.database)return {ok:false,code:'DATABASE_NOT_CONFIGURED',message:'The running server has no database connection. Run npm run db:connect, then stop and restart the Karga server.'};
 if(!server.setup.organizer)return {ok:false,code:'SERVER_NEEDS_RESTART',message:'The running server has not loaded your organizer password. Stop it with Control+C and restart npm run dev from the Karga folder.'};
 const request={method:'POST',headers:{Origin:server.base,'Content-Type':'application/json'},body:JSON.stringify({op:'login',password}),redirect:'error',signal:AbortSignal.timeout(15000)};
 let login;
 try{login=await fetcher(server.base+'/api/admin',request);}catch{return {ok:false,code:'LOGIN_CONNECTION_FAILED',message:'The local server did not finish the login request. Check its Terminal for errors and retry.'};}
 if(login.status===403)return {ok:false,code:'ORIGIN_REJECTED',httpStatus:403,message:'The server rejected the local request origin. Restart Karga to load the origin-check fix, then rerun npm run admin:open.'};
 if(login.status===401)return {ok:false,code:'PASSWORD_MISMATCH',message:'The saved organizer password differs from the running server. Stop the old Karga server, restart npm run dev from this folder, then rerun npm run admin:open.'};
 if(login.status===429)return {ok:false,code:'LOGIN_RATE_LIMITED',message:'Organizer login is rate limited. Wait 15 minutes before retrying. Restarting the server does not reset the database limit.'};
 if(login.status===503)return {ok:false,code:'DATABASE_UNAVAILABLE',message:'Organizer login cannot reach its database or required tables. Check Neon and run npm run db:setup, then retry.'};
 if(!login.ok)return {ok:false,code:'LOGIN_FAILED',httpStatus:login.status,message:`The server rejected login (HTTP ${login.status}). Restart Karga to load the latest API, then rerun this command. If it persists, share this status code only.`};
 const cookie=login.headers.get('set-cookie')?.split(';')[0];
 if(!cookie?.startsWith('karga_admin='))return {ok:false,code:'SESSION_MISSING',message:'The server accepted the password but did not create an organizer session. Restart Karga and retry.'};
 try{
  const response=await fetcher(server.base+'/api/admin',{headers:{Cookie:cookie,Accept:'application/json'},signal:AbortSignal.timeout(15000),redirect:'error'});
  if(response.status===401)return {ok:false,code:'SESSION_REJECTED',message:'The server rejected its new organizer session. Restart the Karga server so its password configuration is consistent.'};
  if(!response.ok){
   let detail={};try{detail=await response.json();}catch{}
   const codes=['42P01','42703','42501','42601','42803','42702','ENOTFOUND','ECONNREFUSED','CONNECT_TIMEOUT','28P01','3D000','UNKNOWN'];
   const queries=['summary','participants','participant_count','verifications','transactions','travel_modes','registrations','connection'];
   const databaseCode=codes.includes(detail.databaseCode)?detail.databaseCode:'UNKNOWN';
   const query=queries.includes(detail.query)?detail.query:'unknown';
   return {ok:false,code:'DASHBOARD_DATA_UNAVAILABLE',databaseCode,query,message:`The password is correct. Database check failed (query: ${query}; code: ${databaseCode}). Run npm run db:setup, then npm run admin:open. If it persists, share these diagnostic names/codes only.`};
  }
  const body=await response.json();
  if(body.authenticated!==true||!body.summary)return {ok:false,code:'DASHBOARD_RESPONSE_INVALID',message:'The running server returned an unexpected dashboard response. Restart the current Karga project and retry.'};
 }catch{return {ok:false,code:'DASHBOARD_TIMEOUT',message:'Login succeeded, but dashboard data could not be loaded. Check the server Terminal and database connection.'};}
 const url=`http://localhost:${server.port}/admin`;
 // Optional development-only, authenticated, single-use browser handoff.
 // The code stays in the fragment (not server access logs) and is never printed.
 let browserUrl;
 try{
  const response=await fetcher(server.base+'/api/admin',{method:'POST',headers:{Origin:server.base,Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({op:'browser-link'}),redirect:'error',signal:AbortSignal.timeout(10000)});
  if(response.ok){const link=await response.json();if(typeof link.code==='string'&&/^[a-f\d]{64}$/.test(link.code))browserUrl=url+'#signin='+link.code;}
  if(server.browserSignIn&&!browserUrl)return {ok:false,code:'BROWSER_SIGNIN_UNAVAILABLE',message:'Password and dashboard checks passed, but the one-time browser link could not be prepared. Check the local server’s database connection and rerun npm run admin:open.'};
 }catch{if(server.browserSignIn)return {ok:false,code:'BROWSER_SIGNIN_UNAVAILABLE',message:'The local browser sign-in request did not complete. Keep Karga running and rerun npm run admin:open.'};}
 return {ok:true,code:'READY',url,browserUrl,message:'Organizer password, session and dashboard data checks passed.'};
}
