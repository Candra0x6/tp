use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use ephemeral_rollups_sdk::anchor::commit;
use ephemeral_rollups_sdk::ephem::{FoldableIntentBuilder, MagicIntentBundleBuilder};

use crate::errors::ErrorCode;
use crate::rules;
use crate::state::*;

/// Record a climb or bank vote while the cleared floor is open for the bank
/// argument. A majority resolves immediately, exactly like a door vote.
pub fn bank_vote(ctx: Context<BankVote>, code: [u8; 4], choice: u8) -> Result<()> {
    let run = &mut ctx.accounts.run;
    require!(run.phase == PHASE_BANK, ErrorCode::WrongPhase);
    require!(
        choice == BANK_CLIMB || choice == BANK_BANK,
        ErrorCode::BadBankVote
    );
    let seat = run
        .seat_of(&ctx.accounts.player.key())
        .ok_or(ErrorCode::NotMember)?;
    run.votes[seat] = choice;
    let needed = rules::needed_for(run.player_count);
    match rules::bank_decision(&run.votes, run.player_count, needed) {
        Some(climb) => resolve_bank(run, climb),
        None => Ok(()),
    }
}

/// Close the bank vote by majority, or by the deadline's default of climb when
/// the party could not reach a decision in time.
pub fn bank_resolve(ctx: Context<BankResolve>, code: [u8; 4]) -> Result<()> {
    let run = &mut ctx.accounts.run;
    require!(run.phase == PHASE_BANK, ErrorCode::WrongPhase);
    let needed = rules::needed_for(run.player_count);
    match rules::bank_decision(&run.votes, run.player_count, needed) {
        Some(climb) => resolve_bank(run, climb),
        None => {
            let now = Clock::get()?.unix_timestamp;
            require!(now >= run.deadline_ts, ErrorCode::NotResolvable);
            resolve_bank(run, true)
        }
    }
}

fn resolve_bank(run: &mut Run, climb: bool) -> Result<()> {
    run.votes = [0; MAX_PLAYERS];
    if climb {
        run.floor += 1;
        run.doors = doors_for(run.depth, run.floor, run.player_count);
        run.revealed_door = DOOR_UNREVEALED;
        run.vrf_state = VRF_IDLE;
        run.phase = PHASE_DEALING;
    } else {
        run.outcome = OUTCOME_BANKED;
        run.phase = PHASE_DONE;
    }
    Ok(())
}

/// Durability checkpoint: after a cleared floor, commit the Run and every
/// ClueSlot back to base so a validator crash loses at most the current floor.
/// The accounts stay delegated; the next bank vote continues on the ER.
pub fn commit_floor(ctx: Context<CommitFloor>, code: [u8; 4]) -> Result<()> {
    let run = &ctx.accounts.run;
    require!(run.phase == PHASE_BANK, ErrorCode::WrongPhase);
    require!(!run.settled, ErrorCode::AlreadySettled);

    let accounts = vec![
        ctx.accounts.run.to_account_info(),
        ctx.accounts.slot0.to_account_info(),
        ctx.accounts.slot1.to_account_info(),
        ctx.accounts.slot2.to_account_info(),
        ctx.accounts.slot3.to_account_info(),
    ];
    MagicIntentBundleBuilder::new(
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.magic_context.to_account_info(),
        ctx.accounts.magic_program.to_account_info(),
    )
    .commit(&accounts)
    .build_and_invoke()?;
    Ok(())
}

