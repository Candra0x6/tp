use anchor_lang::prelude::*;

pub const MAX_PLAYERS: usize = 4;
pub const CHAT_CAPACITY: usize = 24;
pub const CHAT_BODY: usize = 28;

// Run.phase
pub const PHASE_LOBBY: u8 = 0;
pub const PHASE_DEALING: u8 = 1;
pub const PHASE_FLOOR: u8 = 2;
pub const PHASE_BANK: u8 = 3;
pub const PHASE_DONE: u8 = 4;

// Run.vrf_state
pub const VRF_IDLE: u8 = 0;
pub const VRF_REQUESTED: u8 = 1;
pub const VRF_DEALT: u8 = 2;

// Run.outcome
pub const OUTCOME_RUNNING: u8 = 0;
pub const OUTCOME_BANKED: u8 = 1;
pub const OUTCOME_CLEARED: u8 = 2;
pub const OUTCOME_FELL: u8 = 3;

// Run.depth
pub const DEPTH_QUICK: u8 = 0;
pub const DEPTH_DEEP: u8 = 1;

// Run.revealed_door, no door revealed yet
pub const DOOR_UNREVEALED: u8 = 0xFF;

// Bank vote values written into Run.votes while in PHASE_BANK.
pub const BANK_NO_VOTE: u8 = 0;
pub const BANK_CLIMB: u8 = 1;
pub const BANK_BANK: u8 = 2;

pub const BANK_WINDOW_SECONDS: i64 = 20;

pub const QUICK_FLOORS: usize = 3;
pub const DEEP_FLOORS: usize = 5;

// Base doors before party widening, per depth and floor index.
pub const QUICK_DOORS: [u8; QUICK_FLOORS] = [4, 4, 5];
pub const DEEP_DOORS: [u8; DEEP_FLOORS] = [4, 4, 5, 5, 6];

// Floor timer seconds per depth and floor index.
pub const QUICK_SECONDS: [i64; QUICK_FLOORS] = [60, 60, 45];
pub const DEEP_SECONDS: [i64; DEEP_FLOORS] = [60, 60, 45, 45, 30];

/// N = max(base_doors[depth][floor], party_size + 1).
/// The widening rule is what keeps property N (necessity) provable.
pub fn doors_for(depth: u8, floor: u8, players: u8) -> u8 {
    let base = match depth {
        DEPTH_DEEP => {
            if (floor as usize) < DEEP_FLOORS {
                DEEP_DOORS[floor as usize]
            } else {
                DEEP_DOORS[DEEP_FLOORS - 1]
            }
        }
        _ => {
            if (floor as usize) < QUICK_FLOORS {
                QUICK_DOORS[floor as usize]
            } else {
                QUICK_DOORS[QUICK_FLOORS - 1]
            }
        }
    };
    base.max(players.saturating_add(1))
}

pub fn floors_for(depth: u8) -> u8 {
    match depth {
        DEPTH_DEEP => DEEP_FLOORS as u8,
        _ => QUICK_FLOORS as u8,
    }
}

pub fn floor_seconds(depth: u8, floor: u8) -> i64 {
    match depth {
        DEPTH_DEEP => {
            if (floor as usize) < DEEP_FLOORS {
                DEEP_SECONDS[floor as usize]
            } else {
                DEEP_SECONDS[DEEP_FLOORS - 1]
            }
        }
        _ => {
            if (floor as usize) < QUICK_FLOORS {
                QUICK_SECONDS[floor as usize]
            } else {
                QUICK_SECONDS[QUICK_FLOORS - 1]
            }
        }
    }
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize, Default)]
pub struct ChatMsg {
    pub author: u8,
    pub len: u8,
    pub body: [u8; CHAT_BODY],
}

/// The shared board. Everything here is meant to be seen by everyone.
/// Never put a secret in this account. See docs/technical/ERD.md 2.1.
#[account]
pub struct Run {
    pub bump: u8,
    pub code: [u8; 4],
    pub host: Pubkey,
    pub players: [Pubkey; MAX_PLAYERS],
    pub player_count: u8,
    pub bot_mask: u8,
    pub depth: u8,
    pub stake: u64,
    pub phase: u8,
    pub floor: u8,
    pub doors: u8,
    pub deadline_ts: i64,
    pub votes: [u8; MAX_PLAYERS],
    pub marks: [u8; MAX_PLAYERS],
    pub vrf_nonce: u64,
    pub vrf_state: u8,
    pub revealed_door: u8,
    pub cleared: u8,
    pub outcome: u8,
    pub chat_head: u8,
    pub ready_mask: u8,
    pub settled: bool,
    pub chat: [ChatMsg; CHAT_CAPACITY],
}

impl Run {
    pub fn seat_of(&self, key: &Pubkey) -> Option<usize> {
        for (i, p) in self.players.iter().enumerate() {
            if i >= self.player_count as usize {
                break;
            }
            if p == key {
                return Some(i);
            }
        }
        None
    }

    pub fn is_member(&self, key: &Pubkey) -> bool {
        self.seat_of(key).is_some()
    }

    pub fn safe_door(&self, eliminated: u8) -> u8 {
        let all = (1u8 << self.doors) - 1;
        let safe = (!eliminated) & all;
        // Property E: exactly one bit survives the union of all clues.
        safe.trailing_zeros() as u8
    }

    pub fn pot(&self) -> u64 {
        self.stake.saturating_mul(self.player_count as u64)
    }
}

/// The secret. One per seat, gated to exactly one member on the TEE.
/// See docs/technical/ERD.md 2.2.
#[account]
pub struct ClueSlot {
    pub bump: u8,
    pub run: Pubkey,
    pub player: Pubkey,
    pub seat: u8,
    pub floor: u8,
    pub mask: u8,
    pub dealt: bool,
}

/// The honesty receipt. See docs/technical/ERD.md 2.3.
#[account]
pub struct Vault {
    pub bump: u8,
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub balance: u64,
    pub seeded: u64,
    /// Exact base-unit sum of every pot that fell (checked_add on each fall).
    /// One unit in equals one unit here, so
    /// `balance == seeded + total_falls - total_payouts` reconciles exactly.
    pub total_falls: u64,
    /// Exact base-unit sum of every payout beyond the pot (checked_add). The
    /// pot return to players is not counted; only the vault's contribution.
    pub total_payouts: u64,
}

// Exact serialized sizes (8-byte Anchor discriminator included).
// docs/technical/ERD.md 2.1 totals 936; ready_mask and settled add two bytes.
pub const RUN_SIZE: usize = 938;
pub const CLUE_SLOT_SIZE: usize = 77;
pub const VAULT_SIZE: usize = 105;
