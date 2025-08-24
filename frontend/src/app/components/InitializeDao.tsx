// src/app/components/InitializeDao.tsx
"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import * as web3 from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor"; 
import { Dao } from "@/idl/dao";
import idl from "@/idl/dao.json";

// 将idl转换为any类型以避免类型检查错误
const idl_string = JSON.stringify(idl);
const idl_object = JSON.parse(idl_string);
const PROGRAM_ID = new web3.PublicKey(idl.address);

export function InitializeDao() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  // 表单状态
  const [threshold, setThreshold] = useState(1);
  const [voteDuration, setVoteDuration] = useState(86400); // 1 day in seconds
  const [quorum, setQuorum] = useState(1);
  const [stakingYieldRate, setStakingYieldRate] = useState(500); // 5%
  const [passThresholdPercentage, setPassThresholdPercentage] = useState(60); // 60%
  const [minStakingAmount, setMinStakingAmount] = useState(1);
  const [tokenMint, setTokenMint] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [txSignature, setTxSignature] = useState("");

  const handleInitializeDao = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!publicKey) {
      alert("Please connect your wallet!");
      return;
    }
    
    setIsLoading(true);
    setTxSignature("");

    try {
      const provider = new anchor.AnchorProvider(connection, { 
        publicKey, 
        signTransaction: (tx) => Promise.resolve(tx),
        signAllTransactions: (txs) => Promise.resolve(txs)
      }, anchor.AnchorProvider.defaultOptions());
      const program = new anchor.Program(idl_object as any, PROGRAM_ID, provider);

      const [daoStatePDA] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("dao"), publicKey.toBuffer()],
        program.programId
      );

      const [treasuryPDA] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("treasury"), daoStatePDA.toBuffer()],
        program.programId
      );

      const [governanceVaultPDA] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("governance_vault"), daoStatePDA.toBuffer()],
        program.programId
      );

      const [configPDA] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      );

      const transaction = await program.methods
        .initializeDao(
          threshold,
          new anchor.BN(voteDuration),
          quorum,
          stakingYieldRate,
          passThresholdPercentage,
          new anchor.BN(minStakingAmount)
        )
        .accounts({
          daoState: daoStatePDA,
          authority: publicKey,
          treasury: treasuryPDA,
          tokenMint: new web3.PublicKey(tokenMint),
          governanceVault: governanceVaultPDA,
          config: configPDA,
          systemProgram: web3.SystemProgram.programId,
          tokenProgram: new web3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .transaction();

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, "confirmed");

      setTxSignature(signature);
    } catch (error) {
      console.error("Error initializing DAO:", error);
      alert(`Error initializing DAO: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/10 p-6 rounded-lg shadow-md w-full max-w-2xl text-white">
      <h2 className="text-2xl font-bold mb-4">Initialize DAO</h2>
      <form onSubmit={handleInitializeDao} className="space-y-4">
        <div>
          <label htmlFor="tokenMint" className="block text-sm font-medium">Governance Token Mint Address</label>
          <input
            type="text"
            id="tokenMint"
            value={tokenMint}
            onChange={(e) => setTokenMint(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="threshold" className="block text-sm font-medium">Threshold (u8)</label>
            <input
              type="number"
              id="threshold"
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label htmlFor="voteDuration" className="block text-sm font-medium">Vote Duration (seconds, i64)</label>
            <input
              type="number"
              id="voteDuration"
              value={voteDuration}
              onChange={(e) => setVoteDuration(parseInt(e.target.value, 10))}
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label htmlFor="quorum" className="block text-sm font-medium">Quorum (u32)</label>
            <input
              type="number"
              id="quorum"
              value={quorum}
              onChange={(e) => setQuorum(parseInt(e.target.value, 10))}
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label htmlFor="stakingYieldRate" className="block text-sm font-medium">Staking Yield Rate (u16, e.g., 500 for 5%)</label>
            <input
              type="number"
              id="stakingYieldRate"
              value={stakingYieldRate}
              onChange={(e) => setStakingYieldRate(parseInt(e.target.value, 10))}
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label htmlFor="passThresholdPercentage" className="block text-sm font-medium">Pass Threshold Percentage (u8, e.g., 60 for 60%)</label>
            <input
              type="number"
              id="passThresholdPercentage"
              value={passThresholdPercentage}
              onChange={(e) => setPassThresholdPercentage(parseInt(e.target.value, 10))}
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label htmlFor="minStakingAmount" className="block text-sm font-medium">Min Staking Amount (u64)</label>
            <input
              type="number"
              id="minStakingAmount"
              value={minStakingAmount}
              onChange={(e) => setMinStakingAmount(parseInt(e.target.value, 10))}
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={!publicKey || isLoading}
          className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Initializing..." : "Initialize DAO"}
        </button>
      </form>
      {txSignature && (
        <div className="mt-4 break-words">
          Transaction successful! Signature: {""}
          <a
            href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            {txSignature}
          </a>
        </div>
      )}
    </div>
  );
}