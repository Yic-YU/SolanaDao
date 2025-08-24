use anchor_lang::prelude::*;

use crate::{
    error::DaoError,
    event::ProposalApproved,
    state::{DaoState, Proposal},
};

pub fn mul_approve_propose(ctx: Context<Approve>) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    let dao_state = &mut ctx.accounts.dao_state;
    let approver = &ctx.accounts.approver;
    let clock = Clock::get()?;

    // 1. 标准的批准验证
    require!(!proposal.executed, DaoError::ProposalAlreadyExecuted);
    require!(dao_state.signer.contains(&approver.key()), DaoError::UnauthorizedSigner);
    require!(!proposal.approvals.contains(&approver.key()), DaoError::AlreadyApproved);

    // 2. 添加批准记录
    proposal.approvals.push(approver.key());
    msg!("Proposal #{} approved by: {}. Total approvals: {}/{}", proposal.proposal_id, approver.key(), proposal.approvals.len(), dao_state.threshold);

    // --- 触发"批准"事件 ---
    emit!(ProposalApproved {
        dao_state: dao_state.key(),
        proposal: proposal.key(),
        proposal_id: proposal.proposal_id,
        approver: approver.key(),
        current_approvals: proposal.approvals.len() as u64,
        threshold: dao_state.threshold,
    });

    // 3. 检查是否达到阈值
    if (proposal.approvals.len() as u8) >= dao_state.threshold {
        msg!("Threshold met for proposal #{}. Entering voting phase...", proposal.proposal_id);

        // 达到阈值后，进入投票阶段
        proposal.approved_at = Some(clock.unix_timestamp);
        // 设置投票结束时间（例如7天后）
        proposal.end_time = clock.unix_timestamp + (7 * 24 * 60 * 60); // 7天
        
        msg!("Proposal #{} entered voting phase. Voting ends at: {}", 
             proposal.proposal_id, proposal.end_time);
    }
    
    Ok(())
}

#[derive(Accounts)]
pub struct Approve<'info> {
    #[account(mut, has_one = authority)]
    pub dao_state: Account<'info, DaoState>,

    #[account(
        mut,
        seeds = [b"proposal".as_ref(), dao_state.key().as_ref(), &proposal.proposal_id.to_le_bytes()],
        bump,
        has_one = dao_state
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(mut)]
    pub approver: Signer<'info>,

    /// CHECK: DAO 的 authority，用于 has_one 约束
    pub authority: AccountInfo<'info>,
}