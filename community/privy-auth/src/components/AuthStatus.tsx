"use client";

import { usePrivy } from "@privy-io/react-auth";

export default function AuthStatus() {
  const { ready, authenticated } = usePrivy();

  if (!ready) {
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
        <span className="inline-block h-2 w-2 rounded-full bg-yellow-500" />
        Initializing...
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
      <span
        className={`inline-block h-2 w-2 rounded-full ${
          authenticated ? "bg-[var(--color-secondary)]" : "bg-red-400"
        }`}
      />
      {authenticated ? "Connected" : "Not connected"}
    </div>
  );
}
