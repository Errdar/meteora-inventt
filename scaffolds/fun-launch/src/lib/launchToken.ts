import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { autoBuySupply } from "./autoBuySupply";

interface LaunchTokenOptions {
  connection: Connection;
  payer: Keypair;
  tokenMint: string;
  vanitySuffix?: string;
  autoBuyAmountSOL?: number;
}

export async function launchToken({
  connection,
  payer,
  tokenMint,
  vanitySuffix,
  autoBuyAmountSOL
}: LaunchTokenOptions) {
  console.log("🚀 Launching token with mint:", tokenMint);

  // ✅ If you need a vanity suffix, handle it here
  if (vanitySuffix) {
    console.log(`✅ Vanity suffix requested: ${vanitySuffix}`);
    // You can handle vanity suffix logic here if needed
  }

  // ✅ After the pool is created, optionally auto-buy
  if (autoBuyAmountSOL && autoBuyAmountSOL > 0) {
    console.log(`🤖 Auto-buying ${autoBuyAmountSOL} SOL worth of supply...`);
    await autoBuySupply({
      connection,
      creatorKeypair: payer,
      tokenMint,
      amountInSOL: autoBuyAmountSOL
    });
  }

  console.log("✅ Token launch complete!");
}
