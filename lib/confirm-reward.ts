import {Networks,TransactionBuilder} from '@stellar/stellar-sdk';
type RecordedReward={transaction_xdr:string;transaction_hash:string;confirmed_at?:string|null};
type Transport={lookup:(hash:string)=>Promise<{successful:boolean}>;submit:(xdr:string)=>Promise<{successful:boolean}>;isNotFound:(error:unknown)=>boolean};
// A reconciliation may only check or resend the exact existing signed Testnet XDR.
export async function confirmRecordedReward(reward:RecordedReward,transport:Transport){
 if(reward.confirmed_at)return;
 const transaction=TransactionBuilder.fromXDR(reward.transaction_xdr,Networks.TESTNET);
 if(transaction.hash().toString('hex')!==reward.transaction_hash)throw new Error('Stored transaction hash mismatch. No payment submitted.');
 let receipt;
 try{receipt=await transport.lookup(reward.transaction_hash);}catch(error){if(!transport.isNotFound(error))throw new Error('Unable to check Stellar confirmation. Please retry later.');}
 if(receipt){if(!receipt.successful)throw new Error('This on-chain payment failed. Organizer reconciliation is required; no replacement payment was created.');return;}
 const submitted=await transport.submit(reward.transaction_xdr);
 if(!submitted.successful)throw new Error('Payment is not confirmed yet.');
}
