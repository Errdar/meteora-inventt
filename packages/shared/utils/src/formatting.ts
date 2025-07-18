/**
 * Truncate a string in the middle with ellipsis
 */
export function truncateMiddle(str: string, maxLength: number = 10): string {
  if (str.length <= maxLength) return str;

  const charsToShow = maxLength - 3; // 3 for the ellipsis
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);

  return str.substring(0, frontChars) + '...' + str.substring(str.length - backChars);
}

/**
 * Format a wallet address for display
 */
export function formatAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Format a number with thousand separators
 */
export function formatNumber(num: number | string, decimals: number = 2): string {
  const number = typeof num === 'string' ? parseFloat(num) : num;

  if (isNaN(number)) return '0';

  return number.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a token amount with proper decimals
 */
export function formatTokenAmount(
  amount: string | number,
  decimals: number,
  displayDecimals: number = 6
): string {
  const divisor = Math.pow(10, decimals);
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  const formatted = value / divisor;

  return formatNumber(formatted, displayDecimals);
}

/**
 * Convert a number to a compact format (e.g., 1.2K, 3.4M)
 */
export function formatCompact(num: number): string {
  const formatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 2,
  });

  return formatter.format(num);
}

/**
 * Format a percentage value
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${formatNumber(value, decimals)}%`;
}

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date | string | number): string {
  const dateObj = new Date(date);

  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format seconds to a human-readable duration
 */
export function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}
