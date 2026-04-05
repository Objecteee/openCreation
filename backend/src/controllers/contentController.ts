import { Context } from 'koa';
import { query } from '../db';
import { generateContent } from '../services/aiService';
import { adaptContent } from '../services/adapterService';
import { buildXiaoHongShuPrompt, XIAOHONGSHU_SYSTEM_PROMPT } from '../prompts/xiaohongshu';

const POINTS_COST = 5;

export class ContentController {
  async generate(ctx: Context) {
    const userId = ctx.state.user.userId;
    const { topic, platform = 'xiaohongshu', extraInfo } = ctx.request.body as any;

    if (!topic) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '主题不能为空' };
      return;
    }

    // Check points first
    const users = query('SELECT points FROM users WHERE id = ?', [userId]);
    if (users.length === 0 || users[0].points < POINTS_COST) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '积分不足，请先充值' };
      return;
    }

    try {
      const systemPrompt = XIAOHONGSHU_SYSTEM_PROMPT;
      const userPrompt = buildXiaoHongShuPrompt(topic, extraInfo);

      const content = await generateContent(userPrompt);
      const adaptedContent = await adaptContent(content, platform);

      // Atomic update with check
      const updateResult = query(
        `UPDATE users SET points = points - ? WHERE id = ? AND points >= ?`,
        [POINTS_COST, userId, POINTS_COST]
      );

      if ((updateResult[0] as any)?.changes === 0) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '积分不足，请先充值' };
        return;
      }

      // Get updated points
      const updatedUsers = query('SELECT points FROM users WHERE id = ?', [userId]);
      const newPoints = updatedUsers[0]?.points || 0;

      query(
        `INSERT INTO content_records (user_id, topic, platform, generated_content, points_cost)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, topic, platform, JSON.stringify(adaptedContent), POINTS_COST]
      );

      query(
        `INSERT INTO point_transactions (user_id, amount, type, description)
         VALUES (?, ?, 'consume', ?)`,
        [userId, -POINTS_COST, `生成${platform}内容: ${topic}`]
      );

      ctx.body = {
        code: 0,
        message: '生成成功',
        data: {
          content: adaptedContent,
          pointsRemaining: newPoints,
        },
      };
    } catch (err: any) {
      console.error('Content generation error:', err);
      ctx.status = 500;
      ctx.body = { code: 500, message: err.message || '生成失败，请稍后重试' };
    }
  }

  async getHistory(ctx: Context) {
    const userId = ctx.state.user.userId;
    const page = parseInt(ctx.query.page as string) || 1;
    const pageSize = parseInt(ctx.query.pageSize as string) || 20;
    const offset = (page - 1) * pageSize;

    const records = query(
      `SELECT id, topic, platform, generated_content, points_cost, created_at
       FROM content_records
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, pageSize, offset]
    );

    const totalResult = query(
      'SELECT COUNT(*) as total FROM content_records WHERE user_id = ?',
      [userId]
    );

    ctx.body = {
      code: 0,
      message: 'success',
      data: {
        records,
        total: parseInt(totalResult[0]?.total || '0'),
        page,
        pageSize,
      },
    };
  }
}

export const contentController = new ContentController();
