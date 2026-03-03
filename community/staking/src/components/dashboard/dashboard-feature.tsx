import { AppHero } from '@/components/app-hero'

const links: { label: string; href: string }[] = [
  { label: 'Solana Docs', href: 'https://docs.solana.com/' },
  { label: 'Anchor Docs', href: 'https://www.anchor-lang.com/docs' },
  { label: 'Solana Faucet', href: 'https://faucet.solana.com/' },
  { label: 'Solana Cookbook', href: 'https://solana.com/developers/cookbook/' },
  { label: 'Solana Developers GitHub', href: 'https://github.com/solana-developers/' },
]

const features = [
  {
    title: 'Synthetix Reward Model',
    description: 'O(1) gas-efficient reward calculation. Rewards distributed proportional to stake amount and duration.',
    color: 'text-purple-400',
    border: 'border-purple-500/20 hover:border-purple-500/40',
    bg: 'bg-purple-500/5',
  },
  {
    title: '6 Instructions',
    description: 'Initialize pool, fund rewards, stake, unstake, claim rewards, and close pool — all secured.',
    color: 'text-emerald-400',
    border: 'border-emerald-500/20 hover:border-emerald-500/40',
    bg: 'bg-emerald-500/5',
  },
  {
    title: 'Full Stack dApp',
    description: 'Next.js + Tailwind frontend with wallet adapter, real-time stats, admin panel, and user dashboard.',
    color: 'text-blue-400',
    border: 'border-blue-500/20 hover:border-blue-500/40',
    bg: 'bg-blue-500/5',
  },
]

export function DashboardFeature() {
  return (
    <div>
      <AppHero
        title={<span className="text-gradient">SPL Token Staking</span>}
        subtitle="Anchor-based staking with Synthetix-style reward distribution."
      />
      <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`rounded-xl border p-5 transition-all duration-200 ${feature.border} ${feature.bg}`}
            >
              <h3 className={`font-semibold mb-2 ${feature.color}`}>{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
        <div className="text-center space-y-2 mt-4">
          <p className="text-muted-foreground text-sm">Helpful links to get you started</p>
          {links.map((link, index) => (
            <div key={index}>
              <a
                href={link.href}
                className="text-sm text-muted-foreground hover:text-purple-400 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
