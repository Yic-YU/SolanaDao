// in instructions/stakeproposal/execute_proposal.rs
use anchor_lang::{prelude::*, system_program};

use crate::{
    error::DaoError,
    event::ProposalExecuted,
    state::{DaoState, Proposal, ProposalType, RecurringPaymentAccount, DaoUpdateAction},
};

pub fn execute_proposal(ctx: Context<ExecuteProposal>) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    let dao_state = &mut ctx.accounts.dao_state;
    let clock = Clock::get()?;

    // 验证提案状态
    require!(!proposal.executed, DaoError::ProposalAlreadyExecuted);
    require!(proposal.approved_at.is_some(), DaoError::ProposalNotApproved);
    require!(clock.unix_timestamp >= proposal.end_time, DaoError::ProposalNotActive);

    // 计算投票结果
    let total_votes = proposal.yes_votes + proposal.no_votes;
    let pass_threshold = (total_votes * dao_state.pass_threshold_percentage as u64) / 100;
    
    // 检查是否达到法定人数
    require!(total_votes >= dao_state.quorum as u64, DaoError::QuorumNotMet);
    
    // 检查是否通过
    require!(proposal.yes_votes > pass_threshold, DaoError::ProposalNotPassed);

    // 执行提案
    match &proposal.proposal_type {
        // 执行定期支付
        ProposalType::AddRecurringPayment { recipient, amount, currency, interval } => {
            require_keys_eq!(ctx.accounts.recipient.key(), *recipient, DaoError::InvalidRecipient);
            let recurring_payment = &mut ctx.accounts.recurring_payment;
            let now = clock.unix_timestamp;
            recurring_payment.dao_state = dao_state.key();
            recurring_payment.receiver = *recipient;
            recurring_payment.amount = *amount;
            recurring_payment.currency = *currency;
            recurring_payment.interval_day = *interval;
            recurring_payment.next_claimable_timestamp = now.checked_add(*interval)
                .ok_or(DaoError::ArithmeticOverflow)?;
        },
        // 执行更新DAO
        ProposalType::UpdateDao { action } => {
            match action {
                DaoUpdateAction::AddSigner { new_signer } => {
                    require!(!dao_state.signer.contains(new_signer), DaoError::SignerAlreadyExists);
                    dao_state.signer.push(*new_signer);
                },
                DaoUpdateAction::RemoveSigner { signer_to_remove } => {
                    require!(dao_state.signer.contains(signer_to_remove), DaoError::SignerNotFound);
                    require!((dao_state.signer.len() - 1) as u8 >= dao_state.threshold, DaoError::CannotRemoveSigner);
                    dao_state.signer.retain(|s| s != signer_to_remove);
                },
                DaoUpdateAction::ChangeThreshold { new_threshold } => {
                    require!(*new_threshold > 0 && *new_threshold <= dao_state.signer.len() as u8, DaoError::InvalidNewThreshold);
                    dao_state.threshold = *new_threshold;
                },
            }
        },
        // 执行国库提款
        ProposalType::WithdrawTreasury { amount, recipient } => {
            require_keys_eq!(ctx.accounts.recipient.key(), *recipient, DaoError::InvalidRecipient);
            let treasury = &ctx.accounts.treasury;
            let system_program = &ctx.accounts.system_program;
            require!(treasury.lamports() >= *amount, DaoError::InsufficientTreasuryBalance);
            
            let cpi_context = CpiContext::new(
                system_program.to_account_info(),
                system_program::Transfer {
                    from: treasury.to_account_info(),
                    to: ctx.accounts.recipient.to_account_info(),
                },
            );
            
            let dao_key = dao_state.key();
            let treasury_bump = ctx.bumps.treasury;
            let seeds = &[
                b"treasury".as_ref(),
                dao_key.as_ref(),
                &[treasury_bump],
            ];
            let signer_seeds = &[&seeds[..]];

            system_program::transfer(cpi_context.with_signer(signer_seeds), *amount)?;
        },
    }
    
    proposal.executed = true;

    // 触发"执行"事件
    emit!(ProposalExecuted {
        dao_state: dao_state.key(),
        proposal: proposal.key(),
        proposal_id: proposal.proposal_id,
        proposal_type: proposal.proposal_type.clone(),
    });

    Ok(())
}

#[derive(Accounts)]
pub struct ExecuteProposal<'info> {
    #[account(mut, has_one = authority)]
    pub dao_state: Account<'info, DaoState>,

    #[account(
        mut,
        seeds = [b"proposal".as_ref(), dao_state.key().as_ref(), &proposal.proposal_id.to_le_bytes()],
        bump,
        has_one = dao_state
    )]
    pub proposal: Account<'info, Proposal>,

    /// CHECK: DAO 的 authority，用于 has_one 约束
    #[account(mut)]
    pub authority: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [b"treasury".as_ref(), dao_state.key().as_ref()],
        bump
    )]
    pub treasury: SystemAccount<'info>,
    
    #[account(mut)]
    /// CHECK: The recipient account, verified in the instruction logic.
    pub recipient: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + RecurringPaymentAccount::INIT_SPACE,
        seeds = [b"payment".as_ref(), dao_state.key().as_ref(), recipient.key().as_ref()],
        bump
    )]
    pub recurring_payment: Account<'info, RecurringPaymentAccount>,

    pub system_program: Program<'info, System>,
}