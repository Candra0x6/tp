use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::delegate;
use ephemeral_rollups_sdk::cpi::DelegateConfig;

use crate::state::*;

/// Base layer: create the four ClueSlot accounts (empty, content arrives via
/// the VRF callback on the ER) and delegate the Run plus every ClueSlot to the
/// validator serving this party's ER. The validator pubkey is supplied by the
/// client from the router's getDelegationStatus, never hardcoded.
pub fn delegate(ctx: Context<Delegate>, code: [u8; 4], validator: Option<Pubkey>) -> Result<()> {
    let run_key = ctx.accounts.run.key();
    ctx.accounts.delegate_run(
        &ctx.accounts.host,
        &[b"run", code.as_ref()],
        DelegateConfig {
            validator,
            ..Default::default()
        },
    )?;
    ctx.accounts.delegate_slot0(
        &ctx.accounts.host,
        &[b"clue", run_key.as_ref(), &[0]],
        DelegateConfig {
            validator,
            ..Default::default()
        },
    )?;
    ctx.accounts.delegate_slot1(
        &ctx.accounts.host,
        &[b"clue", run_key.as_ref(), &[1]],
        DelegateConfig {
            validator,
            ..Default::default()
        },
    )?;
    ctx.accounts.delegate_slot2(
        &ctx.accounts.host,
        &[b"clue", run_key.as_ref(), &[2]],
        DelegateConfig {
            validator,
            ..Default::default()
        },
    )?;
    ctx.accounts.delegate_slot3(
        &ctx.accounts.host,
        &[b"clue", run_key.as_ref(), &[3]],
        DelegateConfig {
            validator,
            ..Default::default()
        },
    )?;
    Ok(())
}

#[delegate]
#[derive(Accounts)]
#[instruction(code: [u8; 4])]
pub struct Delegate<'info> {
    #[account(mut)]
    pub host: Signer<'info>,
    /// CHECK: delegated to the ER, so the Anchor type check cannot run. The
    /// program enforces the `["run", code]` seeds; ownership is re-established
    /// on the ER where this account is read through the delegation.
    #[account(mut, del, seeds = [b"run", code.as_ref()], bump)]
    pub run: UncheckedAccount<'info>,
    /// CHECK: pre-funded for rent, delegated, content arrives from the VRF
    /// callback on the ER. Seeded `["clue", run, 0]`; never validated by type
    /// because delegation transfers ownership to the delegation program.
    #[account(
        init,
        payer = host,
        space = CLUE_SLOT_SIZE,
        seeds = [b"clue", run.key().as_ref(), &[0]],
        bump,
        del
    )]
    pub slot0: UncheckedAccount<'info>,
    /// CHECK: same rationale as slot0, seat 1.
    #[account(
        init,
        payer = host,
        space = CLUE_SLOT_SIZE,
        seeds = [b"clue", run.key().as_ref(), &[1]],
        bump,
        del
    )]
    pub slot1: UncheckedAccount<'info>,
    /// CHECK: same rationale as slot0, seat 2.
    #[account(
        init,
        payer = host,
        space = CLUE_SLOT_SIZE,
        seeds = [b"clue", run.key().as_ref(), &[2]],
        bump,
        del
    )]
    pub slot2: UncheckedAccount<'info>,
    /// CHECK: same rationale as slot0, seat 3.
    #[account(
        init,
        payer = host,
        space = CLUE_SLOT_SIZE,
        seeds = [b"clue", run.key().as_ref(), &[3]],
        bump,
        del
    )]
    pub slot3: UncheckedAccount<'info>,
}
