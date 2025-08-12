import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
// 使用和您的 tests/dao.ts 完全一致的导入
import { DaoProgram } from "../target/types/dao_program"; 
import { PublicKey, SystemProgram } from "@solana/web3.js";

// 主部署函数
module.exports = async function (provider: anchor.AnchorProvider) {
    // 1. 设置客户端
    anchor.setProvider(provider);
    // 注意这里也相应地修改
    const program = anchor.workspace.DaoProgram as Program<DaoProgram>;

    // 2. 定义账户
    const admin = provider.wallet.payer;
    const developerWallet = provider.wallet.payer; 

    console.log("部署者 (Admin/Developer):", admin.publicKey.toBase58());

    // 3. 计算 Config PDA 地址
    const [configPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
    );
    console.log("Config PDA:", configPDA.toBase58());

    // 4. 初始化 Config
    console.log("正在初始化 Config...");
    try {
        await program.methods
            .initializeConfig(developerWallet.publicKey)
            .accounts({
                config: configPDA,
                admin: admin.publicKey,
                systemProgram: SystemProgram.programId
            })
            .rpc();
        console.log("Config 初始化成功！");
    } catch (e) {
        console.error("Config 初始化失败:", e);
        if (!e.toString().includes("already in use")) {
            throw e;
        }
        console.log("Config 可能已经存在，跳过初始化。");
    }
    
    console.log("-----------------------------------------");
    console.log("部署完成！");
    console.log("DAO Program ID:", program.programId.toBase58());
    console.log("-----------------------------------------");
};