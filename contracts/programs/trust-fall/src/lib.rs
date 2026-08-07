use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::ephemeral;

mod clue;
mod deal;
mod delegate;
mod economy;
mod errors;
mod floor;
mod lobby;
mod rules;
mod state;

use crate::deal::*;
use crate::delegate::*;
use crate::economy::*;
use crate::floor::*;
use crate::lobby::*;

declare_id!("68mZDv4kASxdpfXk358QoBK3UdEVJqDzYazeDaF27DAC");

#[ephemeral]
#[program]
pub mod trust_fall {
    use super::*;

    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        crate::lobby::initialize_vault(ctx)
    }

    pub fn seed_vault(ctx: Context<SeedVault>, amount: u64) -> Result<()> {
        crate::lobby::seed_vault(ctx, amount)
    }

    pub fn create_party(
        ctx: Context<CreateParty>,
        code: [u8; 4],
        depth: u8,
        stake: u64,
    ) -> Result<()> {
        crate::lobby::create_party(ctx, code, depth, stake)
    }

    pub fn join_party(ctx: Context<JoinParty>) -> Result<()> {
        crate::lobby::join_party(ctx)
    }

    pub fn ready(ctx: Context<Ready>) -> Result<()> {
        crate::lobby::ready(ctx)
    }

    pub fn delegate(ctx: Context<Delegate>, code: [u8; 4], validator: Option<Pubkey>) -> Result<()> {
        crate::delegate::delegate(ctx, code, validator)
    }

    pub fn request_deal(ctx: Context<RequestDeal>, code: [u8; 4]) -> Result<()> {
        crate::deal::request_deal(ctx, code)
    }

    pub fn callback_deal(
        ctx: Context<CallbackDeal>,
        randomness: [u8; 32],
        code: [u8; 4],
    ) -> Result<()> {
        crate::deal::callback_deal(ctx, randomness, code)
    }

    pub fn vote(ctx: Context<Vote>, code: [u8; 4], door: u8) -> Result<()> {
        crate::floor::vote(ctx, code, door)
    }

    pub fn mark(ctx: Context<Mark>, code: [u8; 4], door: u8, set: bool) -> Result<()> {
        crate::floor::mark(ctx, code, door, set)
    }

    pub fn chat(ctx: Context<Chat>, code: [u8; 4], body: [u8; 28], len: u8) -> Result<()> {
        crate::floor::chat(ctx, code, body, len)
    }

    pub fn resolve(ctx: Context<Resolve>, code: [u8; 4]) -> Result<()> {
        crate::floor::resolve(ctx, code)
    }

    pub fn resolve_expired(ctx: Context<Resolve>, code: [u8; 4]) -> Result<()> {
        crate::floor::resolve_expired(ctx, code)
    }

    pub fn bank_vote(ctx: Context<BankVote>, code: [u8; 4], choice: u8) -> Result<()> {
        crate::economy::bank_vote(ctx, code, choice)
    }

    pub fn bank_resolve(ctx: Context<BankResolve>, code: [u8; 4]) -> Result<()> {
        crate::economy::bank_resolve(ctx, code)
    }

    pub fn commit_floor(ctx: Context<CommitFloor>, code: [u8; 4]) -> Result<()> {
        crate::economy::commit_floor(ctx, code)
    }

    pub fn final_settle(ctx: Context<FinalSettle>, code: [u8; 4]) -> Result<()> {
        crate::economy::final_settle(ctx, code)
    }

    pub fn settle<'a>(ctx: Context<'a, Settle<'a>>, code: [u8; 4]) -> Result<()> {
        crate::economy::settle(ctx, code)
    }
}
