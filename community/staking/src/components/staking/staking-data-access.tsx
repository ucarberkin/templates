'use client'

import { getStakingProgram, getStakingProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../use-transaction-toast'
import { toast } from 'sonner'
import * as anchor from '@coral-xyz/anchor'

export function useStakingProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getStakingProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getStakingProgram(provider, programId), [provider, programId])

  const pools = useQuery({
    queryKey: ['staking', 'pools', { cluster }],
    queryFn: () => program.account.stakePool.all(),
  })

  const initializePool = useMutation({
    mutationKey: ['staking', 'initializePool', { cluster }],
    mutationFn: async ({
      tokenMint,
      rewardRate,
    }: {
      tokenMint: PublicKey
      rewardRate: number
    }) => {
      return program.methods
        .initializePool(new anchor.BN(rewardRate))
        .accounts({
          authority: provider.wallet.publicKey,
          tokenMint,
        })
        .rpc()
    },
    onSuccess: async (signature) => {
      transactionToast(signature)
      await pools.refetch()
    },
    onError: () => {
      toast.error('Failed to initialize pool')
    },
  })

  return {
    program,
    programId,
    pools,
    initializePool,
  }
}

export function useStakePool({ poolAddress }: { poolAddress: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, pools } = useStakingProgram()
  const provider = useAnchorProvider()

  const poolQuery = useQuery({
    queryKey: ['staking', 'pool', { cluster, poolAddress }],
    queryFn: () => program.account.stakePool.fetch(poolAddress),
  })

  const fundRewards = useMutation({
    mutationKey: ['staking', 'fundRewards', { cluster, poolAddress }],
    mutationFn: async ({
      amount,
      funderTokenAccount,
    }: {
      amount: number
      funderTokenAccount: PublicKey
    }) => {
      const pool = await program.account.stakePool.fetch(poolAddress)
      return program.methods
        .fundRewards(new anchor.BN(amount))
        .accounts({
          authority: provider.wallet.publicKey,
          stakePool: poolAddress,
          funderTokenAccount,
          rewardVault: pool.rewardVault,
        })
        .rpc()
    },
    onSuccess: async (signature) => {
      transactionToast(signature)
      await poolQuery.refetch()
    },
    onError: () => {
      toast.error('Failed to fund rewards')
    },
  })

  const closePool = useMutation({
    mutationKey: ['staking', 'closePool', { cluster, poolAddress }],
    mutationFn: async () => {
      return program.methods
        .closePool()
        .accounts({
          authority: provider.wallet.publicKey,
          stakePool: poolAddress,
        })
        .rpc()
    },
    onSuccess: async (signature) => {
      transactionToast(signature)
      await pools.refetch()
    },
    onError: () => {
      toast.error('Failed to close pool')
    },
  })

  return {
    poolQuery,
    fundRewards,
    closePool,
  }
}

export function useStakeEntry({ poolAddress }: { poolAddress: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, programId } = useStakingProgram()
  const provider = useAnchorProvider()

  const owner = provider.wallet.publicKey

  const [entryPda] = useMemo(
    () =>
      PublicKey.findProgramAddressSync(
        [Buffer.from('stake_entry'), poolAddress.toBuffer(), owner.toBuffer()],
        programId,
      ),
    [poolAddress, owner, programId],
  )

  const entryQuery = useQuery({
    queryKey: ['staking', 'entry', { cluster, poolAddress, owner }],
    queryFn: async () => {
      try {
        return await program.account.stakeEntry.fetch(entryPda)
      } catch {
        return null
      }
    },
  })

  const poolQuery = useQuery({
    queryKey: ['staking', 'pool', { cluster, poolAddress }],
    queryFn: () => program.account.stakePool.fetch(poolAddress),
  })

  const stake = useMutation({
    mutationKey: ['staking', 'stake', { cluster, poolAddress }],
    mutationFn: async ({
      amount,
      userTokenAccount,
    }: {
      amount: number
      userTokenAccount: PublicKey
    }) => {
      const pool = await program.account.stakePool.fetch(poolAddress)
      return program.methods
        .stake(new anchor.BN(amount))
        .accounts({
          owner,
          stakePool: poolAddress,
          userTokenAccount,
          stakeVault: pool.stakeVault,
        })
        .rpc()
    },
    onSuccess: async (signature) => {
      transactionToast(signature)
      await Promise.all([entryQuery.refetch(), poolQuery.refetch()])
    },
    onError: () => {
      toast.error('Failed to stake tokens')
    },
  })

  const unstake = useMutation({
    mutationKey: ['staking', 'unstake', { cluster, poolAddress }],
    mutationFn: async ({
      amount,
      userTokenAccount,
    }: {
      amount: number
      userTokenAccount: PublicKey
    }) => {
      const pool = await program.account.stakePool.fetch(poolAddress)
      return program.methods
        .unstake(new anchor.BN(amount))
        .accounts({
          owner,
          stakePool: poolAddress,
          userTokenAccount,
          stakeVault: pool.stakeVault,
        })
        .rpc()
    },
    onSuccess: async (signature) => {
      transactionToast(signature)
      await Promise.all([entryQuery.refetch(), poolQuery.refetch()])
    },
    onError: () => {
      toast.error('Failed to unstake tokens')
    },
  })

  const claimRewards = useMutation({
    mutationKey: ['staking', 'claimRewards', { cluster, poolAddress }],
    mutationFn: async ({ userTokenAccount }: { userTokenAccount: PublicKey }) => {
      const pool = await program.account.stakePool.fetch(poolAddress)
      return program.methods
        .claimRewards()
        .accounts({
          owner,
          stakePool: poolAddress,
          userTokenAccount,
          rewardVault: pool.rewardVault,
        })
        .rpc()
    },
    onSuccess: async (signature) => {
      transactionToast(signature)
      await Promise.all([entryQuery.refetch(), poolQuery.refetch()])
    },
    onError: () => {
      toast.error('Failed to claim rewards')
    },
  })

  return {
    entryQuery,
    stake,
    unstake,
    claimRewards,
  }
}
