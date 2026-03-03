'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '../solana/solana-provider'
import { AppHero } from '../app-hero'
import { StakingCreate, StakingList } from './staking-ui'
import { useStakingProgram } from './staking-data-access'
import { ExplorerLink } from '../cluster/cluster-ui'
import { ellipsify } from '@/lib/utils'

export function StakingFeature() {
  const { publicKey } = useWallet()
  const { programId } = useStakingProgram()

  return publicKey ? (
    <div>
      <AppHero
        title={<span className="text-gradient">Staking</span>}
        subtitle={
          <span>
            Program:{' '}
            <ExplorerLink path={`account/${programId}`} label={ellipsify(programId.toString())} />
          </span>
        }
      >
        <div className="my-4">
          <StakingCreate />
        </div>
      </AppHero>
      <StakingList />
    </div>
  ) : (
    <div className="max-w-4xl mx-auto">
      <AppHero
        title={<span className="text-gradient">Staking</span>}
        subtitle="Connect your wallet to create staking pools, stake tokens, and earn rewards."
      />
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex justify-center py-8">
          <div className="scale-150">
            <WalletButton />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 text-center">
            <p className="text-2xl font-bold text-purple-400">Stake</p>
            <p className="text-xs text-muted-foreground mt-1">Deposit SPL tokens into a pool</p>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">Earn</p>
            <p className="text-xs text-muted-foreground mt-1">Rewards accrue every second</p>
          </div>
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">Claim</p>
            <p className="text-xs text-muted-foreground mt-1">Withdraw rewards anytime</p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-5">
          <h3 className="font-semibold text-sm mb-3 text-muted-foreground">How it works</h3>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><span className="text-purple-400 font-mono font-bold">1.</span> An admin creates a staking pool and funds it with reward tokens</li>
            <li className="flex gap-2"><span className="text-purple-400 font-mono font-bold">2.</span> Users stake their SPL tokens into the pool</li>
            <li className="flex gap-2"><span className="text-purple-400 font-mono font-bold">3.</span> Rewards accumulate proportional to stake amount and duration</li>
            <li className="flex gap-2"><span className="text-purple-400 font-mono font-bold">4.</span> Claim rewards or unstake at any time — no lock-up period</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
