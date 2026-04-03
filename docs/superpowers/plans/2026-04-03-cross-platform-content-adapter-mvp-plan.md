# 跨平台内容适配中台 - MVP 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 MVP：用户输入主题 → AI 生成单平台内容 → 预览并复制使用

**Architecture:** React Native App + Node.js/Koa 后端。App 负责主题输入和内容预览，后端负责 AI 内容生成和平台适配。初期 MVP 只需支持小红书一个平台的内容生成。

**Tech Stack:** React Native + TypeScript（移动端）, Node.js + Koa（后端）, PostgreSQL（数据）, Redis（缓存/限流）, GPT-4o API（AI 生成）

---

## 文件结构

```
/
├── backend/                          # Node.js 后端
│   ├── src/
│   │   ├── app.ts                    # Koa 应用入口
│   │   ├── routes/
│   │   │   ├── index.ts              # 路由汇总
│   │   │   └── content.ts            # 内容生成路由
│   │   ├── controllers/
│   │   │   └── contentController.ts  # 内容生成控制器
│   │   ├── services/
│   │   │   ├── aiService.ts          # AI 生成服务
│   │   │   └── adapterService.ts     # 平台适配服务
│   │   ├── prompts/
│   │   │   └── xiaohongshu.ts        # 小红书平台适配提示词
│   │   ├── models/
│   │   │   └── User.ts               # 用户模型（积分）
│   │   ├── middleware/
│   │   │   └── auth.ts               # 鉴权中间件
│   │   ├── db/
│   │   │   ├── index.ts              # 数据库连接
│   │   │   └── schema.sql            # 数据库表结构
│   │   └── types/
│   │       └── index.ts              # 类型定义
│   ├── package.json
│   └── tsconfig.json
│
├── mobile/                           # React Native 移动端
│   ├── App.tsx                       # 应用入口
│   ├── src/
│   │   ├── screens/
│   │   │   ├── HomeScreen.tsx        # 主题输入首页
│   │   │   ├── ResultScreen.tsx      # 内容预览页
│   │   │   └── ProfileScreen.tsx    # 个人中心/积分页
│   │   ├── components/
│   │   │   ├── TopicInput.tsx        # 主题输入组件
│   │   │   ├── PlatformSelector.tsx  # 平台选择组件
│   │   │   ├── ContentCard.tsx       # 内容展示卡片
│   │   │   └── LoadingOverlay.tsx    # 加载遮罩
│   │   ├── services/
│   │   │   └── api.ts                # API 请求服务
│   │   ├── store/
│   │   │   └── useAppStore.ts        # Zustand 状态管理
│   │   ├── types/
│   │   │   └── index.ts              # 类型定义
│   │   └── theme/
│   │       └── index.ts              # 主题样式
│   ├── package.json
│   └── tsconfig.json
│
├── SPEC.md                           # 设计规格文档
└── README.md                         # 项目说明
```

---

## Task 1: 后端项目初始化

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/src/app.ts`
- Create: `backend/src/db/schema.sql`
- Create: `backend/src/db/index.ts`
- Create: `backend/src/types/index.ts`

- [ ] **Step 1: 创建 backend 目录并初始化**

Run: `mkdir -p backend/src/{routes,controllers,services,prompts,models,middleware,db,types}`
Expected: 目录创建成功

- [ ] **Step 2: 创建 package.json**

```json
{
  "name": "content-bridge-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "ts-node-dev --respawn src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js"
  },
  "dependencies": {
    "koa": "^2.15.0",
    "koa-router": "^12.0.1",
    "koa-bodyparser": "^4.4.1",
    "koa-cors": "^0.0.16",
    "pg": "^8.11.3",
    "ioredis": "^5.3.2",
    "openai": "^4.28.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/koa": "^2.15.0",
    "@types/koa-router": "^7.4.8",
    "@types/koa-bodyparser": "^4.3.12",
    "@types/koa__cors": "^5.0.0",
    "@types/pg": "^8.11.0",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/bcryptjs": "^2.4.6",
    "typescript": "^5.3.3",
    "ts-node-dev": "^2.0.0"
  }
}
```

- [ ] **Step 3: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: 创建数据库 schema**

```sql
-- 用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(50) DEFAULT '',
    points INTEGER DEFAULT 50,  -- 注册赠送50积分
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 内容生成记录表
CREATE TABLE content_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    topic VARCHAR(500) NOT NULL,
    platform VARCHAR(50) NOT NULL,  -- xiaohongshu/douyin/wechat/etc
    generated_content JSONB NOT NULL,
    points_cost INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 积分充值记录表
CREATE TABLE point_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount INTEGER NOT NULL,  -- 正数=充值, 负数=消费
    type VARCHAR(20) NOT NULL,  -- recharge/consume/bonus
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

- [ ] **Step 5: 创建类型定义**

```typescript
// 用户相关
export interface User {
  id: number;
  phone: string;
  nickname: string;
  points: number;
  created_at: Date;
}

// 内容生成请求
export interface GenerateContentRequest {
  topic: string;
  platform: 'xiaohongshu' | 'douyin' | 'wechat' | 'bili' | 'weibo';
  extraInfo?: string;
}

// AI 生成的内容结构
export interface GeneratedContent {
  title: string;       // 标题
  body: string;        // 正文内容
  tags: string[];      // 推荐标签
  suggestions: string; // 优化建议
}

// 平台适配后的内容
export interface AdaptedContent extends GeneratedContent {
  platform: string;
  adaptedAt: Date;
}

// API 通用响应
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}
```

- [ ] **Step 6: 创建数据库连接模块**

```typescript
import { Pool } from 'pg';

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'content_bridge',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}
```

