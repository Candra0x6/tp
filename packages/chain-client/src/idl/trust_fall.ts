/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/trust_fall.json`.
 */
export type TrustFall = {
  "address": "68mZDv4kASxdpfXk358QoBK3UdEVJqDzYazeDaF27DAC",
  "metadata": {
    "name": "trustFall",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Trust Fall Anchor Program for MagicBlock Ephemeral Rollups"
  },
  "instructions": [
    {
      "name": "bankResolve",
      "discriminator": [
        153,
        95,
        103,
        204,
        231,
        200,
        97,
        177
      ],
      "accounts": [
        {
          "name": "run",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  117,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "code"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "code",
          "type": {
            "array": [
              "u8",
              4
            ]
          }
        }
      ]
    },
    {
      "name": "bankVote",
      "discriminator": [
        38,
        95,
        56,
        73,
        221,
        101,
        35,
        111
      ],
      "accounts": [
        {
          "name": "player",
          "signer": true
        },
        {
          "name": "run",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  117,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "code"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "code",
          "type": {
            "array": [
              "u8",
              4
            ]
          }
        },
        {
          "name": "choice",
          "type": "u8"
        }
      ]
    },
    {
      "name": "callbackDeal",
      "discriminator": [
        180,
        17,
        166,
        178,
        30,
        59,
        141,
        223
      ],
      "accounts": [
        {
          "name": "vrfProgramIdentity",
          "docs": [
            "Scoped VRF identity PDA, bound to this program. Its presence as a signer proves",
            "the callback was issued by the VRF program for this program."
          ],
          "signer": true
        },
        {
          "name": "run",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  117,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "code"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "randomness",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "code",
          "type": {
            "array": [
              "u8",
              4
            ]
          }
        }
      ]
    },
    {
      "name": "chat",
      "discriminator": [
        189,
        34,
        82,
        12,
        30,
        178,
        146,
        97
      ],
      "accounts": [
        {
          "name": "player",
          "signer": true
        },
        {
          "name": "run",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  117,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "code"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "code",
          "type": {
            "array": [
              "u8",
              4
            ]
          }
        },
        {
          "name": "body",
          "type": {
            "array": [
              "u8",
              28
            ]
          }
        },
        {
          "name": "len",
          "type": "u8"
        }
      ]
    },
    {
      "name": "commitFloor",
      "discriminator": [
        3,
        50,
        203,
        117,
        172,
        180,
        52,
        244
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "run",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  117,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "code"
              }
            ]
          }
        },
        {
          "name": "slot0",
          "writable": true
        },
        {
          "name": "slot1",
          "writable": true
        },
        {
          "name": "slot2",
          "writable": true
        },
        {
          "name": "slot3",
          "writable": true
        },
        {
          "name": "magicProgram",
          "address": "Magic11111111111111111111111111111111111111"
        },
        {
          "name": "magicContext",
          "writable": true,
          "address": "MagicContext1111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "code",
          "type": {
            "array": [
              "u8",
              4
            ]
          }
        }
      ]
    },
    {
      "name": "createParty",
      "discriminator": [
        251,
        84,
        246,
        151,
        106,
        204,
        201,
        22
      ],
      "accounts": [
        {
          "name": "host",
          "writable": true,
          "signer": true
        },
        {
          "name": "run",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  117,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "code"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "run"
              }
            ]
          }
        },
        {
          "name": "hostAta",
          "writable": true
        },
        {
          "name": "mint"
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
          "name": "code",
          "type": {
            "array": [
              "u8",
              4
            ]
          }
        },
        {
          "name": "depth",
          "type": "u8"
        },
        {
          "name": "stake",
          "type": "u64"
        }
      ]
    },
    {
      "name": "delegate",
      "discriminator": [
        90,
        147,
        75,
        178,
        85,
        88,
        4,
        137
      ],
      "accounts": [
        {
          "name": "host",
          "writable": true,
          "signer": true
        },
        {
          "name": "bufferRun",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  102,
                  102,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "run"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                76,
                71,
                225,
                34,
                105,
                11,
                134,
                205,
                186,
                155,
                242,
                100,
                224,
                152,
                95,
                165,
                253,
                76,
                162,
                71,
                192,
                87,
                237,
                218,
                128,
                42,
                78,
                56,
                250,
                71,
                255,
                197
              ]
            }
          }
        },
        {
          "name": "delegationRecordRun",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "run"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "delegationMetadataRun",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110,
                  45,
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "run"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "run",
          "docs": [
            "program enforces the `[\"run\", code]` seeds; ownership is re-established",
            "on the ER where this account is read through the delegation."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  117,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "code"
              }
            ]
          }
        },
        {
          "name": "bufferSlot0",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  102,
                  102,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "slot0"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                76,
                71,
                225,
                34,
                105,
                11,
                134,
                205,
                186,
                155,
                242,
                100,
                224,
                152,
                95,
                165,
                253,
                76,
                162,
                71,
                192,
                87,
                237,
                218,
                128,
                42,
                78,
                56,
                250,
                71,
                255,
                197
              ]
            }
          }
        },
        {
          "name": "delegationRecordSlot0",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "slot0"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "delegationMetadataSlot0",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110,
                  45,
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "slot0"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "slot0",
          "docs": [
            "callback on the ER. Seeded `[\"clue\", run, 0]`; never validated by type",
            "because delegation transfers ownership to the delegation program."
          ],
          "writable": true
        },
        {
          "name": "bufferSlot1",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  102,
                  102,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "slot1"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                76,
                71,
                225,
                34,
                105,
                11,
                134,
                205,
                186,
                155,
                242,
                100,
                224,
                152,
                95,
                165,
                253,
                76,
                162,
                71,
                192,
                87,
                237,
                218,
                128,
                42,
                78,
                56,
                250,
                71,
                255,
                197
              ]
            }
          }
        },
        {
          "name": "delegationRecordSlot1",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "slot1"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "delegationMetadataSlot1",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110,
                  45,
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "slot1"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "slot1",
          "writable": true
        },
        {
          "name": "bufferSlot2",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  102,
                  102,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "slot2"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                76,
                71,
                225,
                34,
                105,
                11,
                134,
                205,
                186,
                155,
                242,
                100,
                224,
                152,
                95,
                165,
                253,
                76,
                162,
                71,
                192,
                87,
                237,
                218,
                128,
                42,
                78,
                56,
                250,
                71,
                255,
                197
              ]
            }
          }
        },
        {
          "name": "delegationRecordSlot2",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "slot2"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "delegationMetadataSlot2",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110,
                  45,
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "slot2"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "slot2",
          "writable": true
        },
        {
          "name": "bufferSlot3",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  102,
                  102,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "slot3"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                76,
                71,
                225,
                34,
                105,
                11,
                134,
                205,
                186,
                155,
                242,
                100,
                224,
                152,
                95,
                165,
                253,
                76,
                162,
                71,
                192,
                87,
                237,
                218,
                128,
                42,
                78,
                56,
                250,
                71,
                255,
                197
              ]
            }
          }
        },
        {
          "name": "delegationRecordSlot3",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "slot3"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "delegationMetadataSlot3",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110,
                  45,
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "slot3"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "slot3",
          "writable": true
        },
        {
          "name": "ownerProgram",
          "address": "68mZDv4kASxdpfXk358QoBK3UdEVJqDzYazeDaF27DAC"
        },
        {
          "name": "delegationProgram",
          "address": "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "code",
          "type": {
            "array": [
              "u8",
              4
            ]
          }
        },
        {
          "name": "validator",
          "type": {
            "option": "pubkey"
          }
        }
      ]
    },
    {
      "name": "finalSettle",
      "discriminator": [
        58,
        36,
        178,
        14,
        162,
        80,
        140,
        214
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "run",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  117,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "code"
              }
            ]
          }
        },
        {
          "name": "slot0",
          "writable": true
        },
        {
          "name": "slot1",
          "writable": true
        },
        {
          "name": "slot2",
          "writable": true
        },
        {
          "name": "slot3",
          "writable": true
        },
        {
          "name": "magicProgram",
          "address": "Magic11111111111111111111111111111111111111"
        },
        {
          "name": "magicContext",
          "writable": true,
          "address": "MagicContext1111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "code",
          "type": {
            "array": [
              "u8",
              4
            ]
          }
        }
      ]
    },
    {
      "name": "initializeVault",
      "discriminator": [
        48,
        191,
        163,
        44,
        71,
        129,
        63,
        164
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "mint"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "joinParty",
      "discriminator": [
        61,
        233,
        64,
        74,
        153,
        121,
        183,
        82
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "run",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  117,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "run.code",
                "account": "run"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "run"
              }
            ]
          }
        },
        {
          "name": "playerAta",
          "writable": true
        },
        {
          "name": "mint"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "mark",
      "discriminator": [
        203,
        149,
        171,
        234,
        35,
        230,
        238,
        184
      ],
      "accounts": [
        {
          "name": "player",
          "signer": true
        },
        {
          "name": "run",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  117,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "code"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "code",
          "type": {
            "array": [
              "u8",
              4
            ]
          }
        },
        {
          "name": "door",
          "type": "u8"
        },
        {
          "name": "set",
          "type": "bool"
        }
      ]
    },
    {
      "name": "processUndelegation",
      "discriminator": [
        196,
        28,
        41,
        206,
        48,
        37,
        51,
        167
      ],
      "accounts": [
        {
          "name": "baseAccount",
          "writable": true
        },
        {
          "name": "buffer",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  110,
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  101,
                  45,
                  98,
                  117,
                  102,
                  102,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "baseAccount"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                181,
                183,
                0,
                225,
                242,
                87,
                58,
                192,
                204,
                6,
                34,
                1,
                52,
                74,
                207,
                151,
                184,
                53,
                6,
                235,
                140,
                229,
                25,
                152,
                204,
                98,
                126,
                24,
                147,
                128,
                167,
                62
              ]
            }
          }
        },
        {
          "name": "payer",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "accountSeeds",
          "type": {
            "vec": "bytes"
          }
        }
      ]
    },
    {
      "name": "ready",
      "discriminator": [
        21,
        117,
        60,
        73,
        96,
        121,
        209,
        75
      ],
      "accounts": [
        {
          "name": "player",
          "signer": true
        },
        {
          "name": "run",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  117,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "run.code",
                "account": "run"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "requestDeal",
      "discriminator": [
        33,
        8,
        55,
        83,
        144,
        145,
        124,
        236
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "run",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  117,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "code"
              }
            ]
          }
        },
        {
          "name": "oracleQueue",
          "docs": [
            "to answer on Sunday, so accept the delegated queues and their bases."
          ],
          "writable": true
        },
        {
          "name": "programIdentity",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  100,
                  101,
                  110,
                  116,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "vrfProgram",
          "address": "Vrf1RNUjXmQGjmQrQLvJHs9SNkvDJEsRVFPkfSQUwGz"
        },
        {
          "name": "slotHashes",
          "address": "SysvarS1otHashes111111111111111111111111111"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "code",
          "type": {
            "array": [
              "u8",
              4
            ]
          }
        }
      ]
    },
    {
      "name": "resolve",
      "discriminator": [
        246,
        150,
        236,
        206,
        108,
        63,
        58,
        10
      ],
      "accounts": [
        {
          "name": "run",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  117,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "code"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "code",
          "type": {
            "array": [
              "u8",
              4
            ]
          }
        }
      ]
    },
    {
      "name": "resolveExpired",
      "discriminator": [
        18,
        38,
        108,
        89,
        114,
        130,
        104,
        201
      ],
      "accounts": [
        {
          "name": "run",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  117,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "code"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "code",
          "type": {
            "array": [
              "u8",
              4
            ]
          }
        }
      ]
    },
    {
      "name": "seedVault",
      "discriminator": [
        181,
        183,
        221,
        107,
        162,
        110,
        142,
        222
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "mint"
        },
        {
          "name": "vaultAta",
          "writable": true
        },
        {
          "name": "adminAta",
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
      "name": "settle",
      "discriminator": [
        175,
        42,
        185,
        87,
        144,
        131,
        102,
        212
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "run",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  117,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "code"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "run"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "vaultAta",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "code",
          "type": {
            "array": [
              "u8",
              4
            ]
          }
        }
      ]
    },
    {
      "name": "vote",
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
          "name": "player",
          "signer": true
        },
        {
          "name": "run",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  117,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "code"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "code",
          "type": {
            "array": [
              "u8",
              4
            ]
          }
        },
        {
          "name": "door",
          "type": "u8"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "clueSlot",
      "discriminator": [
        101,
        57,
        198,
        217,
        217,
        240,
        129,
        219
      ]
    },
    {
      "name": "run",
      "discriminator": [
        199,
        54,
        155,
        86,
        235,
        115,
        246,
        189
      ]
    },
    {
      "name": "vault",
      "discriminator": [
        211,
        8,
        232,
        43,
        2,
        152,
        117,
        119
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "partyFull",
      "msg": "The party is full"
    },
    {
      "code": 6001,
      "name": "seatTaken",
      "msg": "That seat is already taken"
    },
    {
      "code": 6002,
      "name": "notMember",
      "msg": "You are not a member of this party"
    },
    {
      "code": 6003,
      "name": "notFull",
      "msg": "Not all players have joined yet"
    },
    {
      "code": 6004,
      "name": "notReady",
      "msg": "Not every player has signalled ready"
    },
    {
      "code": 6005,
      "name": "wrongPhase",
      "msg": "Wrong game phase for that action"
    },
    {
      "code": 6006,
      "name": "vrfBusy",
      "msg": "VRF is busy, wait for the current request"
    },
    {
      "code": 6007,
      "name": "vrfIdle",
      "msg": "No VRF request is in flight"
    },
    {
      "code": 6008,
      "name": "alreadyDealt",
      "msg": "The floor has already been dealt"
    },
    {
      "code": 6009,
      "name": "badDoor",
      "msg": "Door index out of range"
    },
    {
      "code": 6010,
      "name": "notResolvable",
      "msg": "No majority vote yet and the deadline has not passed"
    },
    {
      "code": 6011,
      "name": "floorOpen",
      "msg": "The floor is still open"
    },
    {
      "code": 6012,
      "name": "chatTooLong",
      "msg": "Chat message too long"
    },
    {
      "code": 6013,
      "name": "chatBadByte",
      "msg": "Chat message contains a byte outside A-Z0-9 space . , ? ! -"
    },
    {
      "code": 6014,
      "name": "badDepth",
      "msg": "Unknown depth"
    },
    {
      "code": 6015,
      "name": "badStake",
      "msg": "The stake must be positive"
    },
    {
      "code": 6016,
      "name": "badCode",
      "msg": "Party code must be 4 uppercase A-Z0-9 bytes"
    },
    {
      "code": 6017,
      "name": "alreadySettled",
      "msg": "Settlement has already happened"
    },
    {
      "code": 6018,
      "name": "badEscrowAuth",
      "msg": "Bad escrow authority for this action"
    },
    {
      "code": 6019,
      "name": "badVaultAuth",
      "msg": "The vault authority does not match"
    },
    {
      "code": 6020,
      "name": "badPda",
      "msg": "Account does not match its expected PDA"
    },
    {
      "code": 6021,
      "name": "badBankVote",
      "msg": "Bank vote must be climb or bank"
    },
    {
      "code": 6022,
      "name": "badParty",
      "msg": "A party needs at least two players"
    },
    {
      "code": 6023,
      "name": "badPayout",
      "msg": "Payout math failed a consistency check"
    }
  ],
  "types": [
    {
      "name": "chatMsg",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "author",
            "type": "u8"
          },
          {
            "name": "len",
            "type": "u8"
          },
          {
            "name": "body",
            "type": {
              "array": [
                "u8",
                28
              ]
            }
          }
        ]
      }
    },
    {
      "name": "clueSlot",
      "docs": [
        "The secret. One per seat, gated to exactly one member on the TEE.",
        "See docs/technical/ERD.md 2.2."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "run",
            "type": "pubkey"
          },
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "seat",
            "type": "u8"
          },
          {
            "name": "floor",
            "type": "u8"
          },
          {
            "name": "mask",
            "type": "u8"
          },
          {
            "name": "dealt",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "run",
      "docs": [
        "The shared board. Everything here is meant to be seen by everyone.",
        "Never put a secret in this account. See docs/technical/ERD.md 2.1."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "code",
            "type": {
              "array": [
                "u8",
                4
              ]
            }
          },
          {
            "name": "host",
            "type": "pubkey"
          },
          {
            "name": "players",
            "type": {
              "array": [
                "pubkey",
                4
              ]
            }
          },
          {
            "name": "playerCount",
            "type": "u8"
          },
          {
            "name": "botMask",
            "type": "u8"
          },
          {
            "name": "depth",
            "type": "u8"
          },
          {
            "name": "stake",
            "type": "u64"
          },
          {
            "name": "phase",
            "type": "u8"
          },
          {
            "name": "floor",
            "type": "u8"
          },
          {
            "name": "doors",
            "type": "u8"
          },
          {
            "name": "deadlineTs",
            "type": "i64"
          },
          {
            "name": "votes",
            "type": {
              "array": [
                "u8",
                4
              ]
            }
          },
          {
            "name": "marks",
            "type": {
              "array": [
                "u8",
                4
              ]
            }
          },
          {
            "name": "vrfNonce",
            "type": "u64"
          },
          {
            "name": "vrfState",
            "type": "u8"
          },
          {
            "name": "revealedDoor",
            "type": "u8"
          },
          {
            "name": "cleared",
            "type": "u8"
          },
          {
            "name": "outcome",
            "type": "u8"
          },
          {
            "name": "chatHead",
            "type": "u8"
          },
          {
            "name": "readyMask",
            "type": "u8"
          },
          {
            "name": "settled",
            "type": "bool"
          },
          {
            "name": "chat",
            "type": {
              "array": [
                {
                  "defined": {
                    "name": "chatMsg"
                  }
                },
                24
              ]
            }
          }
        ]
      }
    },
    {
      "name": "vault",
      "docs": [
        "The honesty receipt. See docs/technical/ERD.md 2.3."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "balance",
            "type": "u64"
          },
          {
            "name": "seeded",
            "type": "u64"
          },
          {
            "name": "totalFalls",
            "docs": [
              "Exact base-unit sum of every pot that fell (checked_add on each fall).",
              "One unit in equals one unit here, so",
              "`balance == seeded + total_falls - total_payouts` reconciles exactly."
            ],
            "type": "u64"
          },
          {
            "name": "totalPayouts",
            "docs": [
              "Exact base-unit sum of every payout beyond the pot (checked_add). The",
              "pot return to players is not counted; only the vault's contribution."
            ],
            "type": "u64"
          }
        ]
      }
    }
  ]
};
