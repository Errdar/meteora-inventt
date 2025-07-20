"use client"; // ✅ Always force client rendering, no SSR

import "@/styles/globals.css";
import type { AppProps } from "next/app";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

// ✅ Lazy-import Solana wallet adapters ONLY in the browser
let PhantomWalletAdapter: any;
let SolflareWalletAdapter: any;
let UnifiedWalletProvider: any;
type Adapter = any;

// ✅ Disable SSR globally for all pages
export const dynamicConfig = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

function AppInner({ Component, pageProps }: AppProps) {
  const [isClient, setIsClient] = useState(false);
  const [wallets, setWallets] = useState<Adapter[]>([]);

  // ✅ QueryClient created once
  const queryClient = useMemo(() => new QueryClient(), []);

  useEffect(() => {
    // ✅ Mark as hydrated (no SSR mismatch)
    setIsClient(true);

    // ✅ Dynamically load wallet providers ONLY on client
    import("@solana/wallet-adapter-wallets").then((mod) => {
      PhantomWalletAdapter = mod.PhantomWalletAdapter;
      SolflareWalletAdapter = mod.SolflareWalletAdapter;
      return import("@jup-ag/wallet-adapter");
    }).then((mod) => {
      UnifiedWalletProvider = mod.UnifiedWalletProvider;
      setWallets([new PhantomWalletAdapter(), new SolflareWalletAdapter()]);
    });
  }, []);

  if (!isClient || !UnifiedWalletProvider) {
    // ✅ Avoid SSR mismatches and wallet init issues
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

// ✅ Fully disable SSR for _app itself
export default dynamic(() => Promise.resolve(AppInner), { ssr: false });
