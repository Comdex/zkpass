import {
  Field,
  PrivateKey,
  PublicKey,
  SmartContract,
  state,
  State,
  method,
  UInt64,
  Mina,
  Party,
  Poseidon,
  isReady,
  shutdown,
  KeyedAccumulatorFactory,
  CircuitValue,
  prop,
  UInt32,
  Signature,
  DataStore
} from 'snarkyjs';
import { Keyed, KeyedDataStore } from 'snarkyjs/dist/server/lib/data_store';


const AccountDbDepth: number = 32;
const AccountDb = KeyedAccumulatorFactory<Field, Account>(
  AccountDbDepth
);
type AccountDb = InstanceType<typeof AccountDb>;

//convert string to Field
function packBytes(s: string): Field {
  console.assert(s.length < 32);
  let bits: Array<boolean> = [];
  for (let i = 0; i < s.length; ++i) {
    const c = s.charCodeAt(i);
    for (let j = 0; j < 8; ++j) {
      bits.push(((c >> j) & 1) === 1);
    }
  }
  return Field.ofBits(bits);
}

class Account extends CircuitValue {
  @prop name: Field;
  @prop balance: UInt64;
  @prop withDrawKeyHash: Field;
  @prop authKeyHash: Field;
  @prop ownerMailHash: Field;

  constructor(
    name: Field, 
    balance: UInt64,
    withDrawKeyHash: Field,
    authKeyHash: Field,
    ownerMailHash: Field
    ) {
    super();
    this.name = name;
    this.balance = balance;
    this.withDrawKeyHash = withDrawKeyHash;
    this.authKeyHash = authKeyHash;
    this.ownerMailHash = ownerMailHash;
  }
}

class SignatureWithSigner extends CircuitValue {
  @prop signature: Signature;
  @prop signer: PublicKey;

  constructor(signature: Signature, signer: PublicKey) {
    super();
    this.signature = signature;
    this.signer = signer;
  }

  static create(signer: PrivateKey, message: Field[]): SignatureWithSigner {
    return new SignatureWithSigner(
      Signature.create(signer, message),
      signer.toPublicKey()
    );
  }

}

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
      //check data consistency
      const accountDbCommitment = await this.accountDbCommitment.get();
      accountDbCommitment.assertEquals(accountDb.commitment());

      //check if name exists
      let [{ isSome }, mem ] = accountDb.get(name);
      isSome.assertEquals(false);
      
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
    //check data consistency
    const accountDbCommitment = await this.accountDbCommitment.get();
    accountDbCommitment.assertEquals(accountDb.commitment());

    //check if name exists
    let [account, mem ] = accountDb.get(name);
    account.isSome.assertEquals(true);
    
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
      //check data consistency
      const accountDbCommitment = await this.accountDbCommitment.get();
      accountDbCommitment.assertEquals(accountDb.commitment());

      //check if name exists
      let [receiverAccount, mem ] = accountDb.get(name);
      receiverAccount.isSome.assertEquals(true);

      sender.balance.subInPlace(amount);
      this.balance.addInPlace(amount);
      receiverAccount.value.balance = receiverAccount.value.balance.add(amount);
      
      accountDb.set(mem, receiverAccount.value);
      this.accountDbCommitment.set(accountDb.commitment());
  }

  @method async withdraw(
      receiver: Party<UInt32>,
      name: Field, 
      amount: UInt64, 
      s: SignatureWithSigner,
      accountDb: AccountDb
  ) {
      //check data consistency
      const accountDbCommitment = await this.accountDbCommitment.get();
      accountDbCommitment.assertEquals(accountDb.commitment()); 

      //check if name exists
      let [account, mem ] = accountDb.get(name);
      account.isSome.assertEquals(true);

      //check amount
      //TODO: Why is there no assertGte?
      account.value.balance.assertGt(amount);

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
export function validateAuth(s: SignatureWithSigner, msg: Field[],  accountDb: AccountDb): boolean {
  return s.signature.verify(s.signer, msg).toBoolean();
}

export async function run() {
  await isReady;

  const Local = Mina.LocalBlockchain();
  Mina.setActiveInstance(Local);
  const account1 = Local.testAccounts[0].privateKey;
  const account2 = Local.testAccounts[1].privateKey;

  const snappPrivkey = PrivateKey.random();
  const snappPubkey = snappPrivkey.toPublicKey();

  let snappInstance: ZKPass;
  
  const keyFunc = (v: Account): Field => {
      return v.name;
  };
  //It looks like the API doesn't work
  let testDb = AccountDb.create(keyFunc, DataStore.Keyed.InMemory(Account, Field, keyFunc, AccountDbDepth));
  testDb.key = keyFunc;


  // Deploys the snapp
  await Mina.transaction(account1, async () => {
      // account2 sends 1000000000 to the new snapp account
      const amount = UInt64.fromNumber(1000000000);
      const p = await Party.createSigned(account2);
      p.balance.subInPlace(amount);
      
      console.log(testDb.commitment());
      snappInstance = new ZKPass(amount, snappPubkey, testDb.commitment());
  })
  .send()
  .wait();

  // Scenario ONE 
  // user registers {'Daniel.bit' -> (['publicKey1 Hash', 'publicKey2 Hash'], 'email Hash')}
  await Mina.transaction(account1, async () => {
      // account2 sends 1000000000 to the new snapp account
      const amount = UInt64.fromNumber(1000000000);
      const p = await Party.createSigned(account2);
      p.balance.subInPlace(amount);
  
      snappInstance.registerAccount(
        packBytes('Daniel.bit'), 
        account1.toPublicKey(),
        account1.toPublicKey(),
        packBytes('Daniel@gmail.com'),
        testDb);
    })
      .send()
      .wait();
  
  // Scenario TWO 
  // user A send some amounts of 'Mina' to specified userB(name is 'Daniel')
  await Mina.transaction(account1, async () => {
      // account2 sends 1000000000 to the new snapp account
      const amount = UInt64.fromNumber(1000000000);
      const sender = await Party.createSigned(account2);
  
      snappInstance.deposit(sender, packBytes('Daniel.bit'), amount, testDb);
      })
      .send()
      .wait();

  const a = await Mina.getAccount(snappPubkey);
  console.log('final state value', a.snapp.appState[0].toString());
  
  const b = await Mina.getBalance(snappPubkey);
  console.log('snapp balance: ', b);
}

run();
shutdown(); 