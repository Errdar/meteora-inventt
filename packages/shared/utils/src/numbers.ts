import BN from 'bn.js';
import { Decimal } from 'decimal.js';

/**
 * Convert a number to BN (Big Number)
 */
export function toBN(value: string | number | BN): BN {
  if (BN.isBN(value)) {
    return value;
  }
  return new BN(value.toString());
}

/**
 * Convert a BN to string
 */
export function fromBN(value: BN): string {
  return value.toString();
}

/**
 * Add two BN values
 */
export function addBN(a: BN, b: BN): BN {
  return a.add(b);
}

/**
 * Subtract two BN values
 */
export function subBN(a: BN, b: BN): BN {
  return a.sub(b);
}

/**
 * Multiply two BN values
 */
export function mulBN(a: BN, b: BN): BN {
  return a.mul(b);
}

/**
 * Divide two BN values
 */
export function divBN(a: BN, b: BN): BN {
  return a.div(b);
}

/**
 * Convert to Decimal for precise calculations
 */
export function toDecimal(value: string | number | Decimal): Decimal {
  return new Decimal(value);
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, percentage: number): number {
  return new Decimal(value).mul(percentage).div(100).toNumber();
}
