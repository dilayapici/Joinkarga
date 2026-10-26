import test from 'node:test';
import assert from 'node:assert/strict';
import {databaseUrlFromClipboard} from '../scripts/database-url.mjs';
const url='postgresql://example:fake-password@ep-example.eu-west-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
test('Neon connection helper accepts URL, psql command, and env assignment without shell execution',()=>{for(const text of [url,`psql '${url}'`,`DATABASE_URL="${url}"`,`  ${url}\n`])assert.equal(databaseUrlFromClipboard(text).toString(),url);});
test('clipboard URL validation rejects empty, unrelated, ambiguous and non-Neon values without exposing credentials',()=>{for(const text of ['', 'npm run db:connect',url+' '+url.replace('example:','other:'),url.replace('.neon.tech','.evil.example'),url.replace('example:fake-password@','')])assert.throws(()=>databaseUrlFromClipboard(text),error=>error instanceof Error&&!error.message.includes('fake-password'));});
test('clipboard parser adds TLS and treats shell substitution as text',()=>{assert.equal(databaseUrlFromClipboard(url.replace('?sslmode=require&channel_binding=require','')).searchParams.get('sslmode'),'require');assert.equal(databaseUrlFromClipboard(`psql '${url}' $(do-not-execute)`).hostname,'ep-example.eu-west-1.aws.neon.tech');});