- [ ] **Step 7: 创建 Koa 应用入口**

```typescript
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from 'koa-cors';
import router from './routes';

const app = new Koa();

// 中间件
app.use(cors());
app.use(bodyParser());

// 路由
app.use(router.routes());
app.use(router.allowedMethods());

// 错误处理
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err: any) {
    ctx.status = err.status || 500;
    ctx.body = {
      code: ctx.status,
      message: err.message || 'Internal server error',
    };
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
```

- [ ] **Step 8: 提交代码**

```bash
cd backend && npm install
git add -A
git commit -m "feat: backend project initialization with Koa, PostgreSQL, TypeScript"
```

---

## Task 2: 后端 - 用户认证与积分系统

**Files:**
- Create: `backend/src/middleware/auth.ts`
- Create: `backend/src/routes/auth.ts`
- Create: `backend/src/controllers/authController.ts`
- Modify: `backend/src/routes/index.ts`

- [ ] **Step 1: 创建鉴权中间件**

```typescript
import { Context, Next } from 'koa';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthPayload {
  userId: number;
  phone: string;
}

export async function authMiddleware(ctx: Context, next: Next) {
  const authHeader = ctx.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    ctx.status = 401;
    ctx.body = { code: 401, message: '未授权，请先登录' };
    return;
  }

  const token = authHeader.substring(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    ctx.state.user = payload;
    await next();
  } catch (err) {
    ctx.status = 401;
    ctx.body = { code: 401, message: 'Token 无效或已过期' };
  }
}

export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
```

- [ ] **Step 2: 创建 auth 控制器**

```typescript
import { Context } from 'koa';
import bcrypt from 'bcryptjs';
import { query } from '../db';
import { generateToken } from '../middleware/auth';

export class AuthController {
  // 用户注册
  async register(ctx: Context) {
    const { phone, password, nickname } = ctx.request.body as any;

    if (!phone || !password) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '手机号和密码不能为空' };
      return;
    }

    // 检查手机号是否已注册
    const existing = await query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (existing.length > 0) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '该手机号已注册' };
      return;
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户，初始积分 50
    const result = await query(
      `INSERT INTO users (phone, password, nickname, points)
       VALUES ($1, $2, $3, 50) RETURNING id, phone, nickname, points`,
      [phone, hashedPassword, nickname || '']
    );

    const user = result[0];
    const token = generateToken({ userId: user.id, phone: user.phone });

    ctx.body = {
      code: 0,
      message: '注册成功',
      data: { token, user: { id: user.id, phone: user.phone, nickname: user.nickname, points: user.points } },
    };
  }

  // 用户登录
  async login(ctx: Context) {
    const { phone, password } = ctx.request.body as any;

    if (!phone || !password) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '手机号和密码不能为空' };
      return;
    }

    const users = await query('SELECT * FROM users WHERE phone = $1', [phone]);
    if (users.length === 0) {
      ctx.status = 401;
      ctx.body = { code: 401, message: '手机号或密码错误' };
      return;
    }

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      ctx.status = 401;
      ctx.body = { code: 401, message: '手机号或密码错误' };
      return;
    }

    const token = generateToken({ userId: user.id, phone: user.phone });

    ctx.body = {
      code: 0,
      message: '登录成功',
      data: { token, user: { id: user.id, phone: user.phone, nickname: user.nickname, points: user.points } },
    };
  }

  // 获取当前用户信息
  async getProfile(ctx: Context) {
    const userId = ctx.state.user.userId;
    const users = await query('SELECT id, phone, nickname, points, created_at FROM users WHERE id = $1', [userId]);
    
    if (users.length === 0) {
      ctx.status = 404;
      ctx.body = { code: 404, message: '用户不存在' };
      return;
    }

    ctx.body = { code: 0, message: 'success', data: users[0] };
  }
}

export const authController = new AuthController();
```

- [ ] **Step 3: 创建 auth 路由**

```typescript
import Router from 'koa-router';
import { authController } from '../controllers/authController';

const router = new Router({ prefix: '/api/auth' });

router.post('/register', async (ctx) => authController.register(ctx));
router.post('/login', async (ctx) => authController.login(ctx));
router.get('/profile', async (ctx) => authController.getProfile(ctx));

export default router;
```

- [ ] **Step 4: 修改路由汇总文件**

```typescript
import Router from 'koa-router';
import authRouter from './auth';
import contentRouter from './content';

const router = new Router();

router.use(authRouter.routes());
router.use(contentRouter.routes());

export default router;
```

- [ ] **Step 5: 提交代码**

```bash
git add -A
git commit -m "feat: add user auth system with JWT and points"
```

---

## Task 3: 后端 - AI 内容生成服务

**Files:**
- Create: `backend/src/services/aiService.ts`
- Create: `backend/src/prompts/xiaohongshu.ts`
- Create: `backend/src/services/adapterService.ts`
- Create: `backend/src/controllers/contentController.ts`
- Create: `backend/src/routes/content.ts`

- [ ] **Step 1: 创建小红书平台提示词**

```typescript
export const XIAOHONGSHU_SYSTEM_PROMPT = `你是一位专业的小红书内容创作者，擅长撰写爆款图文笔记。

## 你的任务
根据用户给定的主题，生成一套完整的小红书内容。

## 内容要求
1. **标题**：吸引眼球，引发好奇，包含关键词，15-30字
2. **正文**：分段清晰，每段不超过3行，适当使用 emoji 增加可读性
3. **标签**：推荐5-8个标签，包括热门标签和垂直标签
4. **建议**：给出内容优化建议，如发布时间、互动引导等

## 风格特点
- 亲切、口语化，像朋友分享
- 干货与情感结合
- 善用 emoji（但不要过度）
- 开头要有钩子，吸引继续阅读
- 结尾要有互动引导（评论、点赞、收藏）

