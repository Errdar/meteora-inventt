import {
  DynamicBondingCurveClient,
  CollectFeeMode,
  TokenType,
  ActivationType,
  MigrationOption,
  BaseFeeMode,
  MigrationFeeOption,
  TokenDecimal,
  buildCurveWithMarketCap,
  TokenUpdateAuthorityOption,
} from '@meteora-ag/dynamic-bonding-curve-sdk';
import { NATIVE_MINT } from '@solana/spl-token';
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction } from '@solana/web3.js';
import bs58 from 'bs58';
import 'dotenv/config';

const PAYER_PRIVATE_KEY = process.env.PAYER_PRIVATE_KEY;
if (!PAYER_PRIVATE_KEY) {
  throw new Error('PRIVATE_KEY is not set');
}
const payerSecretKey = bs58.decode(PAYER_PRIVATE_KEY);
const payer = Keypair.fromSecretKey(payerSecretKey);

const connection = new Connection(process.env.RPC_URL || 'https://api.mainnet-beta.solana.com');

async function createConfig() {
  const config = Keypair.generate();
  console.log(`Config account: ${config.publicKey.toString()}`);

  const feeClaimer = new PublicKey(process.env.PARTNER_PRIVATE_KEY || '');

  const configKeyParams = buildCurveWithMarketCap({
    totalTokenSupply: 1000000000,
    initialMarketCap: 20,
    migrationMarketCap: 320,
    migrationOption: MigrationOption.MET_DAMM_V2,
    tokenBaseDecimal: TokenDecimal.SIX,
    tokenQuoteDecimal: TokenDecimal.NINE,
    lockedVestingParam: {
      totalLockedVestingAmount: 0,
      numberOfVestingPeriod: 0,
      cliffUnlockAmount: 0,
      totalVestingDuration: 0,
      cliffDurationFromMigrationTime: 0,
    },
    baseFeeParams: {
      baseFeeMode: BaseFeeMode.FeeSchedulerLinear,
      feeSchedulerParam: {
        startingFeeBps: 100,
        endingFeeBps: 100,
        numberOfPeriod: 0,
        totalDuration: 0,
      },
    },
    dynamicFeeEnabled: true,
    activationType: ActivationType.Slot,
    collectFeeMode: CollectFeeMode.QuoteToken,
    migrationFeeOption: MigrationFeeOption.FixedBps100,
    tokenType: TokenType.SPL,
    partnerLpPercentage: 0,
    creatorLpPercentage: 0,
    partnerLockedLpPercentage: 100,
    creatorLockedLpPercentage: 0,
    creatorTradingFeePercentage: 0,
    leftover: 10000,
    tokenUpdateAuthority: TokenUpdateAuthorityOption.Immutable,
    migrationFee: {
      feePercentage: 0,
      creatorFeePercentage: 0,
    },
  });

  console.log('curve config', configKeyParams);

  try {
    const client = new DynamicBondingCurveClient(connection, 'confirmed');

    const transaction = await client.partner.createConfig({
      config: config.publicKey,
      feeClaimer,
      leftoverReceiver: feeClaimer,
      quoteMint: NATIVE_MINT,
      payer: payer.publicKey,
      ...configKeyParams,
    });

    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = payer.publicKey;

    transaction.partialSign(config);

    const signature = await sendAndConfirmTransaction(connection, transaction, [payer, config], {
      commitment: 'confirmed',
    });

    console.log(`Config created successfully!`);
    console.log(`Transaction: https://solscan.io/tx/${signature}`);
    console.log(`Config address: ${config.publicKey.toString()}`);
  } catch (error) {
    console.error('Failed to create config:', error);
  }
}

createConfig()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
