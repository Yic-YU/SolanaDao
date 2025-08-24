"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { InitializeDao } from "./components/InitializeDao";
import { StatusIndicator } from "./components/StatusIndicator";

export default function Home() {
  return (
    <div className="font-sans min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Solana DAO</h1>
            <p className="text-gray-300">去中心化自治组织管理平台</p>
          </div>
          <WalletMultiButton />
        </header>

        {/* Main Content */}
        <main className="space-y-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
            <h2 className="text-2xl font-semibold text-white mb-4">欢迎使用 Solana DAO</h2>
            <p className="text-gray-300 mb-6">
              这是一个基于 Solana 区块链的去中心化自治组织管理平台。
              您可以创建和管理 DAO，参与治理投票，以及进行代币质押。
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-white/10 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">DAO 治理</div>
                <div className="text-sm text-gray-400">参与提案投票和决策</div>
              </div>
              <div className="bg-white/10 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-400">代币质押</div>
                <div className="text-sm text-gray-400">质押代币获得收益</div>
              </div>
              <div className="bg-white/10 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-400">透明管理</div>
                <div className="text-sm text-gray-400">区块链上的透明治理</div>
              </div>
            </div>
          </div>

          {/* Status and Initialize DAO Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <StatusIndicator />
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
              <h2 className="text-2xl font-semibold text-white mb-6">创建新的 DAO</h2>
              <InitializeDao />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-400">
          <p>&copy; 2024 Solana DAO. 基于 Solana 区块链构建。</p>
        </footer>
      </div>
    </div>
  );
}