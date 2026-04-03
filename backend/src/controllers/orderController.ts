import { Context } from 'koa';
import { query } from '../db';

export class OrderController {
  async getPackages(ctx: Context) {
    const packages = [
      { id: 'package_60', points: 60, price: 6, label: '60积分' },
      { id: 'package_300', points: 300, price: 28, label: '300积分（享92折）' },
      { id: 'package_600', points: 600, price: 50, label: '600积分（享83折）' },
      { id: 'package_1200', points: 1200, price: 90, label: '1200积分（享75折）' },
    ];

    ctx.body = { code: 0, message: 'success', data: packages };
  }

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

    await query(
      'UPDATE users SET points = points + $1 WHERE id = $2',
      [pkg.points, userId]
    );

    await query(
      `INSERT INTO point_transactions (user_id, amount, type, description)
       VALUES ($1, $2, 'recharge', $3)`,
      [userId, pkg.points, `充值${pkg.points}积分`]
    );

    const users = await query('SELECT points FROM users WHERE id = $1', [userId]);

    ctx.body = {
      code: 0,
      message: '充值成功',
      data: { points: users[0].points },
    };
  }

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
