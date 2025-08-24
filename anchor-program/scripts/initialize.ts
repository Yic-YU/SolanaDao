// 文件路径: scripts/initialize.ts

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
// 确保导入与您项目编译后类型文件一致
import { DaoProgram } from "../target/types/dao_program.js";
import { PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";

async function main() {
    // 1. 设置客户端，它会自动读取 Anchor.toml 中的配置
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.DaoProgram as Program<DaoProgram>;

    // 2. 定义将要与指令交互的账户
    const admin = provider.wallet.payer; 
    const developerWallet = provider.wallet.payer;

    console.log("--- 初始化脚本 (完全手动模式) ---");
    console.log("程序 ID:", program.programId.toBase58());
    console.log("脚本执行者 (Admin):", admin.publicKey.toBase58());

    // 3. 计算 Config PDA 的地址
    const [configPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
    );
    console.log("将要初始化的 Config PDA 地址:", configPDA.toBase58());

    // 4. 完全手动构建指令和交易
    console.log("\n正在构建交易以初始化 Config 账户...");
    try {
        // 手动定义账户列表，顺序必须与 Rust 指令中的 Accounts 结构体完全一致
        const keys = [
            { pubkey: admin.publicKey, isSigner: true, isWritable: true },      // admin
            { pubkey: configPDA, isSigner: false, isWritable: true },           // config
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false } // system_program
        ];

        // 使用 coder 来编码指令数据，避免处理辨别符
        const data = program.coder.instruction.encode("initializeConfig", {
            developerWallet: developerWallet.publicKey,
        });

        // 创建指令
        const instruction = new TransactionInstruction({
            keys: keys,
            programId: program.programId,
            data: data,
        });

        // 创建一个新的交易
        const transaction = new Transaction().add(instruction);

        // 发送交易
        console.log("正在发送交易...");
        const txSignature = await provider.sendAndConfirm(transaction, [admin]);

        console.log("✅ Config 初始化成功！");
        console.log("交易签名 (Transaction Signature):", txSignature);
        console.log(`在 Solana Explorer 上查看交易: https://explorer.solana.com/tx/${txSignature}?cluster=devnet`);

    } catch (error) {
        console.error("❌ Config 初始化失败:", error.toString());
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