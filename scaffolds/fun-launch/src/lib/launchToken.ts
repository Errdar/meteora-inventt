import { autoBuySupply } from "@/lib/autoBuySupply";
import { Connection, Keypair } from "@solana/web3.js";

...

if (poolTx.success) {
  const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC!);
  const creatorKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(process.env.CREATOR_PRIVATE_KEY!))
  );

  await autoBuySupply({
    connection,
    creatorKeypair,
    tokenMint: poolTx.tokenMint,
    amountInSOL: 0.5  // <-- change this value as desired
  });
}

import { generateVanityMintSuffix } from "@/lib/vanityMint";
import { Keypair } from "@solana/web3.js";

async function launchToken(options: { vanitySuffix?: string }) {
  let mintKeypair: Keypair;

  if (options.vanitySuffix && options.vanitySuffix.length > 0) {
    console.log(`🎯 Generating vanity suffix: ${options.vanitySuffix}`);
    const vanity = generateVanityMintSuffix(options.vanitySuffix);
    mintKeypair = Keypair.fromSecretKey(vanity.secretKey);
  } else {
    mintKeypair = Keypair.generate();
  }

  // ✅ Now use mintKeypair in the bonding curve creation
}
