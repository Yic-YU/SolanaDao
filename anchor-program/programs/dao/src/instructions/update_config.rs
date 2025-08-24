// in instructions/update_config.rs

use anchor_lang::prelude::*;

use crate::config::Config;

pub fn update_config(ctx: Context<UpdateConfig>, new_developer_wallet: Pubkey) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.developer_wallet = new_developer_wallet;
    // msg!("Developer wallet updated to: {}", new_developer_wallet);
    Ok(())
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    // 必须是当前记录在 config 账户中的 admin 签名
    #[account(mut)]
    pub admin: Signer<'info>,

    // 加载要修改的 Config 账户
    // constraint 确保了只有合法的 admin 才能修改它
    #[account(
        mut,
        seeds = [b"config"],
        bump,
        constraint = config.admin == admin.key()
    )]
    pub config: Account<'info, Config>,
}
