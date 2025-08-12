use anchor_lang::prelude::*;
use crate::{instructions::VoteChoice, state::ProposalType};
///dao初始化
#[event]
pub struct DaoInitialized {
    pub dao_state: Pubkey,
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub token_mint: Pubkey,
    pub threshold: u8,
    pub vote_duration: i64,
    pub quorum: u32,
    pub staking_yield_rate: u16,
    pub pass_threshold_percentage: u8,
    pub min_staking_amount: u64,
}

#[event]
pub struct ProposalCreated {
    /// 关联的 DAO 账户
    pub dao_state: Pubkey,
    /// 新创建的提案账户
    pub proposal: Pubkey,
    /// 提案的唯一ID
    pub proposal_id: u64,
    /// 提案发起人
    pub proposer: Pubkey,
    /// 提案的具体类型和内容
    pub proposal_type: ProposalType,
}
#[event]
pub struct ProposalApproved {
    /// 关联的 DAO 账户
    pub dao_state: Pubkey,
    /// 被批准的提案账户
    pub proposal: Pubkey,
    /// 提案的ID
    pub proposal_id: u64,
    /// 本次操作的批准者
    pub approver: Pubkey,
    /// 当前的批准总数
    pub current_approvals: u64,
    /// 要求的阈值
    pub threshold: u8,
}

#[event]
pub struct ProposalExecuted {
    /// 关联的 DAO 账户
    pub dao_state: Pubkey,
    /// 成功执行的提案账户
    pub proposal: Pubkey,
    /// 提案的ID
    pub proposal_id: u64,
    /// 被执行的具体提案类型和内容
    pub proposal_type: ProposalType,
}
///领取定期支付事件
#[event]
pub struct PaymentClaimed {
    /// 关联的 DAO 账户
    pub dao_state: Pubkey,
    /// 支付账户
    pub payment_account: Pubkey,
    /// 领取人地址
    pub recipient: Pubkey,
    /// 本次领取的金额
    pub claimed_amount: u64,
    /// 更新后的下一次可领取时间戳
    pub next_claimable_timestamp: i64,
}
///  用户成功质押代币事件
#[event]
pub struct TokensStaked {
    /// 关联的 DAO 账户
    pub dao_state: Pubkey,
    /// 质押信息账户
    pub stake_account: Pubkey,
    /// 质押者
    pub staker: Pubkey,
    /// 本次质押的数量
    pub amount_staked: u64,
    /// 该用户质押后的总数量
    pub new_total_for_staker: u64,
}

///  用户成功赎回代币事件
#[event]
pub struct TokensUnstaked {
    /// 关联的 DAO 账户
    pub dao_state: Pubkey,
    /// (已关闭的)质押信息账户
    pub stake_account: Pubkey,
    /// 赎回者
    pub staker: Pubkey,
    /// 赎回的代币数量
    pub amount_unstaked: u64,
}
// --- 新增：质押投票相关事件 ---

/// 当一个质押提案被创建时触发
#[event]
pub struct StakeProposalCreated {
    /// 关联的 DAO 账户
    pub dao_state: Pubkey,
    /// 新创建的提案账户
    pub proposal: Pubkey,
    /// 提案的唯一ID
    pub proposal_id: u64,
    /// 提案发起人
    pub proposer: Pubkey,
    /// 提案标题
    pub title: String,
    /// 提案描述
    pub description: String,
    /// 提案类型和内容
    pub proposal_type: ProposalType,
    /// 投票结束时间
    pub end_time: i64,
}

/// 当用户对质押提案进行投票时触发
#[event]
pub struct VoteCasted {
    /// 关联的提案账户
    pub proposal: Pubkey,
    /// 投票者
    pub voter: Pubkey,
    /// 投票选项 (Yes/No)
    pub choice: VoteChoice,
    /// 本次投票的权重 (质押数量)
    pub weight: u64,
    /// 更新后的总赞成票数
    pub new_yes_votes: u64,
    /// 更新后的总反对票数
    pub new_no_votes: u64,
    /// 更新后的总投票人数
    pub new_voter_count: u32,
}

/// 当一个质押提案被成功执行时触发
#[event]
pub struct StakeProposalExecuted {
    /// 关联的 DAO 账户
    pub dao_state: Pubkey,
    /// 成功执行的提案账户
    pub proposal: Pubkey,
    /// 提案的ID
    pub proposal_id: u64,
    /// 被执行的具体提案类型和内容
    pub proposal_type: ProposalType,
}