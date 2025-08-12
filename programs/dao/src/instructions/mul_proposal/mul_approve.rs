use anchor_lang::{prelude::*, system_program};

use crate::{
    error::DaoError,
    // 引入所有需要的事件
    event::{ProposalApproved, ProposalExecuted},
    state::{DaoState, Proposal, ProposalType, RecurringPaymentAccount, DaoUpdateAction},
};

pub fn mul_approve_propose(ctx: Context<Approve>) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    let dao_state = &mut ctx.accounts.dao_state;
    let approver = &ctx.accounts.approver;

    // 1. 标准的批准验证
    require!(!proposal.executed, DaoError::ProposalAlreadyExecuted);
    require!(dao_state.signer.contains(&approver.key()), DaoError::UnauthorizedSigner);
    require!(!proposal.approvals.contains(&approver.key()), DaoError::AlreadyApproved);

    // 2. 添加批准记录
    proposal.approvals.push(approver.key());
    msg!("Proposal #{} approved by: {}. Total approvals: {}/{}", proposal.proposal_id, approver.key(), proposal.approvals.len(), dao_state.threshold);

    // --- 触发“批准”事件 ---
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
        msg!("Threshold met for proposal #{}. Executing...", proposal.proposal_id);

        // 达到阈值，根据提案类型执行操作
        match &proposal.proposal_type {
            // 执行定期支付
            ProposalType::AddRecurringPayment { recipient, amount, currency, interval } => {
                require_keys_eq!(ctx.accounts.recipient.key(), *recipient, DaoError::InvalidRecipient);
                let recurring_payment = &mut ctx.accounts.recurring_payment;
                let now = Clock::get()?.unix_timestamp;
                recurring_payment.dao_state = dao_state.key();
                recurring_payment.receiver = *recipient;
                recurring_payment.amount = *amount;
                recurring_payment.currency = *currency;
                recurring_payment.interval_day = *interval;
                recurring_payment.next_claimable_timestamp = now.checked_add(*interval).ok_or(DaoError::ArithmeticOverflow)?;
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
                // 正确获取 bump 的方式
                let treasury_bump = ctx.bumps.treasury;
                let seeds = &[
                    b"treasury".as_ref(),
                    dao_key.as_ref(),
                    &[treasury_bump],
                ];
                let signer_seeds = &[&seeds[..]];

                // CPI 调用必须处理 Result
                system_program::transfer(cpi_context.with_signer(signer_seeds), *amount)?;
            },
        }
        
        proposal.executed = true;

        // --- 触发“执行”事件 ---
        emit!(ProposalExecuted {
            dao_state: dao_state.key(),
            proposal: proposal.key(),
            proposal_id: proposal.proposal_id,
            proposal_type: proposal.proposal_type.clone(),
        });
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
        payer = approver,
        // FIX: This line requires the `RecurringPaymentAccount` struct in state.rs
        // to have `#[derive(InitSpace)]`
        space = 8 + RecurringPaymentAccount::INIT_SPACE,
        seeds = [b"payment".as_ref(), dao_state.key().as_ref(), recipient.key().as_ref()],
        bump
    )]
    pub recurring_payment: Account<'info, RecurringPaymentAccount>,

    pub system_program: Program<'info, System>,
}