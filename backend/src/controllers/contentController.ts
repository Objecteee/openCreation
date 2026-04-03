import { Context } from 'koa';
import { query } from '../db';
import { generateContent } from '../services/aiService';
import { adaptContent } from '../services/adapterService';
import { buildXiaoHongShuPrompt, XIAOHONGSHU_SYSTEM_PROMPT } from '../prompts/xiaohongshu';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

    const users = await query('SELECT points FROM users WHERE id = $1', [userId]);
    if (users.length === 0 || users[0].points < POINTS_COST) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '积分不足，请先充值' };
      return;
    }

    try {
      const systemPrompt = XIAOHONGSHU_SYSTEM_PROMPT;
      const userPrompt = buildXiaoHongShuPrompt(topic, extraInfo);

      const content = await this.callAI(systemPrompt, userPrompt);
      const adaptedContent = await adaptContent(content, platform);

      await query(
        'UPDATE users SET points = points - $1 WHERE id = $2',
        [POINTS_COST, userId]
      );

      await query(
        `INSERT INTO content_records (user_id, topic, platform, generated_content, points_cost)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, topic, platform, JSON.stringify(adaptedContent), POINTS_COST]
      );

      await query(
        `INSERT INTO point_transactions (user_id, amount, type, description)
         VALUES ($1, $2, 'consume', $3)`,
        [userId, -POINTS_COST, `生成${platform}内容: ${topic}`]
      );

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
