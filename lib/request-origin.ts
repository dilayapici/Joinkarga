function loopback(host:string){return host==='localhost'||host==='[::1]'||/^127(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)){3}$/.test(host);}
export function validRequestOrigin(origin:string|null,requestUrl:string,development=process.env.NODE_ENV!=='production'){
 if(!origin)return false;
 try{
  const source=new URL(origin),target=new URL(requestUrl);
  if(!['http:','https:'].includes(source.protocol)||source.origin!==origin)return false;
  if(development&&loopback(source.hostname)&&loopback(target.hostname)){
   source.hostname='localhost';target.hostname='localhost';
  }
  // Never relax scheme or port; production requires the original exact origin.
  return source.origin===target.origin;
 }catch{return false;}
}
