use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("StKNGfrYoMsNmGELbcbad98bHszJfTSRwCWMa8sCq6S");

/// Precision factor for reward-per-token calculations (1e18).
const PRECISION: u128 = 1_000_000_000_000_000_000;

#[program]
pub mod staking {
    use super::*;

    /// Create a new staking pool for an SPL token.
    /// `reward_rate` is the number of reward tokens distributed per second
    /// across all stakers (scaled to token decimals).
    pub fn initialize_pool(ctx: Context<InitializePool>, reward_rate: u64) -> Result<()> {
        let pool = &mut ctx.accounts.stake_pool;
        pool.authority = ctx.accounts.authority.key();
        pool.token_mint = ctx.accounts.token_mint.key();
        pool.stake_vault = ctx.accounts.stake_vault.key();
        pool.reward_vault = ctx.accounts.reward_vault.key();
        pool.reward_rate_per_second = reward_rate;
        pool.total_staked = 0;
        pool.reward_per_token_stored = 0;
        pool.last_update_time = Clock::get()?.unix_timestamp;
        pool.bump = ctx.bumps.stake_pool;
        pool.is_active = true;
        Ok(())
    }

    /// Admin deposits reward tokens into the pool's reward vault.
    pub fn fund_rewards(ctx: Context<FundRewards>, amount: u64) -> Result<()> {
        require!(amount > 0, StakingError::InvalidAmount);

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.funder_token_account.to_account_info(),
                    to: ctx.accounts.reward_vault.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            amount,
        )?;

        Ok(())
    }

    /// Stake tokens into the pool.
    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        require!(amount > 0, StakingError::InvalidAmount);
        require!(ctx.accounts.stake_pool.is_active, StakingError::PoolInactive);

        // Update global and user reward state before changing balances.
        update_rewards(
            &mut ctx.accounts.stake_pool,
            Some(&mut ctx.accounts.stake_entry),
        )?;

        // Initialize stake entry fields on first stake.
        let entry = &mut ctx.accounts.stake_entry;
        if entry.owner == Pubkey::default() {
            entry.owner = ctx.accounts.owner.key();
            entry.pool = ctx.accounts.stake_pool.key();
            entry.bump = ctx.bumps.stake_entry;
        }

        // Transfer tokens from user to stake vault.
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_token_account.to_account_info(),
                    to: ctx.accounts.stake_vault.to_account_info(),
                    authority: ctx.accounts.owner.to_account_info(),
                },
            ),
            amount,
        )?;

        entry.staked_amount = entry.staked_amount.checked_add(amount).unwrap();
        entry.last_stake_time = Clock::get()?.unix_timestamp;
        ctx.accounts.stake_pool.total_staked = ctx
            .accounts
            .stake_pool
            .total_staked
            .checked_add(amount)
            .unwrap();

        Ok(())
    }

    /// Unstake (withdraw) tokens from the pool.
    pub fn unstake(ctx: Context<Unstake>, amount: u64) -> Result<()> {
        require!(amount > 0, StakingError::InvalidAmount);
        require!(
            ctx.accounts.stake_entry.staked_amount >= amount,
            StakingError::InsufficientStake
        );

        update_rewards(
            &mut ctx.accounts.stake_pool,
            Some(&mut ctx.accounts.stake_entry),
        )?;

        let pool = &mut ctx.accounts.stake_pool;
        let entry = &mut ctx.accounts.stake_entry;

        entry.staked_amount = entry.staked_amount.checked_sub(amount).unwrap();
        pool.total_staked = pool.total_staked.checked_sub(amount).unwrap();

        // PDA signer seeds for the stake pool.
        let mint_key = pool.token_mint;
        let authority_key = pool.authority;
        let bump = pool.bump;
        let seeds: &[&[u8]] = &[
            b"stake_pool",
            mint_key.as_ref(),
            authority_key.as_ref(),
            &[bump],
        ];
        let signer_seeds = &[seeds];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.stake_vault.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    authority: pool.to_account_info(),
                },
                signer_seeds,
            ),
            amount,
        )?;

        Ok(())
    }

    /// Claim accumulated reward tokens.
    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        update_rewards(
            &mut ctx.accounts.stake_pool,
            Some(&mut ctx.accounts.stake_entry),
        )?;

        let entry = &mut ctx.accounts.stake_entry;
        let rewards = entry.rewards_owed;
        require!(rewards > 0, StakingError::NoRewards);

        entry.rewards_owed = 0;

        let pool = &ctx.accounts.stake_pool;
        let mint_key = pool.token_mint;
        let authority_key = pool.authority;
        let bump = pool.bump;
        let seeds: &[&[u8]] = &[
            b"stake_pool",
            mint_key.as_ref(),
            authority_key.as_ref(),
            &[bump],
        ];
        let signer_seeds = &[seeds];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.reward_vault.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    authority: ctx.accounts.stake_pool.to_account_info(),
                },
                signer_seeds,
            ),
            rewards,
        )?;

        Ok(())
    }

    /// Close the pool. Only allowed when no tokens are staked.
    pub fn close_pool(ctx: Context<ClosePool>) -> Result<()> {
        let pool = &ctx.accounts.stake_pool;
        require!(pool.total_staked == 0, StakingError::PoolNotEmpty);
        // Anchor's `close` constraint handles lamport transfer + zeroing.
        Ok(())
    }
}

