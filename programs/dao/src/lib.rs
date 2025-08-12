#![allow(unexpected_cfgs, deprecated)]

use anchor_lang::prelude::*;

pub mod error;
pub mod instructions;
pub mod state;
pub mod config;
pub mod event;

declare_id!("3LDehVNaAgFqvjo1cPg96j8tKUReLrpsKpW321fb8uyR");
use instructions::*;
use crate::state::ProposalType;
use crate::instructions::staker_proposal::VoteChoice;

#[program]
pub mod dao_program {

    use crate::state::ProposalType;

    use super::*;
    ///初始化Dao
    pub fn initialize_dao(
        ctx: Context<InitializeDao>,
        threshold: u8,
        vote_duration: i64,
        quorum: u32,
        staking_yield_rate: u16,
        pass_threshold_percentage: u8,
        min_staking_amount: u64,
    ) -> Result<()> {
        instructions::initialize_dao::initialize_dao(
            ctx,
            threshold,
            vote_duration,
            quorum,
            staking_yield_rate,
            pass_threshold_percentage,
            min_staking_amount,
        )
    }
    // /// 发起一个多签提案
    // pub fn propose(ctx: Context<Propose>, proposal_id: u64, action: ProposalType) -> Result<()> {
    //     instructions::mul_propose::mul_create_propose(ctx, proposal_id, action)
    // }

    // /// 批准并可能执行一个多签提案
    // pub fn approve(ctx: Context<Approve>) -> Result<()> {
    //     instructions::mul_approve::mul_approve_propose(ctx)
    // }
    

    /// 领取定期支付
    pub fn claim_payment(ctx: Context<ClaimPayment>) -> Result<()> {
        instructions::claim_payment::claim_payment(ctx)
    }
    /// 质押治理代币
    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        instructions::stake::stake(ctx, amount)
    }

    /// 赎回所有已质押的代币
    pub fn unstake(ctx: Context<Unstake>) -> Result<()> {
        instructions::unstake::unstake(ctx)
    }

    // --- 新增：质押投票相关指令 ---

    /// 发起一个质押投票提案
    pub fn create_stake_proposal(
        ctx: Context<CreateProposal>, 
        proposal_id: u64,
        title: String,
        description: String,
        proposal_type: ProposalType
    ) -> Result<()> {
        instructions::staker_proposal::create_stake_proposal(ctx, proposal_id, title, description, proposal_type)
    }

    /// 对质押提案进行投票
    pub fn vote(ctx: Context<Vote>, choice: VoteChoice) -> Result<()> {
        instructions::staker_proposal::vote(ctx, choice)
    }

    /// 执行一个已通过的质押提案
    pub fn execute_stake_proposal(ctx: Context<ExecuteProposal>) -> Result<()> {
        instructions::staker_proposal::execute_stake_proposal(ctx)
    }

    
    /// 全局配置指令
    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        developer_wallet: Pubkey,
    ) -> Result<()> {
        instructions::initialize_config::initialize_config(ctx, developer_wallet)
    }

    pub fn update_config(ctx: Context<UpdateConfig>, new_developer_wallet: Pubkey) -> Result<()> {
        instructions::update_config::update_config(ctx, new_developer_wallet)
    }
    
}
