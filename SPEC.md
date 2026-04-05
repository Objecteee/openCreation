# 内容创作助手 - 规格文档

## 概述
一款帮助个人创作者快速生成多平台适配内容的移动应用。

## 核心功能

### MVP (Phase 1)
- 用户注册/登录
- 输入主题，AI 生成小红书内容
- 内容预览与一键复制
- 积分系统（注册送50积分，每次生成消耗5积分）
- 积分充值

## 技术栈
- 移动端：React Native + TypeScript
- 后端：Node.js + Koa + TypeScript
- 数据库：PostgreSQL
- AI：OpenAI GPT-4o
- 认证：JWT

## API 接口

### 认证
- POST /api/auth/register - 注册
- POST /api/auth/login - 登录
- GET /api/auth/profile - 获取用户信息

### 内容
- POST /api/content/generate - 生成内容
- GET /api/content/history - 获取历史记录

### 订单
- GET /api/order/packages - 获取充值套餐
- POST /api/order/recharge - 充值
- GET /api/order/transactions - 获取交易记录

## 数据模型
- users: 用户表
- content_records: 内容生成记录
- point_transactions: 积分变动记录
