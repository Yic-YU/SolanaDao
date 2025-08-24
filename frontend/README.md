# Solana DAO 前端

这是一个基于 Next.js 15 和 Solana 区块链的去中心化自治组织管理平台前端应用。

## 功能特性

- 🔗 Solana 钱包连接（支持 Phantom、Solflare 等）
- 🏛️ DAO 创建和初始化
- 🗳️ 治理投票系统
- 💰 代币质押和收益管理
- 🌐 基于 Devnet 的测试环境

## 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS 4
- **区块链**: Solana Web3.js + Anchor
- **钱包**: Solana Wallet Adapter

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发环境运行

```bash
npm run dev
```

应用将在 [http://localhost:3000](http://localhost:3000) 启动。

### 构建生产版本

```bash
npm run build
npm start
```

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── components/        # 可复用组件
│   │   ├── wallet/       # 钱包相关组件
│   │   └── InitializeDao.tsx  # DAO 初始化组件
│   ├── globals.css       # 全局样式
│   ├── layout.tsx        # 根布局
│   └── page.tsx          # 主页面
└── idl/                  # Anchor IDL 文件
    ├── dao.json          # DAO 程序 IDL
    └── dao.ts            # 类型定义
```

## 环境配置

项目默认连接到 Solana Devnet。如需更改网络配置，请修改 `WalletContextProvider.tsx` 中的网络设置。

## 开发说明

1. 确保已安装 Node.js 18+ 版本
2. 使用 Solana Devnet 进行测试
3. 需要 Solana 钱包（如 Phantom）进行交互
4. 所有区块链操作都在 Devnet 上进行

## 故障排除

如果遇到启动问题：

1. 检查 Node.js 版本
2. 删除 `node_modules` 和 `package-lock.json`，重新安装
3. 确保所有依赖包版本兼容
4. 检查 TypeScript 配置

## 许可证

MIT License
