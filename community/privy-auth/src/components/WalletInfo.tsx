"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useSolanaWallets } from "@privy-io/react-auth/solana";
import { useState, useEffect, useCallback } from "react";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

export default function WalletInfo() {
  const { user } = usePrivy();
  const { wallets } = useSolanaWallets();
  const [balance, setBalance] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const solanaWallet = wallets[0];
  const address = solanaWallet?.address;

  const fetchBalance = useCallback(async () => {
    if (!address) return;
    try {
      const connection = new Connection("https://api.devnet.solana.com");
      const pubkey = new PublicKey(address);
      const bal = await connection.getBalance(pubkey);
      setBalance(bal / LAMPORTS_PER_SOL);
    } catch {
      setBalance(null);
    }
  }, [address]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) return null;

  return (
    <div className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card)] p-6">
      <h2 className="mb-4 text-lg font-semibold">Solana Wallet</h2>

      {address ? (
        <div className="space-y-3">
          <div>
            <span className="text-sm text-[var(--color-muted)]">Address</span>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 truncate rounded-md border border-[var(--color-card-border)] px-3 py-2 font-mono text-sm">
                {address}
              </code>
              <button
                onClick={copyAddress}
                className="cursor-pointer rounded-md border border-[var(--color-card-border)] px-3 py-2 text-sm transition-colors hover:bg-[var(--color-card-border)]"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-muted)]">Balance (Devnet)</span>
            <span>
              {balance !== null ? `${balance.toFixed(4)} SOL` : "—"}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-muted)]">Wallet Type</span>
            <span className="text-[var(--color-secondary)]">
              {solanaWallet.walletClientType === "privy"
                ? "Embedded (Privy)"
                : solanaWallet.walletClientType}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--color-muted)]">
          No Solana wallet found. One will be created automatically on your next
          login.
        </p>
      )}
    </div>
  );
}
