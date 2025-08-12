// in instructions/stakeproposal/vote.rs
use anchor_lang::prelude::*;
use crate::{error::DaoError, event::VoteCasted, state::{DaoState, Proposal, StakeAccount, VoteRecord}};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub enum VoteChoice {
    Yes,
    No,
}

pub fn vote(ctx: Context<Vote>, choice: VoteChoice) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    let stake_account = &ctx.accounts.stake_account;
    let clock = Clock::get()?;

    // 验证提案是否处于可投票状态
    require!(!proposal.executed && clock.unix_timestamp < proposal.end_time, DaoError::ProposalNotActive);
    // 验证投票者是否已质押
    let dao_state = &ctx.accounts.dao_state;
    require!(stake_account.amount >= dao_state.min_staking_amount, DaoError::InsufficientStake);

    // 更新票数
    let vote_weight = stake_account.amount;
    match choice {
        VoteChoice::Yes => {
            proposal.yes_votes = proposal.yes_votes.checked_add(vote_weight).unwrap();
        },
        VoteChoice::No => {
            proposal.no_votes = proposal.no_votes.checked_add(vote_weight).unwrap();
        },
    }
    proposal.voter_count = proposal.voter_count.checked_add(1).unwrap();

    // 记录投票，防止重复投票
    let vote_record = &mut ctx.accounts.vote_record;
    vote_record.proposal = proposal.key();
    vote_record.voter = ctx.accounts.voter.key();
    vote_record.weight = vote_weight;

    emit!(VoteCasted {
        proposal: proposal.key(),
        voter: vote_record.voter,
        choice,
        weight: vote_record.weight,
        new_yes_votes: proposal.yes_votes,
        new_no_votes: proposal.no_votes,
        new_voter_count: proposal.voter_count,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,

    /// 获取投票权重
    #[account(
        seeds = [b"stake_account", proposal.dao_state.as_ref(), voter.key().as_ref()],
        bump
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(
        constraint = dao_state.key() == proposal.dao_state
    )]
pub dao_state: Account<'info, DaoState>,

    #[account(mut)]
    pub proposal: Account<'info, Proposal>,

    /// 创建投票记录账户以防止重复投票
    #[account(
        init,
        payer = voter,
        space = 8 + VoteRecord::INIT_SPACE,
        seeds = [b"vote_record", proposal.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub vote_record: Account<'info, VoteRecord>,

    pub system_program: Program<'info, System>,
}