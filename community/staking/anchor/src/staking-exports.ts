// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import StakingIDL from '../target/idl/staking.json'
import type { Staking } from '../target/types/staking'

// Re-export the generated IDL and type
export { Staking, StakingIDL }

// The programId is imported from the program IDL.
export const STAKING_PROGRAM_ID = new PublicKey(StakingIDL.address)

// This is a helper function to get the Staking Anchor program.
export function getStakingProgram(
  provider: AnchorProvider,
  address?: PublicKey,
): Program<Staking> {
  return new Program(
    {
      ...StakingIDL,
      address: address ? address.toBase58() : StakingIDL.address,
    } as Staking,
    provider,
  )
}

// This is a helper function to get the program ID for the Staking program depending on the cluster.
export function getStakingProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
    case 'mainnet-beta':
    default:
      return STAKING_PROGRAM_ID
  }
}
