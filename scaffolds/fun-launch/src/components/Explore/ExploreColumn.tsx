'use client';

import { useQueryClient } from '@tanstack/react-query';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { categorySortBy, categorySortDir, createPoolSorter } from '@/components/Explore/pool-utils';
import { ApeQueries, GemsTokenListQueryArgs, QueryData } from '@/components/Explore/queries';
import { ExploreTab, normalizeSortByField } from '@/components/Explore/types'; 
import { TokenCardList } from '@/components/TokenCard/TokenCardList';
import { useExploreGemsTokenList } from '@/hooks/useExploreGemsTokenList';
import { EXPLORE_FIXED_TIMEFRAME, useExplore } from '@/contexts/ExploreProvider';
import { Pool } from '@/contexts/types';
import { isHoverableDevice, useBreakpoint } from '@/lib/device';
import { PausedIndicator } from './PausedIndicator';

type ExploreColumnProps = {
  tab: ExploreTab;
};

export const ExploreTabTitleMap: Record<ExploreTab, string> = {
  [ExploreTab.NEW]: `New`,
  [ExploreTab.GRADUATING]: `Soon`,
  [ExploreTab.GRADUATED]: `Bonded`,
};

export const ExploreColumn: React.FC<ExploreColumnProps> = ({ tab }) => {
  const { pausedTabs, setTabPaused, request } = useExplore();
  const isPaused = pausedTabs[tab];
  const setIsPaused = useCallback(
    (paused: boolean) => setTabPaused(tab, paused),
    [setTabPaused, tab]
  );

  return (
    <div className="flex flex-col h-full lg:h-[calc(100vh-300px)]">
      {/* Desktop Column Header */}
      <div className="flex items-center justify-between p-3 max-lg:hidden">
        <div className="flex items-center gap-x-2">
          <h2 className="font-bold text-neutral-300">{ExploreTabTitleMap[tab]}</h2>
          {isPaused && <PausedIndicator />}
        </div>
      </div>

      {/* List */}
      <div className="relative flex-1 border-neutral-850 text-xs lg:border-t h-full">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-2 bg-gradient-to-b from-neutral-950 to-transparent" />
        <TokenCardListContainer
          tab={tab}
          request={request}
          isPaused={isPaused}
          setIsPaused={setIsPaused}
        />
      </div>
    </div>
  );
};

type TokenCardListContainerProps = {
  tab: ExploreTab;
  request: Required<GemsTokenListQueryArgs>;
  isPaused: boolean;
  setIsPaused: (isPaused: boolean) => void;
};

const timeframe = EXPLORE_FIXED_TIMEFRAME;

const TokenCardListContainer: React.FC<TokenCardListContainerProps> = memo(
  ({ tab, request, isPaused, setIsPaused }) => {
    const queryClient = useQueryClient();
    const breakpoint = useBreakpoint();
    const isMobile = breakpoint === 'md' || breakpoint === 'sm' || breakpoint === 'xs';

    const listRef = useRef<HTMLDivElement>(null);

    const { data: currentData, status } = useExploreGemsTokenList((data) => data[tab]);

    const [snapshotData, setSnapshotData] = useState<Pool[]>();

    const handleMouseEnter = useCallback(() => {
      if (!isHoverableDevice() || status !== 'success') return;

      // Only snapshot once
      if (!isPaused) {
        setSnapshotData(currentData?.pools);
      }
      setIsPaused(true);
    }, [currentData?.pools, isPaused, setIsPaused, status]);

    const handleMouseLeave = useCallback(() => {
      if (!isHoverableDevice()) return;
      setIsPaused(false);
    }, [setIsPaused]);

    // ✅ FIX: always return a valid structure, even if prev is undefined
    useEffect(() => {
      queryClient.setQueriesData(
        {
          type: 'active',
          queryKey: ApeQueries.gemsTokenList(request).queryKey,
        },
        (prev?: QueryData<typeof ApeQueries.gemsTokenList>) => {
          const prevPools = prev?.[tab]?.pools ?? [];

          const pools = [...prevPools];

          // Re-sort safely
          const sortDir = categorySortDir(tab);
          const defaultSortBy = categorySortBy(tab, timeframe);
          const sortBy = defaultSortBy ? normalizeSortByField(defaultSortBy) : undefined;

          if (sortBy) {
            const sorter = createPoolSorter({ sortBy, sortDir }, timeframe);
            pools.sort(sorter);
          }

          return {
            ...prev,
            [tab]: {
              ...(prev?.[tab] ?? {}),
              pools,
            },
            args: {
              ...prev?.args,
              timeframe,
            },
          };
        }
      );
    }, [queryClient, tab, request]);

    const handleScroll = useCallback(() => {
      if (!isMobile || !listRef.current) return;

      const top = listRef.current.getBoundingClientRect().top;

      if (top <= 0) {
        if (!isPaused) {
          setSnapshotData(currentData?.pools);
        }
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    }, [currentData?.pools, isPaused, setIsPaused, isMobile]);

    // ✅ FIXED scroll pause effect – always returns a valid value
    useEffect(() => {
      if (!isMobile) {
        // Explicitly return undefined so TS knows this branch is valid
        return undefined;
      }

      handleScroll(); // initial check for mobile

      window.addEventListener('scroll', handleScroll, { passive: true });

      return () => {
        window.removeEventListener('scroll', handleScroll);
        setIsPaused(false);
      };
    }, [isMobile, setIsPaused, handleScroll]);

    // Merge snapshot + live data
    const displayData = isPaused
      ? snapshotData?.map((snapshotPool) => {
          const current = currentData?.pools.find(
            (p) => p.baseAsset.id === snapshotPool.baseAsset.id
          );
          return current ?? snapshotPool;
        })
      : currentData?.pools;

    return (
      <TokenCardList
        ref={listRef}
        data={displayData}
        status={status}
        timeframe={timeframe}
        trackPools
        className="lg:h-0 lg:min-h-full"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
    );
  }
);

TokenCardListContainer.displayName = 'TokenCardListContainer';
