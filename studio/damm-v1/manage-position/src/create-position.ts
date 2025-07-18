import AmmImpl from '@meteora-ag/dynamic-amm-sdk';
import { Connection, PublicKey, Keypair, ComputeBudgetProgram } from '@solana/web3.js';
import bs58 from 'bs58';
import 'dotenv/config';
import { BN, AnchorProvider, Wallet } from '@coral-xyz/anchor';

const PAYER_PRIVATE_KEY = process.env.PAYER_PRIVATE_KEY;
if (!PAYER_PRIVATE_KEY) {
  throw new Error('PRIVATE_KEY is not set');
}
const payerSecretKey = bs58.decode(PAYER_PRIVATE_KEY);
const payer = Keypair.fromSecretKey(payerSecretKey);

const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY || PAYER_PRIVATE_KEY;
if (!OWNER_PRIVATE_KEY) {
  throw new Error('OWNER_PRIVATE_KEY is not set');
}
const ownerSecretKey = bs58.decode(OWNER_PRIVATE_KEY);
const owner = Keypair.fromSecretKey(ownerSecretKey);
console.log('Owner public key:', owner.publicKey.toBase58());

const connection = new Connection(process.env.RPC_URL || 'https://api.mainnet-beta.solana.com');

async function createPosition() {
  try {
    // Variables to be configured
    // Example of creating a position in a USDC/SOL pool with 100 USDC and the respective SOL amount
    const poolAddress = new PublicKey('5yuefgbJJpmFNK2iiYbLSpv1aZXq7F9AUKkZKErTYCvs');
    const slippage = 0.1; // Max to 2 decimal place
    const amountA = 100;
    //

    // init AMM instance
    const amm = await AmmImpl.create(connection as any, poolAddress);

    const provider = new AnchorProvider(connection, new Wallet(payer), {
      commitment: 'confirmed',
    });

    const balance = true;

    // Get deposit quote
    const { poolTokenAmountOut, tokenAInAmount, tokenBInAmount } = amm.getDepositQuote(
      new BN(amountA).mul(new BN(10).pow(new BN(amm.tokenAMint.decimals))),
      new BN(0),
      balance,
      slippage
    );
    console.log('Pool Token Output', poolTokenAmountOut.toNumber() / 10 ** amm.decimals);
    console.log('Token A Input', tokenAInAmount.toNumber() / 10 ** amm.tokenAMint.decimals);
    console.log('Token B Input', tokenBInAmount.toNumber() / 10 ** amm.tokenBMint.decimals);

    const depositTx = await amm.deposit(
      payer.publicKey,
      tokenAInAmount,
      tokenBInAmount,
      poolTokenAmountOut
    );
    const depositResult = await provider.sendAndConfirm(depositTx); // Transaction hash
    console.log('Transaction Signature', depositResult);
    console.log('Transaction: https://solscan.io/tx/' + depositResult);
  } catch (error) {
    console.error(error);
  }
}

createPosition()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
