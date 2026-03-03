"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: true,
});

export default function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="max-w-md rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card)] p-6 text-center">
          <h2 className="mb-2 text-xl font-bold text-red-400">
            Missing Privy App ID
          </h2>
          <p className="text-[var(--color-muted)]">
            Copy <code className="text-[var(--color-secondary)]">.env.example</code> to{" "}
            <code className="text-[var(--color-secondary)]">.env.local</code> and add your
            Privy App ID. Get one free at{" "}
            <a
              href="https://dashboard.privy.io"
              className="text-[var(--color-primary)] underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              dashboard.privy.io
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#9945FF",
          logo: "https://raw.githubusercontent.com/ucarberkin/templates/main/community/privy-auth/Privy_image.png",
        },
        embeddedWallets: {
          solana: {
            createOnLogin: "users-without-wallets",
          },
        },
        externalWallets: {
          solana: {
            connectors: solanaConnectors,
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
