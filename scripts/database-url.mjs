// Accept Neon copy formats as text only. Never evaluate a shell command.
export function databaseUrlFromClipboard(text){
 if(!text?.trim())throw new Error('The clipboard is empty. Copy the connection string from Neon.');
 const matches=[...new Set(text.match(/postgres(?:ql)?:\/\/[^\s'"`<>]+/g)??[])];
 if(matches.length!==1)throw new Error(matches.length?'The clipboard contains multiple database URLs. Copy just one connection string.':'The copied text does not contain a PostgreSQL URL. In Neon, choose Connect and copy the connection string.');
 let url;try{url=new URL(matches[0]);}catch{throw new Error('The copied database URL is incomplete. Copy the full connection string from Neon.');}
 if(!['postgres:','postgresql:'].includes(url.protocol)||!url.hostname||!url.username||!url.password)throw new Error('The database URL must include its username and password. Copy the full URL from Neon.');
 if(!url.hostname.endsWith('.neon.tech')&&!url.hostname.endsWith('.neon.build'))throw new Error('Expected a Neon database hostname. Copy the connection string directly from your Neon project.');
 if(!['require','verify-full','verify-ca'].includes(url.searchParams.get('sslmode')??''))url.searchParams.set('sslmode','require');
 return url;
}
