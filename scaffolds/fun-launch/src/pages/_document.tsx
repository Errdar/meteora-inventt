import { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* ✅ Load Jupiter Terminal script only on client */}
        <Script
          src="https://terminal.jup.ag/main-v4.js"
          strategy="afterInteractive" // ensures it only runs after hydration
        />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