## 输出格式（JSON）
{
  "title": "标题内容",
  "body": "正文内容（多段落，用换行分隔）",
  "tags": ["标签1", "标签2", "标签3"],
  "suggestions": "优化建议"
}`;

export function buildXiaoHongShuPrompt(topic: string, extraInfo?: string): string {
  let prompt = `请为以下主题生成小红书内容：\n\n主题：${topic}`;
  if (extraInfo) {
    prompt += `\n\n补充信息：${extraInfo}`;
  }
  prompt += '\n\n请严格按照 JSON 格式输出，包含 title、body、tags、suggestions 四个字段。';
  return prompt;
}
```

- [ ] **Step 2: 创建 AI 服务**

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AIResponse {
  title: string;
  body: string;
  tags: string[];
  suggestions: string;
}

export async function generateContent(prompt: string): Promise<AIResponse> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: '你是一个专业的内容创作助手，只输出 JSON，不要有其他文字。' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.8,
    max_tokens: 2000,
  });

  const content = completion.choices[0]?.message?.content || '{}';

  // 尝试解析 JSON，可能包含在 markdown 代码块中
  let jsonStr = content;
  const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  try {
    const parsed = JSON.parse(jsonStr) as AIResponse;
    return {
      title: parsed.title || '',
      body: parsed.body || '',
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      suggestions: parsed.suggestions || '',
    };
  } catch (err) {
    console.error('Failed to parse AI response:', content);
    throw new Error('AI 内容生成失败，请稍后重试');
  }
}
```

- [ ] **Step 3: 创建平台适配服务**

```typescript
import { AIResponse } from './aiService';

// 各平台适配提示词
const ADAPTER_PROMPTS = {
  xiaohongshu: (content: AIResponse) => `
请将以下内容优化为小红书风格：

标题：${content.title}
正文：${content.body}
标签：${content.tags.join(', ')}

要求：
- 标题添加 emoji，使其更吸引人
- 正文增加生活化表达，像朋友分享
- 添加合适的 emoji
- 调整标签顺序，热门标签放前面
- 保持内容核心不变

输出 JSON：{ "title": "...", "body": "...", "tags": [...] }
`,
};

export async function adaptContent(
  content: AIResponse,
  platform: 'xiaohongshu' | 'douyin' | 'wechat' | 'bili' | 'weibo'
): Promise<AIResponse> {
  // 暂时只实现小红书适配，其他平台返回原内容
  if (platform !== 'xiaohongshu') {
    return content;
  }

  const adapterPrompt = ADAPTER_PROMPTS[platform](content);

  // 调用 AI 进行适配（这里复用 aiService，但用不同的 prompt）
  const { generateContent } = await import('./aiService');
  return generateContent(adapterPrompt);
}
```

- [ ] **Step 4: 创建内容控制器**

```typescript
import { Context } from 'koa';
import { query } from '../db';
import { generateContent } from '../services/aiService';
import { adaptContent } from '../services/adapterService';
import { buildXiaoHongShuPrompt, XIAOHONGSHU_SYSTEM_PROMPT } from '../prompts/xiaohongshu';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const POINTS_COST = 5; // 每次生成消耗 5 积分

export class ContentController {
  // 生成内容
  async generate(ctx: Context) {
    const userId = ctx.state.user.userId;
    const { topic, platform = 'xiaohongshu', extraInfo } = ctx.request.body as any;

    if (!topic) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '主题不能为空' };
      return;
    }

    // 检查用户积分
    const users = await query('SELECT points FROM users WHERE id = $1', [userId]);
    if (users.length === 0 || users[0].points < POINTS_COST) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '积分不足，请先充值' };
      return;
    }

    try {
      // 构建提示词
      const systemPrompt = XIAOHONGSHU_SYSTEM_PROMPT;
      const userPrompt = buildXiaoHongShuPrompt(topic, extraInfo);

      // 调用 AI
      const content = await this.callAI(systemPrompt, userPrompt);

      // 平台适配
      const adaptedContent = await adaptContent(content, platform);

      // 扣除积分
      await query(
        'UPDATE users SET points = points - $1 WHERE id = $2',
        [POINTS_COST, userId]
      );

      // 记录生成历史
      await query(
        `INSERT INTO content_records (user_id, topic, platform, generated_content, points_cost)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, topic, platform, JSON.stringify(adaptedContent), POINTS_COST]
      );

      // 记录积分变动
      await query(
        `INSERT INTO point_transactions (user_id, amount, type, description)
         VALUES ($1, $2, 'consume', $3)`,
        [userId, -POINTS_COST, `生成${platform}内容: ${topic}`]
      );

      // 获取剩余积分
      const updatedUsers = await query('SELECT points FROM users WHERE id = $1', [userId]);

      ctx.body = {
        code: 0,
        message: '生成成功',
        data: {
          content: adaptedContent,
          pointsRemaining: updatedUsers[0].points,
        },
      };
    } catch (err: any) {
      console.error('Content generation error:', err);
      ctx.status = 500;
      ctx.body = { code: 500, message: err.message || '生成失败，请稍后重试' };
    }
  }

  // 获取生成历史
  async getHistory(ctx: Context) {
    const userId = ctx.state.user.userId;
    const { page = 1, pageSize = 20 } = ctx.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    const records = await query(
      `SELECT id, topic, platform, generated_content, points_cost, created_at
       FROM content_records
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, Number(pageSize), offset]
    );

    const totalResult = await query(
      'SELECT COUNT(*) as total FROM content_records WHERE user_id = $1',
      [userId]
    );

    ctx.body = {
      code: 0,
      message: 'success',
      data: {
        records,
        total: parseInt(totalResult[0].total),
        page: Number(page),
        pageSize: Number(pageSize),
      },
    };
  }

  // 调用 AI 的私有方法
  private async callAI(systemPrompt: string, userPrompt: string) {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content || '{}';

    // 解析 JSON
    let jsonStr = content;
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) jsonStr = jsonMatch[1];

    try {
      return JSON.parse(jsonStr);
    } catch {
      throw new Error('AI 响应格式错误');
    }
  }
}

