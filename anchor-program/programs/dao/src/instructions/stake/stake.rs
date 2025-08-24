// dao_program/src/instructions/stake.rs

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::{event::TokensStaked, state::{DaoState, StakeAccount}};

/// 用户质押治理代币
pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
    require!(amount > 0, crate::error::DaoError::InvalidStakeAmount);

    let dao_state = &mut ctx.accounts.dao_state;
    let stake_account = &mut ctx.accounts.stake_account;

    // 1. 将代币从用户账户转移到治理金库
    let cpi_accounts = Transfer {
        from: ctx.accounts.staker_token_account.to_account_info(),
        to: ctx.accounts.governance_vault.to_account_info(),
        authority: ctx.accounts.staker.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_context, amount)?;

    // 2. 初始化或更新质押账户信息
    if stake_account.staker == Pubkey::default() {
        stake_account.staker = ctx.accounts.staker.key();
        stake_account.dao_state = dao_state.key();
    }
    stake_account.amount = stake_account.amount.checked_add(amount).unwrap();

    // 3. 更新 DAO 的总质押量
    dao_state.total_staked_amount = dao_state.total_staked_amount.checked_add(amount).unwrap();
    
    emit!(TokensStaked{
        dao_state: dao_state.key(),
        stake_account: stake_account.key(),
        staker: stake_account.staker,
        amount_staked: amount,
        new_total_for_staker: stake_account.amount,
    });
    
    Ok(())
}

#[derive(Accounts)]
pub struct Stake<'info> {
    /// 交易的发起者和签名者，即进行质押的用户。
    #[account(mut)]
    pub staker: Signer<'info>,

    /// DAO 的全局状态账户，用于获取治理代币 Mint 地址、
    /// 以及作为生成 "governance_vault" PDA 的种子。
    #[account(mut)]
    pub dao_state: Account<'info, DaoState>,

    /// 质押者的代币账户，代币将从这里转出。
    #[account(
        mut,
        constraint = staker_token_account.owner == staker.key(),
        constraint = staker_token_account.mint == dao_state.token_mint
    )]
    pub staker_token_account: Account<'info, TokenAccount>,

    /// DAO 的治理质押金库，一个用于存放所有质押代币的 PDA 代币账户。
    #[account(
        mut,
        seeds = [b"governance_vault", dao_state.key().as_ref()],
        bump
    )]
    pub governance_vault: Account<'info, TokenAccount>,

    /// 记录用户质押信息的 PDA 数据账户。
    /// 每个用户只有一个质押账户。如果是首次质押，则创建此账户。
    #[account(
        init_if_needed,
        payer = staker,
        space = 8 + StakeAccount::INIT_SPACE,
        seeds = [b"stake_account", dao_state.key().as_ref(), staker.key().as_ref()],
        bump
    )]
    pub stake_account: Account<'info, StakeAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}