use anchor_lang::*;
#[error_code]
pub enum DaoError {
    //支付错误：您已为此收款人设置过定期付款。
    #[msg("Recurring payment for this recipient already exists.")]
    RecurringPaymentExists,
    //该收款人没有定期付款
    #[msg("No claimable payment found for this recipient.")]
    NoClaimablePayment,
    //取款时间未到
    #[msg("It is not yet time to claim this payment.")]
    ClaimTooEarly,
    //提案通过的阈值必须大于0
    #[msg("Threshold must be greater than 0.")]
    InvalidThreshold,
    //投票持续时间必须有效
    #[msg("Vote duration must be a positive value.")]
    InvalidVoteDuration,
    //支付金额必须有效
    #[msg("Recurring payment amount must be greater than 0.")]
    InvalidPaymentAmount,
    //支付周期必须有效
    #[msg("Recurring payment interval must be a positive value.")]
    InvalidPaymentInterval,
    //选择代币必须有效
    #[msg("Recurring payment currencyType must be sol.")]
    InvalidCurrency,
    //收款人无效
    #[msg("Recipient cannot be the DAO treasury itself.")]
    InvalidRecipient,
    //国库资金不足
    #[msg("Treasury does not have enough funds to make this payment.")]
    InsufficientTreasuryBalance,
    //溢出检查
    #[msg("An arithmetic operation resulted in an overflow.")]
    ArithmeticOverflow,
    #[msg("Signer is not authorized to perform this action.")]
    UnauthorizedSigner,
    #[msg("This proposal has already been executed.")]
    ProposalAlreadyExecuted,
    #[msg("Signer has already approved this proposal.")]
    AlreadyApproved,
    #[msg("Signer is already part of the DAO.")]
    SignerAlreadyExists,
    #[msg("Signer to be removed was not found.")]
    SignerNotFound,
    #[msg("Cannot remove signer, the total number of signers would fall below the threshold.")]
    CannotRemoveSigner,
    #[msg("The new threshold is invalid. It must be greater than 0 and not exceed the number of signers.")]
    InvalidNewThreshold,

    // --- 质押相关错误 ---
    #[msg("Stake amount must be greater than 0.")]
    InvalidStakeAmount,

    #[msg("No tokens staked to unstake.")]
    NoTokensStaked,
    // --- 质押投票相关错误 ---
    #[msg("You must have a stake in the DAO to create a proposal.")]
    NotStaked,
    #[msg("The proposal is not currently active for voting.")]
    ProposalNotActive,
    #[msg("The voting period for this proposal has not yet ended.")]
    VotePeriodNotOver,
    #[msg("You have already voted on this proposal.")]
    AlreadyVoted,
    #[msg("The proposal did not meet the required quorum.")]
    QuorumNotReached,
    #[msg("The proposal failed because there were more 'No' votes than 'Yes' votes.")]
    VoteFailedMajority,
    #[msg("You do not have enough tokens staked to perform this action.")]
    InsufficientStake,
}
