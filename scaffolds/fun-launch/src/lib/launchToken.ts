import { Connection, Keypair } from "@solana/web3.js";
import { autoBuySupply } from "./autoBuySupply";

/**
 * Options for launching a token.
 */
export interface LaunchTokenOptions {
  connection: Connection;
  payer: Keypair;
  tokenMint: string;
  vanitySuffix?: string;       // optional vanity suffix for mint
  autoBuyAmountSOL?: number;   // optional amount of SOL to auto-buy after launch
}

/**
 * Launch a token, optionally using a vanity suffix,
 * and optionally auto-buy some initial supply from the bonding curve.
 */
export async function launchToken(options: LaunchTokenOptions): Promise<void> {
  const { connection, payer, tokenMint, vanitySuffix, autoBuyAmountSOL } = options;

  console.log("🚀 Launching token with mint:", tokenMint);

  // ✅ If
