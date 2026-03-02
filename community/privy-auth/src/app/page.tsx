"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoginButton from "@/components/LoginButton";
import AuthStatus from "@/components/AuthStatus";

export default function Home() {
  const { ready, authenticated } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && authenticated) {
      router.push("/dashboard");
    }
  }, [ready, authenticated, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-lg text-center">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold">
            <span className="text-[var(--color-primary)]">Solana</span> +{" "}
            <span className="text-[var(--color-secondary)]">Privy</span>
          </h1>
          <p className="text-lg text-[var(--color-muted)]">
            Authentication template with social logins, embedded wallets, and
            protected routes
          </p>
        </div>

        <div className="mb-6 rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card)] p-8">
          <h2 className="mb-4 text-xl font-semibold">Get Started</h2>
          <p className="mb-6 text-[var(--color-muted)]">
            Sign in with your email, social account, or Solana wallet to access
            the dashboard.
          </p>
          <LoginButton />
        </div>

        <AuthStatus />

        <div className="mt-8 grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
          <Feature
            title="Social Logins"
            description="Google, Discord, Twitter, GitHub, and more"
          />
          <Feature
            title="Embedded Wallet"
            description="Automatic Solana wallet creation on sign-up"
          />
          <Feature
            title="Protected Routes"
            description="Session-based route protection out of the box"
          />
        </div>
      </div>
    </main>
  );
}

function Feature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card)] p-4">
      <h3 className="mb-1 font-semibold text-[var(--color-secondary)]">
        {title}
      </h3>
      <p className="text-sm text-[var(--color-muted)]">{description}</p>
    </div>
  );
}
