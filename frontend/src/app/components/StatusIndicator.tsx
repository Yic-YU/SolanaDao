"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

export function StatusIndicator() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();

  return (
    <div className="bg-white/10 p-4 rounded-lg border border-white/20">
      <h3 className="text-lg font-semibold text-white mb-3">连接状态</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-300">钱包状态:</span>
          <span className={connected ? "text-green-400" : "text-red-400"}>
            {connected ? "已连接" : "未连接"}
          </span>
        </div>
        {connected && publicKey && (
          <div className="flex justify-between">
            <span className="text-gray-300">钱包地址:</span>
            <span className="text-blue-400 font-mono text-xs">
              {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-300">网络:</span>
          <span className="text-yellow-400">Devnet</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-300">RPC 端点:</span>
          <span className="text-gray-400 text-xs">
            {connection.rpcEndpoint}
          </span>
        </div>
      </div>
    </div>
  );
}
