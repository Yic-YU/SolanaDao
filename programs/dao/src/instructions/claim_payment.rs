use anchor_lang::{prelude::*, system_program};

use crate::{config::{Config, DEVELOPER_FEE}, error::DaoError, event::PaymentClaimed, state::{DaoState, RecurringPaymentAccount}};

pub fn claim_payment(ctx: Context<ClaimPayment>) -> Result<()> {

    // 直接从上下文中获取账户
    let dao_state = &ctx.accounts.dao_state;
    let treasury = &ctx.accounts.treasury;
    let payment = &mut ctx.accounts.recurring_payment; // 直接获取支付账户
    let recipient = &ctx.accounts.recipient;
    let system_program = &ctx.accounts.system_program;
    let developer_wallet = &ctx.accounts.developer_wallet;
    let now = Clock::get()?.unix_timestamp;

    // 不再需要在 Vec 中搜索，直接操作 payment 账户

    // 检查是否已到领取时间
    require!(
        now >= payment.next_claimable_timestamp,
        DaoError::ClaimTooEarly
    );

    // 验证国库资金是否充足
    require!(
        treasury.lamports() >= payment.amount,
        DaoError::InsufficientTreasuryBalance
    );

    // 转账开发者费用
    let cpi_accounts = system_program::Transfer {
        from: recipient.to_account_info(),
        to: developer_wallet.to_account_info(),
    };
    let cpi_context = CpiContext::new(system_program.to_account_info(), cpi_accounts);
    system_program::transfer(cpi_context, DEVELOPER_FEE)?;


    // 从金库 PDA 转账给收款人
    let cpi_context = CpiContext::new(
        system_program.to_account_info(),
        system_program::Transfer {
            from: treasury.to_account_info(),
            to: recipient.to_account_info(),
        },
    );

    let dao_key = dao_state.key();
    let seeds = &[
        b"treasury".as_ref(),
        dao_key.as_ref(),
        &[ctx.bumps.treasury],
    ];
    let signer = &[&seeds[..]];

    system_program::transfer(cpi_context.with_signer(signer), payment.amount)?;

    // 成功领取后，更新下一个可领取的时间
    payment.next_claimable_timestamp = payment
        .next_claimable_timestamp
        .checked_add(payment.interval_day)
        .ok_or(DaoError::ArithmeticOverflow)?;

    emit!(PaymentClaimed{
        dao_state: dao_key,
        payment_account: payment.key(),
        recipient: recipient.key(),
        claimed_amount: payment.amount,
        next_claimable_timestamp: payment.next_claimable_timestamp
    });

    Ok(())
}

#[derive(Accounts)]
pub struct ClaimPayment<'info> {
    #[account(mut)]
    pub dao_state: Account<'info, DaoState>,

    #[account(
        mut,
        seeds = [b"treasury".as_ref(), dao_state.key().as_ref()],
        bump
    )]
    pub treasury: SystemAccount<'info>,

    // 获取要领取的支付 PDA 账户
    #[account(
        mut,
        // 种子必须和创建时一致
        seeds = [b"payment", dao_state.key().as_ref(), recipient.key().as_ref()],
        bump,
        // 约束：确保该支付账户关联的 DAO 是正确的
        has_one = dao_state,
        // 约束：确保交易的签名者（recipient）就是该支付账户指定的收款人
        constraint = recurring_payment.receiver == recipient.key()
    )]
    pub recurring_payment: Account<'info, RecurringPaymentAccount>,

    // 收款人必须是交易的签名者
    #[account(mut)]
    pub recipient: Signer<'info>,

    #[account(
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        address = config.developer_wallet
    )]
    pub developer_wallet: SystemAccount<'info>,


    pub system_program: Program<'info, System>,
}