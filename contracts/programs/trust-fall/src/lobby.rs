use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::errors::ErrorCode;
use crate::state::*;

pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    vault.bump = ctx.bumps.vault;
    vault.authority = ctx.accounts.admin.key();
    vault.mint = ctx.accounts.mint.key();
    vault.balance = 0;
    vault.seeded = 0;
    vault.total_falls = 0;
    vault.total_payouts = 0;
    Ok(())
}

pub fn seed_vault(ctx: Context<SeedVault>, amount: u64) -> Result<()> {
    require!(amount > 0, ErrorCode::BadStake);
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.key(),
            Transfer {
                from: ctx.accounts.admin_ata.to_account_info(),
                to: ctx.accounts.vault_ata.to_account_info(),
                authority: ctx.accounts.admin.to_account_info(),
            },
        ),
        amount,
    )?;
    let vault = &mut ctx.accounts.vault;
    vault.balance = vault.balance.checked_add(amount).unwrap();
    vault.seeded = vault.seeded.checked_add(amount).unwrap();
    Ok(())
}

pub fn create_party(
    ctx: Context<CreateParty>,
    code: [u8; 4],
    depth: u8,
    stake: u64,
) -> Result<()> {
    require!(
        depth == DEPTH_QUICK || depth == DEPTH_DEEP,
        ErrorCode::BadDepth
    );
    require!(stake > 0, ErrorCode::BadStake);
    require!(valid_code(&code), ErrorCode::BadCode);

    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.key(),
            Transfer {
                from: ctx.accounts.host_ata.to_account_info(),
                to: ctx.accounts.escrow.to_account_info(),
                authority: ctx.accounts.host.to_account_info(),
            },
        ),
        stake,
    )?;

    let run = &mut ctx.accounts.run;
    run.bump = ctx.bumps.run;
    run.code = code;
    run.host = ctx.accounts.host.key();
    run.players[0] = ctx.accounts.host.key();
    run.player_count = 1;
    run.bot_mask = 0;
    run.depth = depth;
    run.stake = stake;
    run.phase = PHASE_LOBBY;
    run.floor = 0;
    run.doors = doors_for(depth, 0, 1);
    run.vrf_state = VRF_IDLE;
    run.revealed_door = DOOR_UNREVEALED;
    run.outcome = OUTCOME_RUNNING;
    run.ready_mask = 0;
    run.settled = false;
    Ok(())
}

pub fn join_party(ctx: Context<JoinParty>) -> Result<()> {
    let run = &mut ctx.accounts.run;
    require!(run.phase == PHASE_LOBBY, ErrorCode::WrongPhase);
    require!(
        (run.player_count as usize) < MAX_PLAYERS,
        ErrorCode::PartyFull
    );
    require!(run.seat_of(&ctx.accounts.player.key()).is_none(), ErrorCode::SeatTaken);

    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.key(),
            Transfer {
                from: ctx.accounts.player_ata.to_account_info(),
                to: ctx.accounts.escrow.to_account_info(),
                authority: ctx.accounts.player.to_account_info(),
            },
        ),
        run.stake,
    )?;

    let seat = run.player_count as usize;
    run.players[seat] = ctx.accounts.player.key();
    run.player_count += 1;
    run.doors = doors_for(run.depth, run.floor, run.player_count);
    Ok(())
}

pub fn ready(ctx: Context<Ready>) -> Result<()> {
    let run = &mut ctx.accounts.run;
    require!(run.phase == PHASE_LOBBY, ErrorCode::WrongPhase);
    let seat = run
        .seat_of(&ctx.accounts.player.key())
        .ok_or(ErrorCode::NotMember)?;
    run.ready_mask |= 1u8 << seat;
    let full = (1u8 << run.player_count) - 1;
    if run.ready_mask == full {
        // Every seat is present and ready. Delegation happens on base now,
        // then request_deal on the ER. doors were widened as players joined.
        run.phase = PHASE_DEALING;
        run.vrf_state = VRF_IDLE;
    }
    Ok(())
}

fn valid_code(code: &[u8; 4]) -> bool {
    code.iter().all(|&b| (b'A'..=b'Z').contains(&b) || (b'0'..=b'9').contains(&b))
}

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = admin,
        space = VAULT_SIZE,
        seeds = [b"vault", mint.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SeedVault<'info> {
    #[account(
        mut,
        seeds = [b"vault", mint.key().as_ref()],
        bump,
        constraint = vault.authority == admin.key()
    )]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub mint: Account<'info, Mint>,
    #[account(
        mut,
        constraint = vault_ata.mint == mint.key(),
        constraint = vault_ata.owner == vault.key()
    )]
    pub vault_ata: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = admin_ata.owner == admin.key(),
        constraint = admin_ata.mint == mint.key()
    )]
    pub admin_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(code: [u8; 4])]
pub struct CreateParty<'info> {
    #[account(mut)]
    pub host: Signer<'info>,
    #[account(
        init,
        payer = host,
        space = RUN_SIZE,
        seeds = [b"run", code.as_ref()],
        bump
    )]
    pub run: Account<'info, Run>,
    #[account(
        init,
        payer = host,
        token::mint = mint,
        token::authority = run,
        seeds = [b"escrow", run.key().as_ref()],
        bump
    )]
    pub escrow: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = host_ata.owner == host.key(),
        constraint = host_ata.mint == mint.key()
    )]
    pub host_ata: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinParty<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
        mut,
        seeds = [b"run", run.code.as_ref()],
        bump,
        constraint = run.phase == PHASE_LOBBY
    )]
    pub run: Account<'info, Run>,
    #[account(
        mut,
        seeds = [b"escrow", run.key().as_ref()],
        bump
    )]
    pub escrow: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = player_ata.owner == player.key(),
        constraint = player_ata.mint == mint.key()
    )]
    pub player_ata: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Ready<'info> {
    pub player: Signer<'info>,
    #[account(
        mut,
        seeds = [b"run", run.code.as_ref()],
        bump,
        constraint = run.phase == PHASE_LOBBY
    )]
    pub run: Account<'info, Run>,
}
