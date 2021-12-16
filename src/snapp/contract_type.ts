import {
    CircuitValue,
    prop,
    Signature,
    PublicKey,
    Field,
    UInt64,
    PrivateKey
} from "snarkyjs";
import { fieldToHex } from "./util";

class SignatureWithName extends CircuitValue {
    @prop signature: Signature;
    @prop signer: PublicKey;
    @prop name: Field;
  
    constructor(signature: Signature, signer: PublicKey, name: Field) {
      super();
      this.signature = signature;
      this.signer = signer;
      this.name = name;
    }

    static create(signer: PrivateKey, message: Field[], name: Field): SignatureWithName {
      message.push(name);
      return new SignatureWithName(
        Signature.create(signer, message),
        signer.toPublicKey(),
        name
      );
    }
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

    toString(): string {
      return "name_hex: " + fieldToHex(this.name) + ", balance: " + this.balance.toString();
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


  export { SignatureWithName, Account, SignatureWithSigner };