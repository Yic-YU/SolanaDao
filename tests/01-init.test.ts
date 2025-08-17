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
import {
  createMint,
  createAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";

describe("01 - DAO Initialization Tests", () => {
  // --- Test setup ---
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Dao as Program<Dao>;
  const admin = provider.wallet as anchor.Wallet;

  // --- Keypairs and PDAs ---
  const tokenMint = Keypair.generate();
  let daoState: PublicKey;
  let governanceVault: PublicKey;
  let treasury: PublicKey;
  let config: PublicKey;

  // --- Test accounts ---
  const staker = Keypair.generate();
  let stakerTokenAccount: PublicKey;
  const signer2 = Keypair.generate();
  const recipient = Keypair.generate();

  // --- Initial state ---
  const threshold = 1;
  const voteDuration = 1; // 1 second for testing
  const quorum = 1;
  const stakingYieldRate = 500; // 5%
  const passThresholdPercentage = 60; // 60%
  const minStakingAmount = new anchor.BN(100);

  before(async () => {
    // --- Fund test accounts ---
    await provider.connection.requestAirdrop(
      staker.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await provider.connection.requestAirdrop(
      signer2.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await provider.connection.requestAirdrop(
      recipient.publicKey,
      10 * LAMPORTS_PER_SOL
    );

    // --- Find PDAs ---
    [daoState] = PublicKey.findProgramAddressSync(
      [Buffer.from("dao"), admin.publicKey.toBuffer()],
      program.programId
    );
    [governanceVault] = PublicKey.findProgramAddressSync(
      [Buffer.from("governance_vault"), daoState.toBuffer()],
      program.programId
    );
    [treasury] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury"), daoState.toBuffer()],
      program.programId
    );
    [config] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );

    // --- Create token mint and accounts ---
    await createMint(
      provider.connection,
      admin.payer,
      admin.publicKey,
      null,
      6,
      tokenMint
    );

    stakerTokenAccount = await createAssociatedTokenAccount(
      provider.connection,
      staker,
      tokenMint.publicKey,
      staker.publicKey
    );

    await mintTo(
      provider.connection,
      staker,
      tokenMint.publicKey,
      stakerTokenAccount,
      admin.payer,
      1000 * 10 ** 6 // 1000 tokens
    );
  });

  // --- Tests ---

  it("Initializes the config", async () => {
    await program.methods
      .initializeConfig(admin.publicKey)
      .accounts({
        admin: admin.publicKey,
        config: config,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const configAccount = await program.account.config.fetch(config);
    assert.ok(configAccount.admin.equals(admin.publicKey));
  });

  it("Updates the config", async () => {
    const newDeveloperWallet = Keypair.generate().publicKey;
    await program.methods
      .updateConfig(newDeveloperWallet)
      .accounts({
        admin: admin.publicKey,
        config: config,
      })
      .rpc();

    const configAccount = await program.account.config.fetch(config);
    assert.ok(configAccount.developerWallet.equals(newDeveloperWallet));
  });

  it("Initializes the DAO", async () => {
    await program.methods
      .initializeDao(
        threshold,
        new anchor.BN(voteDuration),
        quorum,
        stakingYieldRate,
        passThresholdPercentage,
        minStakingAmount
      )
      .accounts({
        daoState: daoState,
        authority: admin.publicKey,
        treasury: treasury,
        tokenMint: tokenMint.publicKey,
        governanceVault: governanceVault,
        config: config,
        systemProgram: SystemProgram.programId,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    const daoStateAccount = await program.account.daoState.fetch(daoState);
    assert.ok(daoStateAccount.authority.equals(admin.publicKey));
    assert.equal(daoStateAccount.threshold, threshold);
  });

  // Export shared variables for other test files
  after(async () => {
    // 将关键变量保存到全局，供其他测试文件使用
    (global as any).testContext = {
      program,
      admin,
      daoState,
      governanceVault,
      treasury,
      config,
      tokenMint,
      staker,
      stakerTokenAccount,
      recipient,
      threshold,
      voteDuration,
      quorum,
      stakingYieldRate,
      passThresholdPercentage,
      minStakingAmount,
    };
  });
});