export const contentController = new ContentController();
```

- [ ] **Step 5: 创建内容路由**

```typescript
import Router from 'koa-router';
import { authMiddleware } from '../middleware/auth';
import { contentController } from '../controllers/contentController';

const router = new Router({ prefix: '/api/content' });

// 所有内容接口需要登录
router.use(authMiddleware);

router.post('/generate', async (ctx) => contentController.generate(ctx));
router.get('/history', async (ctx) => contentController.getHistory(ctx));

export default router;
```

- [ ] **Step 6: 提交代码**

```bash
git add -A
git commit -m "feat: add AI content generation with platform adaptation"
```

---

## Task 4: 后端 - 积分充值与订单系统

**Files:**
- Create: `backend/src/controllers/orderController.ts`
- Create: `backend/src/routes/order.ts`
- Modify: `backend/src/routes/index.ts`

- [ ] **Step 1: 创建订单控制器**

```typescript
import { Context } from 'koa';
import { query } from '../db';

export class OrderController {
  // 获取积分套餐列表
  async getPackages(ctx: Context) {
    const packages = [
      { id: 'package_60', points: 60, price: 6, label: '60积分' },
      { id: 'package_300', points: 300, price: 28, label: '300积分（享92折）' },
      { id: 'package_600', points: 600, price: 50, label: '600积分（享83折）' },
      { id: 'package_1200', points: 1200, price: 90, label: '1200积分（享75折）' },
    ];

    ctx.body = { code: 0, message: 'success', data: packages };
  }

