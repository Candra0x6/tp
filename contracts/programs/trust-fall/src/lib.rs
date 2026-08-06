use anchor_lang::prelude::*;

declare_id!("68mZDv4kASxdpfXk358QoBK3UdEVJqDzYazeDaF27DAC");

#[program]
pub mod trust_fall {
    use super::*;

    pub fn initialize_lobby(ctx: Context<InitializeLobby>, max_players: u8) -> Result<()> {
        let lobby = &mut ctx.accounts.lobby;
        lobby.host = *ctx.accounts.host.key;
        lobby.max_players = max_players;
        lobby.current_floor = 1;
        lobby.pot_balance = 0;
        msg!("Lobby initialized by {}", lobby.host);
        Ok(())
    }

    pub fn submit_vote(ctx: Context<SubmitVote>, door_index: u8) -> Result<()> {
        msg!("Player submitted vote for door {}", door_index);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeLobby<'info> {
    #[account(init, payer = host, space = 8 + 32 + 1 + 1 + 8)]
    pub lobby: Account<'info, LobbyState>,
    #[account(mut)]
    pub host: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitVote<'info> {
    #[account(mut)]
    pub lobby: Account<'info, LobbyState>,
    pub player: Signer<'info>,
}

#[account]
pub struct LobbyState {
    pub host: Pubkey,
    pub max_players: u8,
    pub current_floor: u8,
    pub pot_balance: u64,
}