/// Terminal commit: on a done run (fell, banked, or cleared), commit the Run
/// and every ClueSlot and undelegate them. The payout is not atomic with this
/// commit; the client observes the commitment and then calls `settle` on base.
pub fn final_settle(ctx: Context<FinalSettle>, code: [u8; 4]) -> Result<()> {
    let run = &ctx.accounts.run;
    require!(run.phase == PHASE_DONE, ErrorCode::WrongPhase);
    require!(!run.settled, ErrorCode::AlreadySettled);

    let accounts = vec![
        ctx.accounts.run.to_account_info(),
        ctx.accounts.slot0.to_account_info(),
        ctx.accounts.slot1.to_account_info(),
        ctx.accounts.slot2.to_account_info(),
        ctx.accounts.slot3.to_account_info(),
    ];
    MagicIntentBundleBuilder::new(
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.magic_context.to_account_info(),
        ctx.accounts.magic_program.to_account_info(),
    )
    .commit_and_undelegate(&accounts)
    .build_and_invoke()?;
    Ok(())
}

/// The payout, on base, after `final_settle` has returned the Run to the base
/// layer. One SPL transfer per player from the run-owned escrow (the pot back),
/// plus, when payout exceeds the pot, the difference from the vault token
/// account split equally. Idempotent via `Run.settled`.
pub fn settle<'a>(ctx: Context<'a, Settle<'a>>, code: [u8; 4]) -> Result<()> {
    {
        let run = &ctx.accounts.run;
        require!(run.phase == PHASE_DONE, ErrorCode::WrongPhase);
        require!(!run.settled, ErrorCode::AlreadySettled);
    }
    let players = ctx.accounts.run.player_count;
    require!(
        (players as usize) >= 2 && (players as usize) <= MAX_PLAYERS,
        ErrorCode::BadParty
    );
    let players_arr = ctx.accounts.run.players;
    let bump = ctx.accounts.run.bump;
    let cleared = ctx.accounts.run.cleared;
    let outcome = ctx.accounts.run.outcome;
    let pot = ctx.accounts.run.pot();

    // Player ATAs arrive in ctx.remaining_accounts, in seat order. There must
    // be one per player, owned by that player, on the escrow's mint.
    let mut ats: Vec<AccountInfo> = Vec::with_capacity(players as usize);
    for (seat, info) in ctx.remaining_accounts.iter().enumerate() {
        if seat >= players as usize {
            break;
        }
        let ata: Account<TokenAccount> = Account::try_from(info)?;
        require!(ata.owner == players_arr[seat], ErrorCode::BadPda);
        require!(ata.mint == ctx.accounts.escrow.mint, ErrorCode::BadPda);
        ats.push(info.clone());
    }
    require!(ats.len() == players as usize, ErrorCode::BadPda);

    let run_seeds: &[&[u8]] = &[b"run", code.as_ref(), &[bump]];

    match outcome {
        OUTCOME_FELL => {
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.key(),
                    Transfer {
                        from: ctx.accounts.escrow.to_account_info(),
                        to: ctx.accounts.vault_ata.to_account_info(),
                        authority: ctx.accounts.run.to_account_info(),
                    },
                    &[run_seeds],
                ),
                pot,
            )?;
            let vault = &mut ctx.accounts.vault;
            vault.balance = vault.balance.checked_add(pot).unwrap();
            vault.total_falls = vault.total_falls.checked_add(pot).unwrap();
        }
        OUTCOME_BANKED | OUTCOME_CLEARED => {
            let payout = rules::payout_amount(pot, ctx.accounts.vault.balance, cleared);
            require!(payout >= pot, ErrorCode::BadPayout);

            let stake_each = pot / players as u64;
            for ata in &ats {
                token::transfer(
                    CpiContext::new_with_signer(
                        ctx.accounts.token_program.key(),
                        Transfer {
                            from: ctx.accounts.escrow.to_account_info(),
                            to: ata.to_account_info(),
                            authority: ctx.accounts.run.to_account_info(),
                        },
                        &[run_seeds],
                    ),
                    stake_each,
                )?;
            }

            let extra = payout - pot;
            if extra > 0 {
                let extra_each = extra / players as u64;
                if extra_each > 0 {
                    let vault_seeds: &[&[u8]] = &[
                        b"vault",
                        ctx.accounts.vault.mint.as_ref(),
                        &[ctx.accounts.vault.bump],
                    ];
                    for ata in &ats {
                        token::transfer(
                            CpiContext::new_with_signer(
                                ctx.accounts.token_program.key(),
                                Transfer {
                                    from: ctx.accounts.vault_ata.to_account_info(),
                                    to: ata.to_account_info(),
                                    authority: ctx.accounts.vault.to_account_info(),
                                },
                                &[vault_seeds],
                            ),
                            extra_each,
                        )?;
                    }
                    let paid = extra_each.checked_mul(players as u64).unwrap();
                    let vault = &mut ctx.accounts.vault;
                    vault.balance = vault.balance.checked_sub(paid).unwrap();
                    vault.total_payouts = vault.total_payouts.checked_add(paid).unwrap();
                }
            }
        }
        _ => return Err(ErrorCode::WrongPhase.into()),
    }

    ctx.accounts.run.settled = true;
    Ok(())
}

