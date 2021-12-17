import {
  Field,
  PrivateKey,
  PublicKey,
  SmartContract,
  state,
  State,
  method,
  UInt64,
  Party,
  Poseidon,
  UInt32,
  Circuit,
} from 'snarkyjs';
import {
  SignatureWithName, Account, SignatureWithSigner
} from "./contract_type";
import { AccountDb, checkProof } from "./mock";

export { ZKPass, validateAuth };

class ZKPass extends SmartContract {
  @state(Field) accountDbCommitment: State<Field>;

  constructor(
      initialBalance: UInt64,
      address: PublicKey,
      accountDbCommitment: Field,
  ) {
      super(address);
      this.balance.addInPlace(initialBalance);
      this.accountDbCommitment = State.init(accountDbCommitment);
  }

  @method async registerAccount(
    name: Field, 
    withDrawPublicKey: PublicKey,
    authPublicKey: PublicKey,
    ownerMail: Field,
    accountDb: AccountDb
    ) {
      //verify data by merkle proof
      const accountDbCommitment = await this.accountDbCommitment.get();

      //check if name exists
      let [ existAccount, mem ] = accountDb.get(name);
      existAccount.isSome.assertEquals(false);
      checkProof(mem, accountDbCommitment, existAccount.value).assertEquals(true);
      
      
      //init a account
      let withDrawKeyHash = Poseidon.hash(withDrawPublicKey.toFields());
      let authKeyHash = Poseidon.hash(authPublicKey.toFields());
      let ownerMailHash = Poseidon.hash(ownerMail.toFields());
      let account = new Account(
          name,
          UInt64.zero,
          withDrawKeyHash,
          authKeyHash,
          ownerMailHash
      );
      
      accountDb.set(mem, account);
      this.accountDbCommitment.set(accountDb.commitment());
  }

  /**
   * user could modify his/her info only by old withDrawPublicKey OR old ownerMail,
   * but cannot by 'authPublicKey'.
   * @param name  
   * @param s 
   * @param newWithDrawPublicKey 
   * @param authPublicKey 
   * @param ownerMail 
   * @param accountDb 
   */
  @method async updateAccount(
    name: Field, 
    s: SignatureWithSigner,
    newWithDrawPublicKey: PublicKey,
    authPublicKey: PublicKey,
    ownerMail: Field,
    accountDb: AccountDb 
  ) {

    const accountDbCommitment = await this.accountDbCommitment.get();

    //check if name exists
    let [account, mem ] = accountDb.get(name);
    account.isSome.assertEquals(true);
    checkProof(mem, accountDbCommitment, account.value).assertEquals(true);
    
    
    //Account modification can only be done by verifying mail and a withDraw key
    //TODO: validate mail by https?

    //check owner withDraw key
    let oriWithDrawKeyHash = Poseidon.hash(s.signer.toFields());
    account.value.withDrawKeyHash.assertEquals(oriWithDrawKeyHash);
    const nonce: UInt32 = await this.nonce;
    s.signature.verify(s.signer, nonce.toFields()).assertEquals(true);

    account.value.withDrawKeyHash = Poseidon.hash(newWithDrawPublicKey.toFields());
    account.value.authKeyHash = Poseidon.hash(authPublicKey.toFields());
    account.value.ownerMailHash = Poseidon.hash(ownerMail.toFields());
    
    accountDb.set(mem, account.value);
    this.accountDbCommitment.set(accountDb.commitment());
  }

  @method async deposit(
      sender: Party<UInt32>,
      name: Field, 
      amount: UInt64, 
      accountDb: AccountDb,
  ) {
      const accountDbCommitment = await this.accountDbCommitment.get();

      //check if name exists
      let [receiverAccount, mem ] = accountDb.get(name);
      receiverAccount.isSome.assertEquals(true);
      checkProof(mem, accountDbCommitment, receiverAccount.value).assertEquals(true);

      Circuit.asProver(() => {
        console.log("deposit> account balance: ", receiverAccount.value.balance.toString());
        console.log("deposit> deposit amount: ", amount.toString());
      });

      sender.balance.subInPlace(amount);
      this.balance.addInPlace(amount);
      receiverAccount.value.balance = receiverAccount.value.balance.add(amount);
      
      accountDb.set(mem, receiverAccount.value);
      this.accountDbCommitment.set(accountDb.commitment());
  }

