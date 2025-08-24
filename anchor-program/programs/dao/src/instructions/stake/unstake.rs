// dao_program/src/instructions/unstake.rs

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::{event::TokensUnstaked, state::{DaoState, StakeAccount}};

/// 用户赎回所有已质押的治理代币
pub fn unstake(ctx: Context<Unstake>) -> Result<()> {
    let dao_state = &mut ctx.accounts.dao_state;
    let stake_account = &ctx.accounts.stake_account;
    let amount_to_unstake = stake_account.amount;

    require!(amount_to_unstake > 0, crate::error::DaoError::NoTokensStaked);

    // 1. 从治理金库将代币转回给用户
    let dao_key = dao_state.key();
    let vault_seeds = &[
        b"governance_vault".as_ref(),
        dao_key.as_ref(),
        &[ctx.bumps.governance_vault],
    ];
    let signer = &[&vault_seeds[..]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.governance_vault.to_account_info(),
        to: ctx.accounts.staker_token_account.to_account_info(),
        authority: ctx.accounts.governance_vault.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new(cpi_program, cpi_accounts).with_signer(signer);
    token::transfer(cpi_context, amount_to_unstake)?;

    // 2. 更新 DAO 的总质押量
    dao_state.total_staked_amount = dao_state.total_staked_amount.checked_sub(amount_to_unstake).unwrap();

    emit!(TokensUnstaked{
        dao_state: dao_state.key(),
        stake_account: stake_account.key(),
        staker: stake_account.staker,
        amount_unstaked: amount_to_unstake,
    });
    // 3. 关闭质押账户，返还租金 (由 close = staker 宏自动处理)
    Ok(())
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    /// 交易的发起者和签名者，即赎回代币的用户。
    #[account(mut)]
    pub staker: Signer<'info>,

    #[account(mut)]
    pub dao_state: Account<'info, DaoState>,

    /// 质押者的个人代币账户，赎回的代币将存入这里。
    #[account(
        mut,
        constraint = staker_token_account.owner == staker.key(),
        constraint = staker_token_account.mint == dao_state.token_mint
    )]
    pub staker_token_account: Account<'info, TokenAccount>,

    /// 治理质押金库，代币将从这里转出。
    #[account(
        mut,
        seeds = [b"governance_vault", dao_state.key().as_ref()],
        bump
    )]
    pub governance_vault: Account<'info, TokenAccount>,

    /// 用户的个人质押记录。
    /// `close` 属性表示在指令成功执行后，关闭该账户并将租金返还给 `staker`。
    #[account(
        mut,
        seeds = [b"stake_account", dao_state.key().as_ref(), staker.key().as_ref()],
        bump,
        has_one = staker,
        has_one = dao_state,
        close = staker
    )]
    pub stake_account: Account<'info, StakeAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}