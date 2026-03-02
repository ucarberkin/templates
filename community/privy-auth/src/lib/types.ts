/** Supported linked account types in Privy */
export type LinkedAccountType =
  | "email"
  | "phone"
  | "google_oauth"
  | "twitter_oauth"
  | "discord_oauth"
  | "github_oauth"
  | "apple_oauth"
  | "linkedin_oauth"
  | "spotify_oauth"
  | "tiktok_oauth"
  | "wallet";

/** Represents a user's authentication session state */
export interface AuthSession {
  /** Whether the Privy SDK has finished initializing */
  ready: boolean;
  /** Whether the user is currently authenticated */
  authenticated: boolean;
  /** The user's Privy ID (did:privy:...) */
  userId: string | null;
}

/** Represents a linked Solana wallet */
export interface SolanaWalletInfo {
  /** The wallet's public key address */
  address: string;
  /** Whether this is a Privy embedded wallet or an external wallet */
  walletClientType: "privy" | string;
}

/** Privy user object shape (subset of fields used in this template) */
export interface PrivyUserInfo {
  id: string;
  createdAt: Date;
  linkedAccounts: Array<{
    type: LinkedAccountType;
    address?: string;
    username?: string;
    email?: string;
    phoneNumber?: string;
  }>;
}
