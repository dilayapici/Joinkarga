import 'server-only';
import {Horizon,Networks,TransactionBuilder,NotFoundError} from '@stellar/stellar-sdk';
import {database} from './server';
import {confirmRecordedReward} from './confirm-reward';
const horizon=new Horizon.Server('https://horizon-testnet.stellar.org');
export async function reconcileReward(participantId:string){
 const sql=database();const [reward]=await sql`select transaction_xdr,transaction_hash,confirmed_at from rewards where participant_id=${participantId}`;
 if(!reward)throw new Error('No existing reward claim was found.');
 await confirmRecordedReward({transaction_xdr:reward.transaction_xdr,transaction_hash:reward.transaction_hash,confirmed_at:reward.confirmed_at},{
  lookup:hash=>horizon.transactions().transaction(hash).call(),
  submit:xdr=>horizon.submitTransaction(TransactionBuilder.fromXDR(xdr,Networks.TESTNET)),
  isNotFound:error=>error instanceof NotFoundError||(error as {response?:{status?:number}})?.response?.status===404
 });
 await sql`update rewards set confirmed_at=now() where participant_id=${participantId} and confirmed_at is null`;
}
