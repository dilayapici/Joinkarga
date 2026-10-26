import {Account,Keypair,TransactionBuilder,Networks,Operation,BASE_FEE,Memo} from '@stellar/stellar-sdk';
export function welcomeTransaction(source:Account,treasury:Keypair,destination:string){
 const transaction=new TransactionBuilder(source,{fee:BASE_FEE,networkPassphrase:Networks.TESTNET})
 .addOperation(Operation.createAccount({destination,startingBalance:'2.0000000'}))
 .addMemo(Memo.text('Karga participant welcome')).setTimeout(0).build();
 transaction.sign(treasury);
 return transaction;
}
