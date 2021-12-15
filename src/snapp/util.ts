import { Field } from "snarkyjs";

export function fieldToHex(field: Field) {
    return BigInt(field.toString()).toString(16);
}

//convert string to Field
export function packBytes(s: string): Field {
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