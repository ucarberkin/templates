/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/staking.json`.
 */
export type Staking = {
  "address": "StKNGfrYoMsNmGELbcbad98bHszJfTSRwCWMa8sCq6S",
  "metadata": {
    "name": "staking",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "SPL Token Staking Program with Synthetix-style rewards"
  },
  "instructions": [
    {
      "name": "claimRewards",
      "docs": [
        "Claim accumulated reward tokens."
      ],
      "discriminator": [
        4,
        144,
        132,
        71,
        116,
        23,
        151,
        80
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "stakePool",
          "writable": true
        },
        {
          "name": "stakeEntry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  107,
                  101,
                  95,
                  101,
                  110,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "stakePool"
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "rewardVault",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "closePool",
      "docs": [
        "Close the pool. Only allowed when no tokens are staked."
      ],
      "discriminator": [
        140,
        189,
        209,
        23,
        239,
        62,
        239,
        11
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "stakePool",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "fundRewards",
      "docs": [
        "Admin deposits reward tokens into the pool's reward vault."
      ],
      "discriminator": [
        114,
        64,
        163,
        112,
        175,
        167,
        19,
        121
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "stakePool",
          "writable": true
        },
        {
          "name": "funderTokenAccount",
          "writable": true
        },
        {
          "name": "rewardVault",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializePool",
      "docs": [
        "Create a new staking pool for an SPL token.",
        "`reward_rate` is the number of reward tokens distributed per second",
        "across all stakers (scaled to token decimals)."
      ],
      "discriminator": [
        95,
        180,
        10,
        172,
        84,
        174,
        232,
        40
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "stakePool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  107,
                  101,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "tokenMint"
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "stakeVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  107,
                  101,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "stakePool"
              }
            ]
          }
        },
        {
          "name": "rewardVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  119,
                  97,
                  114,
                  100,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "stakePool"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "rewardRate",
          "type": "u64"
        }
      ]
    },
    {
      "name": "stake",
      "docs": [
        "Stake tokens into the pool."
      ],
      "discriminator": [
        206,
        176,
        202,
        18,
        200,
        209,
        179,
        108
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "stakePool",
          "writable": true
        },
        {
          "name": "stakeEntry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  107,
                  101,
                  95,
                  101,
                  110,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "stakePool"
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "stakeVault",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "unstake",
      "docs": [
        "Unstake (withdraw) tokens from the pool."
      ],
      "discriminator": [
        90,
        95,
        107,
        42,
        205,
        124,
        50,
        225
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "stakePool",
          "writable": true
        },
        {
          "name": "stakeEntry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  107,
                  101,
                  95,
                  101,
                  110,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "stakePool"
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "stakeVault",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "stakeEntry",
      "discriminator": [
        187,
        127,
        9,
        35,
        155,
        68,
        86,
        40
      ]
    },
    {
      "name": "stakePool",
      "discriminator": [
        121,
        34,
        206,
        21,
        79,
        127,
        255,
        28
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidAmount",
      "msg": "Amount must be greater than zero"
    },
    {
      "code": 6001,
      "name": "unauthorized",
      "msg": "Unauthorized: signer does not match expected authority"
    },
    {
      "code": 6002,
      "name": "poolInactive",
      "msg": "Pool is not accepting new stakes"
    },
    {
      "code": 6003,
      "name": "insufficientStake",
      "msg": "Insufficient staked balance for this withdrawal"
    },
    {
      "code": 6004,
      "name": "noRewards",
      "msg": "No rewards available to claim"
    },
    {
      "code": 6005,
      "name": "poolNotEmpty",
      "msg": "Cannot close pool while tokens are still staked"
    }
  ],
  "types": [
    {
      "name": "stakeEntry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "docs": [
              "The wallet that owns this stake entry."
            ],
            "type": "pubkey"
          },
          {
            "name": "pool",
            "docs": [
              "The stake pool this entry belongs to."
            ],
            "type": "pubkey"
          },
          {
            "name": "stakedAmount",
            "docs": [
              "Number of tokens currently staked."
            ],
            "type": "u64"
          },
          {
            "name": "rewardPerTokenPaid",
            "docs": [
              "Snapshot of reward_per_token_stored at the user's last action."
            ],
            "type": "u128"
          },
          {
            "name": "rewardsOwed",
            "docs": [
              "Accumulated but unclaimed reward tokens."
            ],
            "type": "u64"
          },
          {
            "name": "lastStakeTime",
            "docs": [
              "Unix timestamp of the user's last stake action."
            ],
            "type": "i64"
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump seed."
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "stakePool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "The admin who created this pool."
            ],
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "docs": [
              "SPL token mint used for both staking and rewards."
            ],
            "type": "pubkey"
          },
          {
            "name": "stakeVault",
            "docs": [
              "PDA-owned token account holding staked tokens."
            ],
            "type": "pubkey"
          },
          {
            "name": "rewardVault",
            "docs": [
              "PDA-owned token account holding reward tokens."
            ],
            "type": "pubkey"
          },
          {
            "name": "rewardRatePerSecond",
            "docs": [
              "Reward tokens distributed per second across all stakers."
            ],
            "type": "u64"
          },
          {
            "name": "totalStaked",
            "docs": [
              "Total tokens currently staked in this pool."
            ],
            "type": "u64"
          },
          {
            "name": "rewardPerTokenStored",
            "docs": [
              "Accumulated reward per token (scaled by 1e18)."
            ],
            "type": "u128"
          },
          {
            "name": "lastUpdateTime",
            "docs": [
              "Unix timestamp of the last reward update."
            ],
            "type": "i64"
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump seed."
            ],
            "type": "u8"
          },
          {
            "name": "isActive",
            "docs": [
              "Whether the pool accepts new stakes."
            ],
            "type": "bool"
          }
        ]
      }
    }
  ]
};
