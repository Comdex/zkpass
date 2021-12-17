import {
    isReady,
    Mina,
    PrivateKey,
    Field,
    UInt64,
    Party,
    PublicKey,
} from "snarkyjs";
import { ZKPass } from "./zkpass";
import { SignatureWithName, SignatureWithSigner } from "./contract_type";
import { testDb } from "./mock";
import { packBytes } from "./util";

export { deployContract, registerAccount, deposit, transferToName, withDraw, snappPubkey, account1, account2 };

await isReady;

const Local = Mina.LocalBlockchain();
Mina.setActiveInstance(Local);
const account1 = Local.testAccounts[0].privateKey;
const account2 = Local.testAccounts[1].privateKey;

let snapp: ZKPass;
const snappPrivkey = PrivateKey.random();
const snappPubkey = snappPrivkey.toPublicKey();


async function deployContract() {
    console.log("deploy start");

    // Deploys the snapp
    await Mina.transaction(account1, async () => {
        // account2 sends 1000000000 to the new snapp account
        const amount = UInt64.fromNumber(1000000000);
        const p = await Party.createSigned(account2);
        p.balance.subInPlace(amount);
        
        console.log("init accountDbCommitment: ", testDb.commitment().toString());
        snapp = new ZKPass(amount, snappPubkey, testDb.commitment());
    })
    .send()
    .wait()
    .catch((e) => {
        console.log(e);
    });     
}

async function registerAccount(
    name: string, 
    withDrawPublicKey: PublicKey, 
    authPublicKey: PublicKey,
    ownerMail: string,
) {
    console.log("register account");
    await Mina.transaction(account1, async () => {
  
        await snapp.registerAccount(
          packBytes(name), 
          withDrawPublicKey,
          authPublicKey,
          packBytes(ownerMail),
          testDb);
      })
        .send()
        .wait()
        .catch((e) => {
            console.log(e);
        }); 
}

async function deposit(
    senderPrivateKey: PrivateKey,
    depositName: string,
    depositAmount: number,
) {
    console.log("deposit");
    await Mina.transaction(account2, async () => {
        const amount = UInt64.fromNumber(depositAmount);
        const sender = await Party.createSigned(senderPrivateKey);
    
        await snapp.deposit(sender, packBytes(depositName), amount, testDb);
      })
        .send()
        .wait()
        .catch((e) => {
            console.log(e);
        }); 
}

async function transferToName(
    withDrawPrivateKey: PrivateKey,
    fromName: string,
    toName: string,
    transferAmount: number
) {
  console.log("transfer to name");
  const { nonce: snappNonce2 } = await Mina.getAccount(snappPubkey);
  console.log("nonce: ", snappNonce2.toString());

  await Mina.transaction(account2, async () => {
      // transfer fund
      const amount = UInt64.fromNumber(transferAmount);

      await snapp.transferToName(
        SignatureWithName.create(withDrawPrivateKey, snappNonce2.toFields(), packBytes(fromName)), 
        packBytes(toName),
        amount,
        testDb
      );
    })
      .send()
      .wait()
      .catch((e) => {
          console.log(e);
      });
}

async function withDraw(
    receiverAddress: PublicKey,
    name: string,
    withDrawAmount: number,
    withDrawPrivateKey: PrivateKey
) {
   console.log("withDraw");
   const { nonce: snappNonce } = await Mina.getAccount(snappPubkey);
   console.log("nonce: ", snappNonce.toString());
 
   await Mina.transaction(account1, async () => {
     // withdraw fund
     const amount = UInt64.fromNumber(withDrawAmount);
     const receiver = Party.createUnsigned(receiverAddress);
 
     await snapp.withdraw(
       receiver, 
       packBytes(name), 
       amount,
       SignatureWithSigner.create(withDrawPrivateKey, snappNonce.toFields()),
       testDb
     );
   })
     .send()
     .wait()
     .catch((e) => {
        console.log(e);
    });
}