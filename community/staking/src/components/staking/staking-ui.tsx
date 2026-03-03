'use client'

import { PublicKey } from '@solana/web3.js'
import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'

import { useStakePool, useStakeEntry, useStakingProgram } from './staking-data-access'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AppModal } from '@/components/app-modal'
import { ellipsify } from '@/lib/utils'
import { ExplorerLink } from '@/components/cluster/cluster-ui'
import { useGetTokenAccounts } from '@/components/account/account-data-access'

export function StakingCreate() {
  const { initializePool } = useStakingProgram()
  const [tokenMint, setTokenMint] = useState('')
  const [rewardRate, setRewardRate] = useState('100')

  return (
    <AppModal
      title="Initialize Pool"
      submitLabel="Create Pool"
      submitDisabled={!tokenMint || !rewardRate || initializePool.isPending}
      submit={() => {
        initializePool.mutateAsync({
          tokenMint: new PublicKey(tokenMint),
          rewardRate: parseInt(rewardRate),
        })
      }}
    >
      <Label htmlFor="tokenMint">Token Mint Address</Label>
      <Input
        id="tokenMint"
        type="text"
        placeholder="Token mint public key"
        value={tokenMint}
        onChange={(e) => setTokenMint(e.target.value)}
      />
      <Label htmlFor="rewardRate">Reward Rate (tokens/second)</Label>
      <Input
        id="rewardRate"
        type="number"
        min="1"
        placeholder="Rewards per second"
        value={rewardRate}
        onChange={(e) => setRewardRate(e.target.value)}
      />
    </AppModal>
  )
}