// ---------------------------------------------------------------------------
// Reward helpers (Synthetix model)
// ---------------------------------------------------------------------------

/// Update the global reward accumulator and (optionally) a user's earned rewards.
fn update_rewards(
    pool: &mut Account<StakePool>,
    entry: Option<&mut Account<StakeEntry>>,
) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let new_rpt = reward_per_token(pool, now)?;
    pool.reward_per_token_stored = new_rpt;
    pool.last_update_time = now;

    if let Some(entry) = entry {
        let pending = earned(entry, new_rpt)?;
        entry.rewards_owed = entry.rewards_owed.checked_add(pending).unwrap();
        entry.reward_per_token_paid = new_rpt;
    }
    Ok(())
}

/// Calculate the current reward-per-token value.
fn reward_per_token(pool: &StakePool, now: i64) -> Result<u128> {
    if pool.total_staked == 0 {
        return Ok(pool.reward_per_token_stored);
    }
    let elapsed = (now - pool.last_update_time) as u128;
    let additional = elapsed
        .checked_mul(pool.reward_rate_per_second as u128)
        .unwrap()
        .checked_mul(PRECISION)
        .unwrap()
        .checked_div(pool.total_staked as u128)
        .unwrap();
    Ok(pool.reward_per_token_stored.checked_add(additional).unwrap())
}

