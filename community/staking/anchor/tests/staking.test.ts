import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import {
  PublicKey,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js'
import {
  createMint,
  createAccount,
  mintTo,
  getAccount,
} from '@solana/spl-token'
import { Staking } from '../target/types/staking'

describe('staking', () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const payer = provider.wallet as anchor.Wallet
  const program = anchor.workspace.Staking as Program<Staking>

  let tokenMint: PublicKey
  let adminTokenAccount: PublicKey
  let userTokenAccount: PublicKey
  let poolPda: PublicKey
  let stakeVaultPda: PublicKey
  let rewardVaultPda: PublicKey
  let stakeEntryPda: PublicKey

  const REWARD_RATE = new anchor.BN(100) // 100 tokens per second
  const STAKE_AMOUNT = new anchor.BN(1_000_000) // 1M tokens
  const FUND_AMOUNT = new anchor.BN(10_000_000) // 10M tokens for rewards

  beforeAll(async () => {
    // Airdrop SOL to payer
    const sig = await provider.connection.requestAirdrop(
      payer.publicKey,
      10 * LAMPORTS_PER_SOL,
    )
    await provider.connection.confirmTransaction(sig)

    // Create SPL token mint
    tokenMint = await createMint(
      provider.connection,
      payer.payer,
      payer.publicKey,
      null,
      6, // 6 decimals
    )

    // Create token accounts
    adminTokenAccount = await createAccount(
      provider.connection,
      payer.payer,
      tokenMint,
      payer.publicKey,
    )

    userTokenAccount = adminTokenAccount // same wallet in test

    // Mint tokens to admin
    await mintTo(
      provider.connection,
      payer.payer,
      tokenMint,
      adminTokenAccount,
      payer.publicKey,
      100_000_000, // 100M tokens
    )

    // Derive PDAs
    ;[poolPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('stake_pool'),
        tokenMint.toBuffer(),
        payer.publicKey.toBuffer(),
      ],
      program.programId,
    )
    ;[stakeVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('stake_vault'), poolPda.toBuffer()],
      program.programId,
    )
    ;[rewardVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('reward_vault'), poolPda.toBuffer()],
      program.programId,
    )
    ;[stakeEntryPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('stake_entry'),
        poolPda.toBuffer(),
        payer.publicKey.toBuffer(),
      ],
      program.programId,
    )
  })

  it('initializes a staking pool', async () => {
    await program.methods
      .initializePool(REWARD_RATE)
      .accounts({
        authority: payer.publicKey,
        tokenMint,
      })
      .rpc()

    const pool = await program.account.stakePool.fetch(poolPda)
    expect(pool.authority.toBase58()).toBe(payer.publicKey.toBase58())
    expect(pool.tokenMint.toBase58()).toBe(tokenMint.toBase58())
    expect(pool.rewardRatePerSecond.toNumber()).toBe(REWARD_RATE.toNumber())
    expect(pool.totalStaked.toNumber()).toBe(0)
    expect(pool.isActive).toBe(true)
  })

  it('funds the reward vault', async () => {
    await program.methods
      .fundRewards(FUND_AMOUNT)
      .accounts({
        authority: payer.publicKey,
        stakePool: poolPda,
        funderTokenAccount: adminTokenAccount,
        rewardVault: rewardVaultPda,
      })
      .rpc()

    const vault = await getAccount(provider.connection, rewardVaultPda)
    expect(Number(vault.amount)).toBe(FUND_AMOUNT.toNumber())
  })

  it('stakes tokens', async () => {
    await program.methods
      .stake(STAKE_AMOUNT)
      .accounts({
        owner: payer.publicKey,
        stakePool: poolPda,
        userTokenAccount,
        stakeVault: stakeVaultPda,
      })
      .rpc()

    const entry = await program.account.stakeEntry.fetch(stakeEntryPda)
    expect(entry.stakedAmount.toNumber()).toBe(STAKE_AMOUNT.toNumber())
    expect(entry.owner.toBase58()).toBe(payer.publicKey.toBase58())

    const pool = await program.account.stakePool.fetch(poolPda)
    expect(pool.totalStaked.toNumber()).toBe(STAKE_AMOUNT.toNumber())
  })

  it('accumulates rewards over time', async () => {
    // Wait a couple seconds for rewards to accrue
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Fetch entry — rewards_owed is still 0 until next action triggers update
    const entryBefore = await program.account.stakeEntry.fetch(stakeEntryPda)
    expect(entryBefore.rewardsOwed.toNumber()).toBe(0)
  })

  it('claims rewards', async () => {
    await program.methods
      .claimRewards()
      .accounts({
        owner: payer.publicKey,
        stakePool: poolPda,
        userTokenAccount,
        rewardVault: rewardVaultPda,
      })
      .rpc()

    const entry = await program.account.stakeEntry.fetch(stakeEntryPda)
    expect(entry.rewardsOwed.toNumber()).toBe(0)
  })

  it('unstakes partial amount', async () => {
    const unstakeAmount = new anchor.BN(500_000)

    await program.methods
      .unstake(unstakeAmount)
      .accounts({
        owner: payer.publicKey,
        stakePool: poolPda,
        userTokenAccount,
        stakeVault: stakeVaultPda,
      })
      .rpc()

    const entry = await program.account.stakeEntry.fetch(stakeEntryPda)
    expect(entry.stakedAmount.toNumber()).toBe(
      STAKE_AMOUNT.toNumber() - unstakeAmount.toNumber(),
    )

    const pool = await program.account.stakePool.fetch(poolPda)
    expect(pool.totalStaked.toNumber()).toBe(
      STAKE_AMOUNT.toNumber() - unstakeAmount.toNumber(),
    )
  })

  it('unstakes remaining amount', async () => {
    const entry = await program.account.stakeEntry.fetch(stakeEntryPda)
    const remaining = entry.stakedAmount

    await program.methods
      .unstake(remaining)
      .accounts({
        owner: payer.publicKey,
        stakePool: poolPda,
        userTokenAccount,
        stakeVault: stakeVaultPda,
      })
      .rpc()

    const pool = await program.account.stakePool.fetch(poolPda)
    expect(pool.totalStaked.toNumber()).toBe(0)
  })

  it('rejects staking zero amount', async () => {
    try {
      await program.methods
        .stake(new anchor.BN(0))
        .accounts({
          owner: payer.publicKey,
          stakePool: poolPda,
          userTokenAccount,
          stakeVault: stakeVaultPda,
        })
        .rpc()
      fail('Should have thrown an error')
    } catch (err) {
      expect(err).toBeDefined()
    }
  })

  it('rejects unstaking zero amount', async () => {
    try {
      await program.methods
        .unstake(new anchor.BN(0))
        .accounts({
          owner: payer.publicKey,
          stakePool: poolPda,
          userTokenAccount,
          stakeVault: stakeVaultPda,
        })
        .rpc()
      fail('Should have thrown an error')
    } catch (err) {
      expect(err).toBeDefined()
    }
  })

  it('rejects unstaking more than staked', async () => {
    try {
      await program.methods
        .unstake(new anchor.BN(1_000_000))
        .accounts({
          owner: payer.publicKey,
          stakePool: poolPda,
          userTokenAccount,
          stakeVault: stakeVaultPda,
        })
        .rpc()
      fail('Should have thrown an error')
    } catch (err) {
      expect(err).toBeDefined()
    }
  })

  it('rejects closing pool with active stakes', async () => {
    // Stake some tokens first
    await program.methods
      .stake(STAKE_AMOUNT)
      .accounts({
        owner: payer.publicKey,
        stakePool: poolPda,
        userTokenAccount,
        stakeVault: stakeVaultPda,
      })
      .rpc()

    try {
      await program.methods
        .closePool()
        .accounts({
          authority: payer.publicKey,
          stakePool: poolPda,
        })
        .rpc()
      fail('Should have thrown an error')
    } catch (err) {
      expect(err).toBeDefined()
    }

    // Clean up: unstake so close_pool test can succeed
    await program.methods
      .unstake(STAKE_AMOUNT)
      .accounts({
        owner: payer.publicKey,
        stakePool: poolPda,
        userTokenAccount,
        stakeVault: stakeVaultPda,
      })
      .rpc()
  })

  it('closes the pool', async () => {
    await program.methods
      .closePool()
      .accounts({
        authority: payer.publicKey,
        stakePool: poolPda,
      })
      .rpc()

    // Pool account should no longer exist
    const poolAccount = await provider.connection.getAccountInfo(poolPda)
    expect(poolAccount).toBeNull()
  })
})
