'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '../solana/solana-provider'
import { AppHero } from '../app-hero'

import { redirect } from 'next/navigation'

export default function AccountListFeature() {
  const { publicKey } = useWallet()

  if (publicKey) {
    return redirect(`/account/${publicKey.toString()}`)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <AppHero
        title={<span className="text-gradient">Account</span>}
        subtitle="Connect your wallet to view your balances, token accounts, and transaction history."
      />
      <div className="max-w-md mx-auto px-4">
        <div className="flex justify-center py-8">
          <div className="scale-150">
            <WalletButton />
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-5">
          <h3 className="font-semibold text-sm mb-3 text-muted-foreground">What you&apos;ll see</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><span className="text-purple-400">&#x2022;</span> SOL balance and airdrop (on devnet)</li>
            <li className="flex gap-2"><span className="text-purple-400">&#x2022;</span> All SPL token accounts and balances</li>
            <li className="flex gap-2"><span className="text-purple-400">&#x2022;</span> Recent transaction history</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
