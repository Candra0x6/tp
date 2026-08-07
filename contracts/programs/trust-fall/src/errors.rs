use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("The party is full")]
    PartyFull,
    #[msg("That seat is already taken")]
    SeatTaken,
    #[msg("You are not a member of this party")]
    NotMember,
    #[msg("Not all players have joined yet")]
    NotFull,
    #[msg("Not every player has signalled ready")]
    NotReady,
    #[msg("Wrong game phase for that action")]
    WrongPhase,
    #[msg("VRF is busy, wait for the current request")]
    VrfBusy,
    #[msg("No VRF request is in flight")]
    VrfIdle,
    #[msg("The floor has already been dealt")]
    AlreadyDealt,
    #[msg("Door index out of range")]
    BadDoor,
    #[msg("No majority vote yet and the deadline has not passed")]
    NotResolvable,
    #[msg("The floor is still open")]
    FloorOpen,
    #[msg("Chat message too long")]
    ChatTooLong,
    #[msg("Chat message contains a byte outside A-Z0-9 space . , ? ! -")]
    ChatBadByte,
    #[msg("Unknown depth")]
    BadDepth,
    #[msg("The stake must be positive")]
    BadStake,
    #[msg("Party code must be 4 uppercase A-Z0-9 bytes")]
    BadCode,
    #[msg("Settlement has already happened")]
    AlreadySettled,
    #[msg("Bad escrow authority for this action")]
    BadEscrowAuth,
    #[msg("The vault authority does not match")]
    BadVaultAuth,
    #[msg("Account does not match its expected PDA")]
    BadPda,
    #[msg("Bank vote must be climb or bank")]
    BadBankVote,
    #[msg("A party needs at least two players")]
    BadParty,
    #[msg("Payout math failed a consistency check")]
    BadPayout,
}
