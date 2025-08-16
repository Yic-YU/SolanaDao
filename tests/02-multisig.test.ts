import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Dao } from "../target/types/dao.js";
import { assert } from "chai";
import {
  Keypair,
  SystemProgram,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

describe("02 - Multisig Proposal Tests", () => {
  // --- Get shared context from initialization tests ---
  let testContext: any;
  let program: Program<Dao>;
  let admin: anchor.Wallet;
  let daoState: PublicKey;
  let recipient: Keypair;
  let proposalId: anchor.BN;

  before(async () => {
    // 等待初始化测试完成并获取共享上下文
    testContext = (global as any).testContext;
    if (!testContext) {
      throw new Error("Test context not found. Please run initialization tests first.");
    }

    program = testContext.program;
    admin = testContext.admin;
    daoState = testContext.daoState;
    recipient = testContext.recipient;
    proposalId = new anchor.BN(1);
  });

  it("Creates a multisig proposal", async () => {
    const proposalType = {
      withdrawTreasury: {
        amount: new anchor.BN(1 * LAMPORTS_PER_SOL),
        recipient: recipient.publicKey,
      },
    };
    const title = "Test Treasury Withdrawal Proposal";
    const description = "This is a test proposal to withdraw funds from treasury";

    const [proposal] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("proposal"),
        daoState.toBuffer(),
        proposalId.toBuffer("le", 8),
      ],
      program.programId
    );

    await program.methods
      .mulCreatePropose(proposalId, proposalType, title, description)
      .accounts({
        daoState: daoState,
        proposal: proposal,
        proposer: admin.publicKey,
        authority: admin.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // 验证提案创建
    const proposalAccount = await program.account.proposal.fetch(proposal);
    assert.equal(proposalAccount.proposalId.toString(), proposalId.toString());
    assert.equal(proposalAccount.title, title);
    assert.equal(proposalAccount.description, description);
    assert.equal(proposalAccount.approvals.length, 0);
    assert.isNull(proposalAccount.approvedAt);
    assert.isFalse(proposalAccount.executed);

    // 保存提案地址供后续测试使用
    (global as any).currentProposal = proposal;
  });

  it("Approves the multisig proposal", async () => {
    const proposal = (global as any).currentProposal;
    if (!proposal) {
      throw new Error("Proposal not found. Please run proposal creation test first.");
    }

    await program.methods
      .mulApprovePropose()
      .accounts({
        daoState: daoState,
        proposal: proposal,
        approver: admin.publicKey,
        authority: admin.publicKey,
      })
      .rpc();

    // 验证提案批准
    const proposalAccount = await program.account.proposal.fetch(proposal);
    assert.equal(proposalAccount.approvals.length, 1);
    assert.ok(proposalAccount.approvedAt);
    assert.ok(proposalAccount.endTime > 0); // 应该设置投票结束时间
    assert.isFalse(proposalAccount.executed);

    console.log(`Proposal approved. Voting ends at: ${new Date(proposalAccount.endTime.toNumber() * 1000)}`);
  });

  it("Creates a recurring payment proposal", async () => {
    const proposalId2 = new anchor.BN(2);
    const proposalType = {
      addRecurringPayment: {
        recipient: recipient.publicKey,
        amount: new anchor.BN(0.5 * LAMPORTS_PER_SOL),
        currency: { sol: {} },
        interval: new anchor.BN(1), // 1 second for testing
      },
    };
    const title = "Test Recurring Payment Proposal";
    const description = "This is a test proposal to add a recurring payment";

    const [proposal] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("proposal"),
        daoState.toBuffer(),
        proposalId2.toBuffer("le", 8),
      ],
      program.programId
    );

    await program.methods
      .mulCreatePropose(proposalId2, proposalType, title, description)
      .accounts({
        daoState: daoState,
        proposal: proposal,
        proposer: admin.publicKey,
        authority: admin.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // 批准提案
    await program.methods
      .mulApprovePropose()
      .accounts({
        daoState: daoState,
        proposal: proposal,
        approver: admin.publicKey,
        authority: admin.publicKey,
      })
      .rpc();

    // 验证提案状态
    const proposalAccount = await program.account.proposal.fetch(proposal);
    assert.ok(proposalAccount.approvedAt);
    assert.equal(proposalAccount.approvals.length, 1);
    assert.ok(proposalAccount.endTime > 0);

    // 保存第二个提案地址
    (global as any).recurringPaymentProposal = proposal;
  });

  it("Verifies proposal states after approval", async () => {
    const proposal1 = (global as any).currentProposal;
    const proposal2 = (global as any).recurringPaymentProposal;

    // 验证第一个提案（国库提款）
    const proposal1Account = await program.account.proposal.fetch(proposal1);
    assert.equal(proposal1Account.proposalId.toString(), "1");
    assert.ok(proposal1Account.approvedAt);
    assert.equal(proposal1Account.approvals.length, 1);
    assert.ok(proposal1Account.endTime > 0);

    // 验证第二个提案（定期支付）
    const proposal2Account = await program.account.proposal.fetch(proposal2);
    assert.equal(proposal2Account.proposalId.toString(), "2");
    assert.ok(proposal2Account.approvedAt);
    assert.equal(proposal2Account.approvals.length, 1);
    assert.ok(proposal2Account.endTime > 0);

    console.log("Both proposals are approved and ready for staker voting");
  });
});
