import BuyForm from "@/components/BuyForm";

<BuyForm tokenMint={mintAddress} />

return (
  <div>
    <h2>✅ Token launched successfully!</h2>
    <p>Mint address: {mintAddress}</p>

    {/* ✅ Add Buy UI here */}
    <BuyForm tokenMint={mintAddress} />
  </div>
);
