"use client";

import { usePrivy } from "@privy-io/react-auth";

export default function LoginButton() {
  const { ready, authenticated, login } = usePrivy();

  if (!ready) {
    return (
      <button
        disabled
        className="w-full rounded-lg bg-[var(--color-primary)] px-6 py-3 font-semibold opacity-50"
      >
        Loading...
      </button>
    );
  }

  if (authenticated) {
    return null;
  }

  return (
    <button
      onClick={login}
      className="w-full cursor-pointer rounded-lg bg-[var(--color-primary)] px-6 py-3 font-semibold transition-colors hover:bg-[var(--color-primary-hover)]"
    >
      Sign In
    </button>
  );
}
