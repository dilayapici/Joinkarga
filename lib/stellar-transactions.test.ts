import test from 'node:test';
import assert from 'node:assert/strict';
import {Account,Keypair,TransactionBuilder,Networks,Transaction} from '@stellar/stellar-sdk';
import {welcomeTransaction} from './stellar-transactions';
test('welcome creates and funds one wallet on Testnet and retries retain its hash',()=>{
 const treasury=Keypair.random(),participant=Keypair.random();
 const transaction=welcomeTransaction(new Account(treasury.publicKey(),'123'),treasury,participant.publicKey());
 assert.equal(transaction.operations.length,1);
 const op=transaction.operations[0];assert.equal(op.type,'createAccount');
 if(op.type!=='createAccount')throw new Error('Unexpected operation');
 assert.equal(op.destination,participant.publicKey());assert.equal(op.startingBalance,'2.0000000');
 assert.equal(transaction.sequence,'124');assert.equal(transaction.networkPassphrase,Networks.TESTNET);
 assert.ok(treasury.verify(transaction.hash(),transaction.signatures[0].signature()));
 const retry=TransactionBuilder.fromXDR(transaction.toXDR(),Networks.TESTNET);
 assert.equal(retry.hash().toString('hex'),transaction.hash().toString('hex'));
 assert.equal(retry.toXDR(),transaction.toXDR());
 assert.ok(retry instanceof Transaction);
 assert.notEqual(TransactionBuilder.fromXDR(transaction.toXDR(),Networks.PUBLIC).hash().toString('hex'),transaction.hash().toString('hex'));
});
