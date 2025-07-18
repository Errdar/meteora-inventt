import { useState } from "react";
import { Connection, Keypair } from "@solana/web3.js";
import { autoBuySupply } from "@/lib/autoBuySupply";

export default function BuyForm({ tokenMint }: { tokenMint: string }) {
  const [amountInSOL, setAmountInSOL] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleBuy() {
    if (!amountInSOL || isNaN(parseFloat(amountInSOL))) {
      alert("Please enter a valid amount");
      return;
    }

    setLoading(true);

    const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC!);

    const creatorKeypair = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(process.env.CREATOR_PRIVATE_KEY!))
    );

    await autoBuySupply({
      connection,
      creatorKeypair,
      tokenMint,
      amountInSOL: parseFloat(amountInSOL),
    });

    setLoading(false);
  }

  return (
    <div style={{ border: "1px solid #444", padding: "1rem", marginTop: "1rem" }}>
      <h3>Buy from Bonding Curve</h3>
      <input
        type="number"
        placeholder="Amount in SOL"
        value={amountInSOL}
        onChange={(e) => setAmountInSOL(e.target.value)}
        style={{ padding: "0.5rem", width: "100%", marginBottom: "0.5rem" }}
      />
      <button onClick={handleBuy} disabled={loading} style={{ padding: "0.5rem", width: "100%" }}>
        {loading ? "Buying..." : "Buy Now"}
      </button>
    </div>
  );
}
