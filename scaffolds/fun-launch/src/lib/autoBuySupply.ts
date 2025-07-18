import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Jupiter, RouteInfo } from "@jup-ag/core";

export interface AutoBuyOptions {
  connection: Connection;
  creatorKeypair: Keypair;
  tokenMint: string;
  amountInSOL: number;
}

/**
 * Auto-buy supply from a bonding curve using Jupiter swap routes.
 *
 * @param connection - Solana RPC connection
 * @param creatorKeypair - Wallet Keypair (must have SOL)
 * @param tokenMint - The mint address of the token to buy
 * @param amountInSOL - Amount of SOL to spend
 */
export async function autoBuySupply({
  connection,
  creatorKeypair,
  tokenMint,
  amountInSOL,
}: AutoBuyOptions): Promise<void> {
  try {
    console.log(`🚀 Auto-buying ${amountInSOL} SOL worth of token: ${tokenMint}`);

    const jupiter = await Jupiter.load({
      connection,
      cluster: "mainnet-beta",
      user: creatorKeypair.publicKey,
    });

    const SOL_MINT = "So11111111111111111111111111111111111111112"; // Wrapped SOL mint

    // ✅ Fetch swap routes (SOL -> token)
    const routes = await jupiter.computeRoutes({
      inputMint: new PublicKey(SOL_MINT),
      outputMint: new PublicKey(tokenMint),
      amount: Math.floor(amountInSOL * 1e9), // Convert SOL -> lamports
      slippageBps: 500, // 5% slippage tolerance
      swapMode: "ExactIn",
    });

    if (!routes || routes.routesInfos.length === 0) {
      console.error("❌ No swap routes found for auto-buy!");
      return;
    }

    const bestRoute: RouteInfo = routes.routesInfos[0];

    console.log(
      `✅ Found route: ${bestRoute.marketInfos
        .map((m) => m.label)
        .join(" -> ")}`
    );

    // ✅ Execute swap
    const { execute } = await jupiter.exchange({ routeInfo: bestRoute });
    const swapResult = await execute();

    if (swapResult.error) {
      console.error("❌ Auto-buy swap failed:", swapResult.error);
    } else {
      console.log("✅ Auto-buy success! Tx Signature:", swapResult.txid);
    }
  } catch (err) {
    console.error("❌ Auto-buy error:", err);
  }
}
