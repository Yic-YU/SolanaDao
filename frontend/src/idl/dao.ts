/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/dao.json`.
 */
export type Dao = {
  "address": "3LDehVNaAgFqvjo1cPg96j8tKUReLrpsKpW321fb8uyR",
  "metadata": {
    "name": "dao",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "claimPayment",
      "docs": [
        "领取定期支付"
      ],
      "discriminator": [
        69,
        112,
        250,
        167,
        37,
        156,
        200,
        30
      ],
      "accounts": [
        {
          "name": "daoState",
          "writable": true,
          "relations": [
            "recurringPayment"
          ]
        },
        {
          "name": "treasury",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "daoState"
              }
            ]
          }
        },
        {
          "name": "recurringPayment",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  97,
                  121,
                  109,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "daoState"
              },
              {
                "kind": "account",
                "path": "recipient"
              }
            ]
          }
        },
        {
          "name": "recipient",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "executeProposal",
      "docs": [
        "执行一个已通过的提案"
      ],
      "discriminator": [
        186,
        60,
        116,
        133,
        108,
        128,
        111,
        28
      ],
      "accounts": [
        {
          "name": "daoState",
          "writable": true,
          "relations": [
            "proposal"
          ]
        },
        {
          "name": "proposal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  111,
                  115,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "daoState"
              },
              {
                "kind": "account",
                "path": "proposal.proposal_id",
                "account": "proposal"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "relations": [
            "daoState"
          ]
        },
        {
          "name": "treasury",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "daoState"
              }
            ]
          }
        },
        {
          "name": "recipient",
          "writable": true
        },
        {
          "name": "recurringPayment",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  97,
                  121,
                  109,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "daoState"
              },
              {
                "kind": "account",
                "path": "recipient"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeConfig",
      "docs": [
        "全局配置指令"
      ],
      "discriminator": [
        208,
        127,
        21,
        1,
        194,
        190,
        196,
        70
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "developerWallet",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "initializeDao",
      "docs": [
        "初始化Dao"
      ],
      "discriminator": [
        128,
        226,
        96,
        90,
        39,
        56,
        24,
        196
      ],
      "accounts": [
        {
          "name": "daoState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  97,
                  111
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "treasury",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "daoState"
              }
            ]
          }
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "governanceVault",
          "docs": [
            "新增：初始化治理代币金库PDA"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  111,
                  118,
                  101,
                  114,
                  110,
                  97,
                  110,
                  99,
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
                "path": "daoState"
              }
            ]
          }
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
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
          "docs": [
            "需要 Token Program 来创建金库账户"
          ],
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "rent",
          "docs": [
            "需要 Rent 来初始化账户"
          ],
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "threshold",
          "type": "u8"
        },
        {
          "name": "voteDuration",
          "type": "i64"
        },
        {
          "name": "quorum",
          "type": "u32"
        },
        {
          "name": "stakingYieldRate",
          "type": "u16"
        },
        {
          "name": "passThresholdPercentage",
          "type": "u8"
        },
        {
          "name": "minStakingAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "mulApprovePropose",
      "docs": [
        "批准一个多签提案"
      ],
      "discriminator": [
        254,
        80,
        167,
        198,
        244,
        117,
        89,
        247
      ],
      "accounts": [
        {
          "name": "daoState",
          "writable": true,
          "relations": [
            "proposal"
          ]
        },
        {
          "name": "proposal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  111,
                  115,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "daoState"
              },
              {
                "kind": "account",
                "path": "proposal.proposal_id",
                "account": "proposal"
              }
            ]
          }
        },
        {
          "name": "approver",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "relations": [
            "daoState"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "mulCreatePropose",
      "docs": [
        "发起一个多签提案"
      ],
      "discriminator": [
        181,
        241,
        250,
        111,
        26,
        23,
        146,
        236
      ],
      "accounts": [
        {
          "name": "daoState"
        },
        {
          "name": "proposal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  111,
                  115,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "daoState"
              },
              {
                "kind": "arg",
                "path": "proposalId"
              }
            ]
          }
        },
        {
          "name": "proposer",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "relations": [
            "daoState"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "proposalId",
          "type": "u64"
        },
        {
          "name": "proposalType",
          "type": {
            "defined": {
              "name": "proposalType"
            }
          }
        },
        {
          "name": "title",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        }
      ]
    },
    {
      "name": "stake",
      "docs": [
        "质押治理代币"
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
          "name": "staker",
          "docs": [
            "交易的发起者和签名者，即进行质押的用户。"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "daoState",
          "docs": [
            "DAO 的全局状态账户，用于获取治理代币 Mint 地址、",
            "以及作为生成 \"governance_vault\" PDA 的种子。"
          ],
          "writable": true
        },
        {
          "name": "stakerTokenAccount",
          "docs": [
            "质押者的代币账户，代币将从这里转出。"
          ],
          "writable": true
        },
        {
          "name": "governanceVault",
          "docs": [
            "DAO 的治理质押金库，一个用于存放所有质押代币的 PDA 代币账户。"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  111,
                  118,
                  101,
                  114,
                  110,
                  97,
                  110,
                  99,
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
                "path": "daoState"
              }
            ]
          }
        },
        {
          "name": "stakeAccount",
          "docs": [
            "记录用户质押信息的 PDA 数据账户。",
            "每个用户只有一个质押账户。如果是首次质押，则创建此账户。"
          ],
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
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "daoState"
              },
              {
                "kind": "account",
                "path": "staker"
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
        "赎回所有已质押的代币"
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
          "name": "staker",
          "docs": [
            "交易的发起者和签名者，即赎回代币的用户。"
          ],
          "writable": true,
          "signer": true,
          "relations": [
            "stakeAccount"
          ]
        },
        {
          "name": "daoState",
          "writable": true,
          "relations": [
            "stakeAccount"
          ]
        },
        {
          "name": "stakerTokenAccount",
          "docs": [
            "质押者的个人代币账户，赎回的代币将存入这里。"
          ],
          "writable": true
        },
        {
          "name": "governanceVault",
          "docs": [
            "治理质押金库，代币将从这里转出。"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  111,
                  118,
                  101,
                  114,
                  110,
                  97,
                  110,
                  99,
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
                "path": "daoState"
              }
            ]
          }
        },
        {
          "name": "stakeAccount",
          "docs": [
            "用户的个人质押记录。",
            "`close` 属性表示在指令成功执行后，关闭该账户并将租金返还给 `staker`。"
          ],
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
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "daoState"
              },
              {
                "kind": "account",
                "path": "staker"
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
        }
      ],
      "args": []
    },
    {
      "name": "updateConfig",
      "discriminator": [
        29,
        158,
        252,
        191,
        10,
        83,
        219,
        99
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newDeveloperWallet",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "vote",
      "docs": [
        "对提案进行投票"
      ],
      "discriminator": [
        227,
        110,
        155,
        23,
        136,
        126,
        172,
        25
      ],
      "accounts": [
        {
          "name": "voter",
          "writable": true,
          "signer": true
        },
        {
          "name": "stakeAccount",
          "docs": [
            "获取投票权重"
          ],
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
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "proposal.dao_state",
                "account": "proposal"
              },
              {
                "kind": "account",
                "path": "voter"
              }
            ]
          }
        },
        {
          "name": "daoState"
        },
        {
          "name": "proposal",
          "writable": true
        },
        {
          "name": "voteRecord",
          "docs": [
            "创建投票记录账户以防止重复投票"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  116,
                  101,
                  95,
                  114,
                  101,
                  99,
                  111,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "proposal"
              },
              {
                "kind": "account",
                "path": "voter"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "choice",
          "type": {
            "defined": {
              "name": "voteChoice"
            }
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "config",
      "discriminator": [
        155,
        12,
        170,
        224,
        30,
        250,
        204,
        130
      ]
    },
    {
      "name": "daoState",
      "discriminator": [
        24,
        50,
        14,
        105,
        233,
        60,
        201,
        244
      ]
    },
    {
      "name": "proposal",
      "discriminator": [
        26,
        94,
        189,
        187,
        116,
        136,
        53,
        33
      ]
    },
    {
      "name": "recurringPaymentAccount",
      "discriminator": [
        174,
        147,
        229,
        245,
        92,
        197,
        197,
        178
      ]
    },
    {
      "name": "stakeAccount",
      "discriminator": [
        80,
        158,
        67,
        124,
        50,
        189,
        192,
        255
      ]
    },
    {
      "name": "voteRecord",
      "discriminator": [
        112,
        9,
        123,
        165,
        234,
        9,
        157,
        167
      ]
    }
  ],
  "events": [
    {
      "name": "daoInitialized",
      "discriminator": [
        12,
        175,
        194,
        199,
        20,
        194,
        184,
        41
      ]
    },
    {
      "name": "paymentClaimed",
      "discriminator": [
        238,
        86,
        136,
        254,
        229,
        217,
        63,
        80
      ]
    },
    {
      "name": "proposalApproved",
      "discriminator": [
        70,
        49,
        155,
        228,
        157,
        43,
        88,
        49
      ]
    },
    {
      "name": "proposalCreated",
      "discriminator": [
        186,
        8,
        160,
        108,
        81,
        13,
        51,
        206
      ]
    },
    {
      "name": "proposalExecuted",
      "discriminator": [
        92,
        213,
        189,
        201,
        101,
        83,
        111,
        83
      ]
    },
    {
      "name": "stakeProposalCreated",
      "discriminator": [
        154,
        152,
        128,
        116,
        166,
        190,
        37,
        40
      ]
    },
    {
      "name": "stakeProposalExecuted",
      "discriminator": [
        93,
        63,
        109,
        136,
        147,
        162,
        246,
        187
      ]
    },
    {
      "name": "tokensStaked",
      "discriminator": [
        220,
        130,
        145,
        142,
        109,
        123,
        38,
        100
      ]
    },
    {
      "name": "tokensUnstaked",
      "discriminator": [
        137,
        203,
        131,
        80,
        135,
        107,
        181,
        150
      ]
    },
    {
      "name": "voteCasted",
      "discriminator": [
        156,
        98,
        66,
        40,
        149,
        79,
        255,
        51
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "recurringPaymentExists",
      "msg": "Recurring payment for this recipient already exists."
    },
    {
      "code": 6001,
      "name": "noClaimablePayment",
      "msg": "No claimable payment found for this recipient."
    },
    {
      "code": 6002,
      "name": "claimTooEarly",
      "msg": "It is not yet time to claim this payment."
    },
    {
      "code": 6003,
      "name": "invalidThreshold",
      "msg": "Threshold must be greater than 0."
    },
    {
      "code": 6004,
      "name": "invalidVoteDuration",
      "msg": "Vote duration must be a positive value."
    },
    {
      "code": 6005,
      "name": "invalidPaymentAmount",
      "msg": "Recurring payment amount must be greater than 0."
    },
    {
      "code": 6006,
      "name": "invalidPaymentInterval",
      "msg": "Recurring payment interval must be a positive value."
    },
    {
      "code": 6007,
      "name": "invalidCurrency",
      "msg": "Recurring payment currencyType must be sol."
    },
    {
      "code": 6008,
      "name": "invalidRecipient",
      "msg": "Recipient cannot be the DAO treasury itself."
    },
    {
      "code": 6009,
      "name": "insufficientTreasuryBalance",
      "msg": "Treasury does not have enough funds to make this payment."
    },
    {
      "code": 6010,
      "name": "arithmeticOverflow",
      "msg": "An arithmetic operation resulted in an overflow."
    },
    {
      "code": 6011,
      "name": "unauthorizedSigner",
      "msg": "Signer is not authorized to perform this action."
    },
    {
      "code": 6012,
      "name": "proposalAlreadyExecuted",
      "msg": "This proposal has already been executed."
    },
    {
      "code": 6013,
      "name": "alreadyApproved",
      "msg": "Signer has already approved this proposal."
    },
    {
      "code": 6014,
      "name": "signerAlreadyExists",
      "msg": "Signer is already part of the DAO."
    },
    {
      "code": 6015,
      "name": "signerNotFound",
      "msg": "Signer to be removed was not found."
    },
    {
      "code": 6016,
      "name": "cannotRemoveSigner",
      "msg": "Cannot remove signer, the total number of signers would fall below the threshold."
    },
    {
      "code": 6017,
      "name": "invalidNewThreshold",
      "msg": "The new threshold is invalid. It must be greater than 0 and not exceed the number of signers."
    },
    {
      "code": 6018,
      "name": "invalidStakeAmount",
      "msg": "Stake amount must be greater than 0."
    },
    {
      "code": 6019,
      "name": "noTokensStaked",
      "msg": "No tokens staked to unstake."
    },
    {
      "code": 6020,
      "name": "notStaked",
      "msg": "You must have a stake in the DAO to create a proposal."
    },
    {
      "code": 6021,
      "name": "proposalNotActive",
      "msg": "The proposal is not currently active for voting."
    },
    {
      "code": 6022,
      "name": "votePeriodNotOver",
      "msg": "The voting period for this proposal has not yet ended."
    },
    {
      "code": 6023,
      "name": "alreadyVoted",
      "msg": "You have already voted on this proposal."
    },
    {
      "code": 6024,
      "name": "quorumNotReached",
      "msg": "The proposal did not meet the required quorum."
    },
    {
      "code": 6025,
      "name": "voteFailedMajority",
      "msg": "The proposal failed because there were more 'No' votes than 'Yes' votes."
    },
    {
      "code": 6026,
      "name": "insufficientStake",
      "msg": "You do not have enough tokens staked to perform this action."
    },
    {
      "code": 6027,
      "name": "proposalNotApproved",
      "msg": "Proposal has not been approved by multisig yet."
    },
    {
      "code": 6028,
      "name": "proposalNotPassed",
      "msg": "Proposal did not pass the voting threshold."
    },
    {
      "code": 6029,
      "name": "quorumNotMet",
      "msg": "Quorum requirement not met for this proposal."
    }
  ],
  "types": [
    {
      "name": "config",
      "docs": [
        "全局配置账户，用于存储可由管理员更新的参数"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "docs": [
              "拥有更新配置权限的管理员地址"
            ],
            "type": "pubkey"
          },
          {
            "name": "developerWallet",
            "docs": [
              "接收平台费用的开发者/平台方钱包地址"
            ],
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "currencyType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "sol"
          }
        ]
      }
    },
    {
      "name": "daoInitialized",
      "docs": [
        "dao初始化"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "daoState",
            "type": "pubkey"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "treasury",
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "threshold",
            "type": "u8"
          },
          {
            "name": "voteDuration",
            "type": "i64"
          },
          {
            "name": "quorum",
            "type": "u32"
          },
          {
            "name": "stakingYieldRate",
            "type": "u16"
          },
          {
            "name": "passThresholdPercentage",
            "type": "u8"
          },
          {
            "name": "minStakingAmount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "daoState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "project",
            "docs": [
              "项目地址（32）"
            ],
            "type": "pubkey"
          },
          {
            "name": "authority",
            "docs": [
              "DAO 的最高管理员（32）"
            ],
            "type": "pubkey"
          },
          {
            "name": "treasury",
            "docs": [
              "DAO 的金库地址，用于存放资金。（32）"
            ],
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "docs": [
              "DAO 的治理代币 Mint 地址（32）"
            ],
            "type": "pubkey"
          },
          {
            "name": "signer",
            "docs": [
              "签名者列表  （4 + N*32）"
            ],
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "threshold",
            "docs": [
              "阈值 （1）"
            ],
            "type": "u8"
          },
          {
            "name": "voteDuration",
            "docs": [
              "提案的投票持续时长 （8）"
            ],
            "type": "i64"
          },
          {
            "name": "totalStakedAmount",
            "docs": [
              "总质押代币数量 (8)"
            ],
            "type": "u64"
          },
          {
            "name": "quorum",
            "docs": [
              "法定人数：执行提案时，必须达到的最少投票人数 (u32)"
            ],
            "type": "u32"
          },
          {
            "name": "stakingYieldRate",
            "docs": [
              "质押年化收益率 (u16, e.g., 500 for 5%)"
            ],
            "type": "u16"
          },
          {
            "name": "passThresholdPercentage",
            "docs": [
              "投票通过的权重百分比 (u8, e.g., 60 for 60%)"
            ],
            "type": "u8"
          },
          {
            "name": "minStakingAmount",
            "docs": [
              "参与提案和投票的最小质押代币数 (u64)"
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "daoUpdateAction",
      "docs": [
        "定义了可以对 DAO 进行的修改操作"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "addSigner",
            "fields": [
              {
                "name": "newSigner",
                "type": "pubkey"
              }
            ]
          },
          {
            "name": "removeSigner",
            "fields": [
              {
                "name": "signerToRemove",
                "type": "pubkey"
              }
            ]
          },
          {
            "name": "changeThreshold",
            "fields": [
              {
                "name": "newThreshold",
                "type": "u8"
              }
            ]
          }
        ]
      }
    },
    {
      "name": "paymentClaimed",
      "docs": [
        "领取定期支付事件"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "daoState",
            "docs": [
              "关联的 DAO 账户"
            ],
            "type": "pubkey"
          },
          {
            "name": "paymentAccount",
            "docs": [
              "支付账户"
            ],
            "type": "pubkey"
          },
          {
            "name": "recipient",
            "docs": [
              "领取人地址"
            ],
            "type": "pubkey"
          },
          {
            "name": "claimedAmount",
            "docs": [
              "本次领取的金额"
            ],
            "type": "u64"
          },
          {
            "name": "nextClaimableTimestamp",
            "docs": [
              "更新后的下一次可领取时间戳"
            ],
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "proposal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "daoState",
            "docs": [
              "关联的 DAO State 账户地址"
            ],
            "type": "pubkey"
          },
          {
            "name": "proposer",
            "docs": [
              "提案发起人（多签者）"
            ],
            "type": "pubkey"
          },
          {
            "name": "proposalId",
            "docs": [
              "提案的唯一ID"
            ],
            "type": "u64"
          },
          {
            "name": "proposalType",
            "docs": [
              "提案的具体操作"
            ],
            "type": {
              "defined": {
                "name": "proposalType"
              }
            }
          },
          {
            "name": "approvals",
            "docs": [
              "已批准该提案的签名者列表"
            ],
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "title",
            "docs": [
              "提案的标题"
            ],
            "type": "string"
          },
          {
            "name": "description",
            "docs": [
              "提案的描述"
            ],
            "type": "string"
          },
          {
            "name": "yesVotes",
            "docs": [
              "赞成票总数 (基于质押权重)"
            ],
            "type": "u64"
          },
          {
            "name": "noVotes",
            "docs": [
              "反对票总数 (基于质押权重)"
            ],
            "type": "u64"
          },
          {
            "name": "voterCount",
            "docs": [
              "参与投票的总人数"
            ],
            "type": "u32"
          },
          {
            "name": "endTime",
            "docs": [
              "提案投票结束时间戳"
            ],
            "type": "i64"
          },
          {
            "name": "executed",
            "docs": [
              "提案是否已执行"
            ],
            "type": "bool"
          },
          {
            "name": "createdAt",
            "docs": [
              "提案创建时间"
            ],
            "type": "i64"
          },
          {
            "name": "approvedAt",
            "docs": [
              "多签批准时间"
            ],
            "type": {
              "option": "i64"
            }
          }
        ]
      }
    },
    {
      "name": "proposalApproved",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "daoState",
            "docs": [
              "关联的 DAO 账户"
            ],
            "type": "pubkey"
          },
          {
            "name": "proposal",
            "docs": [
              "被批准的提案账户"
            ],
            "type": "pubkey"
          },
          {
            "name": "proposalId",
            "docs": [
              "提案的ID"
            ],
            "type": "u64"
          },
          {
            "name": "approver",
            "docs": [
              "本次操作的批准者"
            ],
            "type": "pubkey"
          },
          {
            "name": "currentApprovals",
            "docs": [
              "当前的批准总数"
            ],
            "type": "u64"
          },
          {
            "name": "threshold",
            "docs": [
              "要求的阈值"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "proposalCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "daoState",
            "docs": [
              "关联的 DAO 账户"
            ],
            "type": "pubkey"
          },
          {
            "name": "proposal",
            "docs": [
              "新创建的提案账户"
            ],
            "type": "pubkey"
          },
          {
            "name": "proposalId",
            "docs": [
              "提案的唯一ID"
            ],
            "type": "u64"
          },
          {
            "name": "proposer",
            "docs": [
              "提案发起人"
            ],
            "type": "pubkey"
          },
          {
            "name": "proposalType",
            "docs": [
              "提案的具体类型和内容"
            ],
            "type": {
              "defined": {
                "name": "proposalType"
              }
            }
          }
        ]
      }
    },
    {
      "name": "proposalExecuted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "daoState",
            "docs": [
              "关联的 DAO 账户"
            ],
            "type": "pubkey"
          },
          {
            "name": "proposal",
            "docs": [
              "成功执行的提案账户"
            ],
            "type": "pubkey"
          },
          {
            "name": "proposalId",
            "docs": [
              "提案的ID"
            ],
            "type": "u64"
          },
          {
            "name": "proposalType",
            "docs": [
              "被执行的具体提案类型和内容"
            ],
            "type": {
              "defined": {
                "name": "proposalType"
              }
            }
          }
        ]
      }
    },
    {
      "name": "proposalType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "addRecurringPayment",
            "fields": [
              {
                "name": "recipient",
                "type": "pubkey"
              },
              {
                "name": "amount",
                "type": "u64"
              },
              {
                "name": "currency",
                "type": {
                  "defined": {
                    "name": "currencyType"
                  }
                }
              },
              {
                "name": "interval",
                "type": "i64"
              }
            ]
          },
          {
            "name": "updateDao",
            "fields": [
              {
                "name": "action",
                "type": {
                  "defined": {
                    "name": "daoUpdateAction"
                  }
                }
              }
            ]
          },
          {
            "name": "withdrawTreasury",
            "fields": [
              {
                "name": "amount",
                "type": "u64"
              },
              {
                "name": "recipient",
                "type": "pubkey"
              }
            ]
          }
        ]
      }
    },
    {
      "name": "recurringPaymentAccount",
      "docs": [
        "定期支付 (4 + N * (32 + 8 + 1 + 8 + 8)) -> (32 recipient + 8 amount + 1 currency + 8 interval + 8 next_payment = 57)"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "daoState",
            "docs": [
              "关联的 DAO State 账户地址"
            ],
            "type": "pubkey"
          },
          {
            "name": "receiver",
            "docs": [
              "收款人地址"
            ],
            "type": "pubkey"
          },
          {
            "name": "amount",
            "docs": [
              "支付金额"
            ],
            "type": "u64"
          },
          {
            "name": "currency",
            "docs": [
              "代币种类 (当前仅支持 SOL)"
            ],
            "type": {
              "defined": {
                "name": "currencyType"
              }
            }
          },
          {
            "name": "intervalDay",
            "docs": [
              "支付间隔（秒）"
            ],
            "type": "i64"
          },
          {
            "name": "nextClaimableTimestamp",
            "docs": [
              "下一次可领取的时间戳"
            ],
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "stakeAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "staker",
            "docs": [
              "质押者的公钥"
            ],
            "type": "pubkey"
          },
          {
            "name": "daoState",
            "docs": [
              "关联的 DAO State 账户"
            ],
            "type": "pubkey"
          },
          {
            "name": "amount",
            "docs": [
              "质押的代币数量"
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "stakeProposalCreated",
      "docs": [
        "当一个质押提案被创建时触发"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "daoState",
            "docs": [
              "关联的 DAO 账户"
            ],
            "type": "pubkey"
          },
          {
            "name": "proposal",
            "docs": [
              "新创建的提案账户"
            ],
            "type": "pubkey"
          },
          {
            "name": "proposalId",
            "docs": [
              "提案的唯一ID"
            ],
            "type": "u64"
          },
          {
            "name": "proposer",
            "docs": [
              "提案发起人"
            ],
            "type": "pubkey"
          },
          {
            "name": "title",
            "docs": [
              "提案标题"
            ],
            "type": "string"
          },
          {
            "name": "description",
            "docs": [
              "提案描述"
            ],
            "type": "string"
          },
          {
            "name": "proposalType",
            "docs": [
              "提案类型和内容"
            ],
            "type": {
              "defined": {
                "name": "proposalType"
              }
            }
          },
          {
            "name": "endTime",
            "docs": [
              "投票结束时间"
            ],
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "stakeProposalExecuted",
      "docs": [
        "当一个质押提案被成功执行时触发"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "daoState",
            "docs": [
              "关联的 DAO 账户"
            ],
            "type": "pubkey"
          },
          {
            "name": "proposal",
            "docs": [
              "成功执行的提案账户"
            ],
            "type": "pubkey"
          },
          {
            "name": "proposalId",
            "docs": [
              "提案的ID"
            ],
            "type": "u64"
          },
          {
            "name": "proposalType",
            "docs": [
              "被执行的具体提案类型和内容"
            ],
            "type": {
              "defined": {
                "name": "proposalType"
              }
            }
          }
        ]
      }
    },
    {
      "name": "tokensStaked",
      "docs": [
        "用户成功质押代币事件"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "daoState",
            "docs": [
              "关联的 DAO 账户"
            ],
            "type": "pubkey"
          },
          {
            "name": "stakeAccount",
            "docs": [
              "质押信息账户"
            ],
            "type": "pubkey"
          },
          {
            "name": "staker",
            "docs": [
              "质押者"
            ],
            "type": "pubkey"
          },
          {
            "name": "amountStaked",
            "docs": [
              "本次质押的数量"
            ],
            "type": "u64"
          },
          {
            "name": "newTotalForStaker",
            "docs": [
              "该用户质押后的总数量"
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "tokensUnstaked",
      "docs": [
        "用户成功赎回代币事件"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "daoState",
            "docs": [
              "关联的 DAO 账户"
            ],
            "type": "pubkey"
          },
          {
            "name": "stakeAccount",
            "docs": [
              "(已关闭的)质押信息账户"
            ],
            "type": "pubkey"
          },
          {
            "name": "staker",
            "docs": [
              "赎回者"
            ],
            "type": "pubkey"
          },
          {
            "name": "amountUnstaked",
            "docs": [
              "赎回的代币数量"
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "voteCasted",
      "docs": [
        "当用户对质押提案进行投票时触发"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposal",
            "docs": [
              "关联的提案账户"
            ],
            "type": "pubkey"
          },
          {
            "name": "voter",
            "docs": [
              "投票者"
            ],
            "type": "pubkey"
          },
          {
            "name": "choice",
            "docs": [
              "投票选项 (Yes/No)"
            ],
            "type": {
              "defined": {
                "name": "voteChoice"
              }
            }
          },
          {
            "name": "weight",
            "docs": [
              "本次投票的权重 (质押数量)"
            ],
            "type": "u64"
          },
          {
            "name": "newYesVotes",
            "docs": [
              "更新后的总赞成票数"
            ],
            "type": "u64"
          },
          {
            "name": "newNoVotes",
            "docs": [
              "更新后的总反对票数"
            ],
            "type": "u64"
          },
          {
            "name": "newVoterCount",
            "docs": [
              "更新后的总投票人数"
            ],
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "voteChoice",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "yes"
          },
          {
            "name": "no"
          }
        ]
      }
    },
    {
      "name": "voteRecord",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposal",
            "docs": [
              "关联的提案账户"
            ],
            "type": "pubkey"
          },
          {
            "name": "voter",
            "docs": [
              "投票人"
            ],
            "type": "pubkey"
          },
          {
            "name": "weight",
            "docs": [
              "投票人的投票权重 (当时质押的数量)"
            ],
            "type": "u64"
          }
        ]
      }
    }
  ]
};
