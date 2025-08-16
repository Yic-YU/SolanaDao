import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { DaoProgram } from "../target/types/dao_program.js";
import { assert } from "chai";
import {
    TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddress,
    mintTo,
    getAccount,
    createMint
} from "@solana/spl-token";
import { Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction, PublicKey } from "@solana/web3.js";

// 主测试套件
describe("dao_program", () => {
    // 设置 Anchor Provider 和 Program
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.DaoProgram as Program<DaoProgram>;
    const connection = provider.connection;

    // --- 全局测试账户和密钥对 ---
    const admin = Keypair.generate();          // Config 管理员
    const authority = Keypair.generate();      // DAO 创建者和初始签名者
    const developerWallet = Keypair.generate(); // 初始开发者钱包
    const newDeveloperWallet = Keypair.generate(); // 更新后的开发者钱包
    const mintKeypair = Keypair.generate();    // 治理代币的 Mint

    // --- 质押和投票者 ---
    const stakerA = Keypair.generate(); // 质押者 A (主要提案发起人)
    const stakerB = Keypair.generate(); // 质押者 B
    let stakerATokenAccount: PublicKey;
    let stakerBTokenAccount: PublicKey;

    // --- 提案相关账户 ---
    const recipient = Keypair.generate();      // 提款提案的收款人
    const newSigner = Keypair.generate();      // 将要被添加的新签名者

    // --- 全局 PDA 地址变量 ---
    let configPDA: PublicKey;
    let daoStatePDA: PublicKey;
    let treasuryPDA: PublicKey;
    let governanceVaultPDA: PublicKey;

    // `before` 钩子: 在所有测试用例运行之前执行一次，用于准备环境
    before(async () => {
        // 1. 为所有需要的账户空投 SOL
        await Promise.all([
            provider.connection.requestAirdrop(admin.publicKey, 10 * LAMPORTS_PER_SOL).then(sig => provider.connection.confirmTransaction(sig, "confirmed")),
            // **FIX 1: 增加 authority 的空投金额以支付 mint 创建和开发者费用**
            provider.connection.requestAirdrop(authority.publicKey, 20 * LAMPORTS_PER_SOL).then(sig => provider.connection.confirmTransaction(sig, "confirmed")),
            provider.connection.requestAirdrop(developerWallet.publicKey, 10 * LAMPORTS_PER_SOL).then(sig => provider.connection.confirmTransaction(sig, "confirmed")),
            provider.connection.requestAirdrop(newDeveloperWallet.publicKey, 10 * LAMPORTS_PER_SOL).then(sig => provider.connection.confirmTransaction(sig, "confirmed")),
            provider.connection.requestAirdrop(stakerA.publicKey, 10 * LAMPORTS_PER_SOL).then(sig => provider.connection.confirmTransaction(sig, "confirmed")),
            provider.connection.requestAirdrop(stakerB.publicKey, 10 * LAMPORTS_PER_SOL).then(sig => provider.connection.confirmTransaction(sig, "confirmed")),
            provider.connection.requestAirdrop(recipient.publicKey, 10 * LAMPORTS_PER_SOL).then(sig => provider.connection.confirmTransaction(sig, "confirmed")),
        ]);

        // 2. 创建一个 SPL Token Mint 作为治理代币
        await createMint(
            provider.connection,
            authority,           // Payer: 支付创建费用的账户
            authority.publicKey, // Mint Authority: 有权铸造新币的账户
            null,                // Freeze Authority: 无冻结权限
            9,                   // Decimals: 代币小数位数
            mintKeypair          // Keypair: 代币自身的密钥对
        );

        // 3. 预先计算所有需要的 PDA 地址
        [configPDA] = await PublicKey.findProgramAddress(
            [Buffer.from("config")],
            program.programId
        );
        [daoStatePDA] = await PublicKey.findProgramAddress(
            [Buffer.from("dao"), authority.publicKey.toBuffer()],
            program.programId
        );
        [treasuryPDA] = await PublicKey.findProgramAddress(
            [Buffer.from("treasury"), daoStatePDA.toBuffer()],
            program.programId
        );
        [governanceVaultPDA] = await PublicKey.findProgramAddress(
            [Buffer.from("governance_vault"), daoStatePDA.toBuffer()],
            program.programId
        );
    });

    // --- 测试 1: Config 初始化与更新 (initialize_config, update_config) ---
    it("成功初始化并更新Config配置", async () => {
        // 初始化 Config 账户
        await program.methods
            .initializeConfig(developerWallet.publicKey)
            .accounts({
                config: configPDA,
                admin: admin.publicKey,
                systemProgram: SystemProgram.programId
            })
            .signers([admin])
            .rpc();
        let configAccount = await program.account.config.fetch(configPDA);
        assert.ok(configAccount.developerWallet.equals(developerWallet.publicKey), "初始化后的开发者钱包地址不正确");

        // 更新开发者钱包地址
        await program.methods
            .updateConfig(newDeveloperWallet.publicKey)
            .accounts({ config: configPDA, admin: admin.publicKey })
            .signers([admin])
            .rpc();
        configAccount = await program.account.config.fetch(configPDA);
        assert.ok(configAccount.developerWallet.equals(newDeveloperWallet.publicKey), "更新后的开发者钱包地址不正确");
    });

    // --- 测试 2: DAO 初始化 (initialize_dao) ---
    it("成功初始化DAO", async () => {
        const threshold = 1; // 多签阈值 (在质押投票中不直接使用，但仍是状态的一部分)
        const voteDuration = new anchor.BN(5); // 5 秒投票期
        const quorum = 1; // 至少1人投票
        const stakingYieldRate = 500; // 5% 收益率 (示例)
        const passThresholdPercentage = 60; // 60% 的赞成票通过
        const minStakingAmount = new anchor.BN(100 * (10 ** 9)); // 最小质押量 100

        await program.methods
            .initializeDao(threshold, voteDuration, quorum, stakingYieldRate, passThresholdPercentage, minStakingAmount)
            .accounts({
                daoState: daoStatePDA,
                authority: authority.publicKey,
                treasury: treasuryPDA,
                tokenMint: mintKeypair.publicKey,
                governanceVault: governanceVaultPDA,
                config: configPDA,
                developerWallet: newDeveloperWallet.publicKey, // 使用更新后的钱包
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            })
            .signers([authority])
            .rpc();

        const daoStateAccount = await program.account.daoState.fetch(daoStatePDA);
        assert.ok(daoStateAccount.authority.equals(authority.publicKey), "DAO的authority不正确");
        assert.equal(daoStateAccount.voteDuration.toString(), voteDuration.toString(), "DAO的vote_duration不正确");
        assert.equal(daoStateAccount.passThresholdPercentage, passThresholdPercentage, "DAO的pass_threshold_percentage不正确");

        // 给国库充值，以便后续提款测试
        await provider.sendAndConfirm(
            new Transaction().add(SystemProgram.transfer({ fromPubkey: authority.publicKey, toPubkey: treasuryPDA, lamports: 10 * LAMPORTS_PER_SOL })),
            [authority]
        );
        const treasuryBalance = await connection.getBalance(treasuryPDA);
        assert.equal(treasuryBalance, 10 * LAMPORTS_PER_SOL, "国库初始资金不正确");
    });

    // --- 测试 3: 质押与赎回 (stake, unstake) ---
    describe("质押与提案流程", () => {
        // 在这个测试块开始前，为质押者准备代币
        before(async () => {
            // 为 stakerA 创建代币账户并铸造代币
            stakerATokenAccount = await getAssociatedTokenAddress(mintKeypair.publicKey, stakerA.publicKey);
            const txA = new Transaction().add(createAssociatedTokenAccountInstruction(stakerA.publicKey, stakerATokenAccount, stakerA.publicKey, mintKeypair.publicKey));
            await provider.sendAndConfirm(txA, [stakerA]);
            await mintTo(connection, authority, mintKeypair.publicKey, stakerATokenAccount, authority, 1000 * (10 ** 9));

            // 为 stakerB 创建代币账户并铸造代币
            stakerBTokenAccount = await getAssociatedTokenAddress(mintKeypair.publicKey, stakerB.publicKey);
            const txB = new Transaction().add(createAssociatedTokenAccountInstruction(stakerB.publicKey, stakerBTokenAccount, stakerB.publicKey, mintKeypair.publicKey));
            await provider.sendAndConfirm(txB, [stakerB]);
            await mintTo(connection, authority, mintKeypair.publicKey, stakerBTokenAccount, authority, 500 * (10 ** 9));
        });

        it("成功质押和赎回代币", async () => {
            const [stakeAccountPDA] = await PublicKey.findProgramAddress(
                [Buffer.from("stake_account"), daoStatePDA.toBuffer(), stakerA.publicKey.toBuffer()],
                program.programId
            );
            const stakeAmount = new anchor.BN(700 * (10 ** 9)); // 质押 700

            // 1. 质押 (stake)
            await program.methods.stake(stakeAmount).accounts({
                staker: stakerA.publicKey,
                daoState: daoStatePDA,
                stakerTokenAccount: stakerATokenAccount,
                governanceVault: governanceVaultPDA,
                stakeAccount: stakeAccountPDA,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
            }).signers([stakerA]).rpc();

            let stakeAccountData = await program.account.stakeAccount.fetch(stakeAccountPDA);
            let daoStateData = await program.account.daoState.fetch(daoStatePDA);
            assert.equal(stakeAccountData.amount.toString(), stakeAmount.toString(), "质押数量不匹配");
            assert.equal(daoStateData.totalStakedAmount.toString(), stakeAmount.toString(), "DAO总质押量不匹配");

            // 2. 赎回 (unstake)
            await program.methods.unstake().accounts({
                staker: stakerA.publicKey,
                daoState: daoStatePDA,
                stakerTokenAccount: stakerATokenAccount,
                governanceVault: governanceVaultPDA,
                stakeAccount: stakeAccountPDA,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
            }).signers([stakerA]).rpc();

            const closedAccountInfo = await connection.getAccountInfo(stakeAccountPDA);
            assert.isNull(closedAccountInfo, "质押账户应在赎回后被关闭");
            daoStateData = await program.account.daoState.fetch(daoStatePDA);
            assert.equal(daoStateData.totalStakedAmount.toString(), "0", "赎回后总质押量应为0");
        });


        // --- 测试 4: 完整的提案生命周期 (create_stake_proposal, vote, execute_stake_proposal) ---
        describe("完整的提案、投票、执行流程", () => {
            // 在此块开始前，让两个用户都进行质押
            before(async () => {
                // Staker A 质押
                const stakeAmountA = new anchor.BN(700 * (10 ** 9));
                const [stakeAPDA] = await PublicKey.findProgramAddress([Buffer.from("stake_account"), daoStatePDA.toBuffer(), stakerA.publicKey.toBuffer()], program.programId);
                await program.methods.stake(stakeAmountA).accounts({
                    staker: stakerA.publicKey, daoState: daoStatePDA, stakerTokenAccount: stakerATokenAccount, governanceVault: governanceVaultPDA, stakeAccount: stakeAPDA, systemProgram: SystemProgram.programId, tokenProgram: TOKEN_PROGRAM_ID,
                }).signers([stakerA]).rpc();

                // Staker B 质押
                const stakeAmountB = new anchor.BN(300 * (10 ** 9));
                const [stakeBPDA] = await PublicKey.findProgramAddress([Buffer.from("stake_account"), daoStatePDA.toBuffer(), stakerB.publicKey.toBuffer()], program.programId);
                await program.methods.stake(stakeAmountB).accounts({
                    staker: stakerB.publicKey, daoState: daoStatePDA, stakerTokenAccount: stakerBTokenAccount, governanceVault: governanceVaultPDA, stakeAccount: stakeBPDA, systemProgram: SystemProgram.programId, tokenProgram: TOKEN_PROGRAM_ID,
                }).signers([stakerB]).rpc();
            });

            it("成功提议、投票并执行一个国库提款提案", async () => {
                const proposalId = new anchor.BN(1);
                const withdrawAmount = new anchor.BN(1 * LAMPORTS_PER_SOL);
                const [proposalPDA] = await PublicKey.findProgramAddress(
                    [Buffer.from("proposal"), daoStatePDA.toBuffer(), proposalId.toBuffer("le", 8)],
                    program.programId
                );
                // 提案类型：从国库提款
                const proposalType = { withdrawTreasury: { amount: withdrawAmount, recipient: recipient.publicKey } };

                // 1. 发起提案 (mul_create_propose) - 多签者发起
                const [stakeAccountPDA] = await PublicKey.findProgramAddress([Buffer.from("stake_account"), daoStatePDA.toBuffer(), stakerA.publicKey.toBuffer()], program.programId);
                await program.methods.mulCreatePropose(proposalId, proposalType, "提款提案", "为贡献者发奖金").accounts({
                    daoState: daoStatePDA,
                    proposal: proposalPDA,
                    proposer: authority.publicKey,
                    authority: authority.publicKey,
                    systemProgram: SystemProgram.programId,
                }).signers([authority]).rpc();

                let proposalAccount = await program.account.proposal.fetch(proposalPDA);
                assert.ok(proposalAccount.proposer.equals(authority.publicKey), "提案发起人不正确");

                // 1.5. 多签批准提案 (mul_approve_propose)
                await program.methods.mulApprovePropose().accounts({
                    daoState: daoStatePDA,
                    proposal: proposalPDA,
                    approver: authority.publicKey,
                    authority: authority.publicKey,
                }).signers([authority]).rpc();

                // 检查提案是否已批准
                proposalAccount = await program.account.proposal.fetch(proposalPDA);
                assert.ok(proposalAccount.approvedAt !== null, "提案应该被批准");

                // 2. 投票 (vote)
                // stakerA 投赞成票
                const [voteRecordAPDA] = await PublicKey.findProgramAddress([Buffer.from("vote_record"), proposalPDA.toBuffer(), stakerA.publicKey.toBuffer()], program.programId);
                await program.methods.vote({ yes: {} }).accounts({
                    voter: stakerA.publicKey,
                    stakeAccount: stakeAccountPDA, // 确保传递正确的 stake account
                    daoState: daoStatePDA,
                    proposal: proposalPDA,
                    voteRecord: voteRecordAPDA,
                    systemProgram: SystemProgram.programId,
                }).signers([stakerA]).rpc();

                // stakerB 投反对票
                const [stakeBPDA] = await PublicKey.findProgramAddress([Buffer.from("stake_account"), daoStatePDA.toBuffer(), stakerB.publicKey.toBuffer()], program.programId);
                const [voteRecordBPDA] = await PublicKey.findProgramAddress([Buffer.from("vote_record"), proposalPDA.toBuffer(), stakerB.publicKey.toBuffer()], program.programId);
                await program.methods.vote({ no: {} }).accounts({
                    voter: stakerB.publicKey,
                    stakeAccount: stakeBPDA, // 确保传递正确的 stake account
                    daoState: daoStatePDA,
                    proposal: proposalPDA,
                    voteRecord: voteRecordBPDA,
                    systemProgram: SystemProgram.programId,
                }).signers([stakerB]).rpc();

                proposalAccount = await program.account.proposal.fetch(proposalPDA);
                assert.equal(proposalAccount.yesVotes.toString(), "700000000000", "赞成票数不正确");
                assert.equal(proposalAccount.noVotes.toString(), "300000000000", "反对票数不正确");
                assert.equal(proposalAccount.voterCount, 2, "投票人数不正确");

                // 3. 等待投票期结束并执行提案 (execute_proposal)
                console.log("    等待投票期 (7秒) 结束...");
                await new Promise(resolve => setTimeout(resolve, 10 * 1000));

                const recipientInitialBalance = await connection.getBalance(recipient.publicKey);
                //  对于非定期支付提案，也需要传入一个虚拟的 recurring_payment PDA
                const [dummyPaymentPDA] = await PublicKey.findProgramAddress([Buffer.from("payment"), daoStatePDA.toBuffer(), recipient.publicKey.toBuffer()], program.programId);

                await program.methods.executeProposal().accounts({
                    daoState: daoStatePDA,
                    proposal: proposalPDA,
                    authority: daoStatePDA,
                    treasury: treasuryPDA,
                    recurringPayment: dummyPaymentPDA,
                    recipient: recipient.publicKey,
                    systemProgram: SystemProgram.programId,
                }).rpc();

                proposalAccount = await program.account.proposal.fetch(proposalPDA);
                assert.isTrue(proposalAccount.executed, "提案应被执行");

                const recipientFinalBalance = await connection.getBalance(recipient.publicKey);
                assert.equal(recipientFinalBalance, recipientInitialBalance + withdrawAmount.toNumber(), "收款人余额未正确增加");
            });

            it("成功提议、投票并执行一个添加新签名者的提案", async () => {
                const proposalId = new anchor.BN(2);
                const [proposalPDA] = await PublicKey.findProgramAddress(
                    [Buffer.from("proposal"), daoStatePDA.toBuffer(), proposalId.toBuffer("le", 8)],
                    program.programId
                );
                // 提案类型：更新DAO，添加签名者
                const proposalType = { updateDao: { action: { addSigner: { newSigner: newSigner.publicKey } } } };

                // 1. 发起提案
                const [stakeAccountPDA] = await PublicKey.findProgramAddress([Buffer.from("stake_account"), daoStatePDA.toBuffer(), stakerA.publicKey.toBuffer()], program.programId);
                await program.methods.mulCreatePropose(proposalId, proposalType, "添加新Signer", "邀请核心成员加入").accounts({
                    daoState: daoStatePDA, 
                    proposal: proposalPDA, 
                    proposer: stakerA.publicKey, 
                    authority: authority.publicKey, 
                    systemProgram: SystemProgram.programId,
                }).signers([stakerA]).rpc();

                // 1.5. 多签批准提案
                await program.methods.mulApprovePropose().accounts({
                    daoState: daoStatePDA,
                    proposal: proposalPDA,
                    approver: stakerA.publicKey,
                    authority: authority.publicKey,
                }).signers([stakerA]).rpc();

                // 2. 投票 (这次只有StakerA投票，权重70% > 60%，应该能通过)
                const [voteRecordAPDA] = await PublicKey.findProgramAddress([Buffer.from("vote_record"), proposalPDA.toBuffer(), stakerA.publicKey.toBuffer()], program.programId);
                await program.methods.vote({ yes: {} }).accounts({
                    voter: stakerA.publicKey, 
                    stakeAccount: stakeAccountPDA, 
                    daoState: daoStatePDA, 
                    proposal: proposalPDA, 
                    voteRecord: voteRecordAPDA, 
                    systemProgram: SystemProgram.programId,
                }).signers([stakerA]).rpc();

                // 3. 等待并执行
                console.log("    等待投票期 (7秒) 结束...");
                await new Promise(resolve => setTimeout(resolve, 6 * 1000));

                // 执行时需要提供一些虚拟账户，因为指令上下文是统一的
                const dummyRecipient = Keypair.generate();
                const [dummyPaymentPDA] = await PublicKey.findProgramAddress([Buffer.from("payment"), daoStatePDA.toBuffer(), dummyRecipient.publicKey.toBuffer()], program.programId);

                await program.methods.executeProposal().accounts({
                    daoState: daoStatePDA, 
                    proposal: proposalPDA, 
                    authority: daoStatePDA,
                    treasury: treasuryPDA,
                    recurringPayment: dummyPaymentPDA, 
                    recipient: dummyRecipient.publicKey, 
                    systemProgram: SystemProgram.programId,
                }).rpc();

                const daoState = await program.account.daoState.fetch(daoStatePDA);
                assert.equal(daoState.signer.length, 2, "签名者数量应为2");
                assert.ok(daoState.signer.some(s => s.equals(newSigner.publicKey)), "新签名者未被正确添加");
            });
        });

        // --- 测试 5: 定期支付提案与领取 (claim_payment) ---
        describe("定期支付提案与领取流程", () => {
            const paymentRecipient = Keypair.generate();
            const paymentAmount = new anchor.BN(0.5 * LAMPORTS_PER_SOL);
            const paymentInterval = new anchor.BN(5); // 5秒间隔

            before(async () => {
                await connection.requestAirdrop(paymentRecipient.publicKey, 2 * LAMPORTS_PER_SOL).then(sig => connection.confirmTransaction(sig, "confirmed"));
            });

            it("成功创建、执行并领取定期支付", async () => {
                const proposalId = new anchor.BN(3);
                const [proposalPDA] = await PublicKey.findProgramAddress(
                    [Buffer.from("proposal"), daoStatePDA.toBuffer(), proposalId.toBuffer("le", 8)],
                    program.programId
                );
                const [recurringPaymentPDA] = await PublicKey.findProgramAddress(
                    [Buffer.from("payment"), daoStatePDA.toBuffer(), paymentRecipient.publicKey.toBuffer()],
                    program.programId
                );

                // 提案类型：添加定期支付
                const proposalType = { addRecurringPayment: { recipient: paymentRecipient.publicKey, amount: paymentAmount, currency: { sol: {} }, interval: paymentInterval } };

                // 1. 发起提案
                const [stakeAccountPDA] = await PublicKey.findProgramAddress([Buffer.from("stake_account"), daoStatePDA.toBuffer(), stakerA.publicKey.toBuffer()], program.programId);
                await program.methods.mulCreatePropose(proposalId, proposalType, "定期支付提案", "为开发者提供持续支持").accounts({
                    daoState: daoStatePDA, 
                    proposal: proposalPDA, 
                    proposer: stakerA.publicKey, 
                    authority: authority.publicKey, 
                    systemProgram: SystemProgram.programId,
                }).signers([stakerA]).rpc();

                // 1.5. 多签批准提案
                await program.methods.mulApprovePropose().accounts({
                    daoState: daoStatePDA,
                    proposal: proposalPDA,
                    approver: stakerA.publicKey,
                    authority: authority.publicKey,
                }).signers([stakerA]).rpc();

                // 2. 投票
                const [voteRecordAPDA] = await PublicKey.findProgramAddress([Buffer.from("vote_record"), proposalPDA.toBuffer(), stakerA.publicKey.toBuffer()], program.programId);
                await program.methods.vote({ yes: {} }).accounts({
                    voter: stakerA.publicKey, 
                    stakeAccount: stakeAccountPDA, 
                    daoState: daoStatePDA, 
                    proposal: proposalPDA, 
                    voteRecord: voteRecordAPDA, 
                    systemProgram: SystemProgram.programId,
                }).signers([stakerA]).rpc();

                // 3. 等待并执行
                console.log("    等待投票期 (7秒) 结束...");
                await new Promise(resolve => setTimeout(resolve, 6 * 1000));

                await program.methods.executeProposal().accounts({
                    daoState: daoStatePDA, 
                    proposal: proposalPDA, 
                    authority: daoStatePDA,
                    treasury: treasuryPDA,
                    recurringPayment: recurringPaymentPDA, 
                    recipient: recipient.publicKey, 
                    systemProgram: SystemProgram.programId,
                }).rpc();

                const paymentAccount = await program.account.recurringPaymentAccount.fetch(recurringPaymentPDA);
                assert.ok(paymentAccount.receiver.equals(paymentRecipient.publicKey), "定期支付的接收者不正确");

                // 4. 等待支付间隔过去并领取 (claim_payment)
                console.log("    等待支付间隔 (5秒) 结束...");
                await new Promise(resolve => setTimeout(resolve, 11 * 1000));

                const recipientInitialBalance = await connection.getBalance(paymentRecipient.publicKey);

                await program.methods.claimPayment().accounts({
                    daoState: daoStatePDA,
                    treasury: treasuryPDA,
                    recurringPayment: recurringPaymentPDA,
                    recipient: paymentRecipient.publicKey, // 领取者必须是收款人本人并签名
                    config: configPDA,
                    developerWallet: newDeveloperWallet.publicKey,
                    systemProgram: SystemProgram.programId,
                }).signers([paymentRecipient]).rpc();



                // 验证收款人余额
                const recipientFinalBalance = await connection.getBalance(paymentRecipient.publicKey);
                const expectedBalance = recipientInitialBalance + paymentAmount.toNumber();
                // 允许一点点gas费误差
                assert.closeTo(recipientFinalBalance, expectedBalance, 50000, "收款人余额增加不正确");
            });
        });
    });
});