  @method async transferToName(
      sender: SignatureWithName,
      receiverName: Field,
      amount: UInt64,
      accountDb: AccountDb,
  ) {
      const accountDbCommitment = await this.accountDbCommitment.get();

      //check if name exists
      let [senderAccount, senderMem ] = accountDb.get(sender.name);
      senderAccount.isSome.assertEquals(true);
      checkProof(senderMem, accountDbCommitment, senderAccount.value).assertEquals(true);

      let [receiverAccount, receiverMem] = accountDb.get(receiverName);
      receiverAccount.isSome.assertEquals(true);
      checkProof(receiverMem, accountDbCommitment, receiverAccount.value).assertEquals(true);

      senderAccount.value.balance.lt(amount).assertEquals(false);;

      let senderPublicKeyHash = Poseidon.hash(sender.signer.toFields());
      senderAccount.value.withDrawKeyHash.assertEquals(senderPublicKeyHash);

      const nonce: UInt32 = await this.nonce;
      let message = nonce.toFields();
      message.push(sender.name);
      sender.signature.verify(sender.signer, message).assertEquals(true);

      senderAccount.value.balance = senderAccount.value.balance.sub(amount);
      receiverAccount.value.balance = receiverAccount.value.balance.add(amount);

      accountDb.set(senderMem, senderAccount.value);
      accountDb.set(receiverMem, receiverAccount.value);
      this.accountDbCommitment.set(accountDb.commitment());
  }

  @method async withdraw(
      receiver: Party<void>,
      name: Field, 
      amount: UInt64, 
      s: SignatureWithSigner,
      accountDb: AccountDb
  ) {

      const accountDbCommitment = await this.accountDbCommitment.get();

      //check if name exists
      let [account, mem ] = accountDb.get(name);
      account.isSome.assertEquals(true);
      checkProof(mem, accountDbCommitment, account.value).assertEquals(true);

      Circuit.asProver(() => {
        console.log("withdraw> account balance: ", account.value.balance.toString());
        console.log("withdraw> withdraw amount: ", amount.toString());
      });

      //check amount
      //TODO: Why is there no assertGte? a bug 
      account.value.balance.lt(amount).assertEquals(false);

      //check owner
      let withDrawKeyHash = Poseidon.hash(s.signer.toFields());
      account.value.withDrawKeyHash.assertEquals(withDrawKeyHash);
      const nonce: UInt32 = await this.nonce;
      s.signature.verify(s.signer, nonce.toFields()).assertEquals(true);

      this.balance.subInPlace(amount);
      receiver.balance.addInPlace(amount);
      account.value.balance = account.value.balance.sub(amount);

      accountDb.set(mem, account.value);
      this.accountDbCommitment.set(accountDb.commitment());
  }

}

/**
 * Single Sign On:
 *   Enable other websites to redirect to 'ZKPass Owner auth page' to trigger this function to get Owner's authorization
 * @param s 
 * @param msg 
 * @param accountDb 
 * @returns 
 */
function validateAuth(s: SignatureWithName, msg: Field[],  accountDb: AccountDb): boolean {
  let verifySign = s.signature.verify(s.signer, msg).toBoolean();
  let name = s.name;

  //check if name exists
  let [account, mem ] = accountDb.get(name);
  let exists = account.isSome.toBoolean();
  if(!exists) {
    throw new Error("Account not exists!");
  }

  let checkAccount = account.value.authKeyHash.equals(Poseidon.hash(s.signer.toFields())).toBoolean();
  if(verifySign && checkAccount) {
     return true;
  } 
  
  return false;
}