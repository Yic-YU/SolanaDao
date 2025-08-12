// in instructions/stakeproposal/create_proposal.rs
use anchor_lang::prelude::*;
use crate::{error::DaoError, event::StakeProposalCreated, state::{DaoState, DaoUpdateAction, Proposal, ProposalType, StakeAccount}};

pub fn create_stake_proposal(
    ctx: Context<CreateProposal>, 
    proposal_id: u64,
    title: String,
    description: String,
    proposal_type: ProposalType
) -> Result<()> {
    // 验证：提案发起人必须是质押成员
    let dao_state = &ctx.accounts.dao_state;
    require!(ctx.accounts.stake_account.amount >= dao_state.min_staking_amount, DaoError::InsufficientStake);
    
    // 特定提案类型的验证 (复用 mul_propose 的逻辑)
    match &proposal_type {
        ProposalType::WithdrawTreasury { amount, recipient } => {
            require!(*amount > 0, DaoError::InvalidPaymentAmount);
            require!(*recipient != ctx.accounts.dao_state.treasury, DaoError::InvalidRecipient);
        },
        ProposalType::AddRecurringPayment { recipient, amount, interval, .. } => {
            require!(*amount > 0, DaoError::InvalidPaymentAmount);
            require!(*interval > 0, DaoError::InvalidPaymentInterval);
            require!(*recipient != ctx.accounts.dao_state.treasury, DaoError::InvalidRecipient);
        },
        ProposalType::UpdateDao { action } => {
            match action {
                DaoUpdateAction::AddSigner { new_signer } => {
                    // 验证不能添加一个已经存在的signer
                    require!(!dao_state.signer.contains(new_signer), DaoError::SignerAlreadyExists);
                }
                DaoUpdateAction::RemoveSigner { signer_to_remove } => {
                    //验证：不能移除一个不存在的signer
                    require!(dao_state.signer.contains(signer_to_remove),DaoError::SignerNotFound);
                    require!((dao_state.signer.len() - 1) as u8 >= dao_state.threshold, DaoError::CannotRemoveSigner);
                },
                DaoUpdateAction::ChangeThreshold { new_threshold } => {
                    // 验证：新的阈值必须大于0，且不能超过当前 signer 的总数
                    require!(
                        *new_threshold > 0 && *new_threshold <= dao_state.signer.len() as u8,
                        DaoError::InvalidNewThreshold
                    );
                },
        }
        }
    }

 
    let proposal = &mut ctx.accounts.proposal;
    let clock = Clock::get()?;

    proposal.dao_state = dao_state.key();
    proposal.proposer = ctx.accounts.proposer.key();
    proposal.proposal_id = proposal_id;
    proposal.title = title.clone();
    proposal.description = description.clone();
    proposal.proposal_type = proposal_type;
    proposal.yes_votes = 0;
    proposal.no_votes = 0;
    proposal.end_time = clock.unix_timestamp.checked_add(dao_state.vote_duration).unwrap();
    proposal.executed = false;

    emit!(StakeProposalCreated {
        dao_state: dao_state.key(),
        proposal: proposal.key(),
        proposal_id,
        proposer: proposal.proposer,
        title, 
        description, 
        proposal_type: proposal.proposal_type,
        end_time: proposal.end_time,
    });

    Ok(())
}


#[derive(Accounts)]
#[instruction(proposal_id: u64, title: String, description: String, proposal_type: ProposalType)]
pub struct CreateProposal<'info> {
    #[account(mut)]
    pub proposer: Signer<'info>,

    pub dao_state: Account<'info, DaoState>,

    /// 验证发起人是否质押
    #[account(
        seeds = [b"stake_account", dao_state.key().as_ref(), proposer.key().as_ref()],
        bump,
        constraint = stake_account.staker == proposer.key()
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(
        init,
        payer = proposer,
        space = 8 + Proposal::INIT_SPACE,
        seeds = [b"proposal", dao_state.key().as_ref(), &proposal_id.to_le_bytes()],
        bump
    )]
    pub proposal: Account<'info, Proposal>,

    pub system_program: Program<'info, System>,
}