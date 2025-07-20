"use client";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { UnifiedWalletProvider, Adapter } from "@jup-ag/wallet-adapter";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useEffect, useMemo, useState } from "react";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default function App({ Component, pageProps }: AppProps) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const wallets: Adapter[] = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()] as Adapter[],
    []
  );
  const queryClient = useMemo(() => new QueryClient(), []);

  if (!hydrated) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <UnifiedWalletProvider
        wallets={wallets}
        config={{
          env: "mainnet-beta",
          autoConnect: true,
          metadata: { name: "UnifiedWallet", description: "CSR App", url: "https://jup.ag", iconUrls: ["https://jup.ag/favicon.ico"] },
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
