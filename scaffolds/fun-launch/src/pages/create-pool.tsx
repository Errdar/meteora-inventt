"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { z } from "zod";
import Header from "../components/Header";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";

// ✅ Tell Vercel/Next.js: NO prerendering or caching
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

// ✅ Lazy-load crypto + Solana deps only in browser
let Keypair: any;
let Transaction: any;
let bs58: any;
let nacl: any;
let randomBytes: any;

// =============================
// FORM VALIDATION SCHEMA
// =============================
const poolSchema = z.object({
  tokenName: z.string().min(3, "Token name must be at least 3 characters"),
  tokenSymbol: z.string().min(1, "Token symbol is required"),
  tokenLogo: z.instanceof(File, { message: "Token logo is required" }).optional(),
  website: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  twitter: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
});

interface FormValues {
  tokenName: string;
  tokenSymbol: string;
  tokenLogo: File | undefined;
  website?: string;
  twitter?: string;
}

// =============================
// LOAD BROWSER-ONLY CRYPTO LIBS
// =============================
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

// ✅ Vanity check helper
function matchesVanity(address: string, suffix: string, prefix: string, caseInsensitive: boolean) {
  const addr = caseInsensitive ? address.toLowerCase() : address;
  const suf = caseInsensitive ? suffix.toLowerCase() : suffix;
  const pre = caseInsensitive ? prefix.toLowerCase() : prefix;
  return (suffix === "" || addr.endsWith(suf)) && (prefix === "" || addr.startsWith(pre));
}

// ✅ Generate vanity mint ONLY in browser
async function generateVanityMint(
  suffix: string,
  prefix: string,
  onProgress?: (attempts: number) => void
): Promise<any> {
  await loadCryptoDeps();
  let attempts = 0;
  const caseInsensitive = true;

  while (true) {
    const seed = randomBytes(32);
    const keypair = nacl.sign.keyPair.fromSeed(seed);
    const pubKey = bs58.encode(keypair.publicKey);
    if (matchesVanity(pubKey, suffix, prefix, caseInsensitive)) {
      return Keypair.fromSeed(seed);
    }
    attempts++;
    if (attempts % 5000 === 0 && onProgress) {
      onProgress(attempts);
      await new Promise((r) => setTimeout(r, 0));
    }
  }
}