  // 模拟充值（实际项目中应接入支付渠道）
  async recharge(ctx: Context) {
    const userId = ctx.state.user.userId;
    const { packageId } = ctx.request.body as any;

    const packages: Record<string, { points: number; price: number }> = {
      package_60: { points: 60, price: 6 },
      package_300: { points: 300, price: 28 },
      package_600: { points: 600, price: 50 },
      package_1200: { points: 1200, price: 90 },
    };

    const pkg = packages[packageId];
    if (!pkg) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '无效的套餐' };
      return;
    }

    // 模拟支付成功，增加积分
    await query(
      'UPDATE users SET points = points + $1 WHERE id = $2',
      [pkg.points, userId]
    );

    // 记录充值
    await query(
      `INSERT INTO point_transactions (user_id, amount, type, description)
       VALUES ($1, $2, 'recharge', $3)`,
      [userId, pkg.points, `充值${pkg.points}积分`]
    );

    // 获取最新积分
    const users = await query('SELECT points FROM users WHERE id = $1', [userId]);

    ctx.body = {
      code: 0,
      message: '充值成功',
      data: { points: users[0].points },
    };
  }

  // 获取积分变动记录
  async getTransactions(ctx: Context) {
    const userId = ctx.state.user.userId;
    const { page = 1, pageSize = 20 } = ctx.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    const records = await query(
      `SELECT id, amount, type, description, created_at
       FROM point_transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, Number(pageSize), offset]
    );

    ctx.body = { code: 0, message: 'success', data: records };
  }
}

export const orderController = new OrderController();
```

- [ ] **Step 2: 创建订单路由**

```typescript
import Router from 'koa-router';
import { authMiddleware } from '../middleware/auth';
import { orderController } from '../controllers/orderController';

const router = new Router({ prefix: '/api/order' });

router.use(authMiddleware);

router.get('/packages', async (ctx) => orderController.getPackages(ctx));
router.post('/recharge', async (ctx) => orderController.recharge(ctx));
router.get('/transactions', async (ctx) => orderController.getTransactions(ctx));

export default router;
```

- [ ] **Step 3: 修改路由汇总文件，添加 order 路由**

```typescript
import Router from 'koa-router';
import authRouter from './auth';
import contentRouter from './content';
import orderRouter from './order';

const router = new Router();

router.use(authRouter.routes());
router.use(contentRouter.routes());
router.use(orderRouter.routes());

export default router;
```

- [ ] **Step 4: 提交代码**

```bash
git add -A
git commit -m "feat: add points recharge and order system"
```

---

## Task 5: 移动端项目初始化

**Files:**
- Create: `mobile/package.json`
- Create: `mobile/tsconfig.json`
- Create: `mobile/App.tsx`
- Create: `mobile/src/types/index.ts`
- Create: `mobile/src/theme/index.ts`
- Create: `mobile/src/store/useAppStore.ts`

- [ ] **Step 1: 创建 React Native 项目**

Run: `cd /home/yuan && npx @react-native-community/cli@latest init mobile --skip-install`
Expected: 项目创建成功

- [ ] **Step 2: 安装额外依赖**

Run: `cd mobile && npm install @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context zustand axios`
Expected: 依赖安装成功

- [ ] **Step 3: 创建类型定义**

```typescript
// 用户
export interface User {
  id: number;
  phone: string;
  nickname: string;
  points: number;
}

// 生成的内容
export interface GeneratedContent {
  title: string;
  body: string;
  tags: string[];
  suggestions: string;
}

// 平台选项
export type Platform = 'xiaohongshu' | 'douyin' | 'wechat' | 'bili' | 'weibo';

export interface PlatformOption {
  id: Platform;
  name: string;
  icon: string;
}

// 积分套餐
export interface Package {
  id: string;
  points: number;
  price: number;
  label: string;
}

// API 响应
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}
```

- [ ] **Step 4: 创建主题样式**

```typescript
export const colors = {
  primary: '#FF4757',      // 品牌红色
  secondary: '#5352ED',    // 辅助蓝
  background: '#F8F9FA',   // 背景灰
  card: '#FFFFFF',
  text: '#2D3436',
  textSecondary: '#636E72',
  border: '#DFE6E9',
  success: '#00B894',
  warning: '#FDCB6E',
  error: '#D63031',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
};
```

- [ ] **Step 5: 创建 Zustand store**

```typescript
import { create } from 'zustand';
import { User, GeneratedContent, Platform } from '../types';

interface AppState {
  // 用户
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;

  // 积分
  points: number;
  setPoints: (points: number) => void;

  // 当前生成的内容
  currentContent: GeneratedContent | null;
  setCurrentContent: (content: GeneratedContent | null) => void;

  // 选中的平台
  selectedPlatform: Platform;
  setSelectedPlatform: (platform: Platform) => void;

  // 登出
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  token: null,
  points: 0,

  setUser: (user) => set({ user, points: user?.points || 0 }),
  setToken: (token) => set({ token }),

  points: 0,
  setPoints: (points) => set({ points }),

  currentContent: null,
  setCurrentContent: (content) => set({ currentContent: content }),

  selectedPlatform: 'xiaohongshu',
  setSelectedPlatform: (platform) => set({ selectedPlatform: platform }),

  logout: () => set({ user: null, token: null, points: 0, currentContent: null }),
}));
```

- [ ] **Step 6: 创建 App.tsx**

```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import ResultScreen from './src/screens/ResultScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen';
import { colors } from './src/theme';
import { useAppStore } from './src/store/useAppStore';

const Stack = createNativeStackNavigator();

function App(): React.JSX.Element {
  const { token } = useAppStore();

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: '600' },
          }}
        >
          {token ? (
            <>
              <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{ title: '内容创作', headerShown: false }}
              />
              <Stack.Screen
                name="Result"
                component={ResultScreen}
                options={{ title: '生成结果' }}
              />
              <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ title: '个人中心' }}
              />
            </>
          ) : (
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ title: '登录' }}
            />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
```

- [ ] **Step 7: 提交代码**

```bash
git add -A
git commit -m "feat: mobile app initialization with React Navigation"
```

---

## Task 6: 移动端 - API 服务与登录页面

**Files:**
- Create: `mobile/src/services/api.ts`
- Create: `mobile/src/screens/LoginScreen.tsx`
- Modify: `mobile/App.tsx`

- [ ] **Step 1: 创建 API 服务**

```typescript
import axios, { AxiosInstance, AxiosError } from 'axios';
import { useAppStore } from '../store/useAppStore';
import { ApiResponse, User, GeneratedContent, Package } from '../types';

const BASE_URL = 'http://localhost:3000/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    // 请求拦截器：添加 token
    this.client.interceptors.request.use((config) => {
      const token = useAppStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // 响应拦截器：处理错误
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiResponse>) => {
        const message = error.response?.data?.message || error.message || '请求失败';
        return Promise.reject(new Error(message));
      }
    );
  }

  // Auth
  async login(phone: string, password: string) {
    const res = await this.client.post<ApiResponse<{ token: string; user: User }>>('/auth/login', {
      phone,
      password,
    });
    return res.data.data!;
  }

  async register(phone: string, password: string, nickname?: string) {
    const res = await this.client.post<ApiResponse<{ token: string; user: User }>>('/auth/register', {
      phone,
      password,
      nickname,
    });
    return res.data.data!;
  }

  async getProfile() {
    const res = await this.client.get<ApiResponse<User>>('/auth/profile');
    return res.data.data!;
  }

  // Content
  async generateContent(topic: string, platform: string, extraInfo?: string) {
    const res = await this.client.post<ApiResponse<{ content: GeneratedContent; pointsRemaining: number }>>(
      '/content/generate',
      { topic, platform, extraInfo }
    );
    return res.data.data!;
  }

  async getContentHistory(page = 1, pageSize = 20) {
    const res = await this.client.get<ApiResponse<any>>('/content/history', {
      params: { page, pageSize },
    });
    return res.data.data!;
  }

  // Order
  async getPackages() {
    const res = await this.client.get<ApiResponse<Package[]>>('/order/packages');
    return res.data.data!;
  }

  async recharge(packageId: string) {
    const res = await this.client.post<ApiResponse<{ points: number }>>('/order/recharge', { packageId });
    return res.data.data!;
  }

  async getTransactions() {
    const res = await this.client.get<ApiResponse<any[]>>('/order/transactions');
    return res.data.data!;
  }
}

export const api = new ApiService();
```

- [ ] **Step 2: 创建登录/注册页面**

```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { colors, spacing, fontSize, borderRadius } from '../theme';

type Props = NativeStackScreenProps<any, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);

  const { setUser, setToken } = useAppStore();

  const handleSubmit = async () => {
    if (!phone || !password) {
      Alert.alert('提示', '请填写手机号和密码');
      return;
    }

    setLoading(true);
    try {
      let data;
      if (isLogin) {
        data = await api.login(phone, password);
      } else {
        data = await api.register(phone, password, nickname || undefined);
      }
      setToken(data.token);
      setUser(data.user);
    } catch (err: any) {
      Alert.alert('错误', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>内容创作助手</Text>
          <Text style={styles.subtitle}>一键生成多平台内容</Text>
        </View>

        <View style={styles.form}>
          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="昵称（选填）"
              placeholderTextColor={colors.textSecondary}
              value={nickname}
              onChangeText={setNickname}
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="手机号"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <TextInput
            style={styles.input}
            placeholder="密码"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? '处理中...' : isLogin ? '登录' : '注册'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchButton} onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.switchText}>
              {isLogin ? '还没有账号？立即注册' : '已有账号？立即登录'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  header: { alignItems: 'center', marginBottom: spacing.xl * 2 },
  title: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.primary, marginBottom: spacing.sm },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary },
  form: { backgroundColor: colors.card, borderRadius: borderRadius.xl, padding: spacing.lg },
  input: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: { backgroundColor: colors.primary, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#FFF', fontSize: fontSize.md, fontWeight: '600' },
  switchButton: { marginTop: spacing.lg, alignItems: 'center' },
  switchText: { color: colors.secondary, fontSize: fontSize.sm },
});
```

- [ ] **Step 3: 提交代码**

```bash
git add -A
git commit -m "feat: add API service and login screen"
```

---

## Task 7: 移动端 - 首页与内容生成

**Files:**
- Create: `mobile/src/screens/HomeScreen.tsx`
- Create: `mobile/src/components/TopicInput.tsx`
- Create: `mobile/src/components/PlatformSelector.tsx`
- Create: `mobile/src/components/LoadingOverlay.tsx`

- [ ] **Step 1: 创建 TopicInput 组件**

```typescript
import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../theme';

interface Props {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
}

export default function TopicInput({ value, onChange, placeholder = '请输入内容主题，如：春日穿搭、618促销...' }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>内容主题</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        value={value}
        onChangeText={onChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  label: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
```

- [ ] **Step 2: 创建 PlatformSelector 组件**

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Platform, PlatformOption } from '../types';
import { colors, spacing, fontSize, borderRadius } from '../theme';

const PLATFORMS: PlatformOption[] = [
  { id: 'xiaohongshu', name: '小红书', icon: '📕' },
  { id: 'douyin', name: '抖音', icon: '🎵' },
  { id: 'wechat', name: '公众号', icon: '📧' },
  { id: 'bili', name: 'B站', icon: '📺' },
  { id: 'weibo', name: '微博', icon: '🌐' },
];

interface Props {
  selected: Platform;
  onSelect: (platform: Platform) => void;
}

export default function PlatformSelector({ selected, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>目标平台</Text>
      <View style={styles.grid}>
        {PLATFORMS.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[styles.item, selected === p.id && styles.itemSelected]}
            onPress={() => onSelect(p.id)}
          >
            <Text style={styles.icon}>{p.icon}</Text>
            <Text style={[styles.name, selected === p.id && styles.nameSelected]}>{p.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  label: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  item: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemSelected: { borderColor: colors.primary, backgroundColor: '#FFF5F5' },
  icon: { fontSize: fontSize.lg, marginRight: spacing.xs },
  name: { fontSize: fontSize.sm, color: colors.textSecondary },
  nameSelected: { color: colors.primary, fontWeight: '600' },
});
```

- [ ] **Step 3: 创建 LoadingOverlay 组件**

```typescript
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { colors, spacing, fontSize } from '../theme';

interface Props {
  visible: boolean;
  message?: string;
}

export default function LoadingOverlay({ visible, message = 'AI 创作中...' }: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.message}>{message}</Text>
          <Text style={styles.hint}>预计 10-30 秒</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  content: { backgroundColor: colors.card, borderRadius: 16, padding: spacing.xl, alignItems: 'center', minWidth: 200 },
  message: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, marginTop: spacing.md },
  hint: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
});
```

- [ ] **Step 4: 创建 HomeScreen**

```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import TopicInput from '../components/TopicInput';
import PlatformSelector from '../components/PlatformSelector';
import LoadingOverlay from '../components/LoadingOverlay';
import { colors, spacing, fontSize, borderRadius } from '../theme';

