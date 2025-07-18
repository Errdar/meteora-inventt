import { Bar, ResolutionString } from '@/components/AdvancedTradingView/charting_library';
import { Tx } from '@/components/Explore/types';
import {
  ChartTimeInterval,
  chartTimeIntervalToMillis,
  resolutionToChartTimeInterval,
} from '@/components/TokenChart/intervals';

export function getNextBar(
  mostRecentBar: Bar | undefined,
  swaps: Tx[],
  resolution: ResolutionString,
  baseAssetCircSupply?: number | undefined // if number, chart is showing mcap instead of price
): Bar | undefined {
  if (!mostRecentBar || swaps.length === 0) {
    return mostRecentBar;
  }

  const timeInterval = resolutionToChartTimeInterval[resolution];
  if (!timeInterval) {
    return mostRecentBar;
  }

  const newBars = constructBars(swaps, timeInterval, baseAssetCircSupply);
  const newBar = newBars[0];

  if (!newBar || newBar.time === undefined) {
    return mostRecentBar;
  }

  if (newBar.time > mostRecentBar.time) {
    // If constructing a new bar, we take into consideration the previous bar's close
    return {
      time: newBar.time,
      open: mostRecentBar.close,
      high: Math.max(mostRecentBar.close, newBar.high ?? mostRecentBar.close),
      low: Math.min(mostRecentBar.close, newBar.low ?? mostRecentBar.close),
      close: newBar.close ?? mostRecentBar.close,
      volume: newBar.volume ?? 0,
    };
  }

  // If not a new bar, we merge the bar data together
  return {
    time: mostRecentBar.time,
    open: mostRecentBar.open,
    high: Math.max(mostRecentBar.high, newBar.high ?? mostRecentBar.high),
    low: Math.min(mostRecentBar.low, newBar.low ?? mostRecentBar.low),
    close: newBar.close ?? mostRecentBar.close,
    volume: (mostRecentBar.volume ?? 0) + (newBar.volume ?? 0),
  };
}

/**
 * Returns `OHLC` candle data needed for Trading View charts.
 * Assumes `swaps` are sorted by timestamp in ascending order.
 */
function constructBars(
  swaps: Tx[],
  timeInterval: ChartTimeInterval,
  baseAssetCircSupply?: number | undefined // if number, chart is showing mcap instead of price
): Bar[] {
  if (swaps.length === 0) {
    return [];
  }

  const firstSwap = swaps[0];
  const lastSwap = swaps[swaps.length - 1];
  if (!firstSwap || !lastSwap) {
    return [];
  }

  const startMillis: number = getTimeIntervalStart(firstSwap.timestamp, timeInterval).valueOf();
  const endMillis: number = getTimeIntervalStart(lastSwap.timestamp, timeInterval).valueOf();

  const grouping: Record<string, Tx[]> = {};

  // init grouping with empty data by each unix time interval
  const intervalMillis: number = chartTimeIntervalToMillis[timeInterval];
  for (let t = startMillis; t <= endMillis; t += intervalMillis) {
    grouping[t] = [];
  }

  // assign transactions to their appropriate time interval
  for (const tx of swaps) {
    const group = getTimeIntervalStart(tx.timestamp, timeInterval).valueOf();
    const groupArray = grouping[group];
    if (groupArray) {
      groupArray.push(tx);
    }
  }

  const bars: Bar[] = Object.entries(grouping).map(([timestamp, txs]) => {
    const prices: number[] = txs
      .map((tx) => tx.usdPrice)
      .map((price) => price * (baseAssetCircSupply ?? 1));

    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];

    return {
      time: Number(timestamp),
      open: firstPrice ?? 0,
      high: prices.length > 0 ? Math.max(...prices) : 0,
      low: prices.length > 0 ? Math.min(...prices) : 0,
      close: lastPrice ?? 0,
      volume: txs.reduce((vol, tx) => vol + tx.usdVolume, 0),
    };
  });

  return bars;
}

function getTimeIntervalStart(timestamp: string | Date, timeInterval: ChartTimeInterval): Date {
  const timestampMillis = new Date(timestamp).valueOf();
  const intervalMillis = chartTimeIntervalToMillis[timeInterval];
  const startMillis = timestampMillis - (timestampMillis % intervalMillis);
  return new Date(startMillis);
}
