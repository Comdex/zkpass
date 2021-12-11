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
    Signature
  } from 'snarkyjs';

  import { packBytes } from './util.js';

  const AccountDbDepth: number = 32;
  const AccountDb = KeyedAccumulatorFactory<Field, Account>(
    AccountDbDepth
  );

  type AccountDb = InstanceType<typeof AccountDb>;

  class Account extends CircuitValue {
    @prop balance: UInt64;
    @prop nonce: UInt32;
    @prop publicKeyHash: Field;
  
    constructor(balance: UInt64, nonce: UInt32, publicKeyHash: Field) {
      super();
      this.balance = balance;
      this.nonce = nonce;
      this.publicKeyHash = publicKeyHash;
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

    @method async registerAccount(name: Field, publicKey: PublicKey, accountDb: AccountDb) {
        //check data consistency
        const accountDbCommitment = await this.accountDbCommitment.get();
        accountDbCommitment.assertEquals(accountDb.commitment());

        //check if name exists
        let [{ isSome }, mem ] = accountDb.get(name);
        isSome.assertEquals(false);
        
        //init a account
        let publicKeyHash = Poseidon.hash(publicKey.toFields());
        let account = new Account(
            UInt64.zero,
            UInt32.zero,
            publicKeyHash
        );
        
        accountDb.set(mem, account);
        this.accountDbCommitment.set(accountDb.commitment());
    }

    @method async deposit(name: Field, amount: UInt64, accountDb: AccountDb) {
        //check data consistency
        const accountDbCommitment = await this.accountDbCommitment.get();
        accountDbCommitment.assertEquals(accountDb.commitment());

        //check if name exists
        let [receiverAccount, mem ] = accountDb.get(name);
        receiverAccount.isSome.assertEquals(true);

        this.balance.addInPlace(amount);
        receiverAccount.value.balance = receiverAccount.value.balance.add(amount);
        
        accountDb.set(mem, receiverAccount.value);
        this.accountDbCommitment.set(accountDb.commitment());
    }

    @method async withdraw(
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
        let publicKeyHash = Poseidon.hash(s.signer.toFields());
        account.value.publicKeyHash.assertEquals(publicKeyHash);
        const nonce: UInt32 = await this.nonce;
        s.signature.verify(s.signer, nonce.toFields()).assertEquals(true);

        this.balance.subInPlace(amount);
        account.value.balance = account.value.balance.sub(amount);

        accountDb.set(mem, account.value);
        this.accountDbCommitment.set(accountDb.commitment());
    }

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
    
    let initAccountDb = new AccountDb(Field.zero);
    
    // Deploys the snapp
    await Mina.transaction(account1, async () => {
        // account2 sends 1000000000 to the new snapp account
        const amount = UInt64.fromNumber(1000000000);
        const p = await Party.createSigned(account2);
        p.balance.subInPlace(amount);

        snappInstance = new ZKPass(amount, snappPubkey, initAccountDb.commitment());
    })
    .send()
    .wait();

    await Mina.transaction(account1, async () => {
        // account2 sends 1000000000 to the new snapp account
        const amount = UInt64.fromNumber(2000000000);
        const p = await Party.createSigned(account2);
        p.balance.subInPlace(amount);
    
        snappInstance.registerAccount(packBytes('Mina'), account1.toPublicKey(), initAccountDb);
      })
        .send()
        .wait();

    const a = await Mina.getAccount(snappPubkey);
    console.log('final state value', a.snapp.appState[0].toString());

  }

  run();
  shutdown();