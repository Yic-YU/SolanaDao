use anchor_lang::prelude::*;

declare_id!("Adk4apJPPBsC4wcLFRJjYFAgU6J5pjfk9djsFkuauqj1");

#[program]
pub mod dao {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
