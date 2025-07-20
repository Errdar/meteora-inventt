"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { z } from "zod";
import Header from "../components/Header";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";

// ✅ Force CSR, no prerendering
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

let Keypair: any, Transaction: any, bs58: any, nacl: any, randomBytes: any;
async function loadCryptoDeps() {
  if (!Keypair) {
    const solanaWeb3 = await import("@solana/web3.js");
    Keypair = solanaWeb3.Keypair;
    Transaction = solanaWeb3.Transaction;
    bs58 = (await import("bs58")).default;
    nacl = (await import("tweetnacl")).default;
    randomBytes = (await import("crypto")).randomBytes;
  }
}

function matchesVanity(address: string, suffix: string, prefix: string, ci: boolean) {
  const addr = ci ? address.toLowerCase() : address;
  const suf = ci ? suffix.toLowerCase() : suffix;
  const pre = ci ? prefix.toLowerCase() : prefix;
  return (suffix === "" || addr.endsWith(suf)) && (prefix === "" || addr.startsWith(pre));
}

async function generateVanityMint(
  suffix: string,
  prefix: string,
  onProgress?: (attempts: number) => void
) {
  await loadCryptoDeps();
  let attempts = 0;
  while (true) {
    const seed = randomBytes(32);
    const kp = nacl.sign.keyPair.fromSeed(seed);
    const pubKey = bs58.encode(kp.publicKey);
    if (matchesVanity(pubKey, suffix, prefix, true)) return Keypair.fromSeed(seed);
    if (++attempts % 5000 === 0 && onProgress) {
      onProgress(attempts);
      await new Promise((r) => setTimeout(r, 0));
    }
  }
}

const poolSchema = z.object({
  tokenName: z.string().min(3),
  tokenSymbol: z.string().min(1),
  tokenLogo: z.instanceof(File).optional(),
  website: z.string().url().optional().or(z.literal("")),
  twitter: z.string().url().optional().or(z.literal("")),
});
interface FormValues {
  tokenName: string;
  tokenSymbol: string;
  tokenLogo: File | undefined;
  website?: string;
  twitter?: string;
}

function CreatePoolInner() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  if (!hydrated) return null;

  const [walletReady, setWalletReady] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [signTransaction, setSignTransaction] = useState<any>(null);

  const address = useMemo(() => publicKey ?? undefined, [publicKey]);

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const [useVanity, setUseVanity] = useState(false);
  const [vanityPrefix, setVanityPrefix] = useState("");
  const [vanitySuffix, setVanitySuffix] = useState("");
  const [vanityProgress, setVanityProgress] = useState(0);

  useEffect(() => {
    import("@jup-ag/wallet-adapter").then((mod) => {
      const wallet = mod.useWallet();
      if (wallet?.publicKey) setPublicKey(wallet.publicKey.toBase58());
      if (wallet?.signTransaction) setSignTransaction(() => wallet.signTransaction);
      setWalletReady(true);
    });
  }, []);

  const form = useForm({
    defaultValues: {
      tokenName: "",
      tokenSymbol: "",
      tokenLogo: undefined,
      website: "",
      twitter: "",
    } as FormValues,
    onSubmit: async ({ value }) => {
      try {
        if (!walletReady) return toast.error("Wallet not ready");
        if (!value.tokenLogo) return toast.error("Token logo required");
        if (!signTransaction) return toast.error("Wallet not connected");

        setLoading(true);
        await loadCryptoDeps();

        const reader = new FileReader();
        const logoBase64 = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(value.tokenLogo!);
        });

        let keyPair;
        if (useVanity && (vanityPrefix || vanitySuffix)) {
          toast("Searching vanity mint…");
          keyPair = await generateVanityMint(vanitySuffix, vanityPrefix, setVanityProgress);
          toast.success(`Found vanity: ${keyPair.publicKey.toBase58()}`);
        } else keyPair = Keypair.generate();

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tokenLogo: logoBase64,
            mint: keyPair.publicKey.toBase58(),
            tokenName: value.tokenName,
            tokenSymbol: value.tokenSymbol,
            userWallet: address,
          }),
        });
        if (!uploadRes.ok) throw new Error((await uploadRes.json()).error);
        const { poolTx } = await uploadRes.json();

        const transaction = Transaction.from(Buffer.from(poolTx, "base64"));
        transaction.sign(keyPair);
        const signedTx = await signTransaction(transaction);

        const sendRes = await fetch("/api/send-transaction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            signedTransaction: signedTx.serialize().toString("base64"),
          }),
        });
        if (!sendRes.ok) throw new Error((await sendRes.json()).error);

        const { success } = await sendRes.json();
        if (success) {
          toast.success("Pool created!");
          setDone(true);
        }
      } catch (e: any) {
        console.error("Pool error:", e);
        toast.error(e?.message ?? "Failed to create pool");
      } finally {
        setLoading(false);
      }
    },
    validators: {
      onSubmit: ({ value }) => {
        const r = poolSchema.safeParse(value);
        return r.success ? undefined : r.error.formErrors.fieldErrors;
      },
    },
  });

  return (
    <>
      <Head><title>Create Pool</title></Head>
      <div className="min-h-screen bg-gradient-to-b text-white">
        <Header />
        <main className="container mx-auto px-4 py-10">
          <h1 className="text-4xl font-bold mb-6">Create Pool</h1>
          {!done ? (
            <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-4">
              <label className="block">
                Token Name:
                <input className="w-full text-black p-2 rounded" {...form.register("tokenName")} />
              </label>
              <label className="block">
                Token Symbol:
                <input className="w-full text-black p-2 rounded" {...form.register("tokenSymbol")} />
              </label>
              <label className="block">
                Token Logo:
                <input type="file" accept="image/*" onChange={(e) => form.setFieldValue("tokenLogo", e.target.files?.[0])} />
              </label>
              <div className="border p-4 rounded">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={useVanity} onChange={(e) => setUseVanity(e.target.checked)} />
                  <span>Use vanity mint?</span>
                </label>
                {useVanity && (
                  <div className="mt-3 space-y-2">
                    <label className="block">Prefix:<input className="w-full text-black p-2 rounded" value={vanityPrefix} onChange={(e) => setVanityPrefix(e.target.value)} /></label>
                    <label className="block">Suffix:<input className="w-full text-black p-2 rounded" value={vanitySuffix} onChange={(e) => setVanitySuffix(e.target.value)} /></label>
                    {vanityProgress > 0 && <p className="text-xs text-gray-300">Tried {vanityProgress.toLocaleString()} keys…</p>}
                  </div>
                )}
              </div>
              <button type="submit" disabled={loading} className="mt-4 px-6 py-2 rounded bg-blue-600 text-white disabled:opacity-50">
                {loading ? "Creating…" : "Create Pool"}
              </button>
            </form>
          ) : (
            <div className="mt-6 p-4 border rounded text-center">
              <h2 className="text-2xl font-bold mb-2">✅ Pool Created!</h2>
              <p className="text-sm text-gray-300">Your pool is live.</p>
              <Link href="/" className="inline-block mt-4 px-4 py-2 bg-green-600 rounded text-white hover:bg-green-700">Back to Dashboard</Link>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

// ✅ FULL CSR EXPORT
export default dynamic(() => Promise.resolve(CreatePoolInner), { ssr: false });
