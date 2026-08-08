use anchor_lang::prelude::*;

use crate::errors::ErrorCode;
use crate::rules;
use crate::state::*;

/// Read the fresh clue-slot masks for the current floor and fold them into the
/// eliminated-union. The safe door is never stored; it is the complement.
pub fn collect_eliminated(run_key: &Pubkey, remaining: &[AccountInfo]) -> Result<u8> {
    let mut eliminated: u8 = 0;
    for (i, info) in remaining.iter().enumerate() {
        if i >= MAX_PLAYERS {
            break;
        }
        let (expected, _) =
            Pubkey::find_program_address(&[b"clue", run_key.as_ref(), &[i as u8]], &crate::ID);
        require_keys_eq!(info.key(), expected, ErrorCode::BadPda);
        let data = info.try_borrow_data()?;
        let mut cursor = &data[..];
        let slot = ClueSlot::try_deserialize(&mut cursor)?;
        eliminated |= slot.mask;
    }
    Ok(eliminated)
}

pub fn vote(ctx: Context<Vote>, code: [u8; 4], door: u8) -> Result<()> {
    let run = &mut ctx.accounts.run;
    require!(run.phase == PHASE_FLOOR, ErrorCode::WrongPhase);
    let seat = run
        .seat_of(&ctx.accounts.player.key())
        .ok_or(ErrorCode::NotMember)?;
    require!((door as usize) < run.doors as usize, ErrorCode::BadDoor);
    run.votes[seat] = door + 1;

    let needed = rules::needed_for(run.player_count);
    if let Some(resolved) = rules::majority_door(&run.votes, run.player_count, needed) {
        let eliminated = collect_eliminated(&run.key(), &ctx.remaining_accounts)?;
        finalize_floor(run, eliminated, Some(resolved))?;
    }
    Ok(())
}

pub fn mark(ctx: Context<Mark>, code: [u8; 4], door: u8, set: bool) -> Result<()> {
    let run = &mut ctx.accounts.run;
    require!(run.phase == PHASE_FLOOR, ErrorCode::WrongPhase);
    let seat = run
        .seat_of(&ctx.accounts.player.key())
        .ok_or(ErrorCode::NotMember)?;
    require!((door as usize) < run.doors as usize, ErrorCode::BadDoor);
    if set {
        run.marks[seat] |= 1u8 << door;
    } else {
        run.marks[seat] &= !(1u8 << door);
    }
    Ok(())
}

pub fn chat(ctx: Context<Chat>, code: [u8; 4], body: [u8; CHAT_BODY], len: u8) -> Result<()> {
    let run = &mut ctx.accounts.run;
    require!(run.phase != PHASE_DONE, ErrorCode::WrongPhase);
    let seat = run
        .seat_of(&ctx.accounts.player.key())
        .ok_or(ErrorCode::NotMember)?;
    require!((len as usize) <= CHAT_BODY, ErrorCode::ChatTooLong);
    require!(rules::valid_chat(&body, len), ErrorCode::ChatBadByte);

    let idx = run.chat_head as usize % CHAT_CAPACITY;
    run.chat[idx] = ChatMsg {
        author: seat as u8,
        len,
        body,
    };
    run.chat_head = (run.chat_head + 1) % CHAT_CAPACITY as u8;
    Ok(())
}

/// Close the vote by majority if it exists now, or by the deadline's forced
/// rules if the timer has run out. Errors if neither applies.
pub fn resolve(ctx: Context<Resolve>, code: [u8; 4]) -> Result<()> {
    let run = &mut ctx.accounts.run;
    require!(run.phase == PHASE_FLOOR, ErrorCode::WrongPhase);
    let needed = rules::needed_for(run.player_count);
    let eliminated = collect_eliminated(&run.key(), &ctx.remaining_accounts)?;
    if let Some(door) = rules::majority_door(&run.votes, run.player_count, needed) {
        finalize_floor(run, eliminated, Some(door))?;
        return Ok(());
    }
    let now = Clock::get()?.unix_timestamp;
    if now >= run.deadline_ts {
        let forced = rules::forced_door(&run.votes, run.player_count);
        finalize_floor(run, eliminated, forced)?;
        return Ok(());
    }
    Err(ErrorCode::NotResolvable.into())
}

/// The bot path: any client may call this once the deadline has passed, and the
/// clock is checked here, not on the host. Ties take the lowest door, a floor
/// nobody voted on falls.
pub fn resolve_expired(ctx: Context<Resolve>, code: [u8; 4]) -> Result<()> {
    let run = &mut ctx.accounts.run;
    require!(run.phase == PHASE_FLOOR, ErrorCode::WrongPhase);
    let now = Clock::get()?.unix_timestamp;
    require!(now >= run.deadline_ts, ErrorCode::FloorOpen);
    let forced = rules::forced_door(&run.votes, run.player_count);
    let eliminated = collect_eliminated(&run.key(), &ctx.remaining_accounts)?;
    finalize_floor(run, eliminated, forced)?;
    Ok(())
}

/// Shared outcome math. `resolved` is None on a silent floor, which is a fall.
/// A correct door clears the floor; a wrong one is the fall. The cleared floor
/// opens the bank vote, and the final clear auto-banks.
pub fn finalize_floor(run: &mut Run, eliminated: u8, resolved: Option<u8>) -> Result<()> {
    let safe = run.safe_door(eliminated);
    let correct = resolved.map(|d| d == safe).unwrap_or(false);
    run.votes = [0; MAX_PLAYERS];
    run.marks = [0; MAX_PLAYERS];

    if correct {
        run.revealed_door = resolved.unwrap();
        run.cleared += 1;
        if run.cleared as usize >= floors_for(run.depth) as usize {
            run.outcome = OUTCOME_CLEARED;
            run.phase = PHASE_DONE;
        } else {
            run.outcome = OUTCOME_RUNNING;
            run.phase = PHASE_BANK;
            run.deadline_ts = Clock::get()?.unix_timestamp + BANK_WINDOW_SECONDS;
        }
    } else {
        run.revealed_door = resolved.unwrap_or(DOOR_UNREVEALED);
        run.outcome = OUTCOME_FELL;
        run.phase = PHASE_DONE;
    }
    Ok(())
}

#[derive(Accounts)]
#[instruction(code: [u8; 4])]
pub struct Vote<'info> {
    pub player: Signer<'info>,
    #[account(mut, seeds = [b"run", code.as_ref()], bump)]
    pub run: Box<Account<'info, Run>>,
}

#[derive(Accounts)]
#[instruction(code: [u8; 4])]
pub struct Mark<'info> {
    pub player: Signer<'info>,
    #[account(mut, seeds = [b"run", code.as_ref()], bump)]
    pub run: Box<Account<'info, Run>>,
}

#[derive(Accounts)]
#[instruction(code: [u8; 4])]
pub struct Chat<'info> {
    pub player: Signer<'info>,
    #[account(mut, seeds = [b"run", code.as_ref()], bump)]
    pub run: Box<Account<'info, Run>>,
}

#[derive(Accounts)]
#[instruction(code: [u8; 4])]
pub struct Resolve<'info> {
    #[account(mut, seeds = [b"run", code.as_ref()], bump)]
    pub run: Box<Account<'info, Run>>,
}
