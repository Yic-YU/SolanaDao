// in instructions/stakeproposal/execute_proposal.rs
use anchor_lang::{prelude::*, system_program};
use crate::{error::DaoError, event::StakeProposalExecuted, state::{DaoState, DaoUpdateAction, Proposal, RecurringPaymentAccount}};

pub fn execute_stake_proposal(ctx: Context<ExecuteProposal>) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    let dao_state = &mut ctx.accounts.dao_state;
    let clock = Clock::get()?;

    // 1. 验证提案状态
    require!(clock.unix_timestamp >= proposal.end_time, DaoError::VotePeriodNotOver);
    require!(!proposal.executed, DaoError::ProposalAlreadyExecuted);

    // 2. 双重安全验证
    // a. 多数决
    let total_votes = proposal.yes_votes.checked_add(proposal.no_votes).unwrap();
    let pass_threshold = (total_votes as u128)
        .checked_mul(dao_state.pass_threshold_percentage as u128).unwrap()
        .checked_div(100).unwrap() as u64;
    
    require!(proposal.yes_votes >= pass_threshold, DaoError::VoteFailedMajority);

    // b. 法定人数 (Quorum)
    require!(proposal.voter_count >= dao_state.quorum, DaoError::QuorumNotReached);
    
    // 3. 执行提案
    match proposal.proposal_type {
        crate::state::ProposalType::WithdrawTreasury { amount, recipient } => {
            require_keys_eq!(ctx.accounts.recipient.key(), recipient, DaoError::InvalidRecipient);
            
            let treasury = &ctx.accounts.treasury;
            require!(treasury.lamports() >= amount, DaoError::InsufficientTreasuryBalance);

            let cpi_context = CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
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
                &[treasury_bump] 
            ];
            let signer_seeds = &[&seeds[..]];

            system_program::transfer(cpi_context.with_signer(signer_seeds), amount)?;
        },
        crate::state::ProposalType::AddRecurringPayment { recipient, amount, currency, interval } => {
            require_keys_eq!(ctx.accounts.recipient.key(), recipient, DaoError::InvalidRecipient);

            let recurring_payment = &mut ctx.accounts.recurring_payment;
            recurring_payment.dao_state = dao_state.key();
            recurring_payment.receiver = recipient;
            recurring_payment.amount = amount;
            recurring_payment.currency = currency;
            recurring_payment.interval_day = interval;
            recurring_payment.next_claimable_timestamp = clock.unix_timestamp.checked_add(interval).ok_or(DaoError::ArithmeticOverflow)?;
        },
        crate::state::ProposalType::UpdateDao { action } => {
            match action {
                DaoUpdateAction::AddSigner { new_signer } => {
                    // 再次验证，防止在投票期间状态已改变
                    require!(!dao_state.signer.contains(&new_signer), DaoError::SignerAlreadyExists);
                    dao_state.signer.push(new_signer);
                },
                DaoUpdateAction::RemoveSigner { signer_to_remove } => {
                    require!(dao_state.signer.contains(&signer_to_remove), DaoError::SignerNotFound);
                    require!((dao_state.signer.len() - 1) as u8 >= dao_state.threshold, DaoError::CannotRemoveSigner);
                    dao_state.signer.retain(|s| s != &signer_to_remove);
                },
                DaoUpdateAction::ChangeThreshold { new_threshold } => {
                    require!(new_threshold > 0 && new_threshold <= dao_state.signer.len() as u8, DaoError::InvalidNewThreshold);
                    dao_state.threshold = new_threshold;
                },
            }
        },
    }

    proposal.executed = true;

    emit!(StakeProposalExecuted {
        dao_state: dao_state.key(),
        proposal: proposal.key(),
        proposal_id: proposal.proposal_id,
        proposal_type: proposal.proposal_type.clone(),
    });

    Ok(())
}

#[derive(Accounts)]
pub struct ExecuteProposal<'info> {
    #[account(mut)]
    pub executor: Signer<'info>,

    #[account(
        mut, 
        constraint = dao_state.key() == proposal.dao_state
    )]
    pub dao_state: Account<'info, DaoState>,

    #[account(mut)]
    pub proposal: Account<'info, Proposal>,

    #[account(
        mut,
        seeds = [b"treasury".as_ref(), dao_state.key().as_ref()],
        bump
    )]
    pub treasury: SystemAccount<'info>,
    
    /// 在执行时才需要初始化，所以移到这里
    #[account(
        init_if_needed,
        payer = executor,
        space = 8 + RecurringPaymentAccount::INIT_SPACE,
        seeds = [b"payment".as_ref(), dao_state.key().as_ref(), recipient.key().as_ref()],
        bump
    )]
    pub recurring_payment: Account<'info, RecurringPaymentAccount>,

    #[account(mut)]
    /// CHECK: The recipient account, verified in the instruction logic.
    pub recipient: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}