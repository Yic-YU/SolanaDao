// in instructions/initialize_config.rs

use anchor_lang::prelude::*;

use crate::config::Config;

pub fn initialize_config(ctx: Context<InitializeConfig>, developer_wallet: Pubkey) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.admin = ctx.accounts.admin.key();
    config.developer_wallet = developer_wallet;
    // msg!("Config account initialized!");
    // msg!("Admin: {}", config.admin);
    // msg!("Developer Wallet: {}", config.developer_wallet);
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    // 签名者即为初始的管理员
    #[account(mut)]
    pub admin: Signer<'info>,

    // 初始化 Config 账户
    // 它是一个 PDA，种子是固定的 "config"，确保全局只有一个
    #[account(
        init,
        payer = admin,
        space = 8 + Config::INIT_SPACE,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, Config>,

    pub system_program: Program<'info, System>,
}