use anchor_lang::prelude::*;

use crate::{error::DaoError, event::ProposalCreated, state::{DaoState, DaoUpdateAction, Proposal, ProposalType}};

pub fn mul_create_propose(
    ctx: Context<Propose>,
    proposal_id: u64, 
    proposal_type: ProposalType,
    title: String,
    description: String
) -> Result<()> {
    
    let dao_state = &ctx.accounts.dao_state;
    let proposal = &mut ctx.accounts.proposal;
    let proposer = &ctx.accounts.proposer;
    let clock = Clock::get()?;

    // 1. 根据不同的 Action 类型进行特定的验证
    match &proposal_type {

        //定期支付
        ProposalType::AddRecurringPayment { 
            recipient, 
            amount, 
            currency, 
            interval 
        } => {
            require!(*amount > 0, DaoError::InvalidPaymentAmount);
            require!(*interval > 0, DaoError::InvalidPaymentInterval);
            require!(*recipient != dao_state.treasury, DaoError::InvalidRecipient);
            require!(*currency == crate::state::CurrencyType::Sol, DaoError::InvalidCurrency); 
        },

        //更新dao配置
        ProposalType::UpdateDao { 
            action 
        } => {
            match action {
                DaoUpdateAction::AddSigner { new_signer } => {
                    // 验证：不能添加一个已经存在的 signer
                    require!(
                        !dao_state.signer.contains(new_signer),
                        DaoError::SignerAlreadyExists
                    );
                }
                DaoUpdateAction::RemoveSigner { signer_to_remove } => {
                    // 验证：不能移除一个不存在的 signer
                    require!(
                        dao_state.signer.contains(signer_to_remove),
                        DaoError::SignerNotFound
                    );
                    // 验证：移除后 signer 数量不能低于当前阈值
                    require!(
                        (dao_state.signer.len() - 1) as u8 >= dao_state.threshold,
                        DaoError::CannotRemoveSigner
                    );
                }
                DaoUpdateAction::ChangeThreshold { new_threshold } => {
                    // 验证：新的阈值必须大于0，且不能超过当前 signer 的总数
                    require!(
                        *new_threshold > 0 && *new_threshold <= dao_state.signer.len() as u8,
                        DaoError::InvalidNewThreshold
                    );
                }
            }
        },
        // 国库提款
        ProposalType::WithdrawTreasury { 
            amount, 
            recipient 
        } => {
            // 验证：提款金额必须大于 0
            require!(*amount > 0, DaoError::InvalidPaymentAmount);
            // 验证：收款人不能是国库本身，防止资金被锁
            require!(*recipient != dao_state.treasury, DaoError::InvalidRecipient);
        },
    }

    proposal.dao_state = dao_state.key();
    proposal.proposer = proposer.key();
    proposal.proposal_type = proposal_type;
    proposal.approvals = Vec::new();
    proposal.executed = false;
    proposal.proposal_id = proposal_id;
    proposal.title = title;
    proposal.description = description;
    proposal.created_at = clock.unix_timestamp;
    proposal.approved_at = None;
    proposal.yes_votes = 0;
    proposal.no_votes = 0;
    proposal.voter_count = 0;
    proposal.end_time = 0; // 多签批准后设置

    // 触发统一事件
    emit!(ProposalCreated {
        dao_state: dao_state.key(),
        proposal: proposal.key(),
        proposal_id,
        proposer: proposer.key(),
        proposal_type: proposal_type, // 这里使用的是 clone 之前的原始变量
    });
    Ok(())
}

#[derive(Accounts)]
#[instruction(proposal_id: u64)]
pub struct Propose<'info> {
    #[account(has_one = authority)]
    pub dao_state: Account<'info, DaoState>,

    #[account(
        init,
        payer = proposer,
        space = 8 + 32 + 32 + 100 + (4 + 5 * 32) + 1 + 8, // 预留足够空间
        seeds = [b"proposal".as_ref(), dao_state.key().as_ref(), &proposal_id.to_le_bytes()],
        bump
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(
        mut,
        constraint = dao_state.signer.contains(&proposer.key()) @ DaoError::UnauthorizedSigner
    )]
    pub proposer: Signer<'info>,
    /// CHECK: DAO 的 authority，用于 has_one 约束
    pub authority: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}