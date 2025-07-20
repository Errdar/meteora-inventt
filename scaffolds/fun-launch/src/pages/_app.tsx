"use client"; // ✅ Always force client rendering

import "@/styles/globals.css";
import type { AppProps } from "next/app";

import { UnifiedWalletProvider, Adapter } from "@jup-ag/wallet-adapter";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useEffect, useMemo, useState } from "react";

// ✅ Disable SSR globally for ALL pages
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default function App({ Component, pageProps }: AppProps) {
  // ✅ Detect client hydration
  const [isClient, setIsClient] = useState(false);

  // ✅ Init Solana wallets ONLY on client
  const wallets: Adapter[] = useMemo(
    () =>
      [new PhantomWalletAdapter(), new SolflareWalletAdapter()].filter(
        (item) => item && item.name && item.icon
      ) as Adapter[],
    []
  );

  // ✅ Single QueryClient instance
  const queryClient = useMemo(() => new QueryClient(), []);

  // ✅ Hydration-safe: only render after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // ✅ Avoid any SSR mismatches (renders nothing server-side)
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <UnifiedWalletProvider
        wallets={wallets}
        config={{
          env: "mainnet-beta",
          autoConnect: true,
          metadata: {
            name: "UnifiedWallet",
            description: "UnifiedWallet dApp",
            url: "https://jup.ag",
            iconUrls: ["https://jup.ag/favicon.ico"],
          },
          theme: "dark",
          lang: "en",
        }}
      >
        <Toaster />
        <Component {...pageProps} />
      </UnifiedWalletProvider>
    </QueryClientProvider>
  );
}
