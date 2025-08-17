use anchor_lang::prelude::*;

// DAO 全局状态账户
#[account]
#[derive(Default,InitSpace)]
pub struct DaoState {
    /// 项目地址（32）
    pub project: Pubkey,

    /// DAO 的最高管理员（32）
    pub authority: Pubkey,

    /// DAO 的金库地址，用于存放资金。（32）
    pub treasury: Pubkey,

    /// DAO 的治理代币 Mint 地址（32）
    pub token_mint: Pubkey,

    /// 签名者列表  （4 + N*32）
    #[max_len(5)]
    pub signer: Vec<Pubkey>,

    /// 阈值 （1）
    pub threshold: u8,

    /// 提案的投票持续时长 （8）
    pub vote_duration: i64,

    /// 总质押代币数量 (8)
    pub total_staked_amount: u64,

    /// 法定人数：执行提案时，必须达到的最少投票人数 (u32)
    pub quorum: u32,

    /// 质押年化收益率 (u16, e.g., 500 for 5%)
    pub staking_yield_rate: u16,

    /// 投票通过的权重百分比 (u8, e.g., 60 for 60%)
    pub pass_threshold_percentage: u8,
    /// 参与提案和投票的最小质押代币数 (u64)
    pub min_staking_amount: u64,
}
//定义了用于记录每个用户质押信息的新账户 StakeAccount
#[account]
#[derive(InitSpace, Default)]
pub struct StakeAccount {
    /// 质押者的公钥
    pub staker: Pubkey,
    /// 关联的 DAO State 账户
    pub dao_state: Pubkey,
    /// 质押的代币数量
    pub amount: u64,
}
/// 定义了可以对 DAO 进行的修改操作
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Copy)]
#[derive(InitSpace)]
pub enum DaoUpdateAction {
    /// 添加一个新的签名者
    AddSigner { new_signer: Pubkey },
    /// 移除一个已有的签名者
    RemoveSigner { signer_to_remove: Pubkey },
    /// 修改提案通过的阈值
    ChangeThreshold { new_threshold: u8 },
}
/// 定期支付 (4 + N * (32 + 8 + 1 + 8 + 8)) -> (32 recipient + 8 amount + 1 currency + 8 interval + 8 next_payment = 57)
#[account]
#[derive(InitSpace)]
pub struct RecurringPaymentAccount {
    /// 关联的 DAO State 账户地址
    pub dao_state: Pubkey,
    /// 收款人地址
    pub receiver: Pubkey,
    /// 支付金额
    pub amount: u64,
    /// 代币种类 (当前仅支持 SOL)
    pub currency: CurrencyType,
    /// 支付间隔（秒）
    pub interval_day: i64,
    /// 下一次可领取的时间戳
    pub next_claimable_timestamp: i64,
}
#[derive(AnchorDeserialize, AnchorSerialize, Clone, Copy, PartialEq, InitSpace)]
pub enum CurrencyType {
    Sol,
}



// 复用现有的 ProposalType，并调整 Proposal 结构体
#[derive(InitSpace)]
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Copy)]
pub enum  ProposalType {
    /// 提案：添加一个定期支付
    AddRecurringPayment {
        recipient: Pubkey,
        amount: u64,
        currency: CurrencyType,
        interval: i64,
    },
    /// 提案：更新 DAO 的设置
    UpdateDao {
        action: DaoUpdateAction, 
    },
    /// 提案：从国库提取资金
    WithdrawTreasury {
        amount: u64,
        recipient: Pubkey,
    },
}


// --- 质押投票的提案账户 ---
#[account]
#[derive(InitSpace)]
pub struct Proposal {
    /// 关联的 DAO State 账户地址
    pub dao_state: Pubkey,
    /// 提案发起人（多签者）
    pub proposer: Pubkey,
    /// 提案的唯一ID
    pub proposal_id: u64,
    /// 提案的具体操作
    pub proposal_type: ProposalType,
    /// 已批准该提案的签名者列表
    #[max_len(5)]
    pub approvals: Vec<Pubkey>,
    /// 提案的标题
    #[max_len(50)]
    pub title: String,
    /// 提案的描述
    #[max_len(200)]
    pub description: String,
    /// 赞成票总数 (基于质押权重)
    pub yes_votes: u64,
    /// 反对票总数 (基于质押权重)
    pub no_votes: u64,
    /// 参与投票的总人数
    pub voter_count: u32,
    /// 提案投票结束时间戳
    pub end_time: i64,
    /// 提案是否已执行
    pub executed: bool,
    /// 提案创建时间
    pub created_at: i64,
    /// 多签批准时间
    pub approved_at: Option<i64>,
}

// --- 投票记录账户 ---
// 用于防止用户重复投票
#[account]
#[derive(InitSpace, Default)]
pub struct VoteRecord {
    /// 关联的提案账户
    pub proposal: Pubkey,
    /// 投票人
    pub voter: Pubkey,
    /// 投票人的投票权重 (当时质押的数量)
    pub weight: u64,
}