type Props = NativeStackScreenProps<any, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [topic, setTopic] = useState('');
  const [extraInfo, setExtraInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const { selectedPlatform, setSelectedPlatform, setCurrentContent, setPoints, points, token, user } = useAppStore();

  useEffect(() => {
    // 刷新用户信息
    if (token) {
      api.getProfile().then((u) => {
        useAppStore.getState().setUser(u);
        useAppStore.getState().setPoints(u.points);
      }).catch(() => {});
    }
  }, []);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      Alert.alert('提示', '请输入内容主题');
      return;
    }

    if (points < 5) {
      Alert.alert('积分不足', '您的积分不足，请先充值', [
        { text: '取消', style: 'cancel' },
        { text: '去充值', onPress: () => navigation.navigate('Profile') },
      ]);
      return;
    }

    setLoading(true);
    try {
      const result = await api.generateContent(topic.trim(), selectedPlatform, extraInfo.trim() || undefined);
      setCurrentContent(result.content);
      setPoints(result.pointsRemaining);
      navigation.navigate('Result');
    } catch (err: any) {
      Alert.alert('生成失败', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* 头部 */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>你好，{user?.nickname || '创作者'}</Text>
            <Text style={styles.subtitle}>今天想创作什么内容？</Text>
          </View>
          <TouchableOpacity style={styles.pointsBadge} onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.pointsIcon}>⚡</Text>
            <Text style={styles.pointsText}>{points} 积分</Text>
          </TouchableOpacity>
        </View>

        {/* 主题输入 */}
        <TopicInput value={topic} onChange={setTopic} />

        {/* 补充信息 */}
        <TopicInput
          value={extraInfo}
          onChange={setExtraInfo}
          placeholder="补充说明（选填）：如目标受众、风格偏好..."
        />

        {/* 平台选择 */}
        <PlatformSelector selected={selectedPlatform} onSelect={setSelectedPlatform} />

        {/* 生成按钮 */}
        <TouchableOpacity
          style={[styles.generateButton, !topic.trim() && styles.generateButtonDisabled]}
          onPress={handleGenerate}
          disabled={!topic.trim() || loading}
        >
          <Text style={styles.generateButtonText}>
            {loading ? '创作中...' : '✨ 立即生成'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.hint}>每次生成消耗 5 积分</Text>
      </ScrollView>

      <LoadingOverlay visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  greeting: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.xs },
  pointsBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.primary },
  pointsIcon: { fontSize: fontSize.sm },
  pointsText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.primary, marginLeft: spacing.xs },
  generateButton: { backgroundColor: colors.primary, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center', marginBottom: spacing.sm },
  generateButtonDisabled: { opacity: 0.5 },
  generateButtonText: { color: '#FFF', fontSize: fontSize.lg, fontWeight: '700' },
  hint: { textAlign: 'center', fontSize: fontSize.xs, color: colors.textSecondary, marginTop: spacing.sm },
});
```

- [ ] **Step 5: 提交代码**

```bash
git add -A
git commit -m "feat: add home screen with topic input and platform selector"
```

---

## Task 8: 移动端 - 结果预览与复制

**Files:**
- Create: `mobile/src/screens/ResultScreen.tsx`
- Create: `mobile/src/components/ContentCard.tsx`

- [ ] **Step 1: 创建 ContentCard 组件**

```typescript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { GeneratedContent } from '../types';
import { colors, spacing, fontSize, borderRadius } from '../theme';