// =============================
// MAIN INNER PAGE
// =============================
function CreatePoolPageInner() {
  const [walletReady, setWalletReady] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [signTransaction, setSignTransaction] = useState<any>(null);

  const address = useMemo(() => publicKey ?? undefined, [publicKey]);

  const [isLoading, setIsLoading] = useState(false);
  const [poolCreated, setPoolCreated] = useState(false);

  const [useVanity, setUseVanity] = useState(false);
  const [vanityPrefix, setVanityPrefix] = useState("");
  const [vanitySuffix, setVanitySuffix] = useState("");
  const [vanityProgress, setVanityProgress] = useState(0);

  // ✅ Load wallet adapter only in browser
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("@jup-ag/wallet-adapter").then((mod) => {
        const wallet = mod.useWallet();
        if (wallet?.publicKey) setPublicKey(wallet.publicKey.toBase58());
        if (wallet?.signTransaction) setSignTransaction(() => wallet.signTransaction);
        setWalletReady(true);
      });
    }
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
        if (!walletReady) {
          toast.error("Wallet not ready yet.");
          return;
        }

        setIsLoading(true);

        if (!value.tokenLogo) {
          toast.error("Token logo is required");
          return;
        }
        if (!signTransaction) {
          toast.error("Wallet not connected");
          return;
        }

        // ✅ Lazy load crypto deps
        await loadCryptoDeps();

        // Convert logo to Base64
        const reader = new FileReader();
        const base64File = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(value.tokenLogo!);
        });

        // ✅ Create mint (vanity or random)
        let keyPair: any;
        if (useVanity && (vanityPrefix || vanitySuffix)) {
          toast("🔍 Searching for vanity mint...");
          keyPair = await generateVanityMint(vanitySuffix, vanityPrefix, (n) =>
            setVanityProgress(n)
          );
          toast.success(`✅ Vanity mint found: ${keyPair.publicKey.toBase58()}`);
        } else {
          keyPair = Keypair.generate();
        }

        // ✅ Upload metadata (logo + mint)
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tokenLogo: base64File,
            mint: keyPair.publicKey.toBase58(),
            tokenName: value.tokenName,
            tokenSymbol: value.tokenSymbol,
            userWallet: address,
          }),
        });
        if (!uploadResponse.ok) throw new Error((await uploadResponse.json()).error);

        const { poolTx } = await uploadResponse.json();
        const transaction = Transaction.from(Buffer.from(poolTx, "base64"));
        transaction.sign(keyPair);

        const signedTransaction = await signTransaction(transaction);
        const sendResponse = await fetch("/api/send-transaction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            signedTransaction: signedTransaction.serialize().toString("base64"),
          }),
        });

        if (!sendResponse.ok) throw new Error((await sendResponse.json()).error);

        const { success } = await sendResponse.json();
        if (success) {
          toast.success("✅ Pool created successfully!");
          setPoolCreated(true);
        }
      } catch (error: any) {
        console.error("Error creating pool:", error);
        toast.error(error.message ?? "Failed to create pool");
      } finally {
        setIsLoading(false);
      }
    },
    validators: {
      onSubmit: ({ value }) => {
        const result = poolSchema.safeParse(value);
        return result.success ? undefined : result.error.formErrors.fieldErrors;
      },
    },
  });

  return (
    <>
      <Head>
        <title>Create Pool - Vanity Mint Option</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-b text-white">
        <Header />
        <main className="container mx-auto px-4 py-10">
          <h1 className="text-4xl font-bold mb-6">Create Pool</h1>

          {!poolCreated ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit();
              }}
              className="space-y-4"
            >
              {/* Token Name */}
              <label className="block">
                Token Name:
                <input
                  type="text"
                  className="w-full text-black p-2 rounded"
                  {...form.register("tokenName")}
                />
              </label>

              {/* Token Symbol */}
              <label className="block">
                Token Symbol:
                <input
                  type="text"
                  className="w-full text-black p-2 rounded"
                  {...form.register("tokenSymbol")}
                />
              </label>

              {/* Token Logo */}
              <label className="block">
                Token Logo:
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => form.setFieldValue("tokenLogo", e.target.files?.[0])}
                />
              </label>

              {/* Vanity mint toggle */}
              <div className="border p-4 rounded">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={useVanity}
                    onChange={(e) => setUseVanity(e.target.checked)}
                  />
                  <span>Use vanity mint?</span>
                </label>

                {useVanity && (
                  <div className="mt-3 space-y-2">
                    <label className="block">
                      Prefix:
                      <input
                        type="text"
                        className="w-full text-black p-2 rounded"
                        value={vanityPrefix}
                        onChange={(e) => setVanityPrefix(e.target.value)}
                        placeholder="Optional e.g. SOL"
                      />
                    </label>
                    <label className="block">
                      Suffix:
                      <input
                        type="text"
                        className="w-full text-black p-2 rounded"
                        value={vanitySuffix}
                        onChange={(e) => setVanitySuffix(e.target.value)}
                        placeholder="Optional e.g. XYZ"
                      />
                    </label>

                    {vanityProgress > 0 && (
                      <p className="text-xs text-gray-300">
                        Tried {vanityProgress.toLocaleString()} candidates...
                      </p>
                    )}
                  </div>
                )}
              </div>

              <SubmitButton isSubmitting={isLoading} />
            </form>
          ) : (
            <PoolCreationSuccess />
          )}
        </main>
      </div>
    </>
  );
}

// ✅ Submit Button
function SubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className="mt-4 px-6 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
    >
      {isSubmitting ? "Creating Pool..." : "Create Pool"}
    </button>
  );
}

// ✅ Success UI
function PoolCreationSuccess() {
  return (
    <div className="mt-6 p-4 border rounded text-center">
      <h2 className="text-2xl font-bold mb-2">✅ Pool Created Successfully!</h2>
      <p className="text-sm text-gray-300">Your pool has been created and deployed on Solana.</p>
      <Link
        href="/"
        className="inline-block mt-4 px-4 py-2 bg-green-600 rounded text-white hover:bg-green-700"
      >
        Go back to Dashboard
      </Link>
    </div>
  );
}

// ✅ FINAL EXPORT disables SSR COMPLETELY
export default dynamic(() => Promise.resolve(CreatePoolPageInner), { ssr: false });
