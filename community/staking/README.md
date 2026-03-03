# SPL Token Staking

A full-featured SPL token staking template built with **Anchor** and **Next.js**. Demonstrates a Synthetix-style reward distribution model where stakers earn rewards proportional to their share of the pool over time.

## Features

- **Anchor Smart Contract** with 6 instructions: initialize pool, fund rewards, stake, unstake, claim rewards, close pool
- **Synthetix Reward Model** — O(1) gas-efficient reward calculation per operation
- **Next.js Frontend** with wallet adapter, React Query, and real-time pool/user stats
- **Admin Panel** — initialize pools, fund rewards, close pools
- **User Dashboard** — stake, unstake, claim rewards, view statistics

## Architecture

### Reward Calculation (Synthetix Model)

The staking program uses a proven reward distribution algorithm:

```
reward_per_token = stored_rpt + (elapsed_seconds × rate × 1e18) / total_staked
user_rewards    = staked_amount × (current_rpt − user_paid_rpt) / 1e18
```

This model:
- Updates in **O(1)** per operation (no iteration over stakers)
- Fairly distributes rewards proportional to stake amount and duration
- Uses a **1e18 precision factor** to avoid rounding errors

### Program Accounts

**StakePool** (PDA: `["stake_pool", token_mint, authority]`)
| Field | Type | Description |
|-------|------|-------------|
| authority | Pubkey | Pool admin |
| token_mint | Pubkey | SPL token for staking & rewards |
| stake_vault | Pubkey | PDA-owned account holding staked tokens |
| reward_vault | Pubkey | PDA-owned account holding reward tokens |
| reward_rate_per_second | u64 | Tokens distributed per second |
| total_staked | u64 | Sum of all staked tokens |
| reward_per_token_stored | u128 | Accumulated reward per token (×1e18) |
| last_update_time | i64 | Last reward checkpoint |
| is_active | bool | Accepts new stakes |

**StakeEntry** (PDA: `["stake_entry", pool, owner]`)
| Field | Type | Description |
|-------|------|-------------|
| owner | Pubkey | Staker wallet |
| staked_amount | u64 | Tokens currently staked |
| reward_per_token_paid | u128 | Snapshot at last action |
| rewards_owed | u64 | Unclaimed rewards |

### Instructions

| Instruction | Signer | Description |
|-------------|--------|-------------|
| `initialize_pool(reward_rate)` | Admin | Create pool + token vaults |
| `fund_rewards(amount)` | Admin | Deposit reward tokens |
| `stake(amount)` | User | Stake tokens, update rewards |
| `unstake(amount)` | User | Withdraw tokens, update rewards |
| `claim_rewards()` | User | Claim accumulated rewards |
| `close_pool()` | Admin | Close pool when empty |

## Getting Started

### Prerequisites

- [Rust](https://rustup.rs/)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor CLI](https://www.anchor-lang.com/docs/installation)
- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/)

### Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Build the Anchor program:
   ```bash
   cd anchor && anchor build
   ```

3. Run tests:
   ```bash
   cd anchor && anchor test
   ```

4. Start the development server:
   ```bash
   pnpm dev
   ```

### Using the Template

1. **Connect wallet** on the Staking page
2. **Create a pool** — enter a token mint address and reward rate
3. **Fund rewards** — deposit tokens for reward distribution
4. **Stake tokens** — users can stake and start earning
5. **Claim rewards** — withdraw accumulated earnings
6. **Unstake** — withdraw staked tokens at any time

## Security Considerations

- **Authority checks**: Only the pool creator can fund rewards and close the pool
- **Overflow protection**: All arithmetic uses `checked_add`, `checked_sub`, `checked_mul`, `checked_div`
- **PDA constraints**: Vault accounts are owned by the pool PDA — only the program can transfer from them
- **Init-if-needed**: Stake entries are created on first stake with proper owner validation
- **Close guard**: Pools can only be closed when `total_staked == 0`
- **Precision scaling**: Reward math uses 1e18 precision to minimize rounding loss

## Tech Stack

- **Smart Contract**: Anchor 0.32.1, anchor-spl (SPL Token CPI)
- **Frontend**: Next.js 16, React 19, Tailwind CSS 4, TypeScript 5
- **Wallet**: @solana/wallet-adapter-react
- **Data**: @tanstack/react-query, @coral-xyz/anchor
- **UI**: shadcn/ui (Radix), Sonner toasts, next-themes

## Project Structure

```
├── anchor/
│   ├── programs/staking/src/lib.rs   # Smart contract
│   ├── tests/staking.test.ts         # Integration tests
│   └── src/staking-exports.ts        # IDL + Program helper
├── src/
│   ├── components/staking/           # Staking UI + data hooks
│   ├── components/solana/            # Wallet provider
│   ├── components/cluster/           # Network management
│   └── app/                          # Next.js routes
└── package.json
```

## Resources

- [Anchor Documentation](https://www.anchor-lang.com/docs)
- [Solana Developer Docs](https://docs.solana.com/)
- [SPL Token Program](https://spl.solana.com/token)
- [Synthetix Staking Rewards](https://docs.synthetix.io/staking/staking-mechanism/)
