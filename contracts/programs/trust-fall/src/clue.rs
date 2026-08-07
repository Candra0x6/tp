use crate::state::MAX_PLAYERS;

/// SplitMix64: a tiny, deterministic, well-mixed PRNG that needs no external
/// crate. Seeded from the 32 VRF bytes so the same bytes always deal the same
/// floor. This is the only randomness the game uses.
#[derive(Clone, Copy)]
pub struct SplitMix64(u64);

impl SplitMix64 {
    pub fn from_seed(seed: [u8; 32]) -> Self {
        // Fold the whole seed; splitmix's low bits are strong so feeding the
        // first u64 plus a few extra words avoids degenerate seeds.
        let mut acc: u64 = 0x9E3779B97F4A7C15;
        for chunk in seed.chunks(8) {
            let mut word = [0u8; 8];
            word[..chunk.len()].copy_from_slice(chunk);
            acc = acc.wrapping_mul(0xBF58476D1CE4E5B9).wrapping_add(u64::from_le_bytes(word));
        }
        Self(acc)
    }

    pub fn next_u64(&mut self) -> u64 {
        self.0 = self.0.wrapping_add(0x9E3779B97F4A7C15);
        let mut z = self.0;
        z = (z ^ (z >> 30)).wrapping_mul(0xBF58476D1CE4E5B9);
        z = (z ^ (z >> 27)).wrapping_mul(0x94D049BB133111EB);
        z ^ (z >> 31)
    }

    pub fn next_usize(&mut self) -> usize {
        self.next_u64() as usize
    }
}

/// The whole clue algorithm. See docs/technical/GAME-LOGIC.md section 3.
///
/// Input: N doors, P players, 32 VRF bytes r.
/// Output: the safe door, and one bitmask of eliminated doors per seat.
///
/// Properties (each a test in tests/clue.rs):
///  T truth:      clues[i] & (1 << safe) == 0 for all i
///  E exactness:  OR(clues) == all_doors \ {safe}
///  N necessity:  any P-1 clues leave at least two candidates
pub fn deal(n: u8, p: u8, r: &[u8; 32]) -> (u8, [u8; MAX_PLAYERS]) {
    let mut clues = [0u8; MAX_PLAYERS];
    if n == 0 || p == 0 {
        return (0, clues);
    }
    let n = n as usize;
    let p = p as usize;
    let safe = (r[0] % n as u8) as usize;

    let mut wrong: Vec<u8> = (0..n as u8).filter(|&d| d != safe as u8).collect();
    let mut prng = SplitMix64::from_seed(*r);
    // Fisher-Yates shuffle seeded from r, not from anything the host controls.
    for i in (1..wrong.len()).rev() {
        let j = prng.next_usize() % (i + 1);
        wrong.swap(i, j);
    }
    for (i, door) in wrong.into_iter().enumerate() {
        clues[i % p] |= 1u8 << door;
    }
    (safe as u8, clues)
}

/// The eliminated-union of every clue is all doors except the safe one (E).
/// Run never stores `safe`; it is recomputed from the union on resolve.
pub fn eliminated_union(clues: &[u8]) -> u8 {
    clues.iter().fold(0u8, |acc, c| acc | c)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn seed_is_deterministic() {
        let r = [7u8; 32];
        let (a, ca) = deal(5, 3, &r);
        let (b, cb) = deal(5, 3, &r);
        assert_eq!(a, b);
        assert_eq!(ca, cb);
    }

    #[test]
    fn seats_beyond_player_count_are_empty() {
        let r = [1u8; 32];
        let (_, clues) = deal(5, 2, &r);
        assert_eq!(clues[2], 0);
        assert_eq!(clues[3], 0);
    }

    fn seeded_r(k: u64) -> [u8; 32] {
        let mut r = [0u8; 32];
        r[..8].copy_from_slice(&k.to_le_bytes());
        r[8..16].copy_from_slice(&(k >> 32).to_le_bytes());
        r
    }

    /// T, truth: no clue ever eliminates the safe door.
    #[test]
    fn clue_truth() {
        for n in 2u8..=8 {
            for p in 2u8..=4 {
                if n < p + 1 {
                    continue;
                }
                for k in 0..1000u64 {
                    let (safe, clues) = deal(n, p, &seeded_r(k));
                    for clue in clues.iter().take(p as usize) {
                        assert_eq!(clue & (1u8 << safe), 0, "clue hits safe door");
                    }
                }
            }
        }
    }

    /// E, exactness: the union of all clues is exactly all doors minus safe.
    #[test]
    fn clue_exact() {
        for n in 2u8..=8 {
            for p in 2u8..=4 {
                if n < p + 1 {
                    continue;
                }
                for k in 0..1000u64 {
                    let (safe, clues) = deal(n, p, &seeded_r(k));
                    let all = if n == 8 { 0xFF } else { (1u8 << n) - 1 };
                    assert_eq!(
                        eliminated_union(&clues),
                        all & !(1u8 << safe),
                        "union is not exactly all-but-safe"
                    );
                }
            }
        }
    }

    /// N, necessity: any p-1 clues leave at least two candidates. This is the
    /// test that encodes the theme. If it fails, a player has become optional.
    #[test]
    fn clue_necessary() {
        for n in 2u8..=8 {
            for p in 2u8..=4 {
                if n < p + 1 {
                    continue;
                }
                for k in 0..1000u64 {
                    let (_, clues) = deal(n, p, &seeded_r(k));
                    for drop in 0..p as usize {
                        let mut union = 0u8;
                        for (i, clue) in clues.iter().take(p as usize).enumerate() {
                            if i == drop {
                                continue;
                            }
                            union |= clue;
                        }
                        let candidates = (0..n).filter(|d| union & (1 << d) == 0).count();
                        assert!(
                            candidates >= 2,
                            "removing one player leaves only {candidates} candidate(s)"
                        );
                    }
                }
            }
        }
    }
}