interface Props {
  content: GeneratedContent;
}

export default function ContentCard({ content }: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    Clipboard.setString(text);
    setCopied(label);
    Alert.alert('复制成功', `${label}已复制到剪贴板`);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <View style={styles.container}>
      {/* 标题 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>标题</Text>
          <TouchableOpacity onPress={() => handleCopy(content.title, '标题')}>
            <Text style={styles.copyButton}>{copied === '标题' ? '✓ 已复制' : '📋 复制'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>{content.title}</Text>
      </View>

      {/* 正文 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>正文</Text>
          <TouchableOpacity onPress={() => handleCopy(content.body, '正文')}>
            <Text style={styles.copyButton}>{copied === '正文' ? '✓ 已复制' : '📋 复制'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.body}>{content.body}</Text>
      </View>

      {/* 标签 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>推荐标签</Text>
          <TouchableOpacity onPress={() => handleCopy(content.tags.join(' '), '标签')}>
            <Text style={styles.copyButton}>{copied === '标签' ? '✓ 已复制' : '📋 复制'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.tags}>
          {content.tags.map((tag, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 建议 */}
      {content.suggestions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>优化建议</Text>
          <View style={styles.suggestionsBox}>
            <Text style={styles.suggestions}>{content.suggestions}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.card, borderRadius: borderRadius.xl, padding: spacing.lg },
  section: { marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' },
  copyButton: { fontSize: fontSize.sm, color: colors.primary },
  title: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, lineHeight: 28 },
  body: { fontSize: fontSize.md, color: colors.text, lineHeight: 24 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: { backgroundColor: '#FFF0F0', paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: borderRadius.full },
  tagText: { fontSize: fontSize.sm, color: colors.primary },
  suggestionsBox: { backgroundColor: '#F8F9FA', borderRadius: borderRadius.md, padding: spacing.md },
  suggestions: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20 },
});
```

- [ ] **Step 2: 创建 ResultScreen**

```typescript
import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '../store/useAppStore';
import ContentCard from '../components/ContentCard';
import { colors, spacing, fontSize, borderRadius } from '../theme';

type Props = NativeStackScreenProps<any, 'Result'>;

export default function ResultScreen({ navigation }: Props) {
  const { currentContent } = useAppStore();

  if (!currentContent) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>暂无生成内容</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>去创作</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <ContentCard content={currentContent} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.primaryButtonText}>继续创作</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  emptyText: { fontSize: fontSize.md, color: colors.textSecondary, marginBottom: spacing.lg },
  backButton: { backgroundColor: colors.primary, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: borderRadius.md },
  backButtonText: { color: '#FFF', fontSize: fontSize.md, fontWeight: '600' },
  footer: { padding: spacing.lg, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
  primaryButton: { backgroundColor: colors.primary, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center' },
  primaryButtonText: { color: '#FFF', fontSize: fontSize.md, fontWeight: '700' },
});
```

- [ ] **Step 3: 安装剪贴板依赖**

Run: `cd mobile && npm install @react-native-clipboard/clipboard`
Expected: 安装成功

- [ ] **Step 4: 提交代码**

```bash
git add -A
git commit -m "feat: add result screen with content card and copy functionality"
```

---

## Task 9: 移动端 - 个人中心与充值

**Files:**
- Create: `mobile/src/screens/ProfileScreen.tsx`

- [ ] **Step 1: 创建 ProfileScreen**

```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { Package } from '../types';
import { colors, spacing, fontSize, borderRadius } from '../theme';

