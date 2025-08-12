// 文件路径: scripts/initialize.ts

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
// 确保导入与您项目编译后类型文件一致
import { DaoProgram } from "../target/types/dao_program";
import { PublicKey, SystemProgram } from "@solana/web3.js";

async function main() {
    // 1. 设置客户端，它会自动读取 Anchor.toml 中的配置
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.DaoProgram as Program<DaoProgram>;

    // 2. 定义将要与指令交互的账户
    // provider.wallet.payer 就是您在 Anchor.toml 中配置的钱包
    const admin = provider.wallet.payer; 
    const developerWallet = provider.wallet.payer; // 这里我们暂时用同一个钱包作为开发者钱包

    console.log("--- 初始化脚本 ---");
    console.log("程序 ID:", program.programId.toBase58());
    console.log("脚本执行者 (Admin):", admin.publicKey.toBase58());

    // 3. 计算 Config PDA 的地址
    // 这个 PDA 是全局唯一的，种子是 "config"
    const [configPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
    );
    console.log("将要初始化的 Config PDA 地址:", configPDA.toBase58());

    // 4. 发送交易来调用 initializeConfig 指令
    console.log("\n正在发送交易以初始化 Config 账户...");
    try {
        const txSignature = await program.methods
            .initializeConfig(developerWallet.publicKey)
            .accounts({
                // 这里的账户名称必须与 Rust 指令上下文中的名称完全匹配
                admin: admin.publicKey,
                config: configPDA,
                systemProgram: SystemProgram.programId,
            })
            .rpc(); // .rpc() 会发送交易并等待确认

        console.log("✅ Config 初始化成功！");
        console.log("交易签名 (Transaction Signature):", txSignature);
        console.log(`在 Solana Explorer 上查看交易: https://explorer.solana.com/tx/${txSignature}?cluster=devnet`);

    } catch (error) {
        console.error("❌ Config 初始化失败:", error.toString());
        // 检查是否是因为账户已存在而失败，这是一个常见且无害的错误
        if (error.toString().includes("already in use") || error.toString().includes("custom program error: 0x0")) {
            console.log("提示：Config 账户可能已经存在，无需再次初始化。");
        }
    }
}

// 运行主函数
main().then(
    () => {
        console.log("\n脚本执行完毕。");
        process.exit(0);
    },
    err => {
        console.error(err);
        process.exit(1);
    }
);