#[derive(Accounts)]
#[instruction(code: [u8; 4])]
pub struct BankVote<'info> {
    pub player: Signer<'info>,
    #[account(mut, seeds = [b"run", code.as_ref()], bump)]
    pub run: Account<'info, Run>,
}

#[derive(Accounts)]
#[instruction(code: [u8; 4])]
pub struct BankResolve<'info> {
    #[account(mut, seeds = [b"run", code.as_ref()], bump)]
    pub run: Account<'info, Run>,
}

#[commit]
#[derive(Accounts)]
#[instruction(code: [u8; 4])]
pub struct CommitFloor<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut, seeds = [b"run", code.as_ref()], bump)]
    pub run: Account<'info, Run>,
    #[account(mut, seeds = [b"clue", run.key().as_ref(), &[0]], bump)]
    pub slot0: Account<'info, ClueSlot>,
    #[account(mut, seeds = [b"clue", run.key().as_ref(), &[1]], bump)]
    pub slot1: Account<'info, ClueSlot>,
    #[account(mut, seeds = [b"clue", run.key().as_ref(), &[2]], bump)]
    pub slot2: Account<'info, ClueSlot>,
    #[account(mut, seeds = [b"clue", run.key().as_ref(), &[3]], bump)]
    pub slot3: Account<'info, ClueSlot>,
}

#[commit]
#[derive(Accounts)]
#[instruction(code: [u8; 4])]
pub struct FinalSettle<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut, seeds = [b"run", code.as_ref()], bump)]
    pub run: Account<'info, Run>,
    #[account(mut, seeds = [b"clue", run.key().as_ref(), &[0]], bump)]
    pub slot0: Account<'info, ClueSlot>,
    #[account(mut, seeds = [b"clue", run.key().as_ref(), &[1]], bump)]
    pub slot1: Account<'info, ClueSlot>,
    #[account(mut, seeds = [b"clue", run.key().as_ref(), &[2]], bump)]
    pub slot2: Account<'info, ClueSlot>,
    #[account(mut, seeds = [b"clue", run.key().as_ref(), &[3]], bump)]
    pub slot3: Account<'info, ClueSlot>,
}

#[derive(Accounts)]
#[instruction(code: [u8; 4])]
pub struct Settle<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"run", code.as_ref()],
        bump,
        constraint = run.phase == PHASE_DONE
    )]
    pub run: Account<'info, Run>,
    #[account(
        mut,
        seeds = [b"escrow", run.key().as_ref()],
        bump,
        constraint = escrow.owner == run.key(),
        constraint = escrow.mint == mint.key()
    )]
    pub escrow: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    #[account(
        mut,
        seeds = [b"vault", mint.key().as_ref()],
        bump,
        constraint = vault.mint == mint.key()
    )]
    pub vault: Account<'info, Vault>,
    #[account(
        mut,
        constraint = vault_ata.owner == vault.key(),
        constraint = vault_ata.mint == mint.key()
    )]
    pub vault_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}
