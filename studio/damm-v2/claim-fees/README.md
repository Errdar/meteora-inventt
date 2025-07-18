## DAMM V2 Claim Fees

## Scripts

### Check Position Fees

Checks for any unclaimed fees by owner of a position

- [Get Position Fees](./src/get-position-fees.ts)

### Claim Position Fees

Claims any unclaimed fees by owner of a position

- [Claim Position Fees](./src/claim-position-fees.ts)

## Usage

1. Enter your parameters into the script

- [Get Position Fees](./src/get-position-fees.ts) Enter the pool address into `poolAddress` and the
  position address into `positionAddress`.

- [Claim Position Fees](./src/claim-position-fees.ts) Enter the pool address into `poolAddress` and
  the position address into `positionAddress`. Enter the position's owner's private key into the
  [.env file](./../../.env) if the owner is not the payer.

2. Run the script

   ```bash
   npm run <script-name>

   # Script names
   # get-position-fees
   # claim-position-fees
   ```
