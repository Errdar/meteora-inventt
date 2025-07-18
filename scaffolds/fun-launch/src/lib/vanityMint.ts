import nacl from "tweetnacl";
import bs58 from "bs58";

// ✅ Generate a mint that ends with a chosen suffix
export function generateVanityMintSuffix(suffix: string): { publicKey: string; secretKey: Uint8Array } {
  let keypair;
  let attempts = 0;

  const target = suffix.toUpperCase();

  while (true) {
    keypair = nacl.sign.keyPair();
    const pubKeyStr = bs58.encode(keypair.publicKey).toUpperCase();

    if (pubKeyStr.endsWith(target)) {
      console.log(`✅ Found vanity mint after ${attempts} attempts: ${pubKeyStr}`);
      return {
        publicKey: pubKeyStr,
        secretKey: keypair.secretKey,
      };
    }

    attempts++;
    if (attempts % 1000 === 0) {
      console.log(`🔄 Still searching... ${attempts} attempts`);
    }
  }
}
