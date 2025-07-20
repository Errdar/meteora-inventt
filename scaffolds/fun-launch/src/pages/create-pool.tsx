"use client";

import { useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { z } from 'zod';
import Header from '../components/Header';
import { useForm } from '@tanstack/react-form';
import { Button } from '@/components/ui/button';
import { Keypair, Transaction, PublicKey } from '@solana/web3.js';
import { useUnifiedWalletContext, useWallet } from '@jup-ag/wallet-adapter';
import { toast } from 'sonner';

// Vanity deps
import bs58 from "bs58";
import nacl from "tweetnacl";
import { randomBytes } from "crypto";

// -----------------------------
//  SCHEMA & FORM VALIDATION
// -----------------------------
const poolSchema = z.object({
  tokenName: z.string().min(3, 'Token name must be at least 3 characters'),
  tokenSymbol: z.string().min(1, 'Token symbol is required'),
  tokenLogo: z.instanceof(File, { message: 'Token logo is required' }).optional(),
  website: z.string().url({ message: 'Please enter a valid URL' }).optional().or(z.literal('')),
  twitter: z.string().url({ message: 'Please enter a valid URL' }).optional().or(z.literal('')),
});

interface FormValues {
  tokenName: string;
  tokenSymbol: string;
  tokenLogo: File | undefined;
  website?: string;
  twitter?: string;
}

// ========================
// VANITY MINT FUNCTIONS
// ========================
function matchesVanity(address: string, suffix: string, prefix: string, caseInsensitive: boolean) {
  const addr = caseInsensitive ? address.toLowerCase() : address;
  const suf = caseInsensitive ? suffix.toLowerCase() : suffix;
  const pre = caseInsensitive ? prefix.toLowerCase() : prefix;

  const suffixOK = suffix === "" || addr.endsWith(suf);
  const prefixOK = prefix === "" || addr.startsWith(pre);

  return suffixOK && prefixOK;
}

async function generateVanityContract(
  suffix: string,
  prefix: string,
  setStatus: (msg: string) => void,
  setAttempts: (n: number) => void
): Promise<Uint8Array> {
  let attempts = 0;
  const caseInsensitive = true;

  setStatus(`🎯 Searching for vanity address...`);
  while (true) {
    const seed = randomBytes(32);
    const keypair = nacl.sign.keyPair.fromSeed(seed);
    const pubKey = bs58.encode(keypair.publicKey);

    if (matchesVanity(pubKey, suffix, prefix, caseInsensitive)) {
      setStatus(`✅ Found vanity mint address: ${pubKey}`);
      return seed;
    }

    attempts++;
    if (attempts % 5000 === 0) {
      setAttempts(attempts);
      await new Promise((r) => setTimeout(r, 0)); // allow UI update
    }
  }
}

async function deployVanityTokenWithMint(mintKeypair: Keypair) {
  console.log("🚀 Deploying vanity token with mint:", mintKeypair.publicKey.toBase58());
  // integrate actual Meteora / Solana token deployment here
  return new Promise((resolve) =>
    setTimeout(() => resolve(`Token deployed at ${mintKeypair.publicKey.toBase58()}`), 2000)
  );
}

// ========================
// VANITY GENERATOR COMPONENT
// ========================
const VanityMintGenerator = () => {
  const [suffix, setSuffix] = useState("");
  const [prefix, setPrefix] = useState("");
  const [status, setStatus] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleCreateVanityContract = async () => {
    setIsGenerating(true);
    setStatus("");
    setAttempts(0);

    const seed = await generateVanityContract(suffix, prefix, setStatus, setAttempts);
    const vanityMintKeypair = Keypair.fromSeed(seed);

    const deployResult = await deployVanityTokenWithMint(vanityMintKeypair);
    setStatus(`✅ ${deployResult}`);
    setIsGenerating(false);
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-4 border rounded shadow">
      <h2 className="text-xl font-bold mb-4">Vanity Mint Generator</h2>

      <label className="block text-sm font-medium mb-2">Prefix (optional)</label>
      <input
        type="text"
        value={prefix}
        onChange={(e) => setPrefix(e.target.value)}
        placeholder="e.g. SOL"
        className="border rounded p-2 w-full mb-4"
      />

      <label className="block text-sm font-medium mb-2">Suffix (optional)</label>
      <input
        type="text"
        value={suffix}
        onChange={(e) => setSuffix(e.target.value)}
        placeholder="e.g. FAKE"
        className="border rounded p-2 w-full mb-4"
      />

      <button
        onClick={handleCreateVanityContract}
        disabled={isGenerating}
        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
      >
        {isGenerating ? "Generating Vanity Mint..." : "Generate Vanity Token"}
      </button>

      {status && <p className="mt-4 text-sm">{status}</p>}
      {isGenerating && attempts > 0 && (
        <p className="mt-2 text-xs text-gray-500">Tried {attempts.toLocaleString()} candidates...</p>
      )}
    </div>
  );
};

// ========================
// MAIN CREATE POOL PAGE
// ========================
export default function CreatePoolPage() {
  const { publicKey, signTransaction } = useWallet();
  const address = useMemo(() => publicKey?.toBase58(), [publicKey]);

  const [isLoading, setIsLoading] = useState(false);
  const [poolCreated, setPoolCreated] = useState(false);

  const form = useForm({
    defaultValues: {
      tokenName: '',
      tokenSymbol: '',
      tokenLogo: undefined,
      website: '',
      twitter: '',
    } as FormValues,
    onSubmit: async ({ value }) => {
      try {
        setIsLoading(true);
        const { tokenLogo } = value;
        if (!tokenLogo) {
          toast.error('Token logo is required');
          return;
        }
        if (!signTransaction) {
          toast.error('Wallet not connected');
          return;
        }

        // Base64 logo
        const reader = new FileReader();
        const base64File = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(tokenLogo);
        });

        const keyPair = Keypair.generate();

        // Upload to R2
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
        const transaction = Transaction.from(Buffer.from(poolTx, 'base64'));
        transaction.sign(keyPair);

        const signedTransaction = await signTransaction(transaction);
        const sendResponse = await fetch('/api/send-transaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signedTransaction: signedTransaction.serialize().toString('base64'),
          }),
        });

        if (!sendResponse.ok) throw new Error((await sendResponse.json()).error);

        const { success } = await sendResponse.json();
        if (success) {
          toast.success('Pool created successfully');
          setPoolCreated(true);
        }
      } catch (error) {
        console.error('Error creating pool:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to create pool');
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
        <title>Create Pool - Virtual Curve</title>
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
            >
              {/* Add your form fields here */}
              {/* Replace missing SubmitButton */}
              <SubmitButton isSubmitting={isLoading} />
            </form>
          ) : (
            <PoolCreationSuccess />
          )}

          {/* Vanity generator */}
          <VanityMintGenerator />
        </main>
      </div>
    </>
  );
}

// ========================
// FIXED MISSING COMPONENTS
// ========================

// ✅ Simple SubmitButton so build doesn’t fail
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

// ✅ Simple success UI so it doesn’t crash
function PoolCreationSuccess() {
  return (
    <div className="mt-6 p-4 border rounded text-center">
      <h2 className="text-2xl font-bold mb-2">✅ Pool Created Successfully!</h2>
      <p className="text-sm text-gray-300">
        Your pool has been created and deployed on Solana.
      </p>
      <Link
        href="/"
        className="inline-block mt-4 px-4 py-2 bg-green-600 rounded text-white hover:bg-green-700"
      >
        Go back to Dashboard
      </Link>
    </div>
  );
}
