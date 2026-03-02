"use client";

import { usePrivy } from "@privy-io/react-auth";

const ACCOUNT_LABELS: Record<string, string> = {
  email: "Email",
  google_oauth: "Google",
  twitter_oauth: "Twitter",
  discord_oauth: "Discord",
  github_oauth: "GitHub",
  apple_oauth: "Apple",
  linkedin_oauth: "LinkedIn",
  spotify_oauth: "Spotify",
  tiktok_oauth: "TikTok",
  wallet: "Wallet",
  phone: "Phone",
};

function getAccountDisplay(account: { type: string; [key: string]: unknown }): string {
  const type = account.type;
  if (type === "email" && typeof account.address === "string") {
    return account.address;
  }
  if (type === "phone" && typeof account.phoneNumber === "string") {
    return account.phoneNumber;
  }
  if (type === "google_oauth" && typeof account.email === "string") {
    return account.email;
  }
  if (type === "twitter_oauth" && typeof account.username === "string") {
    return `@${account.username}`;
  }
  if (type === "discord_oauth" && typeof account.username === "string") {
    return account.username;
  }
  if (type === "github_oauth" && typeof account.username === "string") {
    return account.username;
  }
  if (type === "wallet" && typeof account.address === "string") {
    const addr = account.address;
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  }
  return ACCOUNT_LABELS[type] ?? type;
}

export default function UserProfile() {
  const { user } = usePrivy();

  if (!user) return null;

  const linkedAccounts = user.linkedAccounts ?? [];

  return (
    <div className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card)] p-6">
      <h2 className="mb-4 text-lg font-semibold">User Profile</h2>

      <div className="mb-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-muted)]">User ID</span>
          <span className="font-mono text-xs">{user.id}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-muted)]">Created</span>
          <span>{new Date(user.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-[var(--color-muted)]">
          Linked Accounts
        </h3>
        {linkedAccounts.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">No linked accounts</p>
        ) : (
          <div className="space-y-2">
            {linkedAccounts.map((account, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md border border-[var(--color-card-border)] px-3 py-2 text-sm"
              >
                <span className="text-[var(--color-secondary)]">
                  {ACCOUNT_LABELS[account.type] ?? account.type}
                </span>
                <span className="font-mono text-xs text-[var(--color-muted)]">
                  {getAccountDisplay(account as unknown as { type: string; [key: string]: unknown })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