/// Calculate a user's newly earned (unclaimed) rewards since their last checkpoint.
fn earned(entry: &StakeEntry, current_rpt: u128) -> Result<u64> {
    let diff = current_rpt
        .checked_sub(entry.reward_per_token_paid)
        .unwrap();
    let pending = (entry.staked_amount as u128)
        .checked_mul(diff)
        .unwrap()
        .checked_div(PRECISION)
        .unwrap();
    Ok(pending as u64)
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_mint: Account<'info, Mint>,

    #[account(
        init,
        seeds = [b"stake_pool", token_mint.key().as_ref(), authority.key().as_ref()],
        bump,
        payer = authority,
        space = 8 + StakePool::INIT_SPACE,
    )]
    pub stake_pool: Account<'info, StakePool>,

    #[account(
        init,
        seeds = [b"stake_vault", stake_pool.key().as_ref()],
        bump,
        payer = authority,
        token::mint = token_mint,
        token::authority = stake_pool,
    )]
    pub stake_vault: Account<'info, TokenAccount>,

    #[account(
        init,
        seeds = [b"reward_vault", stake_pool.key().as_ref()],
        bump,
        payer = authority,
        token::mint = token_mint,
        token::authority = stake_pool,
    )]
    pub reward_vault: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct FundRewards<'info> {
    #[account(
        mut,
        constraint = authority.key() == stake_pool.authority @ StakingError::Unauthorized
    )]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub stake_pool: Account<'info, StakePool>,

    #[account(
        mut,
        constraint = funder_token_account.mint == stake_pool.token_mint
    )]
    pub funder_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = reward_vault.key() == stake_pool.reward_vault
    )]
    pub reward_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(mut)]
    pub stake_pool: Account<'info, StakePool>,

    #[account(
        init_if_needed,
        seeds = [b"stake_entry", stake_pool.key().as_ref(), owner.key().as_ref()],
        bump,
        payer = owner,
        space = 8 + StakeEntry::INIT_SPACE,
    )]
    pub stake_entry: Account<'info, StakeEntry>,

    #[account(
        mut,
        constraint = user_token_account.mint == stake_pool.token_mint
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = stake_vault.key() == stake_pool.stake_vault
    )]
    pub stake_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(mut)]
    pub stake_pool: Account<'info, StakePool>,

    #[account(
        mut,
        seeds = [b"stake_entry", stake_pool.key().as_ref(), owner.key().as_ref()],
        bump,
        constraint = stake_entry.owner == owner.key() @ StakingError::Unauthorized,
    )]
    pub stake_entry: Account<'info, StakeEntry>,

    #[account(
        mut,
        constraint = user_token_account.mint == stake_pool.token_mint
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = stake_vault.key() == stake_pool.stake_vault
    )]
    pub stake_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(mut)]
    pub stake_pool: Account<'info, StakePool>,

    #[account(
        mut,
        seeds = [b"stake_entry", stake_pool.key().as_ref(), owner.key().as_ref()],
        bump,
        constraint = stake_entry.owner == owner.key() @ StakingError::Unauthorized,
    )]
    pub stake_entry: Account<'info, StakeEntry>,

    #[account(
        mut,
        constraint = user_token_account.mint == stake_pool.token_mint
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = reward_vault.key() == stake_pool.reward_vault
    )]
    pub reward_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClosePool<'info> {
    #[account(
        mut,
        constraint = authority.key() == stake_pool.authority @ StakingError::Unauthorized
    )]
    pub authority: Signer<'info>,

    #[account(
        mut,
        close = authority,
        constraint = stake_pool.total_staked == 0 @ StakingError::PoolNotEmpty,
    )]
    pub stake_pool: Account<'info, StakePool>,
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

#[account]
#[derive(InitSpace)]
pub struct StakePool {
    /// The admin who created this pool.
    pub authority: Pubkey,
    /// SPL token mint used for both staking and rewards.
    pub token_mint: Pubkey,
    /// PDA-owned token account holding staked tokens.
    pub stake_vault: Pubkey,
    /// PDA-owned token account holding reward tokens.
    pub reward_vault: Pubkey,
    /// Reward tokens distributed per second across all stakers.
    pub reward_rate_per_second: u64,
    /// Total tokens currently staked in this pool.
    pub total_staked: u64,
    /// Accumulated reward per token (scaled by 1e18).
    pub reward_per_token_stored: u128,
    /// Unix timestamp of the last reward update.
    pub last_update_time: i64,
    /// PDA bump seed.
    pub bump: u8,
    /// Whether the pool accepts new stakes.
    pub is_active: bool,
}

#[account]
#[derive(InitSpace)]
pub struct StakeEntry {
    /// The wallet that owns this stake entry.
    pub owner: Pubkey,
    /// The stake pool this entry belongs to.
    pub pool: Pubkey,
    /// Number of tokens currently staked.
    pub staked_amount: u64,
    /// Snapshot of reward_per_token_stored at the user's last action.
    pub reward_per_token_paid: u128,
    /// Accumulated but unclaimed reward tokens.
    pub rewards_owed: u64,
    /// Unix timestamp of the user's last stake action.
    pub last_stake_time: i64,
    /// PDA bump seed.
    pub bump: u8,
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

#[error_code]
pub enum StakingError {
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("Unauthorized: signer does not match expected authority")]
    Unauthorized,
    #[msg("Pool is not accepting new stakes")]
    PoolInactive,
    #[msg("Insufficient staked balance for this withdrawal")]
    InsufficientStake,
    #[msg("No rewards available to claim")]
    NoRewards,
    #[msg("Cannot close pool while tokens are still staked")]
    PoolNotEmpty,
}
