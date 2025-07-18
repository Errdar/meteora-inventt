import { CpAmm } from '@meteora-ag/cp-amm-sdk';
import { Connection, PublicKey } from '@solana/web3.js';
import 'dotenv/config';

const connection = new Connection(process.env.RPC_URL || 'https://api.mainnet-beta.solana.com');

async function getPositions() {
  //Variables to be configured
  const poolAddress = new PublicKey('');
  const userWallet = new PublicKey('');

  //

  const cpAmm = new CpAmm(connection);
  const positions = await cpAmm.getUserPositionByPool(poolAddress, userWallet);

  for (const position of positions) {
    console.log(position.position.toBase58());
  }
}

getPositions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
