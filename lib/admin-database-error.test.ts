import test from 'node:test';
import assert from 'node:assert/strict';
import {AdminDatabaseError} from './admin-database-error';
test('admin database errors identify missing schema and permissions without provider payloads',()=>{for(const code of ['42P01','42703','42501','42601','ENOTFOUND']){const error=new AdminDatabaseError({code,message:'private-provider-payload',query:'SELECT secret',connection:'postgres://secret'},'summary');assert.equal(error.databaseCode,code);assert.equal(error.query,'summary');assert.ok(!JSON.stringify(error).includes('secret'));assert.ok(!error.message.includes('private-provider-payload'));}});
test('unrecognized provider error codes and messages are not reflected',()=>{const error=new AdminDatabaseError({code:'PRIVATE_DATABASE_PASSWORD',message:'private-key-value'});assert.equal(error.databaseCode,'UNKNOWN');assert.ok(!error.message.includes('private-key-value'));assert.ok(!JSON.stringify(error).includes('PRIVATE_DATABASE_PASSWORD'));});
