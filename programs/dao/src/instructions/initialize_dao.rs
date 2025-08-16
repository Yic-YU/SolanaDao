// file: dao_program/src/instructions/initialize_dao.rs

use anchor_lang::{prelude::*, system_program};
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::{error::DaoError, event::DaoInitialized, state::DaoState, config::Config};


// 这是初始化 DAO 的主要函数
pub fn initialize_dao(
    ctx: Context<InitializeDao>,
    threshold: u8,
    vote_duration: i64,
    quorum: u32,
    staking_yield_rate: u16,
    pass_threshold_percentage: u8,
    min_staking_amount: u64
) -> Result<()> {
    // 1. 验证
    require!(threshold > 0, DaoError::InvalidThreshold);
    require!(vote_duration > 0, DaoError::InvalidVoteDuration);




    // 3. 初始化 DaoState 账户
    let dao_state = &mut ctx.accounts.dao_state;
    dao_state.authority = ctx.accounts.authority.key();
    dao_state.treasury = ctx.accounts.treasury.key();
    dao_state.token_mint = ctx.accounts.token_mint.key();
    dao_state.threshold = threshold;
    dao_state.vote_duration = vote_duration;
    dao_state.signer = vec![ctx.accounts.authority.key()];
    dao_state.project = Pubkey::default();
    dao_state.total_staked_amount = 0; // 初始化总质押量
    dao_state.quorum = quorum;
    dao_state.staking_yield_rate = staking_yield_rate;
    dao_state.pass_threshold_percentage = pass_threshold_percentage;
    dao_state.min_staking_amount = min_staking_amount;

    // 4. 触发 DaoInitialized 事件
    emit!(DaoInitialized {
        dao_state: dao_state.key(),
        authority: dao_state.authority,
        treasury: dao_state.treasury,
        token_mint: dao_state.token_mint,
        threshold: dao_state.threshold,
        vote_duration: dao_state.vote_duration,
        quorum: dao_state.quorum,
        staking_yield_rate: dao_state.staking_yield_rate,
        pass_threshold_percentage: dao_state.pass_threshold_percentage,
        min_staking_amount: dao_state.min_staking_amount,
    });

    Ok(())
}

// 定义 `initialize_dao` 指令需要的账户
#[derive(Accounts)]
pub struct InitializeDao<'info> {
    #[account(
        init,
        payer = authority,
        // 使用 InitSpace 自动计算空间，更安全
        space = 8 + DaoState::INIT_SPACE, 
        seeds = [b"dao".as_ref(), authority.key().as_ref()],
        bump
    )]
    pub dao_state: Account<'info, DaoState>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [b"treasury".as_ref(), dao_state.key().as_ref()],
        bump
    )]
    /// CHECK: 这是一个系统账户PDA，仅用于存储SOL，其安全性由种子保证。
    pub treasury: SystemAccount<'info>,

    pub token_mint: Account<'info, Mint>,

    /// 新增：初始化治理代币金库PDA
    #[account(
        init,
        payer = authority,
        seeds = [b"governance_vault".as_ref(), dao_state.key().as_ref()],
        bump,
        token::mint = token_mint,
        token::authority = governance_vault, // PDA 自己是自己的 authority
    )]
    pub governance_vault: Account<'info, TokenAccount>,


    #[account(
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, Config>,

    pub system_program: Program<'info, System>,
    /// 需要 Token Program 来创建金库账户
    pub token_program: Program<'info, Token>,
    /// 需要 Rent 来初始化账户
    pub rent: Sysvar<'info, Rent>,
}