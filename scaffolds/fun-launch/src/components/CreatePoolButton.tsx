"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "./ui/button";

type CreatePoolButtonProps = {
  className?: string;
};

export const CreatePoolButton = ({ className }: CreatePoolButtonProps) => {
  const [showForm, setShowForm] = useState(false);
  const [tokenLogo, setTokenLogo] = useState<string>("");
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [mint, setMint] = useState("");
  const [userWallet, setUserWallet] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // ✅ Convert uploaded logo → base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setTokenLogo(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ✅ Call API to create pool
  const handleCreatePool = async () => {
    if (!tokenLogo || !tokenName || !tokenSymbol || !mint || !userWallet) {
      alert("Please fill all fields and upload a logo!");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/create-pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenLogo,
          tokenName,
          tokenSymbol,
          mint,
          userWallet,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResult("✅ Pool transaction created! Check console.");
        console.log("Pool creation TX:", data.poolTx);
      } else {
        setResult(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      setResult("❌ Failed to create pool");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* ✅ Existing button to toggle form */}
      <Button
        className={className}
        onClick={() => setShowForm((prev) => !prev)}
      >
        <span className="iconify ph--rocket-bold w-4 h-4" />
        <span>{showForm ? "Close Pool Creator" : "Create Pool"}</span>
      </Button>

      {/* ✅ Hidden form toggled */}
      {showForm && (
        <div className="p-4 border rounded-md space-y-3">
          <h3 className="font-semibold text-sm">Create a New Pool</h3>

          <input
            type="text"
            placeholder="Token Name"
            value={tokenName}
            onChange={(e) => setTokenName(e.target.value)}
            className="w-full p-2 text-sm border rounded"
          />
          <input
            type="text"
            placeholder="Token Symbol"
            value={tokenSymbol}
            onChange={(e) => setTokenSymbol(e.target.value)}
            className="w-full p-2 text-sm border rounded"
          />
          <input
            type="text"
            placeholder="Mint Address"
            value={mint}
            onChange={(e) => setMint(e.target.value)}
            className="w-full p-2 text-sm border rounded"
          />
          <input
            type="text"
            placeholder="Your Wallet Address"
            value={userWallet}
            onChange={(e) => setUserWallet(e.target.value)}
            className="w-full p-2 text-sm border rounded"
          />

          {/* ✅ Logo upload */}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="text-sm"
          />
          {tokenLogo && (
            <img
              src={tokenLogo}
              alt="Logo Preview"
              className="w-16 h-16 mt-2 rounded"
            />
          )}

          {/* ✅ Submit button */}
          <Button onClick={handleCreatePool} disabled={loading}>
            {loading ? "Creating..." : "Submit Pool"}
          </Button>

          {/* ✅ Result status */}
          {result && <p className="text-xs mt-2">{result}</p>}
        </div>
      )}
    </div>
  );
};
