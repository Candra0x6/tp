use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::{vrf, vrf_callback};
use ephemeral_rollups_sdk::vrf::{
    self,
    instructions::{create_request_scoped_randomness_ix, RequestRandomnessParams},
    types::SerializableAccountMeta,
};

use crate::errors::ErrorCode;
use crate::state::*;

/// First 8 bytes of sha256("global:callback_deal"). Must stay in lockstep with
/// the callback_deal handler name, which Anchor dispatches on this value.
pub const CALLBACK_DEAL_DISCRIMINATOR: [u8; 8] = [180, 17, 166, 178, 30, 59, 141, 223];

pub fn request_deal(ctx: Context<RequestDeal>, code: [u8; 4]) -> Result<()> {
    let payer_key = ctx.accounts.payer.key();
    let queue_key = ctx.accounts.oracle_queue.key();

    let ix = {
        let run = &mut ctx.accounts.run;
        require!(run.phase == PHASE_DEALING, ErrorCode::WrongPhase);
        require!(run.vrf_state == VRF_IDLE, ErrorCode::VrfBusy);

        let run_key = run.key();
        let mut accounts_metas = vec![SerializableAccountMeta {
            pubkey: run_key,
            is_signer: false,
            is_writable: true,
        }];
        for seat in 0..run.player_count {
            let (slot_key, _) =
                Pubkey::find_program_address(&[b"clue", run_key.as_ref(), &[seat]], &crate::ID);
            accounts_metas.push(SerializableAccountMeta {
                pubkey: slot_key,
                is_signer: false,
                is_writable: true,
            });
        }

        let mut caller_seed = [0u8; 32];
        caller_seed[..4].copy_from_slice(&code);
        caller_seed[4] = run.floor;
        caller_seed[5..13].copy_from_slice(&run.vrf_nonce.to_le_bytes());

        create_request_scoped_randomness_ix(RequestRandomnessParams {
            payer: payer_key,
            oracle_queue: queue_key,
            callback_program_id: crate::ID,
            callback_discriminator: CALLBACK_DEAL_DISCRIMINATOR.to_vec(),
            caller_seed,
            accounts_metas: Some(accounts_metas),
            callback_args: Some(code.to_vec()),
        })
    };

    ctx.accounts
        .invoke_signed_vrf(&ctx.accounts.payer.to_account_info(), &ix)?;
    ctx.accounts.run.vrf_state = VRF_REQUESTED;
    Ok(())
}

/// The VRF callback writes every ClueSlot.mask. The safe door is never stored;
/// it is recomputed from the union of masks when the floor resolves. The clue
/// slots arrive in ctx.remaining_accounts: the callback's declared accounts are
/// the injected scoped identity plus the run, so the slots land after them.
pub fn callback_deal(
    ctx: Context<CallbackDeal>,
    randomness: [u8; 32],
    code: [u8; 4],
) -> Result<()> {
    let run = &mut ctx.accounts.run;
    // Idempotency: a duplicate callback must not re-deal an advanced floor.
    require!(run.vrf_state == VRF_REQUESTED, ErrorCode::VrfIdle);
    require!(run.phase == PHASE_DEALING, ErrorCode::WrongPhase);
    require!(run.code == code, ErrorCode::BadCode);

    let n = run.doors;
    let p = run.player_count;
    let (_safe, clues) = crate::clue::deal(n, p, &randomness);

    let run_key = run.key();
    for (i, slot_info) in ctx.remaining_accounts.iter().enumerate() {
        if i >= p as usize {
            break;
        }
        let (expected, bump) =
            Pubkey::find_program_address(&[b"clue", run_key.as_ref(), &[i as u8]], &crate::ID);
        require_keys_eq!(slot_info.key(), expected, ErrorCode::BadPda);
        // The slots arrive raw from the delegate instruction, which creates
        // them as UncheckedAccount (no discriminator written). Write the
        // discriminator plus serialized data here, where the full struct
        // (player included) is known for the first time.
        let slot = ClueSlot {
            bump,
            run: run_key,
            player: run.players[i],
            seat: i as u8,
            floor: run.floor,
            mask: clues[i],
            dealt: true,
        };
        let mut data = slot_info.try_borrow_mut_data()?;
        data[..8].copy_from_slice(ClueSlot::DISCRIMINATOR);
        let mut w: &mut [u8] = &mut data[8..];
        slot.serialize(&mut w)?;
    }

    run.vrf_state = VRF_DEALT;
    run.vrf_nonce = run.vrf_nonce.wrapping_add(1);
    run.phase = PHASE_FLOOR;
    run.deadline_ts = Clock::get()?.unix_timestamp + floor_seconds(run.depth, run.floor);
    Ok(())
}

#[vrf]
#[derive(Accounts)]
#[instruction(code: [u8; 4])]
pub struct RequestDeal<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut, seeds = [b"run", code.as_ref()], bump)]
    pub run: Box<Account<'info, Run>>,
    /// CHECK: the oracle queue. The queue that answers today is not guaranteed
    /// to answer on Sunday, so accept the delegated queues and their bases.
    #[account(
        mut,
        constraint = oracle_queue.key() == vrf::consts::DEFAULT_EPHEMERAL_QUEUE
            || oracle_queue.key() == vrf::consts::DEFAULT_EPHEMERAL_TEST_QUEUE
            || oracle_queue.key() == vrf::consts::DEFAULT_QUEUE
            || oracle_queue.key() == vrf::consts::DEFAULT_TEST_QUEUE
    )]
    pub oracle_queue: UncheckedAccount<'info>,
}

#[vrf_callback]
#[derive(Accounts)]
#[instruction(randomness: [u8; 32], code: [u8; 4])]
pub struct CallbackDeal<'info> {
    #[account(mut, seeds = [b"run", code.as_ref()], bump)]
    pub run: Box<Account<'info, Run>>,
}
