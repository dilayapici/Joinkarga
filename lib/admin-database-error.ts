export const adminQueryNames=['summary','participants','participant_count','verifications','transactions','travel_modes','registrations'] as const;
export type AdminQueryName=typeof adminQueryNames[number];
const problems:Record<string,string>={
 '42P01':'Required database tables are missing. Run npm run db:setup.',
 '42703':'Required database columns are missing. Run npm run db:setup.',
 '42501':'The database connection does not have permission to read these tables. Use the database owner connection.',
 '42601':'A dashboard SQL query has a syntax error. Report the query name and SQLSTATE.',
 '42803':'A dashboard aggregate query needs correction. Report the query name and SQLSTATE.',
 '42702':'A dashboard query has an ambiguous column. Report the query name and SQLSTATE.',
 'ENOTFOUND':'The database host could not be resolved. Check the Neon connection and network.',
 'ECONNREFUSED':'The database connection was refused. Check Neon and your network.',
 'CONNECT_TIMEOUT':'The database connection timed out. Check Neon and retry.',
 '28P01':'Database authentication failed. Update DATABASE_URL using the current Neon connection string.',
 '3D000':'The configured database does not exist. Check the Neon connection string.'
};
export class AdminDatabaseError extends Error{
 databaseCode:string;
 query:AdminQueryName|undefined;
 constructor(error:unknown,query?:AdminQueryName){
  const code=error&&typeof error==='object'&&'code'in error&&typeof error.code==='string'?error.code:'';
  super(Object.hasOwn(problems,code)?problems[code]:'Dashboard database queries failed. Run npm run db:setup, then check the Neon connection.');
  this.name='AdminDatabaseError';this.databaseCode=Object.hasOwn(problems,code)?code:'UNKNOWN';this.query=query;
 }
}
