# Solana Privy Auth Template

A Next.js template demonstrating [Privy](https://www.privy.io/) authentication in a Solana dApp — including social logins, embedded wallet creation, and protected routes.

## Features

- **Social Logins** — Google, Discord, Twitter, GitHub, and more via Privy
- **Embedded Solana Wallet** — Automatic wallet creation for new users
- **Protected Routes** — Session-based route protection with AuthGuard
- **User Dashboard** — Displays profile info, linked accounts, and wallet details
- **Wallet Balance** — Real-time SOL balance display (Devnet)
- **Dark Theme** — Solana-branded dark UI with Tailwind CSS

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- A free [Privy](https://dashboard.privy.io) account

## Quick Start

1. **Create this project:**

   ```bash
   pnpm create solana-dapp --template privy-auth
   ```

2. **Set up Privy:**

   - Create a free account at [dashboard.privy.io](https://dashboard.privy.io)
   - Create a new app and copy your **App ID**
   - Copy the env file and add your App ID:

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local`:

   ```
   NEXT_PUBLIC_PRIVY_APP_ID=your-actual-app-id
   ```

3. **Configure login methods:**

   In the [Privy Dashboard](https://dashboard.privy.io), go to your app's **Login Methods** and enable the providers you want (Google, Discord, Twitter, GitHub, etc.).

4. **Run the app:**

   ```bash
   pnpm install
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Architecture

```
src/
├── app/
│   ├── layout.tsx          # Root layout with Providers wrapper
│   ├── page.tsx            # Landing page with login
│   ├── providers.tsx       # PrivyProvider configuration
│   ├── globals.css         # Tailwind + theme variables
│   └── dashboard/
│       └── page.tsx        # Protected dashboard page
├── components/
│   ├── AuthGuard.tsx       # Route protection (redirects if not authenticated)
│   ├── AuthStatus.tsx      # Connection status indicator
│   ├── LoginButton.tsx     # Triggers Privy login modal
│   ├── LogoutButton.tsx    # Signs out and redirects to home
│   ├── UserProfile.tsx     # Displays user info and linked accounts
│   └── WalletInfo.tsx      # Shows wallet address, balance, and type
└── lib/
    └── types.ts            # TypeScript type definitions
```

### Authentication Flow

1. User clicks "Sign In" → Privy modal opens
2. User authenticates via email, social login, or wallet
3. Privy creates an embedded Solana wallet if the user doesn't have one
4. User is redirected to `/dashboard` (protected by `AuthGuard`)
5. Dashboard displays profile info, linked accounts, and wallet details
6. On logout, session is cleared and user returns to the landing page

### Session Management

This template uses Privy's built-in session management:

- **`usePrivy()`** provides `ready` and `authenticated` state
- **`AuthGuard`** wraps protected pages and checks both flags before rendering
- Always check `ready` before `authenticated` to avoid race conditions during SDK initialization
- Sessions persist across page refreshes via Privy's token management

### Embedded Wallet

Privy automatically creates a Solana wallet for users who don't already have one. This is configured in `providers.tsx`:

```ts
embeddedWallets: {
  solana: {
    createOnLogin: "users-without-wallets",
  },
},
```

The embedded wallet is hardware-secured and SOC 2-compliant. Keys are sharded and end-to-end encrypted.

## Privy Dashboard Configuration

| Setting | Location | Description |
| --- | --- | --- |
| App ID | Settings → Basics | Your app's unique identifier |
| Login Methods | Login Methods → Socials | Enable Google, Discord, Twitter, etc. |
| Embedded Wallets | Embedded Wallets | Configure auto-creation behavior |
| Appearance | Login Methods → Appearance | Customize the login modal theme |

## Key Dependencies

| Package | Purpose |
| --- | --- |
| `@privy-io/react-auth` | Privy SDK for React — authentication and wallet management |
| `@solana/web3.js` | Solana JavaScript SDK — connection and balance queries |
| `next` | React framework with App Router |
| `tailwindcss` | Utility-first CSS framework |

## Links

- [Privy Documentation](https://docs.privy.io)
- [Privy React SDK Reference](https://docs.privy.io/reference/sdk/react-auth)
- [Privy Solana Wallets Guide](https://docs.privy.io/guide/react/solana/usage)
- [Solana Developer Docs](https://solana.com/docs)
