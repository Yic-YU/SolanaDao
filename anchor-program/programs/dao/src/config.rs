use anchor_lang::prelude::*;

pub const DEVELOPER_FEE: u64 = 1_000_000; // 0.001 SOL

// 只要一个结构体是 #[account]，就给它加上 #[derive(InitSpace)]。
/// 全局配置账户，用于存储可由管理员更新的参数
#[account]
#[derive(InitSpace, Default)]
pub struct Config {
    /// 拥有更新配置权限的管理员地址
    pub admin: Pubkey,
    /// 接收平台费用的开发者/平台方钱包地址
    pub developer_wallet: Pubkey,
}

// // 新增一个账户来跟踪每个创建者的状态
// #[account]
// #[derive(InitSpace)]
// pub struct CreatorState {
//     pub creator: Pubkey, // 该状态对应的创建者地址

//     pub project_count: u64, // 该创建者已创建的项目数量
//     pub bump: u8,
// }

// impl Default for CreatorState {
//     fn default() -> Self {
//         Self {
//             creator: Pubkey::default(),
//             project_count: 0,
//             bump: 0,
//         }
//     }
// }