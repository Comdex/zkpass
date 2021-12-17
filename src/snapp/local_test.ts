import { Mina, shutdown } from "snarkyjs";
import { deployContract, registerAccount, deposit, transferToName, withDraw, account1, account2, snappPubkey } from "./snapp_util";
import { testDb } from "./mock";

async function run() {
   await deployContract();

   await registerAccount(
        "Bob",
        account1.toPublicKey(),
        account1.toPublicKey(),
        "Bob@gmail.com"
    );

   await registerAccount(
        "Alice",
        account2.toPublicKey(),
        account2.toPublicKey(),
        "Alice@gmail.com"
    );

   await deposit(account2, "Bob", 1000000000);
   console.log("[after deposit]");
   testDb.print();

   await transferToName(account1, "Bob", "Alice", 1000000000);
   console.log("[after transferToName]");
   testDb.print();

   await withDraw(account2.toPublicKey(), "Alice", 1000000000, account2);
   console.log("[after withDraw]");
   testDb.print();

   const snappAccount = await Mina.getAccount(snappPubkey);
   console.log('final state value: ', snappAccount.snapp.appState[0].toString());
  
   const balance = await Mina.getBalance(snappPubkey);
   console.log('snapp balance: ', balance.toString());
}

run();
shutdown(); 