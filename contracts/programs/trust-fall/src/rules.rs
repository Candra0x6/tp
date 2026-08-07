use crate::state::MAX_PLAYERS;

/// Votes are door index + 1, zero means no vote. See docs/technical/GAME-LOGIC.md 5.
pub fn needed_for(players: u8) -> u8 {
    players / 2 + 1
}

/// Resolve a floor the moment `needed` players agree on one door.
/// Votes are door + 1. Returns Some(door) or None.
pub fn majority_door(votes: &[u8; MAX_PLAYERS], players: u8, needed: u8) -> Option<u8> {
    for door in 0u8..=8 {
        let count = votes
            .iter()
            .take(players as usize)
            .filter(|&&v| v == door + 1)
            .count() as u8;
        if count >= needed {
            return Some(door);
        }
    }
    None
}

/// On deadline with no majority: plurality wins, ties take the lowest door
/// index, and a floor nobody voted on returns None (the fall).
pub fn forced_door(votes: &[u8; MAX_PLAYERS], players: u8) -> Option<u8> {
    let mut best: Option<(u8, u8)> = None; // (door, count)
    for door in 0u8..=8 {
        let count = votes
            .iter()
            .take(players as usize)
            .filter(|&&v| v == door + 1)
            .count() as u8;
        if count == 0 {
            continue;
        }
        match best {
            None => best = Some((door, count)),
            Some((_, best_count)) if count > best_count => best = Some((door, count)),
            Some(_) => {}
        }
    }
    best.map(|(door, _)| door)
}

/// Bank vote: votes hold BANK_NO_VOTE / BANK_CLIMB / BANK_BANK while the floor
/// is resolved and the party argues about cashing out. Same threshold.
pub fn bank_decision(votes: &[u8; MAX_PLAYERS], players: u8, needed: u8) -> Option<bool> {
    let climbs = votes
        .iter()
        .take(players as usize)
        .filter(|&&v| v == crate::state::BANK_CLIMB)
        .count() as u8;
    let banks = votes
        .iter()
        .take(players as usize)
        .filter(|&&v| v == crate::state::BANK_BANK)
        .count() as u8;
    if banks >= needed {
        Some(false) // bank
    } else if climbs >= needed {
        Some(true) // climb
    } else {
        None
    }
}

/// Charset is a program trust boundary, not a UI rule. Allowed: A-Z, 0-9,
/// space, and `. , ? ! -`. Lowercase is rejected rather than folded.
pub fn valid_chat(body: &[u8], len: u8) -> bool {
    let len = len as usize;
    if len > body.len() {
        return false;
    }
    for &b in &body[..len] {
        let ok = (b'A'..=b'Z').contains(&b)
            || (b'0'..=b'9').contains(&b)
            || b == b' '
            || b == b'.'
            || b == b','
            || b == b'?'
            || b == b'!'
            || b == b'-';
        if !ok {
            return false;
        }
    }
    true
}

/// Multipliers as basis points so the math is integer and exact.
/// cleared: 1 -> 13000, 2 -> 18000, ... 5 -> 60000. Index 0 is unused.
pub const MULTIPLIER_BPS: [u64; 6] = [0, 13000, 18000, 26000, 38000, 60000];

pub fn multiplier_bps(cleared: u8) -> u64 {
    let idx = (cleared as usize).min(5);
    MULTIPLIER_BPS[idx]
}

/// payout = min(pot * M[cleared], pot + vault.balance).
/// The clamp is inside the program: never offer what the vault cannot pay.
pub fn payout_amount(pot: u64, vault: u64, cleared: u8) -> u64 {
    let scaled = pot
        .checked_mul(multiplier_bps(cleared))
        .unwrap_or(u64::MAX)
        / 10_000;
    scaled.min(pot.saturating_add(vault))
}

/// Equal split always. No per-player weighting: weighting by whose clue
/// mattered would teach players to withhold information.
pub fn split_amount(payout: u64, players: u8) -> u64 {
    if players == 0 {
        0
    } else {
        payout / players as u64
    }
}
