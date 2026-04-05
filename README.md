# ContentBridge - 跨平台内容适配中台

一款帮助个人创作者快速生成多平台适配内容的 AI 工具。

## 功能特性

- 输入主题，AI 自动生成内容
- 深度适配各平台风格（小红书、抖音、公众号等）
- 积分制按需付费
- 一键复制，即刻使用

## 快速开始

### 后端

```bash
cd backend
cp .env.example .env  # 配置环境变量
npm install
npm run dev
```

### 移动端

```bash
cd mobile
npm install
npx react-native run-android  # Android
# 或
npx react-native run-ios  # iOS
```

### 环境变量

```env
# Backend .env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=content_bridge
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your-secret-key
OPENAI_API_KEY=your-openai-api-key
```

## 技术栈

- React Native + TypeScript
- Node.js + Koa + TypeScript
- PostgreSQL + Redis
- OpenAI GPT-4o