type Props = NativeStackScreenProps<any, 'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
  const { user, points, setPoints, logout } = useAppStore();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pkgs, txs] = await Promise.all([
        api.getPackages(),
        api.getTransactions(),
      ]);
      setPackages(pkgs);
      setHistory(txs.slice(0, 10));
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const handleRecharge = async (pkg: Package) => {
    Alert.alert(
      '确认充值',
      `确定充值 ${pkg.label}，支付 ¥${pkg.price}？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await api.recharge(pkg.id);
              setPoints(result.points);
              Alert.alert('充值成功', `当前积分：${result.points}`);
              loadData();
            } catch (err: any) {
              Alert.alert('充值失败', err.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('确认退出', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      { text: '确认', onPress: () => logout() },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 用户信息 */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.nickname || user?.phone || 'U')[0].toUpperCase()}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.nickname}>{user?.nickname || '用户'}</Text>
          <Text style={styles.phone}>{user?.phone}</Text>
        </View>
        <View style={styles.pointsBox}>
          <Text style={styles.pointsValue}>{points}</Text>
          <Text style={styles.pointsLabel}>积分</Text>
        </View>
      </View>

      {/* 充值套餐 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>充值积分</Text>
        <View style={styles.packageGrid}>
          {packages.map((pkg) => (
            <TouchableOpacity
              key={pkg.id}
              style={styles.packageItem}
              onPress={() => handleRecharge(pkg)}
              disabled={loading}
            >
              <Text style={styles.packagePoints}>{pkg.points}积分</Text>
              <Text style={styles.packagePrice}>¥{pkg.price}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 积分记录 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>最近记录</Text>
        {history.length === 0 ? (
          <Text style={styles.emptyText}>暂无记录</Text>
        ) : (
          history.map((item, i) => (
            <View key={i} style={styles.recordItem}>
              <View>
                <Text style={styles.recordDesc}>{item.description}</Text>
                <Text style={styles.recordDate}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Text style={[styles.recordAmount, item.amount < 0 && styles.recordExpense]}>
                {item.amount > 0 ? '+' : ''}{item.amount}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* 退出登录 */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>退出登录</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.lg },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 24, fontWeight: '700', color: '#FFF' },
  userInfo: { flex: 1, marginLeft: spacing.md },
  nickname: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  phone: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  pointsBox: { backgroundColor: '#FFF5F5', borderRadius: borderRadius.lg, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, alignItems: 'center' },
  pointsValue: { fontSize: fontSize.xl, fontWeight: '700', color: colors.primary },
  pointsLabel: { fontSize: fontSize.xs, color: colors.textSecondary },
  section: { backgroundColor: colors.card, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.lg },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  packageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  packageItem: { width: '48%', backgroundColor: colors.background, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  packagePoints: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  packagePrice: { fontSize: fontSize.md, color: colors.primary, marginTop: spacing.xs },
  emptyText: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', padding: spacing.lg },
  recordItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  recordDesc: { fontSize: fontSize.sm, color: colors.text },
  recordDate: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: spacing.xs },
  recordAmount: { fontSize: fontSize.md, fontWeight: '700', color: colors.success },
  recordExpense: { color: colors.textSecondary },
  logoutButton: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.error },
  logoutText: { fontSize: fontSize.md, color: colors.error, fontWeight: '600' },
});
```

- [ ] **Step 2: 提交代码**

```bash
git add -A
git commit -m "feat: add profile screen with recharge and history"
```

---

## Task 10: 项目配置与部署准备

**Files:**
- Create: `SPEC.md`
- Create: `README.md`
- Create: `.env.example`
- Create: `docker-compose.yml`（可选，用于本地开发）

- [ ] **Step 1: 创建 SPEC.md（规格文档）**

```markdown
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
```

- [ ] **Step 2: 创建 README.md**

```markdown
# ContentBridge - 跨平台内容适配中台

一款帮助个人创作者快速生成多平台适配内容的 AI 工具。

## 功能特性

- 输入主题，AI 自动生成内容
- 深度适配各平台风格（小红书、抖音、公众号等）
- 积分制按需付费
- 一键复制，即刻使用

## 快速开始

### 后端

\`\`\`bash
cd backend
cp .env.example .env  # 配置环境变量
npm install
npm run dev
\`\`\`

### 移动端

\`\`\`bash
cd mobile
npm install
npx react-native run-android  # Android
# 或
npx react-native run-ios  # iOS
\`\`\`

### 环境变量

\`\`\`env
# Backend .env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=content_bridge
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your-secret-key
OPENAI_API_KEY=your-openai-api-key
\`\`\`

## 技术栈

- React Native + TypeScript
- Node.js + Koa + TypeScript
- PostgreSQL + Redis
- OpenAI GPT-4o
```

- [ ] **Step 3: 创建 .env.example**

```env
# Server
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=content_bridge
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=change-this-to-a-random-string

# OpenAI
OPENAI_API_KEY=sk-your-api-key
```

- [ ] **Step 4: 创建 docker-compose.yml（可选）**

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: content_bridge
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - '6379:6379'

volumes:
  postgres_data:
```

- [ ] **Step 5: 提交代码**

```bash
git add -A
git commit -m "docs: add SPEC.md, README.md and configuration files"
```

---

## 实施计划总结

| 任务 | 内容 | 预估时间 |
|------|------|---------|
| Task 1 | 后端项目初始化 | 30 分钟 |
| Task 2 | 用户认证与积分系统 | 45 分钟 |
| Task 3 | AI 内容生成服务 | 60 分钟 |
| Task 4 | 积分充值与订单系统 | 30 分钟 |
| Task 5 | 移动端项目初始化 | 30 分钟 |
| Task 6 | API 服务与登录页面 | 45 分钟 |
| Task 7 | 首页与内容生成 | 45 分钟 |
| Task 8 | 结果预览与复制 | 30 分钟 |
| Task 9 | 个人中心与充值 | 30 分钟 |
| Task 10 | 项目配置与部署准备 | 15 分钟 |

**MVP 总预估时间：5-6 小时**

---

**执行完成后，验证清单：**
- [ ] 后端 API 所有接口可正常调用
- [ ] 移动端可正常注册登录
- [ ] 可成功调用 AI 生成内容
- [ ] 积分系统正常工作
- [ ] 可正常预览和复制内容