export function StakingList() {
  const { pools, programId } = useStakingProgram()

  if (pools.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }

  if (!pools.data?.length) {
    return (
      <div className="text-center">
        <p className="mb-2">
          No staking pools found. Create one to get started.
        </p>
        <p className="text-sm text-muted-foreground">
          Program ID: <ExplorerLink path={`account/${programId}`} label={ellipsify(programId.toString())} />
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {pools.data.map((pool) => (
        <StakingCard key={pool.publicKey.toString()} poolAddress={pool.publicKey} />
      ))}
    </div>
  )
}

function StakingCard({ poolAddress }: { poolAddress: PublicKey }) {
  const { poolQuery, fundRewards, closePool } = useStakePool({ poolAddress })
  const { publicKey } = useWallet()

  if (poolQuery.isLoading) {
    return <div>Loading...</div>
  }

  if (!poolQuery.data) {
    return <div>Pool not found</div>
  }

  const pool = poolQuery.data
  const isAdmin = publicKey?.toBase58() === pool.authority.toBase58()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staking Pool</CardTitle>
        <CardDescription>
          Token: <ExplorerLink path={`account/${pool.tokenMint}`} label={ellipsify(pool.tokenMint.toString())} />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Stat label="Total Staked" value={pool.totalStaked.toString()} />
          <Stat label="Reward Rate" value={`${pool.rewardRatePerSecond.toString()}/s`} />
          <Stat label="Status" value={pool.isActive ? 'Active' : 'Inactive'} />
          <Stat label="Authority" value={ellipsify(pool.authority.toString())} />
        </div>

        {publicKey && <StakeActions poolAddress={poolAddress} />}

        {isAdmin && (
          <div className="mt-4 pt-4 border-t flex gap-2">
            <FundRewardsButton poolAddress={poolAddress} fundRewards={fundRewards} />
            <Button
              variant="destructive"
              size="sm"
              disabled={closePool.isPending || pool.totalStaked.toNumber() > 0}
              onClick={() => closePool.mutateAsync()}
            >
              {closePool.isPending ? 'Closing...' : 'Close Pool'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StakeActions({ poolAddress }: { poolAddress: PublicKey }) {
  const { entryQuery, stake, unstake, claimRewards } = useStakeEntry({ poolAddress })
  const { publicKey } = useWallet()
  const tokenAccounts = useGetTokenAccounts({ address: publicKey! })
  const { poolQuery } = useStakePool({ poolAddress })

  const [stakeAmount, setStakeAmount] = useState('')
  const [unstakeAmount, setUnstakeAmount] = useState('')

  const entry = entryQuery.data
  const pool = poolQuery.data

  // Find the user's token account for this pool's mint
  const userTokenAccount = tokenAccounts.data?.find(
    (ta) => ta.account.data.parsed.info.mint === pool?.tokenMint.toBase58(),
  )
  const userTokenAccountPubkey = userTokenAccount ? userTokenAccount.pubkey : null
  const userBalance = userTokenAccount
    ? Number(userTokenAccount.account.data.parsed.info.tokenAmount.amount)
    : 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stake */}
        <Card className="border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-base text-purple-400">Stake</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Input
                type="number"
                min="1"
                placeholder="Amount"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Balance: {userBalance}</p>
              <Button
                className="w-full"
                disabled={!stakeAmount || !userTokenAccountPubkey || stake.isPending}
                onClick={() => {
                  if (userTokenAccountPubkey) {
                    stake.mutateAsync({
                      amount: parseInt(stakeAmount),
                      userTokenAccount: userTokenAccountPubkey,
                    })
                    setStakeAmount('')
                  }
                }}
              >
                {stake.isPending ? 'Staking...' : 'Stake'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Unstake */}
        <Card className="border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-base text-blue-400">Unstake</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Input
                type="number"
                min="1"
                placeholder="Amount"
                value={unstakeAmount}
                onChange={(e) => setUnstakeAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Staked: {entry?.stakedAmount?.toString() ?? '0'}
              </p>
              <Button
                className="w-full"
                variant="outline"
                disabled={!unstakeAmount || !userTokenAccountPubkey || unstake.isPending}
                onClick={() => {
                  if (userTokenAccountPubkey) {
                    unstake.mutateAsync({
                      amount: parseInt(unstakeAmount),
                      userTokenAccount: userTokenAccountPubkey,
                    })
                    setUnstakeAmount('')
                  }
                }}
              >
                {unstake.isPending ? 'Unstaking...' : 'Unstake'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Claim Rewards */}
        <Card className="border-emerald-500/20">
          <CardHeader>
            <CardTitle className="text-base text-emerald-400">Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold">{entry?.rewardsOwed?.toString() ?? '0'}</p>
              <p className="text-xs text-muted-foreground">Pending rewards</p>
              <Button
                className="w-full"
                variant="secondary"
                disabled={!userTokenAccountPubkey || claimRewards.isPending || !entry?.rewardsOwed?.toNumber()}
                onClick={() => {
                  if (userTokenAccountPubkey) {
                    claimRewards.mutateAsync({
                      userTokenAccount: userTokenAccountPubkey,
                    })
                  }
                }}
              >
                {claimRewards.isPending ? 'Claiming...' : 'Claim Rewards'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Stats */}
      {entry && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Your Stake" value={entry.stakedAmount.toString()} />
          <Stat label="Rewards Owed" value={entry.rewardsOwed.toString()} />
          <Stat
            label="Last Staked"
            value={
              entry.lastStakeTime.toNumber() > 0
                ? new Date(entry.lastStakeTime.toNumber() * 1000).toLocaleDateString()
                : 'Never'
            }
          />
          <Stat label="Wallet Balance" value={userBalance.toString()} />
        </div>
      )}
    </div>
  )
}

function FundRewardsButton({
  poolAddress,
  fundRewards,
}: {
  poolAddress: PublicKey
  fundRewards: ReturnType<typeof useStakePool>['fundRewards']
}) {
  const { publicKey } = useWallet()
  const tokenAccounts = useGetTokenAccounts({ address: publicKey! })
  const { poolQuery } = useStakePool({ poolAddress })
  const [amount, setAmount] = useState('')

  const pool = poolQuery.data
  const userTokenAccount = tokenAccounts.data?.find(
    (ta) => ta.account.data.parsed.info.mint === pool?.tokenMint.toBase58(),
  )

  return (
    <AppModal
      title="Fund Rewards"
      submitLabel="Fund"
      submitDisabled={!amount || fundRewards.isPending || !userTokenAccount}
      submit={() => {
        if (userTokenAccount) {
          fundRewards.mutateAsync({
            amount: parseInt(amount),
            funderTokenAccount: userTokenAccount.pubkey,
          })
        }
      }}
    >
      <Label htmlFor="fundAmount">Amount (raw tokens)</Label>
      <Input
        id="fundAmount"
        type="number"
        min="1"
        placeholder="Amount to fund"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
    </AppModal>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold truncate">{value}</p>
    </div>
  )
}
